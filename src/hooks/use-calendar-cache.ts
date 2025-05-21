import { useState, useCallback, useRef, useEffect } from 'react';
import { startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import type { Project } from '@/lib/types';
import { supabase } from '@/lib/supabase';

interface CacheEntry {
  data: Project[];
  timestamp: number;
  loading?: boolean;
}

interface Cache {
  [key: string]: CacheEntry;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const PREFETCH_MONTHS = 2; // Increased number of months to prefetch in each direction

// Global calendar cache store
const globalCalendarCache: Cache = {};
const pendingRequests: Record<string, Promise<Project[]>> = {};

// Initial loading state for the application
let initialLoadDone = false;

export function useCalendarCache() {
  const [isLoading, setIsLoading] = useState(!initialLoadDone);
  const [useDummyData] = useState(false);
  const cache = useRef<Cache>(globalCalendarCache);
  const prefetchController = useRef<AbortController | null>(null);

  const getCacheKey = (date: Date) => {
    return `${date.getFullYear()}-${date.getMonth() + 1}`;
  };

  const isCacheValid = (entry: CacheEntry) => {
    return Date.now() - entry.timestamp < CACHE_DURATION;
  };

  const fetchProjects = async (startDate: Date, endDate: Date) => {
    try {
      // Get projects for both current and next month
      const currentMonthStart = startOfMonth(startDate);
      const nextMonthEnd = endOfMonth(addMonths(startDate, 1));
      
      // Use startDate for current month, endDate for next month
      const startDateStr = currentMonthStart.toISOString();
      const endDateStr = nextMonthEnd.toISOString();

      // Implement server-side filtering with optimized query
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .is('deleted_at', null)
        .or(`start_date.gte.${startDateStr},end_date.gte.${startDateStr}`)
        .or(`start_date.lte.${endDateStr},end_date.lte.${endDateStr}`)
        .order('start_date', { ascending: true });
        
      // Database fetch complete

      if (error) {
        console.error('Error fetching projects from DB:', error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Apply event colors if not provided by database
      const eventColors = {
        'roving': '#FED7AA', // Light orange
        'roadshow': '#93C5FD', // Light blue
        'in-store': '#DDD6FE', // Light purple
        'ad-hoc': '#FEF08A', // Light yellow
        'corporate': '#BBF7D0', // Light green
        'wedding': '#FDA4AF', // Light pink
        'concert': '#A5B4FC', // Light indigo
        'conference': '#FDBA74', // Light orange
        'other': '#E2E8F0', // Light gray
        
        // Event types from your existing data
        'nestle': '#FCA5A5', // Light red for Nestle Choy Sun
        'ribena': '#DDD6FE', // Light purple for Ribena
        'mytown': '#FDA4AF', // Light pink for Mytown
        'warrior': '#93C5FD', // Light blue for Warrior
        'diy': '#FEF08A', // Light yellow for DIY/MrDIY
        'blackmores': '#E2E8F0', // Light gray for Blackmores
        'default': '#CBD5E1', // Default color
      };

      // Filter by date range and deduplicate by ID
      const monthStart = startOfMonth(startDate);
      const monthEnd = endOfMonth(endDate);
      
      // Create a map to ensure uniqueness by ID
      const uniqueProjects = new Map();
      
      data.forEach(project => {
        const projectStart = new Date(project.start_date);
        const projectEnd = project.end_date ? new Date(project.end_date) : projectStart;
        
        const inRange = (
          // Project starts within range
          (projectStart >= monthStart && projectStart <= monthEnd) ||
          // Project ends within range
          (projectEnd >= monthStart && projectEnd <= monthEnd) ||
          // Project spans the entire range
          (projectStart <= monthStart && projectEnd >= monthEnd)
        );
        
        if (inRange && !uniqueProjects.has(project.id)) {
          // Add color to the project
          const projectWithColor = {
            ...project,
            color: project.color || (project.event_type ? eventColors[project.event_type as keyof typeof eventColors] || eventColors.default : eventColors.default),
          };
          
          uniqueProjects.set(project.id, projectWithColor);
        }
      });
      
      const filteredProjects = Array.from(uniqueProjects.values());
      
      // Fetch related client and manager data in a batch
      const clientIds = filteredProjects.filter(p => p.client_id).map(p => p.client_id);
      const managerIds = filteredProjects.filter(p => p.manager_id).map(p => p.manager_id);

      // Only fetch if we have IDs to look up
      if (clientIds.length > 0) {
        try {
          const { data: clientsData } = await supabase
            .from('users')
            .select('*')
            .in('id', clientIds);
            
          if (clientsData && clientsData.length > 0) {
            // Create a map for quick lookup
            const clientMap = clientsData.reduce((map, client) => {
              map[client.id] = client;
              return map;
            }, {} as Record<string, any>);
            
            // Add client data to projects
            filteredProjects.forEach(project => {
              if (project.client_id && clientMap[project.client_id]) {
                project.client = clientMap[project.client_id];
              }
            });
          }
        } catch (error) {
          console.warn('Error fetching client data:', error);
        }
      }
      
      // Only fetch if we have IDs to look up
      if (managerIds.length > 0) {
        try {
          const { data: managersData } = await supabase
            .from('users')
            .select('*')
            .in('id', managerIds);
            
          if (managersData && managersData.length > 0) {
            // Create a map for quick lookup
            const managerMap = managersData.reduce((map, manager) => {
              map[manager.id] = manager;
              return map;
            }, {} as Record<string, any>);
            
            // Add manager data to projects
            filteredProjects.forEach(project => {
              if (project.manager_id && managerMap[project.manager_id]) {
                project.manager = managerMap[project.manager_id];
              }
            });
          }
        } catch (error) {
          console.warn('Error fetching manager data:', error);
        }
      }
      
      console.log(`Filtered to ${filteredProjects.length} unique projects in date range`);
      
      return filteredProjects;
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  };

  const prefetchAdjacentMonths = async (date: Date) => {
    // Cancel any existing prefetch
    if (prefetchController.current) {
      prefetchController.current.abort();
    }
    prefetchController.current = new AbortController();

    try {
      // Generate months to prefetch - more months for better experience
      const monthsToFetch = [];
      
      // Previous months
      for (let i = 1; i <= PREFETCH_MONTHS; i++) {
        monthsToFetch.push(subMonths(date, i));
      }
      
      // Next months
      for (let i = 1; i <= PREFETCH_MONTHS; i++) {
        monthsToFetch.push(addMonths(date, i));
      }

      await Promise.all(monthsToFetch.map(async (monthDate) => {
        const cacheKey = getCacheKey(monthDate);
        
        // Skip if cached or already being fetched
        if ((cache.current[cacheKey] && isCacheValid(cache.current[cacheKey])) || 
            pendingRequests[cacheKey]) {
          return;
        }

        console.log(`Prefetching month: ${cacheKey}`);
        
        // Mark as being fetched
        cache.current[cacheKey] = {
          data: [],
          timestamp: Date.now(),
          loading: true
        };
        
        // Create the request promise
        const requestPromise = (async () => {
          try {
            const monthStart = startOfMonth(monthDate);
            const monthEnd = endOfMonth(monthDate);
            const data = await fetchProjects(monthStart, monthEnd);
            
            // Ensure uniqueness of prefetched data
            const uniqueData = Array.from(
              data.reduce((map, project) => {
                if (!map.has(project.id)) {
                  map.set(project.id, project);
                }
                return map;
              }, new Map())
              .values()
            );

            // Update cache
            cache.current[cacheKey] = {
              data: uniqueData,
              timestamp: Date.now()
            };
            
            // Set global flag after initial load
            if (!initialLoadDone) {
              initialLoadDone = true;
            }
            
            return uniqueData;
          } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
              return [];
            }
            console.error(`Error prefetching calendar data for ${cacheKey}:`, error);
            delete cache.current[cacheKey]; // Remove failed entry
            return [];
          } finally {
            // Remove from pending requests
            delete pendingRequests[cacheKey];
          }
        })();
        
        // Store the promise
        pendingRequests[cacheKey] = requestPromise;
      }));
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error('Error in prefetch operation:', error);
    }
  };

  const getMonthData = useCallback(async (date: Date) => {
    const cacheKey = getCacheKey(date);
    
    // Check if we have valid cached data
    if (cache.current[cacheKey] && isCacheValid(cache.current[cacheKey]) && !cache.current[cacheKey].loading) {
      console.log(`CACHE HIT: ${cacheKey}`);
      return cache.current[cacheKey].data;
    }
    
    // Check if a request for this data is already in flight
    if (pendingRequests[cacheKey]) {
      console.log(`PENDING REQUEST: ${cacheKey}`);
      setIsLoading(true);
      try {
        return await pendingRequests[cacheKey];
      } finally {
        setIsLoading(false);
      }
    }
    
    console.log(`CACHE MISS: ${cacheKey}`);
    setIsLoading(true);
    
    // Create the promise for this request
    const requestPromise = (async () => {
      try {
        // Mark this key as being loaded in the cache
        cache.current[cacheKey] = {
          data: [],
          timestamp: Date.now(),
          loading: true
        };
        
        // Fetch data for the requested month
        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(date);
        const projects = await fetchProjects(monthStart, monthEnd);
        
        // Create a fresh project array with only unique IDs
        const uniqueProjects = Array.from(
          projects.reduce((map, project) => {
            if (!map.has(project.id)) {
              map.set(project.id, project);
            }
            return map;
          }, new Map())
          .values()
        );
        
        // Cache the unique results
        cache.current[cacheKey] = {
          data: uniqueProjects,
          timestamp: Date.now()
        };
        
        // Set global flag after initial load
        if (!initialLoadDone) {
          initialLoadDone = true;
        }
        
        // Start prefetching adjacent months
        prefetchAdjacentMonths(date);
        
        return uniqueProjects;
      } catch (error) {
        console.error('Error in getMonthData:', error);
        delete cache.current[cacheKey]; // Remove failed entry
        throw error;
      } finally {
        setIsLoading(false);
        // Remove from pending requests
        delete pendingRequests[cacheKey];
      }
    })();
    
    // Store the promise
    pendingRequests[cacheKey] = requestPromise;
    
    return requestPromise;
  }, []);

  const invalidateCache = useCallback((date?: Date) => {
    if (date) {
      const cacheKey = getCacheKey(date);
      delete cache.current[cacheKey];
      delete pendingRequests[cacheKey];
    } else {
      Object.keys(cache.current).forEach(key => {
        delete cache.current[key];
        delete pendingRequests[key];
      });
    }
  }, []);

  // Setup initial prefetch for current and adjacent months on first mount
  useEffect(() => {
    if (!initialLoadDone) {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      // Prefetch current month and adjacent months
      const monthsToLoad = [
        new Date(currentYear, currentMonth, 1), // Current month
        new Date(currentYear, currentMonth + 1, 1), // Next month
        new Date(currentYear, currentMonth - 1, 1), // Previous month
      ];
      
      Promise.all(
        monthsToLoad.map(date => {
          const cacheKey = getCacheKey(date);
          
          // Skip if already cached or being fetched
          if ((cache.current[cacheKey] && isCacheValid(cache.current[cacheKey])) || 
              pendingRequests[cacheKey]) {
            return Promise.resolve([]);
          }
          
          return getMonthData(date);
        })
      )
      .then(() => {
        initialLoadDone = true;
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error during initial calendar prefetch:', error);
        initialLoadDone = true; // Mark as done anyway to avoid blocking UI
        setIsLoading(false);
      });
    }
  }, [getMonthData]);

  return {
    getMonthData,
    invalidateCache,
    isLoading,
    useDummyData,
    prefetchAdjacentMonths
  };
}