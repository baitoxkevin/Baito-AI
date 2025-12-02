# Implementing MCP for Baito-AI Chatbot

## Overview

Model Context Protocol (MCP) allows the chatbot to access your Supabase database directly without manually defining tools. The chatbot can dynamically query any table, execute SQL, and get real-time data.

---

## Current vs MCP Architecture

### Current Architecture (Tool-Based)

```
User Query
    ↓
AI Chat Function (Edge Function)
    ↓
Manually defined tools:
  - query_projects()
  - query_candidates()
  - get_project_details()
  - calculate_revenue()
  [10+ hardcoded tools]
    ↓
Supabase Database
```

**Limitations:**
- ❌ Must manually define every tool
- ❌ Limited to predefined queries
- ❌ Can't handle dynamic queries
- ❌ Need to update code for new queries

### MCP Architecture

```
User Query
    ↓
AI Chat Function (Edge Function)
    ↓
MCP Client (connects to Supabase MCP Server)
    ↓
Dynamic MCP Tools:
  - execute_sql() - Run ANY query
  - list_tables() - Discover schema
  - apply_migration() - Modify schema
  [Automatically available]
    ↓
Supabase Database
```

**Benefits:**
- ✅ No tool definitions needed
- ✅ Can query ANY table dynamically
- ✅ Handles complex SQL queries
- ✅ Auto-discovers schema changes

---

## Implementation Steps

### Step 1: Install MCP Client in Edge Function

Edge Functions need the MCP client to connect to MCP servers:

```typescript
// supabase/functions/ai-chat-mcp/index.ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

// Create MCP client
const client = new Client({
  name: 'baito-ai-chatbot',
  version: '1.0.0'
}, {
  capabilities: {
    tools: {}
  }
})

// Connect to Supabase MCP server
const transport = new StdioClientTransport({
  command: 'npx',
  args: [
    '-y',
    '@supabase/mcp-server-supabase@latest',
    '--project-ref=aoiwrdzlichescqgnohi'
  ],
  env: {
    SUPABASE_ACCESS_TOKEN: Deno.env.get('SUPABASE_ACCESS_TOKEN')
  }
})

await client.connect(transport)
```

### Step 2: Discover Available Tools

MCP servers expose their tools dynamically:

```typescript
// Get all available MCP tools
const { tools } = await client.listTools()

console.log('Available MCP tools:', tools)
// Output:
// [
//   { name: 'execute_sql', description: 'Execute SQL query', inputSchema: {...} },
//   { name: 'list_tables', description: 'List database tables', inputSchema: {...} },
//   { name: 'apply_migration', description: 'Apply migration', inputSchema: {...} }
// ]
```

### Step 3: Convert MCP Tools to OpenRouter Format

OpenRouter/LLM APIs expect tools in a specific format:

```typescript
// Convert MCP tools to OpenRouter tool format
const openRouterTools = tools.map(tool => ({
  type: 'function',
  function: {
    name: tool.name,
    description: tool.description,
    parameters: tool.inputSchema
  }
}))

// Now pass to LLM
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'google/gemini-2.5-flash-preview-09-2025',
    messages: messages,
    tools: openRouterTools,  // MCP tools converted
    reasoning: { effort: 'medium' }
  })
})
```

### Step 4: Execute MCP Tools

When LLM wants to use a tool:

```typescript
// LLM returns tool call
const toolCall = {
  name: 'execute_sql',
  arguments: {
    query: "SELECT * FROM projects WHERE status = 'active' LIMIT 10"
  }
}

// Execute via MCP client
const result = await client.callTool({
  name: toolCall.name,
  arguments: toolCall.arguments
})

console.log('Query result:', result.content)
// Returns actual database data
```

---

## Complete Implementation Example

```typescript
// supabase/functions/ai-chat-mcp/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { corsHeaders } from '../_shared/cors.ts'

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!
const SUPABASE_ACCESS_TOKEN = Deno.env.get('SUPABASE_ACCESS_TOKEN')!
const MODEL = 'google/gemini-2.5-flash-preview-09-2025'

// Enhanced system prompt for MCP
const SYSTEM_PROMPT = `You are an AI assistant for Baito-AI with direct database access via SQL.

