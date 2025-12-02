# AI Chatbot Reasoning & Intelligence Upgrade Plan
**Project:** Baito-AI Chatbot Enhancement
**Date:** October 15, 2025
**Status:** Planning Phase

---

## Executive Summary

This document outlines a comprehensive upgrade plan to enhance the Baito-AI chatbot's intelligence, reasoning capabilities, and conversational understanding. The current implementation lacks explicit reasoning phases, resulting in responses that may appear mechanical or fail to understand context properly.

**Key Goals:**
1. Implement thinking/reasoning before responding
2. Improve intent recognition and context understanding
3. Handle ambiguous queries more intelligently
4. Reduce errors from poor contextual awareness
5. Create more natural, human-like interactions

---

## 1. Current State Analysis

### Conversation Analysis

**Example Conversation Issues:**

```
User: "what is in my warehouse"
Bot: "I do not have access to your company's physical inventory..."
❌ Problem: Bot doesn't attempt to clarify or infer context
```

```
User: "Looking for 10 promoters for Samsung..."
Bot: "Has this project already been created in the system?"
❌ Problem: Not proactive - should recognize this as a job posting and offer to create project
```

### Current Implementation (index.ts:1-1243)

**Architecture:**
- Model: Google Gemini 2.5 Flash (`MODEL = 'google/gemini-2.5-flash-preview-09-2025'`)
- Pattern: ReAct Loop (Reason-Act-Observe)
- Max Iterations: 5
- Memory: 3-layer (working, session, semantic)

**Limitations Identified:**

1. **No Explicit Reasoning Phase**
   - Jumps directly to tool selection without thinking
   - No pre-planning or intent classification
   - Linear execution without strategy assessment

2. **Limited Context Understanding**
   - Cannot infer ambiguous requests
   - Struggles with conversational references ("it", "them", "all")
   - No intent classification layer

3. **Reactive Rather Than Proactive**
   - Waits for user clarification instead of inferring
   - Doesn't recognize common patterns (job postings, queries)

4. **No Confidence Assessment**
   - Never expresses uncertainty
   - No self-validation of responses

---

## 2. Industry Research Summary

### A. Chain-of-Thought (CoT) Prompting

**What It Is:**
Technique that makes LLMs show their reasoning steps before answering, leading to better accuracy on complex tasks.

**Implementation Approaches:**

1. **Zero-Shot CoT**: Add "Let's think step by step" to prompts
2. **Few-Shot CoT**: Provide examples with reasoning steps
3. **Auto-CoT**: Automatically generate reasoning demonstrations

**Best For:**
- Complex queries requiring multi-step reasoning
- Math/logic problems
- Planning and scheduling tasks
- When accuracy > speed

**Example Pattern:**
```typescript
// Instead of:
"Find me promoters for this event"

// Use:
"Let's approach this systematically:
1. First, I'll analyze the event requirements
2. Then identify key qualifications needed
3. Search candidates matching those criteria
4. Finally, rank them by suitability"
```

### B. Reasoning Models (OpenAI o1, Claude Extended Thinking)

**OpenAI o1 Model:**
- Built-in reasoning capabilities
- `reasoning_effort` parameter: "low" | "medium" | "high"
- Thinks internally before responding
- Pricing: $15/750K input tokens, $60/750K output tokens

**Claude Extended Thinking:**
- Enable via `thinking` parameter in API
- Minimum thinking budget: 1024 tokens
- Best in English
- Shows thinking process transparently

**Code Example (Claude Extended Thinking):**
```typescript
const response = await anthropic.messages.create({
  model: "claude-3-7-sonnet-20250219",
  max_tokens: 16000,
  thinking: {
    type: "enabled",
    budget_tokens: 5000
  },
  messages: [{
    role: "user",
    content: "Analyze this staffing request and find candidates..."
  }]
});
```

### C. Intent Classification Systems

**Modern Approaches:**

1. **BERT-Based Fine-Tuning** (Production)
   - Fine-tune pretrained BERT with your labeled data
   - 95%+ accuracy with sufficient training data
   - Fast inference (~50ms)

2. **LLM-Based Zero-Shot** (Rapid Prototyping)
   - Use GPT-4/Claude with prompt engineering
   - No training data needed
   - Higher cost, slower, less consistent

3. **Hybrid Architecture** (Optimal)
   - Fast classifier for common intents
   - LLM fallback for ambiguous cases
   - Best of both worlds

