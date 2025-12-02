import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { getToolsForLLM, executeTool, type ToolResult, type ToolContext } from './tools/index.ts'
import { getCachedResult, setCachedResult, isCacheable } from './tools/cache.ts'

// ============================================
// Configuration
// ============================================

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')!
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Model configuration with fallbacks (P1)
// Primary: Groq Qwen3 32B - Best for Malaysian rojak (119 languages, trained on 100B SEA tokens)
// Fallbacks: OpenRouter models if Groq fails
const MODELS = {
  primary: 'qwen/qwen3-32b',  // Groq - $0.29/M input, $0.59/M output, 119+ languages
  fallback1: 'llama-3.3-70b-versatile',  // Groq fallback - fast and capable
  fallback2: 'x-ai/grok-4.1-fast',  // OpenRouter fallback
}

// API configuration
const API_CONFIG = {
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    models: ['qwen/qwen3-32b', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
  },
  openrouter: {
    url: 'https://openrouter.ai/api/v1/chat/completions',
    models: ['x-ai/grok-4.1-fast', 'anthropic/claude-3.5-sonnet', 'openai/gpt-4o'],
  },
}

// Rate limiting configuration (P0)
const RATE_LIMITS = {
  maxRequestsPerMinute: 20,
  maxRequestsPerHour: 100,
  maxTokensPerDay: 500000,
}

// Context window configuration (P1)
const CONTEXT_CONFIG = {
  maxHistoryMessages: 20,
  maxTokensPerMessage: 4000,
  summarizeAfterMessages: 15,
}

// ============================================
// Language Detection (Server-side)
// ============================================

type DetectedLanguage = 'chinese' | 'malay' | 'english'

// Known action commands from button clicks (these are internal, not user language)
const ACTION_COMMANDS = [
  'get_projects', 'get_project_details', 'create_project',
  'find_candidates', 'get_candidate_details',
  'assign_staff', 'get_project_staff', 'update_staff_status',
  'get_project_stats', 'get_upcoming_deadlines',
  'get_expense_claims', 'get_pending_approvals', 'approve_expense_claim', 'reject_expense_claim',
  'execute_sql', 'save_user_memory'
]

/**
 * Check if text is an action command (from button click)
 */
function isActionCommand(text: string): boolean {
  const trimmed = text.trim().toLowerCase()
  // Check if it's a known action command or looks like one (snake_case, short)
  if (ACTION_COMMANDS.includes(trimmed)) return true
  // Check for snake_case pattern with no spaces (likely an action)
  if (/^[a-z_]+$/.test(trimmed) && trimmed.includes('_') && trimmed.length < 30) return true
  return false
}

/**
 * Detect the primary language of user input
 * Returns: 'chinese' | 'malay' | 'english'
 */
