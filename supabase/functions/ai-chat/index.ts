// ==========================================
// AI Chat Edge Function
// Version: 1.0.0 (ReAct Pattern - MVP)
// ==========================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Types
interface ChatRequest {
  message: string
  conversationId?: string
}

interface ChatResponse {
  reply: string
  conversationId: string
  messageId: string
  toolsUsed?: string[]
}

interface Context {
  userId: string
  conversationId: string
  userRole: string
  permissions: string[]
}

// ==========================================
// Configuration
// ==========================================

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') // For embeddings (optional)
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const MODEL = 'google/gemini-2.5-flash-preview-09-2025'
const MAX_ITERATIONS = 5

// ==========================================
// System Prompt
// ==========================================

const SYSTEM_PROMPT = `You are an AI assistant for Baito-AI, a staffing and project management system.

Your role is to help users manage:
- Projects (create, update, query)
- Candidates (search, assign, manage)
- Staff assignments (schedule, conflicts)
- Expense claims (create, review)
- Payments (view, not create without approval)

IMPORTANT RULES:
1. Always use tools to query the database - never make up data
2. For write operations (create/update/delete), always confirm with user first
3. Respect user permissions - do not attempt unauthorized actions
4. Provide clear, concise responses
5. If unsure, ask clarifying questions

Current user context will be provided in each request.`

// ==========================================
// Tool Definitions
// ==========================================

