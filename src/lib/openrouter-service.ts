/**
 * OpenRouter Service
 * Handles communication with OpenRouter API for AI chat
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY

if (!OPENROUTER_API_KEY) {
  console.warn('⚠️ OPENROUTER_API_KEY is not set in environment variables')
}

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
}

export interface OpenRouterTool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, any>
  }
}

export interface OpenRouterRequest {
  model: string
  messages: OpenRouterMessage[]
  tools?: OpenRouterTool[]
  tool_choice?: 'auto' | 'none' | { type: 'function'; function: { name: string } }
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

export interface OpenRouterResponse {
  id: string
  model: string
  choices: Array<{
    message: {
      role: string
      content: string
      tool_calls?: Array<{
        id: string
        type: 'function'
        function: {
          name: string
          arguments: string
        }
      }>
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export class OpenRouterService {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || OPENROUTER_API_KEY
    this.baseUrl = OPENROUTER_API_URL

    if (!this.apiKey) {
      throw new Error('OpenRouter API key is required')
    }
  }

  /**
   * Send a chat completion request to OpenRouter
   */
  async chat(request: OpenRouterRequest): Promise<OpenRouterResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://baito.vimigoapp.com',
          'X-Title': 'Baito-AI'
        },
        body: JSON.stringify({
          ...request,
          // Default values
          temperature: request.temperature ?? 0.7,
          max_tokens: request.max_tokens ?? 1000,
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`OpenRouter API error: ${error.error?.message || response.statusText}`)
      }

      const data: OpenRouterResponse = await response.json()
      return data

    } catch (error) {
      console.error('OpenRouter API error:', error)
      throw error
    }
  }

  /**
   * Send a streaming chat completion request
   */
  async *chatStream(request: OpenRouterRequest): AsyncGenerator<string, void, unknown> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://baito.vimigoapp.com',
          'X-Title': 'Baito-AI'
        },
        body: JSON.stringify({
          ...request,
          stream: true,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.max_tokens ?? 1000,
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`OpenRouter API error: ${error.error?.message || response.statusText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim())

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') return

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices[0]?.delta?.content
              if (content) {
                yield content
              }
            } catch (e) {
              console.warn('Failed to parse SSE data:', e)
            }
          }
        }
      }

    } catch (error) {
      console.error('OpenRouter streaming error:', error)
      throw error
    }
  }

  /**
   * Get available models from OpenRouter
   */
  async getModels(): Promise<any[]> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch models')
      }

      const data = await response.json()
      return data.data

    } catch (error) {
      console.error('Failed to get models:', error)
      return []
    }
  }

  /**
   * Estimate token cost for a request
   */
  estimateCost(promptTokens: number, completionTokens: number, modelPricing: { prompt: number; completion: number }): number {
    const promptCost = (promptTokens / 1_000_000) * modelPricing.prompt
    const completionCost = (completionTokens / 1_000_000) * modelPricing.completion
    return promptCost + completionCost
  }
}

// Singleton instance
export const openRouterService = new OpenRouterService()

// Model configurations
export const MODELS = {
  GEMINI_FLASH: {
    id: 'google/gemini-2.5-flash-preview-09-2025',
    name: 'Gemini 2.5 Flash',
    pricing: {
      prompt: 0.075, // $0.075 per 1M tokens
      completion: 0.30 // $0.30 per 1M tokens
    },
    contextWindow: 1_000_000,
    description: 'Fast, cost-effective model with 1M context window'
  },
  GPT_35_TURBO: {
    id: 'openai/gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    pricing: {
      prompt: 0.50,
      completion: 1.50
    },
    contextWindow: 16_385,
    description: 'Reliable fallback model'
  },
  CLAUDE_SONNET: {
    id: 'anthropic/claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    pricing: {
      prompt: 3.00,
      completion: 15.00
    },
    contextWindow: 200_000,
    description: 'High-quality model for complex tasks'
  }
} as const

export type ModelId = keyof typeof MODELS
