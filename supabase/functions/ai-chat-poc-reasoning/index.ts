// ==========================================
// AI Chat POC - Reasoning Enhancement
// Version: 1.0.0 (Proof of Concept)
// ==========================================
// This is a proof-of-concept to demonstrate improved reasoning
// capabilities compared to the current chatbot implementation.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

// Configuration
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!
const MODEL = 'google/gemini-2.5-flash-preview-09-2025'

// Enhanced system prompt with explicit reasoning framework
const REASONING_SYSTEM_PROMPT = `You are an intelligent AI assistant for Baito-AI, a staffing and project management system.

REASONING FRAMEWORK:
Before every response, think through your approach using this framework:

1. UNDERSTAND: What is the user's intent?
   - Parse the literal meaning
   - Infer the actual need
   - Identify context from conversation
   - Note any ambiguities

2. PLAN: What's the optimal strategy?
   - What information/tools do I need?
   - What's the best sequence of actions?
   - What edge cases should I consider?

3. VALIDATE: Is this approach sound?
   - Will this solve the user's problem?
   - Are there assumptions I should verify?
   - Is there a simpler approach?

4. EXECUTE: Carry out the plan

5. REFLECT: Check quality
   - Did I fully answer the question?
   - Should I suggest next steps?
   - Any uncertainties to mention?

CONVERSATION EXAMPLES:

Example 1 - Handling Ambiguous Queries:
User: "what is in my warehouse"

REASONING:
1. UNDERSTAND: This is ambiguous. "Warehouse" could mean:
   - Physical inventory (out of scope for this system)
   - Candidates/projects in database (in scope)
   - Something else entirely
2. PLAN: Clarify intent before proceeding, offer relevant alternatives
3. VALIDATE: Better to ask than to assume and give wrong information
4. EXECUTE: Request clarification with helpful options
5. REFLECT: This will lead to more accurate help

Response: "I'm not sure what you mean by 'warehouse'. Are you asking about:
- Available candidates in our system?
- Current projects and their status?
- Physical inventory or equipment (which I don't have access to)?
Could you clarify so I can help you better?"

Example 2 - Proactive Recognition:
User: "Looking for 10 promoters for Samsung product launch Date: December 15-17, 2024 Time: 10am - 6pm Location: Mid Valley Mall Pay: RM15/hour Must speak Mandarin"

REASONING:
1. UNDERSTAND: This is clearly a job posting, not a question. User wants to:
   a) Create this project in the system
   b) Find suitable candidates
2. PLAN: Extract project details → create project → search for candidates
3. VALIDATE: Being proactive saves the user time and steps
4. EXECUTE: Offer to create project and search in one go
5. REFLECT: Show enthusiasm and confirm next steps

Response: "I can help you with this Samsung promotion! I see you need:
- 10 Mandarin-speaking promoters
- Dec 15-17, 2024, 10am-6pm
- Mid Valley Mall
- RM15/hour

I can create this project in the system and immediately search for suitable candidates. Should I go ahead?"

Example 3 - Context Awareness:
Conversation history:
User: "Show me Mr. DIY projects"
Assistant: [Shows 3 Mr. DIY projects]
User: "Show me all"

REASONING:
1. UNDERSTAND: "all" refers to "all Mr. DIY projects" from previous context, not "all projects in system"
2. PLAN: Use same company filter but with higher/no limit
3. VALIDATE: Context is clear from immediate conversation history
4. EXECUTE: Query for all Mr. DIY projects
5. REFLECT: Maintain natural conversation flow

Response: "Here are all 8 Mr. DIY projects in the system: [list]"

Example 4 - Recognizing Out of Scope:
User: "What's the weather like today?"

REASONING:
1. UNDERSTAND: This is completely outside the staffing/project management domain
2. PLAN: Politely decline and redirect to capabilities
3. VALIDATE: Being clear about limitations builds trust
4. EXECUTE: Explain scope and offer alternatives
5. REFLECT: Leave door open for actual help

Response: "I'm a staffing and project management assistant, so I don't have access to weather information. I can help you with:
- Managing projects and events
- Finding and scheduling candidates
- Checking availability and conflicts
- Financial reports
Is there anything related to your projects I can help with?"

Now apply this reasoning framework to all user queries.`

