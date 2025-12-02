/**
 * Data Table Component
 * Displays tabular data with sorting, pagination, and actions within AI chat
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { TableData } from '@/types/ai-chat.types'

// Status badge colors
const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  inactive: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  available: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  unavailable: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  assigned: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
}

interface DataTableProps {
  data: TableData
  onRowClick?: (row: Record<string, unknown>) => void
  onAction?: (action: string, row: Record<string, unknown>) => void
  className?: string
  compact?: boolean
}

export function DataTable({
  data,
  onRowClick,
  onAction,
  className,
  compact = false
}: DataTableProps) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(data.pagination?.currentPage || 1)

  // Handle sort
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  // Sort rows
  const sortedRows = [...data.rows].sort((a, b) => {
    if (!sortKey) return 0
    const aVal = a[sortKey]
    const bVal = b[sortKey]

    if (aVal === bVal) return 0
    if (aVal === null || aVal === undefined) return 1
    if (bVal === null || bVal === undefined) return -1

    const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true })
    return sortDirection === 'asc' ? comparison : -comparison
  })

  // Format cell value
  const formatCellValue = (
    value: unknown,
    type?: 'text' | 'number' | 'date' | 'status' | 'action'
  ) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400">-</span>
    }

    switch (type) {
      case 'number':
        return (
          <span className="tabular-nums font-medium">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
        )

      case 'date':
        const date = new Date(String(value))
        return (
          <span>
            {date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
            })}
          </span>
        )

      case 'status':
        const statusValue = String(value).toLowerCase()
        const statusClass = statusColors[statusValue] || statusColors.inactive
        return (
          <Badge variant="outline" className={cn('text-xs', statusClass)}>
            {String(value)}
          </Badge>
        )

      case 'action':
        return null // Handled separately

      default:
        return <span className="truncate">{String(value)}</span>
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      <Card className="overflow-hidden">
        {data.title && (
          <CardHeader className={cn('pb-2', compact && 'p-3 pb-1')}>
            <CardTitle className={cn('font-semibold', compact ? 'text-sm' : 'text-base')}>
              {data.title}
            </CardTitle>
          </CardHeader>
        )}

        <CardContent className={cn('p-0', !data.title && 'pt-0')}>
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Header */}
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  {data.columns.map((column) => (
                    <th
                      key={column.key}
                      className={cn(
                        'px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400',
                        'uppercase tracking-wide',
                        column.type !== 'action' && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors',
                        compact && 'px-2 py-1.5'
                      )}
                      style={{ width: column.width }}
                      onClick={() => column.type !== 'action' && handleSort(column.key)}
                    >
                      <div className="flex items-center gap-1">
                        <span className="truncate">{column.label}</span>
                        {sortKey === column.key && (
                          sortDirection === 'asc'
                            ? <ChevronUp className="w-3 h-3" />
                            : <ChevronDown className="w-3 h-3" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Body */}
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sortedRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={data.columns.length}
                      className="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      No data available
                    </td>
                  </tr>
                ) : (
                  sortedRows.map((row, rowIndex) => (
                    <motion.tr
                      key={rowIndex}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: rowIndex * 0.02 }}
                      className={cn(
                        'transition-colors',
                        onRowClick && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      )}
                      onClick={() => onRowClick?.(row)}
                    >
                      {data.columns.map((column) => (
                        <td
                          key={column.key}
                          className={cn(
                            'px-3 py-2 text-sm text-gray-900 dark:text-gray-100',
                            compact && 'px-2 py-1.5 text-xs'
                          )}
                        >
                          {column.type === 'action' ? (
                            <div className="flex items-center gap-1">
                              {Array.isArray(row[column.key]) ? (
                                (row[column.key] as { label: string; action: string }[]).map((action, i) => (
                                  <Button
                                    key={i}
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onAction?.(action.action, row)
                                    }}
                                  >
                                    {action.label}
                                  </Button>
                                ))
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onAction?.(String(row[column.key]), row)
                                  }}
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          ) : (
                            formatCellValue(row[column.key], column.type)
                          )}
                        </td>
                      ))}
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>

        {/* Footer with pagination */}
        {(data.footer || data.pagination) && (
          <CardFooter className={cn(
            'justify-between border-t border-gray-200 dark:border-gray-700',
            compact ? 'p-2' : 'px-3 py-2'
          )}>
            {data.footer ? (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {data.footer}
              </span>
            ) : (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {data.pagination && `${data.pagination.totalItems} total items`}
              </span>
            )}

            {data.pagination && data.pagination.totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {currentPage} / {data.pagination.totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  disabled={currentPage === data.pagination.totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(data.pagination!.totalPages, prev + 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </CardFooter>
        )}
      </Card>
    </motion.div>
  )
}
