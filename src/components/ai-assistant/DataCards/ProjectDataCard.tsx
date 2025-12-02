/**
 * Project Data Card Component
 * Displays project information in a rich card format within AI chat
 */

import { motion } from 'framer-motion'
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Building2,
  ChevronRight,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { ProjectCardData } from '@/types/ai-chat.types'

// Status configuration
const statusConfig: Record<ProjectCardData['status'], {
  label: string
  className: string
}> = {
  draft: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300'
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400'
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400'
  },
  completed: {
    label: 'Completed',
    className: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400'
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400'
  }
}

// Priority configuration
const priorityConfig: Record<NonNullable<ProjectCardData['priority']>, {
  label: string
  className: string
}> = {
  low: {
    label: 'Low',
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
  },
  medium: {
    label: 'Medium',
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
  },
  high: {
    label: 'High',
    className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
  },
  urgent: {
    label: 'Urgent',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  }
}

interface ProjectDataCardProps {
  project: ProjectCardData
  onViewDetails?: (projectId: string) => void
  onAssignStaff?: (projectId: string) => void
  className?: string
  compact?: boolean
}

export function ProjectDataCard({
  project,
  onViewDetails,
  onAssignStaff,
  className,
  compact = false
}: ProjectDataCardProps) {
  const status = statusConfig[project.status]
  const priority = project.priority ? priorityConfig[project.priority] : null
  const fillPercentage = project.crewCount
    ? Math.round(((project.filledPositions || 0) / project.crewCount) * 100)
    : 0

  // Format dates
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    })
  }

  const startDate = formatDate(project.startDate)
  const endDate = formatDate(project.endDate)
  const dateRange = startDate
    ? endDate
      ? `${startDate} - ${endDate}`
      : startDate
    : null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      <Card
        className={cn(
          'overflow-hidden border-l-4 transition-shadow hover:shadow-md',
          compact && 'shadow-sm'
        )}
        style={{ borderLeftColor: project.color || '#3B82F6' }}
      >
        <CardHeader className={cn('pb-2', compact && 'p-3 pb-1')}>
          <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
            <CardTitle className={cn(
              'font-bold truncate',
              compact ? 'text-sm' : 'text-base sm:text-lg'
            )}>
              {project.title}
            </CardTitle>
            <div className="flex flex-wrap gap-1.5">
              <Badge
                variant="outline"
                className={cn('text-xs', status.className)}
              >
                {status.label}
              </Badge>
              {priority && (
                <Badge
                  variant="outline"
                  className={cn('text-xs', priority.className)}
                >
                  {priority.label}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className={cn(
          'space-y-3',
          compact ? 'p-3 pt-0 pb-2' : 'pb-4'
        )}>
          {/* Client */}
          {project.client && (
            <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
              <span className="truncate">{project.client}</span>
            </div>
          )}

          {/* Date range */}
          {dateRange && (
            <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
              <span className="truncate">{dateRange}</span>
            </div>
          )}

          {/* Working hours */}
          {project.workingHours && (
            <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
              <span className="truncate">
                {project.workingHours.start} - {project.workingHours.end}
              </span>
            </div>
          )}

          {/* Venue */}
          {(project.venue || project.venueAddress) && (
            <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
              <span className="truncate">
                {project.venue || project.venueAddress}
              </span>
            </div>
          )}

          {/* Crew status */}
          {project.crewCount !== undefined && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                  <span>Crew</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {project.filledPositions || 0} / {project.crewCount}
                </span>
              </div>
              <Progress
                value={fillPercentage}
                className="h-1.5"
              />
              <p className="text-[10px] text-gray-500 text-right">
                {fillPercentage}% filled
                {fillPercentage < 100 && project.crewCount && (
                  <span className="ml-1">
                    ({project.crewCount - (project.filledPositions || 0)} needed)
                  </span>
                )}
              </p>
            </div>
          )}
        </CardContent>

        {/* Actions */}
        {(onViewDetails || onAssignStaff) && (
          <CardFooter className={cn(
            'pt-0 flex gap-2',
            compact ? 'p-3 pt-0' : 'justify-end'
          )}>
            {fillPercentage < 100 && onAssignStaff && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAssignStaff(project.id)}
                className="text-xs"
              >
                <Users className="w-3.5 h-3.5 mr-1.5" />
                Assign Staff
              </Button>
            )}
            {onViewDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails(project.id)}
                className="text-xs group"
              >
                View Details
                <ChevronRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            )}
          </CardFooter>
        )}
      </Card>
    </motion.div>
  )
}

// Multiple projects grid view
interface ProjectDataCardListProps {
  projects: ProjectCardData[]
  onViewDetails?: (projectId: string) => void
  onAssignStaff?: (projectId: string) => void
  className?: string
  compact?: boolean
}

export function ProjectDataCardList({
  projects,
  onViewDetails,
  onAssignStaff,
  className,
  compact = false
}: ProjectDataCardListProps) {
  if (projects.length === 0) {
    return (
      <div className={cn(
        'text-center py-6 text-gray-500 dark:text-gray-400',
        className
      )}>
        No projects found
      </div>
    )
  }

  return (
    <div className={cn(
      'grid gap-3',
      projects.length > 1 ? 'grid-cols-1' : '',
      className
    )}>
      {projects.map((project, index) => (
        <motion.div
          key={project.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <ProjectDataCard
            project={project}
            onViewDetails={onViewDetails}
            onAssignStaff={onAssignStaff}
            compact={compact || projects.length > 2}
          />
        </motion.div>
      ))}
    </div>
  )
}
