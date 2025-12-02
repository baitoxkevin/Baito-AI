/**
 * Enhanced Message List Component
 * Renders messages with support for rich content, tool execution, and confirmations
 */

import { useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Bot, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useNavigate } from 'react-router-dom'
import type {
  EnhancedMessage,
  MessageContent,
  ProjectCardData,
  CandidateCardData,
  TableData,
  MetricsData,
  ScheduleData,
  StatusData,
  ConfirmationRequest,
  ActionResult,
  ActionButton
} from '@/types/ai-chat.types'
import { ProjectDataCard, ProjectDataCardList } from './DataCards/ProjectDataCard'
import { CandidateDataCard, CandidateDataCardList } from './DataCards/CandidateDataCard'
import { DataTable } from './DataCards/DataTable'
import { ConfirmationDialog } from './ConfirmationDialog'
import { ActionButtons } from './ActionButtons'
import { RichContentCard, type RichContent } from '@/components/chat/RichContentCard'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Known action commands to filter out
const ACTION_COMMANDS = [
  'get_projects', 'get_project_details', 'create_project',
  'find_candidates', 'get_candidate_details',
  'assign_staff', 'get_project_staff', 'update_staff_status',
  'get_project_stats', 'get_upcoming_deadlines',
  'get_expense_claims', 'get_pending_approvals', 'approve_expense_claim', 'reject_expense_claim',
  'execute_sql', 'save_user_memory'
]

function isActionCommand(text: string): boolean {
  const trimmed = text.trim().toLowerCase()
  for (const cmd of ACTION_COMMANDS) {
    if (trimmed.startsWith(cmd)) return true
  }
  if (/^[a-z_]+(\?|$)/.test(trimmed) && trimmed.includes('_') && trimmed.length < 100) return true
  return false
}

interface EnhancedMessageListProps {
  messages: EnhancedMessage[]
  onAction?: (action: string) => void
  onConfirm?: (actionId: string) => Promise<void>
  onReject?: (actionId: string) => void
  onViewProject?: (projectId: string) => void
  onViewCandidate?: (candidateId: string) => void
  onAssignStaff?: (projectId: string) => void
  processingActionId?: string
  className?: string
}

