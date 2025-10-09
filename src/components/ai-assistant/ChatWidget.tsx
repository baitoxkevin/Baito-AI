/**
 * AI Chat Widget - Main Component
 * Bottom-right floating chat interface with Framer Motion animations
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Minimize2, Maximize2, Trash2, ArrowDown, Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAIChat } from '@/hooks/use-ai-chat'
import { MessageList } from './MessageList'
import { TypingIndicator } from './TypingIndicator'
import { QuickActions } from './QuickActions'
import { VoiceInput } from '@/components/chat/VoiceInput'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/hooks/use-toast'
import { colors, shadows, borderRadius, zIndex } from '@/lib/chat/design-tokens'
// Direct path to optimized image in public folder
const baigerAvatar = '/baiger-optimized.png'

interface ChatWidgetProps {
  userId: string
  userRole?: 'admin' | 'manager' | 'staff'
  className?: string
}

export function ChatWidget({ userId, userRole = 'manager', className }: ChatWidgetProps) {
  const { t, i18n } = useTranslation()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
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

  // Language toggle function
  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('zh') ? 'en-US' : 'zh-CN'
    i18n.changeLanguage(newLang)
  }

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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

    // Announce to screen readers
    const announcement = document.createElement('div')
    announcement.setAttribute('role', 'status')
    announcement.setAttribute('aria-live', 'polite')
    announcement.className = 'sr-only'
    announcement.textContent = t('accessibility.messageSent', 'Message sent')
    document.body.appendChild(announcement)
    setTimeout(() => document.body.removeChild(announcement), 1000)

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

  const handleVoiceTranscript = (text: string) => {
    setInputMessage(text)
    inputRef.current?.focus()
  }

  const handleVoiceError = (error: Error) => {
    console.error('Voice input error:', error)
    toast({
      title: t('voice.error', 'Voice input failed'),
      description: error.message || t('errors.unknownError', 'An unknown error occurred'),
      variant: 'destructive'
    })
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
              className="h-16 w-16 rounded-full transition-all hover:scale-105 bg-white border-2 p-0 overflow-hidden"
              style={{
                boxShadow: shadows.fab,
                borderColor: colors.primary[200],
                zIndex: zIndex.chatWidget
              }}
              aria-label={t('accessibility.openChat', 'Open AI Assistant')}
            >
              <img
                src={baigerAvatar}
                alt="Baiger AI"
                className="w-full h-full object-cover"
              />
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
              'fixed',
              isMobile ? 'inset-0' : 'bottom-6 right-6',
              'bg-white dark:bg-gray-900',
              isMobile ? '' : 'border border-gray-200 dark:border-gray-800',
              'flex flex-col overflow-hidden',
              isMobile
                ? 'w-full h-full'
                : isMinimized
                ? 'w-[350px] h-[60px]'
                : 'w-[420px] h-[700px]',
              'transition-all duration-300',
              className
            )}
            style={{
              borderRadius: isMobile ? 0 : borderRadius.widget,
              boxShadow: isMobile ? 'none' : shadows.widget,
              zIndex: zIndex.chatWidget
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 text-white"
              style={{
                background: `linear-gradient(to right, ${colors.primary[600]}, ${colors.primary[700]})`
              }}
            >
              <div className="flex items-center space-x-3">
                <img
                  src={baigerAvatar}
                  alt="Baiger"
                  className="h-8 w-8 rounded-full border-2 border-white shadow-sm"
                />
                <div className="flex items-center space-x-2">
                  <div
                    className="h-2 w-2 rounded-full animate-pulse"
                    style={{ backgroundColor: colors.status.online }}
                    title={t('chat.online', 'Online')}
                  />
                  <h3 className="font-semibold text-sm">{t('chat.header', 'AI Assistant')}</h3>
                  {conversationId && (
                    <span className="text-xs opacity-75">{t('chat.connected', 'Active')}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-1">
                {/* Language Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleLanguage}
                  className="h-8 w-8 p-0 hover:bg-blue-500/20 text-white"
                  aria-label={t('accessibility.switchLanguage', 'Switch language')}
                  title={i18n.language.startsWith('zh') ? 'Switch to English' : '切换到中文'}
                >
                  <Languages className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await clearConversation()
                    window.location.reload()
                  }}
                  className="h-8 w-8 p-0 hover:bg-blue-500/20 text-white"
                  aria-label={t('chat.clearConversation', 'Clear conversation')}
                  title={t('chat.clearConversation', 'Start new conversation')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>

                {!isMobile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="h-8 w-8 p-0 hover:bg-blue-500/20 text-white"
                    aria-label={t(isMinimized ? 'chat.maximize' : 'chat.minimize', isMinimized ? 'Maximize' : 'Minimize')}
                  >
                    {isMinimized ? (
                      <Maximize2 className="h-4 w-4" />
                    ) : (
                      <Minimize2 className="h-4 w-4" />
                    )}
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0 hover:bg-blue-500/20 text-white"
                  aria-label={t('accessibility.closeChat', 'Close chat')}
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
                    className={cn(
                      'h-full overflow-y-auto overflow-x-hidden scroll-smooth',
                      isMobile ? 'p-3' : 'p-4'
                    )}
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#cbd5e1 transparent'
                    }}
                  >
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center space-y-4 min-h-[400px]">
                        <img
                          src={baigerAvatar}
                          alt="Baiger AI Assistant"
                          className="w-24 h-24 rounded-full shadow-lg"
                        />
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                            {t('messages.welcome', 'How can I help you today?')}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('messages.welcomeDescription', 'Ask me about projects, candidates, schedules, or anything else.')}
                          </p>
                        </div>

                        {/* Quick Actions */}
                        <QuickActions onSelect={handleQuickAction} userRole={userRole} />
                      </div>
                    ) : (
                      <>
                        <MessageList messages={messages} />
                        {isLoading && <TypingIndicator />}
                      </>
                    )}

                    {error && (
                      <div
                        className="mt-2 p-3 text-sm"
                        style={{
                          backgroundColor: colors.chat.errorBubble,
                          borderColor: colors.chat.errorBorder,
                          color: colors.chat.errorText,
                          borderWidth: '1px',
                          borderStyle: 'solid',
                          borderRadius: borderRadius.DEFAULT
                        }}
                      >
                        <strong>{t('messages.errorOccurred', 'Error')}:</strong> {error}
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
                          className="h-10 w-10 rounded-full shadow-lg text-white border-2 border-white dark:border-gray-800"
                          style={{
                            backgroundColor: colors.primary[600]
                          }}
                          aria-label={t('accessibility.scrollToBottom', 'Scroll to bottom')}
                        >
                          <ArrowDown className="h-5 w-5" />
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Input Area */}
                <div className={cn(
                  'border-t border-gray-200 dark:border-gray-800',
                  isMobile ? 'p-3' : 'p-4'
                )}>
                  <div className={cn('flex', isMobile ? 'space-x-1.5' : 'space-x-2')}>
                    <Input
                      ref={inputRef}
                      type="text"
                      placeholder={t('chat.placeholder', 'Type your message...')}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={isLoading}
                      className={cn('flex-1', isMobile && 'h-11 text-base')}
                      aria-label={t('accessibility.messageInput', 'Message input')}
                    />
                    <VoiceInput
                      onTranscript={handleVoiceTranscript}
                      onError={handleVoiceError}
                      language={i18n.language.startsWith('zh') ? 'zh' : 'en'}
                      disabled={isLoading}
                      isMobile={isMobile}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={isLoading || !inputMessage.trim()}
                      size="icon"
                      className={cn('text-white', isMobile && 'h-11 w-11')}
                      style={{
                        backgroundColor: colors.primary[600]
                      }}
                      aria-label={t('accessibility.sendMessage', 'Send message')}
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
