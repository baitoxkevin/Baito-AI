import { useRef, useCallback, useState, useEffect } from 'react';

import { logger } from './logger';
interface CacheOptions {
  expireAfter?: number;   // Time in ms after which cache is considered completely expired
  staleAfter?: number;    // Time in ms after which cache is considered stale but usable
  maxEntries?: number;    // Maximum number of entries to keep in the cache
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  fetchingPromise?: Promise<T>; // Tracks in-flight requests for deduplication
}

interface Cache<T> {
  [key: string]: CacheEntry<T>;
}

const DEFAULT_CACHE_OPTIONS: CacheOptions = {
  expireAfter: 5 * 60 * 1000, // 5 minutes
  staleAfter: 60 * 1000,      // 1 minute
  maxEntries: 100             // 100 entries
};

// Global cache store for sharing between hooks
const globalCache: Record<string, unknown> = {};

// LRU tracking
const cacheAccessTimes: Record<string, Record<string, number>> = {};

/**
 * Enhanced cache hook for API data with stale-while-revalidate pattern
 * @param namespace The namespace for this data type (e.g. 'projects', 'users')
 * @param fetchFunction The function to call when data needs to be fetched
 * @param options Caching configuration options
 */
export function useCache<T, P extends unknown[]>(
  namespace: string,
  fetchFunction: (...args: P) => Promise<T>, 
  options: CacheOptions = {}
) {
  // Merge default options with provided options
  const cacheOptions = {
    ...DEFAULT_CACHE_OPTIONS,
    ...options
  };

  // Initialize the namespace in global cache if it doesn't exist
  if (!globalCache[namespace]) {
    globalCache[namespace] = {};
    cacheAccessTimes[namespace] = {};
  }

  const [isLoading, setIsLoading] = useState(false);
  const cache = useRef<Cache<T>>(globalCache[namespace]);
  
  // Function to generate a cache key from function args
  const getCacheKey = useCallback((...args: P): string => {
    return args.map(arg => 
      typeof arg === 'object' 
        ? JSON.stringify(arg) 
        : String(arg)
    ).join('|') || 'default';
  }, []);

  // Check if a cache entry is completely expired
  const isCacheExpired = useCallback((entry: CacheEntry<T>): boolean => {
    return Date.now() - entry.timestamp > (cacheOptions.expireAfter || DEFAULT_CACHE_OPTIONS.expireAfter!);
  }, [cacheOptions.expireAfter]);

  // Check if a cache entry is stale but still usable
  const isCacheStale = useCallback((entry: CacheEntry<T>): boolean => {
    return Date.now() - entry.timestamp > (cacheOptions.staleAfter || DEFAULT_CACHE_OPTIONS.staleAfter!);
  }, [cacheOptions.staleAfter]);

  // Enforce the maximum number of entries in the cache
  const enforceMaxEntries = useCallback(() => {
    const maxEntries = cacheOptions.maxEntries || DEFAULT_CACHE_OPTIONS.maxEntries!;
    const keys = Object.keys(cache.current);

    if (keys.length <= maxEntries) return;

    // Sort keys by last access time (ascending, oldest first)
    const sortedKeys = [...keys].sort((a, b) => 
      (cacheAccessTimes[namespace][a] || 0) - (cacheAccessTimes[namespace][b] || 0)
    );

    // Remove oldest entries until we're under the limit
    const keysToRemove = sortedKeys.slice(0, keys.length - maxEntries);
    
    keysToRemove.forEach(key => {
      delete cache.current[key];
      delete globalCache[namespace][key];
      delete cacheAccessTimes[namespace][key];
    });
  }, [namespace, cacheOptions.maxEntries]);

  // Updates access time for LRU tracking
  const updateAccessTime = useCallback((key: string) => {
    cacheAccessTimes[namespace][key] = Date.now();
  }, [namespace]);

  // Get data with stale-while-revalidate pattern
  const getData = useCallback(async (...args: P): Promise<T> => {
    const cacheKey = getCacheKey(...args);
    updateAccessTime(cacheKey);
    
    // 1. Check for cached entry
    const cachedEntry = cache.current[cacheKey];
    
    // 2. Handle no cache case
    if (!cachedEntry || isCacheExpired(cachedEntry)) {
      setIsLoading(true);
      
      try {
        // Check if a request is already in flight to avoid duplicate requests
        if (cachedEntry?.fetchingPromise) {
          return await cachedEntry.fetchingPromise;
        }
        
        // Start new fetch
        const fetchPromise = fetchFunction(...args);
        
        // Store the promise in cache to deduplicate concurrent requests
        if (cachedEntry) {
          cachedEntry.fetchingPromise = fetchPromise;
        } else {
          cache.current[cacheKey] = { 
            data: {} as T, // Placeholder
            timestamp: 0,  // Will be updated when fetch completes
            fetchingPromise: fetchPromise
          };
        }
        
        // Wait for results
        const data = await fetchPromise;
        
        // Update cache with fresh data
        cache.current[cacheKey] = {
          data,
          timestamp: Date.now()
        };
        
        // Update global cache
        globalCache[namespace][cacheKey] = cache.current[cacheKey];
        
        // Enforce max entries after adding new entry
        enforceMaxEntries();
        
        return data;
      } catch (error) {
        // Remove failed request from cache
        if (cachedEntry) {
          delete cachedEntry.fetchingPromise;
        }
        logger.error(`Error fetching ${namespace} data:`, error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    }
    
    // 3. Handle stale cache - return stale data but refresh in background
    if (isCacheStale(cachedEntry)) {
      
      // Start refresh in background (fire and forget)
      if (!cachedEntry.fetchingPromise) {
        cachedEntry.fetchingPromise = fetchFunction(...args)
          .then(data => {
            // Update cache with fresh data
            cache.current[cacheKey] = {
              data,
              timestamp: Date.now()
            };
            
            // Update global cache
            globalCache[namespace][cacheKey] = cache.current[cacheKey];
            
            return data;
          })
          .catch(error => {
            logger.error(`Error refreshing stale ${namespace} data:`, error);
            // Keep using the stale data on refresh failure
            return cachedEntry.data;
          })
          .finally(() => {
            delete cachedEntry.fetchingPromise;
          });
      }
      
      // Return stale data immediately
      return cachedEntry.data;
    }
    
    // 4. Return fresh cached data
    return cachedEntry.data;
  }, [
    namespace, 
    fetchFunction, 
    getCacheKey, 
    isCacheExpired, 
    isCacheStale,
    enforceMaxEntries,
    updateAccessTime
  ]);

  // Prefetch data without waiting for result
  const prefetch = useCallback((...args: P): void => {
    const cacheKey = getCacheKey(...args);
    const cachedEntry = cache.current[cacheKey];
    
    // Don't prefetch if we have fresh data or a fetch is already in progress
    if (cachedEntry && !isCacheStale(cachedEntry)) {
      return;
    }
    
    if (cachedEntry?.fetchingPromise) {
      return; // Already fetching
    }
    
    
    // Create or update the fetching promise
    const fetchPromise = fetchFunction(...args)
      .then(data => {
        // Update cache with fresh data
        cache.current[cacheKey] = {
          data,
          timestamp: Date.now()
        };
        
        // Update global cache
        globalCache[namespace][cacheKey] = cache.current[cacheKey];
        
        // Enforce max entries
        enforceMaxEntries();
        
        return data;
      })
      .catch(error => {
        logger.error(`Error prefetching ${namespace} data:`, error);
        throw error;
      })
      .finally(() => {
        if (cachedEntry) {
          delete cachedEntry.fetchingPromise;
        }
      });
    
    // Store the promise reference
    if (cachedEntry) {
      cachedEntry.fetchingPromise = fetchPromise;
    } else {
      cache.current[cacheKey] = {
        data: {} as T,
        timestamp: 0,
        fetchingPromise: fetchPromise
      };
    }
  }, [
    namespace, 
    fetchFunction, 
    getCacheKey, 
    isCacheStale, 
    enforceMaxEntries
  ]);

  // Invalidate cache entries
  const invalidateCache = useCallback((...args: P | []): void => {
    if (args.length === 0) {
      // Invalidate entire namespace
      cache.current = {};
      globalCache[namespace] = {};
      cacheAccessTimes[namespace] = {};
    } else {
      // Invalidate specific key
      const cacheKey = getCacheKey(...args as P);
      delete cache.current[cacheKey];
      delete globalCache[namespace][cacheKey];
      delete cacheAccessTimes[namespace][cacheKey];
    }
  }, [namespace, getCacheKey]);

  // Clean up expired entries periodically
  useEffect(() => {
    const cleanup = () => {
      const now = Date.now();
      Object.keys(cache.current).forEach(key => {
        const entry = cache.current[key];
        if (isCacheExpired(entry)) {
          delete cache.current[key];
          delete globalCache[namespace][key];
          delete cacheAccessTimes[namespace][key];
        }
      });
    };
    
    const intervalId = setInterval(cleanup, 60000); // Clean up every minute
    
    return () => clearInterval(intervalId);
  }, [namespace, isCacheExpired]);

  return {
    getData,
    prefetch,
    invalidateCache,
    isLoading
  };
}

// App-wide preloading function to call on initial app load
export async function preloadAppData() {
  
  try {
    // Import data fetching functions dynamically to avoid circular dependencies
    const projectsModule = await import('./optimized-queries');
    const { fetchProjectsOptimized, fetchProjectsByMonthOptimized } = projectsModule;
    
    // Get current month for calendar preloading
    const currentMonth = new Date().getMonth();
    
    // Define the data modules to preload
    const preloadTasks = [
      { namespace: 'projects', fn: fetchProjectsOptimized, args: [] },
      { namespace: 'projectsByMonth', fn: fetchProjectsByMonthOptimized, args: [currentMonth] }
    ];
    
    // Execute all preload tasks in parallel
    const results = await Promise.all(
      preloadTasks.map(async task => {
        try {
          const startTime = performance.now();
          
          const data = await task.fn(...task.args);
          if (!globalCache[task.namespace]) {
            globalCache[task.namespace] = {};
            cacheAccessTimes[task.namespace] = {};
          }
          
          const cacheKey = task.args.map(arg => 
            typeof arg === 'object' 
              ? JSON.stringify(arg) 
              : String(arg)
          ).join('|') || 'default';
          
          // Store in global cache
          globalCache[task.namespace][cacheKey] = {
            data,
            timestamp: Date.now()
          };
          
          // Update access time
          cacheAccessTimes[task.namespace][cacheKey] = Date.now();
          
          const endTime = performance.now();
          
          // After preloading projects, queue up preloading of adjacent months
          if (task.namespace === 'projectsByMonth') {
            setTimeout(() => {
              // Preload next and previous months in background
              try {
                // Import directly to avoid circular dependencies
                import('./optimized-queries').then(({ fetchProjectsByMonthOptimized }) => {
                  // Previous month
                  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                  fetchProjectsByMonthOptimized(prevMonth).then(data => {
                    if (!globalCache['projectsByMonth']) {
                      globalCache['projectsByMonth'] = {};
                      cacheAccessTimes['projectsByMonth'] = {};
                    }
                    
                    const cacheKey = prevMonth.toString();
                    globalCache['projectsByMonth'][cacheKey] = {
                      data,
                      timestamp: Date.now()
                    };
                    cacheAccessTimes['projectsByMonth'][cacheKey] = Date.now();
                  });
                  
                  // Next month
                  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
                  fetchProjectsByMonthOptimized(nextMonth).then(data => {
                    if (!globalCache['projectsByMonth']) {
                      globalCache['projectsByMonth'] = {};
                      cacheAccessTimes['projectsByMonth'] = {};
                    }
                    
                    const cacheKey = nextMonth.toString();
                    globalCache['projectsByMonth'][cacheKey] = {
                      data,
                      timestamp: Date.now()
                    };
                    cacheAccessTimes['projectsByMonth'][cacheKey] = Date.now();
                  });
                });
              } catch (err) {
                logger.error('Error during background preloading:', err);
              }
            }, 2000); // Wait 2 seconds before trying to load adjacent months
          }
          
          return { namespace: task.namespace, success: true };
        } catch (error) {
          logger.error(`Failed to preload ${task.namespace} data:`, error);
          return { namespace: task.namespace, success: false, error };
        }
      })
    );
    
    // Initialize the view cache
    try {
      const { setActiveView } = await import('./view-cache');
      setActiveView('dashboard');
    } catch (error) {
      logger.error('Error initializing view cache:', error);
    }
    
    return results;
  } catch (error) {
    logger.error('Error in preloadAppData:', error);
    return [];
  }
}