You have access to these tables:
- projects: Store project/event information
- candidates: Store candidate profiles
- project_staff: Store staff assignments
- payments: Store payment records
- expenses: Store expense claims

When users ask questions:
1. Use execute_sql tool to query the database
2. Write efficient SQL queries
3. Always filter by relevant conditions
4. Use JOINs when needed for related data

Examples:

User: "Show me active projects"
SQL: SELECT * FROM projects WHERE status = 'active' LIMIT 20

User: "Find Mandarin-speaking candidates"
SQL: SELECT * FROM candidates WHERE 'Mandarin' = ANY(skills) AND status = 'active'

User: "Which projects need more staff?"
SQL: SELECT id, title, crew_count, filled_positions
     FROM projects
     WHERE filled_positions < crew_count
     AND status = 'active'

Always provide clear, helpful responses based on the data.`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message } = await req.json()

    // 1. Initialize MCP client
    const client = new Client({
      name: 'baito-ai-chatbot',
      version: '1.0.0'
    }, {
      capabilities: { tools: {} }
    })

    // 2. Connect to Supabase MCP server
    const transport = new StdioClientTransport({
      command: 'npx',
      args: [
        '-y',
        '@supabase/mcp-server-supabase@latest',
        '--project-ref=aoiwrdzlichescqgnohi'
      ],
      env: {
        SUPABASE_ACCESS_TOKEN
      }
    })

    await client.connect(transport)

    // 3. Get available MCP tools
    const { tools } = await client.listTools()

    // 4. Convert to OpenRouter format
    const openRouterTools = tools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema
      }
    }))

    // 5. Call LLM with MCP tools
    const llmResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://baito-ai.com',
        'X-Title': 'Baito-AI MCP Chat'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: message }
        ],
        tools: openRouterTools,
        reasoning: { effort: 'medium' }
      })
    })

    const data = await llmResponse.json()
    const assistantMessage = data.choices[0].message

    // 6. If LLM wants to use tools, execute them
    if (assistantMessage.tool_calls) {
      const toolResults = []

      for (const toolCall of assistantMessage.tool_calls) {
        console.log('Executing MCP tool:', toolCall.function.name)
        console.log('Arguments:', toolCall.function.arguments)

        // Execute via MCP
        const result = await client.callTool({
          name: toolCall.function.name,
          arguments: JSON.parse(toolCall.function.arguments)
        })

        toolResults.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: toolCall.function.name,
          content: JSON.stringify(result.content)
        })
      }

      // 7. Send tool results back to LLM for final response
      const finalResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://baito-ai.com',
          'X-Title': 'Baito-AI MCP Chat'
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: message },
            assistantMessage,
            ...toolResults
          ],
          reasoning: { effort: 'medium' }
        })
      })

      const finalData = await finalResponse.json()
      const reply = finalData.choices[0].message.content

      // Cleanup
      await client.close()

      return new Response(JSON.stringify({ reply }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // No tools needed - direct response
    await client.close()

    return new Response(JSON.stringify({
      reply: assistantMessage.content
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('MCP Chat error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
```

---

## Key Advantages

### 1. Dynamic Database Access

**Before (Tool-based):**
```typescript
// Had to manually define this
async function queryProjects(args) {
  let query = supabase.from('projects').select('*')
  if (args.status) query = query.eq('status', args.status)
  // 50 lines of query building...
}
```

**After (MCP):**
```typescript
// LLM writes SQL directly
execute_sql({
  query: "SELECT * FROM projects WHERE status = 'active'"
})
```

### 2. Handles Complex Queries

**User:** "Show me projects in December that need Mandarin speakers"

**Tool-based:** Would need a custom tool for this specific query

**MCP:** LLM writes:
```sql
SELECT p.*,
       p.crew_count - p.filled_positions as needed_staff
FROM projects p
WHERE p.start_date >= '2024-12-01'
  AND p.start_date < '2025-01-01'
  AND p.filled_positions < p.crew_count
  AND EXISTS (
    SELECT 1 FROM project_staff ps
    JOIN candidates c ON ps.candidate_id = c.id
    WHERE ps.project_id = p.id
    AND 'Mandarin' = ANY(c.skills)
  )
```

