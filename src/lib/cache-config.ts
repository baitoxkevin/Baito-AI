/**
 * Cache Configuration Service
 * Centralized configuration for caching strategy across the application
 */

import { cacheManager, cacheInvalidator } from './cache-manager'

// Cache TTL configuration (in seconds)
export const CACHE_TTL = {
  // User & Auth
  USER_PROFILE: 900,         // 15 minutes
  USER_PERMISSIONS: 1800,    // 30 minutes
  AUTH_SESSION: 3600,        // 1 hour

  // Projects
  PROJECT_DETAILS: 300,      // 5 minutes
  PROJECT_LIST: 180,         // 3 minutes
  PROJECT_STAFF: 300,        // 5 minutes
  PROJECT_STATS: 600,        // 10 minutes

  // Staff & Candidates
  STAFF_AVAILABILITY: 600,   // 10 minutes
  CANDIDATE_LIST: 300,       // 5 minutes
  CANDIDATE_DETAILS: 600,    // 10 minutes

  // Analytics & Reports
  ANALYTICS_DAILY: 3600,     // 1 hour
  ANALYTICS_WEEKLY: 7200,    // 2 hours
  ANALYTICS_MONTHLY: 14400,  // 4 hours
  REPORTS: 7200,             // 2 hours

  // Static Data
  COMPANIES_LIST: 1800,      // 30 minutes
  LOCATIONS: 86400,          // 24 hours
  STATIC_CONTENT: 86400,     // 24 hours

  // Real-time Data (shorter TTL)
  NOTIFICATIONS: 60,         // 1 minute
  ACTIVE_USERS: 120,         // 2 minutes
  PAYMENT_QUEUE: 180,        // 3 minutes

  // Expense Claims
  EXPENSE_CLAIMS: 300,       // 5 minutes
  RECEIPTS: 600,             // 10 minutes
} as const

// Cache key generators
export const CACHE_KEYS = {
  // User & Auth
  userProfile: (userId: string) => `user:profile:${userId}`,
  userPermissions: (userId: string) => `user:permissions:${userId}`,
  authSession: (sessionId: string) => `auth:session:${sessionId}`,

  // Projects
  projectDetails: (projectId: string) => `project:details:${projectId}`,
  projectList: (filters?: string) => `projects:list:${filters || 'all'}`,
  projectStaff: (projectId: string) => `project:staff:${projectId}`,
  projectStats: (projectId: string) => `project:stats:${projectId}`,
  projectDocuments: (projectId: string) => `project:documents:${projectId}`,

  // Staff & Candidates
  candidateList: (filters?: string) => `candidates:list:${filters || 'all'}`,
  candidateDetails: (candidateId: string) => `candidate:details:${candidateId}`,
  staffAvailability: (date: string) => `staff:availability:${date}`,
  staffSchedule: (staffId: string, month: string) => `staff:schedule:${staffId}:${month}`,

  // Analytics
  analytics: (type: string, period: string) => `analytics:${type}:${period}`,
  yearStats: (year: number) => `stats:year:${year}`,
  dashboardStats: (userId: string) => `dashboard:stats:${userId}`,

  // Companies & Locations
  companiesList: () => 'companies:list',
  companyDetails: (companyId: string) => `company:details:${companyId}`,
  locations: () => 'locations:all',

  // Payments & Expenses
  paymentQueue: (projectId?: string) => `payments:queue:${projectId || 'all'}`,
  expenseClaims: (projectId: string) => `expenses:claims:${projectId}`,
  receipts: (claimId: string) => `receipts:claim:${claimId}`,

  // Real-time
  notifications: (userId: string) => `notifications:${userId}`,
  activeUsers: () => 'users:active',
} as const

/**
 * Cache wrapper with automatic key generation and TTL
 */
export class CacheService {
  private static instance: CacheService

  static getInstance(): CacheService {
    if (!this.instance) {
      this.instance = new CacheService()
    }
    return this.instance
  }

  // Project caching
  async getProject<T>(projectId: string, fetcher: () => Promise<T>): Promise<T> {
    return cacheManager.getOrSet(
      CACHE_KEYS.projectDetails(projectId),
      fetcher,
      CACHE_TTL.PROJECT_DETAILS
    )
  }

  async getProjectList<T>(filters: string | undefined, fetcher: () => Promise<T>): Promise<T> {
    return cacheManager.getOrSet(
      CACHE_KEYS.projectList(filters),
      fetcher,
      CACHE_TTL.PROJECT_LIST
    )
  }