function detectLanguage(text: string): DetectedLanguage {
  // Check for Chinese characters (CJK Unified Ideographs)
  const chineseRegex = /[\u4e00-\u9fff\u3400-\u4dbf]/
  if (chineseRegex.test(text)) {
    return 'chinese'
  }

  // Check for Malay/Malaysian rojak indicators
  const malayWords = [
    // Common particles
    'lah', 'lor', 'meh', 'leh', 'kan', 'hor', 'wei', 'woi',
    // Common Malay words
    'nak', 'tak', 'boleh', 'saya', 'kami', 'kita', 'awak', 'mereka',
    'ada', 'mana', 'bila', 'kenapa', 'macam', 'mane', 'camne', 'cemana',
    'tolong', 'tengok', 'tunjuk', 'buat', 'ambil', 'cari', 'letak',
    // Rojak exclamations
    'aiyo', 'alamak', 'walao', 'wah', 'siao', 'jialat',
    // Common slang
    'boss', 'settle', 'kautim', 'cincai', 'tapau', 'lepak', 'gostan',
    'syok', 'mantap', 'terror', 'gempak', 'power',
    // Question particles
    'ke', 'kah'
  ]

  const lowerText = text.toLowerCase()
  const words = lowerText.split(/\s+/)

  // Check if any Malay words exist in the text
  for (const word of words) {
    // Remove punctuation for matching
    const cleanWord = word.replace(/[.,!?;:'"]/g, '')
    if (malayWords.includes(cleanWord)) {
      return 'malay'
    }
  }

  // Check for Malay sentence patterns
  const malayPatterns = [
    /\b(apa|siapa|mana|bila|berapa|bagaimana)\b/i,  // Question words
    /\b(dan|atau|tetapi|tapi|dengan|untuk|kepada)\b/i,  // Conjunctions
    /\b(ini|itu|sini|situ|di|ke|dari)\b/i,  // Demonstratives/prepositions
    /\b(sudah|sedang|akan|telah|belum)\b/i,  // Aspect markers
    /\b(yang|punya|nya)\b/i,  // Relative/possessive
  ]

  for (const pattern of malayPatterns) {
    if (pattern.test(lowerText)) {
      return 'malay'
    }
  }

  // Default to English
  return 'english'
}

/**
 * Check if text contains Chinese characters
 */
function containsChinese(text: string): boolean {
  return /[\u4e00-\u9fff\u3400-\u4dbf]/.test(text)
}

/**
 * Detect language with conversation context
 * If current message is an action command, look at history to find user's language
 * Also checks assistant responses for Chinese content
 */
function detectLanguageWithHistory(currentMessage: string, history: Array<{role: string, content: string}>): DetectedLanguage {
  const isAction = isActionCommand(currentMessage)
  console.log(`🔍 Language detection - message: "${currentMessage}", isAction: ${isAction}, historyLen: ${history.length}`)

  // If current message is NOT an action command, detect from it directly
  if (!isAction) {
    return detectLanguage(currentMessage)
  }

  // Log history for debugging
  console.log(`🔍 History contents: ${JSON.stringify(history.map(h => ({ role: h.role, preview: h.content.substring(0, 40) })))}`)

  // Current message is an action command - look at conversation history
  // Strategy 1: Find the most recent user message that's not an action command
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i]
    if (msg.role === 'user' && !isActionCommand(msg.content)) {
      const lang = detectLanguage(msg.content)
      console.log(`🌐 Found user language from history: ${lang} from "${msg.content.substring(0, 30)}..."`)
      return lang
    }
  }

  // Strategy 2: Check if any assistant response contains Chinese (means conversation was in Chinese)
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i]
    if (msg.role === 'assistant' && containsChinese(msg.content)) {
      console.log(`🌐 Found Chinese in assistant response, using Chinese`)
      return 'chinese'
    }
  }

  console.log(`⚠️ No valid language found in history, defaulting to English`)
  return 'english'
}

/**
 * Get language instruction block for system prompt
 */
function getLanguageInstruction(detectedLang: DetectedLanguage): string {
  switch (detectedLang) {
    case 'chinese':
      return `
**🚨 用户语言：中文 - 必须用中文回复！**
用户正在使用中文。你必须：
- 用100%中文回复
- 不要用英文或马来文
- 按钮标签也要用中文

中文回复模板：
- 成功：好的，让我帮你查一下...
- 无数据：目前没有相关数据。你想要...
- 错误：抱歉，系统出现问题。请稍后再试。
- 建议：你可以试试：1. ... 2. ... 3. ...
`
    case 'malay':
      return `
**🚨 USER LANGUAGE: MALAYSIAN ROJAK - Reply in rojak style!**
User is speaking Malaysian rojak. You MUST:
- Reply in Malaysian rojak style (mix of Malay, English, Chinese)
- Use particles: lah, lor, meh, kan, etc.
- Be casual and friendly like a Malaysian friend
- Button labels should be in rojak

Rojak response templates:
- Success: Ok boss, jap aku check...
- No data: Takde data la sekarang. Nak cuba...
- Error: Alamak, ada masalah sikit. Cuba lagi kejap.
- Suggestions: Boleh try ni: 1. ... 2. ... 3. ...
`
    case 'english':
    default:
      return `
**🚨 USER LANGUAGE: ENGLISH - Reply in English!**
User is speaking English. You MUST:
- Reply 100% in English
- Do NOT mix in Malay or Chinese
- Be professional yet friendly

English response templates:
- Success: Sure, let me check that for you...
- No data: No data found. Would you like to...
- Error: Sorry, there was an issue. Please try again.
- Suggestions: You could try: 1. ... 2. ... 3. ...
`
  }
}

const MAX_ITERATIONS = 10
const MAX_RETRIES = 2

// ============================================
// Types
// ============================================

interface Message {
  role: string
  content: string
  tool_calls?: ToolCall[]
  tool_call_id?: string
  name?: string
}

interface ToolCall {
  id: string
  type: string
  function: {
    name: string
    arguments: string
  }
}

// Agent Personas (P2)
type Persona = 'general' | 'operations' | 'finance' | 'hr'

interface PersonaConfig {
  name: string
  systemPromptAddition: string
  focusAreas: string[]
  preferredTools: string[]
}