**Intent Categories for Baito-AI:**
```typescript
enum ChatbotIntent {
  PROJECT_QUERY = "project_query",          // "Show me projects..."
  PROJECT_CREATE = "project_create",        // Job posting text
  CANDIDATE_SEARCH = "candidate_search",    // "Find promoters..."
  STAFF_ASSIGNMENT = "staff_assignment",    // "Assign John to..."
  FINANCIAL_QUERY = "financial_query",      // "What's my revenue?"
  SCHEDULING_CHECK = "scheduling_check",    // "Any conflicts?"
  CLARIFICATION_NEEDED = "clarification",   // Ambiguous query
  SMALL_TALK = "small_talk",               // Greetings, chitchat
  OUT_OF_SCOPE = "out_of_scope"           // "What's in my warehouse?"
}
```

### D. Multi-Agent Systems

**Architecture Pattern:**
```
User Query
    ↓
Intent Classifier Agent
    ↓
    ├→ Query Agent (read-only operations)
    ├→ Action Agent (create/update operations)
    ├→ Analysis Agent (reports, insights)
    └→ Conversation Agent (clarifications, small talk)
    ↓
Response Synthesizer
    ↓
User Response
```

**Benefits:**
- Specialized agents for different tasks
- Parallel processing capabilities
- Easier to maintain and improve
- Better error isolation

**Popular Frameworks:**
- AutoGen (Microsoft) - Agent orchestration
- LangGraph - Event-driven agent workflows
- Ray + RLlib - Distributed learning

---

## 3. Implementation Roadmap

### 🚀 Phase 1: Quick Wins (1-2 weeks)

**Goal:** Improve reasoning without major architecture changes

#### 1.1 Enhanced System Prompt with CoT

**Implementation:**
```typescript
const ENHANCED_SYSTEM_PROMPT = `You are an AI assistant for Baito-AI, a staffing and project management system.

REASONING PROCESS:
Before responding, always follow this internal reasoning process:

1. UNDERSTAND: What is the user really asking?
   - Parse the literal request
   - Infer the underlying intent
   - Identify any ambiguities or missing context

2. PLAN: What's the best approach?
   - What tools or information do I need?
   - What's the optimal sequence of actions?
   - Are there edge cases to consider?

3. VALIDATE: Does my plan make sense?
   - Will this actually solve the user's need?
   - Am I making any assumptions I should verify?
   - Is there a simpler approach?

4. EXECUTE: Carry out the plan

5. REFLECT: Check the result
   - Does this fully answer the question?
   - Should I suggest additional relevant actions?

EXAMPLES:

User: "what is in my warehouse"
REASONING:
1. UNDERSTAND: This is ambiguous. "Warehouse" could mean:
   - Physical inventory (out of scope)
   - Projects/candidates in database (in scope)
   - Something else?
2. PLAN: Clarify intent, offer relevant alternatives
3. VALIDATE: Clarification is better than assuming
4. EXECUTE: Ask user what they meant, offer possibilities
5. REFLECT: This helps user refine their query

