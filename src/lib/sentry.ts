/**
 * Sentry Configuration and Error Monitoring
 * Production-ready error tracking and performance monitoring
 */

import * as Sentry from '@sentry/react'

// Environment configuration
const isDevelopment = import.meta.env.DEV
const isProduction = import.meta.env.PROD
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN
const SENTRY_ENVIRONMENT = import.meta.env.VITE_SENTRY_ENVIRONMENT || (isProduction ? 'production' : 'development')
const SENTRY_RELEASE = import.meta.env.VITE_APP_VERSION || 'unknown'

/**
 * Initialize Sentry monitoring
 * Call this once in your main.tsx file
 */
export function initSentry() {
  // Only initialize in production or if explicitly enabled
  if (!SENTRY_DSN && isProduction) {
    console.warn('[Sentry] No DSN provided. Error monitoring is disabled.')
    return
  }

  if (!SENTRY_DSN) {
    console.log('[Sentry] Skipping initialization in development (no DSN provided)')
    return
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: SENTRY_ENVIRONMENT,
      release: SENTRY_RELEASE,

      // Performance Monitoring
      integrations: [
        Sentry.browserTracingIntegration({
          // Set sampling rate for performance monitoring
          tracingOrigins: [
            'localhost',
            /^https:\/\/.*\.supabase\.co/,
            /^https:\/\/api\./,
          ],
        }),
      ],

      // Performance Monitoring
      tracesSampleRate: isProduction ? 0.1 : 1.0, // 10% in production, 100% in development

      // Session Replay
      replaysSessionSampleRate: 0.1, // 10% of sessions will be recorded
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors will be recorded

      // Error filtering
      ignoreErrors: [
        // Browser extensions
        'Non-Error promise rejection captured',
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
        // Network errors
        'NetworkError',
        'Failed to fetch',
        'Load failed',
        // User actions
        'User cancelled',
        'Request aborted',
      ],

      // Data scrubbing
      beforeSend(event, hint) {
        // Filter out certain errors in development
        if (isDevelopment && hint.originalException) {
          const error = hint.originalException as Error
          if (error.message?.includes('VITE')) {
            return null // Don't send Vite HMR errors
          }
        }

        // Scrub sensitive data
        if (event.request) {
          // Remove auth headers
          if (event.request.headers) {
            delete event.request.headers['Authorization']
            delete event.request.headers['Cookie']
            delete event.request.headers['X-Supabase-Auth']
          }

          // Remove sensitive query params
          if (event.request.query_string) {
            event.request.query_string = event.request.query_string
              .replace(/api_key=[^&]+/g, 'api_key=REDACTED')
              .replace(/token=[^&]+/g, 'token=REDACTED')
              .replace(/password=[^&]+/g, 'password=REDACTED')
          }
        }

        // Scrub user data
        if (event.user) {
          event.user = {
            id: event.user.id,
            // Don't send email or other PII
          }
        }

        return event
      },

      // Breadcrumb filtering
      beforeBreadcrumb(breadcrumb) {
        // Filter out noisy breadcrumbs
        if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
          return null
        }

        // Filter out certain XHR requests
        if (breadcrumb.category === 'xhr' || breadcrumb.category === 'fetch') {
          const url = breadcrumb.data?.url
          if (url && (url.includes('_next/static') || url.includes('hot-update'))) {
            return null
          }
        }

        return breadcrumb
      },
    })

    console.log('[Sentry] Initialized successfully')
  } catch (error) {
    console.error('[Sentry] Failed to initialize:', error)
  }
}

/**
 * Set user context for error tracking
 */
export function setSentryUser(user: { id: string; email?: string; role?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    // Add any other non-sensitive user attributes
    role: user.role,
  })
}

/**
 * Clear user context (on logout)
 */
export function clearSentryUser() {
  Sentry.setUser(null)
}

/**
 * Add custom context to errors
 */
export function setSentryContext(key: string, context: Record<string, any>) {
  Sentry.setContext(key, context)
}

/**
 * Capture a message with additional context
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level)
}

/**
 * Capture an exception with additional context
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (context) {
    Sentry.withScope((scope) => {
      Object.keys(context).forEach(key => {
        scope.setContext(key, context[key])
      })
      Sentry.captureException(error)
    })
  } else {
    Sentry.captureException(error)
  }
}

/**
 * Add a breadcrumb for better error context
 */
export function addBreadcrumb(breadcrumb: {
  message: string
  category?: string
  level?: Sentry.SeverityLevel
  data?: Record<string, any>
}) {
  Sentry.addBreadcrumb({
    message: breadcrumb.message,
    category: breadcrumb.category || 'custom',
    level: breadcrumb.level || 'info',
    data: breadcrumb.data,
    timestamp: Date.now() / 1000,
  })
}

/**
 * Performance monitoring: Start a transaction
 */
export function startTransaction(name: string, op: string = 'navigation') {
  return Sentry.startSpan({ name, op }, () => {})
}

/**
 * Create an error boundary component
 */
export const ErrorBoundary = Sentry.ErrorBoundary

/**
 * Profiler component for performance monitoring
 */
export const Profiler = Sentry.Profiler

/**
 * Hook for error handling in components
 */
export function useSentryError() {
  return {
    captureException,
    captureMessage,
    addBreadcrumb,
    setSentryContext,
  }
}

// Export Sentry instance for advanced usage
export { Sentry }