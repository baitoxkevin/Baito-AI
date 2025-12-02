/**
 * Enhanced AI Chat Hook
 * Manages AI chat state with streaming, tool execution tracking, and action confirmations
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type {
  EnhancedMessage,
  MessageContent,
  ChatState,
  ChatPhase,
  ToolExecutionStep,
  ToolCall,
  PendingAction,
  ConfirmationRequest,
  ActionResult,
  UseEnhancedAIChatOptions,
  UseEnhancedAIChatReturn,
  StreamEvent
} from '@/types/ai-chat.types'

// Default chat state
const defaultChatState: ChatState = {
  phase: 'idle',
  currentTool: undefined,
  currentStep: undefined,
  progress: undefined,
  message: undefined
}

// Generate unique IDs
const generateId = () => crypto.randomUUID()

// Parse streaming SSE data
function parseSSEData(data: string): StreamEvent | null {
  try {
    const parsed = JSON.parse(data)
    return {
      type: parsed.type,
      timestamp: new Date(),
      data: parsed.data || {}
    }
  } catch {
    return null
  }
}

export function useEnhancedAIChat(options: UseEnhancedAIChatOptions): UseEnhancedAIChatReturn {
  const {
    userId,
    persona = 'general',
    pageContext,
    enableStreaming = true,
    enableToolExecution = true,
    onToolExecutionStart,
    onToolExecutionComplete,
    onConfirmationRequired,
    onActionComplete
  } = options

  // State
  const [messages, setMessages] = useState<EnhancedMessage[]>([])
  const [chatState, setChatState] = useState<ChatState>(defaultChatState)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [currentToolExecution, setCurrentToolExecution] = useState<ToolExecutionStep[] | null>(null)
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([])
  const [streamingContent, setStreamingContent] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)

  // Refs for cleanup
  const abortControllerRef = useRef<AbortController | null>(null)
  const streamReaderRef = useRef<ReadableStreamDefaultReader | null>(null)

  // Load existing conversation on mount
  useEffect(() => {
    loadConversation()
    return () => {
      // Cleanup on unmount
      abortControllerRef.current?.abort()
      streamReaderRef.current?.cancel()
    }
  }, [userId])

  // Load conversation from database
  const loadConversation = async () => {
    try {
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
    }
  }

  // Load messages from database
  const loadMessages = async (convId: string) => {
    try {
      const { data, error: msgError } = await supabase
        .from('ai_messages')
        .select('id, type, content, metadata, created_at')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })

      if (msgError) throw msgError

      const loadedMessages: EnhancedMessage[] = data.map((msg) => ({
        id: msg.id,
        type: msg.type as EnhancedMessage['type'],
        content: parseMessageContent(msg.content, msg.metadata),
        createdAt: new Date(msg.created_at),
        metadata: msg.metadata,
        buttons: msg.metadata?.buttons || undefined
      }))

      setMessages(loadedMessages)
    } catch (err) {
      console.error('Failed to load messages:', err)
    }
  }

  // Parse message content from database format
  const parseMessageContent = (
    content: string,
    metadata?: Record<string, unknown>
  ): MessageContent[] => {
    // Check for rich content in metadata
    if (metadata?.rich_content) {
      return [
        { type: 'text', data: content },
        metadata.rich_content as MessageContent
      ]
    }
    return [{ type: 'text', data: content }]
  }

  // Update chat phase
  const setPhase = useCallback((phase: ChatPhase, tool?: string, step?: string) => {
    setChatState(prev => ({
      ...prev,
      phase,
      currentTool: tool,
      currentStep: step
    }))
  }, [])

  // Handle tool execution start
  const handleToolStart = useCallback((tool: ToolCall) => {
    setCurrentToolExecution(prev => {
      const steps = prev || []
      const lastStep = steps[steps.length - 1]

      if (lastStep && lastStep.status === 'executing') {
        // Add tool to current step
        return steps.map((s, i) =>
          i === steps.length - 1
            ? { ...s, toolCalls: [...s.toolCalls, tool] }
            : s
        )
      }

      // Create new step
      return [
        ...steps,
        {
          id: generateId(),
          label: `Executing ${tool.displayName}`,
          status: 'executing' as const,
          toolCalls: [tool],
          startedAt: new Date()
        }
      ]
    })

    setPhase('executing_tool', tool.displayName)
    onToolExecutionStart?.(tool)
  }, [setPhase, onToolExecutionStart])

  // Handle tool execution complete
  const handleToolComplete = useCallback((tool: ToolCall) => {
    setCurrentToolExecution(prev => {
      if (!prev) return prev

      return prev.map(step => ({
        ...step,
        toolCalls: step.toolCalls.map(t =>
          t.id === tool.id ? { ...t, ...tool } : t
        ),
        status: step.toolCalls.every(t =>
          t.id === tool.id ? tool.status === 'completed' : t.status === 'completed'
        ) ? 'completed' as const : step.status
      }))
    })

    onToolExecutionComplete?.(tool)
  }, [onToolExecutionComplete])

  // Process stream events
  const processStreamEvent = useCallback((event: StreamEvent) => {
    switch (event.type) {
      case 'stream_start':
        setIsStreaming(true)
        setStreamingContent('')
        setPhase('streaming')
        break

      case 'content_delta':
        if (event.data.content) {
          setStreamingContent(prev => (prev || '') + event.data.content)
        }
        break

      case 'tool_call_start':
        if (event.data.toolCall) {
          const tool: ToolCall = {
            id: event.data.toolCall.id || generateId(),
            name: event.data.toolCall.name || 'unknown',
            displayName: event.data.toolCall.displayName || event.data.toolCall.name || 'Unknown Tool',
            category: event.data.toolCall.category || 'action',
            status: 'executing',
            startedAt: new Date(),
            input: event.data.toolCall.input
          }
          handleToolStart(tool)
        }
        break

      case 'tool_call_complete':
        if (event.data.toolCall) {
          const tool: ToolCall = {
            id: event.data.toolCall.id || generateId(),
            name: event.data.toolCall.name || 'unknown',
            displayName: event.data.toolCall.displayName || event.data.toolCall.name || 'Unknown Tool',
            category: event.data.toolCall.category || 'action',
            status: event.data.toolCall.error ? 'failed' : 'completed',
            completedAt: new Date(),
            duration: event.data.toolCall.duration,
            output: event.data.toolCall.output,
            error: event.data.toolCall.error
          }
          handleToolComplete(tool)
        }
        break

      case 'content_complete':
      case 'stream_end':
        setIsStreaming(false)
        setPhase('idle')
        break

      case 'error':
        setError(event.data.error || 'An error occurred')
        setIsStreaming(false)
        setPhase('error')
        break
    }
  }, [setPhase, handleToolStart, handleToolComplete])

  // Send message
  const sendMessage = useCallback(async (messageContent: string) => {
    if (!messageContent.trim()) return

    // Cancel any existing request
    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()

    setIsLoading(true)
    setError(null)
    setCurrentToolExecution(null)
    setStreamingContent(null)

    // Add user message immediately (optimistic update)
    const userMessage: EnhancedMessage = {
      id: generateId(),
      type: 'user',
      content: [{ type: 'text', data: messageContent }],
      createdAt: new Date()
    }
    setMessages(prev => [...prev, userMessage])

    setPhase('thinking')

    try {
      if (enableStreaming) {
        // Streaming request
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat-mcp-enhanced`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
              'Accept': 'text/event-stream'
            },
            body: JSON.stringify({
              message: messageContent,
              conversationId,
              userId,
              persona,
              stream: true,
              showToolCalls: enableToolExecution,
              context: pageContext ? {
                currentPage: pageContext.currentPage,
                pageType: pageContext.pageType,
                entityType: pageContext.entityType,
                entityId: pageContext.entityId,
                userAction: pageContext.userAction,
                breadcrumb: pageContext.breadcrumb
              } : undefined
            }),
            signal: abortControllerRef.current.signal
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error('No response body')

        streamReaderRef.current = reader
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const event = parseSSEData(line.slice(6))
              if (event) {
                processStreamEvent(event)
              }
            }
          }
        }

        // Finalize message
        if (streamingContent) {
          const assistantMessage: EnhancedMessage = {
            id: generateId(),
            type: 'assistant',
            content: [{ type: 'text', data: streamingContent }],
            createdAt: new Date(),
            toolExecution: currentToolExecution ? {
              steps: currentToolExecution,
              isComplete: true
            } : undefined
          }
          setMessages(prev => [...prev, assistantMessage])
          setStreamingContent(null)
        }
      } else {
        // Non-streaming request
        const { data, error: functionError } = await supabase.functions.invoke('ai-chat-mcp-enhanced', {
          body: {
            message: messageContent,
            conversationId,
            userId,
            persona,
            showToolCalls: enableToolExecution,
            context: pageContext ? {
              currentPage: pageContext.currentPage,
              pageType: pageContext.pageType,
              entityType: pageContext.entityType,
              entityId: pageContext.entityId,
              userAction: pageContext.userAction,
              breadcrumb: pageContext.breadcrumb
            } : undefined
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

        // Build message content
        const messageContents: MessageContent[] = [
          { type: 'text', data: data.reply }
        ]

        // Add rich content if present
        if (data.richContent) {
          messageContents.push(data.richContent)
        }

        // Check for confirmation request
        if (data.confirmationRequired) {
          const confirmation: ConfirmationRequest = data.confirmationRequired
          setPendingActions(prev => [
            ...prev,
            {
              id: confirmation.id,
              confirmation,
              createdAt: new Date()
            }
          ])
          onConfirmationRequired?.(confirmation)
        }

        // Add assistant response
        const assistantMessage: EnhancedMessage = {
          id: data.messageId || generateId(),
          type: 'assistant',
          content: messageContents,
          createdAt: new Date(),
          metadata: data.toolsUsed ? { toolsUsed: data.toolsUsed } : undefined,
          buttons: data.buttons || undefined,
          pendingConfirmation: data.confirmationRequired
        }

        setMessages(prev => [...prev, assistantMessage])
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled
        return
      }

      console.error('Failed to send message:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message'
      setError(errorMessage)

      // Add error message
      const errorMsg: EnhancedMessage = {
        id: generateId(),
        type: 'error',
        content: [{ type: 'text', data: `Sorry, I encountered an error: ${errorMessage}. Please try again.` }],
        createdAt: new Date()
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
      setPhase('idle')
    }
  }, [
    userId,
    conversationId,
    persona,
    pageContext,
    enableStreaming,
    enableToolExecution,
    streamingContent,
    currentToolExecution,
    setPhase,
    processStreamEvent,
    onConfirmationRequired
  ])

  // Confirm action
  const confirmAction = useCallback(async (actionId: string): Promise<ActionResult> => {
    const pendingAction = pendingActions.find(a => a.id === actionId)
    if (!pendingAction) {
      return {
        success: false,
        message: 'Action not found',
        error: 'The requested action could not be found'
      }
    }

    setIsLoading(true)
    setPhase('executing_tool')

    try {
      const { data, error: functionError } = await supabase.functions.invoke('ai-execute-action', {
        body: {
          actionId,
          confirmation: pendingAction.confirmation,
          userId
        }
      })

      if (functionError) {
        throw new Error(functionError.message)
      }

      const result: ActionResult = {
        success: data.success,
        message: data.message,
        data: data.data,
        error: data.error
      }

      // Remove from pending
      setPendingActions(prev => prev.filter(a => a.id !== actionId))

      // Add result message
      const resultMessage: EnhancedMessage = {
        id: generateId(),
        type: 'assistant',
        content: [
          {
            type: 'action_result',
            data: result
          }
        ],
        createdAt: new Date()
      }
      setMessages(prev => [...prev, resultMessage])

      onActionComplete?.(result)
      return result
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Action failed'
      const result: ActionResult = {
        success: false,
        message: 'Action failed',
        error: errorMessage
      }
      onActionComplete?.(result)
      return result
    } finally {
      setIsLoading(false)
      setPhase('idle')
    }
  }, [pendingActions, userId, setPhase, onActionComplete])

  // Reject action
  const rejectAction = useCallback(async (actionId: string) => {
    setPendingActions(prev => prev.filter(a => a.id !== actionId))

    // Add cancellation message
    const cancelMessage: EnhancedMessage = {
      id: generateId(),
      type: 'system',
      content: [{ type: 'text', data: 'Action cancelled' }],
      createdAt: new Date()
    }
    setMessages(prev => [...prev, cancelMessage])
  }, [])

  // Cancel tool execution
  const cancelToolExecution = useCallback(() => {
    abortControllerRef.current?.abort()
    streamReaderRef.current?.cancel()
    setIsLoading(false)
    setIsStreaming(false)
    setPhase('idle')
    setCurrentToolExecution(null)
    setStreamingContent(null)
  }, [setPhase])

  // Clear conversation
  const clearConversation = useCallback(async () => {
    try {
      // End all active conversations for this user
      await supabase
        .from('ai_conversations')
        .update({ ended_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('ended_at', null)

      // Reset state
      setMessages([])
      setConversationId(null)
      setError(null)
      setChatState(defaultChatState)
      setCurrentToolExecution(null)
      setPendingActions([])
      setStreamingContent(null)
      setIsStreaming(false)
    } catch (err) {
      console.error('Failed to clear conversation:', err)
    }
  }, [userId])

  return {
    messages,
    chatState,
    isLoading,
    error,
    conversationId,
    currentToolExecution,
    pendingActions,
    sendMessage,
    confirmAction,
    rejectAction,
    cancelToolExecution,
    clearConversation,
    streamingContent,
    isStreaming
  }
}