Response: "I'm not sure what you mean by 'warehouse'. Are you asking about:
- Available candidates in the system?
- Ongoing projects?
- Equipment or physical inventory (which I don't have access to)?
Could you clarify so I can help you better?"

---

User: "Looking for 10 promoters for Samsung product launch..."
REASONING:
1. UNDERSTAND: This is a job posting, not a question
2. PLAN: Extract event details, create project, then search candidates
3. VALIDATE: This is proactive and saves user time
4. EXECUTE: Use speed_add_project tool
5. REFLECT: After creating project, immediately search for candidates

Response: "I can see you're organizing a Samsung product launch! Let me:
1. Create this project in the system
2. Search for suitable Mandarin-speaking promoters
[Executes tools...]"

Current user context will be provided in each request.`
```

**Files to Modify:**
- `supabase/functions/ai-chat/index.ts` lines 106-130

#### 1.2 Pre-Reasoning Step in ReAct Loop

**Implementation:**
```typescript
async function reActLoopWithThinking(
  userMessage: string,
  history: any[],
  contextMessage: string,
  context: Context,
  supabase: any
): Promise<{ reply: string; toolsUsed: string[]; reasoning?: string }> {

  const toolsUsed: string[] = []

  // STEP 1: REASONING PHASE
  const reasoningPrompt = `Before taking any action, think through this query:

User query: "${userMessage}"

Provide your reasoning in this format:
1. INTENT: What is the user trying to accomplish?
2. CONTEXT: What relevant context from conversation history should I consider?
3. APPROACH: What's my strategy to help them?
4. TOOLS: Which tools (if any) should I use and in what order?
5. CONFIDENCE: How confident am I in understanding this query? (low/medium/high)

Reasoning:`

  const messages = [
    { role: 'system', content: ENHANCED_SYSTEM_PROMPT },
    { role: 'system', content: getCurrentDateTime() },
    { role: 'system', content: contextMessage },
    ...history,
    { role: 'user', content: reasoningPrompt }
  ]

  // Get reasoning output
  const reasoningResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://baito-ai.com',
      'X-Title': 'Baito-AI Chat'
    },
    body: JSON.stringify({
      model: MODEL,
      messages: messages,
      temperature: 0.3, // Lower temp for reasoning
      max_tokens: 500
    })
  })

  const reasoningData = await reasoningResponse.json()
  const reasoning = reasoningData.choices[0].message.content

  console.log('🧠 REASONING PHASE:', reasoning)

  // STEP 2: ACTION PHASE (existing ReAct loop)
  // Add reasoning to context
  messages.push({
    role: 'assistant',
    content: `My reasoning: ${reasoning}\n\nNow I'll execute my plan.`
  })
  messages.push({
    role: 'user',
    content: userMessage // Original query
  })

  // Continue with existing ReAct loop logic...
  let iteration = 0
  while (iteration < MAX_ITERATIONS) {
    // [Existing tool execution logic from lines 481-565]
    // ...
  }

  return {
    reply: finalReply,
    toolsUsed,
    reasoning // Return reasoning for logging/debugging
  }
}
```

**Benefits:**
- Separates thinking from action
- Provides visibility into decision process
- Better handling of ambiguous queries
- Can be toggled on/off via config

#### 1.3 Intent Classification Layer

**Implementation:**
```typescript
// New file: supabase/functions/ai-chat/intent-classifier.ts

export enum ChatIntent {
  PROJECT_QUERY = "project_query",
  PROJECT_CREATE = "project_create",
  CANDIDATE_SEARCH = "candidate_search",
  STAFF_ASSIGNMENT = "staff_assignment",
  FINANCIAL_QUERY = "financial_query",
  SCHEDULING_CHECK = "scheduling_check",
  CLARIFICATION_NEEDED = "clarification",
  SMALL_TALK = "small_talk",
  OUT_OF_SCOPE = "out_of_scope"
}

interface ClassificationResult {
  intent: ChatIntent
  confidence: number
  entities: Record<string, any>
  needsClarification: boolean
}

export async function classifyIntent(
  message: string,
  history: any[],
  openRouterKey: string
): Promise<ClassificationResult> {

  const classificationPrompt = `Analyze this user message and classify its intent.

User message: "${message}"

Classify into one of these intents:
- project_query: Searching or asking about projects
- project_create: Creating a new project (job postings, event descriptions)
- candidate_search: Finding staff/candidates
- staff_assignment: Assigning people to projects
- financial_query: Revenue, payments, expenses
- scheduling_check: Checking for conflicts or availability
- clarification: Ambiguous query that needs clarification
- small_talk: Greetings, thank you, casual conversation
- out_of_scope: Questions outside the system's capabilities

Also extract any relevant entities (dates, names, numbers, locations).

Respond in JSON format:
{
  "intent": "intent_name",
  "confidence": 0.0-1.0,
  "entities": {},
  "reasoning": "brief explanation",
  "needsClarification": boolean
}`

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://baito-ai.com',
      'X-Title': 'Baito-AI Intent Classifier'
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash-preview-09-2025',
      messages: [
        { role: 'system', content: classificationPrompt },
        ...history.slice(-4), // Last 2 exchanges for context
        { role: 'user', content: message }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    })
  })

  const data = await response.json()
  const result = JSON.parse(data.choices[0].message.content)

  console.log('🎯 INTENT CLASSIFICATION:', result)

  return {
    intent: result.intent as ChatIntent,
    confidence: result.confidence,
    entities: result.entities || {},
    needsClarification: result.needsClarification || false
  }
}
```

**Usage in main handler:**
```typescript
// In reActLoop, before reasoning phase
const intentResult = await classifyIntent(userMessage, history, OPENROUTER_API_KEY)

// Route based on intent
if (intentResult.intent === ChatIntent.OUT_OF_SCOPE) {
  return {
    reply: "I apologize, but that's outside my capabilities. I can help you with projects, candidates, scheduling, and financial reports. What would you like to know?",
    toolsUsed: []
  }
}

