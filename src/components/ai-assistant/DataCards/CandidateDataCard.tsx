/**
 * Candidate Data Card Component
 * Displays candidate/staff information in a rich card format within AI chat
 */

import { motion } from 'framer-motion'
import {
  User,
  Mail,
  Phone,
  Star,
  Briefcase,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Calendar
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { CandidateCardData } from '@/types/ai-chat.types'

// Status configuration
const statusConfig: Record<CandidateCardData['status'], {
  label: string
  icon: React.ElementType
  className: string
}> = {
  available: {
    label: 'Available',
    icon: CheckCircle2,
    className: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400'
  },
  assigned: {
    label: 'Assigned',
    icon: Briefcase,
    className: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400'
  },
  unavailable: {
    label: 'Unavailable',
    icon: XCircle,
    className: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-400'
  },
  blacklisted: {
    label: 'Blacklisted',
    icon: AlertCircle,
    className: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400'
  }
}

interface CandidateDataCardProps {
  candidate: CandidateCardData
  onViewProfile?: (candidateId: string) => void
  onAssignToProject?: (candidateId: string) => void
  onContact?: (candidateId: string) => void
  className?: string
  compact?: boolean
}

export function CandidateDataCard({
  candidate,
  onViewProfile,
  onAssignToProject,
  onContact,
  className,
  compact = false
}: CandidateDataCardProps) {
  const status = statusConfig[candidate.status]
  const StatusIcon = status.icon

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Format last active date
  const formatLastActive = (dateStr?: string) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Render star rating
  const renderRating = (rating?: number) => {
    if (rating === undefined) return null
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5

    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              'w-3.5 h-3.5',
              i < fullStars
                ? 'text-yellow-400 fill-yellow-400'
                : i === fullStars && hasHalfStar
                ? 'text-yellow-400 fill-yellow-400/50'
                : 'text-gray-300 dark:text-gray-600'
            )}
          />
        ))}
        <span className="ml-1 text-xs text-gray-600 dark:text-gray-400">
          {rating.toFixed(1)}
        </span>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      <Card className={cn(
        'overflow-hidden transition-shadow hover:shadow-md',
        compact && 'shadow-sm'
      )}>
        <CardHeader className={cn(
          'pb-2',
          compact && 'p-3 pb-1'
        )}>
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <Avatar className={cn(
              'border-2 border-white shadow-sm',
              compact ? 'h-10 w-10' : 'h-12 w-12'
            )}>
              <AvatarImage src={candidate.avatar} alt={candidate.name} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                {getInitials(candidate.name)}
              </AvatarFallback>
            </Avatar>

            {/* Name and status */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h4 className={cn(
                  'font-semibold text-gray-900 dark:text-gray-100 truncate',
                  compact ? 'text-sm' : 'text-base'
                )}>
                  {candidate.name}
                </h4>
                <Badge
                  variant="outline"
                  className={cn('text-xs flex-shrink-0', status.className)}
                >
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {status.label}
                </Badge>
              </div>

              {/* Rating */}
              {candidate.rating !== undefined && (
                <div className="mt-1">
                  {renderRating(candidate.rating)}
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className={cn(
          'space-y-2',
          compact ? 'p-3 pt-0 pb-2' : 'pb-3'
        )}>
          {/* Contact info */}
          {candidate.email && (
            <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <Mail className="w-3.5 h-3.5 mr-2 flex-shrink-0" />
              <a
                href={`mailto:${candidate.email}`}
                className="truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {candidate.email}
              </a>
            </div>
          )}

          {candidate.phone && (
            <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <Phone className="w-3.5 h-3.5 mr-2 flex-shrink-0" />
              <a
                href={`tel:${candidate.phone}`}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {candidate.phone}
              </a>
            </div>
          )}

          {/* Projects count */}
          {candidate.totalProjects !== undefined && (
            <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <Briefcase className="w-3.5 h-3.5 mr-2 flex-shrink-0" />
              <span>{candidate.totalProjects} projects completed</span>
            </div>
          )}

          {/* Last active */}
          {candidate.lastActive && (
            <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <Clock className="w-3.5 h-3.5 mr-2 flex-shrink-0" />
              <span>Last active: {formatLastActive(candidate.lastActive)}</span>
            </div>
          )}

          {/* Skills */}
          {candidate.skills && candidate.skills.length > 0 && (
            <div className="pt-2">
              <div className="flex flex-wrap gap-1.5">
                {candidate.skills.slice(0, compact ? 3 : 5).map((skill, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0"
                  >
                    {skill}
                  </Badge>
                ))}
                {candidate.skills.length > (compact ? 3 : 5) && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0"
                  >
                    +{candidate.skills.length - (compact ? 3 : 5)} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Availability preview */}
          {candidate.availability && candidate.availability.length > 0 && !compact && (
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 mt-2">
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide font-medium">
                Availability
              </p>
              <div className="flex gap-1">
                {candidate.availability.slice(0, 7).map((day, i) => {
                  const date = new Date(day.date)
                  return (
                    <div
                      key={i}
                      className={cn(
                        'w-7 h-7 rounded flex flex-col items-center justify-center text-[9px]',
                        day.available
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                      )}
                      title={`${date.toLocaleDateString()}: ${day.available ? 'Available' : 'Unavailable'}`}
                    >
                      <span className="font-medium">
                        {date.toLocaleDateString('en-US', { weekday: 'narrow' })}
                      </span>
                      <span>{date.getDate()}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>

        {/* Actions */}
        {(onViewProfile || onAssignToProject || onContact) && (
          <CardFooter className={cn(
            'pt-0 flex gap-2 flex-wrap',
            compact ? 'p-3 pt-0' : ''
          )}>
            {candidate.status === 'available' && onAssignToProject && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onAssignToProject(candidate.id)}
                className="text-xs"
              >
                <Briefcase className="w-3.5 h-3.5 mr-1.5" />
                Assign
              </Button>
            )}
            {onContact && (candidate.email || candidate.phone) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onContact(candidate.id)}
                className="text-xs"
              >
                <Mail className="w-3.5 h-3.5 mr-1.5" />
                Contact
              </Button>
            )}
            {onViewProfile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewProfile(candidate.id)}
                className="text-xs group"
              >
                View Profile
                <ChevronRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            )}
          </CardFooter>
        )}
      </Card>
    </motion.div>
  )
}

// Multiple candidates list view
interface CandidateDataCardListProps {
  candidates: CandidateCardData[]
  onViewProfile?: (candidateId: string) => void
  onAssignToProject?: (candidateId: string) => void
  onContact?: (candidateId: string) => void
  className?: string
  compact?: boolean
}

export function CandidateDataCardList({
  candidates,
  onViewProfile,
  onAssignToProject,
  onContact,
  className,
  compact = false
}: CandidateDataCardListProps) {
  if (candidates.length === 0) {
    return (
      <div className={cn(
        'text-center py-6 text-gray-500 dark:text-gray-400',
        className
      )}>
        <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No candidates found</p>
      </div>
    )
  }

  return (
    <div className={cn(
      'grid gap-3',
      candidates.length > 1 ? 'grid-cols-1' : '',
      className
    )}>
      {candidates.map((candidate, index) => (
        <motion.div
          key={candidate.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <CandidateDataCard
            candidate={candidate}
            onViewProfile={onViewProfile}
            onAssignToProject={onAssignToProject}
            onContact={onContact}
            compact={compact || candidates.length > 2}
          />
        </motion.div>
      ))}
    </div>
  )
}
