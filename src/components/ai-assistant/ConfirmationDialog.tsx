/**
 * Confirmation Dialog Component
 * Interactive confirmation UI for AI-initiated actions
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { ConfirmationRequest, ActionType } from '@/types/ai-chat.types'

// Action type configurations
const actionConfig: Record<ActionType, {
  icon: React.ElementType
  color: string
  bgColor: string
  borderColor: string
}> = {
  navigate: {
    icon: Info,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800'
  },
  create: {
    icon: CheckCircle2,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800'
  },
  update: {
    icon: Info,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800'
  },
  delete: {
    icon: AlertTriangle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800'
  },
  assign: {
    icon: CheckCircle2,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800'
  },
  approve: {
    icon: CheckCircle2,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800'
  },
  reject: {
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800'
  },
  send_message: {
    icon: Info,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800'
  },
  schedule: {
    icon: Info,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800'
  },
  export: {
    icon: Info,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    borderColor: 'border-gray-200 dark:border-gray-800'
  },
  custom: {
    icon: Info,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800'
  }
}

interface ConfirmationDialogProps {
  confirmation: ConfirmationRequest
  onConfirm: (id: string) => Promise<void>
  onCancel: (id: string) => void
  className?: string
  isProcessing?: boolean
}

export function ConfirmationDialog({
  confirmation,
  onConfirm,
  onCancel,
  className,
  isProcessing = false
}: ConfirmationDialogProps) {
  const [showDetails, setShowDetails] = useState(false)
  const config = actionConfig[confirmation.actionType]
  const Icon = config.icon

  // Format payload for display
  const formatPayload = (payload: Record<string, unknown>) => {
    return Object.entries(payload)
      .filter(([_, value]) => value !== null && value !== undefined)
      .map(([key, value]) => ({
        key: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
      }))
  }

  const payloadItems = formatPayload(confirmation.payload)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn('w-full', className)}
    >
      <Card className={cn(
        'overflow-hidden border-2',
        config.borderColor,
        config.bgColor
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className={cn(
              'p-2 rounded-full',
              config.bgColor
            )}>
              <Icon className={cn('h-5 w-5', config.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {confirmation.title}
              </CardTitle>
              <CardDescription className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {confirmation.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Preview if available */}
          {confirmation.preview && (
            <div className="mb-4 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mb-2">
                Preview
              </p>
              {/* Render preview based on type - simplified for now */}
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {JSON.stringify(confirmation.preview.data, null, 2)}
              </div>
            </div>
          )}

          {/* Payload details (expandable) */}
          {payloadItems.length > 0 && (
            <div>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className={cn(
                  'flex items-center gap-1 text-xs font-medium',
                  'text-gray-600 dark:text-gray-400',
                  'hover:text-gray-900 dark:hover:text-gray-200',
                  'transition-colors'
                )}
              >
                {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {showDetails ? 'Hide details' : 'Show details'}
              </button>

              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2">
                      {payloadItems.map(({ key, value }) => (
                        <div key={key} className="flex justify-between gap-3 text-sm">
                          <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">
                            {key}:
                          </span>
                          <span className="text-gray-900 dark:text-gray-100 text-right truncate font-medium">
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Warning for destructive actions */}
          {confirmation.destructive && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex gap-2 items-start">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-200">
                  This action cannot be undone. Please make sure you want to proceed.
                </p>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCancel(confirmation.id)}
            disabled={isProcessing}
            className="flex-1"
          >
            {confirmation.cancelLabel || 'Cancel'}
          </Button>
          <Button
            variant={confirmation.destructive ? 'destructive' : 'default'}
            size="sm"
            onClick={() => onConfirm(confirmation.id)}
            disabled={isProcessing}
            className={cn(
              'flex-1',
              !confirmation.destructive && 'bg-blue-600 hover:bg-blue-700'
            )}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              confirmation.confirmLabel || 'Confirm'
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

// Inline confirmation variant (for smaller confirmations)
interface InlineConfirmationProps {
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  isProcessing?: boolean
  className?: string
}

export function InlineConfirmation({
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Yes',
  cancelLabel = 'No',
  destructive = false,
  isProcessing = false,
  className
}: InlineConfirmationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg',
        'bg-amber-50 dark:bg-amber-900/20',
        'border border-amber-200 dark:border-amber-800',
        className
      )}
    >
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
      <p className="flex-1 text-sm text-gray-700 dark:text-gray-300">
        {message}
      </p>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isProcessing}
          className="h-7 px-2 text-xs"
        >
          {cancelLabel}
        </Button>
        <Button
          variant={destructive ? 'destructive' : 'default'}
          size="sm"
          onClick={onConfirm}
          disabled={isProcessing}
          className={cn(
            'h-7 px-2 text-xs',
            !destructive && 'bg-blue-600 hover:bg-blue-700'
          )}
        >
          {isProcessing ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            confirmLabel
          )}
        </Button>
      </div>
    </motion.div>
  )
}