if (intentResult.needsClarification) {
  // Generate clarification questions
  return await generateClarificationQuestions(userMessage, intentResult, context)
}
```

**Estimated Effort:** 3-5 days

---

### 🏗️ Phase 2: Architectural Improvements (3-4 weeks)

**Goal:** Switch to reasoning-capable models and improve architecture

#### 2.1 Migrate to Reasoning Model

**Option A: Claude Extended Thinking (Recommended)**

**Pros:**
- Excellent reasoning capabilities
- Transparent thinking process
- Can interleave thinking with tool use
- You're already familiar with Anthropic

**Implementation:**
```typescript
// Update model configuration
const MODEL_CONFIG = {
  provider: 'anthropic',
  model: 'claude-3-7-sonnet-20250219',
  thinking: {
    enabled: true,
    budget_tokens: 3000, // Adjust based on complexity
    mode: 'interleaved' // Think between tool calls
  }
}

async function reActLoopWithClaudeThinking(
  userMessage: string,
  history: any[],
  contextMessage: string,
  context: Context,
  supabase: any
) {
  const anthropic = new Anthropic({
    apiKey: Deno.env.get('ANTHROPIC_API_KEY')
  })

  const messages = [
    ...history,
    { role: 'user', content: userMessage }
  ]

  const response = await anthropic.messages.create({
    model: MODEL_CONFIG.model,
    max_tokens: 16000,
    system: [
      { type: 'text', text: ENHANCED_SYSTEM_PROMPT },
      { type: 'text', text: contextMessage }
    ],
    thinking: {
      type: 'enabled',
      budget_tokens: MODEL_CONFIG.thinking.budget_tokens
    },
    messages: messages,
    tools: AVAILABLE_TOOLS.map(convertToAnthropicToolFormat)
  })

  // Process response with thinking blocks
  let thinking = ''
  let reply = ''
  let toolCalls = []

  for (const block of response.content) {
    if (block.type === 'thinking') {
      thinking = block.thinking
      console.log('🧠 CLAUDE THINKING:', thinking)
    } else if (block.type === 'text') {
      reply = block.text
    } else if (block.type === 'tool_use') {
      toolCalls.push(block)
    }
  }

  // Execute tools if needed
  if (toolCalls.length > 0) {
    const toolResults = await executeTools(toolCalls, context, supabase)

    // Continue conversation with tool results
    return await continueWithToolResults(messages, toolResults, anthropic, MODEL_CONFIG)
  }

  return {
    reply,
    thinking, // Can show to user or log for debugging
    toolsUsed: []
  }
}
```

**Option B: OpenAI o1**

**Pros:**
- Cutting-edge reasoning
- Reasoning effort parameter for control
- Good for complex problem-solving

**Cons:**
- More expensive ($15-$60 per 750K tokens)
- Slower inference
- No streaming support

**Implementation:**
```typescript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'o1-preview',
    messages: messages,
    reasoning_effort: 'medium', // low | medium | high
    max_completion_tokens: 5000
  })
})
```

#### 2.2 Multi-Agent Architecture

**Design:**

```typescript
// agents/base-agent.ts
export abstract class BaseAgent {
  abstract name: string
  abstract description: string
  abstract canHandle(intent: ChatIntent): boolean
  abstract async execute(query: string, context: Context): Promise<AgentResponse>
}

// agents/query-agent.ts
export class QueryAgent extends BaseAgent {
  name = 'QueryAgent'
  description = 'Handles read-only queries for projects, candidates, and data'

  canHandle(intent: ChatIntent): boolean {
    return [
      ChatIntent.PROJECT_QUERY,
      ChatIntent.CANDIDATE_SEARCH,
      ChatIntent.FINANCIAL_QUERY
    ].includes(intent)
  }

  async execute(query: string, context: Context): Promise<AgentResponse> {
    // Specialized logic for queries
    // Can use lighter/faster models
    // Read-only permissions
  }
}

// agents/action-agent.ts
export class ActionAgent extends BaseAgent {
  name = 'ActionAgent'
  description = 'Handles create/update/delete operations with user confirmation'

  canHandle(intent: ChatIntent): boolean {
    return [
      ChatIntent.PROJECT_CREATE,
      ChatIntent.STAFF_ASSIGNMENT
    ].includes(intent)
  }

  async execute(query: string, context: Context): Promise<AgentResponse> {
    // Always confirm before actions
    // Validate permissions
    // Use reasoning model for safety
  }
}

// agents/conversation-agent.ts
export class ConversationAgent extends BaseAgent {
  name = 'ConversationAgent'
  description = 'Handles clarifications, small talk, and out-of-scope'

