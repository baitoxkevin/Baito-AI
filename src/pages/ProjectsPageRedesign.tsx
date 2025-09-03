import React, { useState, useEffect, useMemo, useCallback, memo, lazy, Suspense, Profiler } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// import { logger } from '../lib/logger';
import { 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Plus,
  Filter,
  FolderPlus,
  Search,
  Building,
  Clock,
  Calendar,
  Circle,
  ArrowRight,
  ArrowDown,
  History,
  Sparkles,
  Hourglass,
  XCircle,
  CalendarDays,
  CalendarRange,
  ChevronDown,
  ChevronUp,
  Grid3X3,
  List,
  Star
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { MetricCard } from '@/components/ui/metric-card';
// Removed EnhancedProjectCard - using optimized SpotlightCard for all projects
import { SpotlightCardOptimized } from '@/components/spotlight-card/SpotlightCardOptimized';
import { VirtualizedProjectGrid } from '@/components/VirtualizedProjectGrid';
import { EnhancedMonthDropdown } from '@/components/ui/enhanced-month-dropdown';

// Lazy load heavy dialogs for better initial load performance
const NewProjectDialog = lazy(() => import('@/components/NewProjectDialog'));
// EditProjectDialog removed
import { useProjectsByMonth } from '@/hooks/use-projects';
import { usePersistentState } from '@/hooks/use-persistent-state';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';
import { onRenderCallback } from '@/lib/performance-monitor';
import { deleteProject } from '@/lib/projects';
// import { dummyProjects } from '@/lib/dummy-data';
import { sortProjects, filterProjects, groupProjects, getGroupIcon, ProjectGroupType } from '@/lib/project-utils';
import type { Project } from '@/lib/types';
import { getCachedYearProjectsCount } from '@/lib/year-statistics';

export default function ProjectsPageRedesign() {
  // State for project data and UI
  const [projects, setProjects] = usePersistentState<Record<number, any[]>>('projects-data', {});
  const [activeMonth, setActiveMonth] = usePersistentState('projects-active-month', new Date().getMonth());
  const [yearProjectsCount, setYearProjectsCount] = useState<number>(0);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  // editDialogOpen removed
  const [selectedProject] = useState<unknown>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [, setError] = useState<string | null>(null);
  const [useDummyData, setUseDummyData] = usePersistentState('projects-use-dummy', false);
  
  // UI state for filtering, grouping, and display
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300); // Debounce search for better performance
  const [, setGroupBy] = usePersistentState<ProjectGroupType>('projects-group-by-v2', 'none' as ProjectGroupType);
  const [sortBy] = usePersistentState('projects-sort-by', 'priority');
  const [activeFilter, setActiveFilter] = usePersistentState('projects-active-filter-v2', 'all');
  const [isBannerVisible, setIsBannerVisible] = useState(true);
  const [, setIsFilterMenuOpen] = useState(false);
  const [isDashboardMinimized, setIsDashboardMinimized] = usePersistentState('projects-dashboard-minimized', false);
  const [viewMode, setViewMode] = usePersistentState('projects-view-mode', 'grid');
  
  // Reference for featured project section (no longer needed but kept for compatibility)
  // const featuredSectionRef = React.useRef<HTMLDivElement>(null);
  
  // Hooks for project data
  const { getProjectsByMonth, isLoading, prefetchAdjacentMonths } = useProjectsByMonth();
  
  // Ensure 'all' is the default filter on mount
  useEffect(() => {
    if (!activeFilter || activeFilter === '') {
      setActiveFilter('all');
    }
  }, []);
  
  // Load year projects count
  useEffect(() => {
    const loadYearCount = async () => {
      const count = await getCachedYearProjectsCount(currentYear);
      setYearProjectsCount(count);
    };
    
    loadYearCount();
    
    // Refresh count every minute
    const interval = setInterval(loadYearCount, 60000);
    return () => clearInterval(interval);
  }, [currentYear]);
  
  const { toast } = useToast();
  
  // Load projects for a specific month
  const loadProjects = async (monthIndex: number) => {
    // Skip if projects are already loaded for this month
    if (projects[monthIndex]) return;
    
    try {
      const currentYear = new Date().getFullYear();
      const fetchedProjects = await getProjectsByMonth(monthIndex, currentYear);
      setProjects(prev => ({ ...prev, [monthIndex]: fetchedProjects }));
      
      // If no projects are returned, it might be a connection issue
      if (fetchedProjects.length === 0) {
        // logger.warn('No projects returned from database, check connection');
      }
      
      // Prefetch adjacent months for smoother navigation
      prefetchAdjacentMonths(monthIndex);
    } catch (err) {
      // logger.error('Error fetching projects:', err);
      setError('Failed to load projects. Using dummy data as fallback.');
      toast({
        title: 'Database Connection Error',
        description: 'Using demo data as fallback. Please check your database connection.',
        variant: 'destructive',
      });
      
      // Use dummy data as fallback
      setUseDummyData(true);
      
      // Filter dummy projects by month
      const year = new Date().getFullYear();
      const startOfMonth = new Date(year, monthIndex, 1);
      const endOfMonth = new Date(year, monthIndex + 1, 0);
      
      const filteredProjects = [].filter(project => {
        const projectStartDate = new Date(project.start_date);
        const projectEndDate = project.end_date ? new Date(project.end_date) : projectStartDate;
        
        return (
          (projectStartDate >= startOfMonth && projectStartDate <= endOfMonth) ||
          (projectEndDate >= startOfMonth && projectEndDate <= endOfMonth) ||
          (projectStartDate <= startOfMonth && projectEndDate >= endOfMonth)
        );
      });
      
      setProjects(prev => ({ ...prev, [monthIndex]: filteredProjects }));
    }
  };
  
  // Load projects for the active month on initial render
  useEffect(() => {
    loadProjects(activeMonth);
  }, [activeMonth]);
  
  // No scroll effects - bentobox is always single line
  
  // No scroll effects needed
  
  // No scroll monitoring - bentobox is always visible
  
  // Simple reset to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);
  
  // Handle tab change - memoized callback
  const handleTabChange = useCallback((index: number) => {
    setActiveMonth(index);
    if (!projects[index]) {
      loadProjects(index);
    }
  }, [projects]);
  
  // Handle project refresh after adding or updating - memoized callback
  const handleProjectsUpdated = useCallback((updatedProject?: Project) => {
    if (updatedProject) {
      // Determine which months this project belongs to
      const projectStartDate = new Date(updatedProject.start_date);
      const projectEndDate = updatedProject.end_date ? new Date(updatedProject.end_date) : projectStartDate;
      const currentYear = new Date().getFullYear();
      
      setProjects(prev => {
        const newProjects = { ...prev };
        
        // Check each month to see if the project should appear there
        for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
          const startOfMonth = new Date(currentYear, monthIndex, 1);
          const endOfMonth = new Date(currentYear, monthIndex + 1, 0);
          
          // Check if project overlaps with this month
          const projectOverlapsMonth = (
            (projectStartDate >= startOfMonth && projectStartDate <= endOfMonth) ||
            (projectEndDate >= startOfMonth && projectEndDate <= endOfMonth) ||
            (projectStartDate <= startOfMonth && projectEndDate >= endOfMonth)
          );
          
          if (projectOverlapsMonth) {
            // Initialize month array if it doesn't exist
            if (!newProjects[monthIndex]) {
              newProjects[monthIndex] = [];
            }
            
            // Check if project already exists in this month
            const existingIndex = newProjects[monthIndex].findIndex(p => p.id === updatedProject.id);
            
            if (existingIndex >= 0) {
              // Update existing project
              newProjects[monthIndex][existingIndex] = updatedProject;
            } else {
              // Add new project to this month
              newProjects[monthIndex] = [...newProjects[monthIndex], updatedProject];
            }
          }
        }
        
        return newProjects;
      });
    } else {
      // Clear the projects cache for the current month to force a reload
      setProjects(prev => {
        const newProjects = { ...prev };
        delete newProjects[activeMonth];
        return newProjects;
      });
      
      // Reload projects for the current month
      loadProjects(activeMonth);
    }
  }, [activeMonth, projects]);
  
  // Handle project deletion - memoized callback
  const handleProjectDelete = useCallback(async (project: unknown) => {
    try {
      // Get session user id, assuming we're using test account for now
      const storedUser = localStorage.getItem('test_user');
      if (!storedUser) {
        throw new Error('User not logged in');
      }
      
      const userId = JSON.parse(storedUser).user.id;
      
      // Delete the project
      await deleteProject(project.id, userId);
      
      // Update the UI
      toast({
        title: "Project deleted",
        description: `"${project.title}" has been deleted successfully`,
      });
      
      // Refresh projects
      handleProjectsUpdated();
      
    } catch (error) {
      // logger.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast, handleProjectsUpdated]);
  
  // Handle view details - memoized callback
  const handleViewDetails = useCallback((project: unknown) => {
    setSelectedProject(project);
    // EditProjectDialog removed - no action
  }, []);
  
  // Current month projects with processing - memoized with shallow comparison
  const allMonthProjects = projects[activeMonth] || [];
  
  // Additional filtering to ensure we only show projects that actually fall within the current month
  const currentMonthProjects = useMemo(() => {
    // Early return if no projects
    if (allMonthProjects.length === 0) return [];
    
    // Get first and last day of the selected month
    const currentYear = new Date().getFullYear();
    const firstDayOfMonth = new Date(currentYear, activeMonth, 1);
    const lastDayOfMonth = new Date(currentYear, activeMonth + 1, 0);
    
    // Pre-calculate timestamps for faster comparison
    const firstDayTimestamp = firstDayOfMonth.getTime();
    const lastDayTimestamp = lastDayOfMonth.getTime();
    
    return allMonthProjects.filter(project => {
      const startTimestamp = new Date(project.start_date).getTime();
      const endTimestamp = project.end_date ? new Date(project.end_date).getTime() : startTimestamp;
      
      // Use timestamp comparison for better performance
      return (startTimestamp >= firstDayTimestamp && startTimestamp <= lastDayTimestamp) ||
             (endTimestamp >= firstDayTimestamp && endTimestamp <= lastDayTimestamp) ||
             (startTimestamp <= firstDayTimestamp && endTimestamp >= lastDayTimestamp);
    });
  }, [allMonthProjects, activeMonth]);
  
  // Generate filtered and processed project lists with optimized filtering
  const filteredProjects = useMemo(() => {
    // Early return for empty projects
    if (currentMonthProjects.length === 0) return [];
    
    // Map filter values to actual database status values
    let statusFilter = {};
    if (activeFilter !== 'all') {
      // Map 'active' filter to include both 'active' and 'in_progress' statuses
      if (activeFilter === 'active') {
        statusFilter = { status: ['active', 'in_progress', 'confirmed'] };
      } else {
        statusFilter = { status: [activeFilter] };
      }
    }
    
    const filtered = filterProjects(
      currentMonthProjects,
      debouncedSearchQuery, // Use debounced search query
      statusFilter
    );
    return filtered;
  }, [currentMonthProjects, debouncedSearchQuery, activeFilter]); // Use debounced search
  
  // Get project metrics
  const metrics = useMemo(() => {
    const activeProjects = filteredProjects.filter(p => {
      const normalizedStatus = p.status.toLowerCase();
      return ['active', 'in_progress', 'confirmed', 'planning'].includes(normalizedStatus);
    });
    
    const completedProjects = filteredProjects.filter(p => 
      p.status.toLowerCase() === 'completed'
    );
    
    const delayedProjects = filteredProjects.filter(p => {
      const normalizedStatus = p.status.toLowerCase();
      return ['active', 'in_progress'].includes(normalizedStatus) && 
        (p as unknown).is_delayed === true;
    });
    
    // Calculate team utilization if available
    let teamUtilization = "N/A";
    if (filteredProjects.length > 0) {
      const totalCrew = filteredProjects.reduce((sum, p) => sum + p.crew_count, 0);
      const filledPositions = filteredProjects.reduce((sum, p) => sum + p.filled_positions, 0);
      if (totalCrew > 0) {
        teamUtilization = `${Math.round((filledPositions / totalCrew) * 100)}%`;
      }
    }
    
    return {
      activeProjects,
      completedProjects,
      delayedProjects,
      teamUtilization
    };
  }, [filteredProjects]);
  
  // Get current user id from storage (assuming test_user for now)
  const currentUserId = useMemo(() => {
    const storedUser = localStorage.getItem('test_user');
    if (storedUser) {
      try {
        return JSON.parse(storedUser).user.id;
      } catch {
        return null;
      }
    }
    return null;
  }, []);

  // Find user's projects (where user is manager, client, or collaborator)
  const myProjects = useMemo(() => {
    if (!currentUserId || !filteredProjects || !Array.isArray(filteredProjects)) return [];
    
    return filteredProjects.filter(project => {
      // Check if user is the manager
      if (project.manager_id === currentUserId) return true;
      
      // Check if user is the client
      if (project.client_id === currentUserId) return true;
      
      // Check if user is in confirmed staff
      if (project.confirmed_staff && Array.isArray(project.confirmed_staff)) {
        return project.confirmed_staff.some((staff: unknown) => 
          staff.candidate_id === currentUserId || staff.id === currentUserId
        );
      }
      
      return false;
    });
  }, [filteredProjects, currentUserId]);
  
  // Calculate today's projects count
  const todaysProjectsCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day
    
    return currentMonthProjects.filter(project => {
      const startDate = new Date(project.start_date);
      const endDate = project.end_date ? new Date(project.end_date) : startDate;
      
      // Reset times for accurate date comparison
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      
      return today >= startDate && today <= endDate;
    }).length;
  }, [currentMonthProjects]);
  
  // Group projects by the selected grouping method
  const groupedProjects = useMemo(() => {
    // Filter out user's projects from the general groups
    const myProjectIds = new Set((myProjects || []).map(p => p.id));
    const projectsWithoutMine = (filteredProjects || []).filter(p => !myProjectIds.has(p.id));
      
    // Always use 'none' grouping to show all projects together
    return groupProjects(
      // Sort projects within each group
      sortProjects(projectsWithoutMine, sortBy as unknown),
      'none'
    );
  }, [filteredProjects, myProjects, sortBy]);
  
  // Helper function to render the appropriate icon for group headers
  const renderGroupIcon = (groupName: string) => {
    const iconName = getGroupIcon(groupName, 'none');
    const icons: Record<string, React.ReactNode> = {
      'Sparkles': <Sparkles className="h-5 w-5 text-amber-500 mr-2" />,
      'Clock': <Clock className="h-5 w-5 text-blue-500 mr-2" />,
      'Hourglass': <Hourglass className="h-5 w-5 text-indigo-500 mr-2" />,
      'CheckCircle': <CheckCircle className="h-5 w-5 text-green-500 mr-2" />,
      'XCircle': <XCircle className="h-5 w-5 text-red-500 mr-2" />,
      'AlertTriangle': <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />,
      'ArrowRight': <ArrowRight className="h-5 w-5 text-blue-500 mr-2" />,
      'ArrowDown': <ArrowDown className="h-5 w-5 text-green-500 mr-2" />,
      'Calendar': <Calendar className="h-5 w-5 text-indigo-500 mr-2" />,
      'CalendarDays': <CalendarDays className="h-5 w-5 text-blue-500 mr-2" />,
      'CalendarRange': <CalendarRange className="h-5 w-5 text-violet-500 mr-2" />,
      'History': <History className="h-5 w-5 text-slate-500 mr-2" />,
      'Building': <Building className="h-5 w-5 text-slate-500 mr-2" />,
      'Circle': <Circle className="h-5 w-5 text-slate-500 mr-2" />
    };
    
    return icons[iconName] || <Circle className="h-5 w-5 text-slate-500 mr-2" />;
  };
  
  // Format group name for display
  const formatGroupName = (groupName: string) => {
    // Special cases
    if (groupName === 'New') return 'New Projects';
    if (groupName === 'In-progress') return 'In Progress';
    return groupName;
  };
  
  // Get total project count
  const totalProjects = filteredProjects.length;
  
  // Tab options for status filtering
  const statusOptions = [
    { value: 'all', label: 'All', icon: <Circle className="h-3.5 w-3.5" /> },
    { value: 'planning', label: 'Planning', icon: <Calendar className="h-3.5 w-3.5" /> },
    { value: 'active', label: 'Active', icon: <Activity className="h-3.5 w-3.5" /> },
    { value: 'completed', label: 'Completed', icon: <CheckCircle className="h-3.5 w-3.5" /> },
    { value: 'cancelled', label: 'Cancelled', icon: <XCircle className="h-3.5 w-3.5" /> }
  ];
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-[#f8fafc] to-[#eef2ff] dark:from-slate-950 dark:to-indigo-950">
      {/* Connection error banner */}
      {useDummyData && isBannerVisible && (
        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <p className="text-amber-800 dark:text-amber-300 text-sm font-medium">
              Using demo data. Database connection unavailable.
            </p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800"
              onClick={() => setIsBannerVisible(false)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}
      
      {/* No spacer needed - connecting the bentobox with the controls */}
      
      {/* Bentobox metrics dashboard - single row layout */}
      <style>
        {`
          .metric-card {
            padding: 12px !important;
            height: 90px !important;
            overflow: hidden !important;
          }
        `}
      </style>
      
      {/* Dashboard section with minimize/maximize toggle */}
      <AnimatePresence initial={false}>
        {!isDashboardMinimized && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="bentobox-container bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm mb-0 pt-3 pb-0 overflow-hidden"
          >
            <div className="px-6">
              <div className="bentobox-grid grid grid-cols-1 md:grid-cols-4 grid-rows-1 gap-3 max-w-6xl mx-auto">
                {/* Active/Completed Projects card */}
                <div className="metric-card col-span-1 bg-white dark:bg-slate-900 rounded-xl border shadow-sm flex overflow-hidden relative transition-all p-0">
                  <div className="flex flex-col w-1/2 flex-grow">
                    {/* Active Projects side */}
                    <div className="h-full flex flex-col items-center justify-center text-center px-1">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 truncate w-full">
                        Active
                      </span>
                      <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                        {metrics.activeProjects.length}
                      </span>
                    </div>
                  </div>
                  
                  {/* Divider */}
                  <div className="w-px h-full bg-slate-200 dark:bg-slate-800"></div>
                  
                  <div className="flex flex-col w-1/2 flex-grow">
                    {/* Completed side */}
                    <div className="h-full flex flex-col items-center justify-center text-center px-1">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 truncate w-full">
                        Completed
                      </span>
                      <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                        {metrics.completedProjects.length}
                      </span>
                    </div>
                  </div>
                </div>
            
                {/* Today's Projects */}
                <div className="metric-card col-span-1 bg-gradient-to-br from-teal-500 to-emerald-600 dark:from-teal-700 dark:to-emerald-800 rounded-xl border border-teal-300/30 dark:border-teal-800/30 shadow-sm p-4 flex flex-col overflow-hidden relative">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-white">Today's Projects</span>
                    <Calendar className="h-4 w-4 text-white/80" />
                  </div>
                  
                  <div className="flex-grow flex flex-col justify-center items-center">
                    <div className="text-4xl font-bold text-white">{todaysProjectsCount}</div>
                  </div>
                  
                  {/* Decorative circle */}
                  <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full"></div>
                </div>
                
                {/* This Month's Projects */}
                <div className="metric-card col-span-1 bg-gradient-to-br from-blue-500 to-sky-600 dark:from-blue-700 dark:to-sky-800 rounded-xl border border-blue-300/30 dark:border-blue-800/30 shadow-sm p-4 flex flex-col overflow-hidden relative">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-white">{months[activeMonth]} Projects</span>
                    <CalendarDays className="h-4 w-4 text-white/80" />
                  </div>
                  <div className="flex-grow flex flex-col justify-center items-center">
                    <div className="text-4xl font-bold text-white">{currentMonthProjects.length}</div>
                  </div>
                  
                  {/* Decorative circle */}
                  <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full"></div>
                </div>
                
                {/* Total projects this year widget */}
                <div className="metric-card col-span-1 bg-gradient-to-br from-purple-500 to-indigo-600 dark:from-purple-700 dark:to-indigo-800 rounded-xl border border-purple-300/30 dark:border-purple-800/30 shadow-sm p-4 flex flex-col overflow-hidden relative">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-white">All Projects {currentYear}</span>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => setCurrentYear(prev => prev - 1)}
                        className="text-white/80 hover:text-white text-xs p-0.5"
                      >
                        ←
                      </button>
                      <CalendarRange className="h-4 w-4 text-white/80" />
                      <button 
                        onClick={() => setCurrentYear(prev => prev + 1)}
                        className="text-white/80 hover:text-white text-xs p-0.5"
                      >
                        →
                      </button>
                    </div>
                  </div>
                  <div className="flex-grow flex flex-col justify-center items-center">
                    <div className="text-4xl font-bold text-white">{yearProjectsCount}</div>
                  </div>
                  
                  {/* Decorative circle */}
                  <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full"></div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Controls bar - handles transitions smoothly */}
      <div className="bg-white/95 dark:bg-slate-900/95 border-b shadow-sm py-4 z-10 relative">
      
        <div className="px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Left-side controls */}
              <div className="flex items-center gap-2">
                {/* Month Selector */}
                <div className="relative">
                  <EnhancedMonthDropdown 
                    months={months} 
                    activeMonth={activeMonth} 
                    onMonthChange={handleTabChange}
                    className="min-w-24 h-10 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </div>
                
                {/* Search input */}
                <div className="relative w-full md:w-64">
                  <div className="flex items-center h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="flex-shrink-0 pl-3">
                      <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <Input
                      type="search"
                      placeholder="Search projects..."
                      className="pl-2 pr-4 py-2 h-10 bg-transparent border-0 shadow-none focus:ring-0 focus:outline-none"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button 
                        className="flex-shrink-0 pr-3 text-slate-400 hover:text-slate-500"
                        onClick={() => setSearchQuery('')}
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Right-side controls */}
              <div className="flex items-center gap-2">
                {/* View Toggle */}
                <div className="flex items-center h-10 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-1">
                  <button
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' 
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      viewMode === 'list' 
                        ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' 
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>

                {/* Additional Filters */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 gap-2"
                    >
                      <Filter className="h-4 w-4" />
                      <span>Filters</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>By Date Range</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Users className="mr-2 h-4 w-4" />
                      <span>By Team</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Star className="mr-2 h-4 w-4" />
                      <span>By Priority</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {/* All dropdown - simulating the design from the image */}
                <div className="flex items-center h-10 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 px-3">
                  <div className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full mr-2">
                    <Circle className="h-4 w-4 text-slate-500" />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 font-medium border-0 p-0 hover:bg-transparent"
                      >
                        <div className="flex items-center">
                          <span className="mr-1">{statusOptions.find(option => option.value === activeFilter)?.label}</span>
                          <ChevronDown className="h-3.5 w-3.5 text-slate-500 ml-1" />
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    
                    <DropdownMenuContent 
                      align="start" 
                      sideOffset={4}
                      className="w-48 p-0 overflow-hidden border-slate-200 dark:border-slate-800 shadow-lg"
                    >
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 p-3 border-b border-slate-200 dark:border-slate-800">
                        <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Project Status</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Filter projects by status</p>
                      </div>
                    
                      <DropdownMenuRadioGroup value={activeFilter} onValueChange={setActiveFilter}>
                        {statusOptions.map(option => (
                          <DropdownMenuRadioItem 
                            key={option.value} 
                            value={option.value}
                            className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer"
                          >
                            <span className={`${
                              activeFilter === option.value ? 
                                'text-blue-500 dark:text-blue-400' : 
                                'text-slate-500 dark:text-slate-400'
                            }`}>
                              {option.icon}
                            </span>
                            {option.label}
                          </DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                </div>
                
                {/* Create new project button */}
                <Button 
                  className="h-10 gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-sm border-0 rounded-lg"
                  onClick={() => setNewProjectDialogOpen(true)}
                >
                  <Plus className="h-5 w-5" /> 
                  <span>New Project</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
        
      </div>
      
      {/* Project content area */}
      <div 
        className="flex-1 overflow-auto px-6 py-4 project-content-area" 
        onScroll={(e) => {
          // Implement scroll-based minimization
          const scrollTop = e.currentTarget.scrollTop;
          
          // Minimize when scrolled down, maximize when at top
          if (scrollTop > 100 && !isDashboardMinimized) {
            setIsDashboardMinimized(true);
          } else if (scrollTop < 20 && isDashboardMinimized) {
            setIsDashboardMinimized(false);
          }
        }}
      >
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Loader for initial data fetching */}
          {isLoading && !(projects[activeMonth]?.length > 0) ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : (
            <>
              {/* My Projects */}
              {myProjects.length > 0 && (
                <Profiler id="MyProjectsSection" onRender={onRenderCallback}>
                  <section className="mb-6" ref={featuredSectionRef}>
                    <h2 className="text-lg font-semibold mb-4 flex items-center">
                      <Users className="h-5 w-5 text-blue-500 mr-2" />
                      My Projects
                      <Badge className="ml-2 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                        {myProjects.length}
                      </Badge>
                    </h2>
                    
                    {/* Always use regular grid layout for consistent display */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {myProjects.map((project) => (
                        <SpotlightCardOptimized 
                          key={project.id}
                          project={project}
                          onProjectUpdated={handleProjectsUpdated}
                          onViewDetails={handleViewDetails}
                          tasks={project.tasks || []}
                          documents={project.documents || []}
                          expenseClaims={project.expense_claims || []}
                        />
                      ))}
                    </div>
                  </section>
                </Profiler>
              )}
              
              {/* Project groups */}
              {Object.entries(groupedProjects).map(([groupName, projects]) => (
                projects.length > 0 && (
                  <motion.section 
                    key={groupName} 
                    className="mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <h2 className="text-lg font-semibold mb-4 flex items-center">
                      {renderGroupIcon(groupName)}
                      {formatGroupName(groupName)}
                      <Badge className="ml-2 bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                        {projects.length}
                      </Badge>
                    </h2>
                    
                    {/* Always use regular grid layout for consistent display */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      <AnimatePresence mode="popLayout">
                        {projects.map((project) => (
                          <SpotlightCardOptimized
                            key={project.id}
                            project={project}
                            onProjectUpdated={handleProjectsUpdated}
                            onViewDetails={handleViewDetails}
                            tasks={project.tasks || []}
                            documents={project.documents || []}
                            expenseClaims={project.expense_claims || []}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </motion.section>
                )
              ))}
              
              {/* Empty state */}
              {totalProjects === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-blue-500 opacity-20 blur-3xl -z-10 rounded-full" />
                    <FolderPlus className="h-20 w-20 text-slate-300 dark:text-slate-700 mb-4" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">No projects yet</h3>
                  <p className="text-slate-600 dark:text-slate-400 max-w-md mb-8">
                    Create your first project to get started. You can add details, assign team members, and track progress.
                  </p>
                  <Button 
                    size="lg"
                    onClick={() => setNewProjectDialogOpen(true)}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                  >
                    <Plus className="mr-2 h-5 w-5" /> Create Your First Project
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      
      {/* Project creation dialog - lazy loaded */}
      <Suspense fallback={null}>
        <NewProjectDialog
          open={newProjectDialogOpen}
          onOpenChange={setNewProjectDialogOpen}
          onProjectAdded={handleProjectsUpdated}
          initialDates={null}
        />
      </Suspense>
      
      {/* EditProjectDialog removed */}
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (selectedProject) {
                  handleProjectDelete(selectedProject);
                  setDeleteDialogOpen(false);
                }
              }}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}