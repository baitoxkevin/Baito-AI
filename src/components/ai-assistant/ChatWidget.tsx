/**
 * AI Chat Widget - Main Component
 * Bottom-right floating chat interface with Framer Motion animations
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Minimize2, Maximize2, Trash2, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAIChat } from '@/hooks/use-ai-chat'
import { MessageList } from './MessageList'
import { TypingIndicator } from './TypingIndicator'
import { QuickActions } from './QuickActions'
import { cn } from '@/lib/utils'

interface ChatWidgetProps {
  userId: string
  className?: string
}

export function ChatWidget({ userId, className }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [showScrollButton, setShowScrollButton] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollViewportRef = useRef<HTMLDivElement>(null)

  const {
    messages,
    isLoading,
    sendMessage,
    conversationId,
    error,
    clearConversation
  } = useAIChat(userId)

  // Keyboard shortcut: Cmd/Ctrl + K to toggle chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, isMinimized])

  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading) return

    const message = inputMessage.trim()
    setInputMessage('')

    await sendMessage(message)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleQuickAction = (action: string) => {
    setInputMessage(action)
    inputRef.current?.focus()
  }

  const scrollToBottom = () => {
    const viewport = scrollViewportRef.current
    if (viewport) {
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior: 'smooth'
      })
    }
  }

  // Handle scroll to detect if user is at bottom
  useEffect(() => {
    const viewport = scrollViewportRef.current
    if (!viewport) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = viewport
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100
      setShowScrollButton(!isAtBottom && messages.length > 0)
    }

    viewport.addEventListener('scroll', handleScroll)
    return () => viewport.removeEventListener('scroll', handleScroll)
  }, [messages])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages.length])

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={cn(
              'fixed bottom-6 right-6 z-50',
              className
            )}
          >
            <Button
              onClick={() => setIsOpen(true)}
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow bg-blue-600 hover:bg-blue-700"
              aria-label="Open AI Assistant"
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              'fixed bottom-6 right-6 z-50',
              'bg-white dark:bg-gray-900 rounded-2xl shadow-2xl',
              'border border-gray-200 dark:border-gray-800',
              'flex flex-col overflow-hidden',
              isMinimized ? 'w-[350px] h-[60px]' : 'w-[420px] h-[700px]',
              'transition-all duration-300',
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <h3 className="font-semibold text-sm">AI Assistant</h3>
                {conversationId && (
                  <span className="text-xs opacity-75">Active</span>
                )}
              </div>

              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await clearConversation()
                    window.location.reload()
                  }}
                  className="h-8 w-8 p-0 hover:bg-blue-500/20 text-white"
                  aria-label="Clear conversation"
                  title="Start new conversation"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="h-8 w-8 p-0 hover:bg-blue-500/20 text-white"
                  aria-label={isMinimized ? 'Maximize' : 'Minimize'}
                >
                  {isMinimized ? (
                    <Maximize2 className="h-4 w-4" />
                  ) : (
                    <Minimize2 className="h-4 w-4" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0 hover:bg-blue-500/20 text-white"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content - only show when not minimized */}
            {!isMinimized && (
              <>
                {/* Messages Area */}
                <div className="flex-1 relative overflow-hidden">
                  <div
                    ref={scrollViewportRef}
                    className="h-full overflow-y-auto overflow-x-hidden p-4 scroll-smooth"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#cbd5e1 transparent'
                    }}
                  >
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center space-y-4 min-h-[400px]">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                          <MessageCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                            How can I help you today?
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Ask me about projects, candidates, schedules, or anything else.
                          </p>
                        </div>

                        {/* Quick Actions */}
                        <QuickActions onSelect={handleQuickAction} />
                      </div>
                    ) : (
                      <>
                        <MessageList messages={messages} />
                        {isLoading && <TypingIndicator />}
                      </>
                    )}

                    {error && (
                      <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                        <strong>Error:</strong> {error}
                      </div>
                    )}
                  </div>

                  {/* Scroll to Bottom Button */}
                  <AnimatePresence>
                    {showScrollButton && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 10 }}
                        className="absolute bottom-4 right-4 z-10"
                      >
                        <Button
                          onClick={scrollToBottom}
                          size="icon"
                          className="h-10 w-10 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white border-2 border-white dark:border-gray-800"
                          aria-label="Scroll to bottom"
                        >
                          <ArrowDown className="h-5 w-5" />
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex space-x-2">
                    <Input
                      ref={inputRef}
                      type="text"
                      placeholder="Type your message..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSend}
                      disabled={isLoading || !inputMessage.trim()}
                      size="icon"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700">⌘ K</kbd> to toggle
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
