/**
 * useAIChat Hook
 * Manages AI chat state and communication with Supabase Edge Function
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface ActionButton {
  label: string
  path?: string
  url?: string
  variant?: 'default' | 'outline' | 'secondary'
  icon?: string
}

export interface Message {
  id: string
  type: 'user' | 'assistant' | 'system' | 'error'
  content: string
  createdAt: Date
  metadata?: Record<string, any>
  buttons?: ActionButton[]
}

interface UseAIChatReturn {
  messages: Message[]
  isLoading: boolean
  error: string | null
  conversationId: string | null
  sendMessage: (message: string) => Promise<void>
  clearConversation: () => void
}

export function useAIChat(userId: string): UseAIChatReturn {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)

  // Load existing conversation on mount
  useEffect(() => {
    loadConversation()
  }, [userId])

  const loadConversation = async () => {
    try {
      // Get the most recent active conversation
      const { data: conversation, error: convError } = await supabase
        .from('ai_conversations')
        .select('id')
        .eq('user_id', userId)
        .is('ended_at', null)
        .order('last_activity', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (convError) throw convError

      if (conversation) {
        setConversationId(conversation.id)
        await loadMessages(conversation.id)
      }
    } catch (err) {
      console.error('Failed to load conversation:', err)
      // Don't show error to user - just start fresh
    }
  }

  const loadMessages = async (convId: string) => {
    try {
      const { data, error: msgError } = await supabase
        .from('ai_messages')
        .select('id, type, content, metadata, created_at')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })

      if (msgError) throw msgError

      setMessages(
        data.map((msg) => ({
          id: msg.id,
          type: msg.type as any,
          content: msg.content,
          createdAt: new Date(msg.created_at),
          metadata: msg.metadata,
          buttons: msg.metadata?.buttons || undefined
        }))
      )
    } catch (err) {
      console.error('Failed to load messages:', err)
    }
  }

  const sendMessage = useCallback(async (messageContent: string) => {
    if (!messageContent.trim()) return

    setIsLoading(true)
    setError(null)

    // Add user message immediately (optimistic update)
    const userMessage: Message = {
      id: crypto.randomUUID(),
      type: 'user',
      content: messageContent,
      createdAt: new Date()
    }

    setMessages((prev) => [...prev, userMessage])

    try {
      // Call Supabase Edge Function (JWT auth token sent automatically)
      const { data, error: functionError } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: messageContent,
          conversationId: conversationId
        }
      })

      if (functionError) {
        throw new Error(functionError.message)
      }

      if (data.error) {
        throw new Error(data.error)
      }

      // Update conversation ID if new
      if (!conversationId && data.conversationId) {
        setConversationId(data.conversationId)
      }

      // Add assistant response
      const assistantMessage: Message = {
        id: data.messageId || crypto.randomUUID(),
        type: 'assistant',
        content: data.reply,
        createdAt: new Date(),
        metadata: data.toolsUsed ? { tools_used: data.toolsUsed } : undefined,
        buttons: data.buttons || undefined
      }

      setMessages((prev) => [...prev, assistantMessage])

    } catch (err: any) {
      console.error('Failed to send message:', err)

      setError(err.message || 'Failed to send message. Please try again.')

      // Add error message
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        type: 'error',
        content: `Sorry, I encountered an error: ${err.message}. Please try again.`,
        createdAt: new Date()
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [userId, conversationId])

  const clearConversation = useCallback(async () => {
    try {
      // End ALL active conversations for this user (not just current one)
      await supabase
        .from('ai_conversations')
        .update({ ended_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('ended_at', null)

      // Reset state
      setMessages([])
      setConversationId(null)
      setError(null)

    } catch (err) {
      console.error('Failed to clear conversation:', err)
    }
  }, [userId])

  return {
    messages,
    isLoading,
    error,
    conversationId,
    sendMessage,
    clearConversation
  }
}