// Page Context from frontend
interface PageContext {
  currentPage: string
  pageType: string
  entityType: string | null
  entityId: string | null
  userAction: string
  breadcrumb: string
}

// User Memory
interface UserMemory {
  key: string
  value: string
  memory_type: string
  category: string | null
  confidence: number
  times_used: number
}

const PERSONAS: Record<Persona, PersonaConfig> = {
  general: {
    name: 'General Assistant',
    systemPromptAddition: '',
    focusAreas: ['all operations', 'general queries'],
    preferredTools: [],
  },
  operations: {
    name: 'Operations Manager',
    systemPromptAddition: `
**OPERATIONS FOCUS:**
You are in Operations Manager mode. Prioritize:
- Project scheduling and staffing levels
- Deadline tracking and urgent alerts
- Staff availability and conflicts
- Venue logistics and requirements
- Real-time status updates

Always check for understaffed projects and upcoming deadlines proactively.`,
    focusAreas: ['projects', 'scheduling', 'staffing'],
    preferredTools: ['get_projects', 'get_upcoming_deadlines', 'find_candidates', 'assign_staff'],
  },
  finance: {
    name: 'Finance Analyst',
    systemPromptAddition: `
**FINANCE FOCUS:**
You are in Finance Analyst mode. Prioritize:
- Payment status and pending amounts
- Budget tracking per project
- Staff hourly rates and total costs
- Invoice tracking
- Expense claims

Always calculate costs and highlight budget concerns.`,
    focusAreas: ['payments', 'budgets', 'costs'],
    preferredTools: ['get_project_stats', 'get_projects', 'execute_sql'],
  },
  hr: {
    name: 'HR Specialist',
    systemPromptAddition: `
**HR FOCUS:**
You are in HR Specialist mode. Prioritize:
- Candidate profiles and skills
- Performance points and ratings
- Work history and reliability
- Staff availability
- Team composition

Focus on finding the right people for projects and track performance metrics.`,
    focusAreas: ['candidates', 'skills', 'performance'],
    preferredTools: ['find_candidates', 'get_candidate_details', 'get_project_staff'],
  },
}

// ============================================
// System Prompt
// ============================================

interface SystemPromptContext {
  persona?: Persona
  pageContext?: PageContext | null
  memories?: UserMemory[]
  recentSummaries?: string[]
  detectedLanguage?: DetectedLanguage
}

