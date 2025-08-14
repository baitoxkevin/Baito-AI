import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
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
import NewProjectDialog from '@/components/NewProjectDialog';
import { formatTimeString, eventColors } from '@/lib/utils';
import { deleteProject } from '@/lib/projects';
import type { Project } from '@/lib/types';

// Import optimized components
const CalendarView = lazy(() => import('@/components/CalendarViewOptimized'));
const ListView = lazy(() => import('@/components/ListViewOptimized'));

// Lazy load heavy components
import { lazy, Suspense } from 'react';

// Performance monitoring utilities
const measurePerformance = (name: string, fn: () => void) => {
  if (typeof window !== 'undefined' && window.performance) {
    const startMark = `${name}-start`;
    const endMark = `${name}-end`;
    const measureName = `${name}-duration`;
    
    performance.mark(startMark);
    fn();
    performance.mark(endMark);
    performance.measure(measureName, startMark, endMark);
    
    const measure = performance.getEntriesByName(measureName)[0];
    if (measure) {
      console.log(`[Performance] ${name}: ${measure.duration.toFixed(2)}ms`);
    }
  } else {
    fn();
  }
};

// Memoized header component to prevent re-renders
const CalendarHeader = memo(({
  date,
  view,
  onPrevMonth,
  onNextMonth,
  onTodayClick,
  onRefresh,
  onViewChange,
  selectionMode,
  selectedCount,
  onToggleSelection,
  onSelectAll,
  onDeleteSelected,
  onNewProject,
}: {
  date: Date;
  view: 'calendar' | 'list';
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onTodayClick: () => void;
  onRefresh: () => void;
  onViewChange: (view: 'calendar' | 'list') => void;
  selectionMode: boolean;
  selectedCount: number;
  onToggleSelection: () => void;
  onSelectAll: () => void;
  onDeleteSelected: () => void;
  onNewProject: () => void;
}) => {
  const navigate = useNavigate();
  const isCurrentYear = date.getFullYear() === new Date().getFullYear();
  
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button
          className="h-10 w-10 flex items-center justify-center rounded hover:bg-gray-100"
          onClick={onPrevMonth}
          variant="ghost"
          size="icon"
          aria-label="Previous month"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Button>
        
        <h2 className="text-xl font-semibold min-w-[180px] text-center">
          {format(date, 'MMMM yyyy')} 
          {!isCurrentYear && (
            <span className="ml-1 text-xs font-normal text-gray-500">
              (Current: {format(new Date(), 'yyyy')})
            </span>
          )}
        </h2>
        
        <Button
          className="h-10 w-10 flex items-center justify-center rounded hover:bg-gray-100"
          onClick={onNextMonth}
          variant="ghost"
          size="icon"
          aria-label="Next month"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </Button>
        
        <Button 
          variant={!isCurrentYear ? "default" : "outline"}
          size="sm"
          onClick={onTodayClick}
          className={cn("ml-2", !isCurrentYear && "bg-primary text-primary-foreground hover:bg-primary/90")}
        >
          Today {!isCurrentYear && "(Current Year)"}
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={onRefresh}
          className="ml-2"
        >
          Refresh
        </Button>
      </div>
      
      <div className="flex items-center gap-2">
        <Tabs 
          value={view} 
          onValueChange={(v) => {
            const newView = v as 'calendar' | 'list';
            const newPath = newView === 'list' ? '/calendar/list' : '/calendar/view';
            navigate(newPath, { replace: true });
            onViewChange(newView);
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
              onClick={onSelectAll}
            >
              <CheckSquare className="h-4 w-4 mr-1" />
              {selectedCount > 0 ? 'Deselect All' : 'Select All'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="text-red-500"
              onClick={onDeleteSelected}
              disabled={selectedCount === 0}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete ({selectedCount})
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSelection}
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
              onClick={onToggleSelection}
            >
              <CheckSquare className="h-4 w-4 mr-1" />
              Select
            </Button>
            
            <Button
              variant="default"
              size="sm"
              onClick={onNewProject}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              New Project
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});

CalendarHeader.displayName = 'CalendarHeader';

// Optimized Calendar Page Component
export default function CalendarPageOptimized() {
  // Performance tracking refs
  const renderCount = useRef(0);
  const lastLoadTime = useRef<number>(0);
  const loadingRef = useRef(false);
  const mountedRef = useRef(false);
  const navigationDebounceRef = useRef<NodeJS.Timeout>();
  
  // Cache for month data
  const monthCacheRef = useRef<Map<string, Project[]>>(new Map());
  
  // State management - consolidated to reduce re-renders
  const [state, setState] = useState(() => ({
    date: new Date(),
    projects: [] as Project[],
    extendedProjects: [] as Project[],
    isLoading: false,
    view: 'list' as 'calendar' | 'list',
    selectionMode: false,
    deleteDialogOpen: false,
    newProjectDialogOpen: false,
    selectedDateRange: null as { start: Date; end: Date } | null,
    dayPreviewProjects: [] as Project[],
    dayPreviewDate: null as Date | null,
    dayPreviewOpen: false,
  }));
  
  // Navigation and location hooks
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Services with optimized caching
  const { getProjectsByMonth, invalidateCache, prefetchAdjacentMonths } = useProjectsByMonth();
  const { 
    selectedProjects, 
    toggleProjectSelection, 
    selectAllProjects,
    clearProjectSelections,
    removeMultipleProjects 
  } = useProjects();
  
  // Performance: Track render count
  useEffect(() => {
    renderCount.current++;
    console.log(`[Performance] CalendarPage render #${renderCount.current}`);
  });
  
  // Optimized project loading with caching and debouncing
  const loadProjects = useCallback(async (targetDate: Date, showLoading = true) => {
    // Prevent concurrent loads
    if (loadingRef.current) {
      console.log('[Performance] Skipping concurrent load');
      return;
    }
    
    // Implement rate limiting (max 1 request per 500ms)
    const now = Date.now();
    if (now - lastLoadTime.current < 500) {
      console.log('[Performance] Rate limiting active, skipping load');
      return;
    }
    lastLoadTime.current = now;
    
    const monthKey = format(targetDate, 'yyyy-MM');
    
    // Check cache first
    if (monthCacheRef.current.has(monthKey) && !showLoading) {
      const cachedData = monthCacheRef.current.get(monthKey)!;
      console.log(`[Performance] Using cached data for ${monthKey}`);
      setState(prev => ({ ...prev, projects: cachedData }));
      return;
    }
    
    loadingRef.current = true;
    
    if (showLoading) {
      setState(prev => ({ ...prev, isLoading: true }));
    }
    
    try {
      measurePerformance('load-projects', async () => {
        const month = targetDate.getMonth();
        const year = targetDate.getFullYear();
        
        const data = await getProjectsByMonth(month, year);
        
        // Cache the data
        monthCacheRef.current.set(monthKey, data);
        
        // Limit cache size to prevent memory issues
        if (monthCacheRef.current.size > 12) {
          const firstKey = monthCacheRef.current.keys().next().value;
          monthCacheRef.current.delete(firstKey);
        }
        
        if (mountedRef.current) {
          setState(prev => ({
            ...prev,
            projects: data,
            extendedProjects: data,
            isLoading: false
          }));
          
          // Prefetch adjacent months in background (non-blocking)
          requestIdleCallback(() => {
            prefetchAdjacentMonths(month, year);
          });
        }
      });
    } catch (error) {
      console.error('[Performance] Error loading projects:', error);
      if (mountedRef.current) {
        setState(prev => ({ ...prev, isLoading: false }));
        toast({
          title: 'Error loading projects',
          description: 'Failed to load projects. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      loadingRef.current = false;
    }
  }, [getProjectsByMonth, prefetchAdjacentMonths, toast]);
  
  // Debounced navigation handlers
  const handleNavigation = useCallback((direction: 'prev' | 'next' | 'today') => {
    // Clear existing debounce
    if (navigationDebounceRef.current) {
      clearTimeout(navigationDebounceRef.current);
    }
    
    navigationDebounceRef.current = setTimeout(() => {
      measurePerformance(`navigate-${direction}`, () => {
        let newDate: Date;
        
        switch (direction) {
          case 'prev':
            newDate = subMonths(state.date, 1);
            break;
          case 'next':
            newDate = addMonths(state.date, 1);
            break;
          case 'today':
            newDate = new Date();
            break;
        }
        
        setState(prev => ({ ...prev, date: newDate }));
        loadProjects(newDate, true);
      });
    }, 150); // 150ms debounce
  }, [state.date, loadProjects]);
  
  // Memoized filtered projects with performance tracking
  const filteredProjects = useMemo(() => {
    return measurePerformance('filter-projects', () => {
      if (state.view === 'list') {
        // For list view, return all extended projects
        return state.extendedProjects;
      }
      
      // For calendar view, filter by current month
      const monthStart = startOfMonth(state.date);
      const monthEnd = endOfMonth(state.date);
      
      return state.projects.filter(project => {
        if (!project.start_date) return false;
        
        try {
          const projectStart = new Date(project.start_date);
          const projectEnd = project.end_date ? new Date(project.end_date) : projectStart;
          
          return (
            (projectStart >= monthStart && projectStart <= monthEnd) ||
            (projectEnd >= monthStart && projectEnd <= monthEnd) ||
            (projectStart <= monthStart && projectEnd >= monthEnd)
          );
        } catch {
          return false;
        }
      });
    });
  }, [state.projects, state.extendedProjects, state.date, state.view]);
  
  // Lifecycle management
  useEffect(() => {
    mountedRef.current = true;
    
    // Initial load with performance tracking
    measurePerformance('initial-load', () => {
      loadProjects(state.date, true);
    });
    
    return () => {
      mountedRef.current = false;
      if (navigationDebounceRef.current) {
        clearTimeout(navigationDebounceRef.current);
      }
    };
  }, []);
  
  // URL sync
  useEffect(() => {
    const path = location.pathname;
    if (path === '/calendar') {
      navigate('/calendar/list', { replace: true });
    }
  }, [location.pathname, navigate]);
  
  // Optimized handlers
  const handleProjectUpdate = useCallback(() => {
    // Invalidate cache and reload
    monthCacheRef.current.clear();
    invalidateCache();
    loadProjects(state.date, true);
  }, [state.date, invalidateCache, loadProjects]);
  
  const handleProjectDelete = useCallback(async (project: Project) => {
    try {
      const storedUser = localStorage.getItem('test_user');
      if (!storedUser) throw new Error('User not logged in');
      
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
  
  const handleBatchDelete = useCallback(async () => {
    if (selectedProjects.length === 0) return;
    
    try {
      const storedUser = localStorage.getItem('test_user');
      if (!storedUser) throw new Error('User not logged in');
      
      const userId = JSON.parse(storedUser).user.id;
      const result = await removeMultipleProjects(selectedProjects, userId);
      
      if (result.success.length > 0) {
        toast({
          title: "Projects deleted",
          description: `${result.success.length} project(s) deleted successfully`,
        });
        handleProjectUpdate();
      }
      
      setState(prev => ({ ...prev, selectionMode: false, deleteDialogOpen: false }));
    } catch (error) {
      console.error('Error batch deleting projects:', error);
      toast({
        title: "Error",
        description: "Failed to delete projects. Please try again.",
        variant: "destructive",
      });
    }
  }, [selectedProjects, removeMultipleProjects, toast, handleProjectUpdate]);
  
  // Loading state with skeleton
  if (state.isLoading && state.projects.length === 0) {
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
  }
  
  return (
    <div className="flex flex-1 w-full h-full overflow-hidden">
      <div className="p-4 border rounded-lg bg-white flex flex-col gap-4 w-full h-full">
        <div className="flex flex-col gap-4 h-full flex-grow">
          {/* Memoized Header */}
          <CalendarHeader
            date={state.date}
            view={state.view}
            onPrevMonth={() => handleNavigation('prev')}
            onNextMonth={() => handleNavigation('next')}
            onTodayClick={() => handleNavigation('today')}
            onRefresh={handleProjectUpdate}
            onViewChange={(view) => setState(prev => ({ ...prev, view }))}
            selectionMode={state.selectionMode}
            selectedCount={selectedProjects.length}
            onToggleSelection={() => setState(prev => ({ 
              ...prev, 
              selectionMode: !prev.selectionMode 
            }))}
            onSelectAll={() => selectAllProjects(filteredProjects.map(p => p.id))}
            onDeleteSelected={() => setState(prev => ({ ...prev, deleteDialogOpen: true }))}
            onNewProject={() => setState(prev => ({ ...prev, newProjectDialogOpen: true }))}
          />
          
          {/* Content with lazy loading */}
          <div className="flex-grow overflow-auto">
            <Suspense fallback={<CalendarSkeleton />}>
              {state.view === 'calendar' ? (
                <CalendarView
                  date={state.date}
                  projects={filteredProjects}
                  onProjectClick={(project) => {
                    // Handle project click
                    console.log('Project clicked:', project);
                  }}
                  onDateRangeSelect={(start, end) => {
                    setState(prev => ({
                      ...prev,
                      selectedDateRange: { start, end },
                      newProjectDialogOpen: true
                    }));
                  }}
                  onDateClick={(date, projects) => {
                    setState(prev => ({
                      ...prev,
                      dayPreviewProjects: projects,
                      dayPreviewDate: date,
                      dayPreviewOpen: true
                    }));
                  }}
                />
              ) : (
                <ListView
                  date={state.date}
                  projects={filteredProjects}
                  onProjectClick={state.selectionMode ? undefined : (project) => {
                    console.log('Project clicked:', project);
                  }}
                  onProjectDelete={state.selectionMode ? undefined : handleProjectDelete}
                  selectionMode={state.selectionMode}
                  selectedProjects={selectedProjects}
                  onProjectSelect={toggleProjectSelection}
                  onLoadMoreMonths={async () => {
                    // Implement progressive loading
                    console.log('Load more months requested');
                  }}
                  monthsToShow={3}
                  syncToDate={true}
                  onMonthChange={(newDate) => {
                    setState(prev => ({ ...prev, date: newDate }));
                    loadProjects(newDate, false);
                  }}
                />
              )}
            </Suspense>
          </div>
        </div>
      </div>
      
      {/* Dialogs */}
      <NewProjectDialog
        open={state.newProjectDialogOpen}
        onOpenChange={(open) => setState(prev => ({ ...prev, newProjectDialogOpen: open }))}
        onProjectAdded={handleProjectUpdate}
        initialDates={state.selectedDateRange}
      />
      
      {/* Delete confirmation */}
      <AlertDialog 
        open={state.deleteDialogOpen} 
        onOpenChange={(open) => setState(prev => ({ ...prev, deleteDialogOpen: open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Projects</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedProjects.length} project(s)? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBatchDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete {selectedProjects.length} Project(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Day preview dialog */}
      {state.dayPreviewOpen && state.dayPreviewDate && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" 
          onClick={() => setState(prev => ({ ...prev, dayPreviewOpen: false }))}
        >
          <div 
            className="bg-card rounded-lg p-4 w-full max-w-md shadow-xl max-h-[80vh] overflow-auto" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h2 className="text-lg font-semibold">
                {format(state.dayPreviewDate, 'EEEE, MMMM d, yyyy')}
              </h2>
              <button 
                onClick={() => setState(prev => ({ ...prev, dayPreviewOpen: false }))} 
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3">
              {state.dayPreviewProjects.length > 0 ? (
                state.dayPreviewProjects.map(project => (
                  <div 
                    key={project.id}
                    className={cn(
                      "rounded border shadow-sm p-3 cursor-pointer hover:opacity-90 transition-opacity",
                      eventColors[project.event_type as keyof typeof eventColors] || "bg-blue-200 text-blue-800"
                    )}
                  >
                    <div className="font-medium">{project.title}</div>
                    <div className="flex items-center gap-2 mt-2 text-sm">
                      <Clock className="h-4 w-4" />
                      <span>
                        {formatTimeString(project.working_hours_start)} - 
                        {formatTimeString(project.working_hours_end)}
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
              <Button 
                onClick={() => {
                  setState(prev => ({
                    ...prev,
                    selectedDateRange: { 
                      start: state.dayPreviewDate!, 
                      end: state.dayPreviewDate! 
                    },
                    newProjectDialogOpen: true,
                    dayPreviewOpen: false
                  }));
                }}
              >
                Add Project for this Day
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}