// POC Request Interface
interface POCRequest {
  message: string
  showReasoning?: boolean // Option to show reasoning in response
}

// POC Response Interface
interface POCResponse {
  reply: string
  reasoning?: string
  metadata: {
    reasoningTokens?: number
    responseTokens?: number
    totalTime: number
    timestamp: string
  }
}

// ==========================================
// Main Handler
// ==========================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    const { message, showReasoning = false }: POCRequest = await req.json()

    if (!message || message.trim().length === 0) {
      throw new Error('Message is required')
    }

    console.log('📥 Received query:', message)

    // ==========================================
    // STEP 1: REASONING PHASE
    // ==========================================
    console.log('🧠 Starting reasoning phase...')

    const reasoningResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://baito-ai.com',
        'X-Title': 'Baito-AI POC Reasoning'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: REASONING_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Before responding to this query, provide your internal reasoning:

User query: "${message}"

Use this format:
1. UNDERSTAND: [What is the user trying to accomplish?]
2. PLAN: [What's your strategy?]
3. VALIDATE: [Is this approach sound?]
4. EXECUTE: [What will you do?]
5. REFLECT: [Any concerns or follow-ups?]

Reasoning:`
          }
        ],
        temperature: 0.3, // Lower temperature for reasoning
        max_tokens: 600
      })
    })

    if (!reasoningResponse.ok) {
      throw new Error(`Reasoning phase failed: ${reasoningResponse.statusText}`)
    }

    const reasoningData = await reasoningResponse.json()
    const reasoning = reasoningData.choices[0].message.content
    const reasoningTokens = reasoningData.usage?.total_tokens || 0

    console.log('🧠 REASONING:\n', reasoning)

    // ==========================================
    // STEP 2: RESPONSE PHASE
    // ==========================================
    console.log('💬 Generating response based on reasoning...')

    const responseResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://baito-ai.com',
        'X-Title': 'Baito-AI POC Response'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: REASONING_SYSTEM_PROMPT },
          { role: 'assistant', content: `My internal reasoning:\n${reasoning}` },
          { role: 'user', content: message }
        ],
        temperature: 0.7, // Normal temperature for response
        max_tokens: 800
      })
    })

    if (!responseResponse.ok) {
      throw new Error(`Response phase failed: ${responseResponse.statusText}`)
    }

    const responseData = await responseResponse.json()
    const reply = responseData.choices[0].message.content
    const responseTokens = responseData.usage?.total_tokens || 0

    console.log('💬 RESPONSE:\n', reply)

    const totalTime = Date.now() - startTime
    console.log(`⏱️ Total time: ${totalTime}ms`)

    // Build response
    const pocResponse: POCResponse = {
      reply,
      metadata: {
        reasoningTokens,
        responseTokens,
        totalTime,
        timestamp: new Date().toISOString()
      }
    }

    // Optionally include reasoning in response (for debugging/demos)
    if (showReasoning) {
      pocResponse.reasoning = reasoning
    }

    return new Response(JSON.stringify(pocResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('❌ POC Error:', error)

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

/* To test locally:

1. Start Supabase:
   supabase start

2. Deploy function:
   supabase functions deploy ai-chat-poc-reasoning

3. Test with curl:

   # Basic test (reasoning hidden)
   curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/ai-chat-poc-reasoning' \
     -H 'Content-Type: application/json' \
     -d '{"message": "what is in my warehouse"}'

   # Test with reasoning visible (for debugging)
   curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/ai-chat-poc-reasoning' \
     -H 'Content-Type: application/json' \
     -d '{"message": "what is in my warehouse", "showReasoning": true}'

4. Compare responses with current chatbot at:
   https://YOUR_PROJECT.supabase.co/functions/v1/ai-chat

Expected improvements:
- Better handling of ambiguous queries
- More natural clarification questions
- Proactive recognition of job postings
- Context-aware responses
- Appropriate scope boundaries

*/
