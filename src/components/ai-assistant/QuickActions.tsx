/**
 * Quick Actions Component
 * Pre-defined quick action buttons for common queries
 */

import { Button } from '@/components/ui/button'
import { Calendar, Users, DollarSign, FileText, Clock } from 'lucide-react'

interface QuickActionsProps {
  onSelect: (action: string) => void
}

const QUICK_ACTIONS = [
  {
    icon: Calendar,
    label: "Today's Projects",
    query: "Show me all projects scheduled for today"
  },
  {
    icon: Users,
    label: 'Available Candidates',
    query: 'Which candidates are available this week?'
  },
  {
    icon: DollarSign,
    label: 'Revenue This Month',
    query: "What's our revenue this month vs last month?"
  },
  {
    icon: FileText,
    label: 'Pending Tasks',
    query: 'Show me my pending tasks'
  },
  {
    icon: Clock,
    label: 'Schedule Conflicts',
    query: 'Check for any scheduling conflicts this week'
  }
]

export function QuickActions({ onSelect }: QuickActionsProps) {
  return (
    <div className="w-full space-y-2">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        Quick Actions
      </p>

      <div className="grid grid-cols-2 gap-2">
        {QUICK_ACTIONS.map((action, index) => {
          const Icon = action.icon
          return (
            <Button
              key={index}
              variant="outline"
              className="h-auto flex flex-col items-start p-3 space-y-1 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:border-blue-300 dark:hover:border-blue-700"
              onClick={() => onSelect(action.query)}
            >
              <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium text-left">{action.label}</span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
