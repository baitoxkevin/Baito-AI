/**
 * Message List Component
 * Displays conversation messages with different styles for user/assistant
 */

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { User, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import type { Message } from '@/hooks/use-ai-chat'

interface MessageListProps {
  messages: Message[]
}

export function MessageList({ messages }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="space-y-4">
      {messages.map((message, index) => (
        <MessageBubble key={message.id || index} message={message} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  )
}

interface MessageBubbleProps {
  message: Message
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.type === 'user'
  const isError = message.type === 'error'
  const isSystem = message.type === 'system'

  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center"
      >
        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
          {message.content}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        'flex gap-3',
        isUser && 'flex-row-reverse'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser
            ? 'bg-blue-600 text-white'
            : isError
            ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
            : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      {/* Message Content */}
      <div className={cn('flex-1 min-w-0', isUser && 'flex justify-end')}>
        <div
          className={cn(
            'inline-block max-w-[85%] px-4 py-2 rounded-2xl',
            isUser
              ? 'bg-blue-600 text-white rounded-tr-sm'
              : isError
              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-100 rounded-tl-sm'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-sm'
          )}
        >
          <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="ml-4 mb-2 last:mb-0 list-disc">{children}</ul>,
                ol: ({ children }) => <ol className="ml-4 mb-2 last:mb-0 list-decimal">{children}</ol>,
                li: ({ children }) => <li className="mb-1">{children}</li>,
                code: ({ children, className }) => {
                  const isInline = !className
                  return isInline ? (
                    <code className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">
                      {children}
                    </code>
                  ) : (
                    <code className={`block p-2 bg-gray-900 dark:bg-black text-gray-100 rounded text-xs font-mono overflow-x-auto ${className}`}>
                      {children}
                    </code>
                  )
                },
                a: ({ children, href }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    {children}
                  </a>
                )
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Metadata */}
          {message.metadata && message.metadata.tools_used && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs opacity-75">
              <div className="flex flex-wrap gap-1">
                {message.metadata.tools_used.map((tool: string, i: number) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-white/20 dark:bg-black/20 rounded-full"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className="mt-1 text-xs opacity-60">
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