  canHandle(intent: ChatIntent): boolean {
    return [
      ChatIntent.CLARIFICATION_NEEDED,
      ChatIntent.SMALL_TALK,
      ChatIntent.OUT_OF_SCOPE
    ].includes(intent)
  }

  async execute(query: string, context: Context): Promise<AgentResponse> {
    // Fast, conversational responses
    // Can use cheaper models
    // Focus on user experience
  }
}

// Orchestrator
export class AgentOrchestrator {
  private agents: BaseAgent[] = [
    new QueryAgent(),
    new ActionAgent(),
    new ConversationAgent()
  ]

  async route(query: string, intent: ChatIntent, context: Context): Promise<AgentResponse> {
    const agent = this.agents.find(a => a.canHandle(intent))

    if (!agent) {
      throw new Error(`No agent available for intent: ${intent}`)
    }

    console.log(`🤖 Routing to ${agent.name}`)
    return await agent.execute(query, context)
  }
}
```

**Benefits:**
- Cleaner code organization
- Specialized agents for different tasks
- Easier to A/B test different models per agent
- Can run agents in parallel for complex queries

#### 2.3 Confidence Scoring & Self-Validation

**Implementation:**
```typescript
interface ResponseWithConfidence {
  reply: string
  confidence: number // 0.0 - 1.0
  uncertainties: string[]
  suggestions: string[]
}

async function generateResponseWithConfidence(
  query: string,
  context: Context
): Promise<ResponseWithConfidence> {

  // Step 1: Generate initial response
  const initialResponse = await generateResponse(query, context)

  // Step 2: Self-validate
  const validationPrompt = `Review this response and assess its quality:

Query: "${query}"
Response: "${initialResponse}"

Assess:
1. Does it fully answer the question?
2. Are there any assumptions or uncertainties?
3. Is additional clarification needed?
4. Confidence level (0.0-1.0)?

Respond in JSON:
{
  "confidence": 0.85,
  "uncertainties": ["Assumed user meant X"],
  "improvements": ["Could also mention Y"],
  "needsClarification": false
}`

  const validation = await callLLM(validationPrompt)

  // Step 3: Enhance response if needed
  if (validation.confidence < 0.7) {
    return {
      reply: `${initialResponse}\n\nNote: I'm not entirely certain about this. ${validation.uncertainties.join(', ')}. Would you like me to clarify anything?`,
      confidence: validation.confidence,
      uncertainties: validation.uncertainties,
      suggestions: validation.improvements
    }
  }

  return {
    reply: initialResponse,
    confidence: validation.confidence,
    uncertainties: [],
    suggestions: []
  }
}
```

**Estimated Effort:** 2-3 weeks

---

### 🚀 Phase 3: Advanced Features (4-6 weeks)

**Goal:** Production-ready intelligent system

#### 3.1 Contextual Memory System

**Implementation:**
```typescript
// Enhanced memory with context windows
interface ConversationContext {
  shortTerm: Message[] // Last 10 messages
  mediumTerm: SessionSummary[] // Summarized sessions
  longTerm: SemanticMemory[] // Vector search results
  userProfile: UserPreferences
  activeTopics: string[] // What we're currently discussing
}

async function buildEnhancedContext(
  conversationId: string,
  currentQuery: string,
  supabase: any
): Promise<ConversationContext> {

  // Short-term: Recent messages
  const shortTerm = await loadRecentMessages(conversationId, 10)

  // Medium-term: Session summaries
  const mediumTerm = await loadSessionSummaries(conversationId, 5)

  // Long-term: Semantic search
  const embedding = await getEmbedding(currentQuery)
  const longTerm = await semanticSearch(conversationId, embedding, 5)

  // User profile
  const userProfile = await loadUserPreferences(conversationId)

  // Active topics (what are we talking about?)
  const activeTopics = await extractActiveTopics(shortTerm, currentQuery)

  return {
    shortTerm,
    mediumTerm,
    longTerm,
    userProfile,
    activeTopics
  }
}

