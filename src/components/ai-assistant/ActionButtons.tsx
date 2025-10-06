/**
 * Action Buttons Component
 * Renders interactive buttons in AI messages for navigation and actions
 */

import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Calendar,
  Wrench,
  CreditCard,
  Receipt,
  Settings,
  Target,
  Warehouse,
  Mail,
  ExternalLink,
  ChevronRight
} from 'lucide-react'

export interface ActionButton {
  label: string
  path?: string
  url?: string
  variant?: 'default' | 'outline' | 'secondary'
  icon?: string
}

interface ActionButtonsProps {
  buttons: ActionButton[]
  className?: string
}

const iconMap: Record<string, any> = {
  dashboard: LayoutDashboard,
  projects: FolderKanban,
  candidates: Users,
  calendar: Calendar,
  tools: Wrench,
  payments: CreditCard,
  expenses: Receipt,
  settings: Settings,
  goals: Target,
  warehouse: Warehouse,
  invites: Mail,
  team: Users,
  external: ExternalLink
}

export function ActionButtons({ buttons, className }: ActionButtonsProps) {
  const navigate = useNavigate()

  const handleClick = (button: ActionButton) => {
    if (button.path) {
      navigate(button.path)
    } else if (button.url) {
      window.open(button.url, '_blank', 'noopener,noreferrer')
    }
  }

  const getIcon = (iconName?: string) => {
    if (!iconName) return ChevronRight
    return iconMap[iconName.toLowerCase()] || ChevronRight
  }

  return (
    <div className={cn('flex flex-wrap gap-2 mt-3', className)}>
      {buttons.map((button, index) => {
        const Icon = getIcon(button.icon)

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <Button
              variant={button.variant || 'outline'}
              size="sm"
              onClick={() => handleClick(button)}
              className={cn(
                'group transition-all hover:shadow-md',
                button.variant === 'default' && 'bg-blue-600 hover:bg-blue-700 text-white'
              )}
            >
              <Icon className="h-3.5 w-3.5 mr-1.5" />
              {button.label}
              <ChevronRight className="h-3 w-3 ml-1 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </Button>
          </motion.div>
        )
      })}
    </div>
  )
}
