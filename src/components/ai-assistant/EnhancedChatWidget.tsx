/**
 * Enhanced AI Chat Widget
 * Complete chat interface with tool execution, streaming, and rich content support
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle,
  X,
  Send,
  Minimize2,
  Maximize2,
  Trash2,
  ArrowDown,
  Languages,
  Users,
  Calculator,
  Briefcase,
  Sparkles,
  StopCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEnhancedAIChat } from '@/hooks/use-enhanced-ai-chat'
import { usePageContext } from '@/hooks/use-page-context'
import { EnhancedMessageList } from './EnhancedMessageList'
import { ToolExecutionIndicator, CompactToolIndicator } from './ToolExecutionIndicator'
import { TypingIndicator } from './TypingIndicator'
import { QuickActions } from './QuickActions'
import { WelcomeOnboarding, useOnboardingState } from './WelcomeOnboarding'
import { PersonaSelector } from './PersonaSelector'
import { SuggestionBar } from './SuggestionBar'
import { VoiceInput } from '@/components/chat/VoiceInput'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/hooks/use-toast'
import { colors, shadows, borderRadius, zIndex } from '@/lib/chat/design-tokens'
import { ErrorReportDialog, ErrorReportData } from '@/components/error-reporting/ErrorReportDialog'
import { useErrorReport } from '@/hooks/use-error-report'

// Persona types and configurations
type Persona = 'general' | 'operations' | 'finance' | 'hr'

const PERSONA_CONFIG: Record<Persona, {
  name: string
  icon: React.ReactNode
  description: string
  tagline: string
  color: string
}> = {
  general: {
    name: 'All Tasks',
    icon: <Sparkles className="h-4 w-4" />,
    description: 'Ask me anything',
    tagline: 'Your everyday helper',
    color: colors.primary[600],
  },
  operations: {
    name: 'Events & Schedules',
    icon: <Briefcase className="h-4 w-4" />,
    description: 'Plan and track work',
    tagline: 'Projects, shifts, venues',
    color: '#059669',
  },
  finance: {
    name: 'Money Matters',
    icon: <Calculator className="h-4 w-4" />,
    description: 'Track spending',
    tagline: 'Expenses, budgets, claims',
    color: '#D97706',
  },
  hr: {
    name: 'People & Teams',
    icon: <Users className="h-4 w-4" />,
    description: 'Manage staff',
    tagline: 'Find and manage team members',
    color: '#7C3AED',
  },
}

const baigerAvatar = '/baiger-optimized.png'

interface BaigerContextData {
  mode: 'general' | 'project_create' | 'candidate_search' | 'schedule_help'
  formRef?: React.RefObject<unknown>
  initialMessage?: string
  onFormUpdate?: (field: string, value: unknown) => void
}

interface EnhancedChatWidgetProps {
  userId: string
  userRole?: 'admin' | 'manager' | 'staff'
  className?: string
  externalOpen?: boolean
  onOpenChange?: (open: boolean) => void
  hideFloatingButton?: boolean
  contextData?: BaigerContextData | null
  enableStreaming?: boolean
  enableToolExecution?: boolean
}

export function EnhancedChatWidget({
  userId,
  userRole = 'manager',
  className,
  externalOpen,
  onOpenChange,
  hideFloatingButton = false,
  contextData,
  enableStreaming = true,
  enableToolExecution = true
}: EnhancedChatWidgetProps) {
  const { t, i18n } = useTranslation()
  const { toast } = useToast()
  const [internalOpen, setInternalOpen] = useState(false)

  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen
  const setIsOpen = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open)
    } else {
      setInternalOpen(open)
    }
  }

  const [isMinimized, setIsMinimized] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [persona, setPersona] = useState<Persona>('general')
  const [processingActionId, setProcessingActionId] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const scrollViewportRef = useRef<HTMLDivElement>(null)

  // Error reporting state
  const [tapTimestamps, setTapTimestamps] = useState<number[]>([])
  const [showErrorReportDialog, setShowErrorReportDialog] = useState(false)
  const [errorReportData, setErrorReportData] = useState<ErrorReportData | null>(null)
  const { captureScreenshot, generateErrorId } = useErrorReport({ userId })

  // Onboarding state
  const { hasOnboarded, completeOnboarding } = useOnboardingState()

  // Page context
  const pageContext = usePageContext()

  // Enhanced chat hook
  const {
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
  } = useEnhancedAIChat({
    userId,
    persona,
    pageContext,
    enableStreaming,
    enableToolExecution,
    onConfirmationRequired: (confirmation) => {
      toast({
        title: 'Action Required',
        description: confirmation.title,
      })
    },
    onActionComplete: (result) => {
      toast({
        title: result.success ? 'Success' : 'Error',
        description: result.message,
        variant: result.success ? 'default' : 'destructive'
      })
    }
  })

  // Handle Baiger avatar tap for error reporting
  const handleBaigerTap = useCallback(async () => {
    const now = Date.now()
    const recentTaps = [...tapTimestamps, now].filter(t => now - t < 3000)
    setTapTimestamps(recentTaps)

    if (recentTaps.length >= 5) {
      setTapTimestamps([])
      try {
        const screenshot = await captureScreenshot()
        const data: ErrorReportData = {
          errorId: generateErrorId(),
          errorMessage: 'Manual Feedback/Bug Report',
          screenshot: screenshot || undefined,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          pageContext: document.title,
        }
        setErrorReportData(data)
        setShowErrorReportDialog(true)
      } catch {
        setErrorReportData({
          errorId: generateErrorId(),
          errorMessage: 'Manual Feedback/Bug Report',
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          pageContext: document.title,
        })
        setShowErrorReportDialog(true)
      }
    }
  }, [tapTimestamps, captureScreenshot, generateErrorId])

  // Language toggle
  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('zh') ? 'en-US' : 'zh-CN'
    i18n.changeLanguage(newLang)
  }

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(!isOpen)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, isMinimized])

  // Context data handling
  const [contextGreeting, setContextGreeting] = useState<string | null>(null)
  const contextFormUpdateRef = useRef<((field: string, value: unknown) => void) | null>(null)

  useEffect(() => {
    if (contextData?.initialMessage && isOpen) {
      setContextGreeting(contextData.initialMessage)
      contextFormUpdateRef.current = contextData.onFormUpdate || null
    }
  }, [contextData, isOpen])

  useEffect(() => {
    if (!isOpen) {
      setContextGreeting(null)
      contextFormUpdateRef.current = null
    }
  }, [isOpen])

  // Theme colors based on context
  const isProjectMode = contextData?.mode === 'project_create'
  const themeColors = {
    primary: isProjectMode ? '#7C3AED' : colors.primary[600],
    secondary: isProjectMode ? '#6D28D9' : colors.primary[700],
  }

  // Send message handler
  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading) return

    const message = inputMessage.trim()
    setInputMessage('')

    // Screen reader announcement
    const announcement = document.createElement('div')
    announcement.setAttribute('role', 'status')
    announcement.setAttribute('aria-live', 'polite')
    announcement.className = 'sr-only'
    announcement.textContent = t('accessibility.messageSent', 'Message sent')
    document.body.appendChild(announcement)
    setTimeout(() => document.body.removeChild(announcement), 1000)

    await sendMessage(message)
  }

  // Keyboard handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  // Quick action handler
  const handleQuickAction = (action: string) => {
    setInputMessage(action)
    inputRef.current?.focus()
  }

  // Voice input handlers
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

  // Scroll handlers
  const scrollToBottom = () => {
    const viewport = scrollViewportRef.current
    if (viewport) {
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior: 'smooth'
      })
    }
  }

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

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages.length])

  // Confirmation handlers
  const handleConfirmAction = async (actionId: string) => {
    setProcessingActionId(actionId)
    try {
      await confirmAction(actionId)
    } finally {
      setProcessingActionId(null)
    }
  }

  const handleRejectAction = (actionId: string) => {
    rejectAction(actionId)
  }

  // Navigation handlers
  const handleViewProject = (projectId: string) => {
    window.location.href = `/projects/${projectId}`
  }

  const handleViewCandidate = (candidateId: string) => {
    window.location.href = `/candidates/${candidateId}`
  }

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && !hideFloatingButton && !isMobile && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={cn('fixed bottom-6 right-6 z-50', className)}
          >
            <Button
              onClick={() => {
                handleBaigerTap()
                setIsOpen(true)
              }}
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
              className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 text-white transition-colors duration-300 relative"
              style={{
                background: `linear-gradient(to right, ${themeColors.primary}, ${themeColors.secondary})`,
                zIndex: 10002,
                pointerEvents: 'auto'
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={handleBaigerTap}
                  className="focus:outline-none focus:ring-2 focus:ring-white/50 rounded-full"
                  aria-label="Tap 5 times quickly for bug report"
                >
                  <img
                    src={baigerAvatar}
                    alt="Baiger"
                    className="h-8 w-8 rounded-full border-2 border-white shadow-sm flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                  />
                </button>
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="h-2 w-2 rounded-full animate-pulse flex-shrink-0"
                    style={{ backgroundColor: colors.status.online }}
                    title={t('chat.online', 'Online')}
                  />
                  <h3 className="font-semibold text-sm whitespace-nowrap">
                    {t('chat.header', 'Baiger')}
                  </h3>
                  {/* Show current phase indicator */}
                  {chatState.phase !== 'idle' && (
                    <CompactToolIndicator
                      phase={chatState.phase}
                      currentTool={chatState.currentTool}
                      className="ml-2"
                    />
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-1">
                {/* Cancel button when processing */}
                {(isLoading || isStreaming) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={cancelToolExecution}
                    className="h-8 w-8 p-0 hover:bg-red-500/20 text-white"
                    aria-label="Cancel"
                    title="Cancel current operation"
                  >
                    <StopCircle className="h-4 w-4" />
                  </Button>
                )}

                <PersonaSelector
                  currentPersona={persona}
                  onSelectPersona={setPersona}
                  onSelectExample={(example) => {
                    setInputMessage(example)
                    inputRef.current?.focus()
                  }}
                />

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleLanguage}
                  className="h-8 w-8 p-0 hover:bg-blue-500/20 text-white"
                  aria-label={t('accessibility.switchLanguage', 'Switch language')}
                  title={i18n.language.startsWith('zh') ? 'Switch to English' : 'Switch to Chinese'}
                >
                  <Languages className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await clearConversation()
                    setInputMessage('')
                    scrollViewportRef.current?.scrollTo({ top: 0 })
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

            {/* Content */}
            {!isMinimized && (
              <>
                {/* Messages Area */}
                <div
                  className="flex-1 relative overflow-hidden"
                  style={{ zIndex: 10001, pointerEvents: 'auto' }}
                >
                  <div
                    ref={scrollViewportRef}
                    className={cn(
                      'h-full overflow-y-auto overflow-x-hidden scroll-smooth',
                      isMobile ? 'p-3' : 'p-4'
                    )}
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#cbd5e1 transparent',
                      pointerEvents: 'auto'
                    }}
                  >
                    {messages.length === 0 ? (
                      contextGreeting ? (
                        <div className="flex flex-col h-full">
                          <div className="flex items-start gap-3 mb-4">
                            <motion.img
                              src={baigerAvatar}
                              alt="Baiger AI Assistant"
                              className="w-10 h-10 rounded-full shadow-md border-2 border-white flex-shrink-0"
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ type: 'spring', stiffness: 200 }}
                            />
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 }}
                              className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-md px-4 py-3 max-w-[85%]"
                            >
                              <p className="text-sm text-gray-900 dark:text-gray-100">
                                {contextGreeting}
                              </p>
                            </motion.div>
                          </div>
                          {contextData?.mode === 'project_create' && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 }}
                              className="flex flex-wrap gap-2 mt-auto pt-4"
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() => handleQuickAction("What information do you need from me?")}
                              >
                                What's needed?
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() => handleQuickAction("Help me estimate the crew size")}
                              >
                                Estimate crew
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() => handleQuickAction("Set a reminder for this project")}
                              >
                                Set reminder
                              </Button>
                            </motion.div>
                          )}
                        </div>
                      ) : !hasOnboarded ? (
                        <WelcomeOnboarding
                          onGetStarted={completeOnboarding}
                          onSkip={completeOnboarding}
                          onSelectPrompt={(prompt) => {
                            setInputMessage(prompt)
                            inputRef.current?.focus()
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 min-h-[400px]">
                          <motion.img
                            src={baigerAvatar}
                            alt="Baiger AI Assistant"
                            className="w-20 h-20 rounded-full shadow-lg border-4 border-white"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 200 }}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                          >
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                              {t('messages.welcomeBack', 'Welcome back! How can I help?')}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                              {t('messages.readyToHelp', 'Ready when you are')}
                            </p>
                          </motion.div>
                          <QuickActions onSelect={handleQuickAction} userRole={userRole} />
                        </div>
                      )
                    ) : (
                      <>
                        <EnhancedMessageList
                          messages={messages}
                          onAction={async (action) => {
                            await sendMessage(action)
                          }}
                          onConfirm={handleConfirmAction}
                          onReject={handleRejectAction}
                          onViewProject={handleViewProject}
                          onViewCandidate={handleViewCandidate}
                          processingActionId={processingActionId || undefined}
                        />

                        {/* Tool execution indicator */}
                        {chatState.phase !== 'idle' && chatState.phase !== 'streaming' && currentToolExecution && (
                          <ToolExecutionIndicator
                            phase={chatState.phase}
                            currentTool={chatState.currentTool}
                            steps={currentToolExecution}
                            className="mt-4"
                          />
                        )}

                        {/* Streaming content */}
                        {isStreaming && streamingContent && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-2.5 mt-4"
                          >
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                                <img src={baigerAvatar} alt="Baiger" className="w-full h-full object-cover rounded-full" />
                              </div>
                            </div>
                            <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-md bg-gray-100 dark:bg-gray-800 max-w-[85%]">
                              <p className="text-sm text-gray-900 dark:text-gray-100">
                                {streamingContent}
                                <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse" />
                              </p>
                            </div>
                          </motion.div>
                        )}

                        {/* Loading indicator */}
                        {isLoading && !isStreaming && !currentToolExecution && <TypingIndicator />}
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
                            backgroundColor: themeColors.primary
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
                <div
                  className={cn(
                    'border-t border-gray-200 dark:border-gray-800 relative',
                    isMobile ? 'p-3' : 'p-4'
                  )}
                  style={{ zIndex: 10001, pointerEvents: 'auto' }}
                >
                  {messages.length > 0 && (
                    <SuggestionBar
                      persona={persona}
                      userRole={userRole}
                      onSelect={handleQuickAction}
                      isTyping={!!inputMessage.trim()}
                      className="mb-3"
                    />
                  )}

                  <div className={cn('flex items-end', isMobile ? 'space-x-1.5' : 'space-x-2')}>
                    <textarea
                      ref={inputRef}
                      placeholder={t('chat.placeholder', 'Type your message...')}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={isLoading}
                      rows={1}
                      className={cn(
                        'flex-1 min-h-[44px] max-h-[120px] px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600',
                        'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                        'placeholder:text-gray-500 dark:placeholder:text-gray-400',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                        'resize-none overflow-y-auto',
                        isMobile && 'text-base'
                      )}
                      style={{
                        height: 'auto',
                        minHeight: isMobile ? '44px' : '40px'
                      }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement
                        target.style.height = 'auto'
                        target.style.height = Math.min(target.scrollHeight, 120) + 'px'
                      }}
                      aria-label={t('accessibility.messageInput', 'Message input field')}
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
                        backgroundColor: themeColors.primary
                      }}
                      aria-label={t('accessibility.sendMessage', 'Send message')}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    {t('chat.inputHint', 'Press Enter for new line, Cmd+Enter to send')}
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Report Dialog */}
      <ErrorReportDialog
        open={showErrorReportDialog}
        onOpenChange={(open) => {
          setShowErrorReportDialog(open)
          if (!open) {
            setTimeout(() => setErrorReportData(null), 300)
          }
        }}
        errorData={errorReportData}
        userId={userId}
      />
    </>
  )
}
