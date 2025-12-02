/**
 * usePageContext Hook
 * Captures the current page context for AI awareness
 */

import { useMemo } from 'react'
import { useLocation, useParams } from 'react-router-dom'

export interface PageContext {
  currentPage: string
  pageType: string
  entityType: string | null
  entityId: string | null
  userAction: string
  breadcrumb: string
}

// Map route patterns to context information
const PAGE_CONTEXT_MAP: Record<string, { pageType: string; entityType: string | null; description: string }> = {
  '/dashboard': { pageType: 'dashboard', entityType: null, description: 'Main dashboard' },
  '/projects': { pageType: 'project_list', entityType: 'project', description: 'Projects list' },
  '/projects/:id': { pageType: 'project_detail', entityType: 'project', description: 'Viewing project details' },
  '/projects/new': { pageType: 'project_create', entityType: 'project', description: 'Creating new project' },
  '/candidates': { pageType: 'candidate_list', entityType: 'candidate', description: 'Candidates list' },
  '/candidates/:id': { pageType: 'candidate_detail', entityType: 'candidate', description: 'Viewing candidate profile' },
  '/calendar': { pageType: 'calendar', entityType: null, description: 'Calendar view' },
  '/calendar/list': { pageType: 'calendar_list', entityType: null, description: 'Calendar list view' },
  '/payments': { pageType: 'payment_list', entityType: 'payment', description: 'Payments list' },
  '/settings': { pageType: 'settings', entityType: null, description: 'Settings' },
  '/reports': { pageType: 'reports', entityType: null, description: 'Reports dashboard' },
}

export function usePageContext(): PageContext {
  const location = useLocation()
  const params = useParams()

  const context = useMemo(() => {
    const pathname = location.pathname

    // Try to match exact path first
    let matchedContext = PAGE_CONTEXT_MAP[pathname]
    let entityId: string | null = null

    // If no exact match, try pattern matching
    if (!matchedContext) {
      for (const [pattern, ctx] of Object.entries(PAGE_CONTEXT_MAP)) {
        // Convert route pattern to regex
        const regexPattern = pattern.replace(/:(\w+)/g, '([^/]+)')
        const regex = new RegExp(`^${regexPattern}$`)
        const match = pathname.match(regex)

        if (match) {
          matchedContext = ctx
          // Extract entity ID from match groups
          if (match[1] && match[1] !== 'new') {
            entityId = match[1]
          }
          break
        }
      }
    }

    // Get entity ID from params if not already found
    if (!entityId && params.id) {
      entityId = params.id
    }

    // Determine user action based on pathname
    let userAction = 'viewing'
    if (pathname.includes('/new') || pathname.includes('/create')) {
      userAction = 'creating'
    } else if (pathname.includes('/edit')) {
      userAction = 'editing'
    }

    // Build breadcrumb from path
    const pathParts = pathname.split('/').filter(Boolean)
    const breadcrumb = pathParts
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' > ')

    return {
      currentPage: pathname,
      pageType: matchedContext?.pageType || 'unknown',
      entityType: matchedContext?.entityType || null,
      entityId,
      userAction,
      breadcrumb: breadcrumb || 'Home'
    }
  }, [location.pathname, params])

  return context
}

/**
 * Format context for AI consumption
 */
export function formatContextForAI(context: PageContext): string {
  const parts: string[] = []

  parts.push(`Current page: ${context.breadcrumb}`)

  if (context.entityType && context.entityId) {
    parts.push(`Viewing ${context.entityType} ID: ${context.entityId}`)
  }

  if (context.userAction !== 'viewing') {
    parts.push(`User is ${context.userAction}`)
  }

  return parts.join('. ')
}
