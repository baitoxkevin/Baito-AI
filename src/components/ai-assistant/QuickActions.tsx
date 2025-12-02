/**
 * Quick Actions Component
 * Task-based quick action cards with animations
 * Designed for non-technical users with visual, friendly interface
 */

import { motion } from 'framer-motion'
import {
  Calendar,
  Users,
  DollarSign,
  FileText,
  Clock,
  UserPlus,
  CheckSquare,
  BarChart,
  Briefcase,
  TrendingUp,
  MapPin,
  Receipt,
  MessageSquare,
  FolderKanban,
  HelpCircle
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface QuickActionsProps {
  onSelect: (action: string) => void
  userRole?: 'admin' | 'manager' | 'staff'
}

interface QuickAction {
  icon: React.ElementType
  labelKey: string
  queryKey: string
  query: string
  color: string
  bgColor: string
}

const ROLE_ACTIONS: Record<string, QuickAction[]> = {
  admin: [
    {
      icon: Calendar,
      labelKey: 'quickActions.todayProjects',
      queryKey: 'quickActions.queries.todayProjects',
      query: 'Show me all projects scheduled for today',
      color: '#3B82F6',
      bgColor: '#EFF6FF'
    },
    {
      icon: Users,
      labelKey: 'quickActions.findStaff',
      queryKey: 'quickActions.queries.findStaff',
      query: 'Find available staff for this week',
      color: '#059669',
      bgColor: '#ECFDF5'
    },
    {
      icon: DollarSign,
      labelKey: 'quickActions.pendingExpenses',
      queryKey: 'quickActions.queries.pendingExpenses',
      query: 'Show pending expense claims for approval',
      color: '#D97706',
      bgColor: '#FFFBEB'
    },
    {
      icon: BarChart,
      labelKey: 'quickActions.viewReports',
      queryKey: 'quickActions.queries.viewReports',
      query: 'Show me project reports',
      color: '#7C3AED',
      bgColor: '#F5F3FF'
    }
  ],
  manager: [
    {
      icon: FolderKanban,
      labelKey: 'quickActions.activeProjects',
      queryKey: 'quickActions.queries.activeProjects',
      query: 'Show me active projects and their status',
      color: '#3B82F6',
      bgColor: '#EFF6FF'
    },
    {
      icon: Users,
      labelKey: 'quickActions.whoIsWorking',
      queryKey: 'quickActions.queries.whoIsWorking',
      query: "Who's working today and on which projects?",
      color: '#059669',
      bgColor: '#ECFDF5'
    },
    {
      icon: DollarSign,
      labelKey: 'quickActions.approveExpenses',
      queryKey: 'quickActions.queries.approveExpenses',
      query: 'Show pending expense claims I need to approve',
      color: '#D97706',
      bgColor: '#FFFBEB'
    },
    {
      icon: HelpCircle,
      labelKey: 'quickActions.helpMe',
      queryKey: 'quickActions.queries.helpMe',
      query: 'What can you help me with?',
      color: '#7C3AED',
      bgColor: '#F5F3FF'
    }
  ],
  staff: [
    {
      icon: Calendar,
      labelKey: 'quickActions.mySchedule',
      queryKey: 'quickActions.queries.mySchedule',
      query: 'Show my schedule for this week',
      color: '#3B82F6',
      bgColor: '#EFF6FF'
    },
    {
      icon: MapPin,
      labelKey: 'quickActions.checkIn',
      queryKey: 'quickActions.queries.checkIn',
      query: 'I want to check-in to my project',
      color: '#059669',
      bgColor: '#ECFDF5'
    },
    {
      icon: Receipt,
      labelKey: 'quickActions.submitExpense',
      queryKey: 'quickActions.queries.submitExpense',
      query: 'Help me submit an expense claim',
      color: '#D97706',
      bgColor: '#FFFBEB'
    },
    {
      icon: MessageSquare,
      labelKey: 'quickActions.askQuestion',
      queryKey: 'quickActions.queries.askQuestion',
      query: 'I have a question about my work',
      color: '#7C3AED',
      bgColor: '#F5F3FF'
    }
  ]
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
}

const cardVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.95 },
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
    scale: 1.03,
    y: -3,
    transition: { duration: 0.2 }
  },
  tap: {
    scale: 0.97
  }
}

// Pulse animation for the first card to draw attention
const pulseVariants = {
  pulse: {
    boxShadow: [
      '0 0 0 0 rgba(59, 130, 246, 0)',
      '0 0 0 4px rgba(59, 130, 246, 0.3)',
      '0 0 0 0 rgba(59, 130, 246, 0)'
    ],
    transition: {
      duration: 2,
      repeat: 2,
      repeatType: 'loop' as const,
      ease: 'easeInOut'
    }
  }
}

export function QuickActions({ onSelect, userRole = 'manager' }: QuickActionsProps) {
  const { t } = useTranslation()

  const actions = ROLE_ACTIONS[userRole] || ROLE_ACTIONS.manager

  return (
    <div className="w-full max-w-[320px]">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 text-center">
        {t('quickActions.tapToStart', 'Tap any card to get started:')}
      </p>

      <motion.div
        className="grid grid-cols-2 gap-2"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {actions.map((action, index) => {
          const Icon = action.icon
          const isFirst = index === 0

          return (
            <motion.button
              key={action.labelKey}
              variants={cardVariants}
              whileHover="hover"
              whileTap="tap"
              animate={isFirst ? 'pulse' : undefined}
              custom={index}
              onClick={() => onSelect(t(action.queryKey, action.query))}
              className={cn(
                'flex flex-col items-center p-3 rounded-xl',
                'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
                'shadow-sm hover:shadow-md',
                'transition-all text-center group'
              )}
              style={{
                animation: isFirst ? undefined : undefined
              }}
              aria-label={t(action.labelKey)}
            >
              <motion.div
                className="w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-transform group-hover:scale-110"
                style={{ backgroundColor: action.bgColor }}
              >
                <Icon
                  className="h-5 w-5"
                  style={{ color: action.color }}
                />
              </motion.div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {t(action.labelKey)}
              </span>
            </motion.button>
          )
        })}
      </motion.div>
    </div>
  )
}