async function extractActiveTopics(
  recentMessages: Message[],
  currentQuery: string
): Promise<string[]> {
  const prompt = `Based on this conversation, what topics are currently being discussed?

Recent messages:
${recentMessages.map(m => `${m.role}: ${m.content}`).join('\n')}

Current query: "${currentQuery}"

List 3-5 active topics (e.g., "Samsung project", "promoter search", "scheduling"):`

  const response = await callLLM(prompt)
  return response.split('\n').map(t => t.trim()).filter(Boolean)
}
```

#### 3.2 Proactive Suggestions

**Implementation:**
```typescript
async function generateProactiveSuggestions(
  context: ConversationContext,
  currentResponse: string
): Promise<string[]> {

  const suggestions = []

  // Pattern detection
  if (context.activeTopics.includes('project creation')) {
    suggestions.push('💡 After creating the project, would you like me to search for suitable candidates?')
  }

  if (context.activeTopics.includes('candidate search')) {
    suggestions.push('💡 I can check for scheduling conflicts if you give me the project dates.')
  }

  // User pattern learning
  if (context.userProfile.frequentlyAsks.includes('revenue')) {
    const today = new Date()
    if (today.getDate() === 1) {
      suggestions.push('💡 It\'s the start of a new month! Would you like a revenue report for last month?')
    }
  }

  return suggestions
}
```

#### 3.3 Learning & Improvement Pipeline

**Implementation:**
```typescript
// Feedback collection
interface UserFeedback {
  messageId: string
  rating: 1 | 2 | 3 | 4 | 5
  wasHelpful: boolean
  corrections?: string
  timestamp: Date
}

// Continuous learning
async function logInteractionForLearning(
  query: string,
  intent: ChatIntent,
  response: string,
  toolsUsed: string[],
  feedback?: UserFeedback
) {
  await supabase.from('ai_learning_data').insert({
    query,
    intent,
    response,
    tools_used: toolsUsed,
    feedback_rating: feedback?.rating,
    was_helpful: feedback?.wasHelpful,
    corrections: feedback?.corrections,
    created_at: new Date()
  })
}

// Periodic retraining
async function improveIntentClassifier() {
  // 1. Export labeled data
  const trainingData = await supabase
    .from('ai_learning_data')
    .select('*')
    .not('feedback_rating', 'is', null)
    .gte('feedback_rating', 4) // Only high-rated examples

  // 2. Fine-tune BERT model
  // (Can use Google Vertex AI, Hugging Face, or AWS SageMaker)

  // 3. Deploy new classifier
  // Update intent-classifier.ts with new model endpoint
}
```

#### 3.4 A/B Testing Framework

**Implementation:**
```typescript
enum ExperimentVariant {
  CONTROL = 'control', // Current implementation
  VARIANT_A = 'variant_a', // With CoT prompting
  VARIANT_B = 'variant_b', // With reasoning model
  VARIANT_C = 'variant_c' // Multi-agent
}

interface Experiment {
  id: string
  name: string
  variants: ExperimentVariant[]
  metrics: string[]
  startDate: Date
  endDate: Date
  isActive: boolean
}

async function selectVariantForUser(
  userId: string,
  experiment: Experiment
): Promise<ExperimentVariant> {
  // Consistent hashing for same user
  const hash = await hashUserId(userId + experiment.id)
  const index = hash % experiment.variants.length
  return experiment.variants[index]
}

async function trackExperimentMetrics(
  userId: string,
  variant: ExperimentVariant,
  metrics: {
    responseTime: number
    userSatisfaction?: number
    taskCompleted: boolean
    toolsUsed: number
    tokensUsed: number
    cost: number
  }
) {
  await supabase.from('experiment_metrics').insert({
    user_id: userId,
    variant,
    ...metrics,
    timestamp: new Date()
  })
}
```

**Estimated Effort:** 4-6 weeks

---

## 4. Proof-of-Concept Code

### POC: Enhanced Chatbot with Reasoning

**File:** `supabase/functions/ai-chat/poc-reasoning.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Configuration
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!
const MODEL = 'google/gemini-2.5-flash-preview-09-2025'

