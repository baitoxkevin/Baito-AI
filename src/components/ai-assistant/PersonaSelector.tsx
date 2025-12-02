/**
 * PersonaSelector - Visual persona picker with examples
 * Shows each mode with icon, description, and sample prompts
 */

import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Briefcase, Calculator, Users, ChevronDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useState } from 'react'

type Persona = 'general' | 'operations' | 'finance' | 'hr'

interface PersonaConfig {
  name: string
  icon: React.ReactNode
  description: string
  tagline: string
  color: string
  examples: string[]
}

const PERSONA_CONFIG: Record<Persona, PersonaConfig> = {
  general: {
    name: 'All Tasks',
    icon: <Sparkles className="h-5 w-5" />,
    description: 'Ask me anything',
    tagline: 'Your everyday helper',
    color: '#3B82F6',
    examples: ['What needs attention today?', 'Help me find something']
  },
  operations: {
    name: 'Events & Schedules',
    icon: <Briefcase className="h-5 w-5" />,
    description: 'Plan and track work',
    tagline: 'Projects, shifts, venues',
    color: '#059669',
    examples: ["Who's working today?", 'Show active projects']
  },
  finance: {
    name: 'Money Matters',
    icon: <Calculator className="h-5 w-5" />,
    description: 'Track spending',
    tagline: 'Expenses, budgets, claims',
    color: '#D97706',
    examples: ['Show pending expenses', 'Check project budget']
  },
  hr: {
    name: 'People & Teams',
    icon: <Users className="h-5 w-5" />,
    description: 'Manage staff',
    tagline: 'Find and manage team members',
    color: '#7C3AED',
    examples: ['Find available staff', 'Check staff skills']
  },
}

interface PersonaSelectorProps {
  currentPersona: Persona
  onSelectPersona: (persona: Persona) => void
  onSelectExample?: (example: string) => void
  className?: string
}

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', stiffness: 300, damping: 25 }
  }
}

export function PersonaSelector({
  currentPersona,
  onSelectPersona,
  onSelectExample,
  className
}: PersonaSelectorProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [isFirstOpen, setIsFirstOpen] = useState(() => {
    try {
      return localStorage.getItem('baiger_persona_tooltip_shown') !== 'true'
    } catch {
      return true
    }
  })

  const handleOpen = (open: boolean) => {
    setIsOpen(open)
    if (open && isFirstOpen) {
      setIsFirstOpen(false)
      try {
        localStorage.setItem('baiger_persona_tooltip_shown', 'true')
      } catch { }
    }
  }

  const currentConfig = PERSONA_CONFIG[currentPersona]

  return (
    <Popover open={isOpen} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-8 px-2 hover:bg-blue-500/20 text-white text-xs gap-1.5',
            className
          )}
          title={t('chat.switchMode', 'Switch mode')}
        >
          <div
            className="p-0.5 rounded"
            style={{ backgroundColor: currentConfig.color + '30' }}
          >
            {currentConfig.icon}
          </div>
          <span className="hidden sm:inline">{currentConfig.name}</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-72 p-0 overflow-hidden"
        sideOffset={8}
        style={{ zIndex: 10003 }}
      >
        {/* First-time tooltip */}
        {isFirstOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 dark:bg-blue-950 px-3 py-2 border-b border-blue-100 dark:border-blue-900"
          >
            <p className="text-xs text-blue-700 dark:text-blue-300">
              {t('persona.tooltip', 'Pick based on what you need help with. You can switch anytime!')}
            </p>
          </motion.div>
        )}

        <div className="p-1">
          {(Object.keys(PERSONA_CONFIG) as Persona[]).map((persona, index) => {
            const config = PERSONA_CONFIG[persona]
            const isSelected = currentPersona === persona

            return (
              <motion.button
                key={persona}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                custom={index}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  onSelectPersona(persona)
                  setIsOpen(false)
                }}
                className={cn(
                  'w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all',
                  'hover:bg-gray-100 dark:hover:bg-gray-800',
                  isSelected && 'bg-gray-100 dark:bg-gray-800'
                )}
              >
                {/* Icon */}
                <div
                  className="p-2 rounded-lg shrink-0"
                  style={{
                    backgroundColor: config.color + '15',
                    color: config.color
                  }}
                >
                  {config.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {config.name}
                    </span>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto"
                      >
                        <Check className="h-4 w-4 text-green-500" />
                      </motion.div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {config.tagline}
                  </p>

                  {/* Example prompts as chips */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {config.examples.map((example, i) => (
                      <button
                        key={i}
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectPersona(persona)
                          onSelectExample?.(example)
                          setIsOpen(false)
                        }}
                        className={cn(
                          'text-[10px] px-2 py-0.5 rounded-full transition-colors',
                          'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
                          'hover:bg-gray-200 dark:hover:bg-gray-600'
                        )}
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>

        {/* Best for text */}
        <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <p className="text-[10px] text-gray-500 dark:text-gray-400">
            <span className="font-medium">{t('persona.bestFor', 'Best for')}:</span>{' '}
            {PERSONA_CONFIG[currentPersona].description}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}
