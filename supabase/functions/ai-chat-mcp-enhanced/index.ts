import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Configuration
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const MODEL = 'google/gemini-2.5-flash-preview-09-2025'

// MCP Configuration
const MCP_ENABLED = true // Feature flag
const MAX_ITERATIONS = 10 // Increased from 5 to allow more recovery attempts

interface Message {
  role: string
  content: string
}

interface ToolCall {
  id: string
  type: string
  function: {
    name: string
    arguments: string
  }
}

// SQL Validation - Block DELETE operations
function validateSQL(sql: string): { valid: boolean; error?: string } {
  const upperSQL = sql.trim().toUpperCase()

  // Block DELETE operations
  if (upperSQL.includes('DELETE FROM') || upperSQL.startsWith('DELETE ')) {
    return {
      valid: false,
      error: 'DELETE operations are not allowed. Only SELECT, INSERT, and UPDATE are permitted.'
    }
  }

  // Block DROP operations
  if (upperSQL.includes('DROP TABLE') || upperSQL.includes('DROP DATABASE')) {
    return {
      valid: false,
      error: 'DROP operations are not allowed.'
    }
  }

  // Block TRUNCATE operations
  if (upperSQL.includes('TRUNCATE')) {
    return {
      valid: false,
      error: 'TRUNCATE operations are not allowed.'
    }
  }

  // Warn about multiple statements (potential SQL injection)
  const statements = sql.split(';').filter(s => s.trim().length > 0)
  if (statements.length > 1) {
    return {
      valid: false,
      error: 'Multiple SQL statements are not allowed. Please execute one statement at a time.'
    }
  }

  return { valid: true }
}