const AVAILABLE_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'query_projects',
      description: 'Search and filter projects from database. Returns list of projects matching criteria.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['active', 'completed', 'cancelled', 'pending'],
            description: 'Filter by project status'
          },
          date_from: {
            type: 'string',
            format: 'date',
            description: 'Start date for date range filter (YYYY-MM-DD)'
          },
          date_to: {
            type: 'string',
            format: 'date',
            description: 'End date for date range filter (YYYY-MM-DD)'
          },
          company_name: {
            type: 'string',
            description: 'Filter by company name (partial match)'
          },
          limit: {
            type: 'number',
            default: 10,
            description: 'Maximum number of results to return'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'query_candidates',
      description: 'Search for candidates based on availability, skills, and other criteria.',
      parameters: {
        type: 'object',
        properties: {
          available_date: {
            type: 'string',
            format: 'date',
            description: 'Check availability for specific date'
          },
          skills: {
            type: 'array',
            items: { type: 'string' },
            description: 'Required skills (e.g., ["forklift", "warehouse"])'
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive'],
            description: 'Filter by candidate status'
          },
          limit: {
            type: 'number',
            default: 20,
            description: 'Maximum number of results'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_project_details',
      description: 'Get detailed information about a specific project.',
      parameters: {
        type: 'object',
        properties: {
          project_id: {
            type: 'string',
            description: 'UUID of the project'
          }
        },
        required: ['project_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'calculate_revenue',
      description: 'Calculate revenue for a given time period.',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['this_week', 'last_week', 'this_month', 'last_month', 'custom'],
            description: 'Time period for revenue calculation'
          },
          start_date: {
            type: 'string',
            format: 'date',
            description: 'Start date for custom period'
          },
          end_date: {
            type: 'string',
            format: 'date',
            description: 'End date for custom period'
          }
        },
        required: ['period']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'check_scheduling_conflicts',
      description: 'Check for scheduling conflicts (double-booked candidates, understaffed projects).',
      parameters: {
        type: 'object',
        properties: {
          date_from: {
            type: 'string',
            format: 'date',
            description: 'Start date for conflict check'
          },
          date_to: {
            type: 'string',
            format: 'date',
            description: 'End date for conflict check'
          }
        },
        required: ['date_from', 'date_to']
      }
    }
  }
]

// ==========================================
// Main Handler
// ==========================================

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Extract user from JWT Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    const token = authHeader.replace('Bearer ', '')

    // Create admin Supabase client (service role for DB operations)
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Create user-scoped client for auth verification
    const supabaseAuth = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        global: { headers: { Authorization: authHeader } }
      }
    )

    // Get authenticated user from JWT
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)
    if (authError || !user) {
      throw new Error('Invalid authentication token')
    }

    const userId = user.id

    // Parse request body
    const { message, conversationId }: ChatRequest = await req.json()

    if (!message) {
      throw new Error('Missing required field: message')
    }

    // Use admin client for all DB operations (bypasses RLS)
    const supabase = supabaseAdmin

    // Get or create conversation
    const finalConversationId = conversationId || await createConversation(supabase, userId)

    // Get user context
    const context = await getUserContext(supabase, userId, finalConversationId)

    // Load conversation history
    const conversationHistory = await loadConversationHistory(supabase, finalConversationId)

    // Generate embedding for semantic search
    const embedding = await getEmbedding(message)

    // Get semantic memory (Layer 3)
    const semanticMemory = await getSemanticMemory(supabase, finalConversationId, embedding)

    // Build context message
    const contextMessage = buildContextMessage(context, semanticMemory)

    // Execute ReAct loop
    const { reply, toolsUsed } = await reActLoop(message, conversationHistory, contextMessage, context, supabase)

    // Save user message
    const userMessageId = await saveMessage(supabase, finalConversationId, 'user', message, embedding)

    // Save assistant response
    const assistantEmbedding = await getEmbedding(reply)
    const assistantMessageId = await saveMessage(
      supabase,
      finalConversationId,
      'assistant',
      reply,
      assistantEmbedding,
      { tools_used: toolsUsed }
    )

    // Check if we need to summarize session
    await maybeSummarizeSession(supabase, finalConversationId)

    const response: ChatResponse = {
      reply,
      conversationId: finalConversationId,
      messageId: assistantMessageId,
      toolsUsed
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('Error in ai-chat function:', error)

    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

// ==========================================
// ReAct Loop Implementation
// ==========================================

async function reActLoop(
  userMessage: string,
  history: any[],
  contextMessage: string,
  context: Context,
  supabase: any
): Promise<{ reply: string; toolsUsed: string[] }> {

  const toolsUsed: string[] = []
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'system', content: contextMessage },
    ...history,
    { role: 'user', content: userMessage }
  ]

  let iteration = 0

  while (iteration < MAX_ITERATIONS) {
    // 1. REASON: Ask LLM what to do next
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
        tools: AVAILABLE_TOOLS,
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 1000
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenRouter API error: ${error}`)
    }

    const data = await response.json()
    const assistantMessage = data.choices[0].message

    // 2. ACT: Execute tool if requested
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolResults = []

      for (const toolCall of assistantMessage.tool_calls) {
        const toolName = toolCall.function.name
        const toolArgs = JSON.parse(toolCall.function.arguments)

        console.log(`Executing tool: ${toolName}`, toolArgs)
        toolsUsed.push(toolName)

        try {
          // Execute tool with RLS context
          const result = await executeTool(toolName, toolArgs, context, supabase)

          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            name: toolName,
            content: JSON.stringify(result)
          })

          // Log action
          await logAction(supabase, context.userId, context.conversationId, toolName, toolArgs, result, true)

        } catch (error) {
          console.error(`Tool execution error (${toolName}):`, error)

          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            name: toolName,
            content: JSON.stringify({ error: error.message })
          })

          // Log failed action
          await logAction(supabase, context.userId, context.conversationId, toolName, toolArgs, null, false, error.message)
        }
      }

      // 3. OBSERVE: Add tool results to conversation
      messages.push(assistantMessage)
      messages.push(...toolResults)

      iteration++
      continue // Loop back to REASON
    }

    // 4. DONE: No more tools needed, return response
    return {
      reply: assistantMessage.content,
      toolsUsed
    }
  }

  throw new Error('Max iterations reached')
}

// ==========================================
// Tool Execution
// ==========================================

async function executeTool(
  toolName: string,
  args: any,
  context: Context,
  supabase: any
): Promise<any> {

  // Validate permissions
  if (!hasPermission(context, toolName)) {
    throw new Error(`Permission denied: User does not have access to ${toolName}`)
  }

  // Route to appropriate handler
  switch (toolName) {
    case 'query_projects':
      return await queryProjects(supabase, args, context)

    case 'query_candidates':
      return await queryCandidates(supabase, args, context)

    case 'get_project_details':
      return await getProjectDetails(supabase, args, context)

    case 'calculate_revenue':
      return await calculateRevenue(supabase, args, context)

    case 'check_scheduling_conflicts':
      return await checkSchedulingConflicts(supabase, args, context)

    default:
      throw new Error(`Unknown tool: ${toolName}`)
  }
}

// ==========================================
// Tool Implementations (MVP - Query tools only)
// ==========================================

async function queryProjects(supabase: any, args: any, context: Context) {
  let query = supabase
    .from('projects')
    .select('id, title, start_date, end_date, client_id, status, priority, crew_count, filled_positions, venue_address, working_hours_start, working_hours_end, brand_name')
    .order('start_date', { ascending: false })

  if (args.status) {
    query = query.eq('status', args.status)
  }

  if (args.date_from) {
    query = query.gte('start_date', args.date_from)
  }

  if (args.date_to) {
    query = query.lte('start_date', args.date_to)
  }

  query = query.limit(args.limit || 10)

  const { data, error } = await query

  if (error) throw error

  return {
    projects: data,
    count: data.length,
    message: `Found ${data.length} project(s)`
  }
}

async function queryCandidates(supabase: any, args: any, context: Context) {
  console.log('[queryCandidates] Starting with args:', JSON.stringify(args))

  let query = supabase
    .from('candidates')
    .select('id, full_name, ic_number, phone_number, email, status, has_vehicle, vehicle_type, address, skills')
    .order('full_name', { ascending: true })

  if (args.status) {
    console.log('[queryCandidates] Filtering by status:', args.status)
    query = query.eq('status', args.status)
  }

  if (args.has_vehicle !== undefined) {
    console.log('[queryCandidates] Filtering by has_vehicle:', args.has_vehicle)
    query = query.eq('has_vehicle', args.has_vehicle)
  }

  // Filter by availability date if provided
  if (args.available_date) {
    // Check candidates NOT assigned to any project on that date
    const { data: busyCandidates } = await supabase
      .from('project_staff')
      .select('candidate_id')
      .eq('status', 'confirmed')

    const busyIds = busyCandidates?.map((s: any) => s.candidate_id) || []
    if (busyIds.length > 0) {
      query = query.not('id', 'in', `(${busyIds.join(',')})`)
    }
  }

  query = query.limit(args.limit || 20)

  console.log('[queryCandidates] Executing Supabase query...')
  const { data, error } = await query

  if (error) {
    console.error('[queryCandidates] ERROR:', JSON.stringify(error))
    throw error
  }

  console.log(`[queryCandidates] SUCCESS: Found ${data.length} candidates`)

  return {
    candidates: data,
    count: data.length,
    message: `Found ${data.length} candidate(s)`
  }
}

async function getProjectDetails(supabase: any, args: any, context: Context) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', args.project_id)
    .single()

  if (error) throw error

  // Get project staff separately
  const { data: staff } = await supabase
    .from('project_staff')
    .select('candidate_id, role, status, candidates(id, full_name, phone_number, email)')
    .eq('project_id', args.project_id)

  return {
    ...data,
    staff: staff || []
  }
}

async function calculateRevenue(supabase: any, args: any, context: Context) {
  // Revenue calculation with date filtering
  let query = supabase
    .from('projects')
    .select('id, budget, status, start_date')
    .eq('status', 'completed')

  // Add date filtering based on period
  if (args.period === 'this_month' || args.month) {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    query = query.gte('start_date', firstDay.toISOString().split('T')[0])
                 .lte('start_date', lastDay.toISOString().split('T')[0])
  } else if (args.date_from) {
    query = query.gte('start_date', args.date_from)
  }

  if (args.date_to) {
    query = query.lte('start_date', args.date_to)
  }

  const { data, error } = await query

  if (error) throw error

  const total = data.reduce((sum: number, p: any) => sum + (p.budget || 0), 0)

  return {
    period: args.period || 'custom range',
    total_revenue: total,
    project_count: data.length,
    message: `Total revenue from ${data.length} completed projects: RM ${total.toLocaleString()}`
  }
}

async function checkSchedulingConflicts(supabase: any, args: any, context: Context) {
  const { date_from, date_to } = args

  // Get all projects in date range with staff assignments
  const { data: projects, error: projError } = await supabase
    .from('projects')
    .select(`
      id,
      title,
      start_date,
      end_date,
      crew_count,
      filled_positions,
      status,
      project_staff(
        candidate_id,
        role,
        status,
        candidates(id, full_name, phone_number)
      )
    `)
    .gte('start_date', date_from)
    .lte('start_date', date_to)
    .neq('status', 'cancelled')

  if (projError) throw projError

  const conflicts: any[] = []

  // 1. Check for understaffed projects
  const understaffed = projects.filter((p: any) =>
    p.filled_positions < p.crew_count
  )

  understaffed.forEach((project: any) => {
    conflicts.push({
      type: 'understaffed',
      severity: 'high',
      project_id: project.id,
      project_title: project.title,
      start_date: project.start_date,
      needed: project.crew_count - project.filled_positions,
      message: `Project "${project.title}" needs ${project.crew_count - project.filled_positions} more staff members`
    })
  })

  // 2. Check for double-booked candidates
  const candidateSchedules: Record<string, any[]> = {}

  projects.forEach((project: any) => {
    if (project.project_staff) {
      project.project_staff.forEach((staff: any) => {
        if (!candidateSchedules[staff.candidate_id]) {
          candidateSchedules[staff.candidate_id] = []
        }
        candidateSchedules[staff.candidate_id].push({
          project_id: project.id,
          project_title: project.title,
          project_date: project.start_date,
          candidate_name: staff.candidates?.full_name || 'Unknown',
          role: staff.role
        })
      })
    }
  })

  // Find candidates with multiple assignments
  Object.entries(candidateSchedules).forEach(([candidateId, assignments]) => {
    if (assignments.length > 1) {
      // Check if assignments overlap by date
      const dates = assignments.map(a => a.project_date)
      const uniqueDates = new Set(dates)

      if (dates.length !== uniqueDates.size) {
        // Double booking detected - same date
        conflicts.push({
          type: 'double_booking',
          severity: 'critical',
          candidate_id: candidateId,
          candidate_name: assignments[0].candidate_name,
          projects: assignments,
          message: `${assignments[0].candidate_name} is assigned to ${assignments.length} projects on the same date`
        })
      }
    }
  })

  // 3. Check for overstaffed projects (nice to have)
  const overstaffed = projects.filter((p: any) =>
    p.filled_positions > p.crew_count
  )

  overstaffed.forEach((project: any) => {
    conflicts.push({
      type: 'overstaffed',
      severity: 'low',
      project_id: project.id,
      project_title: project.title,
      start_date: project.start_date,
      excess: project.filled_positions - project.crew_count,
      message: `Project "${project.title}" has ${project.filled_positions - project.crew_count} extra staff members`
    })
  })

  return {
    conflicts,
    understaffed_count: understaffed.length,
    double_booked_count: Object.values(candidateSchedules).filter(a => a.length > 1).length,
    overstaffed_count: overstaffed.length,
    total_conflicts: conflicts.length,
    message: conflicts.length === 0
      ? 'No scheduling conflicts detected'
      : `Found ${conflicts.length} scheduling conflicts: ${understaffed.length} understaffed, ${Object.values(candidateSchedules).filter(a => a.length > 1).length} double-booked, ${overstaffed.length} overstaffed`
  }
}

// ==========================================
// Helper Functions
// ==========================================

async function createConversation(supabase: any, userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('ai_conversations')
    .insert({
      user_id: userId,
      session_id: crypto.randomUUID()
    })
    .select()
    .single()

  if (error) throw error

  return data.id
}

async function getUserContext(supabase: any, userId: string, conversationId: string): Promise<Context> {
  // Try to get user role from users table (auth schema)
  const { data: user, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (error || !user) {
    console.warn('Could not fetch user, using default permissions')
    return {
      userId,
      conversationId,
      userRole: 'user',
      permissions: ['read:projects', 'read:candidates']
    }
  }

  return {
    userId,
    conversationId,
    userRole: user.role || 'user',
    permissions: getPermissionsForRole(user.role)
  }
}

function getPermissionsForRole(role: string): string[] {
  const permissionMap: Record<string, string[]> = {
    'super_admin': ['*'],
    'admin': ['read:*', 'write:*', 'delete:*'],
    'manager': ['read:*', 'write:projects', 'write:candidates', 'read:payments'],
    'coordinator': ['read:projects', 'read:candidates', 'write:projects'],
    'staff': ['read:projects'],
    'user': ['read:projects', 'read:candidates']
  }

  return permissionMap[role] || permissionMap['user']
}

function hasPermission(context: Context, toolName: string): boolean {
  // Super users have all permissions
  if (context.permissions.includes('*')) return true

  // Map tools to required permissions
  const toolPermissions: Record<string, string> = {
    'query_projects': 'read:projects',
    'query_candidates': 'read:candidates',
    'get_project_details': 'read:projects',
    'calculate_revenue': 'read:projects',
    'check_scheduling_conflicts': 'read:projects'
  }

  const required = toolPermissions[toolName]
  if (!required) return false

  return context.permissions.includes(required) ||
         context.permissions.includes('read:*') ||
         context.permissions.includes('*')
}

async function loadConversationHistory(supabase: any, conversationId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('ai_messages')
    .select('type, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(10) // Layer 1: Working memory

  if (error) throw error

  return data.map((msg: any) => ({
    role: msg.type === 'user' ? 'user' : 'assistant',
    content: msg.content
  }))
}

async function getSemanticMemory(supabase: any, conversationId: string, embedding: number[] | null) {
  if (!embedding) {
    console.log('No embedding provided, skipping semantic search')
    return []
  }

  const { data, error } = await supabase.rpc('search_conversation_history', {
    query_embedding: embedding,
    p_conversation_id: conversationId,
    match_count: 5
  })

  if (error) {
    console.warn('Semantic search failed:', error)
    return []
  }

  return data || []
}

function buildContextMessage(context: Context, semanticMemory: any[]): string {
  let msg = `Current user context:
- Role: ${context.userRole}
- Permissions: ${context.permissions.join(', ')}
`

  if (semanticMemory.length > 0) {
    msg += `\nRelevant past context:\n`
    semanticMemory.forEach(mem => {
      msg += `- ${mem.content.substring(0, 100)}...\n`
    })
  }

  return msg
}

async function getEmbedding(text: string): Promise<number[] | null> {
  if (!OPENAI_API_KEY) {
    console.log('OPENAI_API_KEY not set, skipping embedding generation')
    return null
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text
      })
    })

    if (!response.ok) {
      console.error('Failed to generate embedding:', response.statusText)
      return null
    }

    const data = await response.json()
    return data.data[0].embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    return null
  }
}

async function saveMessage(
  supabase: any,
  conversationId: string,
  type: string,
  content: string,
  embedding: number[] | null,
  metadata: any = {}
): Promise<string> {
  const { data, error } = await supabase
    .from('ai_messages')
    .insert({
      conversation_id: conversationId,
      type,
      content,
      embedding,
      metadata
    })
    .select()
    .single()

  if (error) throw error

  return data.id
}

async function logAction(
  supabase: any,
  userId: string,
  conversationId: string,
  actionType: string,
  parameters: any,
  result: any,
  success: boolean,
  errorMessage?: string
) {
  await supabase
    .from('ai_action_logs')
    .insert({
      user_id: userId,
      conversation_id: conversationId,
      action_type: actionType,
      parameters,
      result,
      success,
      error_message: errorMessage
    })
}

async function maybeSummarizeSession(supabase: any, conversationId: string) {
  // Check message count
  const { count } = await supabase
    .from('ai_messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)

  // Summarize after every 20 messages
  if (count && count % 20 === 0) {
    // TODO: Implement summarization with LLM
    console.log(`Should summarize conversation ${conversationId} (${count} messages)`)
  }
}

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/ai-chat' \
    --header 'Authorization: Bearer YOUR_ANON_KEY' \
    --header 'Content-Type: application/json' \
    --data '{"message":"Show me today's projects", "userId":"user-uuid"}'

*/
