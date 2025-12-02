/**
 * ClarificationPrompt - Error recovery and "Did you mean?" UI
 * Shows helpful suggestions when AI response indicates confusion
 */

import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, HelpCircle, ArrowRight, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface ClarificationPromptProps {
  isVisible: boolean
  suggestions?: string[]
  onSelectSuggestion: (suggestion: string) => void
  onDismiss?: () => void
  className?: string
}

// Default clarification suggestions based on common tasks
const DEFAULT_SUGGESTIONS = [
  'Find available staff',
  "Check today's schedule",
  'Show active projects'
]

const containerVariants = {
  hidden: { opacity: 0, y: 10, height: 0 },
  visible: {
    opacity: 1,
    y: 0,
    height: 'auto',
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
      staggerChildren: 0.08
    }
  },
  exit: {
    opacity: 0,
    y: -10,
    height: 0,
    transition: { duration: 0.2 }
  }
}

const chipVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', stiffness: 300, damping: 25 }
  }
}

export function ClarificationPrompt({
  isVisible,
  suggestions = DEFAULT_SUGGESTIONS,
  onSelectSuggestion,
  onDismiss,
  className
}: ClarificationPromptProps) {
  const { t } = useTranslation()

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn(
            'rounded-lg overflow-hidden mb-3',
            'bg-amber-50 dark:bg-amber-950/30',
            'border border-amber-200 dark:border-amber-900',
            className
          )}
        >
          <div className="px-4 py-3">
            {/* Header */}
            <div className="flex items-start gap-2 mb-3">
              <HelpCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  {t('clarification.title', "I'm not sure I understood that")}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                  {t('clarification.subtitle', 'Did you mean one of these?')}
                </p>
              </div>
            </div>

            {/* Suggestion buttons */}
            <div className="flex flex-wrap gap-2">
              {suggestions.slice(0, 3).map((suggestion, index) => (
                <motion.button
                  key={suggestion}
                  variants={chipVariants}
                  custom={index}
                  onClick={() => onSelectSuggestion(suggestion)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full',
                    'bg-white dark:bg-gray-800',
                    'border border-amber-300 dark:border-amber-700',
                    'text-xs text-amber-800 dark:text-amber-200',
                    'hover:bg-amber-100 dark:hover:bg-amber-900/50',
                    'transition-colors'
                  )}
                >
                  <span>{suggestion}</span>
                  <ArrowRight className="h-3 w-3 opacity-50" />
                </motion.button>
              ))}
            </div>

            {/* Something else option */}
            <motion.button
              variants={chipVariants}
              onClick={onDismiss}
              className="mt-3 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              {t('clarification.somethingElse', 'Let me try asking differently')}
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Helper function to detect if AI response indicates confusion
 * Can be used to automatically show ClarificationPrompt
 */
export function detectConfusion(response: string): boolean {
  const confusionPatterns = [
    "i'm not sure what you mean",
    "i don't understand",
    "could you clarify",
    "what do you mean by",
    "can you be more specific",
    "i'm confused",
    "please rephrase",
    "i need more information"
  ]

  const lowerResponse = response.toLowerCase()
  return confusionPatterns.some(pattern => lowerResponse.includes(pattern))
}

/**
 * Generate contextual suggestions based on the unclear query
 */
export function generateClarificationSuggestions(
  originalQuery: string,
  persona: string
): string[] {
  // Base suggestions by persona
  const personaSuggestions: Record<string, string[]> = {
    general: [
      "Show me today's overview",
      'What needs my attention?',
      'Help me find something'
    ],
    operations: [
      "Who's working today?",
      'Show active projects',
      'Check staffing needs'
    ],
    finance: [
      'Show pending expenses',
      'Check project budgets',
      'Outstanding claims'
    ],
    hr: [
      'Find available staff',
      'Check staff skills',
      'View team schedule'
    ]
  }

  return personaSuggestions[persona] || personaSuggestions.general
}
