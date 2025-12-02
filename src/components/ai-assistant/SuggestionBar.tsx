/**
 * SuggestionBar - Persistent suggestion chips below input
 * Shows contextual suggestions based on persona and conversation state
 */

import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Calendar, Users, FolderKanban, DollarSign, HelpCircle, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useRef, useState, useEffect } from 'react'

type Persona = 'general' | 'operations' | 'finance' | 'hr'

interface SuggestionConfig {
  key: string
  icon?: React.ReactNode
}

// Suggestions by persona - using translation keys
const PERSONA_SUGGESTION_KEYS: Record<Persona, SuggestionConfig[]> = {
  general: [
    { key: 'suggestions.general.attention', icon: <Sparkles className="h-3 w-3" /> },
    { key: 'suggestions.general.schedule', icon: <Calendar className="h-3 w-3" /> },
    { key: 'suggestions.general.findStaff', icon: <Users className="h-3 w-3" /> },
    { key: 'suggestions.general.activeProjects', icon: <FolderKanban className="h-3 w-3" /> },
    { key: 'suggestions.general.helpMe', icon: <HelpCircle className="h-3 w-3" /> },
  ],
  operations: [
    { key: 'suggestions.operations.whoWorking', icon: <Users className="h-3 w-3" /> },
    { key: 'suggestions.operations.activeProjects', icon: <FolderKanban className="h-3 w-3" /> },
    { key: 'suggestions.operations.upcomingEvents', icon: <Calendar className="h-3 w-3" /> },
    { key: 'suggestions.operations.staffingNeeds', icon: <Users className="h-3 w-3" /> },
    { key: 'suggestions.operations.projectUpdates', icon: <ArrowRight className="h-3 w-3" /> },
  ],
  finance: [
    { key: 'suggestions.finance.pending', icon: <DollarSign className="h-3 w-3" /> },
    { key: 'suggestions.finance.budgets', icon: <FolderKanban className="h-3 w-3" /> },
    { key: 'suggestions.finance.claims', icon: <DollarSign className="h-3 w-3" /> },
    { key: 'suggestions.finance.spending', icon: <DollarSign className="h-3 w-3" /> },
    { key: 'suggestions.finance.summary', icon: <ArrowRight className="h-3 w-3" /> },
  ],
  hr: [
    { key: 'suggestions.hr.findStaff', icon: <Users className="h-3 w-3" /> },
    { key: 'suggestions.hr.skills', icon: <Users className="h-3 w-3" /> },
    { key: 'suggestions.hr.whoCanWork', icon: <Calendar className="h-3 w-3" /> },
    { key: 'suggestions.hr.certifications', icon: <Users className="h-3 w-3" /> },
    { key: 'suggestions.hr.contact', icon: <ArrowRight className="h-3 w-3" /> },
  ],
}

// Default fallback texts (English)
const DEFAULT_TEXTS: Record<string, string> = {
  'suggestions.general.attention': 'What needs attention today?',
  'suggestions.general.schedule': 'Show me the schedule',
  'suggestions.general.findStaff': 'Find available staff',
  'suggestions.general.activeProjects': 'Active projects',
  'suggestions.general.helpMe': 'Help me with...',
  'suggestions.operations.whoWorking': "Who's working today?",
  'suggestions.operations.activeProjects': 'Show active projects',
  'suggestions.operations.upcomingEvents': 'Upcoming events',
  'suggestions.operations.staffingNeeds': 'Check staffing needs',
  'suggestions.operations.projectUpdates': 'Project updates',
  'suggestions.finance.pending': 'Pending expenses',
  'suggestions.finance.budgets': 'Show project budgets',
  'suggestions.finance.claims': 'Outstanding claims',
  'suggestions.finance.spending': "This month's spending",
  'suggestions.finance.summary': 'Budget summary',
  'suggestions.hr.findStaff': 'Find available staff',
  'suggestions.hr.skills': 'Check staff skills',
  'suggestions.hr.whoCanWork': 'Who can work this week?',
  'suggestions.hr.certifications': 'Staff certifications',
  'suggestions.hr.contact': 'Contact information',
}

