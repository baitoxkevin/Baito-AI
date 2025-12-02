/**
 * WelcomeOnboarding - First-time user experience for Baiger
 * Shows a friendly welcome with capability cards for non-technical users
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Users, FolderKanban, DollarSign, Sparkles, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

const baigerAvatar = '/baiger-optimized.png'

interface WelcomeOnboardingProps {
  userName?: string
  onGetStarted: () => void
  onSkip: () => void
  onSelectPrompt: (prompt: string) => void
}

// Capability cards for non-technical users
const CAPABILITY_CARDS = [
  {
    id: 'schedules',
    icon: Calendar,
    title: 'Check Schedules',
    description: 'See who\'s working today',
    color: '#3B82F6', // blue
    prompt: 'Show me who is working today'
  },
  {
    id: 'staff',
    icon: Users,
    title: 'Find Staff',
    description: 'Search for available team members',
    color: '#059669', // emerald
    prompt: 'Find available staff for this week'
  },
  {
    id: 'projects',
    icon: FolderKanban,
    title: 'Track Projects',
    description: 'Get updates on any project',
    color: '#D97706', // amber
    prompt: 'Show me all active projects'
  },
  {
    id: 'expenses',
    icon: DollarSign,
    title: 'Handle Expenses',
    description: 'Submit or approve claims',
    color: '#7C3AED', // violet
    prompt: 'Show pending expense claims'
  }
]

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25
    }
  }
}

const avatarVariants = {
  hidden: { scale: 0, rotate: -180 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 15
    }
  }
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25
    }
  },
  hover: {
    scale: 1.02,
    y: -4,
    transition: { duration: 0.2 }
  },
  tap: {
    scale: 0.98
  }
}

export function WelcomeOnboarding({
  userName,
  onGetStarted,
  onSkip,
  onSelectPrompt
}: WelcomeOnboardingProps) {
  const { t } = useTranslation()
  const [showCapabilities, setShowCapabilities] = useState(false)

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return t('greeting.morning', 'Good morning')
    if (hour < 18) return t('greeting.afternoon', 'Good afternoon')
    return t('greeting.evening', 'Good evening')
  }

  return (
    <motion.div
      className="flex flex-col items-center justify-center h-full text-center px-4 py-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Avatar with wave animation */}
      <motion.div
        variants={avatarVariants}
        className="relative mb-4"
      >
        <motion.img
          src={baigerAvatar}
          alt="Baiger AI Assistant"
          className="w-20 h-20 rounded-full shadow-lg border-4 border-white"
          animate={{
            y: [0, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: 2,
            repeatType: 'reverse',
            ease: 'easeInOut'
          }}
        />
        <motion.div
          className="absolute -right-1 -top-1 bg-green-500 rounded-full p-1"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Sparkles className="h-3 w-3 text-white" />
        </motion.div>
      </motion.div>

      {/* Welcome text */}
      <motion.div variants={itemVariants} className="mb-2">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {userName
            ? `${getGreeting()}, ${userName}!`
            : t('onboarding.title', "Hi! I'm Baiger, your work assistant")}
        </h4>
      </motion.div>

      <motion.p
        variants={itemVariants}
        className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-[280px]"
      >
        {t('onboarding.subtitle', 'I can help you with everyday tasks - no typing skills needed!')}
      </motion.p>

      <AnimatePresence mode="wait">
        {!showCapabilities ? (
          /* Initial CTA */
          <motion.div
            key="cta"
            variants={itemVariants}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-3"
          >
            <Button
              onClick={() => setShowCapabilities(true)}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              <span>{t('onboarding.showCapabilities', 'Show me what you can do')}</span>
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
            <button
              onClick={onSkip}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 underline-offset-2 hover:underline transition-colors"
            >
              {t('onboarding.skip', "I'll explore on my own")}
            </button>
          </motion.div>
        ) : (
          /* Capability cards */
          <motion.div
            key="capabilities"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-[320px]"
          >
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              {t('onboarding.tapToStart', 'Tap any card to get started:')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {CAPABILITY_CARDS.map((card, index) => (
                <motion.button
                  key={card.id}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  whileTap="tap"
                  custom={index}
                  transition={{ delay: index * 0.08 }}
                  onClick={() => {
                    onSelectPrompt(card.prompt)
                    onGetStarted()
                  }}
                  className={cn(
                    'flex flex-col items-center p-3 rounded-xl',
                    'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
                    'shadow-sm hover:shadow-md transition-all',
                    'text-left group'
                  )}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: card.color + '15' }}
                  >
                    <card.icon
                      className="h-5 w-5"
                      style={{ color: card.color }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 text-center">
                    {t(`onboarding.${card.id}Title`, card.title)}
                  </span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 text-center mt-0.5">
                    {t(`onboarding.${card.id}Desc`, card.description)}
                  </span>
                </motion.button>
              ))}
            </div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              onClick={onSkip}
              className="mt-4 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 underline-offset-2 hover:underline transition-colors"
            >
              {t('onboarding.justChat', 'Or just start chatting')}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Hook to manage onboarding state
export function useOnboardingState() {
  const [hasOnboarded, setHasOnboarded] = useState(() => {
    try {
      return localStorage.getItem('baiger_onboarded') === 'true'
    } catch {
      return false
    }
  })

  const completeOnboarding = () => {
    try {
      localStorage.setItem('baiger_onboarded', 'true')
      setHasOnboarded(true)
    } catch (e) {
      console.warn('Could not save onboarding state:', e)
      setHasOnboarded(true)
    }
  }

  const resetOnboarding = () => {
    try {
      localStorage.removeItem('baiger_onboarded')
      setHasOnboarded(false)
    } catch (e) {
      console.warn('Could not reset onboarding state:', e)
    }
  }

  return { hasOnboarded, completeOnboarding, resetOnboarding }
}
