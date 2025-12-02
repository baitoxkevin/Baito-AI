/**
 * Tool Execution Indicator Component
 * Displays multi-step AI reasoning with visual feedback for each tool execution phase
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Database,
  Search,
  Zap,
  BarChart3,
  Globe,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  ChevronDown,
  ChevronUp,
  Bot
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  ToolExecutionStep,
  ToolCall,
  ToolCategory,
  ToolExecutionStatus,
  ChatPhase
} from '@/types/ai-chat.types'

// Tool category icons
const categoryIcons: Record<ToolCategory, React.ElementType> = {
  database: Database,
  search: Search,
  action: Zap,
  analysis: BarChart3,
  external: Globe,
}

// Status icons
const statusIcons: Record<ToolExecutionStatus, React.ElementType> = {
  pending: Clock,
  executing: Loader2,
  completed: CheckCircle2,
  failed: XCircle,
  cancelled: XCircle,
}

// Status colors
const statusColors: Record<ToolExecutionStatus, string> = {
  pending: 'text-gray-400',
  executing: 'text-blue-500',
  completed: 'text-green-500',
  failed: 'text-red-500',
  cancelled: 'text-gray-500',
}

// Chat phase display messages
const phaseMessages: Record<ChatPhase, string> = {
  idle: '',
  thinking: 'Thinking...',
  searching: 'Searching database...',
  executing_tool: 'Executing action...',
  awaiting_confirmation: 'Waiting for your confirmation...',
  responding: 'Generating response...',
  streaming: 'Responding...',
  error: 'Something went wrong',
}

// Chat phase icons
const phaseIcons: Record<ChatPhase, React.ElementType> = {
  idle: Bot,
  thinking: Bot,
  searching: Search,
  executing_tool: Zap,
  awaiting_confirmation: Clock,
  responding: Bot,
  streaming: Bot,
  error: XCircle,
}

interface ToolExecutionIndicatorProps {
  phase: ChatPhase
  currentTool?: string
  steps?: ToolExecutionStep[]
  className?: string
  compact?: boolean
}

export function ToolExecutionIndicator({
  phase,
  currentTool,
  steps = [],
  className,
  compact = false,
}: ToolExecutionIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(!compact)

  // Auto-collapse when completed
  useEffect(() => {
    if (phase === 'idle' && steps.every(s => s.status === 'completed')) {
      const timer = setTimeout(() => setIsExpanded(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [phase, steps])

  if (phase === 'idle' && steps.length === 0) {
    return null
  }

  const PhaseIcon = phaseIcons[phase]
  const phaseMessage = phaseMessages[phase]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'flex gap-3 items-start',
        className
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <Bot className="h-4 w-4 text-white" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <motion.div
          className={cn(
            'rounded-2xl rounded-tl-md overflow-hidden',
            'bg-gray-100 dark:bg-gray-800',
            'border border-gray-200 dark:border-gray-700'
          )}
        >
          {/* Header with current phase */}
          <div
            className={cn(
              'px-4 py-3 flex items-center justify-between',
              'bg-gradient-to-r from-blue-50 to-purple-50',
              'dark:from-blue-900/20 dark:to-purple-900/20',
              'cursor-pointer hover:bg-opacity-80 transition-colors'
            )}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={phase === 'executing_tool' || phase === 'searching' ? { rotate: 360 } : {}}
                transition={{ duration: 1, repeat: phase === 'executing_tool' || phase === 'searching' ? Infinity : 0, ease: 'linear' }}
              >
                <PhaseIcon className={cn(
                  'h-5 w-5',
                  phase === 'error' ? 'text-red-500' : 'text-blue-600 dark:text-blue-400'
                )} />
              </motion.div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {phaseMessage}
                </p>
                {currentTool && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Using: {currentTool}
                  </p>
                )}
              </div>
            </div>

            {steps.length > 0 && (
              <button
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </button>
            )}
          </div>

          {/* Expanded tool execution details */}
          <AnimatePresence>
            {isExpanded && steps.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 py-3 space-y-3 border-t border-gray-200 dark:border-gray-700">
                  {steps.map((step, stepIndex) => (
                    <StepItem
                      key={step.id}
                      step={step}
                      stepIndex={stepIndex}
                      isLast={stepIndex === steps.length - 1}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Progress bar */}
        {(phase === 'thinking' || phase === 'searching' || phase === 'executing_tool') && (
          <motion.div
            className="mt-2 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity }}
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

interface StepItemProps {
  step: ToolExecutionStep
  stepIndex: number
  isLast: boolean
}

function StepItem({ step, stepIndex, isLast }: StepItemProps) {
  const StatusIcon = statusIcons[step.status]
  const statusColor = statusColors[step.status]

  return (
    <div className="relative">
      {/* Connector line */}
      {!isLast && (
        <div
          className={cn(
            'absolute left-3.5 top-8 w-0.5 h-full -bottom-3',
            step.status === 'completed'
              ? 'bg-green-300 dark:bg-green-700'
              : 'bg-gray-300 dark:bg-gray-600'
          )}
        />
      )}

      <div className="flex gap-3">
        {/* Step indicator */}
        <div className={cn(
          'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center',
          step.status === 'completed' && 'bg-green-100 dark:bg-green-900/30',
          step.status === 'executing' && 'bg-blue-100 dark:bg-blue-900/30',
          step.status === 'failed' && 'bg-red-100 dark:bg-red-900/30',
          step.status === 'pending' && 'bg-gray-100 dark:bg-gray-800',
          step.status === 'cancelled' && 'bg-gray-100 dark:bg-gray-800'
        )}>
          <motion.div
            animate={step.status === 'executing' ? { rotate: 360 } : {}}
            transition={{ duration: 1, repeat: step.status === 'executing' ? Infinity : 0, ease: 'linear' }}
          >
            <StatusIcon className={cn('h-4 w-4', statusColor)} />
          </motion.div>
        </div>

        {/* Step content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className={cn(
              'text-sm font-medium',
              step.status === 'completed' ? 'text-green-700 dark:text-green-400' :
              step.status === 'executing' ? 'text-blue-700 dark:text-blue-400' :
              step.status === 'failed' ? 'text-red-700 dark:text-red-400' :
              'text-gray-600 dark:text-gray-400'
            )}>
              {step.label}
            </p>
            {step.completedAt && step.startedAt && (
              <span className="text-xs text-gray-400">
                {Math.round((step.completedAt.getTime() - step.startedAt.getTime()))}ms
              </span>
            )}
          </div>

          {step.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {step.description}
            </p>
          )}

          {/* Tool calls within this step */}
          {step.toolCalls.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {step.toolCalls.map((tool) => (
                <ToolCallItem key={tool.id} tool={tool} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface ToolCallItemProps {
  tool: ToolCall
}

function ToolCallItem({ tool }: ToolCallItemProps) {
  const CategoryIcon = categoryIcons[tool.category]
  const StatusIcon = statusIcons[tool.status]
  const statusColor = statusColors[tool.status]

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        'flex items-center gap-2 px-2.5 py-1.5 rounded-md',
        'bg-white dark:bg-gray-900',
        'border border-gray-200 dark:border-gray-700',
        'text-xs'
      )}
    >
      <CategoryIcon className="h-3.5 w-3.5 text-gray-500" />
      <span className="flex-1 font-medium text-gray-700 dark:text-gray-300 truncate">
        {tool.displayName}
      </span>
      <motion.div
        animate={tool.status === 'executing' ? { rotate: 360 } : {}}
        transition={{ duration: 1, repeat: tool.status === 'executing' ? Infinity : 0, ease: 'linear' }}
      >
        <StatusIcon className={cn('h-3.5 w-3.5', statusColor)} />
      </motion.div>
      {tool.duration && (
        <span className="text-gray-400 tabular-nums">
          {tool.duration}ms
        </span>
      )}
    </motion.div>
  )
}

// Compact variant for inline use
interface CompactToolIndicatorProps {
  phase: ChatPhase
  currentTool?: string
  className?: string
}

export function CompactToolIndicator({
  phase,
  currentTool,
  className
}: CompactToolIndicatorProps) {
  if (phase === 'idle') return null

  const PhaseIcon = phaseIcons[phase]
  const message = phaseMessages[phase]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full',
        'bg-blue-50 dark:bg-blue-900/20',
        'border border-blue-200 dark:border-blue-800',
        'text-xs text-blue-700 dark:text-blue-300',
        className
      )}
    >
      <motion.div
        animate={phase !== 'idle' && phase !== 'error' ? { rotate: 360 } : {}}
        transition={{ duration: 1, repeat: phase !== 'idle' && phase !== 'error' ? Infinity : 0, ease: 'linear' }}
      >
        <PhaseIcon className="h-3.5 w-3.5" />
      </motion.div>
      <span className="font-medium">
        {currentTool ? `${message} (${currentTool})` : message}
      </span>
    </motion.div>
  )
}
