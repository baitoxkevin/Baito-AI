/**
 * Query Result Caching for Baiger Tools
 *
 * Implements a simple in-memory cache with TTL and database backup
 * for frequently accessed query results.
 */

import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2'

// In-memory cache for fast access
const memoryCache = new Map<string, { data: unknown; expiresAt: number }>()

// Cache configuration
const CACHE_TTL = {
  projectStats: 5 * 60 * 1000,      // 5 minutes
  candidateSearch: 2 * 60 * 1000,   // 2 minutes
  projectList: 3 * 60 * 1000,       // 3 minutes
  upcomingDeadlines: 1 * 60 * 1000, // 1 minute (time-sensitive)
  default: 2 * 60 * 1000,           // 2 minutes
}

/**
 * Generate a cache key from tool name and parameters
 */
export function generateCacheKey(toolName: string, params: Record<string, unknown>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key]
      return acc
    }, {} as Record<string, unknown>)

  return `${toolName}:${JSON.stringify(sortedParams)}`
}

/**
 * Generate a hash for parameters (for database storage)
 */
export function hashParams(params: Record<string, unknown>): string {
  const str = JSON.stringify(params)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString(36)
}

/**
 * Get TTL for a specific tool
 */
function getTTL(toolName: string): number {
  switch (toolName) {
    case 'get_project_stats':
      return CACHE_TTL.projectStats
    case 'find_candidates':
      return CACHE_TTL.candidateSearch
    case 'get_projects':
      return CACHE_TTL.projectList
    case 'get_upcoming_deadlines':
      return CACHE_TTL.upcomingDeadlines
    default:
      return CACHE_TTL.default
  }
}

/**
 * Check if a tool result is cacheable
 */
export function isCacheable(toolName: string): boolean {
  // Tools that should NOT be cached (write operations, real-time data)
  const nonCacheableTools = [
    'create_project',
    'assign_staff',
    'update_staff_status',
    'execute_sql', // Too dynamic to cache
  ]

  return !nonCacheableTools.includes(toolName)
}

/**
 * Get cached result from memory or database
 */
export async function getCachedResult(
  supabase: SupabaseClient,
  toolName: string,
  params: Record<string, unknown>
): Promise<unknown | null> {
  if (!isCacheable(toolName)) {
    return null
  }

  const cacheKey = generateCacheKey(toolName, params)
  const now = Date.now()

  // Check memory cache first
  const memCached = memoryCache.get(cacheKey)
  if (memCached && memCached.expiresAt > now) {
    console.log(`📦 Cache HIT (memory): ${toolName}`)
    return memCached.data
  }

  // Check database cache
  try {
    const { data, error } = await supabase
      .from('ai_query_cache')
      .select('result, expires_at')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !data) {
      return null
    }

    // Update hit count
    await supabase
      .from('ai_query_cache')
      .update({
        hit_count: supabase.rpc('increment_counter', {}), // TODO: implement this
        last_accessed_at: new Date().toISOString(),
      })
      .eq('cache_key', cacheKey)

    // Store in memory cache for faster subsequent access
    memoryCache.set(cacheKey, {
      data: data.result,
      expiresAt: new Date(data.expires_at).getTime(),
    })

    console.log(`📦 Cache HIT (db): ${toolName}`)
    return data.result
  } catch (error) {
    console.warn('Cache lookup failed:', error)
    return null
  }
}

/**
 * Store result in cache (memory and database)
 */
export async function setCachedResult(
  supabase: SupabaseClient,
  toolName: string,
  params: Record<string, unknown>,
  result: unknown
): Promise<void> {
  if (!isCacheable(toolName)) {
    return
  }

  const cacheKey = generateCacheKey(toolName, params)
  const ttl = getTTL(toolName)
  const expiresAt = Date.now() + ttl

  // Store in memory cache
  memoryCache.set(cacheKey, {
    data: result,
    expiresAt,
  })

  // Store in database cache (async, don't wait)
  try {
    await supabase
      .from('ai_query_cache')
      .upsert({
        cache_key: cacheKey,
        tool_name: toolName,
        parameters_hash: hashParams(params),
        result: result,
        expires_at: new Date(expiresAt).toISOString(),
        last_accessed_at: new Date().toISOString(),
        hit_count: 1,
      })
      .eq('cache_key', cacheKey)

    console.log(`📦 Cache SET: ${toolName} (TTL: ${ttl / 1000}s)`)
  } catch (error) {
    console.warn('Cache store failed:', error)
  }
}

/**
 * Invalidate cache for a specific tool or all tools
 */
export async function invalidateCache(
  supabase: SupabaseClient,
  toolName?: string
): Promise<void> {
  if (toolName) {
    // Invalidate memory cache for tool
    for (const key of memoryCache.keys()) {
      if (key.startsWith(`${toolName}:`)) {
        memoryCache.delete(key)
      }
    }

    // Invalidate database cache
    await supabase
      .from('ai_query_cache')
      .delete()
      .eq('tool_name', toolName)
  } else {
    // Clear all cache
    memoryCache.clear()
    await supabase
      .from('ai_query_cache')
      .delete()
      .lt('id', 'zzz') // Delete all
  }
}

/**
 * Clean up expired cache entries
 */
export async function cleanupExpiredCache(supabase: SupabaseClient): Promise<void> {
  const now = Date.now()

  // Clean memory cache
  for (const [key, value] of memoryCache.entries()) {
    if (value.expiresAt < now) {
      memoryCache.delete(key)
    }
  }

  // Clean database cache
  await supabase
    .from('ai_query_cache')
    .delete()
    .lt('expires_at', new Date().toISOString())
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { memorySize: number; keys: string[] } {
  return {
    memorySize: memoryCache.size,
    keys: Array.from(memoryCache.keys()),
  }
}
