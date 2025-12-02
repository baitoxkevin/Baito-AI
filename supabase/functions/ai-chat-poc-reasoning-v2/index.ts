// ==========================================
// AI Chat POC v2 - OpenRouter Native Reasoning
// Version: 2.0.0 (Using OpenRouter Reasoning API)
// ==========================================
// This version leverages OpenRouter's native reasoning token support
// for cleaner, more efficient implementation.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

// Configuration
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!

// Model options with reasoning support
const MODELS = {
  // Recommended: Best balance of cost/quality
  CLAUDE_SONNET: 'anthropic/claude-3.7-sonnet',

  // Alternative: Current model (if Gemini 2.5 supports reasoning)
  GEMINI_FLASH: 'google/gemini-2.5-flash-preview-09-2025',

  // Premium: For complex reasoning (expensive)
  OPENAI_O1: 'openai/o1-preview'
}

// Use Claude Sonnet as default for reasoning
const MODEL = MODELS.CLAUDE_SONNET

// System prompt optimized for reasoning
const SYSTEM_PROMPT = `You are an intelligent AI assistant for Baito-AI, a staffing and project management system.

Your capabilities:
- Project management (create, search, update)
- Candidate search and staffing
- Schedule conflict checking
- Financial reports and analytics

IMPORTANT GUIDELINES:

1. CLARIFY AMBIGUITY:
   When queries are unclear, ask clarifying questions with helpful options.
   Example: "warehouse" could mean candidates, projects, or physical inventory.

2. BE PROACTIVE:
   Recognize patterns like job postings and offer to create projects immediately.
   Don't wait for explicit instructions when the intent is clear.

3. MAINTAIN CONTEXT:
   Remember previous conversation context. When users say "all", "them", "it",
   refer back to what was discussed.

4. KNOW YOUR LIMITS:
   Politely redirect out-of-scope queries (weather, general knowledge)
   and suggest relevant alternatives.

5. VALIDATE UNDERSTANDING:
   When uncertain, express your confidence level and ask for confirmation
   before taking actions.

Tools available:
- query_projects: Search/filter projects
- query_candidates: Find candidates
- get_project_details: Get full project info
- calculate_revenue: Financial reports
- check_scheduling_conflicts: Availability checks
- speed_add_project: Extract project from job ad
- get_current_datetime: Get current date/time`

// Request/Response interfaces
interface ReasoningRequest {
  message: string
  conversationId?: string
  showReasoning?: boolean
  reasoningEffort?: 'low' | 'medium' | 'high'
}

interface ReasoningResponse {
  reply: string
  reasoning?: string
  conversationId?: string
  metadata: {
    model: string
    reasoningTokens: number
    responseTokens: number
    totalTokens: number
    totalTime: number
    timestamp: string
  }
}

// ==========================================
// Main Handler
// ==========================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    const {
      message,
      conversationId,
      showReasoning = false,
      reasoningEffort = 'medium'
    }: ReasoningRequest = await req.json()

    if (!message?.trim()) {
      throw new Error('Message is required')
    }

    console.log('📥 Query:', message)
    console.log('🧠 Reasoning effort:', reasoningEffort)

    // ==========================================
    // Single API call with reasoning enabled
    // ==========================================
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://baito-ai.com',
        'X-Title': 'Baito-AI Enhanced Chat'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: message }
        ],

        // Enable reasoning with OpenRouter's native support
        reasoning: {
          effort: reasoningEffort,  // low (20%), medium (50%), high (80%)
          // Or specify exact budget:
          // max_tokens: 2000  // 1024-32000 range
        },

        max_tokens: 4000,  // Total response tokens
        temperature: 0.7
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenRouter API error: ${errorText}`)
    }

    const data = await response.json()
    console.log('📊 Raw response:', JSON.stringify(data, null, 2))

    // Extract response and reasoning
    const message_content = data.choices[0].message
    const reply = message_content.content || ''
    const reasoning = message_content.reasoning || null

    // Token usage
    const usage = data.usage || {}
    const reasoningTokens = usage.reasoning_tokens || 0
    const responseTokens = usage.completion_tokens || 0
    const totalTokens = usage.total_tokens || 0

    console.log('💬 Reply:', reply)
    if (reasoning) {
      console.log('🧠 Reasoning:', reasoning)
    }
    console.log(`📊 Tokens - Reasoning: ${reasoningTokens}, Response: ${responseTokens}, Total: ${totalTokens}`)

    const totalTime = Date.now() - startTime
    console.log(`⏱️ Total time: ${totalTime}ms`)

    // Build response
    const pocResponse: ReasoningResponse = {
      reply,
      conversationId,
      metadata: {
        model: MODEL,
        reasoningTokens,
        responseTokens,
        totalTokens,
        totalTime,
        timestamp: new Date().toISOString()
      }
    }

    // Include reasoning if requested
    if (showReasoning && reasoning) {
      pocResponse.reasoning = reasoning
    }

    return new Response(JSON.stringify(pocResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('❌ Error:', error)

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

/*
TESTING GUIDE

1. Deploy:
   supabase functions deploy ai-chat-poc-reasoning-v2

2. Test different reasoning levels:

   # Low reasoning (fast, simple queries)
   curl -X POST 'YOUR_ENDPOINT/ai-chat-poc-reasoning-v2' \
     -H 'Content-Type: application/json' \
     -d '{
       "message": "show me active projects",
       "reasoningEffort": "low",
       "showReasoning": true
     }'

   # Medium reasoning (balanced)
   curl -X POST 'YOUR_ENDPOINT/ai-chat-poc-reasoning-v2' \
     -H 'Content-Type: application/json' \
     -d '{
       "message": "what is in my warehouse",
       "reasoningEffort": "medium",
       "showReasoning": true
     }'

   # High reasoning (complex queries)
   curl -X POST 'YOUR_ENDPOINT/ai-chat-poc-reasoning-v2' \
     -H 'Content-Type: application/json' \
     -d '{
       "message": "Looking for 10 promoters for Samsung...",
       "reasoningEffort": "high",
       "showReasoning": true
     }'

3. Compare costs:
   - Low effort: ~20% tokens for reasoning
   - Medium effort: ~50% tokens for reasoning
   - High effort: ~80% tokens for reasoning

4. Expected improvements:
   ✅ Better handling of ambiguous queries
   ✅ More context-aware responses
   ✅ Proactive recognition of patterns
   ✅ Natural clarification questions
   ✅ Single API call (simpler, faster)

NOTES:
- Claude 3.7 Sonnet recommended for best reasoning
- Can use with Gemini if it supports reasoning
- Check OpenRouter docs for model support:
  https://openrouter.ai/docs/use-cases/reasoning-tokens
*/
