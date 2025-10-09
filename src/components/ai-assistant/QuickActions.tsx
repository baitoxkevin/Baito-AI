/**
 * Quick Actions Component
 * Role-based quick action buttons with i18n support
 */

import { Button } from '@/components/ui/button'
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
  MessageSquare
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface QuickActionsProps {
  onSelect: (action: string) => void
  userRole?: 'admin' | 'manager' | 'staff'
}

const ROLE_ACTIONS = {
  admin: [
    {
      icon: Calendar,
      labelKey: 'quickActions.todayProjects',
      query: 'Show me all projects scheduled for today'
    },
    {
      icon: UserPlus,
      labelKey: 'quickActions.addStaff',
      query: 'Help me add a new staff member'
    },
    {
      icon: CheckSquare,
      labelKey: 'quickActions.updateAttendance',
      query: 'Update attendance for today'
    },
    {
      icon: BarChart,
      labelKey: 'quickActions.viewReports',
      query: 'Show me project reports'
    }
  ],
  manager: [
    {
      icon: Briefcase,
      labelKey: 'quickActions.projectsOverview',
      query: 'Show me projects overview'
    },
    {
      icon: Users,
      labelKey: 'quickActions.staffScheduling',
      query: 'Show staff scheduling for this week'
    },
    {
      icon: DollarSign,
      labelKey: 'quickActions.approveExpenses',
      query: 'Show pending expense claims for approval'
    },
    {
      icon: TrendingUp,
      labelKey: 'quickActions.financialReports',
      query: 'Show financial reports for this month'
    }
  ],
  staff: [
    {
      icon: Calendar,
      labelKey: 'quickActions.mySchedule',
      query: 'Show my schedule for this week'
    },
    {
      icon: MapPin,
      labelKey: 'quickActions.checkIn',
      query: 'I want to check-in to my project'
    },
    {
      icon: Receipt,
      labelKey: 'quickActions.submitExpense',
      query: 'Submit an expense claim'
    },
    {
      icon: MessageSquare,
      labelKey: 'quickActions.contactAdmin',
      query: 'Contact admin or manager'
    }
  ]
}

export function QuickActions({ onSelect, userRole = 'manager' }: QuickActionsProps) {
  const { t } = useTranslation()

  const actions = ROLE_ACTIONS[userRole]

  return (
    <div className="w-full space-y-2">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {t('chat.quickActions', 'Quick Actions')}
      </p>

      <div className="grid grid-cols-2 gap-2">
        {actions.map((action, index) => {
          const Icon = action.icon
          return (
            <Button
              key={index}
              variant="outline"
              className="h-auto flex flex-col items-start p-3 space-y-1 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:border-blue-300 dark:hover:border-blue-700 transition-all"
              onClick={() => onSelect(action.query)}
              aria-label={t(action.labelKey)}
            >
              <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium text-left">
                {t(action.labelKey)}
              </span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