function getSystemPrompt(options: SystemPromptContext = {}): string {
  const { persona = 'general', pageContext, memories = [], recentSummaries = [], detectedLanguage = 'english' } = options

  // Get explicit language instruction based on detected language
  const languageInstruction = getLanguageInstruction(detectedLanguage)
  const personaConfig = PERSONAS[persona]

  // Build context section if available
  let contextSection = ''
  if (pageContext) {
    contextSection = `
**CURRENT USER CONTEXT:**
- User is on: ${pageContext.breadcrumb}
- Page type: ${pageContext.pageType}
${pageContext.entityType && pageContext.entityId ? `- Viewing ${pageContext.entityType}: ${pageContext.entityId}` : ''}
- Action: ${pageContext.userAction}

When the user says "this", "here", or refers to the current context, use this information.
If they're viewing a specific project or candidate, you can proactively offer relevant info.
`
  }

  // Build memory section if available
  let memorySection = ''
  if (memories.length > 0) {
    const memoryLines = memories.map(m => `- ${m.key}: ${m.value}`).join('\n')
    memorySection = `
**THINGS I REMEMBER ABOUT THIS USER:**
${memoryLines}

Use this knowledge naturally. Don't mention you "remember" unless relevant.
`
  }

  // Build recent conversations section
  let conversationSection = ''
  if (recentSummaries.length > 0) {
    conversationSection = `
**RECENT CONVERSATIONS:**
${recentSummaries.map((s, i) => `${i + 1}. ${s}`).join('\n')}

You can reference past topics if relevant. Don't repeat yourself.
`
  }

  return `You are Baiger, an intelligent AI assistant for Baito-AI, a staffing management platform.
${languageInstruction}
You understand Malaysian "rojak" - code-switching between:
- Bahasa Malaysia (Malay)
- English (Manglish)
- Mandarin Chinese
- Hokkien, Cantonese, and other Chinese dialects

Common expressions you understand:
- Particles: lah, lor, meh, leh, ah, kan, hor, wei
- Exclamations: aiyo, alamak, walao, wah lao, siao, jialat
- Slang: power, syok, mantap, terror, gempak, settle, kautim, cincai, tapau, lepak, gostan
- Phrases: "can or not", "got meh", "how ah", "no need lah", "like that also can"
${contextSection}${memorySection}${conversationSection}
**YOUR CAPABILITIES:**
You have access to typed tools for database operations. Always use the appropriate tool:

📊 **Project Tools:**
- \`get_projects\` - List and filter projects
- \`get_project_details\` - Get full project info with staff
- \`create_project\` - Create new projects

👥 **Candidate Tools:**
- \`find_candidates\` - Search candidates by skills, availability
- \`get_candidate_details\` - Get candidate profile and history

📋 **Assignment Tools:**
- \`assign_staff\` - Assign candidate to project
- \`get_project_staff\` - List project staff
- \`update_staff_status\` - Update assignment status

📈 **Analytics Tools:**
- \`get_project_stats\` - Get project statistics
- \`get_upcoming_deadlines\` - Check urgent projects

💰 **Expense Tools:**
- \`get_expense_claims\` - View expense claims (filter by status, project)
- \`get_pending_approvals\` - See claims waiting for your approval
- \`approve_expense_claim\` - Approve an expense claim
- \`reject_expense_claim\` - Reject an expense claim with reason

🔧 **SQL Tool (fallback):**
- \`execute_sql\` - For complex queries not covered by other tools

🧠 **Memory Tool:**
- \`save_user_memory\` - Remember important facts about the user for future conversations

${personaConfig.systemPromptAddition}

**BEHAVIORAL GUIDELINES:**

1. **ALWAYS use tools** - Never make up data. Query first, then respond.

2. **CONFIRM before creating:**
   - When user wants to create a project, FIRST summarize what you understood and ask for confirmation
   - Show them: project name, date/time, location, staff needed, and any other details you extracted
   - Ask "Should I create this project?" with a confirmation button BEFORE calling create_project
   - Only call create_project AFTER user explicitly confirms

3. **Be Proactive:**
   - Check for conflicts before creating projects
   - Alert about understaffed projects
   - Suggest candidates based on skills match
   - Warn about upcoming deadlines
   - If user mentions preferences, use save_user_memory to remember them

4. **Action Buttons:**
   When offering suggestions, include action buttons in your response.
   Format as JSON: \`\`\`json
   { "reply": "your message", "buttons": [{ "label": "...", "action": "...", "variant": "default|outline" }] }
   \`\`\`

5. **Smart Context:**
   - "this weekend" = calculate exact dates
   - "my projects" = filter by current user
   - "urgent" = high priority, tight deadline
   - "need staff" = understaffed projects
   - "this project/candidate" = use current context from page

6. **Data Privacy:**
   - Mask IC numbers, bank accounts unless explicitly needed
   - Summarize large result sets
   - Never expose internal system details

**CURRENT DATE:** ${new Date().toISOString().split('T')[0]}
**PERSONA:** ${personaConfig.name}

Be helpful, proactive, and concise. Show your thinking when making decisions.`
}

// ============================================
// Rate Limiting (P0)
// ============================================

async function checkRateLimit(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<{ allowed: boolean; message?: string; retryAfter?: number }> {
  try {
    // Check requests per minute
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString()
    const { count: minuteCount } = await supabase
      .from('ai_messages')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'user')
      .gte('created_at', oneMinuteAgo)

    if ((minuteCount || 0) >= RATE_LIMITS.maxRequestsPerMinute) {
      return {
        allowed: false,
        message: 'Rate limit exceeded. Please wait a moment before sending more messages.',
        retryAfter: 60,
      }
    }

    // Check requests per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count: hourCount } = await supabase
      .from('ai_messages')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'user')
      .gte('created_at', oneHourAgo)

    if ((hourCount || 0) >= RATE_LIMITS.maxRequestsPerHour) {
      return {
        allowed: false,
        message: 'Hourly rate limit exceeded. Please try again in a few minutes.',
        retryAfter: 300,
      }
    }

    return { allowed: true }
  } catch (error) {
    // If rate limit check fails, allow the request
    console.warn('Rate limit check failed:', error)
    return { allowed: true }
  }
}

// ============================================
// Context Window Management (P1)
// ============================================

function truncateHistory(messages: Message[]): Message[] {
  if (messages.length <= CONTEXT_CONFIG.maxHistoryMessages) {
    return messages
  }

  // Keep system message + last N messages
  const systemMessage = messages.find(m => m.role === 'system')
  const nonSystemMessages = messages.filter(m => m.role !== 'system')
  const truncated = nonSystemMessages.slice(-CONTEXT_CONFIG.maxHistoryMessages)

  return systemMessage ? [systemMessage, ...truncated] : truncated
}

