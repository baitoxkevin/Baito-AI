import { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense, memo } from 'react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Calendar as CalendarIcon,
  ListIcon,
  PlusIcon,
  Bell,
  Clock,
  Trash2,
  CheckSquare,
  X,
  MapPin,
  Users
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { useProjectsByMonth, useProjects } from '@/hooks/use-projects';
import { CalendarSkeleton } from '@/components/calendar-skeleton';
// EditProjectDialog removed
import NewProjectDialog from '@/components/NewProjectDialog';
// Lazy load components for better performance
const CalendarView = lazy(() => import('@/components/CalendarView'));
import { formatTimeString, eventColors } from '@/lib/utils';
import { deleteProject } from '@/lib/projects';
const ListView = lazy(() => import('@/components/ListView'));
import type { Project } from '@/lib/types';

// Simple emergency fix version
export default function CalendarPage() {
  // Performance tracking refs
  const loadingRef = useRef(false);
  const mountedRef = useRef(false);
  const renderCount = useRef(0);
  const lastLoadTime = useRef<number>(0);
  const navigationDebounceRef = useRef<NodeJS.Timeout>();
  const monthCacheRef = useRef<Map<string, Project[]>>(new Map());
  
  // Track render count for performance monitoring
  renderCount.current++;
  if (renderCount.current % 10 === 0) {
    console.log(`[Performance] CalendarPage render #${renderCount.current}`);
  }
  
  // Always use today's date as the initial date
  const getInitialDate = useCallback(() => {
    return new Date(); // Always return today's date
  }, []);

  // Component state
  const [date, setDate] = useState<Date>(getInitialDate());
  const [projects, setProjects] = useState<Project[]>([]);
  const [extendedProjects, setExtendedProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMonthsCount, setViewMonthsCount] = useState(3); // Default to showing 3 months
  const [loadedMonthsRange, setLoadedMonthsRange] = useState<{start: number, end: number}>({
    start: -1, // 1 month before current
    end: 1    // 1 month after current
  });
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  // editDialogOpen removed
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [dayPreviewProjects, setDayPreviewProjects] = useState<Project[]>([]);
  const [dayPreviewDate, setDayPreviewDate] = useState<Date | null>(null);
  const [dayPreviewOpen, setDayPreviewOpen] = useState(false);
  // Get navigation and location hooks
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine initial view from URL path or default to 'list'
  const getInitialView = () => {
    const path = location.pathname;
    console.log('CalendarPage - Current path:', path);
    if (path === '/calendar/list') return 'list';
    if (path === '/calendar/view') return 'calendar';
    // Also check for case without leading slash
    if (path === 'calendar/view') return 'calendar';
    return 'list'; // Default view
  };
  
  const [view, setView] = useState<'calendar' | 'list'>(getInitialView());
  const [selectionMode, setSelectionMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Get services
  const { getProjectsByMonth, invalidateCache, prefetchAdjacentMonths } = useProjectsByMonth();
  const { 
    selectedProjects, 
    toggleProjectSelection, 
    selectAllProjects,
    clearProjectSelections,
    removeMultipleProjects 
  } = useProjects();
  const { toast } = useToast();

  // Load projects with proper loading state - improved version for seamless loading
  const loadProjects = useCallback(async (showLoadingState = true) => {
    // Prevent concurrent loads and implement rate limiting
    if (loadingRef.current) {
      console.log("[Performance] Already loading, skipping");
      return;
    }
    
    // Rate limiting: max 1 request per 300ms
    const now = Date.now();
    if (now - lastLoadTime.current < 300) {
      console.log('[Performance] Rate limiting active');
      return;
    }
    lastLoadTime.current = now;
    
    // Set loading flags - but only show loading state for calendar view
    // This way ListView will keep showing current content during loading
    loadingRef.current = true;
    if (showLoadingState && (view === 'calendar' || projects.length === 0)) {
      setIsLoading(true);
    }
    
    try {
      // Check cache first
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      if (!showLoadingState && monthCacheRef.current.has(monthKey)) {
        const cachedData = monthCacheRef.current.get(monthKey)!;
        console.log(`[Performance] Using cached data for ${monthKey}`);
        setProjects(cachedData);
        setExtendedProjects(cachedData);
        return true;
      }
      
      // Get month and year
      const currentMonth = date.getMonth();
      const currentYear = date.getFullYear();
      
      console.log(`[Performance] Loading projects for ${currentMonth}/${currentYear}`);
      
      // Load current month data
      const currentMonthData = await getProjectsByMonth(currentMonth, currentYear);
      
      // Cache the data
      monthCacheRef.current.set(monthKey, currentMonthData);
      // Limit cache size
      if (monthCacheRef.current.size > 12) {
        const firstKey = monthCacheRef.current.keys().next().value;
        monthCacheRef.current.delete(firstKey);
      }
      console.log(`Loaded ${currentMonthData.length} projects for current month`);
      
      // Update projects state ONLY if we got data and component is still mounted
      if (mountedRef.current) {
        // Update projects state
        setProjects(currentMonthData);
        
        // For list view: update the extended projects 
        // For initial load (empty projects) - just set the data
        // For subsequent loads - merge with existing data to avoid flicker
        if (view === 'list') {
          if (extendedProjects.length === 0) {
            // First load - just set the data directly
            console.log(`Initial list view load with ${currentMonthData.length} projects`);
            setExtendedProjects(currentMonthData);
          } else {
            // Subsequent loads - merge with existing data
            console.log(`Merging ${currentMonthData.length} projects with ${extendedProjects.length} existing projects`);
            setExtendedProjects(prev => {
              // Create a map of existing projects by ID
              const existingMap = new Map(prev.map(p => [p.id, p]));
              
              // Add or update with new projects
              currentMonthData.forEach(project => {
                existingMap.set(project.id, project);
              });
              
              // Convert back to array
              return Array.from(existingMap.values());
            });
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error loading projects:', error);
      if (mountedRef.current) {
        toast({
          title: 'Error loading projects',
          description: 'Failed to load projects. Please try again.',
          variant: 'destructive',
        });
      }
      return false;
    } finally {
      // Always reset loading flags
      loadingRef.current = false;
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [date, getProjectsByMonth, toast, view, projects.length, extendedProjects.length]);

  // Load data on initial mount and when date changes
  const initialLoadRef = useRef(false);
  
  // Make sure component is mounted flag is set
  useEffect(() => {
    // Set the mounted flag for the component
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  // Effect to sync URL with the current view
  useEffect(() => {
    const path = location.pathname;
    
    // If we're at the base /calendar route, redirect to the list view
    if (path === '/calendar') {
      navigate('/calendar/list', { replace: true });
    }
    
    // Keep view state in sync with URL
    if (path === '/calendar/list' && view !== 'list') {
      setView('list');
    } else if (path === '/calendar/view' && view !== 'calendar') {
      setView('calendar');
    }
  }, [location.pathname, navigate, view]);
  
  useEffect(() => {
    console.log("CalendarPage mounted");
    mountedRef.current = true;
    
    // Initial load on mount - make it aggressive like the refresh button
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      console.log("Initial projects load - forcing aggressive load with expanded date range");
      
      // Force today's date to ensure we're showing the current month
      const today = new Date();
      setDate(today);
      
      // Reset all loading flags
      loadingRef.current = false;
      adjacentMonthsLoaded.current = false;
      
      // Force cache invalidation to get fresh data
      invalidateCache();
      
      // Always show loading state for initial load
      setIsLoading(true);
      
      // Start with just current month for instant load
      // List view will load more as needed when scrolling
      const initialMonthsRange = { start: 0, end: 0 }; // Just current month initially
      setLoadedMonthsRange(initialMonthsRange);
      setViewMonthsCount(1); // Just current month for instant display
      
      // Track the earliest month with projects for auto-scrolling
      let earliestMonthWithProjects = null;
      let latestMonthWithProjects = null;
      
      // Delay loading slightly to ensure state updates
      setTimeout(() => {
        // Special handling for initial load - load only nearby months for faster initial render
        if (view === 'list') {
          // For list view, load just current month for instant display
          // ListView will handle loading more months as user scrolls
          getProjectsByMonth(date.getMonth(), date.getFullYear()).then(currentMonthProjects => {
            // Just load current month initially
            const results = [currentMonthProjects];
            // Combine all projects, removing duplicates
            const allProjects = [];
            const projectIds = new Set();
            
            // For single month load, just add all projects
            if (currentMonthProjects.length > 0) {
              earliestMonthWithProjects = 0;
              latestMonthWithProjects = 0;
              
              currentMonthProjects.forEach(project => {
                if (!projectIds.has(project.id)) {
                  projectIds.add(project.id);
                  allProjects.push(project);
                }
              });
            }
            
            console.log(`Loaded ${allProjects.length} projects from ${results.length} months`);
            console.log(`Earliest month with projects: ${earliestMonthWithProjects}, Latest: ${latestMonthWithProjects}`);
            
            // Update projects with current month only (for calendar view)
            setProjects(results[0] || []);
            
            // Update extended projects with all the results (for list view)
            setExtendedProjects(allProjects);
            
            // IMPORTANT: Check if current month has no projects but other months do have projects
            if (results[0].length === 0 && allProjects.length > 0) {
              console.log("Current month has no projects, but other months do - adjusting view");
              
              // Determine which month to target (prefer most recent past month with projects)
              const targetMonthOffset = earliestMonthWithProjects !== null ? earliestMonthWithProjects : 0;
              
              // Store target month for auto-scrolling after render
              // Store it as a custom data attribute that ListView can check
              window.sessionStorage.setItem('calendarAutoScrollTarget', 
                JSON.stringify({
                  targetMonth: targetMonthOffset,
                  hasProjects: allProjects.length > 0,
                  // Add a timestamp to prevent stale data
                  timestamp: Date.now()
                })
              );
              console.log(`Set auto-scroll target to month offset: ${targetMonthOffset}`);
            }
            
            // Finish loading
            setIsLoading(false);
          }).catch(error => {
            console.error("Error in initial multi-month load:", error);
            setIsLoading(false);
            loadProjects(true); // Fallback to regular loading
          });
        } else {
          // For calendar view, just load the current month
          loadProjects(true);
        }
      }, 100);
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, [date, view, getProjectsByMonth, invalidateCache, loadProjects]); // Include dependencies but it only runs once due to initialLoadRef check
  
  // We need to track date changes without creating an infinite loop
  const previousDateRef = useRef(date);
  
  // Only load projects when the actual date month/year changes (not on other rerenders)
  useEffect(() => {
    // Skip on first render and prevent excessive reloads
    if (initialLoadRef.current && previousDateRef.current) {
      const prevMonth = previousDateRef.current.getMonth();
      const prevYear = previousDateRef.current.getFullYear();
      const currentMonth = date.getMonth();
      const currentYear = date.getFullYear();
      
      // Only reload if month or year actually changed
      if (prevMonth !== currentMonth || prevYear !== currentYear) {
        console.log(`Date changed from ${format(previousDateRef.current, 'MMM yyyy')} to ${format(date, 'MMM yyyy')}`);
        loadProjects(true);
      }
    }
    
    // Update previous date reference
    previousDateRef.current = date;
  }, [date]); // Deliberately omitting loadProjects to prevent infinite loop
  
  // Track extended projects initialization
  const projectsInitialized = useRef(false);
  
  useEffect(() => {
    // Initialize or update extendedProjects whenever projects change
    // Note: We still update even if projects is empty to ensure proper initialization
    console.log(`Updating extendedProjects with ${projects.length} current projects`);
    
    if (!projectsInitialized.current) {
      // First initialization - always run this regardless of project count
      projectsInitialized.current = true;
      
      // Initialize with current projects (even if empty)
      setExtendedProjects(projects);
      
      // Keep the initial smaller range - ListView will load more as needed
      // This avoids overriding our optimization from the initial load
      if (view === 'list' && loadedMonthsRange.start === -2 && loadedMonthsRange.end === 2) {
        // Keep the optimized initial range
        console.log("Keeping optimized initial month range for list view");
      } else if (view === 'calendar') {
        // For calendar view, use smaller range
        setLoadedMonthsRange({ start: -3, end: 3 }); // Increased to ±3 months
      }
      
      console.log("Initial extendedProjects setup complete");
    } else if (projects.length > 0) {
      // For subsequent updates, only merge when we have actual projects
      // Merge new projects with existing ones to preserve extended data
      setExtendedProjects(prev => {
        // Create a map of existing projects by ID
        const existingMap = new Map(prev.map(p => [p.id, p]));
        
        // Add or update with new projects
        projects.forEach(project => {
          existingMap.set(project.id, project);
        });
        
        // Convert back to array
        return Array.from(existingMap.values());
      });
    }
  }, [projects, view]);

  // Debounced navigation to prevent rapid clicks
  const handlePrevMonth = useCallback(() => {
    // Clear existing debounce
    if (navigationDebounceRef.current) {
      clearTimeout(navigationDebounceRef.current);
    }
    
    navigationDebounceRef.current = setTimeout(() => {
      console.log("[Performance] Previous month navigation");
      
      const newDate = subMonths(date, 1);
      setDate(newDate);
      
      // Use cached data when possible
      loadProjects(true);
    }, 150); // 150ms debounce
  }, [date, loadProjects]);
  
  // Keep old complex loading for reference but skip it
  const handlePrevMonthOld = useCallback(() => {
    const newDate = subMonths(date, 1);
    setDate(newDate);
    
    // Track the earliest month with projects for auto-scrolling
    let earliestMonthWithProjects = null;
    let latestMonthWithProjects = null;
    
    // For list view, set a wider months range to show more context
    if (view === 'list') {
      // Current month + 12 past + 12 future (total 25 months view)
      setLoadedMonthsRange({ start: -12, end: 12 });
      setViewMonthsCount(25);
    } else {
      // Reset months range for calendar view
      setLoadedMonthsRange({ start: -3, end: 3 }); // Increased to ±3 months
    }
    
    // Delay loading slightly to ensure state updates
    setTimeout(() => {
      // For list view, load multiple months in parallel
      if (view === 'list') {
        // Use the new date for calculations
        const newMonth = newDate.getMonth();
        const newYear = newDate.getFullYear();
        
        // Load multiple months in parallel (for list view) with expanded range
        Promise.all([
          // Load the new month
          getProjectsByMonth(newMonth, newYear),
          // Load previous months (increased to 12 months in the past)
          getProjectsByMonth(newMonth - 1, newYear),
          getProjectsByMonth(newMonth - 2, newYear),
          getProjectsByMonth(newMonth - 3, newYear),
          getProjectsByMonth(newMonth - 4, newYear),
          getProjectsByMonth(newMonth - 5, newYear),
          getProjectsByMonth(newMonth - 6, newYear),
          getProjectsByMonth(newMonth - 7, newYear),
          getProjectsByMonth(newMonth - 8, newYear),
          getProjectsByMonth(newMonth - 9, newYear),
          getProjectsByMonth(newMonth - 10, newYear),
          getProjectsByMonth(newMonth - 11, newYear),
          getProjectsByMonth(newMonth - 12, newYear),
          // Load future months (expanded to ±12 months)
          getProjectsByMonth(newMonth + 1, newYear),
          getProjectsByMonth(newMonth + 2, newYear),
          getProjectsByMonth(newMonth + 3, newYear),
          getProjectsByMonth(newMonth + 4, newYear),
          getProjectsByMonth(newMonth + 5, newYear),
          getProjectsByMonth(newMonth + 6, newYear),
          getProjectsByMonth(newMonth + 7, newYear),
          getProjectsByMonth(newMonth + 8, newYear),
          getProjectsByMonth(newMonth + 9, newYear),
          getProjectsByMonth(newMonth + 10, newYear),
          getProjectsByMonth(newMonth + 11, newYear),
          getProjectsByMonth(newMonth + 12, newYear)
        ]).then(results => {
          // Combine all projects, removing duplicates
          const allProjects = [];
          const projectIds = new Set();
          
          // Track the earliest and most recent month with projects
          results.forEach((monthProjects, index) => {
            if (monthProjects.length > 0) {
              // Calculate the month index relative to current month
              const monthOffset = index === 0 ? 0 : 
                                 index <= 13 ? -(index) : // Previous months indices 1-13
                                 (index - 13); // Future months indices 14-26
                                 
              // Track earliest month with projects (most negative offset)
              if (earliestMonthWithProjects === null || monthOffset < earliestMonthWithProjects) {
                earliestMonthWithProjects = monthOffset;
              }
              
              // Track latest month with projects (most positive offset)
              if (latestMonthWithProjects === null || monthOffset > latestMonthWithProjects) {
                latestMonthWithProjects = monthOffset;
              }
              
              // Add all projects from this month
              monthProjects.forEach(project => {
                if (!projectIds.has(project.id)) {
                  projectIds.add(project.id);
                  allProjects.push(project);
                }
              });
            }
          });
          
          console.log(`Prev month: Loaded ${allProjects.length} projects from ${results.length} months`);
          console.log(`Earliest month with projects: ${earliestMonthWithProjects}, Latest: ${latestMonthWithProjects}`);
          
          // Update projects with current month only (for calendar view)
          setProjects(results[0] || []);
          
          // Update extended projects with all the results (for list view)
          setExtendedProjects(allProjects);
          
          // IMPORTANT: Check if current month has no projects but other months do have projects
          if (results[0].length === 0 && allProjects.length > 0) {
            console.log("Current month has no projects, but other months do - adjusting view");
            
            // Determine which month to target (prefer most recent past month with projects)
            const targetMonthOffset = earliestMonthWithProjects !== null ? earliestMonthWithProjects : 0;
            
            // Store target month for auto-scrolling after render
            window.sessionStorage.setItem('calendarAutoScrollTarget', 
              JSON.stringify({
                targetMonth: targetMonthOffset,
                hasProjects: allProjects.length > 0,
                // Add a timestamp to prevent stale data
                timestamp: Date.now()
              })
            );
            console.log(`Set auto-scroll target to month offset: ${targetMonthOffset}`);
          }
          
          // Finish loading
          setIsLoading(false);
        }).catch(error => {
          console.error("Error in prev month multi-month load:", error);
          setIsLoading(false);
          loadProjects(true); // Fallback to regular loading
        });
      } else {
        // For calendar view, just load the new month
        loadProjects(true);
      }
    }, 100);
  }, [date, loadProjects, view, invalidateCache, getProjectsByMonth]);
  
  const handleNextMonth = useCallback(() => {
    console.log("Next month navigation with enhanced loading");
    
    // Reset loading flags to force a clean load
    loadingRef.current = false;
    adjacentMonthsLoaded.current = false;
    
    // Force cache invalidation to get fresh data
    invalidateCache();
    
    // Show loading state for user feedback
    setIsLoading(true);
    
    // First update date to trigger view change
    const newDate = addMonths(date, 1);
    setDate(newDate);
    
    // Track the earliest month with projects for auto-scrolling
    let earliestMonthWithProjects = null;
    let latestMonthWithProjects = null;
    
    // For list view, set a wider months range to show more context
    if (view === 'list') {
      // Current month + 12 past + 12 future (total 25 months view)
      setLoadedMonthsRange({ start: -12, end: 12 });
      setViewMonthsCount(25);
    } else {
      // Reset months range for calendar view
      setLoadedMonthsRange({ start: -3, end: 3 }); // Increased to ±3 months
    }
    
    // Delay loading slightly to ensure state updates
    setTimeout(() => {
      // For list view, load multiple months in parallel
      if (view === 'list') {
        // Use the new date for calculations
        const newMonth = newDate.getMonth();
        const newYear = newDate.getFullYear();
        
        // Load multiple months in parallel (for list view) with expanded range
        Promise.all([
          // Load the new month
          getProjectsByMonth(newMonth, newYear),
          // Load previous months (increased to 12 months in the past)
          getProjectsByMonth(newMonth - 1, newYear),
          getProjectsByMonth(newMonth - 2, newYear),
          getProjectsByMonth(newMonth - 3, newYear),
          getProjectsByMonth(newMonth - 4, newYear),
          getProjectsByMonth(newMonth - 5, newYear),
          getProjectsByMonth(newMonth - 6, newYear),
          getProjectsByMonth(newMonth - 7, newYear),
          getProjectsByMonth(newMonth - 8, newYear),
          getProjectsByMonth(newMonth - 9, newYear),
          getProjectsByMonth(newMonth - 10, newYear),
          getProjectsByMonth(newMonth - 11, newYear),
          getProjectsByMonth(newMonth - 12, newYear),
          // Load future months (expanded to ±12 months)
          getProjectsByMonth(newMonth + 1, newYear),
          getProjectsByMonth(newMonth + 2, newYear),
          getProjectsByMonth(newMonth + 3, newYear),
          getProjectsByMonth(newMonth + 4, newYear),
          getProjectsByMonth(newMonth + 5, newYear),
          getProjectsByMonth(newMonth + 6, newYear),
          getProjectsByMonth(newMonth + 7, newYear),
          getProjectsByMonth(newMonth + 8, newYear),
          getProjectsByMonth(newMonth + 9, newYear),
          getProjectsByMonth(newMonth + 10, newYear),
          getProjectsByMonth(newMonth + 11, newYear),
          getProjectsByMonth(newMonth + 12, newYear)
        ]).then(results => {
          // Combine all projects, removing duplicates
          const allProjects = [];
          const projectIds = new Set();
          
          // Track the earliest and most recent month with projects
          results.forEach((monthProjects, index) => {
            if (monthProjects.length > 0) {
              // Calculate the month index relative to current month
              const monthOffset = index === 0 ? 0 : 
                                 index <= 13 ? -(index) : // Previous months indices 1-13
                                 (index - 13); // Future months indices 14-26
                                 
              // Track earliest month with projects (most negative offset)
              if (earliestMonthWithProjects === null || monthOffset < earliestMonthWithProjects) {
                earliestMonthWithProjects = monthOffset;
              }
              
              // Track latest month with projects (most positive offset)
              if (latestMonthWithProjects === null || monthOffset > latestMonthWithProjects) {
                latestMonthWithProjects = monthOffset;
              }
              
              // Add all projects from this month
              monthProjects.forEach(project => {
                if (!projectIds.has(project.id)) {
                  projectIds.add(project.id);
                  allProjects.push(project);
                }
              });
            }
          });
          
          console.log(`Next month: Loaded ${allProjects.length} projects from ${results.length} months`);
          console.log(`Earliest month with projects: ${earliestMonthWithProjects}, Latest: ${latestMonthWithProjects}`);
          
          // Update projects with current month only (for calendar view)
          setProjects(results[0] || []);
          
          // Update extended projects with all the results (for list view)
          setExtendedProjects(allProjects);
          
          // IMPORTANT: Check if current month has no projects but other months do have projects
          if (results[0].length === 0 && allProjects.length > 0) {
            console.log("Current month has no projects, but other months do - adjusting view");
            
            // Determine which month to target (prefer most recent past month with projects)
            const targetMonthOffset = earliestMonthWithProjects !== null ? earliestMonthWithProjects : 0;
            
            // Store target month for auto-scrolling after render
            window.sessionStorage.setItem('calendarAutoScrollTarget', 
              JSON.stringify({
                targetMonth: targetMonthOffset,
                hasProjects: allProjects.length > 0,
                // Add a timestamp to prevent stale data
                timestamp: Date.now()
              })
            );
            console.log(`Set auto-scroll target to month offset: ${targetMonthOffset}`);
          }
          
          // Finish loading
          setIsLoading(false);
        }).catch(error => {
          console.error("Error in next month multi-month load:", error);
          setIsLoading(false);
          loadProjects(true); // Fallback to regular loading
        });
      } else {
        // For calendar view, just load the new month
        loadProjects(true);
      }
    }, 100);
  }, [date, loadProjects, view, invalidateCache, getProjectsByMonth]);
  
  // Today button with enhanced multi-month loading
  const handleTodayClick = useCallback(() => {
    console.log("Today button clicked with enhanced loading");
    
    // Reset loading flags to force a clean load
    loadingRef.current = false;
    adjacentMonthsLoaded.current = false;
    
    // Force cache invalidation to get fresh data
    invalidateCache();
    
    // Show loading state for user feedback
    setIsLoading(true);
    
    // First update date to trigger view change
    const newDate = new Date();
    setDate(newDate);
    
    // Track the earliest month with projects for auto-scrolling
    let earliestMonthWithProjects = null;
    let latestMonthWithProjects = null;
    
    // For list view, set a wider months range to show more context
    if (view === 'list') {
      // Current month + 12 past + 12 future (total 25 months view)
      setLoadedMonthsRange({ start: -12, end: 12 });
      setViewMonthsCount(25);
    } else {
      // Reset months range for calendar view
      setLoadedMonthsRange({ start: -3, end: 3 }); // Increased to ±3 months
    }
    
    // Delay loading slightly to ensure state updates
    setTimeout(() => {
      // For list view, load multiple months in parallel
      if (view === 'list') {
        // Use the new date for calculations
        const newMonth = newDate.getMonth();
        const newYear = newDate.getFullYear();
        
        // Load multiple months in parallel (for list view) with expanded range
        Promise.all([
          // Load the new month
          getProjectsByMonth(newMonth, newYear),
          // Load previous months (increased to 12 months in the past)
          getProjectsByMonth(newMonth - 1, newYear),
          getProjectsByMonth(newMonth - 2, newYear),
          getProjectsByMonth(newMonth - 3, newYear),
          getProjectsByMonth(newMonth - 4, newYear),
          getProjectsByMonth(newMonth - 5, newYear),
          getProjectsByMonth(newMonth - 6, newYear),
          getProjectsByMonth(newMonth - 7, newYear),
          getProjectsByMonth(newMonth - 8, newYear),
          getProjectsByMonth(newMonth - 9, newYear),
          getProjectsByMonth(newMonth - 10, newYear),
          getProjectsByMonth(newMonth - 11, newYear),
          getProjectsByMonth(newMonth - 12, newYear),
          // Load future months (expanded to ±12 months)
          getProjectsByMonth(newMonth + 1, newYear),
          getProjectsByMonth(newMonth + 2, newYear),
          getProjectsByMonth(newMonth + 3, newYear),
          getProjectsByMonth(newMonth + 4, newYear),
          getProjectsByMonth(newMonth + 5, newYear),
          getProjectsByMonth(newMonth + 6, newYear),
          getProjectsByMonth(newMonth + 7, newYear),
          getProjectsByMonth(newMonth + 8, newYear),
          getProjectsByMonth(newMonth + 9, newYear),
          getProjectsByMonth(newMonth + 10, newYear),
          getProjectsByMonth(newMonth + 11, newYear),
          getProjectsByMonth(newMonth + 12, newYear)
        ]).then(results => {
          // Combine all projects, removing duplicates
          const allProjects = [];
          const projectIds = new Set();
          
          // Track the earliest and most recent month with projects
          results.forEach((monthProjects, index) => {
            if (monthProjects.length > 0) {
              // Calculate the month index relative to current month
              const monthOffset = index === 0 ? 0 : 
                                 index <= 13 ? -(index) : // Previous months indices 1-13
                                 (index - 13); // Future months indices 14-26
                                 
              // Track earliest month with projects (most negative offset)
              if (earliestMonthWithProjects === null || monthOffset < earliestMonthWithProjects) {
                earliestMonthWithProjects = monthOffset;
              }
              
              // Track latest month with projects (most positive offset)
              if (latestMonthWithProjects === null || monthOffset > latestMonthWithProjects) {
                latestMonthWithProjects = monthOffset;
              }
              
              // Add all projects from this month
              monthProjects.forEach(project => {
                if (!projectIds.has(project.id)) {
                  projectIds.add(project.id);
                  allProjects.push(project);
                }
              });
            }
          });
          
          console.log(`Today: Loaded ${allProjects.length} projects from ${results.length} months`);
          console.log(`Earliest month with projects: ${earliestMonthWithProjects}, Latest: ${latestMonthWithProjects}`);
          
          // Update projects with current month only (for calendar view)
          setProjects(results[0] || []);
          
          // Update extended projects with all the results (for list view)
          setExtendedProjects(allProjects);
          
          // IMPORTANT: Check if current month has no projects but other months do have projects
          if (results[0].length === 0 && allProjects.length > 0) {
            console.log("Current month has no projects, but other months do - adjusting view");
            
            // Determine which month to target (prefer most recent past month with projects)
            const targetMonthOffset = earliestMonthWithProjects !== null ? earliestMonthWithProjects : 0;
            
            // Store target month for auto-scrolling after render
            window.sessionStorage.setItem('calendarAutoScrollTarget', 
              JSON.stringify({
                targetMonth: targetMonthOffset,
                hasProjects: allProjects.length > 0,
                // Add a timestamp to prevent stale data
                timestamp: Date.now()
              })
            );
            console.log(`Set auto-scroll target to month offset: ${targetMonthOffset}`);
          }
          
          // Finish loading
          setIsLoading(false);
        }).catch(error => {
          console.error("Error in today multi-month load:", error);
          setIsLoading(false);
          loadProjects(true); // Fallback to regular loading
        });
      } else {
        // For calendar view, just load the new month
        loadProjects(true);
      }
    }, 100);
  }, [view, loadProjects, invalidateCache, getProjectsByMonth]);
  
  // Manual refresh button - enhanced for more comprehensive data loading
  const handleRefresh = useCallback(() => {
    console.log("Manual refresh requested - loading multiple months");
    
    // Reset loading flags to force a new load
    loadingRef.current = false;
    adjacentMonthsLoaded.current = false;
    
    // Force cache invalidation to get fresh data
    invalidateCache();
    
    // Always show loading state for refresh to provide feedback
    setIsLoading(true);
    
    // Track the earliest month with projects for auto-scrolling
    let earliestMonthWithProjects = null;
    let latestMonthWithProjects = null;
    
    // For list view, reset scrolledToToday flag to ensure proper positioning
    if (view === 'list') {
      // Set wider month range for full year view
      setLoadedMonthsRange({ start: -12, end: 12 });
      setViewMonthsCount(25); // Current month + 12 past + 12 future
    }
    
    // Delay loading slightly to ensure state updates
    setTimeout(() => {
      // Special handling for list view to load multiple months
      if (view === 'list') {
        // Load multiple months in parallel - expanded range to ensure we find months with projects
        Promise.all([
          // Load current month
          getProjectsByMonth(date.getMonth(), date.getFullYear()),
          // Load previous months (increased to 12 months in the past)
          getProjectsByMonth(date.getMonth() - 1, date.getFullYear()),
          getProjectsByMonth(date.getMonth() - 2, date.getFullYear()),
          getProjectsByMonth(date.getMonth() - 3, date.getFullYear()),
          getProjectsByMonth(date.getMonth() - 4, date.getFullYear()),
          getProjectsByMonth(date.getMonth() - 5, date.getFullYear()),
          getProjectsByMonth(date.getMonth() - 6, date.getFullYear()),
          getProjectsByMonth(date.getMonth() - 7, date.getFullYear()),
          getProjectsByMonth(date.getMonth() - 8, date.getFullYear()),
          getProjectsByMonth(date.getMonth() - 9, date.getFullYear()),
          getProjectsByMonth(date.getMonth() - 10, date.getFullYear()),
          getProjectsByMonth(date.getMonth() - 11, date.getFullYear()),
          getProjectsByMonth(date.getMonth() - 12, date.getFullYear()),
          // Load future months (expanded to ±12 months)
          getProjectsByMonth(date.getMonth() + 1, date.getFullYear()),
          getProjectsByMonth(date.getMonth() + 2, date.getFullYear()),
          getProjectsByMonth(date.getMonth() + 3, date.getFullYear()),
          getProjectsByMonth(date.getMonth() + 4, date.getFullYear()),
          getProjectsByMonth(date.getMonth() + 5, date.getFullYear()),
          getProjectsByMonth(date.getMonth() + 6, date.getFullYear()),
          getProjectsByMonth(date.getMonth() + 7, date.getFullYear()),
          getProjectsByMonth(date.getMonth() + 8, date.getFullYear()),
          getProjectsByMonth(date.getMonth() + 9, date.getFullYear()),
          getProjectsByMonth(date.getMonth() + 10, date.getFullYear()),
          getProjectsByMonth(date.getMonth() + 11, date.getFullYear()),
          getProjectsByMonth(date.getMonth() + 12, date.getFullYear())
        ]).then(results => {
          // Combine all projects, removing duplicates
          const allProjects = [];
          const projectIds = new Set();
          
          // Track the earliest and most recent month with projects
          results.forEach((monthProjects, index) => {
            if (monthProjects.length > 0) {
              // Calculate the month index relative to current month
              const monthOffset = index === 0 ? 0 : 
                                  index <= 7 ? -(index) : // Previous months indices 1-7
                                  (index - 7); // Future months indices 8-10
                                  
              // Track earliest month with projects (most negative offset)
              if (earliestMonthWithProjects === null || monthOffset < earliestMonthWithProjects) {
                earliestMonthWithProjects = monthOffset;
              }
              
              // Track latest month with projects (most positive offset)
              if (latestMonthWithProjects === null || monthOffset > latestMonthWithProjects) {
                latestMonthWithProjects = monthOffset;
              }
              
              // Add all projects from this month, avoiding duplicates
              monthProjects.forEach(project => {
                if (!projectIds.has(project.id)) {
                  projectIds.add(project.id);
                  allProjects.push(project);
                }
              });
            }
          });
          
          console.log(`Refresh loaded ${allProjects.length} projects from ${results.length} months`);
          console.log(`Earliest month with projects: ${earliestMonthWithProjects}, Latest: ${latestMonthWithProjects}`);
          
          // Update projects with current month only (for calendar view)
          setProjects(results[0] || []);
          
          // Update extended projects with all the results (for list view)
          setExtendedProjects(allProjects);
          
          // IMPORTANT: Check if current month has no projects but other months do have projects
          if (results[0].length === 0 && allProjects.length > 0) {
            console.log("Current month has no projects, but other months do - adjusting view");
            
            // Determine which month to target (prefer most recent past month with projects)
            const targetMonthOffset = earliestMonthWithProjects !== null ? earliestMonthWithProjects : 0;
            
            // Store target month for auto-scrolling after render
            window.sessionStorage.setItem('calendarAutoScrollTarget', 
              JSON.stringify({
                targetMonth: targetMonthOffset,
                hasProjects: allProjects.length > 0,
                // Add a timestamp to prevent stale data
                timestamp: Date.now()
              })
            );
            console.log(`Set auto-scroll target to month offset: ${targetMonthOffset}`);
          }
          
          // Finish loading
          setIsLoading(false);
        }).catch(error => {
          console.error("Error in refresh multi-month load:", error);
          setIsLoading(false);
          loadProjects(true); // Fallback to regular loading
        });
      } else {
        // For calendar view, just load current month
        loadProjects(true);
      }
    }, 100);
  }, [date, view, getProjectsByMonth, loadProjects, invalidateCache]);

  // React to date changes - omitting for now to fix infinite loop
  // We'll handle date changes directly in the navigation callbacks instead
  
  // We've merged this functionality with the previous useEffect

  // Project updates
  const handleProjectUpdate = useCallback(() => {
    console.log("Project updated, refreshing data");
    
    // Load projects with loading state
    loadProjects(true);
  }, [loadProjects]);
  
  // Delete project
  const handleProjectDelete = useCallback(async (project: Project) => {
    try {
      const storedUser = localStorage.getItem('test_user');
      if (!storedUser) {
        throw new Error('User not logged in');
      }
      
      const userId = JSON.parse(storedUser).user.id;
      await deleteProject(project.id, userId);
      
      toast({
        title: "Project deleted",
        description: `"${project.title}" has been deleted successfully`,
      });
      
      handleProjectUpdate();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast, handleProjectUpdate]);
  
  // Batch delete
  const handleBatchDelete = useCallback(async () => {
    if (selectedProjects.length === 0) return;
    
    try {
      const storedUser = localStorage.getItem('test_user');
      if (!storedUser) {
        throw new Error('User not logged in');
      }
      
      const userId = JSON.parse(storedUser).user.id;
      const result = await removeMultipleProjects(selectedProjects, userId);
      
      if (result.success.length > 0) {
        toast({
          title: "Projects deleted",
          description: `${result.success.length} project(s) have been deleted successfully`,
        });
        
        if (result.failed.length > 0) {
          toast({
            title: "Warning",
            description: `${result.failed.length} project(s) could not be deleted`,
            variant: "destructive",
          });
        }
        
        handleProjectUpdate();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete any projects. Please try again.",
          variant: "destructive",
        });
      }
      
      setSelectionMode(false);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error batch deleting projects:', error);
      toast({
        title: "Error",
        description: "Failed to delete projects. Please try again.",
        variant: "destructive",
      });
      setDeleteDialogOpen(false);
    }
  }, [selectedProjects, removeMultipleProjects, toast, handleProjectUpdate]);
  
  // Toggle selection mode
  const toggleSelectionMode = useCallback(() => {
    setSelectionMode(prev => {
      if (prev) {
        clearProjectSelections();
      }
      return !prev;
    });
  }, [clearProjectSelections]);

  // Load adjacent months only once after initial projects are loaded
  const adjacentMonthsLoaded = useRef(false);
  
  // Separate effect to load adjacent months that runs only once after projects are loaded
  useEffect(() => {
    const loadAdjacent = async () => {
      // Only run once when projects are loaded and we haven't loaded adjacent months yet
      if (projects.length > 0 && !adjacentMonthsLoaded.current && mountedRef.current) {
        adjacentMonthsLoaded.current = true;
        console.log("Loading adjacent months once");
        
        // We'll manually load these in handleLoadMoreMonths if needed for the scrollable list
      }
    };
    
    loadAdjacent();
  }, [projects.length]);

  // Function to load more months in the list view with reasonable limits
  const handleLoadMoreMonths = useCallback(async (direction: 'past' | 'future', monthsToAdd: number) => {
    console.log(`Loading more months: ${direction}, count: ${monthsToAdd}`);
    
    // Constants for reasonable date limits (matches ListView MAX constants)
    const MAX_PAST_MONTHS = 24;  // 2 years in the past to match ListView
    const MAX_FUTURE_MONTHS = 24; // 2 years in the future to match ListView
    
    // Calculate the new months range
    const newRange = { ...loadedMonthsRange };
    const currentYear = date.getFullYear();
    const currentMonth = date.getMonth();
    
    if (direction === 'past') {
      // Don't allow going too far into the past
      if (newRange.start <= -MAX_PAST_MONTHS) {
        console.log(`Already at maximum past limit (${MAX_PAST_MONTHS} months)`);
        return;
      }
      
      // Calculate how many months we can actually load
      const availableMonths = Math.min(monthsToAdd, MAX_PAST_MONTHS + newRange.start);
      if (availableMonths <= 0) return;
      
      // Update the range
      newRange.start -= availableMonths;
      
      // Load the data for the newly added months in parallel
      const loadPromises = [];
      for (let i = 1; i <= availableMonths; i++) {
        const monthToLoad = loadedMonthsRange.start - i;
        const targetDate = addMonths(date, monthToLoad);
        const targetMonth = targetDate.getMonth();
        const targetYear = targetDate.getFullYear();
        
        console.log(`Queuing past month: ${targetMonth}/${targetYear}`);
        loadPromises.push(getProjectsByMonth(targetMonth, targetYear));
      }
      
      try {
        // Load all months in parallel
        const results = await Promise.all(loadPromises);
        
        // Combine all results
        const allNewProjects = results.flat();
        
        // Add these projects to our extended list, avoiding duplicates
        if (allNewProjects.length > 0) {
          setExtendedProjects(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newProjects = allNewProjects.filter(p => !existingIds.has(p.id));
            return [...newProjects, ...prev];
          });
        }
      } catch (error) {
        console.error(`Error loading past months: ${error}`);
      }
    } else {
      // Don't allow going too far into the future
      if (newRange.end >= MAX_FUTURE_MONTHS) {
        console.log(`Already at maximum future limit (${MAX_FUTURE_MONTHS} months)`);
        return;
      }
      
      // Calculate how many months we can actually load
      const availableMonths = Math.min(monthsToAdd, MAX_FUTURE_MONTHS - newRange.end);
      if (availableMonths <= 0) return;
      
      // Update the range
      newRange.end += availableMonths;
      
      // Load the data for the newly added months in parallel
      const loadPromises = [];
      for (let i = 1; i <= availableMonths; i++) {
        const monthToLoad = loadedMonthsRange.end + i;
        const targetDate = addMonths(date, monthToLoad);
        const targetMonth = targetDate.getMonth();
        const targetYear = targetDate.getFullYear();
        
        // Don't load years beyond the reasonable limit
        if (targetYear > currentYear + 2) {
          console.log(`Skipping month ${targetMonth}/${targetYear} (beyond reasonable limit)`);
          continue;
        }
        
        console.log(`Queuing future month: ${targetMonth}/${targetYear}`);
        loadPromises.push(getProjectsByMonth(targetMonth, targetYear));
      }
      
      try {
        // Load all months in parallel
        const results = await Promise.all(loadPromises);
        
        // Combine all results
        const allNewProjects = results.flat();
        
        // Add these projects to our extended list, avoiding duplicates
        if (allNewProjects.length > 0) {
          setExtendedProjects(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newProjects = allNewProjects.filter(p => !existingIds.has(p.id));
            return [...prev, ...newProjects];
          });
        }
      } catch (error) {
        console.error(`Error loading future months: ${error}`);
      }
    }
    
    // Update the loaded months range
    setLoadedMonthsRange(newRange);
    
    // Update the view months count with a reasonable value
    // Keep it limited to avoid generating too many dates
    const MAX_MONTHS_TO_SHOW = 12; // Limit visible range to 1 year total
    
    // Calculate months needed with limit
    const monthsNeeded = Math.min(MAX_MONTHS_TO_SHOW, newRange.end - newRange.start + 1);
    
    // Only update if we need to show more than current view
    if (monthsNeeded > viewMonthsCount) {
      console.log(`Updating months to show: ${viewMonthsCount} -> ${monthsNeeded}`);
      setViewMonthsCount(monthsNeeded);
    }
  }, [loadedMonthsRange, date, getProjectsByMonth, viewMonthsCount]);

  // Project interactions
  const handleProjectClick = useCallback((project: Project) => {
    setSelectedProject(project);
    // EditProjectDialog removed - no edit action
  }, []);
  
  const handleDayClick = useCallback((date: Date, projects: Project[]) => {
    if (projects.length > 0) {
      if (projects.length === 1) {
        setSelectedProject(projects[0]);
        // EditProjectDialog removed - show preview instead
        setDayPreviewProjects(projects);
        setDayPreviewDate(date);
        setDayPreviewOpen(true);
      } else {
        setDayPreviewProjects(projects);
        setDayPreviewDate(date);
        setDayPreviewOpen(true);
      }
    } else {
      setSelectedDateRange({ start: date, end: date });
      setNewProjectDialogOpen(true);
    }
  }, []);

  const handleDateRangeSelect = useCallback((startDate: Date, endDate: Date) => {
    setSelectedDateRange({ start: startDate, end: endDate });
    setNewProjectDialogOpen(true);
  }, []);
  
  const handleShowDeleteDialog = useCallback(() => {
    if (selectedProjects.length > 0) {
      setDeleteDialogOpen(true);
    } else {
      toast({
        title: "No projects selected",
        description: "Please select at least one project to delete",
      });
    }
  }, [selectedProjects.length, toast]);

  // Filter projects for current month or extended view
  const filteredProjects = useMemo(() => {
    if (view === 'list') {
      // In list view, we'll force an update with the date we have
      console.log(`CalendarPage: Filtering extended projects for ListView (${format(date, 'MMMM yyyy')})`);
      
      // SIMPLIFIED LIST VIEW LOGIC - Be more permissive about what we show
      // Mix in both regular and extended projects for maximum visibility
      const allProjects = [];
      const projectIds = new Set();
      
      // First add extended projects if available
      if (extendedProjects && extendedProjects.length > 0) {
        console.log(`Adding ${extendedProjects.length} extended projects`);
        extendedProjects.forEach(project => {
          if (!projectIds.has(project.id)) {
            projectIds.add(project.id);
            allProjects.push(project);
          }
        });
      }
      
      // Then add regular projects as backup
      if (projects && projects.length > 0) {
        console.log(`Adding ${projects.length} regular projects`);
        projects.forEach(project => {
          if (!projectIds.has(project.id)) {
            projectIds.add(project.id);
            allProjects.push(project);
          }
        });
      }
      
      // Debug projects
      console.log(`Total projects to send to ListView: ${allProjects.length}`);
      if (allProjects.length > 0) {
        console.log('Sample projects:', 
          allProjects.slice(0, Math.min(3, allProjects.length)).map(p => ({
            id: p.id,
            title: p.title,
            start: p.start_date,
            end: p.end_date || p.start_date
          }))
        );
      }
      
      // Always return whatever projects we have, even if empty
      // The ListView component will handle further filtering based on its dates
      return allProjects;
    }
    
    // In calendar view, filter for just the current month
    if (!projects || projects.length === 0) {
      return [];
    }
    
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    
    // First filter out projects with invalid dates
    const validProjects = projects.filter(project => {
      try {
        if (!project.start_date) return false;
        
        const testDate = new Date(project.start_date);
        return testDate instanceof Date && !isNaN(testDate.getTime());
      } catch (e) {
        console.warn(`Project ${project.id} has invalid date format, skipping`);
        return false;
      }
    });
    
    const filtered = validProjects.filter(project => {
      try {
        const projectStart = new Date(project.start_date);
        const projectEnd = project.end_date ? new Date(project.end_date) : projectStart;
        
        // More explicit checks for debugging
        const projectStartsInMonth = projectStart >= monthStart && projectStart <= monthEnd;
        const projectEndsInMonth = projectEnd >= monthStart && projectEnd <= monthEnd;
        const projectSpansMonth = projectStart <= monthStart && projectEnd >= monthEnd;
        
        return projectStartsInMonth || projectEndsInMonth || projectSpansMonth;
      } catch (e) {
        console.error(`Error filtering project ${project.id}:`, e);
        return false;
      }
    });
    
    console.log(`CalendarPage: Filtered ${validProjects.length} valid projects to ${filtered.length} for current month`);
    return filtered;
  }, [projects, date, view, extendedProjects]);

  // Select all
  const toggleSelectAll = useCallback(() => {
    if (!filteredProjects || filteredProjects.length === 0) return;
    selectAllProjects(filteredProjects.map(p => p.id));
  }, [filteredProjects, selectAllProjects]);

  // Full skeleton for first load, overlay only for calendar view on subsequent loads
  if (isLoading && (projects.length === 0 || view === 'calendar')) {
    if (projects.length === 0) {
      // First load - full skeleton
      return (
        <div className="p-4 rounded-lg border bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2" />
              <h2 className="text-xl font-semibold">Loading Calendar</h2>
            </div>
          </div>
          <CalendarSkeleton />
        </div>
      );
    } else if (view === 'calendar') {
      // Loading overlay only for calendar view on month changes
      return (
        <div className="flex flex-1 w-full h-full overflow-hidden relative">
          {/* Regular UI underneath */}
          <div className="p-4 border rounded-lg bg-white flex flex-col gap-4 w-full h-full">
            <div className="flex flex-col gap-4 h-full flex-grow">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button className="h-10 w-10 rounded">
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  
                  <h2 className="text-xl font-semibold min-w-[150px] text-center">
                    {format(date, 'MMMM yyyy')}
                  </h2>
                  
                  <button className="h-10 w-10 rounded">
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <Tabs value={view}>
                    <TabsList>
                      <TabsTrigger value="calendar">Calendar</TabsTrigger>
                      <TabsTrigger value="list">List</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
              
              {/* Blurred content */}
              <div className="flex-grow overflow-auto blur-sm">
                <CalendarSkeleton />
              </div>
            </div>
          </div>
          
          {/* Loading overlay */}
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <CalendarIcon className="w-8 h-8 mx-auto mb-4 text-primary animate-bounce" />
              <p className="text-lg font-medium">Loading data for {format(date, 'MMMM yyyy')}...</p>
            </div>
          </div>
        </div>
      );
    }
  }

  // Main UI - simplified to avoid the "jumping"
  return (
    <div className="flex flex-1 w-full h-full overflow-hidden">
      <div className="p-4 border rounded-lg bg-white flex flex-col gap-4 w-full h-full">
        <div className="flex flex-col gap-4 h-full flex-grow">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                className="h-10 w-10 flex items-center justify-center rounded hover:bg-gray-100"
                onClick={handlePrevMonth}
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              
              <h2 className="text-xl font-semibold min-w-[180px] text-center">
                {format(date, 'MMMM yyyy')} 
                {date.getFullYear() !== new Date().getFullYear() && (
                  <span className="ml-1 text-xs font-normal text-gray-500">
                    (Current: {format(new Date(), 'yyyy')})
                  </span>
                )}
              </h2>
              
              <button
                className="h-10 w-10 flex items-center justify-center rounded hover:bg-gray-100"
                onClick={handleNextMonth}
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
              
              <Button 
                variant={date.getFullYear() !== new Date().getFullYear() ? "default" : "outline"}
                size="sm"
                onClick={handleTodayClick}
                className={`ml-2 ${date.getFullYear() !== new Date().getFullYear() ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}`}
              >
                Today {date.getFullYear() !== new Date().getFullYear() && "(Current Year)"}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefresh}
                className="ml-2"
              >
                Refresh
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Tabs 
                value={view} 
                onValueChange={(v) => {
                  console.log(`Changing view from ${view} to ${v}`);
                  // Make sure we reset any accumulated state when switching views
                  if (v !== view) {
                    // Reset flags to prevent issues
                    adjacentMonthsLoaded.current = false;
                    
                    // If switching to list, reset months range
                    if (v === 'list') {
                      setLoadedMonthsRange({ start: -12, end: 12 });
                      setViewMonthsCount(25); // Current + 12 past + 12 future
                    }
                    
                    // Update URL based on selected view
                    const newPath = v === 'list' ? '/calendar/list' : '/calendar/view';
                    navigate(newPath, { replace: true });
                    
                    // Set the new view
                    setView(v as 'calendar' | 'list');
                  }
                }}
              >
                <TabsList>
                  <TabsTrigger value="calendar">Calendar</TabsTrigger>
                  <TabsTrigger value="list">List</TabsTrigger>
                </TabsList>
              </Tabs>
              
              {selectionMode ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectAll}
                  >
                    <CheckSquare className="h-4 w-4 mr-1" />
                    {selectedProjects.length > 0 ? 'Deselect All' : 'Select All'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500"
                    onClick={handleShowDeleteDialog}
                    disabled={selectedProjects.length === 0}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete ({selectedProjects.length})
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSelectionMode}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectionMode}
                  >
                    <CheckSquare className="h-4 w-4 mr-1" />
                    Select
                  </Button>
                  
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setNewProjectDialogOpen(true)}
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    New Project
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {/* Content with lazy loading */}
          <div className="flex-grow overflow-auto">
            <Suspense fallback={<CalendarSkeleton />}>
              {view === 'calendar' ? (
                <div className="h-full">
                  <CalendarView
                  date={date}
                  projects={filteredProjects}
                  onProjectClick={handleProjectClick}
                  onDateRangeSelect={handleDateRangeSelect}
                  onDateClick={handleDayClick}
                  />
                </div>
              ) : (
                <ListView
                key="list-view" // Use a stable key to prevent full unmount during re-render
                date={date}
                projects={filteredProjects}
                onProjectClick={selectionMode ? undefined : handleProjectClick}
                onProjectDelete={selectionMode ? undefined : handleProjectDelete}
                selectionMode={selectionMode}
                selectedProjects={selectedProjects}
                onProjectSelect={toggleProjectSelection}
                onLoadMoreMonths={handleLoadMoreMonths}
                monthsToShow={viewMonthsCount}
                syncToDate={true}
                onMonthChange={(newDate) => {
                  console.log('ListView month changed to:', format(newDate, 'MMMM yyyy'));
                  setDate(newDate);
                }}
                />
              )}
            </Suspense>
          </div>
        </div>
      </div>
      
      {/* Dialogs */}
      {/* EditProjectDialog removed */}
      
      <NewProjectDialog
        open={newProjectDialogOpen}
        onOpenChange={setNewProjectDialogOpen}
        onProjectAdded={handleProjectUpdate}
        initialDates={selectedDateRange}
      />
      
      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Projects</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedProjects.length} project(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBatchDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete {selectedProjects.length} Project(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Day preview */}
      {dayPreviewOpen && dayPreviewDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setDayPreviewOpen(false)}>
          <div className="bg-card rounded-lg p-4 w-full max-w-md shadow-xl max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h2 className="text-lg font-semibold">{format(dayPreviewDate, 'EEEE, MMMM d, yyyy')}</h2>
              <button onClick={() => setDayPreviewOpen(false)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>
            
            <div className="space-y-3">
              {dayPreviewProjects.length > 0 ? (
                dayPreviewProjects.map(project => (
                  <div 
                    key={project.id}
                    onClick={() => {
                      setSelectedProject(project);
                      // EditProjectDialog removed - only close preview
                      setDayPreviewOpen(false);
                    }}
                    className={cn(
                      "rounded border shadow-sm p-3 cursor-pointer hover:opacity-90 transition-opacity",
                      eventColors[project.event_type as keyof typeof eventColors] || "bg-blue-200 text-blue-800"
                    )}
                  >
                    <div className="font-medium">{project.title}</div>
                    <div className="flex items-center gap-2 mt-2 text-sm">
                      <Clock className="h-4 w-4" />
                      <span>
                        {formatTimeString(project.working_hours_start)} - {formatTimeString(project.working_hours_end)}
                      </span>
                    </div>
                    {project.client?.full_name && (
                      <div className="text-sm mt-1">
                        {project.client.full_name}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No projects for this day
                </div>
              )}
            </div>
            
            <div className="border-t mt-4 pt-4 flex justify-end">
              <button 
                className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
                onClick={() => {
                  if (dayPreviewDate) {
                    setSelectedDateRange({ start: dayPreviewDate, end: dayPreviewDate });
                    setNewProjectDialogOpen(true);
                    setDayPreviewOpen(false);
                  }
                }}
              >
                Add Project for this Day
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}