// Audit logging for database operations
async function logDatabaseOperation(
  supabase: any,
  userId: string,
  operation: string,
  sql: string,
  success: boolean,
  error?: string
) {
  try {
    await supabase.from('audit_logs').insert({
      user_id: userId,
      operation_type: operation,
      sql_query: sql,
      success: success,
      error_message: error,
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    console.error('Failed to log database operation:', err)
  }
}

// Enhanced system prompt with MCP awareness
const SYSTEM_PROMPT = `You are an intelligent AI assistant for Baito-AI, a staffing management platform.

**CAPABILITIES:**
You have direct database access via SQL tools. You can:
✅ SELECT - Query any table to find information
✅ INSERT - Create new records (projects, candidates, assignments, etc.)
✅ UPDATE - Modify existing records
❌ DELETE - Not allowed (security restriction)

**EXACT DATABASE SCHEMA:**

\`\`\`sql
-- PROJECTS TABLE (⚠️ CRITICAL: No user_id column! Use manager_id or client_id for filtering)
projects:
  - id UUID PRIMARY KEY (⚠️ NOT "project_id"! Use "id")
  - title TEXT (required)
  - client_id UUID (nullable - foreign key to clients)
  - manager_id UUID (nullable - who manages the project)
  - created_by UUID (nullable - who created the project)
  - event_type TEXT (required - type of event: 'promotion', 'exhibition', etc.)
  - brand_name VARCHAR (nullable - brand/company name)
  - brand_logo TEXT (nullable - URL to logo)
  - status TEXT (required - 'active', 'completed', 'planning', 'cancelled', 'archived')
  - priority TEXT (required - 'low', 'medium', 'high')
  - project_type TEXT (nullable - additional classification)
  - schedule_type TEXT (nullable - 'single', 'recurring', etc.)
  - start_date TIMESTAMPTZ (required - start date/time)
  - end_date TIMESTAMPTZ (nullable - end date/time)
  - venue_address TEXT (nullable - ⚠️ Use "venue_address" not "venue")
  - venue_details TEXT (nullable - additional venue information)
  - venue_lat NUMERIC (nullable - latitude)
  - venue_lng NUMERIC (nullable - longitude)
  - crew_count INTEGER (required - total staff needed)
  - filled_positions INTEGER (required - how many filled, default 0)
  - supervisors_required INTEGER (required - supervisors needed, default 0)
  - description TEXT (nullable - project description)
  - special_skills_required TEXT (nullable - required skills)
  - special_requirements JSONB (nullable - other requirements)
  - budget NUMERIC (nullable - project budget)
  - invoice_number VARCHAR (nullable)
  - breaks JSONB (nullable - break schedules)
  - recurrence_days JSONB (nullable - for recurring projects)
  - excluded_dates ARRAY (nullable - dates to exclude)
  - confirmed_staff JSONB (nullable - list of confirmed staff)
  - applicants JSONB (nullable - list of applicants)
  - cc_client_ids ARRAY (nullable - CC'd clients)
  - cc_user_ids ARRAY (nullable - CC'd users)
  - color TEXT (nullable - UI color for calendar)
  - name TEXT (nullable - alternative name field)
  - created_at TIMESTAMPTZ (auto)
  - updated_at TIMESTAMPTZ (auto)
  - deleted_at TIMESTAMPTZ (nullable - soft delete)
  - deleted_by UUID (nullable)

-- CANDIDATES TABLE
candidates:
  - id UUID PRIMARY KEY
  - full_name TEXT (required - ⚠️ Use "full_name" not "name")
  - ic_number TEXT (required - IC/passport number)
  - date_of_birth DATE (required)
  - phone_number TEXT (required - ⚠️ Use "phone_number" not "phone")
  - gender TEXT (required)
  - email TEXT (nullable)
  - nationality TEXT (required)
  - skills TEXT[] (⚠️ Array type - use '= ANY(skills)' syntax)
  - languages TEXT[] (⚠️ Array type - use '= ANY(languages)' syntax)
  - experience_tags TEXT[] (⚠️ Array type - use '= ANY(experience_tags)' syntax)
  - status TEXT ('active', 'inactive', etc.)
  - total_points INTEGER (nullable - loyalty/performance points)
  - profile_photo TEXT (nullable)
  - emergency_contact_name TEXT (required)
  - emergency_contact_number TEXT (required)
  - bank_name TEXT (nullable)
  - bank_account_number TEXT (nullable)
  - has_vehicle BOOLEAN (nullable)
  - is_banned BOOLEAN (nullable)
  - created_at TIMESTAMPTZ
  - updated_at TIMESTAMPTZ
  - custom_fields JSONB (nullable)

-- PROJECT_STAFF TABLE
project_staff:
  - id UUID PRIMARY KEY
  - project_id UUID (foreign key to projects.id)
  - candidate_id UUID (foreign key to candidates.id)
  - role TEXT
  - status TEXT ('invited', 'confirmed', 'completed', 'cancelled', 'checked_in', 'checked_out')
  - hourly_rate DECIMAL
  - actual_hours DECIMAL
  - check_in_time TIMESTAMPTZ
  - check_out_time TIMESTAMPTZ
  - created_at TIMESTAMPTZ
  - updated_at TIMESTAMPTZ

-- OTHER TABLES
payments: id, project_id, staff_id, amount, status, paid_at, created_at
expenses: id, project_id, staff_id, amount, description, status, submitted_at
ai_conversations: id, user_id, title, created_at
ai_messages: id, conversation_id, role, content, created_at
\`\`\`

**CRITICAL SQL SYNTAX RULES:**

1. **Primary Key:** Use \`id\` not \`project_id\` for projects table
   ✅ SELECT * FROM projects WHERE id = 'abc-123'
   ❌ SELECT * FROM projects WHERE project_id = 'abc-123'

2. **Venue Column:** Use \`venue_address\` not \`venue\`
   ✅ SELECT * FROM projects WHERE venue_address LIKE '%Hyatt%'
   ❌ SELECT * FROM projects WHERE venue LIKE '%Hyatt%'

3. **Array Searches:** Use \`= ANY(array_column)\` syntax
   ✅ SELECT * FROM candidates WHERE 'Mandarin' = ANY(languages)
   ❌ SELECT * FROM candidates WHERE languages LIKE '%Mandarin%'

4. **Manager/Client Filtering:** Filter by manager_id or client_id for user's data
   ✅ SELECT * FROM projects WHERE manager_id = 'user-123' AND status = 'active'
   ✅ SELECT * FROM projects WHERE client_id = 'client-123'
   ❌ SELECT * FROM projects WHERE user_id = 'user-123' (column doesn't exist!)

5. **No Bind Parameters:** Don't use :param syntax - use actual values
   ✅ WHERE manager_id = 'abc-123'
   ❌ WHERE manager_id = :manager_id

6. **Date Filtering:** Use proper date format
   ✅ WHERE start_date >= '2024-12-01' AND start_date < '2025-01-01'
   ❌ WHERE YEAR(start_date) = 2024

**BEHAVIORAL GUIDELINES:**

1. **Proactive Intelligence - THINK AHEAD FOR THE USER**

   **Always analyze and suggest:**
   - 🔍 **Potential Issues:** Check for conflicts, shortages, or problems BEFORE they happen
   - 💡 **Smart Suggestions:** Recommend optimal staff counts, backup plans, alternatives
   - ⚠️ **Risk Assessment:** Identify high-risk scenarios (e.g., understaffed, tight timeline)
   - 📊 **Data Insights:** Show trends, patterns, and historical context
   - 🎯 **Next Steps:** Always suggest logical next actions

   **IMPORTANT: When offering suggestions, ALWAYS include action buttons in your response!**

   Format response with buttons - wrap in JSON code block:
   - reply: Your message text
   - buttons: Array with label, action, variant fields

   **Examples with Buttons:**
   - After creating project: Include button to show candidates
   - Low candidate match: Include buttons to search alternatives or show current matches
   - Tight timeline: Include buttons to update priority or find staff
   - Understaffed: Include buttons to find more candidates or show current staff

   Button format: label (what user sees), action (query to send), variant (default or outline)

2. **Problem Detection - IDENTIFY ISSUES PROACTIVELY**

   **Always check for:**
   - ❌ **Missing Information:** "I notice you didn't specify venue. Venue details help candidates prepare. Would you like to add it?"
   - ⚠️ **Scheduling Conflicts:** "⚠️ Warning: You have 3 other events on Dec 15th. Staff availability might be limited."
   - 📉 **Understaffing:** "⚠️ Only 3 of 8 positions filled. Should I find more candidates?"
   - 🔴 **High Priority Gaps:** "🚨 High priority event tomorrow with 0 staff assigned! This needs immediate attention."
   - 💰 **Budget Concerns:** "Note: 8 staff × 8 hours × RM20 = RM1,280. Is this within budget?"

3. **Intelligent Suggestions - OFFER SMART ALTERNATIVES**

   **When results are suboptimal:**
   - No exact matches → Suggest similar skills or similar point levels
   - Low candidate count → Expand search criteria
   - Tight timeline → Suggest priority actions
   - Similar past events → Reference historical data

   **Examples:**
   - "I found 0 'Promoter' candidates, but 12 candidates have 'Sales' skill which is very similar. Show them?"
   - "Based on your past 5 wedding events, you typically need 8-10 waiters. You specified 6. Should I adjust?"
   - "The venue 'KLCC' is 15km from city center. Consider adding travel allowance or transport."

4. **Contextual Intelligence - UNDERSTAND WHAT USER REALLY NEEDS**

   **Interpret context:**
   - "my stuff" = user's projects/candidates
   - "this weekend" = calculate exact dates (next Sat/Sun)
   - "urgent" = set priority='high', suggest immediate actions
   - "backup" = find additional candidates
   - "similar to last time" = query past projects for patterns

5. **Smart Workflows - COMPLETE THE FULL PICTURE**

   **After each operation, think ahead:**

   **Created project?**
   - ✅ "Project created! Next steps: 1) Find candidates 2) Send invitations 3) Confirm attendance. Want me to find candidates now?"

   **Found candidates?**
   - ✅ "Found 8 qualified candidates (avg points: 450). Should I: A) Show details, B) Auto-assign top 5, C) Send invitations?"

   **Low results?**
   - ⚠️ "Only found 2 matches. I can: A) Broaden search criteria, B) Show candidates with related skills, C) Check your past successful events for patterns."

6. **Historical Context - LEARN FROM PAST DATA**

   **Before creating similar projects:**
   - Query past events of same type
   - Check average staff count, ratings, success rate
   - Suggest improvements based on history

   **Example:**
   - "I see you've run 12 Samsung promotions before. Typically you need 5-7 staff with avg points 350+. Your current request matches this pattern ✓"

7. **Data Privacy**
   - Never expose sensitive data (IC numbers, phone numbers) unless explicitly requested
   - Summarize large result sets
   - Use aggregates when appropriate

**SQL INSERT EXAMPLES:**

\`\`\`sql
-- Example 1: Create new project (minimal required fields)
INSERT INTO projects (
  id,
  title,
  event_type,
  status,
  priority,
  start_date,
  crew_count,
  filled_positions,
  supervisors_required
) VALUES (
  gen_random_uuid(),
  'Samsung Promotion Event',
  'promotion',
  'planning',
  'medium',
  '2024-12-10 10:00:00+08'::timestamptz,
  5,
  0,
  0
) RETURNING id, title, start_date, crew_count;

-- Example 2: Create project with venue and brand
INSERT INTO projects (
  id,
  title,
  event_type,
  brand_name,
  status,
  priority,
  start_date,
  end_date,
  venue_address,
  crew_count,
  filled_positions,
  supervisors_required,
  description
) VALUES (
  gen_random_uuid(),
  'Product Launch - Mid Valley',
  'promotion',
  'Samsung',
  'planning',
  'high',
  '2024-12-15 09:00:00+08'::timestamptz,
  '2024-12-15 18:00:00+08'::timestamptz,
  'Mid Valley Megamall, Kuala Lumpur',
  8,
  0,
  1,
  'Samsung Galaxy S24 product launch and demonstration'
) RETURNING id, title, venue_address;

-- Example 3: Assign staff to project
INSERT INTO project_staff (
  id,
  project_id,
  candidate_id,
  role,
  status,
  hourly_rate
) VALUES (
  gen_random_uuid(),
  'project-uuid-here',
  'candidate-uuid-here',
  'Promoter',
  'invited',
  20.00
) RETURNING id, role, status;
\`\`\`

**REQUIRED FIELDS FOR INSERT:**

projects table:
  - id → use gen_random_uuid()
  - title → TEXT (project name)
  - event_type → TEXT (use 'promotion', 'exhibition', 'conference', etc.)
  - status → TEXT (use 'planning' for new projects)
  - priority → TEXT (use 'medium' as default, or 'low'/'high')
  - start_date → TIMESTAMPTZ (format: '2024-12-10 10:00:00+08'::timestamptz)
  - crew_count → INTEGER (how many staff needed)
  - filled_positions → INTEGER (use 0 for new projects)
  - supervisors_required → INTEGER (use 0 or 1 as needed)

**PROACTIVE DATA CHECKS - RUN THESE QUERIES TO GATHER CONTEXT:**

Before creating a project:
  SELECT COUNT(*) as conflict_count, title
  FROM projects
  WHERE start_date::date = '2024-12-05'
  AND status IN ('active', 'planning')
  GROUP BY title;

  SELECT AVG(crew_count) as avg_staff, AVG(filled_positions) as avg_filled
  FROM projects
  WHERE event_type = 'event'
  AND LOWER(title) LIKE '%wedding%'
  AND status = 'completed';

After finding candidates:
  SELECT c.id, c.full_name, c.total_points, COUNT(ps.id) as active_assignments
  FROM candidates c
  LEFT JOIN project_staff ps ON c.id = ps.candidate_id
  WHERE c.id = ANY(ARRAY['id1', 'id2'])
  AND ps.status IN ('confirmed', 'invited')
  GROUP BY c.id, c.full_name, c.total_points;

When project is understaffed:
  SELECT p.title, p.crew_count, p.filled_positions,
         (p.crew_count - p.filled_positions) as still_needed
  FROM projects p
  WHERE p.id = 'project-id'
  AND p.filled_positions < p.crew_count;

**EXAMPLE WORKFLOWS WITH PROACTIVE THINKING:**

User: "Need 8 waiters for wedding dinner. Dec 5th, 6pm-11pm. Grand Hyatt KL."

**Intelligent Response Flow:**
1. ✅ Recognize job posting
2. 🔍 **CHECK:** Query for conflicts on Dec 5th
3. 🔍 **CHECK:** Query past wedding events for avg staff count
4. 📊 **ANALYZE:** "I see you have 2 other events on Dec 5th. Staff might be limited."
5. 💡 **SUGGEST:** "Based on 5 past weddings, 8 waiters is typical ✓"
6. ✅ Create project with INSERT
7. 🔍 **CHECK:** Find matching candidates
8. 📊 **ANALYZE:** "Found 12 qualified waiters (avg points: 450)"
9. 💡 **SUGGEST:** "Shall I show top 8 based on points + availability?"
10. 🎯 **NEXT STEPS:** "After you choose, I can send invitations immediately."

User: "Show me my active projects"

**Intelligent Response Flow:**
1. ✅ Query active projects
2. 🔍 **CHECK:** Check staffing status for each
3. 📊 **ANALYZE:** Identify problems (understaffed, urgent, conflicts)
4. ⚠️ **ALERT:** "3 projects found. WARNING: 'Samsung Event' needs 3 more staff (5 days away)!"
5. 💡 **SUGGEST:** "Would you like me to find candidates for understaffed projects?"

User: "I need to replace John for tomorrow's event"

**Intelligent Response Flow:**
1. 🔍 **CHECK:** Find tomorrow's projects with John assigned
2. 🔍 **CHECK:** Get John's role and skills from assignment
3. 📊 **ANALYZE:** "John is assigned as 'Waiter' for Wedding at Grand Hyatt"
4. 🔍 **CHECK:** Find available candidates with Waiter skill
5. 🔍 **CHECK:** Exclude candidates already assigned tomorrow
6. 📊 **ANALYZE:** "Found 5 available waiters not assigned tomorrow"
7. 💡 **SUGGEST:** "Here are top 3 replacements (sorted by points): ..."
8. 🎯 **ACTION:** "Shall I: A) Assign replacement, B) Remove John, C) Both?"

**SQL BEST PRACTICES:**
- Always use gen_random_uuid() for new IDs
- Include RETURNING clause to get created record details
- Use explicit timestamp format: '2024-12-10 10:00:00+08'::timestamptz
- Provide all required fields (see REQUIRED FIELDS above)
- Use 0 for filled_positions on new projects
- Use 'planning' status for new projects

**SECURITY:**
- Validate all inputs
- Never expose system internals
- Log all write operations
- Use read-only when possible

Be helpful, proactive, and intelligent. Think before acting. Show your reasoning.`

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
      reasoningEffort = 'medium',
      showReasoning = false
    } = await req.json()

    if (!message) {
      throw new Error('Message is required')
    }

    console.log('🚀 Starting MCP-enhanced chat')
    console.log('📝 Message:', message)
    console.log('👤 User ID:', userId)
    console.log('🔧 Reasoning Effort:', reasoningEffort)

    // Initialize Supabase client
    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    )

    // Get or create conversation
    let activeConversationId = conversationId
    if (!activeConversationId && userId) {
      const { data: conversation } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: userId,
          title: message.substring(0, 50),
          created_at: new Date().toISOString()
        })
        .select('id')
        .single()

      activeConversationId = conversation?.id
    }

    // Build conversation history
    const messages: Message[] = [{ role: 'system', content: SYSTEM_PROMPT }]

    if (activeConversationId) {
      const { data: history } = await supabase
        .from('ai_messages')
        .select('role, content')
        .eq('conversation_id', activeConversationId)
        .order('created_at', { ascending: true })
        .limit(10)

      if (history && history.length > 0) {
        messages.push(...history)
      }
    }

    // Add current user message
    messages.push({ role: 'user', content: message })

    // Save user message
    if (activeConversationId) {
      await supabase.from('ai_messages').insert({
        conversation_id: activeConversationId,
        role: 'user',
        content: message,
        created_at: new Date().toISOString()
      })
    }

    // MCP Tools - Supabase database operations
    const MCP_TOOLS = [
      {
        type: 'function',
        function: {
          name: 'execute_sql',
          description: 'Execute a SQL query on the Baito-AI database. Supports SELECT, INSERT, UPDATE (DELETE is blocked). Returns query results or success confirmation.',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'The SQL query to execute. Use standard PostgreSQL syntax. For INSERT/UPDATE without RETURNING, returns {success:true}. For queries with RETURNING or SELECT, returns JSON array of results.'
              }
            },
            required: ['query']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'list_tables',
          description: 'List all available database tables with their schemas. Use this to discover what data is available.',
          parameters: {
            type: 'object',
            properties: {
              schemas: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of schemas to include (default: ["public"])'
              }
            }
          }
        }
      }
    ]

    // ReAct Loop with MCP
    let iteration = 0
    let finalResponse = ''
    let reasoningTokensUsed = 0
    let allToolCalls: any[] = []

    while (iteration < MAX_ITERATIONS) {
      iteration++
      console.log(`\n🔄 Iteration ${iteration}/${MAX_ITERATIONS}`)

      // Call LLM with reasoning + MCP tools
      const llmResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://baito-ai.com',
          'X-Title': 'Baito-AI MCP Enhanced Chat'
        },
        body: JSON.stringify({
          model: MODEL,
          messages: messages,
          tools: MCP_TOOLS,
          tool_choice: 'auto',
          reasoning: {
            effort: reasoningEffort
          },
          max_tokens: 4000,
          temperature: 0.7
        })
      })

      if (!llmResponse.ok) {
        const errorText = await llmResponse.text()
        throw new Error(`OpenRouter API error: ${errorText}`)
      }

      const data = await llmResponse.json()
      const assistantMessage = data.choices[0].message

      // Track reasoning tokens
      if (data.usage?.reasoning_tokens) {
        reasoningTokensUsed += data.usage.reasoning_tokens
      }

      // Add assistant message to conversation
      messages.push(assistantMessage)

      console.log('🤖 Assistant response:', assistantMessage.content?.substring(0, 100))

      // Check if there are tool calls
      if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
        // No more tool calls - final response
        finalResponse = assistantMessage.content || 'I apologize, I could not generate a response.'
        break
      }

      // Execute tool calls
      console.log(`🔧 Executing ${assistantMessage.tool_calls.length} tool calls`)

      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function.name
        const functionArgs = JSON.parse(toolCall.function.arguments)

        console.log(`🛠️  Tool: ${functionName}`)
        console.log(`📋 Args:`, functionArgs)

        allToolCalls.push({ name: functionName, args: functionArgs })

        let toolResult: any

        try {
          if (functionName === 'execute_sql') {
            const sql = functionArgs.query

            // Validate SQL
            const validation = validateSQL(sql)
            if (!validation.valid) {
              toolResult = {
                error: validation.error,
                blocked: true
              }

              // Log blocked operation
              if (userId) {
                await logDatabaseOperation(
                  supabase,
                  userId,
                  'SQL_BLOCKED',
                  sql,
                  false,
                  validation.error
                )
              }
            } else {
              // Execute SQL
              console.log('📊 Executing SQL:', sql)

              const { data: sqlData, error: sqlError } = await supabase.rpc('execute_sql', {
                sql_query: sql
              })

              if (sqlError) {
                // Return detailed error information to help LLM fix the query
                toolResult = {
                  error: true,
                  message: sqlError.message,
                  detail: sqlError.detail || 'No additional details',
                  hint: sqlError.hint || 'Check SQL syntax, column names, and table names',
                  code: sqlError.code,
                  query: sql,
                  helpfulContext: `The SQL query failed. Common issues:
- Column name doesn't exist (check EXACT DATABASE SCHEMA above)
- Table name misspelled
- Wrong data type
- Syntax error
Please review the error message and try a corrected query.`
                }

                // Log failed operation
                if (userId) {
                  await logDatabaseOperation(
                    supabase,
                    userId,
                    sql.trim().toUpperCase().split(' ')[0], // SELECT/INSERT/UPDATE
                    sql,
                    false,
                    sqlError.message
                  )
                }
              } else {
                toolResult = {
                  success: true,
                  data: sqlData,
                  rowCount: Array.isArray(sqlData) ? sqlData.length : 0
                }

                // Log successful operation
                if (userId) {
                  await logDatabaseOperation(
                    supabase,
                    userId,
                    sql.trim().toUpperCase().split(' ')[0],
                    sql,
                    true
                  )
                }
              }
            }
          } else if (functionName === 'list_tables') {
            // Use MCP list_tables tool
            const schemas = functionArgs.schemas || ['public']

            // Query to list tables
            const tablesQuery = `
              SELECT table_name, table_schema
              FROM information_schema.tables
              WHERE table_schema = ANY($1)
              ORDER BY table_name
            `

            const { data: tables, error: tablesError } = await supabase.rpc('execute_sql', {
              sql_query: tablesQuery
            })

            if (tablesError) {
              toolResult = { error: tablesError.message }
            } else {
              toolResult = {
                success: true,
                tables: tables,
                count: tables?.length || 0
              }
            }
          } else {
            toolResult = {
              error: `Unknown tool: ${functionName}`
            }
          }

          console.log('✅ Tool result:', JSON.stringify(toolResult).substring(0, 200))

          // Add tool result to messages
          messages.push({
            role: 'tool',
            content: JSON.stringify(toolResult),
            tool_call_id: toolCall.id
          } as any)

        } catch (error) {
          console.error('❌ Tool execution error:', error)

          const errorResult = {
            error: error instanceof Error ? error.message : 'Unknown error',
            failed: true
          }

          messages.push({
            role: 'tool',
            content: JSON.stringify(errorResult),
            tool_call_id: toolCall.id
          } as any)
        }
      }

      // Continue to next iteration for LLM to process tool results
    }

    // Check if we hit max iterations
    if (iteration >= MAX_ITERATIONS && !finalResponse) {
      finalResponse = 'I apologize, but I needed too many steps to complete this request. Could you please rephrase or break down your request?'
    }

    // Extract buttons from response if present
    let extractedButtons: any[] = []
    let cleanResponse = finalResponse

    // Try to parse response as JSON to extract buttons
    try {
      // Look for JSON block in response (between ```json and ```)
      const jsonMatch = finalResponse.match(/```json\s*(\{[\s\S]*?\})\s*```/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1])
        if (parsed.reply && parsed.buttons) {
          cleanResponse = parsed.reply
          extractedButtons = parsed.buttons
          console.log('📋 Extracted buttons:', extractedButtons)
        }
      } else {
        // Try parsing entire response as JSON
        const parsed = JSON.parse(finalResponse)
        if (parsed.reply && parsed.buttons) {
          cleanResponse = parsed.reply
          extractedButtons = parsed.buttons
          console.log('📋 Extracted buttons:', extractedButtons)
        }
      }
    } catch (e) {
      // Not JSON or no buttons - that's okay, use original response
    }

    // Save assistant response
    if (activeConversationId) {
      await supabase.from('ai_messages').insert({
        conversation_id: activeConversationId,
        role: 'assistant',
        content: cleanResponse,
        metadata: extractedButtons.length > 0 ? { buttons: extractedButtons } : null,
        created_at: new Date().toISOString()
      })
    }

    const endTime = Date.now()
    const totalTime = endTime - startTime

    console.log('✅ Chat completed')
    console.log('⏱️  Total time:', totalTime, 'ms')
    console.log('🧠 Reasoning tokens:', reasoningTokensUsed)
    console.log('🔧 Tool calls made:', allToolCalls.length)

    // Build response
    const response: any = {
      reply: cleanResponse,
      conversationId: activeConversationId,
      metadata: {
        model: MODEL,
        reasoningTokens: reasoningTokensUsed,
        totalTime: totalTime,
        iterations: iteration,
        toolCallsCount: allToolCalls.length,
        mcpEnabled: MCP_ENABLED,
        timestamp: new Date().toISOString()
      }
    }

    // Add buttons if present
    if (extractedButtons.length > 0) {
      response.buttons = extractedButtons
    }

    if (showReasoning && allToolCalls.length > 0) {
      response.toolCalls = allToolCalls
    }

    return new Response(JSON.stringify(response), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('❌ MCP Chat error:', error)

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})
