import { useRef, useCallback, useState, useEffect } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface Cache<T> {
  [key: string]: CacheEntry<T>;
}

const DEFAULT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache version - increment this when making breaking changes to cache structure
const CACHE_VERSION = '2.0.0'; // Increment to force clear on next load

// Global cache store for sharing between hooks
const globalCache: Record<string, any> = {};

// Helper function to clear all caches
function clearAllCaches() {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('cache_') || key.includes('zoom') || key.includes('scroll'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
  localStorage.setItem('cache_version', CACHE_VERSION);

  // Clear in-memory cache
  Object.keys(globalCache).forEach(key => delete globalCache[key]);
  console.log('[CACHE] All caches cleared');
}

// Session-aware cache initialization
if (typeof window !== 'undefined') {
  try {
    const storedVersion = localStorage.getItem('cache_version');
    const lastSessionId = localStorage.getItem('last_session_id');

    // Clear cache if version mismatch
    if (storedVersion !== CACHE_VERSION) {
      console.log(`[CACHE] Version mismatch (${storedVersion} -> ${CACHE_VERSION}), clearing all caches`);
      clearAllCaches();
    }

    // Monitor auth state changes and clear cache on logout
    import('./supabase').then(({ supabase }) => {
      supabase.auth.onAuthStateChange((event, session) => {
        const currentSessionId = session?.access_token;

        if (event === 'SIGNED_OUT' || (lastSessionId && lastSessionId !== currentSessionId)) {
          console.log('[CACHE] Auth state changed, clearing cache');
          clearAllCaches();
        }

        if (currentSessionId) {
          localStorage.setItem('last_session_id', currentSessionId);
        } else {
          localStorage.removeItem('last_session_id');
        }
      });
    });
  } catch (error) {
    console.warn('[CACHE] Error during cache initialization:', error);
  }
}

/**
 * Generic cache hook for API data
 * @param namespace The namespace for this data type (e.g. 'projects', 'users')
 * @param fetchFunction The function to call when data needs to be fetched
 * @param cacheDuration How long to keep data in cache (in ms)
 */
export function useCache<T, P extends any[]>(
  namespace: string,
  fetchFunction: (...args: P) => Promise<T>,
  cacheDuration: number = DEFAULT_CACHE_DURATION
) {
  // Initialize the namespace in global cache if it doesn't exist
  if (!globalCache[namespace]) {
    globalCache[namespace] = {};
  }

  const [isLoading, setIsLoading] = useState(false);
  const cache = useRef<Cache<T>>(globalCache[namespace]);
  const pendingRequests = useRef<Record<string, Promise<T>>>({});
  const activeTimeouts = useRef<NodeJS.Timeout[]>([]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Clear all pending timeouts
      activeTimeouts.current.forEach(timeout => clearTimeout(timeout));
      activeTimeouts.current = [];

      // Clear pending requests for this hook instance
      // Note: We don't clear the cache itself as it's global
      pendingRequests.current = {};

      // Force loading state to false on unmount
      setIsLoading(false);
    };
  }, []);
  
  // Function to generate a cache key from function args
  const getCacheKey = useCallback((...args: P): string => {
    return args.map(arg => 
      typeof arg === 'object' 
        ? JSON.stringify(arg) 
        : String(arg)
    ).join('|');
  }, []);

  // Check if a cache entry is still valid
  const isCacheValid = useCallback((entry: CacheEntry<T>): boolean => {
    return Date.now() - entry.timestamp < cacheDuration;
  }, [cacheDuration]);

  // Get data with caching
  const getData = useCallback(async (...args: P): Promise<T> => {
    const cacheKey = getCacheKey(...args);

    // Check if we have valid cached data
    if (cache.current[cacheKey] && isCacheValid(cache.current[cacheKey])) {
      console.log(`CACHE HIT: ${namespace}/${cacheKey}`);
      return cache.current[cacheKey].data;
    }

    // Check if a request for this data is already in flight
    if (pendingRequests.current[cacheKey]) {
      console.log(`PENDING REQUEST: ${namespace}/${cacheKey}`);
      return pendingRequests.current[cacheKey];
    }

    console.log(`CACHE MISS: ${namespace}/${cacheKey}`);
    setIsLoading(true);

    // Safety timeout - auto-clear loading state after 30 seconds
    const loadingTimeout = setTimeout(() => {
      console.warn(`[CACHE] Loading timeout for ${namespace}/${cacheKey} - forcing isLoading=false`);
      setIsLoading(false);
      delete pendingRequests.current[cacheKey];
    }, 30000);

    // Track timeout for cleanup
    activeTimeouts.current.push(loadingTimeout);
    
    // Create the promise for this request
    const requestPromise = (async () => {
      const requestStart = Date.now();
      console.log(`[CACHE] Starting request for ${namespace}/${cacheKey}`);

      try {
        // Fetch fresh data
        const data = await fetchFunction(...args);

        const duration = Date.now() - requestStart;
        console.log(`[CACHE] Request completed for ${namespace}/${cacheKey} in ${duration}ms`);

        // Clear the timeout since request completed
        clearTimeout(loadingTimeout);

        // Update both local ref and global cache
        cache.current[cacheKey] = {
          data,
          timestamp: Date.now()
        };

        // Update global cache
        globalCache[namespace][cacheKey] = cache.current[cacheKey];

        return data;
      } catch (error) {
        const duration = Date.now() - requestStart;
        console.error(`[CACHE] Request failed for ${namespace}/${cacheKey} after ${duration}ms:`, error);

        // Clear the timeout on error too
        clearTimeout(loadingTimeout);
        throw error;
      } finally {
        setIsLoading(false);
        // Remove from pending requests
        delete pendingRequests.current[cacheKey];
        console.log(`[CACHE] Cleaned up request for ${namespace}/${cacheKey}`);
      }
    })();
    
    // Store the promise
    pendingRequests.current[cacheKey] = requestPromise;
    
    return requestPromise;
  }, [namespace, fetchFunction, getCacheKey, isCacheValid]);

  // Prefetch data without waiting for result
  const prefetch = useCallback((...args: P): void => {
    const cacheKey = getCacheKey(...args);

    // Don't prefetch if we already have valid data
    if (cache.current[cacheKey] && isCacheValid(cache.current[cacheKey])) {
      return;
    }

    // Don't prefetch if a request is already in flight
    if (pendingRequests.current[cacheKey]) {
      return;
    }

    console.log(`PREFETCHING: ${namespace}/${cacheKey}`);

    // Safety timeout for prefetch too
    const prefetchTimeout = setTimeout(() => {
      console.warn(`[CACHE] Prefetch timeout for ${namespace}/${cacheKey}`);
      delete pendingRequests.current[cacheKey];
    }, 30000);

    // Track timeout for cleanup
    activeTimeouts.current.push(prefetchTimeout);

    // Create the promise for this request
    const requestPromise = (async () => {
      try {
        const data = await fetchFunction(...args);

        clearTimeout(prefetchTimeout);

        cache.current[cacheKey] = {
          data,
          timestamp: Date.now()
        };
        globalCache[namespace][cacheKey] = cache.current[cacheKey];

        return data;
      } catch (error) {
        clearTimeout(prefetchTimeout);
        console.error(`Error prefetching ${namespace} data:`, error);
        throw error;
      } finally {
        // Remove from pending requests
        delete pendingRequests.current[cacheKey];
      }
    })();

    // Store the promise
    pendingRequests.current[cacheKey] = requestPromise;
  }, [namespace, fetchFunction, getCacheKey, isCacheValid]);

  // Invalidate cache entries
  const invalidateCache = useCallback((...args: P | []): void => {
    if (args.length === 0) {
      // Invalidate entire namespace
      cache.current = {};
      globalCache[namespace] = {};
    } else {
      // Invalidate specific key
      const cacheKey = getCacheKey(...args as P);
      delete cache.current[cacheKey];
      delete globalCache[namespace][cacheKey];
    }
  }, [namespace, getCacheKey]);

  return {
    getData,
    prefetch,
    invalidateCache,
    isLoading
  };
}

