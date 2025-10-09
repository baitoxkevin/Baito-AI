/**
 * Message List Component
 * Displays conversation messages with different styles for user/assistant
 */

import { motion } from 'framer-motion'
import { User, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Message } from '@/hooks/use-ai-chat'
import { ActionButtons } from './ActionButtons'
import { RichContentCard, type RichContent } from '@/components/chat/RichContentCard'

interface MessageListProps {
  messages: Message[]
}

export function MessageList({ messages }: MessageListProps) {
  return (
    <div
      className="space-y-3"
      role="log"
      aria-live="polite"
      aria-label="Conversation messages"
    >
      {messages.map((message, index) => (
        <MessageBubble key={message.id || index} message={message} />
      ))}
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
        className="flex justify-center my-4"
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
        'flex gap-2.5',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
      role="article"
      aria-label={isUser ? 'Your message' : isError ? 'Error message' : 'AI response'}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mt-0.5">
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center',
            isUser
              ? 'bg-blue-600 text-white'
              : isError
              ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
              : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
          )}
          role="img"
          aria-label={isUser ? 'User avatar' : 'AI assistant avatar'}
        >
          {isUser ? (
            <User className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Bot className="h-4 w-4" aria-hidden="true" />
          )}
        </div>
      </div>

      {/* Message Content */}
      <div className={cn('flex flex-col gap-1.5', isUser ? 'items-end' : 'items-start', 'max-w-[85%] min-w-0')}>
        {/* Message Bubble */}
        <div
          className={cn(
            'px-3.5 py-2.5 rounded-2xl w-full overflow-hidden',
            isUser
              ? 'bg-blue-600 text-white rounded-tr-md'
              : isError
              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-100 rounded-tl-md'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-md'
          )}
        >
          <div className="text-sm leading-relaxed w-full prose prose-sm dark:prose-invert max-w-none [&>*]:text-left [&_p]:my-1.5 [&_p]:text-left">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => (
                  <p className="my-1.5 text-left leading-relaxed last:mb-0 first:mt-0">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="ml-4 my-2 last:mb-0 first:mt-0 list-disc text-left space-y-1">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="ml-4 my-2 last:mb-0 first:mt-0 list-decimal text-left space-y-1">
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li className="text-left pl-1">{children}</li>,
                code: ({ children, className }) => {
                  const isInline = !className
                  return isInline ? (
                    <code className={cn(
                      'px-1.5 py-0.5 rounded text-xs font-mono whitespace-nowrap',
                      isUser
                        ? 'bg-blue-700 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    )}>
                      {children}
                    </code>
                  ) : (
                    <code className={`block p-3 my-2 bg-gray-900 dark:bg-black text-gray-100 rounded-lg text-xs font-mono overflow-x-auto ${className}`}>
                      {children}
                    </code>
                  )
                },
                a: ({ children, href }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'underline hover:no-underline break-all',
                      isUser ? 'text-blue-100' : 'text-blue-600 dark:text-blue-400'
                    )}
                  >
                    {children}
                  </a>
                ),
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                blockquote: ({ children }) => (
                  <blockquote className={cn(
                    'border-l-4 pl-3 py-1 my-2 italic text-left',
                    isUser ? 'border-blue-400' : 'border-gray-400 dark:border-gray-600'
                  )}>
                    {children}
                  </blockquote>
                ),
                table: ({ children }) => (
                  <div className="my-3 -mx-2 overflow-x-auto">
                    <div className="inline-block min-w-full align-middle">
                      <div className={cn(
                        'overflow-hidden rounded-lg border shadow-sm',
                        isUser
                          ? 'border-blue-400/30'
                          : 'border-gray-300 dark:border-gray-600'
                      )}>
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          {children}
                        </table>
                      </div>
                    </div>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className={cn(
                    'text-[10px] font-bold uppercase tracking-wider',
                    isUser
                      ? 'bg-blue-500/90 text-white'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  )}>
                    {children}
                  </thead>
                ),
                tbody: ({ children }) => (
                  <tbody className={cn(
                    'divide-y',
                    isUser
                      ? 'bg-blue-600/5 divide-blue-400/20'
                      : 'bg-white dark:bg-gray-900 divide-gray-200 dark:divide-gray-700'
                  )}>
                    {children}
                  </tbody>
                ),
                tr: ({ children }) => (
                  <tr className={cn(
                    'transition-colors',
                    isUser
                      ? 'hover:bg-blue-500/10'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  )}>
                    {children}
                  </tr>
                ),
                th: ({ children }) => (
                  <th className="px-3 py-2.5 text-left font-semibold">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className={cn(
                    'px-3 py-2.5 text-[11px] text-left',
                    isUser
                      ? 'text-white'
                      : 'text-gray-900 dark:text-gray-100'
                  )}>
                    {children}
                  </td>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Metadata - Tools Used */}
          {message.metadata && message.metadata.tools_used && message.metadata.tools_used.length > 0 && (
            <div className="mt-3 pt-2 border-t border-gray-300/20 dark:border-gray-600/20">
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className={cn(
                  'text-[10px] uppercase tracking-wide font-semibold opacity-60',
                  isUser ? 'text-white' : 'text-gray-600 dark:text-gray-400'
                )}>
                  Tools:
                </span>
                {message.metadata.tools_used.map((tool: string, i: number) => (
                  <span
                    key={i}
                    className={cn(
                      'px-2 py-0.5 rounded-md text-[11px] font-medium',
                      isUser
                        ? 'bg-blue-500/30 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    )}
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Rich Content - Show outside bubble for assistant messages */}
        {!isUser && message.metadata?.rich_content && (
          <div className="w-full">
            <RichContentCard content={message.metadata.rich_content as RichContent} />
          </div>
        )}

        {/* Action Buttons - Show outside bubble for assistant messages */}
        {!isUser && message.buttons && message.buttons.length > 0 && (
          <ActionButtons buttons={message.buttons} />
        )}

        {/* Timestamp - Outside bubble */}
        <div className={cn(
          'text-[11px] text-gray-400 dark:text-gray-500 px-0.5 mt-0.5',
          isUser ? 'text-right' : 'text-left'
        )}>
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </motion.div>
  )
}