### 3. Self-Healing

If database schema changes, MCP tools automatically update. No code changes needed!

### 4. Better Reasoning

LLM can see the full SQL query and reason about it:
```
"I need to find active projects that need staff, so I'll query projects
where filled_positions < crew_count and status = 'active'"
```

---

## Challenges & Solutions

### Challenge 1: Edge Functions Don't Support Node.js

**Problem:** MCP SDK uses Node.js features
**Solution:** Use Deno-compatible MCP client or HTTP-based MCP

### Challenge 2: MCP Server Needs to Run Somewhere

**Problem:** Can't run MCP server inside Edge Function
**Solution Options:**
1. Run MCP server on external service (Render, Fly.io)
2. Use HTTP-based MCP protocol
3. Create lightweight MCP adapter for Deno

### Challenge 3: Security

**Problem:** LLM can execute ANY SQL
**Solution:**
- Use read-only database role
- Implement SQL query validation
- Whitelist allowed tables
- Log all queries for audit

---

## Recommended Approach

Given the challenges, here's what I recommend:

### Option A: HTTP-based MCP (Easiest)

```typescript
// Instead of stdio transport, use HTTP
const mcpServerUrl = 'https://your-mcp-server.fly.dev'

const response = await fetch(`${mcpServerUrl}/tools/execute_sql`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${MCP_TOKEN}` },
  body: JSON.stringify({
    query: "SELECT * FROM projects WHERE status = 'active'"
  })
})

const result = await response.json()
```

### Option B: Direct SQL with Validation (Practical)

```typescript
// Let LLM generate SQL, but validate it
const generatedSQL = await generateSQLFromQuery(userMessage)

// Validate SQL
if (!isSafeSQL(generatedSQL)) {
  throw new Error('Unsafe SQL query')
}

// Execute with Supabase client
const { data } = await supabase.rpc('execute_dynamic_sql', {
  sql_query: generatedSQL
})
```

### Option C: Hybrid Approach (Best)

```typescript
// Simple queries: Use existing tools (fast, safe)
if (isSimpleQuery) {
  result = await queryProjects(args)
}

// Complex queries: Generate SQL with LLM
if (isComplexQuery) {
  const sql = await generateSQL(userMessage)
  result = await executeSafeSQL(sql)
}
```

---

## Next Steps

Would you like me to:

1. **Build HTTP-based MCP adapter** for your Edge Functions?
2. **Create SQL generation system** (LLM writes SQL, we validate & execute)?
3. **Deploy MCP server separately** and connect chatbot to it?
4. **Implement hybrid approach** (tools for common queries, SQL for complex ones)?

**My recommendation:** Start with **Option 2** (SQL generation) - gives you MCP-like flexibility without the infrastructure complexity.

---

## Example: SQL Generation Approach

```typescript
// User: "Find me candidates who speak Mandarin and are available next week"

// Step 1: LLM generates SQL with reasoning
const { sql, reasoning } = await generateSQL(userMessage)

console.log('Reasoning:', reasoning)
// "I need to check candidates table for Mandarin skill
//  and cross-reference with project_staff to find availability"

console.log('SQL:', sql)
// SELECT c.* FROM candidates c
// WHERE 'Mandarin' = ANY(c.skills)
// AND c.status = 'active'
// AND NOT EXISTS (
//   SELECT 1 FROM project_staff ps
//   JOIN projects p ON ps.project_id = p.id
//   WHERE ps.candidate_id = c.id
//   AND p.start_date <= '2024-10-22'
//   AND p.end_date >= '2024-10-15'
// )

// Step 2: Validate SQL
if (!validateSQL(sql)) {
  throw new Error('Invalid SQL')
}

// Step 3: Execute
const { data } = await supabase.rpc('execute_query', { query: sql })

// Step 4: LLM formats response
const reply = await formatResults(data, userMessage)
```

This gives you MCP-like power without the infrastructure complexity!

**Want me to build this?** 🚀
