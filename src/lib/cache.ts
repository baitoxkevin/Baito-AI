import { useRef, useCallback, useState, useEffect } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface Cache<T> {
  [key: string]: CacheEntry<T>;
}

const DEFAULT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Global cache store for sharing between hooks
const globalCache: Record<string, any> = {};

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
    
    // Create the promise for this request
    const requestPromise = (async () => {
      try {
        // Fetch fresh data
        const data = await fetchFunction(...args);
        
        // Update both local ref and global cache
        cache.current[cacheKey] = {
          data,
          timestamp: Date.now()
        };
        
        // Update global cache
        globalCache[namespace][cacheKey] = cache.current[cacheKey];
        
        return data;
      } catch (error) {
        console.error(`Error fetching ${namespace} data:`, error);
        throw error;
      } finally {
        setIsLoading(false);
        // Remove from pending requests
        delete pendingRequests.current[cacheKey];
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
    
    // Create the promise for this request
    const requestPromise = (async () => {
      try {
        const data = await fetchFunction(...args);
        
        cache.current[cacheKey] = {
          data,
          timestamp: Date.now()
        };
        globalCache[namespace][cacheKey] = cache.current[cacheKey];
        
        return data;
      } catch (error) {
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