// App-wide preloading function to call on initial app load
export async function preloadAppData() {
  console.log('Preloading application data...');
  
  // Import data fetching functions dynamically to avoid circular dependencies
  const projectsModule = await import('./projects');
  const { fetchProjects, fetchProjectsByMonth } = projectsModule;
  
  // Define the data modules to preload
  const preloadTasks = [
    { namespace: 'projects', fn: fetchProjects, args: [] },
    // Preload current month and next month for calendar
    { namespace: 'projectsByMonth', fn: fetchProjectsByMonth, args: [new Date().getFullYear(), new Date().getMonth()] },
    { namespace: 'projectsByMonth', fn: fetchProjectsByMonth, args: [new Date().getFullYear(), (new Date().getMonth() + 1) % 12] }
  ];
  
  // Execute all preload tasks in parallel
  return Promise.all(
    preloadTasks.map(async task => {
      try {
        const data = await task.fn(...task.args);
        if (!globalCache[task.namespace]) {
          globalCache[task.namespace] = {};
        }
        
        const cacheKey = task.args.map(arg => 
          typeof arg === 'object' 
            ? JSON.stringify(arg) 
            : String(arg)
        ).join('|');
        
        // Store in global cache
        globalCache[task.namespace][cacheKey || 'default'] = {
          data,
          timestamp: Date.now()
        };
        
        console.log(`Preloaded ${task.namespace} data: ${cacheKey}`);
        return { namespace: task.namespace, success: true };
      } catch (error) {
        console.error(`Failed to preload ${task.namespace} data:`, error);
        return { namespace: task.namespace, success: false, error };
      }
    })
  );
}