export function EnhancedMessageList({
  messages,
  onAction,
  onConfirm,
  onReject,
  onViewProject,
  onViewCandidate,
  onAssignStaff,
  processingActionId,
  className
}: EnhancedMessageListProps) {
  const navigate = useNavigate()

  // Filter out action command messages
  const visibleMessages = messages.filter(msg => {
    if (msg.type !== 'user') return true
    const textContent = msg.content.find(c => c.type === 'text')
    if (!textContent || textContent.type !== 'text') return true
    return !isActionCommand(textContent.data)
  })

  // Handle navigation
  const handleViewProject = useCallback((projectId: string) => {
    if (onViewProject) {
      onViewProject(projectId)
    } else {
      navigate(`/projects/${projectId}`)
    }
  }, [navigate, onViewProject])

  const handleViewCandidate = useCallback((candidateId: string) => {
    if (onViewCandidate) {
      onViewCandidate(candidateId)
    } else {
      navigate(`/candidates/${candidateId}`)
    }
  }, [navigate, onViewCandidate])

  return (
    <div
      className={cn('space-y-4', className)}
      role="log"
      aria-live="polite"
      aria-label="Conversation messages"
    >
      <AnimatePresence mode="popLayout">
        {visibleMessages.map((message, index) => (
          <EnhancedMessageBubble
            key={message.id || index}
            message={message}
            onAction={onAction}
            onConfirm={onConfirm}
            onReject={onReject}
            onViewProject={handleViewProject}
            onViewCandidate={handleViewCandidate}
            onAssignStaff={onAssignStaff}
            processingActionId={processingActionId}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

interface EnhancedMessageBubbleProps {
  message: EnhancedMessage
  onAction?: (action: string) => void
  onConfirm?: (actionId: string) => Promise<void>
  onReject?: (actionId: string) => void
  onViewProject?: (projectId: string) => void
  onViewCandidate?: (candidateId: string) => void
  onAssignStaff?: (projectId: string) => void
  processingActionId?: string
}

function EnhancedMessageBubble({
  message,
  onAction,
  onConfirm,
  onReject,
  onViewProject,
  onViewCandidate,
  onAssignStaff,
  processingActionId
}: EnhancedMessageBubbleProps) {
  const isUser = message.type === 'user'
  const isError = message.type === 'error'
  const isSystem = message.type === 'system'

  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex justify-center my-4"
      >
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
          <Info className="h-3 w-3" />
          {message.content[0]?.type === 'text' && message.content[0].data}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
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
        >
          {isUser ? (
            <User className="h-4 w-4" />
          ) : isError ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <Bot className="h-4 w-4" />
          )}
        </div>
      </div>

      {/* Message Content */}
      <div className={cn(
        'flex flex-col gap-2',
        isUser ? 'items-end' : 'items-start',
        'max-w-[85%] min-w-0'
      )}>
        {/* Render each content block */}
        {message.content.map((content, idx) => (
          <ContentBlock
            key={idx}
            content={content}
            isUser={isUser}
            isError={isError}
            onViewProject={onViewProject}
            onViewCandidate={onViewCandidate}
            onAssignStaff={onAssignStaff}
          />
        ))}

        {/* Tool execution info */}
        {message.toolExecution && message.toolExecution.steps.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center mt-1">
            <span className="text-[10px] uppercase tracking-wide font-semibold text-gray-400">
              Tools used:
            </span>
            {message.toolExecution.steps.flatMap(s => s.toolCalls).map((tool, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="text-[10px] px-1.5 py-0"
              >
                {tool.displayName}
              </Badge>
            ))}
          </div>
        )}

        {/* Pending confirmation */}
        {message.pendingConfirmation && onConfirm && onReject && (
          <ConfirmationDialog
            confirmation={message.pendingConfirmation}
            onConfirm={onConfirm}
            onCancel={onReject}
            isProcessing={processingActionId === message.pendingConfirmation.id}
            className="mt-2"
          />
        )}

        {/* Action buttons */}
        {!isUser && message.buttons && message.buttons.length > 0 && (
          <ActionButtons
            buttons={message.buttons as any}
            onAction={onAction}
          />
        )}

        {/* Timestamp */}
        <div className={cn(
          'text-[10px] text-gray-400 dark:text-gray-500 px-0.5',
          isUser ? 'text-right' : 'text-left'
        )}>
          {message.createdAt.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </motion.div>
  )
}

interface ContentBlockProps {
  content: MessageContent
  isUser: boolean
  isError: boolean
  onViewProject?: (projectId: string) => void
  onViewCandidate?: (candidateId: string) => void
  onAssignStaff?: (projectId: string) => void
}

function ContentBlock({
  content,
  isUser,
  isError,
  onViewProject,
  onViewCandidate,
  onAssignStaff
}: ContentBlockProps) {
  switch (content.type) {
    case 'text':
      return (
        <div
          className={cn(
            'px-3.5 py-2.5 rounded-2xl w-full',
            isUser
              ? 'bg-blue-600 text-white rounded-tr-md'
              : isError
              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-100 rounded-tl-md'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-md'
          )}
        >
          <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => (
                  <p className="my-1.5 leading-relaxed last:mb-0 first:mt-0">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="ml-4 my-2 list-disc space-y-1">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="ml-4 my-2 list-decimal space-y-1">
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li className="pl-1">{children}</li>,
                code: ({ children, className }) => {
                  const isInline = !className
                  return isInline ? (
                    <code className={cn(
                      'px-1.5 py-0.5 rounded text-xs font-mono',
                      isUser
                        ? 'bg-blue-700 text-white'
                        : 'bg-gray-200 dark:bg-gray-700'
                    )}>
                      {children}
                    </code>
                  ) : (
                    <code className="block p-3 my-2 bg-gray-900 text-gray-100 rounded-lg text-xs font-mono overflow-x-auto">
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
                      'underline hover:no-underline',
                      isUser ? 'text-blue-100' : 'text-blue-600 dark:text-blue-400'
                    )}
                  >
                    {children}
                  </a>
                ),
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              }}
            >
              {content.data}
            </ReactMarkdown>
          </div>
        </div>
      )

    case 'project_card':
      const projectData = content.data as ProjectCardData
      return (
        <ProjectDataCard
          project={projectData}
          onViewDetails={onViewProject}
          onAssignStaff={onAssignStaff}
          compact
        />
      )

    case 'candidate_card':
      const candidateData = content.data as CandidateCardData
      return (
        <CandidateDataCard
          candidate={candidateData}
          onViewProfile={onViewCandidate}
          compact
        />
      )

    case 'table':
      const tableData = content.data as TableData
      return (
        <DataTable
          data={tableData}
          compact
        />
      )

    case 'metrics':
      const metricsData = content.data as MetricsData
      return (
        <RichContentCard
          content={{
            type: 'metrics',
            data: metricsData
          }}
        />
      )

    case 'schedule':
      const scheduleData = content.data as ScheduleData
      return (
        <RichContentCard
          content={{
            type: 'schedule',
            data: scheduleData
          }}
        />
      )

    case 'status':
      const statusData = content.data as StatusData
      return (
        <RichContentCard
          content={{
            type: 'status',
            data: statusData
          }}
        />
      )

    case 'action_result':
      const result = content.data as ActionResult
      return (
        <Card className={cn(
          'border-2',
          result.success
            ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
            : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
        )}>
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              {result.success ? (
                <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <svg className="h-3 w-3 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="h-5 w-5 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
                </div>
              )}
              <div>
                <p className={cn(
                  'text-sm font-medium',
                  result.success
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-red-800 dark:text-red-200'
                )}>
                  {result.message}
                </p>
                {result.error && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {result.error}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )

    default:
      return null
  }
}
