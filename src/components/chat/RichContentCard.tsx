/**
 * Rich Content Card Component
 * Displays structured content like lists, cards, metrics, and schedules
 * Used by AI assistant to show formatted data beyond plain text/markdown
 */

import { motion } from 'framer-motion'
import {
  Calendar,
  Users,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { colors, borderRadius, shadows } from '@/lib/chat/design-tokens'

// Content type definitions
export type RichContentType =
  | 'list'
  | 'card'
  | 'metrics'
  | 'schedule'
  | 'status'

export interface ListItem {
  id?: string
  title: string
  subtitle?: string
  value?: string
  status?: 'success' | 'warning' | 'error' | 'info'
  icon?: 'calendar' | 'users' | 'dollar' | 'clock' | 'check' | 'alert'
}

export interface MetricItem {
  label: string
  value: string | number
  change?: number // Percentage change
  trend?: 'up' | 'down' | 'neutral'
  icon?: 'calendar' | 'users' | 'dollar' | 'clock'
}

export interface CardData {
  title: string
  description?: string
  items: ListItem[]
  footer?: string
}

export interface MetricsData {
  title: string
  metrics: MetricItem[]
}

export interface ScheduleItem {
  time: string
  title: string
  location?: string
  status?: 'upcoming' | 'ongoing' | 'completed'
}

export interface ScheduleData {
  title: string
  date?: string
  items: ScheduleItem[]
}

export interface StatusData {
  title: string
  status: 'success' | 'warning' | 'error' | 'info'
  message: string
  details?: string[]
}

export interface RichContent {
  type: RichContentType
  data: CardData | MetricsData | ScheduleData | StatusData
}

interface RichContentCardProps {
  content: RichContent
  className?: string
}

const iconMap = {
  calendar: Calendar,
  users: Users,
  dollar: DollarSign,
  clock: Clock,
  check: CheckCircle2,
  alert: AlertCircle,
}

const statusColors = {
  success: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
  warning: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
  error: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
  info: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
}

export function RichContentCard({ content, className }: RichContentCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn('my-2', className)}
    >
      {content.type === 'list' && <ListCard data={content.data as CardData} />}
      {content.type === 'card' && <InfoCard data={content.data as CardData} />}
      {content.type === 'metrics' && <MetricsCard data={content.data as MetricsData} />}
      {content.type === 'schedule' && <ScheduleCard data={content.data as ScheduleData} />}
      {content.type === 'status' && <StatusCard data={content.data as StatusData} />}
    </motion.div>
  )
}

function ListCard({ data }: { data: CardData }) {
  return (
    <Card
      className="border shadow-sm"
      style={{
        borderRadius: borderRadius.DEFAULT,
        boxShadow: shadows.sm
      }}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{data.title}</CardTitle>
        {data.description && (
          <CardDescription className="text-sm">{data.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {data.items.map((item, index) => {
          const Icon = item.icon ? iconMap[item.icon] : null
          return (
            <div
              key={item.id || index}
              className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {Icon && (
                  <Icon className="h-4 w-4 text-gray-500 flex-shrink-0" aria-hidden="true" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {item.title}
                  </p>
                  {item.subtitle && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {item.subtitle}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {item.value && (
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {item.value}
                  </span>
                )}
                {item.status && (
                  <Badge
                    variant="outline"
                    className={cn('text-xs', statusColors[item.status])}
                  >
                    {item.status}
                  </Badge>
                )}
              </div>
            </div>
          )
        })}
        {data.footer && (
          <div className="pt-2 mt-2 border-t text-xs text-gray-500 dark:text-gray-400">
            {data.footer}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function InfoCard({ data }: { data: CardData }) {
  return (
    <Card
      className="border shadow-sm"
      style={{
        borderRadius: borderRadius.DEFAULT,
        boxShadow: shadows.sm
      }}
    >
      <CardHeader>
        <CardTitle className="text-base">{data.title}</CardTitle>
        {data.description && (
          <CardDescription className="text-sm">{data.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="grid gap-3">
        {data.items.map((item, index) => (
          <div key={item.id || index} className="flex justify-between items-start">
            <span className="text-sm text-gray-600 dark:text-gray-400">{item.title}</span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 text-right">
              {item.value}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function MetricsCard({ data }: { data: MetricsData }) {
  return (
    <Card
      className="border shadow-sm"
      style={{
        borderRadius: borderRadius.DEFAULT,
        boxShadow: shadows.sm
      }}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{data.title}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        {data.metrics.map((metric, index) => {
          const Icon = metric.icon ? iconMap[metric.icon] : null
          const TrendIcon = metric.trend === 'up'
            ? TrendingUp
            : metric.trend === 'down'
            ? TrendingDown
            : Minus

          return (
            <div
              key={index}
              className="space-y-1 p-3 rounded-md bg-gray-50 dark:bg-gray-800/50"
            >
              <div className="flex items-center gap-2">
                {Icon && (
                  <Icon
                    className="h-4 w-4 text-gray-500"
                    aria-hidden="true"
                  />
                )}
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {metric.label}
                </p>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {metric.value}
                </p>
                {metric.change !== undefined && (
                  <div className="flex items-center gap-1">
                    <TrendIcon
                      className={cn(
                        'h-3 w-3',
                        metric.trend === 'up' && 'text-green-600',
                        metric.trend === 'down' && 'text-red-600',
                        metric.trend === 'neutral' && 'text-gray-500'
                      )}
                      aria-hidden="true"
                    />
                    <span
                      className={cn(
                        'text-xs font-medium',
                        metric.trend === 'up' && 'text-green-600',
                        metric.trend === 'down' && 'text-red-600',
                        metric.trend === 'neutral' && 'text-gray-500'
                      )}
                    >
                      {metric.change > 0 ? '+' : ''}{metric.change}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function ScheduleCard({ data }: { data: ScheduleData }) {
  return (
    <Card
      className="border shadow-sm"
      style={{
        borderRadius: borderRadius.DEFAULT,
        boxShadow: shadows.sm
      }}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{data.title}</CardTitle>
        {data.date && (
          <CardDescription className="text-sm">{data.date}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {data.items.map((item, index) => (
          <div
            key={index}
            className="flex gap-3 pb-3 last:pb-0 last:border-0 border-b border-gray-200 dark:border-gray-700"
          >
            <div className="flex flex-col items-center w-16 flex-shrink-0">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {item.time}
              </span>
              {item.status && (
                <div
                  className={cn(
                    'w-2 h-2 rounded-full mt-1',
                    item.status === 'completed' && 'bg-green-500',
                    item.status === 'ongoing' && 'bg-blue-500',
                    item.status === 'upcoming' && 'bg-gray-300'
                  )}
                  aria-label={`Status: ${item.status}`}
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {item.title}
              </p>
              {item.location && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {item.location}
                </p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function StatusCard({ data }: { data: StatusData }) {
  const Icon = iconMap[data.status === 'success' ? 'check' : 'alert']

  return (
    <Card
      className={cn('border-2', statusColors[data.status])}
      style={{
        borderRadius: borderRadius.DEFAULT,
        boxShadow: shadows.sm
      }}
    >
      <CardContent className="pt-6">
        <div className="flex gap-3">
          <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold mb-1">{data.title}</h4>
            <p className="text-sm mb-2">{data.message}</p>
            {data.details && data.details.length > 0 && (
              <ul className="text-xs space-y-1 list-disc list-inside">
                {data.details.map((detail, index) => (
                  <li key={index}>{detail}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