function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4)
}

function truncateMessageContent(content: string, maxTokens: number): string {
  const estimated = estimateTokens(content)
  if (estimated <= maxTokens) {
    return content
  }

  // Truncate to approximate max tokens
  const maxChars = maxTokens * 4
  return content.slice(0, maxChars) + '\n\n[Content truncated due to length]'
}

// ============================================
// Retry Logic with Fallback Models (P1)
// ============================================

async function callLLMWithRetry(
  messages: Message[],
  tools: ReturnType<typeof getToolsForLLM>,
  retryCount = 0
): Promise<{ data: any; model: string }> {
  const models = [MODELS.primary, MODELS.fallback1, MODELS.fallback2]
  const modelIndex = Math.min(retryCount, models.length - 1)
  const model = models[modelIndex]

  // Determine which API to use based on model
  const isGroqModel = API_CONFIG.groq.models.includes(model)
  const apiUrl = isGroqModel ? API_CONFIG.groq.url : API_CONFIG.openrouter.url
  const apiKey = isGroqModel ? GROQ_API_KEY : OPENROUTER_API_KEY

  try {
    console.log(`🤖 Calling ${model} via ${isGroqModel ? 'Groq' : 'OpenRouter'} (attempt ${retryCount + 1})`)

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }

    // Add OpenRouter-specific headers
    if (!isGroqModel) {
      headers['HTTP-Referer'] = 'https://baito-ai.com'
      headers['X-Title'] = 'Baito-AI Baiger Chat'
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages,
        tools,
        tool_choice: 'auto',
        max_tokens: 4000,
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()

      // Check if we should retry with fallback
      if (retryCount < MAX_RETRIES && (response.status >= 500 || response.status === 429)) {
        console.warn(`⚠️ ${model} failed with ${response.status}, trying fallback...`)
        return callLLMWithRetry(messages, tools, retryCount + 1)
      }

      throw new Error(`API error (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    return { data, model }
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.warn(`⚠️ ${model} error, trying fallback:`, error)
      return callLLMWithRetry(messages, tools, retryCount + 1)
    }
    throw error
  }
}

// ============================================
// Tool Analytics (P3)
// ============================================

interface ToolAnalytics {
  toolName: string
  executionTime: number
  success: boolean
  errorMessage?: string
}

async function logToolAnalytics(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  conversationId: string,
  analytics: ToolAnalytics
): Promise<void> {
  try {
    await supabase.from('ai_tool_analytics').insert({
      user_id: userId,
      conversation_id: conversationId,
      tool_name: analytics.toolName,
      execution_time_ms: analytics.executionTime,
      success: analytics.success,
      error_message: analytics.errorMessage,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    // Don't fail if analytics logging fails
    console.warn('Failed to log tool analytics:', error)
  }
}

// ============================================
// Streaming Response Handler (P0)
// ============================================

function createStreamingResponse(
  responseStream: ReadableStream,
  conversationId: string,
  model: string
): Response {
  return new Response(responseStream, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Conversation-Id': conversationId,
      'X-Model': model,
    },
  })
}

// ============================================
// Memory & Context Functions
// ============================================

async function getUserMemories(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<UserMemory[]> {
  try {
    const { data, error } = await supabase.rpc('get_user_memories', {
      p_user_id: userId,
      p_limit: 20,
    })

    if (error) {
      console.warn('Failed to fetch user memories:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.warn('Error fetching user memories:', error)
    return []
  }
}

async function getRecentSummaries(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<string[]> {
  try {
    const { data, error } = await supabase.rpc('get_recent_summaries', {
      p_user_id: userId,
      p_limit: 5,
    })

    if (error) {
      console.warn('Failed to fetch conversation summaries:', error)
      return []
    }

    return (data || []).map((s: { summary: string }) => s.summary)
  } catch (error) {
    console.warn('Error fetching conversation summaries:', error)
    return []
  }
}

async function saveContextSnapshot(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  conversationId: string,
  context: PageContext
): Promise<void> {
  try {
    await supabase.from('ai_context_snapshots').insert({
      user_id: userId,
      conversation_id: conversationId,
      current_page: context.currentPage,
      page_type: context.pageType,
      entity_type: context.entityType,
      entity_id: context.entityId,
      user_action: context.userAction,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.warn('Failed to save context snapshot:', error)
  }
}

// Summarize conversation when it has enough messages
async function summarizeConversationIfNeeded(
  supabase: ReturnType<typeof createClient>,
  conversationId: string,
  userId: string
): Promise<void> {
  try {
    // Get message count
    const { count, error: countError } = await supabase
      .from('ai_messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)

    if (countError || !count || count < CONTEXT_CONFIG.summarizeAfterMessages) {
      return // Not enough messages to summarize
    }

    // Check if already summarized
    const { data: existingSummary } = await supabase
      .from('ai_conversation_summaries')
      .select('id')
      .eq('conversation_id', conversationId)
      .single()

    if (existingSummary) {
      return // Already summarized
    }

    // Get messages for summary
    const { data: messages } = await supabase
      .from('ai_messages')
      .select('type, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(50)

    if (!messages || messages.length < 5) return

    // Create a summary using a simple LLM call
    const summaryPrompt = `Summarize this conversation in 2-3 sentences. Focus on key topics discussed and any decisions or actions taken.

Conversation:
${messages.map(m => `${m.type}: ${m.content.substring(0, 500)}`).join('\n\n')}

Summary:`

    // Call LLM for summary (use a fast model)
    const summaryResponse = await fetch(API_CONFIG.groq.url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: summaryPrompt }],
        max_tokens: 200,
        temperature: 0.3,
      }),
    })

    if (!summaryResponse.ok) {
      console.warn('Failed to generate summary')
      return
    }

    const summaryData = await summaryResponse.json()
    const summary = summaryData.choices[0]?.message?.content || ''

    if (!summary) return

    // Extract key topics (simple extraction from messages)
    const userMessages = messages.filter(m => m.type === 'user')
    const topics = extractTopics(userMessages.map(m => m.content).join(' '))

    // Calculate duration
    const firstMessage = new Date(messages[0].created_at)
    const lastMessage = new Date(messages[messages.length - 1].created_at)
    const durationMinutes = Math.round((lastMessage.getTime() - firstMessage.getTime()) / 60000)

    // Save summary
    await supabase.from('ai_conversation_summaries').insert({
      user_id: userId,
      conversation_id: conversationId,
      summary: summary.trim(),
      key_topics: topics,
      message_count: count,
      duration_minutes: durationMinutes,
      created_at: new Date().toISOString(),
    })

    console.log('📝 Saved conversation summary')
  } catch (error) {
    console.warn('Failed to summarize conversation:', error)
  }
}

// Simple topic extraction
function extractTopics(text: string): string[] {
  const topics: string[] = []
  const lowerText = text.toLowerCase()

  // Domain-specific keywords
  const keywords = [
    'project', 'staff', 'candidate', 'schedule', 'payment',
    'deadline', 'event', 'venue', 'budget', 'assignment',
    'promotion', 'exhibition', 'conference', 'wedding',
    'report', 'analytics', 'dashboard', 'settings',
  ]

  for (const keyword of keywords) {
    if (lowerText.includes(keyword) && !topics.includes(keyword)) {
      topics.push(keyword)
    }
  }

  return topics.slice(0, 5) // Max 5 topics
}

// ============================================
// Main Handler
// ============================================

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    // Parse request
    const {
      message,
      conversationId,
      userId,
      showToolCalls = false,
      stream = false,
      persona = 'general',
      context: pageContext = null,
    } = await req.json()

    if (!message) {
      throw new Error('Message is required')
    }

    console.log('🚀 Starting Baiger chat')
    console.log('📝 Message:', message.substring(0, 100))
    console.log('👤 User ID:', userId)
    console.log('🎭 Persona:', persona)
    if (pageContext) {
      console.log('📍 Context:', pageContext.pageType, pageContext.entityType ? `(${pageContext.entityType})` : '')
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Rate limit check (P0)
    if (userId) {
      const rateCheck = await checkRateLimit(supabase, userId)
      if (!rateCheck.allowed) {
        return new Response(
          JSON.stringify({
            error: rateCheck.message,
            retryAfter: rateCheck.retryAfter,
          }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    // Get or create conversation
    let activeConversationId = conversationId
    let isNewConversation = false
    let storedLanguage: DetectedLanguage | null = null

    if (!activeConversationId && userId) {
      isNewConversation = true
      const { data: conversation } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: userId,
          title: message.substring(0, 50),
          persona: persona,
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      activeConversationId = conversation?.id
    } else if (activeConversationId) {
      // Fetch existing conversation to get stored language
      const { data: existingConv } = await supabase
        .from('ai_conversations')
        .select('metadata')
        .eq('id', activeConversationId)
        .single()

      if (existingConv?.metadata?.language) {
        storedLanguage = existingConv.metadata.language as DetectedLanguage
        console.log(`🌐 Found stored language in conversation: ${storedLanguage}`)
      }
    }

    // Fetch user memories and context (parallel for performance)
    let memories: UserMemory[] = []
    let recentSummaries: string[] = []

    if (userId) {
      const [memoriesResult, summariesResult] = await Promise.all([
        getUserMemories(supabase, userId),
        getRecentSummaries(supabase, userId),
      ])
      memories = memoriesResult
      recentSummaries = summariesResult

      console.log(`🧠 Loaded ${memories.length} memories, ${recentSummaries.length} summaries`)

      // Save context snapshot for new conversations
      if (isNewConversation && pageContext && activeConversationId) {
        saveContextSnapshot(supabase, userId, activeConversationId, pageContext)
      }
    }

    // Fetch conversation history FIRST (needed for language detection)
    let conversationHistory: Array<{role: string, content: string}> = []
    if (activeConversationId) {
      const { data: history } = await supabase
        .from('ai_messages')
        .select('type, content')
        .eq('conversation_id', activeConversationId)
        .order('created_at', { ascending: true })
        .limit(CONTEXT_CONFIG.maxHistoryMessages)

      if (history && history.length > 0) {
        // Truncate long messages and map 'type' to 'role' for LLM compatibility
        conversationHistory = history.map(msg => ({
          role: msg.type, // Map DB column 'type' to LLM expected 'role'
          content: truncateMessageContent(msg.content, CONTEXT_CONFIG.maxTokensPerMessage),
        }))
      }
    }

    // Detect user's language with conversation context (maintains language for button actions)
    // Priority: 1) Stored language for action commands, 2) Detection from history, 3) Detection from message
    let detectedLanguage: DetectedLanguage

    if (isActionCommand(message) && storedLanguage) {
      // Action command + stored language available: use stored language
      detectedLanguage = storedLanguage
      console.log(`🌐 Using stored language for action command: ${detectedLanguage}`)
    } else if (isActionCommand(message)) {
      // Action command but no stored language: try history
      detectedLanguage = detectLanguageWithHistory(message, conversationHistory)
      console.log(`🌐 Detected from history for action command: ${detectedLanguage}`)
    } else {
      // Regular message: detect directly
      detectedLanguage = detectLanguage(message)
      console.log(`🌐 Detected from message: ${detectedLanguage}`)

      // Store this language in conversation for future action commands
      if (activeConversationId && detectedLanguage !== 'english') {
        supabase
          .from('ai_conversations')
          .update({
            metadata: { language: detectedLanguage },
            last_activity: new Date().toISOString(),
          })
          .eq('id', activeConversationId)
          .then(() => console.log(`💾 Stored language ${detectedLanguage} in conversation`))
          .catch(err => console.error('Failed to store language:', err))
      }
    }

    // Build system prompt with detected language
    const systemPrompt = getSystemPrompt({
      persona: persona as Persona,
      pageContext: pageContext as PageContext | null,
      memories,
      recentSummaries,
      detectedLanguage,
    })
    const messages: Message[] = [{ role: 'system', content: systemPrompt }]

    // Add conversation history to messages
    if (conversationHistory.length > 0) {
      messages.push(...conversationHistory)
    }

    // Add current user message
    messages.push({ role: 'user', content: message })

    // Save user message
    if (activeConversationId) {
      await supabase.from('ai_messages').insert({
        conversation_id: activeConversationId,
        type: 'user', // DB column is 'type', not 'role'
        content: message,
        created_at: new Date().toISOString(),
      })
    }

    // Get typed tools
    const MCP_TOOLS = getToolsForLLM()

    // Tool context for execution
    const toolContext: ToolContext = {
      userId,
      conversationId: activeConversationId,
      persona: persona as Persona,
    }

    // ReAct Loop with typed tools
    let iteration = 0
    let finalResponse = ''
    let allToolCalls: ToolAnalytics[] = []
    let usedModel = MODELS.primary

    while (iteration < MAX_ITERATIONS) {
      iteration++
      console.log(`\n🔄 Iteration ${iteration}/${MAX_ITERATIONS}`)

      // Truncate history if needed
      const truncatedMessages = truncateHistory(messages)

      // Call LLM with retry and fallback (P1)
      const { data, model } = await callLLMWithRetry(truncatedMessages, MCP_TOOLS)
      usedModel = model

      const assistantMessage = data.choices[0].message
      messages.push(assistantMessage)

      console.log('🤖 Response:', assistantMessage.content?.substring(0, 100))

      // Check if there are tool calls
      if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
        finalResponse = assistantMessage.content || 'I apologize, I could not generate a response.'
        break
      }

      // Execute tool calls using typed tools
      console.log(`🔧 Executing ${assistantMessage.tool_calls.length} tool calls`)

      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function.name
        const toolStartTime = Date.now()

        let toolResult: ToolResult

        try {
          const functionArgs = JSON.parse(toolCall.function.arguments)
          console.log(`🛠️ Tool: ${functionName}`, functionArgs)

          // Check cache first (P1)
          if (isCacheable(functionName)) {
            const cachedResult = await getCachedResult(supabase, functionName, functionArgs)
            if (cachedResult) {
              toolResult = cachedResult as ToolResult
              console.log('📦 Using cached result')
            } else {
              // Execute and cache
              toolResult = await executeTool(functionName, functionArgs, supabase, toolContext)
              if (toolResult.success) {
                await setCachedResult(supabase, functionName, functionArgs, toolResult)
              }
            }
          } else {
            // Execute without caching (write operations)
            toolResult = await executeTool(functionName, functionArgs, supabase, toolContext)
          }

          const toolEndTime = Date.now()
          allToolCalls.push({
            toolName: functionName,
            executionTime: toolEndTime - toolStartTime,
            success: toolResult.success,
            errorMessage: toolResult.error,
          })

          console.log('✅ Tool result:', JSON.stringify(toolResult).substring(0, 200))
        } catch (error) {
          console.error('❌ Tool error:', error)

          const toolEndTime = Date.now()
          allToolCalls.push({
            toolName: functionName,
            executionTime: toolEndTime - toolStartTime,
            success: false,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          })

          toolResult = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          }
        }

        // Add tool result to messages
        messages.push({
          role: 'tool',
          content: JSON.stringify(toolResult),
          tool_call_id: toolCall.id,
        } as any)

        // Log analytics (P3)
        if (userId && activeConversationId) {
          await logToolAnalytics(supabase, userId, activeConversationId, allToolCalls[allToolCalls.length - 1])
        }
      }
    }

    // Handle max iterations
    if (iteration >= MAX_ITERATIONS && !finalResponse) {
      finalResponse = 'I apologize, but I needed too many steps to complete this request. Could you please rephrase or break down your request?'
    }

    // Extract buttons from response
    let extractedButtons: any[] = []
    let cleanResponse = finalResponse

    try {
      const jsonMatch = finalResponse.match(/```json\s*(\{[\s\S]*?\})\s*```/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1])
        if (parsed.reply && parsed.buttons) {
          cleanResponse = parsed.reply
          extractedButtons = parsed.buttons
        }
      } else {
        const parsed = JSON.parse(finalResponse)
        if (parsed.reply && parsed.buttons) {
          cleanResponse = parsed.reply
          extractedButtons = parsed.buttons
        }
      }
    } catch {
      // Not JSON - use as-is
    }

    // Save assistant response
    if (activeConversationId) {
      await supabase.from('ai_messages').insert({
        conversation_id: activeConversationId,
        type: 'assistant', // DB column is 'type', not 'role'
        content: cleanResponse,
        metadata: extractedButtons.length > 0 ? { buttons: extractedButtons } : null,
        created_at: new Date().toISOString(),
      })

      // Trigger summarization check (async, don't wait)
      if (userId) {
        summarizeConversationIfNeeded(supabase, activeConversationId, userId).catch(console.warn)
      }
    }

    const endTime = Date.now()
    const totalTime = endTime - startTime

    console.log('✅ Chat completed')
    console.log('⏱️ Total time:', totalTime, 'ms')
    console.log('🔧 Tool calls made:', allToolCalls.length)
    console.log('🤖 Model used:', usedModel)

    // Build response
    const response: any = {
      reply: cleanResponse,
      conversationId: activeConversationId,
      metadata: {
        model: usedModel,
        totalTime,
        iterations: iteration,
        toolCallsCount: allToolCalls.length,
        persona,
        timestamp: new Date().toISOString(),
      },
    }

    if (extractedButtons.length > 0) {
      response.buttons = extractedButtons
    }

    if (showToolCalls && allToolCalls.length > 0) {
      response.toolCalls = allToolCalls.map(tc => ({
        name: tc.toolName,
        time: tc.executionTime,
        success: tc.success,
      }))
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('❌ Baiger Chat error:', error)

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