interface SuggestionBarProps {
  persona: Persona
  userRole?: 'admin' | 'manager' | 'staff'
  onSelect: (suggestion: string) => void
  isTyping?: boolean
  className?: string
}

const chipVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25
    }
  },
  hover: {
    scale: 1.03,
    y: -2,
    transition: { duration: 0.15 }
  },
  tap: {
    scale: 0.97
  }
}

export function SuggestionBar({
  persona,
  userRole = 'manager',
  onSelect,
  isTyping = false,
  className
}: SuggestionBarProps) {
  const { t } = useTranslation()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeftFade, setShowLeftFade] = useState(false)
  const [showRightFade, setShowRightFade] = useState(true)

  // Get suggestion configs based on persona
  const suggestionConfigs = PERSONA_SUGGESTION_KEYS[persona] || PERSONA_SUGGESTION_KEYS.general

  // Handle scroll indicators
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container
      setShowLeftFade(scrollLeft > 10)
      setShowRightFade(scrollLeft < scrollWidth - clientWidth - 10)
    }

    container.addEventListener('scroll', handleScroll)
    handleScroll() // Initial check

    return () => container.removeEventListener('scroll', handleScroll)
  }, [suggestionConfigs])

  return (
    <AnimatePresence>
      {!isTyping && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className={cn('relative', className)}
        >
          {/* Label */}
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="h-3 w-3 text-blue-500" />
            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
              {t('suggestions.label', 'Try asking:')}
            </span>
          </div>

          {/* Scrollable chips container */}
          <div className="relative">
            {/* Left fade */}
            {showLeftFade && (
              <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white dark:from-gray-900 to-transparent z-10 pointer-events-none" />
            )}

            {/* Right fade */}
            {showRightFade && (
              <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white dark:from-gray-900 to-transparent z-10 pointer-events-none" />
            )}

            {/* Scrollable container */}
            <div
              ref={scrollRef}
              className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {suggestionConfigs.map((config, index) => {
                const text = t(config.key, DEFAULT_TEXTS[config.key] || config.key)
                return (
                  <motion.button
                    key={config.key}
                    variants={chipVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover="hover"
                    whileTap="tap"
                    custom={index}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => onSelect(text)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full',
                      'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
                      'text-xs text-gray-700 dark:text-gray-300',
                      'hover:bg-gray-200 dark:hover:bg-gray-700',
                      'hover:border-blue-300 dark:hover:border-blue-700',
                      'transition-colors whitespace-nowrap shrink-0',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500/30'
                    )}
                  >
                    {config.icon && (
                      <span className="text-gray-500 dark:text-gray-400">
                        {config.icon}
                      </span>
                    )}
                    {text}
                  </motion.button>
                )
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Contextual follow-up suggestions after AI response
interface ContextualSuggestionsProps {
  suggestions: string[]
  onSelect: (suggestion: string) => void
  className?: string
}

export function ContextualSuggestions({
  suggestions,
  onSelect,
  className
}: ContextualSuggestionsProps) {
  const { t } = useTranslation()

  if (!suggestions.length) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('mt-3', className)}
    >
      <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1.5">
        {t('suggestions.followUp', 'You might also ask:')}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.slice(0, 3).map((suggestion, index) => (
          <motion.button
            key={suggestion}
            variants={chipVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            whileTap="tap"
            transition={{ delay: index * 0.08 }}
            onClick={() => onSelect(suggestion)}
            className={cn(
              'px-2.5 py-1 rounded-full text-[11px]',
              'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300',
              'border border-blue-100 dark:border-blue-900',
              'hover:bg-blue-100 dark:hover:bg-blue-900',
              'transition-colors'
            )}
          >
            {suggestion}
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}