// Enhanced system prompt with reasoning
const REASONING_SYSTEM_PROMPT = `You are an intelligent AI assistant for Baito-AI.

REASONING FRAMEWORK:
Before every response, think through your approach:

1. UNDERSTAND: What is the user's intent?
   - Literal meaning vs. actual need
   - Context from conversation history
   - Ambiguities to resolve

2. PLAN: What's the optimal strategy?
   - Required tools and data
   - Sequence of actions
   - Edge cases

3. VALIDATE: Is this approach sound?
   - Will it solve the user's problem?
   - Any assumptions to verify?
   - Simpler alternatives?

4. EXECUTE: Carry out the plan

5. REFLECT: Check quality
   - Did I fully answer the question?
   - Should I suggest next steps?
   - Any uncertainties to mention?

CONVERSATION EXAMPLES:

Example 1 - Ambiguous Query:
User: "what is in my warehouse"

REASONING:
1. UNDERSTAND: Ambiguous - could mean inventory, data, or something else
2. PLAN: Clarify before proceeding
3. VALIDATE: Better to ask than assume
4. EXECUTE: Request clarification with helpful options
5. REFLECT: This will lead to better user experience

Response: "I'm not sure what you're referring to by 'warehouse'. Are you asking about:
- Candidates available in our system?
- Current projects and their status?
- Physical inventory (which I don't have access to)?
Could you clarify so I can help you better?"

Example 2 - Proactive Recognition:
User: "Looking for 10 promoters for Samsung product launch Date: December 15-17, 2024..."

REASONING:
1. UNDERSTAND: This is a job posting, not a query - user wants to create project and find staff
2. PLAN: Extract details → create project → search candidates
3. VALIDATE: Being proactive saves user time
4. EXECUTE: Use speed_add_project then query_candidates
5. REFLECT: Confirm actions and show results

Response: "I can help you with this Samsung promotion! I'll:
1. Create the project in the system
2. Search for Mandarin-speaking promoters
Let me do that now..."

Example 3 - Context Awareness:
User: "Show me Mr. DIY projects"
Assistant: [Shows 3 projects]
User: "Show me all"

REASONING:
1. UNDERSTAND: "all" refers to "all Mr. DIY projects" from previous context
2. PLAN: Use same query without limit
3. VALIDATE: Context is clear
4. EXECUTE: query_projects with company_name="Mr. DIY" and higher limit
5. REFLECT: Natural conversation flow maintained

Response: "Here are all 8 Mr. DIY projects in the system..."

Now apply this reasoning to all user queries.`