  async invalidateProject(projectId: string): Promise<void> {
    await cacheInvalidator.onProjectUpdate(projectId)
  }

  // Staff/Candidate caching
  async getCandidate<T>(candidateId: string, fetcher: () => Promise<T>): Promise<T> {
    return cacheManager.getOrSet(
      CACHE_KEYS.candidateDetails(candidateId),
      fetcher,
      CACHE_TTL.CANDIDATE_DETAILS
    )
  }

  async getCandidateList<T>(filters: string | undefined, fetcher: () => Promise<T>): Promise<T> {
    return cacheManager.getOrSet(
      CACHE_KEYS.candidateList(filters),
      fetcher,
      CACHE_TTL.CANDIDATE_LIST
    )
  }

  async invalidateStaff(staffId: string): Promise<void> {
    await cacheInvalidator.onStaffUpdate(staffId)
  }

  // Analytics caching
  async getAnalytics<T>(type: string, period: string, fetcher: () => Promise<T>): Promise<T> {
    const ttl = period === 'daily' ? CACHE_TTL.ANALYTICS_DAILY :
                period === 'weekly' ? CACHE_TTL.ANALYTICS_WEEKLY :
                CACHE_TTL.ANALYTICS_MONTHLY

    return cacheManager.getOrSet(
      CACHE_KEYS.analytics(type, period),
      fetcher,
      ttl
    )
  }

  // User caching
  async getUserProfile<T>(userId: string, fetcher: () => Promise<T>): Promise<T> {
    return cacheManager.getOrSet(
      CACHE_KEYS.userProfile(userId),
      fetcher,
      CACHE_TTL.USER_PROFILE
    )
  }

  async invalidateUser(userId: string): Promise<void> {
    await cacheInvalidator.onUserUpdate(userId)
  }

  // Expense Claims caching
  async getExpenseClaims<T>(projectId: string, fetcher: () => Promise<T>): Promise<T> {
    return cacheManager.getOrSet(
      CACHE_KEYS.expenseClaims(projectId),
      fetcher,
      CACHE_TTL.EXPENSE_CLAIMS
    )
  }

  async invalidateExpenses(projectId: string): Promise<void> {
    await cacheInvalidator.onExpenseUpdate(projectId)
  }

  // Payment Queue caching
  async getPaymentQueue<T>(projectId: string | undefined, fetcher: () => Promise<T>): Promise<T> {
    return cacheManager.getOrSet(
      CACHE_KEYS.paymentQueue(projectId),
      fetcher,
      CACHE_TTL.PAYMENT_QUEUE
    )
  }

  async invalidatePayments(projectId: string): Promise<void> {
    await cacheInvalidator.onPaymentCreated(projectId)
  }

  // Direct cache access for custom scenarios
  async get<T>(key: string): Promise<T | null> {
    return cacheManager.get(key)
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    return cacheManager.set(key, value, ttl)
  }

  async invalidate(pattern: string): Promise<void> {
    return cacheManager.invalidate(pattern)
  }

  // Cache statistics
  getStats() {
    return cacheManager.getStats()
  }

  // Batch operations
  async warmupCache(userId: string): Promise<void> {
    // Pre-fetch commonly accessed data for better performance
    const warmupTasks = [
      this.getUserProfile(userId, async () => {
        // Fetch user profile from database
        return {}
      }),
      this.getProjectList(undefined, async () => {
        // Fetch recent projects
        return []
      }),
    ]

    await Promise.all(warmupTasks)
  }
}

// Export singleton instance
export const cacheService = CacheService.getInstance()

// Export cache-enabled hooks factory
export function createCachedHook<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_TTL.PROJECT_DETAILS
) {
  return async (): Promise<T> => {
    return cacheManager.getOrSet(cacheKey, fetcher, ttl)
  }
}

// Enable/disable caching based on environment
export const isCacheEnabled = (): boolean => {
  return import.meta.env.VITE_ENABLE_CACHE !== 'false'
}

// Performance monitoring integration
export const logCachePerformance = () => {
  const stats = cacheManager.getStats()
  if (import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true') {
    console.log('[Cache Performance]', {
      hitRate: `${stats.hitRate.toFixed(2)}%`,
      hits: stats.hits,
      misses: stats.misses,
      errors: stats.errors
    })
  }
}