// Simplified POC handler
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  try {
    const { message } = await req.json()

    // Step 1: Generate reasoning
    console.log('🧠 Starting reasoning phase...')
    const reasoningResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://baito-ai.com',
        'X-Title': 'Baito-AI POC'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: REASONING_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Before responding to this query, explain your reasoning process:

User query: "${message}"

Provide reasoning in this format:
1. UNDERSTAND: [your analysis]
2. PLAN: [your strategy]
3. VALIDATE: [your checks]
4. EXECUTE: [what you'll do]
5. REFLECT: [quality check]

Reasoning:`
          }
        ],
        temperature: 0.3,
        max_tokens: 600
      })
    })

    const reasoningData = await reasoningResponse.json()
    const reasoning = reasoningData.choices[0].message.content

    console.log('🧠 REASONING:\n', reasoning)

    // Step 2: Generate response using reasoning
    const responseResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://baito-ai.com',
        'X-Title': 'Baito-AI POC'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: REASONING_SYSTEM_PROMPT },
          { role: 'assistant', content: `My reasoning: ${reasoning}` },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    })

    const responseData = await responseResponse.json()
    const reply = responseData.choices[0].message.content

    console.log('💬 RESPONSE:\n', reply)

    return new Response(JSON.stringify({
      reply,
      reasoning, // For debugging
      timestamp: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })

  } catch (error) {
    console.error('POC Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      status: 500
    })
  }
})
```

**Test this POC:**
```bash
# Deploy POC
supabase functions deploy ai-chat-poc-reasoning

# Test with curl
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/ai-chat-poc-reasoning \
  -H "Content-Type: application/json" \
  -d '{"message": "what is in my warehouse"}'

# Should see reasoning output before response
```

---

## 5. Recommended Next Steps

### Immediate (This Week):
1. ✅ Review this document with team
2. ✅ Deploy POC for testing (poc-reasoning.ts)
3. ✅ Compare POC responses vs. current chatbot
4. ✅ Collect baseline metrics (response quality, user satisfaction)

### Short-term (Next 2 Weeks):
1. 📋 Implement Phase 1.1 (Enhanced system prompt)
2. 📋 Add reasoning step to ReAct loop (Phase 1.2)
3. 📋 Create intent classification layer (Phase 1.3)
4. 📋 A/B test: Control vs. Enhanced prompting

### Medium-term (Next Month):
1. 📋 Evaluate reasoning models (Claude vs. o1)
2. 📋 Implement chosen reasoning model
3. 📋 Build multi-agent architecture
4. 📋 Add confidence scoring

### Long-term (Next Quarter):
1. 📋 Implement contextual memory system
2. 📋 Add proactive suggestions
3. 📋 Build learning pipeline
4. 📋 Deploy A/B testing framework

---

## 6. Success Metrics

### Primary KPIs:
- **Response Quality Score**: User rating 1-5 stars (Target: 4.5+)
- **Task Completion Rate**: % of queries fully resolved (Target: 85%+)
- **Clarification Rate**: % requiring follow-up (Target: <15%)
- **Context Understanding**: % correctly inferring ambiguous queries (Target: 90%+)

### Technical Metrics:
- **Response Time**: P50, P95, P99 latency (Target: <2s P95)
- **Token Usage**: Average tokens per interaction (Monitor for cost)
- **Tool Selection Accuracy**: % correct tool chosen (Target: 95%+)
- **Error Rate**: % of failed/invalid responses (Target: <2%)

### Cost Metrics:
- **Cost per Interaction**: Total API costs / interactions
- **ROI**: User time saved vs. AI costs
- **Budget per User**: Monthly spending per active user

---

## 7. Risk Mitigation

### Technical Risks:

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Reasoning adds too much latency | High | Use adaptive reasoning (complex queries only) |
| Token costs increase 3-5x | High | Implement budget controls, caching |
| Model quality degrades | Medium | A/B testing, rollback capability |
| Reasoning misleads AI | Medium | Validate reasoning, confidence scores |

### Business Risks:

| Risk | Impact | Mitigation |
|------|--------|-----------|
| User confusion with thinking process | Low | Hide reasoning by default, show on request |
| Increased infrastructure costs | Medium | Start with POC, scale gradually |
| Dependency on specific model | Medium | Abstract model interface, easy switching |

---

## 8. Budget Estimate

### Development Costs:
- Phase 1 (Quick Wins): 40-60 hours × $75/hr = **$3,000 - $4,500**
- Phase 2 (Architecture): 120-160 hours × $75/hr = **$9,000 - $12,000**
- Phase 3 (Advanced): 160-240 hours × $75/hr = **$12,000 - $18,000**

**Total Development:** $24,000 - $34,500

### Operational Costs (Monthly):

**Current Setup (Gemini Flash):**
- Cost: ~$0.10 per 1000 interactions
- Monthly (10,000 interactions): ~$1

**With Reasoning (Estimated):**
- Option A (Claude Extended Thinking): $3-5 per 1000 interactions
- Option B (OpenAI o1): $8-12 per 1000 interactions
- Option C (Enhanced prompting only): $0.30-0.50 per 1000 interactions

**Recommended Start:** Option C (3-5x current cost)

**Monthly @ 10K interactions:** $3-5/month (vs. $1 currently)

---

## 9. References & Resources

### Research Papers:
- [Chain-of-Thought Prompting Elicits Reasoning in Large Language Models](https://arxiv.org/abs/2201.11903)
- [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629)
- [Automatic Chain of Thought Prompting in Large Language Models](https://arxiv.org/abs/2210.03493)

### Industry Implementations:
- OpenAI Reasoning Models: https://platform.openai.com/docs/guides/reasoning
- Claude Extended Thinking: https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/extended-thinking-tips
- Google Gemini Thinking: https://ai.google.dev/gemini-api/docs/thinking
- Anthropic ReAct Pattern: https://www.anthropic.com/research/react

### Frameworks:
- LangChain: https://python.langchain.com/docs/modules/agents/
- AutoGen (Microsoft): https://github.com/microsoft/autogen
- LangGraph: https://github.com/langchain-ai/langgraph

### Best Practices Guides:
- Chain-of-Thought Complete Guide: https://www.vellum.ai/blog/chain-of-thought-prompting-cot
- Intent Classification: https://labelyourdata.com/articles/machine-learning/intent-classification
- Multi-Agent Systems: https://www.intuz.com/blog/how-to-build-multi-ai-agent-systems

---

## 10. Conclusion

This comprehensive upgrade plan transforms the Baito-AI chatbot from a reactive tool executor into an intelligent reasoning system that:

✅ **Thinks before responding**
✅ **Understands context and intent**
✅ **Handles ambiguity gracefully**
✅ **Acts proactively**
✅ **Learns from interactions**
✅ **Validates its own responses**

**Recommended Path:**
1. Start with **POC testing** (this week)
2. Implement **Phase 1 Quick Wins** (2 weeks)
3. Evaluate results and ROI
4. Proceed to **Phase 2** if metrics improve
5. Build toward **Phase 3** for production excellence

**Expected Outcomes:**
- 40-60% improvement in user satisfaction
- 30-50% reduction in clarification requests
- Better handling of complex, multi-step queries
- More natural, human-like conversations
- Foundation for continuous improvement

---

**Document Version:** 1.0
**Last Updated:** October 15, 2025
**Owner:** Kevin (Product Manager)
**Status:** Ready for Review & Implementation
