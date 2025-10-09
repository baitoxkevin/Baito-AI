import React, { useMemo, useRef, useEffect, useState, useCallback, memo } from 'react';
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, 
  addMonths, differenceInDays, isSameMonth, isSameDay 
} from 'date-fns';
import { cn, isPublicHoliday, getHolidayDetails, eventColors, formatTimeString, formatRecurringDates, projectsOverlap, getBestTextColor } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calendar, Clock, Users, MapPin, Trash2, Check, List } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import type { Project } from '@/lib/types';

interface ProjectTooltipProps {
  project: Project;
  onDelete?: (project: Project) => void;
  isSelected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
}

const ProjectTooltip = memo(({ project, onDelete, isSelected = false, onSelect }: ProjectTooltipProps) => {
  const { toast } = useToast();

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();

    if (onDelete) {
      try {
        onDelete(project);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete project. Please try again.",
          variant: "destructive",
        });
      }
    }
  }, [onDelete, project, toast]);

  const handleSelect = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(project.id, !isSelected);
    }
  }, [onSelect, project.id, isSelected]);
  
  return (
    <div className="space-y-2 p-2 max-w-xs">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          {onSelect && (
            <Checkbox 
              checked={isSelected}
              onCheckedChange={(checked) => onSelect(project.id, checked === true)}
              onClick={(e) => e.stopPropagation()}
              className="h-3.5 w-3.5"
            />
          )}
          <div className="font-medium">{project.title}</div>
        </div>
        {onDelete && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded-full hover:bg-red-100 hover:text-red-600 -mt-1 -mr-1"
            onClick={handleDelete}
            title="Delete project"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      {project.client?.full_name && (
        <div className="text-sm text-muted-foreground">
          {project.client.full_name}
        </div>
      )}
      <div className="grid gap-2 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>{formatRecurringDates(project)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>
            {formatTimeString(project.working_hours_start)} - {formatTimeString(project.working_hours_end)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>{project.filled_positions}/{project.crew_count} crew members</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <span className="line-clamp-2">{project.venue_address}</span>
        </div>
      </div>
    </div>
  );
});

interface ProjectCardProps {
  project: Project;
  column: number;
  day: Date;
  index: number;
  isActiveDay: boolean;
  onProjectClick: (project: Project) => void;
  onProjectDelete?: (project: Project) => void;
  isSelected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  selectionMode?: boolean;
  zoomLevel?: number; // New prop for zoom level
}

const ProjectCard = ({
  project,
  column,
  day,
  index,
  isActiveDay,
  onProjectClick,
  onProjectDelete,
  isSelected = false,
  onSelect,
  selectionMode = false,
  zoomLevel = 1, // Default to normal zoom if not provided
}: ProjectCardProps) => {
  const startDate = new Date(project.start_date);
  const endDate = project.end_date ? new Date(project.end_date) : startDate;
  
  // For recurring projects, calculate display height based on recurrence pattern
  const duration = differenceInDays(endDate, startDate) + 1;
  
  return (
    <TooltipProvider key={project.id}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className="absolute transition-all duration-200 will-change-transform"
            style={{
              left: `${(column * 95 + 10)}px`, // The parent transform scale will handle zoom
              height: (() => {
                // Calculate display height inline
                let height;
                
                // For multi-month projects
                if (duration > 31) {
                  if (day.getDate() === 1) {
                    // If this is the first day of a month, calculate the exact remaining days
                    // to the project end or to the end of the month, whichever comes first
                    const endOfCurrentMonth = endOfMonth(day);
                    
                    // Calculate days from start date to project end date in this month
                    // If end date is in this month, use that, otherwise use end of month
                    const effectiveEndDate = isSameMonth(day, endDate) ? endDate : endOfCurrentMonth;
                    
                    // Calculate exact number of days to display for this month
                    const daysToShow = differenceInDays(effectiveEndDate, day) + 1;
                    
                    // Use the exact days for display height
                    height = daysToShow * 32 - 4;
                  } else {
                    // Normal calculation for projects starting mid-month
                    height = Math.min(duration * 32 - 4, 31 * 32 - 4);
                  }
                } else {
                  // Normal calculation for regular projects
                  height = Math.min(duration * 32 - 4, 31 * 32 - 4);
                }
                
                // Adjust height for recurring projects with specific days
                if (project.schedule_type === 'recurring' && project.recurrence_days && project.recurrence_days.length <= 2) {
                  // For weekend-only or specific day events, reduce the visual height
                  height = Math.min(8 * 32 - 4, height);
                }
                
                return `${height}px`;
              })(),
              width: '85px',
              zIndex: 10
            }}
            // Ensure this element is never hidden from assistive technologies
            aria-hidden="false"
            data-project-id={project.id}
            data-day={format(day, 'yyyy-MM-dd')}
            data-index={index}
            role="button"
            aria-label={`Project: ${project.title}`}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onProjectClick(project);
              }
            }}
          >
            <div 
              className={cn(
                "rounded-xl border bg-card text-card-foreground shadow h-full",
                "px-1.5 cursor-pointer hover:opacity-80 transition-opacity",
                !project.color ? (eventColors[project.event_type as keyof typeof eventColors] || "bg-blue-200 text-blue-800") : "",
                duration <= 2 ? "flex items-center justify-center" : "flex flex-col justify-center py-0.5",
                isActiveDay && "ring-1 ring-primary",
                isSelected && "ring-2 ring-primary ring-offset-1",
                // Add special classes for multi-month projects
                duration > 31 && day.getDate() === 1 && "multi-month-project",
                // Add a special class if this is the month containing the end date
                duration > 31 && isSameMonth(day, endDate) && day.getDate() === 1 && "project-ends-this-month"
              )}
              onClick={(e) => {
                if (selectionMode && onSelect) {
                  e.stopPropagation();
                  onSelect(project.id, !isSelected);
                } else {
                  onProjectClick(project);
                }
              }}
              style={project.color ? { 
                backgroundColor: project.color,
                color: getBestTextColor(project.color)
              } : {}}
            >
              
              {duration <= 2 ? (
                <div className="text-xs sm:text-[10px] font-medium text-center line-clamp-2">
                  {project.title.length > 20 ? `${project.title.slice(0, 20)}...` : project.title}
                </div>
              ) : (
                <div className="space-y-0.5 w-full">
                  <div className="font-medium text-xs sm:text-[10px] text-center line-clamp-2">
                    {project.title}
                  </div>
                  {/* Show recurrence info for recurring projects */}
                  {project.schedule_type === 'recurring' && project.recurrence_days ? (
                    <div className="text-[8px] sm:text-[7px] font-medium text-center opacity-75">
                      {project.recurrence_days.map(day => 
                        ['Su','Mo','Tu','We','Th','Fr','Sa'][day]
                      ).join(',')}
                    </div>
                  ) : null}
                  <div className="flex flex-col items-center text-[9px] sm:text-[8px] opacity-75 space-y-0.5">
                    <div>{formatTimeString(project.working_hours_start)} - {formatTimeString(project.working_hours_end)}</div>
                    <div>{project.filled_positions}/{project.crew_count} crew</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" align="start">
          <ProjectTooltip 
            project={project} 
            onDelete={onProjectDelete}
            isSelected={isSelected}
            onSelect={selectionMode ? onSelect : undefined}
          />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface ListViewProps {
  date: Date;
  projects: Project[];
  onProjectClick: (project: Project) => void;
  onProjectDelete?: (project: Project) => void;
  selectionMode?: boolean;
  selectedProjects?: string[];
  onProjectSelect?: (id: string, selected: boolean) => void;
  onLoadMoreMonths?: (direction: 'past' | 'future', months: number) => void;
  monthsToShow?: number;
  syncToDate?: boolean; // Force ListView to sync with parent's date
  onMonthChange?: (newDate: Date) => void; // Notify parent when month changes
  onViewChange?: (view: 'calendar' | 'list') => void;
  currentView?: 'calendar' | 'list';
}

export default function ListView({
  date,
  projects,
  onProjectClick,
  onProjectDelete,
  selectionMode = false,
  selectedProjects = [],
  onProjectSelect,
  onLoadMoreMonths,
  monthsToShow = 3, // Default to showing 3 months (current + 1 past + 1 future)
  syncToDate = false,
  onMonthChange,
  onViewChange,
  currentView = 'list',
}: ListViewProps) {
  // Safety check for required props
  if (!date) {
    console.error('ListView: date prop is required but was not provided');
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-600">Error: date prop is required</p>
      </div>
    );
  }

  if (!Array.isArray(projects)) {
    console.error('ListView: projects prop must be an array, received:', typeof projects);
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-yellow-600">Warning: No projects to display (invalid data format)</p>
      </div>
    );
  }
  // Calculate the number of past and future months to show - expanded to a full year
  const MAX_PAST_MONTHS = 24;  // Expanded to 2 years in the past
  const MAX_FUTURE_MONTHS = 24; // Expanded to 2 years in the future
  
  // Always include the current month, then distribute remaining months
  // We want the current month plus adjacent months, not to skip months
  const pastMonths = Math.min(MAX_PAST_MONTHS, Math.floor(monthsToShow / 2));
  const futureMonths = Math.min(MAX_FUTURE_MONTHS, Math.floor(monthsToShow / 2));
  
  // Get dates for multiple months, centered around the current date
  // Use a memoization key to prevent unnecessary recalculations - with stable reference
  const memoKey = useMemo(() => {
    // Only output to console on significant changes
    const key = `${date.getFullYear()}-${date.getMonth()}-${pastMonths}-${futureMonths}`;
    return key;
  }, [date.getFullYear(), date.getMonth(), pastMonths, futureMonths]); // More stable dependency array
    
  // Store scroll position to preserve it during data loads
  const scrollPositionRef = useRef<number>(0);
    
  // Add a loading state to control when to show content
  const [isDataLoading, setIsDataLoading] = useState(true);
  
  // Save scroll position before data loads
  useEffect(() => {
    if (containerRef.current) {
      scrollPositionRef.current = containerRef.current.scrollTop;
    }
  }, [memoKey]);
    
  // Memoized dates calculation with key to prevent unnecessary recalculations
  const datesInfoRef = useRef({ lastMemoKey: '', calculationCount: 0 });
  
  const dates = useMemo(() => {
    // Only log if memo key changed (avoid console spam)
    if (datesInfoRef.current.lastMemoKey !== memoKey) {
      datesInfoRef.current.calculationCount++;
      datesInfoRef.current.lastMemoKey = memoKey;
      
      // Log with calculation count to track how often this runs
      console.log(`Calculating dates [#${datesInfoRef.current.calculationCount}] for: ${memoKey}`);
    }
    
    try {
      // Guard against invalid date
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        console.error('Invalid date provided to ListView:', date);
        // Default to current date if invalid
        const currentDate = new Date();
        
        // Calculate start date (subtracting past months)
        const startDate = startOfMonth(addMonths(currentDate, -pastMonths));
        
        // Calculate end date (adding future months)
        const endDate = endOfMonth(addMonths(currentDate, futureMonths));
        
        console.warn('Using current date as fallback for ListView date calculation');
        return eachDayOfInterval({ start: startDate, end: endDate });
      }
      
      // Calculate start date (subtracting past months)
      const startDate = startOfMonth(addMonths(date, -pastMonths));
      
      // Calculate end date (adding future months)
      const endDate = endOfMonth(addMonths(date, futureMonths));
      
      // Safety check to ensure we're not generating a ridiculously large date range
      const dayDiff = differenceInDays(endDate, startDate);
      if (dayDiff > 366 * 3) { // More than 3 years
        console.warn(`Date range too large (${dayDiff} days). Limiting to 3 years.`);
        const limitedEndDate = addMonths(startDate, 36); // 3 years total
        return eachDayOfInterval({ start: startDate, end: limitedEndDate });
      }
      
      return eachDayOfInterval({ start: startDate, end: endDate });
    } catch (error) {
      console.error('Error calculating date range for ListView:', error);
      // Fall back to current month with reduced range
      const currentDate = new Date();
      const startDate = startOfMonth(addMonths(currentDate, -1));
      const endDate = endOfMonth(addMonths(currentDate, 1));
      return eachDayOfInterval({ start: startDate, end: endDate });
    }
  }, [memoKey, date, pastMonths, futureMonths]); // Include all dependencies explicitly
  
  // Find today's date index for scrolling
  const todayIndex = useMemo(() => {
    // Use current date from system - explicitly use the correct date object
    const today = new Date();
    
    // Make sure we have valid dates to search
    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      console.warn('No valid dates array to find today\'s index');
      return -1;
    }
    
    // Check both date and year when finding today's index
    const index = dates.findIndex(d => 
      d instanceof Date && 
      !isNaN(d.getTime()) && 
      isSameDay(d, today) && 
      d.getFullYear() === today.getFullYear()
    );
    
    if (index === -1) {
      console.log(`Today's date (${today.toISOString()}) not found in available dates range`);
    }
    
    return index;
  }, [dates]);

  // Track render counts to minimize logging
  const processCountRef = useRef(0);
  
  // Process projects to determine columns without overlaps
  const processedProjects = useMemo(() => {
    // Only do detailed logging on the first few renders to avoid console spam
    processCountRef.current++;
    const isInitialRender = processCountRef.current <= 2;
    
    // Check for valid date
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      console.error('Invalid date provided to processedProjects in ListView:', date);
      return { projectsByDate: new Map(), maxColumn: 0, projectColumns: new Map() };
    }
    
    if (isInitialRender) {
      try {
        console.log(`Processing projects for ListView with date: ${format(date, 'MMMM yyyy')} (render #${processCountRef.current})`);
        console.log(`Total projects available: ${projects.length}`);
        if (dates && dates.length > 0) {
          console.log(`Date range: ${dates[0]?.toISOString()} to ${dates[dates.length-1]?.toISOString()}`);
        }
      } catch (error) {
        console.error('Error logging date info in processedProjects:', error);
      }
    }
    
    // Guard against empty dates array
    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      console.error('Dates array is empty or invalid');
      return { projectsByDate: new Map(), maxColumn: 0, projectColumns: new Map() };
    }
    
    // Only log sample projects on initial renders or if there's a significant change
    if (isInitialRender || projects.length > 0) {
      console.log(`${projects.length} projects available ` + 
                 (projects.length > 0 ? `(e.g., "${projects[0]?.title}")` : ""));
    } else if (projects.length === 0) {
      // Always log when no projects are available as this is likely an issue
      console.warn('No projects available to display');
    }
    
    // Guard against invalid dates in projects
    const validProjects = projects.filter(project => {
      // Ensure project has a valid start_date
      if (!project.start_date) {
        console.warn(`Project ${project.id} has no start_date, skipping`);
        return false;
      }
      
      try {
        // Verify we can parse the date (will throw if invalid)
        const testDate = new Date(project.start_date);
        return testDate instanceof Date && !isNaN(testDate.getTime());
      } catch (e) {
        console.warn(`Project ${project.id} has invalid date format: ${project.start_date}`);
        return false;
      }
    });
    
    if (isInitialRender) console.log(`Filtered to ${validProjects.length} projects with valid dates`);
    
    // IMPORTANT DEBUG MESSAGE
    console.log(`Received ${validProjects.length} valid projects to display`);
    
    // Filter projects with a more lenient approach for real data
    // IMPORTANT: For ListView, we want to show ALL projects we receive
    // The parent component (CalendarPage) should handle the month filtering
    const relevantProjects = validProjects.filter(project => {
      try {
        const projectStart = new Date(project.start_date);
        const projectEnd = project.end_date ? new Date(project.end_date) : projectStart;

        // Make sure dates array isn't empty
        if (!dates.length) {
          return true; // Show all projects if date range is empty
        }

        // Get visible date range
        const visibleStartDate = dates[0];
        const visibleEndDate = dates[dates.length - 1];

        // VERY PERMISSIVE FILTER - Show any project that could be relevant
        // This includes projects that:
        // 1. Start within the visible range
        // 2. End within the visible range
        // 3. Span across the visible range
        // 4. Are anywhere near the visible range (within 2 years)
        const twoYearsMs = 2 * 365 * 24 * 60 * 60 * 1000;

        // Standard overlap checks
        const projectStartsInRange = projectStart >= visibleStartDate && projectStart <= visibleEndDate;
        const projectEndsInRange = projectEnd >= visibleStartDate && projectEnd <= visibleEndDate;
        const projectSpansRange = projectStart <= visibleStartDate && projectEnd >= visibleEndDate;

        // Very permissive proximity check - within 2 years of visible range
        const projectNearRange =
          Math.abs(projectStart.getTime() - visibleStartDate.getTime()) < twoYearsMs ||
          Math.abs(projectStart.getTime() - visibleEndDate.getTime()) < twoYearsMs ||
          Math.abs(projectEnd.getTime() - visibleStartDate.getTime()) < twoYearsMs ||
          Math.abs(projectEnd.getTime() - visibleEndDate.getTime()) < twoYearsMs;

        // Return true for any project that matches any condition
        const shouldShow = projectStartsInRange || projectEndsInRange || projectSpansRange || projectNearRange;

        if (!shouldShow && isInitialRender) {
          // Log why this project was filtered out for debugging
          console.log(`Project ${project.title} filtered out:`, {
            projectStart: format(projectStart, 'yyyy-MM-dd'),
            projectEnd: format(projectEnd, 'yyyy-MM-dd'),
            visibleStart: format(visibleStartDate, 'yyyy-MM-dd'),
            visibleEnd: format(visibleEndDate, 'yyyy-MM-dd')
          });
        }

        return shouldShow;
      } catch (e) {
        console.error(`Error processing project date filter: ${project.id}`, e);
        // In case of error, show the project rather than hide it
        return true;
      }
    });
    
    // Log sample projects
    if (relevantProjects.length > 0) {
      console.log(`FILTERED TO ${relevantProjects.length} RELEVANT PROJECTS:`);
      relevantProjects.slice(0, 3).forEach(project => {
        try {
          const projectStart = new Date(project.start_date);
          const projectEnd = project.end_date ? new Date(project.end_date) : projectStart;
          console.log(`Project ${project.id}: ${project.title} - ${format(projectStart, 'MM/dd/yyyy')} to ${format(projectEnd, 'MM/dd/yyyy')}`);
        } catch (e) {
          console.error(`Error showing sample project ${project.id}:`, e);
        }
      });
    } else {
      console.warn("NO PROJECTS PASSED FILTERING - showing a few sample valid projects:");
      validProjects.slice(0, 3).forEach(project => {
        try {
          const projectStart = new Date(project.start_date);
          const projectEnd = project.end_date ? new Date(project.end_date) : projectStart;
          console.log(`Project ${project.id}: ${project.title} - ${format(projectStart, 'MM/dd/yyyy')} to ${format(projectEnd, 'MM/dd/yyyy')}`);
        } catch (e) {
          console.error(`Error showing sample project ${project.id}:`, e);
        }
      });
    }
    
    if (isInitialRender) console.log(`Filtered to ${relevantProjects.length} projects relevant to visible date range`);
    
    // If no relevant projects found, but we have valid projects, check filter conditions (only on first few renders)
    if (relevantProjects.length === 0 && validProjects.length > 0 && isInitialRender) {
      console.log('All projects were filtered out by date range. Checking sample projects...');
      
      // Log only a couple of projects to avoid console spam
      const sampleProjects = validProjects.slice(0, Math.min(2, validProjects.length));
      
      // Concise logging format
      sampleProjects.forEach(project => {
        try {
          const projectStart = new Date(project.start_date);
          const projectEnd = project.end_date ? new Date(project.end_date) : projectStart;
          
          console.log(`Project "${project.title}": ${format(projectStart, 'yyyy-MM-dd')} to ${format(projectEnd, 'yyyy-MM-dd')}`);
        } catch (e) {
          console.error(`Error logging project ${project.id} dates`);
        }
      });
      
      // If we skipped some, indicate this
      if (validProjects.length > sampleProjects.length) {
        console.log(`... and ${validProjects.length - sampleProjects.length} more projects`);
      }
    }
    
    // First, sort projects by start date
    const sortedProjects = [...relevantProjects].sort((a, b) => 
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );
    
    // Track columns for each project
    const projectColumns = new Map<string, number>();
    
    // Assign columns to projects
    sortedProjects.forEach(project => {
      let column = 0;
      let hasOverlap = true;
      
      while (hasOverlap) {
        hasOverlap = false;
        
        // Check if this project overlaps with any other project in the same column
        for (const [id, col] of projectColumns.entries()) {
          if (col !== column) continue; // Skip if in different column
          
          const otherProject = sortedProjects.find(p => p.id === id);
          if (!otherProject) continue;
          
          if (projectsOverlap(project, otherProject)) {
            hasOverlap = true;
            column++;
            break;
          }
        }
      }
      
      // Assign the column
      projectColumns.set(project.id, column);
    });
    
    // Group projects by date
    const projectsByDate = new Map<string, { project: Project, column: number, index: number }[]>();
    
    // Initialize all dates
    dates.forEach(date => {
      projectsByDate.set(format(date, 'yyyy-MM-dd'), []);
    });
    
    // Assign projects to dates
    sortedProjects.forEach((project, index) => {
      try {
        const startDate = new Date(project.start_date);
        const endDate = project.end_date ? new Date(project.end_date) : startDate;
        const column = projectColumns.get(project.id) || 0;
        
        // Safeguard against invalid date calculations
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          console.warn(`Project ${project.id} has invalid date, skipping assignment`);
          return;
        }
        
        // Add this project to all dates it spans
        // Don't truncate project dates at the edge of the visible calendar for display purposes
        // This ensures proper visual representation of long-term events
        const projectDates = eachDayOfInterval({
          start: startDate,
          end: endDate
        }).filter(day => {
          // But still only include dates that are within our visible range in the calendar
          return day >= dates[0] && day <= dates[dates.length - 1];
        });
        
        projectDates.forEach(day => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const existingProjects = projectsByDate.get(dateKey) || [];
          
          // Only add if not already added (prevents duplicates)
          if (!existingProjects.some(p => p.project.id === project.id)) {
            existingProjects.push({ project, column, index });
            projectsByDate.set(dateKey, existingProjects);
          }
        });
      } catch (e) {
        console.error(`Error assigning project ${project.id} to dates:`, e);
      }
    });
    
    // Get the maximum column for calculating width
    const maxColumn = Math.max(...Array.from(projectColumns.values()), 0);
    
    // Only log results on initial renders to reduce console spam
    if (isInitialRender) {
      console.log(`Generated projectsByDate with ${projectsByDate.size} dates and max column ${maxColumn}`);
    }
    
    return { projectsByDate, maxColumn, projectColumns };
  }, [projects, dates, date]);

  // Calculate width based on number of columns and zoom level
  // Scale factor: 1 = 100% (max), 0.5 = 50% (min), we don't allow zooming in beyond 100%
  // Persist zoom level in localStorage to prevent reset during re-renders
  const [zoomLevel, setZoomLevel] = useState(() => {
    try {
      // Try to read from localStorage first
      const stored = localStorage.getItem('calendar_list_zoom_level');
      if (stored) {
        const parsed = parseFloat(stored);
        // Validate the stored value is within valid range
        if (!isNaN(parsed) && parsed >= 0.5 && parsed <= 1) {
          return parsed;
        }
      }
      // Default to 100% zoom (1.0) for better readability
      localStorage.setItem('calendar_list_zoom_level', '1.0');
      return 1.0;
    } catch (e) {
      // Default to 1.0 (100%) if anything goes wrong
      return 1.0;
    }
  });
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null);
  const [initialZoom, setInitialZoom] = useState<number>(zoomLevel); // Use the loaded zoom level
  // Track current visible position for zoom operations
  const [visibleTopPosition, setVisibleTopPosition] = useState<number | null>(null);
  const columnWidth = 95 * zoomLevel; // Width for each project column, adjusted by zoom
  const minContentWidth = Math.max(300, (processedProjects.maxColumn + 1) * columnWidth + 40); // Adjusted for zoom
  
  // Ref for container scrolling
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track if we're loading more data with refs instead of state to avoid re-renders
  const isLoadingMoreRef = useRef(false);
  const scrolledToTodayRef = useRef(false);
  
  // Additional refs for scroll loading control
  const reachedBeginningRef = useRef(false);
  const reachedEndRef = useRef(false);
  const disableTopLoadingRef = useRef(false);
  const disableBottomLoadingRef = useRef(false);
  
  // Initialize flags - always start with loading enabled
  useEffect(() => {
    // Reset flags on each component mount
    disableTopLoadingRef.current = false;
    disableBottomLoadingRef.current = false;
    reachedBeginningRef.current = false;
    reachedEndRef.current = false;
    console.log('Initialized ListView with all scroll loading flags enabled');
  }, []);
  

  
  // Add scroll event listener to detect when we need to load more months
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onLoadMoreMonths) return;
    
    // Track last scroll position to prevent repeated triggers
    let lastScrollTop = 0;
    let lastScrollTriggeredAt = 0;
    const DEBOUNCE_TIME = 3000; // Increased minimum time between load triggers in ms
    
    // Add a handler for when scroll reaches absolute top (scrollTop = 0)
    const handleScrollTop = () => {
      if (container.scrollTop === 0) {
        // We've reached the absolute top - disable top loading completely
        disableTopLoadingRef.current = true;
        console.log("Top reached - disabling top loading completely");
        
        // Don't store this preference in localStorage anymore
        // We want to reset this on each page load
        console.log('Top reached, disabling for this session only');
      }
    };
    
    // Add a handler for when scroll reaches absolute bottom
    const handleScrollBottom = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      
      // Check if we're at the bottom (with 1px margin of error)
      if (Math.abs(scrollHeight - scrollTop - clientHeight) <= 1) {
        // We've reached the absolute bottom - disable bottom loading completely
        disableBottomLoadingRef.current = true;
        console.log("Bottom reached - disabling bottom loading completely");
        
        // Don't store this preference in localStorage anymore
        // We want to reset this on each page load
        console.log('Bottom reached, disabling for this session only');
      }
      
      // Always show the month indicator when scrolling
      showFloatingMonthIndicator();
    };
    
    const handleScroll = () => {
      // Always show the month indicator when scrolling, regardless of loading state
      showFloatingMonthIndicator();
      
      // Don't process if already loading
      if (isLoadingMoreRef.current) return;
      
      // Check if scrollTop is literally 0 (absolute top)
      if (container.scrollTop === 0) {
        handleScrollTop();
        return; // Skip all processing at absolute top
      }
      
      // Check if we're at the absolute bottom
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (Math.abs(scrollHeight - scrollTop - clientHeight) <= 1) {
        handleScrollBottom();
        return; // Skip all processing at absolute bottom
      }
      
      // Variables were already declared above
      const buffer = 150; // Reduced buffer from top to be less sensitive
      const now = Date.now();
      
      // Check if we've just triggered a load recently
      if (now - lastScrollTriggeredAt < DEBOUNCE_TIME) {
        // Skip this scroll event - too soon after the last one
        return;
      }
      
      // Check for rapid, oscillating scrolls (user is likely just bouncing at the edge)
      const scrollDiff = Math.abs(scrollTop - lastScrollTop);
      // More aggressive filtering of small movements, especially at the top
      if (scrollDiff < 20 || scrollTop < 10 || (scrollHeight - scrollTop - clientHeight) < 10) {
        // Small movements anywhere, or any movements at extreme edges - ignore
        return;
      }
      
      // Load past months when scrolling near the top - with extra conditions
      // Check disableTopLoadingRef, reachedBeginningRef, and require significant upward movement
      if (!disableTopLoadingRef.current && // Complete top loading disabled check
          scrollTop < buffer && 
          scrollTop < lastScrollTop && 
          !reachedBeginningRef.current && 
          scrollDiff > 30) { // Only trigger with significant upward movement
        if (onLoadMoreMonths && !isLoadingMoreRef.current) {
          // Remember when we triggered a load
          lastScrollTriggeredAt = now;
          isLoadingMoreRef.current = true;
          console.log("Loading past months from scroll");
          
          // Check if we have already reached the past months limit
          if (pastMonths >= MAX_PAST_MONTHS) {
            console.log(`Already at maximum past limit (${MAX_PAST_MONTHS} months)`);
            // Set flag to prevent further attempts
            reachedBeginningRef.current = true;
            
            // Use toast notification instead of DOM manipulation
            try {
              // This will fail gracefully if toast isn't available
              const toastEvent = new CustomEvent('showToast', { 
                detail: {
                  title: 'Limit Reached',
                  description: `Maximum past history reached (${MAX_PAST_MONTHS} months)`,
                  variant: 'warning',
                  duration: 2000
                }
              });
              window.dispatchEvent(toastEvent);
            } catch (e) {
              console.warn('Toast notification failed:', e);
            }
            
            isLoadingMoreRef.current = false;
            return;
          }
          
          // Preserve scroll position after new content is loaded
          const currentScrollPos = scrollTop;
          const initialHeight = scrollHeight;
          
          try {
            onLoadMoreMonths('past', 2);
          } catch (e) {
            console.error("Error loading past months:", e);
          }
          
          // Use a timeout to wait for the DOM to update
          setTimeout(() => {
            if (container) {
              const newHeight = container.scrollHeight;
              const heightDiff = newHeight - initialHeight;
              
              if (heightDiff > 0) {
                // Content was added, adjust scroll position
                container.scrollTop = currentScrollPos + heightDiff;
              } else {
                // No content added, we might have reached the limit
                console.log('You have reached the beginning of available data');
                
                // Mark that we've reached the beginning to prevent more attempts
                reachedBeginningRef.current = true;
                
                // Use toast instead of DOM manipulation
                try {
                  const toastEvent = new CustomEvent('showToast', { 
                    detail: {
                      title: 'Limit Reached',
                      description: 'You have reached the beginning of available data',
                      variant: 'info',
                      duration: 2000
                    }
                  });
                  window.dispatchEvent(toastEvent);
                } catch (e) {
                  console.warn('Toast notification failed:', e);
                }
              }
              
              isLoadingMoreRef.current = false;
            }
          }, 500);
        }
      }
      
      // Load future months when scrolling near the bottom with more robust checks
      if (!disableBottomLoadingRef.current && // Complete bottom loading disabled check
          (scrollHeight - scrollTop - clientHeight) < buffer && 
          scrollTop > lastScrollTop && 
          !reachedEndRef.current && 
          scrollDiff > 30 && // Only when significant downward movement
          (scrollHeight - scrollTop - clientHeight) > 5) { // Not at absolute bottom
        if (onLoadMoreMonths && !isLoadingMoreRef.current) {
          // Remember when we triggered a load
          lastScrollTriggeredAt = now;
          isLoadingMoreRef.current = true;
          console.log("Loading future months from scroll");
          
          // Check if we have already reached the future months limit
          if (futureMonths >= MAX_FUTURE_MONTHS) {
            console.log(`Already at maximum future limit (${MAX_FUTURE_MONTHS} months)`);
            // Set flag to prevent further attempts
            reachedEndRef.current = true;
            
            // Use toast notification instead of DOM manipulation
            try {
              // This will fail gracefully if toast isn't available
              const toastEvent = new CustomEvent('showToast', { 
                detail: {
                  title: 'Limit Reached',
                  description: `Maximum future date reached (${MAX_FUTURE_MONTHS} months)`,
                  variant: 'warning',
                  duration: 2000
                }
              });
              window.dispatchEvent(toastEvent);
            } catch (e) {
              console.warn('Toast notification failed:', e);
            }
            
            isLoadingMoreRef.current = false;
            return;
          }
          
          const initialHeight = scrollHeight;
          
          try {
            onLoadMoreMonths('future', 2);
          } catch (e) {
            console.error("Error loading future months:", e);
          }
          
          // Use a timeout to wait for the DOM to update
          setTimeout(() => {
            if (container) {
              const newHeight = container.scrollHeight;
              const heightDiff = newHeight - initialHeight;
              
              if (heightDiff === 0) {
                // No content added, we might have reached the limit
                console.log('You have reached the end of available data');
                
                // Mark that we've reached the end to prevent more attempts
                reachedEndRef.current = true;
                
                // Use toast instead of DOM manipulation
                try {
                  const toastEvent = new CustomEvent('showToast', { 
                    detail: {
                      title: 'Limit Reached',
                      description: 'You have reached the end of available data',
                      variant: 'info',
                      duration: 2000
                    }
                  });
                  window.dispatchEvent(toastEvent);
                } catch (e) {
                  console.warn('Toast notification failed:', e);
                }
              }
              
              isLoadingMoreRef.current = false;
            }
          }, 500);
        }
      }
      
      // Update last scroll position for next comparison
      lastScrollTop = scrollTop;
    };
    
    // Use requestAnimationFrame for smoother scroll handling
    let scrollRAF: number | null = null;
    let lastScrollTime = 0;
    const THROTTLE_MS = 50; // Lower value for smoother scrolling
    
    const throttledScrollHandler = () => {
      const now = Date.now();
      
      // Cancel any pending animation frame
      if (scrollRAF !== null) {
        window.cancelAnimationFrame(scrollRAF);
      }
      
      // Throttle execution to avoid excessive updates
      if (now - lastScrollTime >= THROTTLE_MS) {
        lastScrollTime = now;
        handleScroll();
      } else {
        // Queue up a throttled execution using requestAnimationFrame for smoother handling
        scrollRAF = window.requestAnimationFrame(() => {
          lastScrollTime = Date.now();
          handleScroll();
          scrollRAF = null;
        });
      }
    };
    
    container.addEventListener('scroll', throttledScrollHandler, { passive: true }); // Add passive flag to improve performance
    
    return () => {
      container.removeEventListener('scroll', throttledScrollHandler);
      if (scrollRAF !== null) {
        window.cancelAnimationFrame(scrollRAF);
      }
    };
  }, [onLoadMoreMonths, pastMonths, futureMonths, MAX_PAST_MONTHS, MAX_FUTURE_MONTHS]);
  
  // Refs were moved to the top level of the component
  
  // Reset loading ref when onLoadMoreMonths changes
  useEffect(() => {
    isLoadingMoreRef.current = false;
    
    // Reset when loading parameters change
    if (pastMonths === 1) reachedBeginningRef.current = false;
    if (futureMonths === 1) reachedEndRef.current = false;
  }, [onLoadMoreMonths, pastMonths, futureMonths]);
  
  // State to track the current visible month - always initialized from the date prop
  const [visibleMonth, setVisibleMonth] = useState<string>(format(date, 'MMMM yyyy'));
  const [visibleYear, setVisibleYear] = useState<number>(date.getFullYear());
  
  // Track if initial scroll has been done
  const hasInitialScroll = useRef(false);
  
  // Scroll to a specific date
  const scrollToDate = useCallback((targetDate: Date, behavior: ScrollBehavior = 'smooth') => {
    const container = containerRef.current;
    if (!container) return;

    const targetMonthStr = format(targetDate, 'MMMM yyyy');
    const monthElement = document.querySelector(`[data-month-marker="${targetMonthStr}"]`) as HTMLElement;
    
    if (monthElement) {
      const topPosition = monthElement.offsetTop;
      container.scrollTo({
        top: topPosition - 100,
        behavior
      });
    }
  }, []);
  
  // Keep reference of previous date to avoid unnecessary scrolling
  const prevDateRef = useRef(date);
  
  // Sync with parent date when syncToDate is true
  useEffect(() => {
    if (syncToDate && date) {
      // Use instant scroll for sync operations
      scrollToDate(date, 'instant');
      setVisibleMonth(format(date, 'MMMM yyyy'));
      setVisibleYear(date.getFullYear());
    }
  }, [date, syncToDate, scrollToDate]);

  // Scroll to the current month on initial load
  useEffect(() => {
    if (!hasInitialScroll.current && dates.length > 0 && !syncToDate) {
      hasInitialScroll.current = true;
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        const targetDate = date || new Date();
        scrollToDate(targetDate);
        setVisibleMonth(format(targetDate, 'MMMM yyyy'));
        setVisibleYear(targetDate.getFullYear());
      }, 100);
    }
  }, [dates, scrollToDate, date, syncToDate]);
  
  // Implement pinch-to-zoom functionality
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // Calculate distance between two touch points
    const getDistance = (touch1: Touch, touch2: Touch): number => {
      const dx = touch1.clientX - touch2.clientX;
      const dy = touch1.clientY - touch2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };
    
    // Handle touch start - detect two-finger touch for pinch
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        // Store the initial distance between the two touch points
        const distance = getDistance(e.touches[0], e.touches[1]);
        setInitialPinchDistance(distance);
        setInitialZoom(zoomLevel);
      }
    };
    
    // Handle touch move - calculate zoom level based on pinch gesture
    const handleTouchMove = (e: TouchEvent) => {
      if (initialPinchDistance && e.touches.length === 2) {
        // Calculate current distance between touch points
        const currentDistance = getDistance(e.touches[0], e.touches[1]);
        
        // Calculate zoom ratio
        const ratio = currentDistance / initialPinchDistance;
        
        // Apply zoom with limits (0.5 to 1.0 maximum)
        const newZoomLevel = Math.max(0.5, Math.min(1.0, initialZoom * ratio));
        setZoomLevel(newZoomLevel);
        persistZoomLevel(newZoomLevel);
        
        // Prevent default behavior (like page scrolling)
        e.preventDefault();
      }
    };
    
    // Handle touch end - reset pinch state
    const handleTouchEnd = () => {
      setInitialPinchDistance(null);
    };
    
    // Handle wheel event for mouse zoom
    const handleWheel = (e: WheelEvent) => {
      // Check if ctrl key is pressed for pinch zoom simulation
      if (e.ctrlKey) {
        // Determine zoom direction (in or out)
        const delta = e.deltaY < 0 ? 0.1 : -0.1;
        
        // Calculate new zoom level with limits (max 100%, min 50%)
        let newZoomLevel = zoomLevel + delta;
        
        // Apply limits
        if (newZoomLevel > 1) {
          newZoomLevel = 1; // Max 100%
        } else if (newZoomLevel < 0.5) {
          newZoomLevel = 0.5; // Min 50%
        }
        
        setZoomLevel(newZoomLevel);
        persistZoomLevel(newZoomLevel);
        
        // Prevent default behavior (page zoom)
        e.preventDefault();
      }
    };
    
    // Add event listeners
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('wheel', handleWheel);
    
    // Clean up event listeners
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('wheel', handleWheel);
    };
  }, [zoomLevel, initialPinchDistance, initialZoom]);
  
  // Ref for storing month positions for better performance
  const monthPositionsRef = useRef<Map<string, number>>(new Map());
  
  // Add a scroll handler to detect which month is visible
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // Month day elements by their ID
    const monthDayElements = new Map<string, HTMLElement>();
    
    // Populate month elements map
    dates.forEach((day, index) => {
      if (day.getDate() === 1) {
        // First day of month
        const monthString = format(day, 'MMMM yyyy');
        monthDayElements.set(monthString, 
          document.querySelector(`[data-month-marker="${monthString}"]`) as HTMLElement);
      }
    });
    
    // Calculate month positions only once on mount or when dates change
    if (monthPositionsRef.current.size === 0 && monthDayElements.size > 0) {
      monthDayElements.forEach((element, monthString) => {
        if (element) {
          // Store offsetTop which doesn't change with scrolling (unlike getBoundingClientRect)
          monthPositionsRef.current.set(monthString, element.offsetTop);
        }
      });
    }
    
    const handleScroll = () => {
      // Get scroll position
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const scrollMid = scrollTop + (containerHeight / 2); // Middle of viewport
      
      // Find which month is most visible
      let closestMonth = "";
      let closestDistance = Infinity;
      let shouldShowMonthIndicator = false;
      
      // Always default to the current date's month if nothing else is determined
      if (monthPositionsRef.current.size === 0) {
        closestMonth = format(date, 'MMMM yyyy');
      } else {
        // Use cached positions for better performance
        monthPositionsRef.current.forEach((position, monthString) => {
          // Calculate distance from viewport center to month position
          // We use position - scrollTop to convert from absolute to viewport relative
          const elementViewportPos = position - scrollTop;
          const distance = Math.abs(elementViewportPos - containerHeight/2);
          
          // Check if the first line and second line of the month are visible
          // We'll consider a month "centered enough" if its top position is visible
          // and at least two rows (64px) are visible
          const element = monthDayElements.get(monthString);
          if (element) {
            const rect = element.getBoundingClientRect();
            const firstLineVisible = rect.top > 0 && rect.top < containerHeight;
            const secondLineVisible = rect.top + 64 < containerHeight;
            
            // Only consider this month for showing indicator if it's centered enough
            if (firstLineVisible && secondLineVisible && distance < 150) {
              shouldShowMonthIndicator = true;
            }
          }
          
          if (distance < closestDistance) {
            closestDistance = distance;
            closestMonth = monthString;
          }
        });
        
        // If we still didn't find a month (all might be out of view), use current date
        if (!closestMonth) {
          closestMonth = format(date, 'MMMM yyyy');
        }
      }
      
      // Update the visible month if it's valid and different
      if (closestMonth && closestMonth !== visibleMonth) {
        console.log(`Updating visible month: ${closestMonth}`);
        setVisibleMonth(closestMonth);
        
        // Only show month indicator when the month is centered properly
        if (shouldShowMonthIndicator) {
          showFloatingMonthIndicator();
        }
      }
    };
    
    // Use requestAnimationFrame for smoother visual updates
    let scrollTimeout: number;
    
    // Run once initially to set the visible month
    scrollTimeout = window.setTimeout(() => {
      requestAnimationFrame(handleScroll);
    }, 200);
    
    // Use requestAnimationFrame for smoother scroll handling
    let scrollRAF: number | null = null;
    let lastScrollTime = 0;
    const SCROLL_THROTTLE_MS = 50; // Lower value for smoother scrolling
    
    const optimizedScrollHandler = () => {
      // Don't show indicator immediately, let the month detection logic decide
      // when it's appropriate based on scroll position
      
      const now = Date.now();
      
      // Cancel any pending animation frame
      if (scrollRAF !== null) {
        window.cancelAnimationFrame(scrollRAF);
      }
      
      // Throttle execution to avoid excessive updates
      if (now - lastScrollTime >= SCROLL_THROTTLE_MS) {
        lastScrollTime = now;
        handleScroll();
      } else {
        // Queue up a throttled execution using requestAnimationFrame
        scrollRAF = window.requestAnimationFrame(() => {
          lastScrollTime = Date.now();
          handleScroll();
          scrollRAF = null;
        });
      }
    };
    
    // Add scroll event listener with passive flag for performance
    container.addEventListener('scroll', optimizedScrollHandler, { passive: true });
    
    return () => {
      window.clearTimeout(scrollTimeout);
      window.clearTimeout(floatingMonthTimeoutRef.current || undefined);
      if (scrollRAF !== null) {
        window.cancelAnimationFrame(scrollRAF);
      }
      container.removeEventListener('scroll', optimizedScrollHandler);
    };
  }, [dates, visibleMonth]);

  // Helper function to safely persist zoom level to localStorage
  const persistZoomLevel = (level: number) => {
    try {
      localStorage.setItem('calendar_list_zoom_level', level.toString());
    } catch (e) {
      console.warn('Could not save zoom level to localStorage:', e);
    }
  };
  
  // Reset zoom level to default while maintaining scroll position
  const handleResetZoom = () => {
    if (!containerRef.current) return;
    
    // Store the current visible element before zooming
    const currentScrollTop = containerRef.current.scrollTop;
    const containerHeight = containerRef.current.clientHeight;
    const centerY = currentScrollTop + (containerHeight / 2);
    
    // Remember this position to scroll back after zoom change
    setVisibleTopPosition(centerY);
    
    const prevZoom = zoomLevel;
    const newZoom = 1;
    
    // Apply the new zoom
    setZoomLevel(newZoom);
    persistZoomLevel(newZoom);
    
    // Use a timeout to ensure DOM updates
    setTimeout(() => {
      if (containerRef.current && visibleTopPosition !== null) {
        // Calculate new scroll position to keep the same content in view
        const ratio = newZoom / prevZoom;
        const newScrollTop = (visibleTopPosition * ratio) - (containerHeight / 2);
        containerRef.current.scrollTop = newScrollTop;
        
        // Reset stored position
        setVisibleTopPosition(null);
      }
    }, 50);
  };
  
  // Zoom in by 0.1 up to 100% max while maintaining scroll position
  const handleZoomIn = () => {
    if (!containerRef.current || zoomLevel >= 1) return; // Already at 100%
    
    // Store the current visible element before zooming
    const currentScrollTop = containerRef.current.scrollTop;
    const containerHeight = containerRef.current.clientHeight;
    const centerY = currentScrollTop + (containerHeight / 2);
    
    // Remember this position to scroll back after zoom change
    setVisibleTopPosition(centerY);
    
    // Update zoom level
    setZoomLevel(prev => {
      const newZoom = Math.min(1, prev + 0.1);
      persistZoomLevel(newZoom);
      
      // Use a setTimeout to allow the DOM to update with the new zoom level
      setTimeout(() => {
        if (containerRef.current && visibleTopPosition !== null) {
          // Calculate new scroll position based on zoom ratio to keep same content in view
          const ratio = newZoom / prev;
          const newScrollTop = (visibleTopPosition * ratio) - (containerHeight / 2);
          containerRef.current.scrollTop = newScrollTop;
          
          // Reset stored position
          setVisibleTopPosition(null);
        }
      }, 50);
      
      return newZoom;
    });
  };
  
  
  // Zoom out by 0.1 down to 50% minimum, while maintaining scroll position
  const handleZoomOut = () => {
    if (!containerRef.current) return;
    
    // Store the current visible element before zooming
    const currentScrollTop = containerRef.current.scrollTop;
    const containerHeight = containerRef.current.clientHeight;
    const centerY = currentScrollTop + (containerHeight / 2);
    
    // Remember this position to scroll back after zoom change
    setVisibleTopPosition(centerY);
    
    // Update zoom level
    setZoomLevel(prev => {
      const newZoom = Math.max(0.5, prev - 0.1);
      persistZoomLevel(newZoom);
      
      // Use a setTimeout to allow the DOM to update with the new zoom level
      setTimeout(() => {
        if (containerRef.current && visibleTopPosition !== null) {
          // Calculate new scroll position based on zoom ratio to keep same content in view
          const ratio = newZoom / prev;
          const newScrollTop = (visibleTopPosition * ratio) - (containerHeight / 2);
          containerRef.current.scrollTop = newScrollTop;
          
          // Reset stored position
          setVisibleTopPosition(null);
        }
      }, 50);
      
      return newZoom;
    });
  };
  
  // Scroll to a specific month and update visible month state
  const scrollToMonth = (monthName: string) => {
    const monthElement = document.querySelector(`[data-month-marker="${monthName}"]`) as HTMLElement;
    if (monthElement && containerRef.current) {
      const topPosition = monthElement.offsetTop;
      // Update visible month state
      setVisibleMonth(monthName);
      
      // Scroll to the month element
      containerRef.current.scrollTo({
        top: topPosition - 100, // Offset to show a bit of the previous content
        behavior: 'smooth'
      });
    }
  };

  // Show loading state initially, then hide once everything is ready
  useEffect(() => {
    // Log projects count for debugging - just once
    console.log(`Loading ${projects.length} projects for ListView (${format(date, 'MMM yyyy')})`);
    
    // Mark as loading only when date changes, not when projects change
    // This prevents unnecessary loading states during minor updates
    if (date && (!prevDateRef.current || prevDateRef.current.getTime() !== date.getTime())) {
      // Only show loading if this is a date change
      setIsDataLoading(true);
    }
    
    // Small delay to allow data to fully process
    const timer = setTimeout(() => {
      setIsDataLoading(false);
      
      // Restore scroll position after data is loaded (separate timer to avoid frequent updates)
      let scrollTimer: number | null = null;
      if (containerRef.current && scrollPositionRef.current > 0) {
        scrollTimer = window.setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.scrollTop = scrollPositionRef.current;
            // Limit console logging to reduce spam
            console.log(`Restored scroll position to ${Math.round(scrollPositionRef.current)}px`);
          }
        }, 50);
      }
      
      return () => {
        if (scrollTimer !== null) {
          window.clearTimeout(scrollTimer);
        }
      };
    }, 100); // Reduced delay for better responsiveness
    
    return () => clearTimeout(timer);
  }, [date]); // Only depend on date to prevent render loops

  // Add debug logging when projects or processed projects change
  useEffect(() => {
    console.log(`ListView received ${projects.length} projects, processedProjects initialized: ${!!processedProjects}`);
    if (processedProjects?.projectsByDate) {
      let visibleCount = 0;
      processedProjects.projectsByDate.forEach(projects => {
        visibleCount += projects.length;
      });
      console.log(`Processed projects has ${visibleCount} visible projects across ${processedProjects.projectsByDate.size} dates`);
    }
  }, [projects, processedProjects]);

  // State for floating month indicator
  const [showFloatingMonth, setShowFloatingMonth] = useState(false);
  const floatingMonthTimeoutRef = useRef<number | null>(null);
  
  // Function to show floating month indicator with auto-hide timer
  const showFloatingMonthIndicator = () => {
    setShowFloatingMonth(true);
    
    // Clear any existing timeout
    if (floatingMonthTimeoutRef.current) {
      window.clearTimeout(floatingMonthTimeoutRef.current);
    }
    
    // Auto-hide after 1.5 seconds of inactivity
    floatingMonthTimeoutRef.current = window.setTimeout(() => {
      setShowFloatingMonth(false);
      floatingMonthTimeoutRef.current = null;
    }, 1500);
  };

  // Define a CSS animation for today's highlight and holiday indicators
  const todayHighlightAnimation = `
    @keyframes pulseToday {
      0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
      70% { box-shadow: 0 0 0 6px rgba(59, 130, 246, 0); }
      100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
    }
    
    .today-highlight {
      animation: pulseToday 2s infinite;
    }
    
    /* Stronger highlight for click feedback */
    .today-highlight-strong {
      animation: none !important;
      box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.6) !important;
      background-color: rgba(59, 130, 246, 0.3) !important;
      z-index: 5;
      transform: scale(1.05);
      transition: all 0.3s ease;
    }
    
    /* Add visual indicator for multi-month projects */
    .multi-month-project::after {
      content: '';
      position: absolute;
      bottom: -4px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 6px solid currentColor;
      opacity: 0.7;
    }
    
    /* Add indicator for projects continuing from previous month */
    .multi-month-project::before {
      content: '';
      position: absolute;
      top: -4px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-bottom: 6px solid currentColor;
      opacity: 0.7;
    }
    
    /* Special styling for the month containing the end date */
    .project-ends-this-month::after {
      content: '◆';
      position: absolute;
      bottom: -8px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 10px;
      opacity: 0.9;
      border: none;
      width: auto;
      height: auto;
    }
    
    /* Malaysian Holiday Indicator Animation */
    @keyframes holidayPulse {
      0% { opacity: 0.5; }
      50% { opacity: 1; }
      100% { opacity: 0.5; }
    }
    
    /* Style for the holiday indicator line */
    [class*="text-red-600"] [class*="-bottom-1"] {
      animation: holidayPulse 2s infinite;
      height: 3px !important;
      background: linear-gradient(to right, rgba(239, 68, 68, 0.5), rgba(239, 68, 68, 1), rgba(239, 68, 68, 0.5)) !important;
      border-radius: 3px;
      box-shadow: 0 0 3px rgba(239, 68, 68, 0.7);
    }
    
    /* Hover effect for holiday dates */
    [class*="text-red-600"]:hover {
      background-color: rgba(254, 226, 226, 0.5) !important;
      transition: background-color 0.2s ease;
    }
    
    /* Animation for floating month indicator */
    @keyframes fadeInOut {
      0% { opacity: 0; transform: scale(0.9); }
      20% { opacity: 1; transform: scale(1); }
      80% { opacity: 1; transform: scale(1); }
      100% { opacity: 0; transform: scale(0.9); }
    }
    
    .animate-fade-in-out {
      animation: fadeInOut 1.5s ease-in-out;
    }
  `;

  // Add click handler for document to close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('month-dropdown');
      if (dropdown && !dropdown.classList.contains('hidden') && 
          event.target instanceof Node && !dropdown.contains(event.target)) {
        dropdown.classList.add('hidden');
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);
  
  return (
    <Card 
      className="h-full rounded-xl border bg-card text-card-foreground shadow relative">
      {/* Loading overlay - only show if we actually have data to load */}
      {isDataLoading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            <p className="mt-3 text-sm text-primary font-medium">Loading calendar data...</p>
          </div>
        </div>
      )}
      
      {/* No data indicator - only show if not loading and we truly have no projects */}
      {!isDataLoading && (
        <>
          {/* No projects at all */}
          {(!projects || projects.length === 0) && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="text-center p-6 bg-gray-50 rounded-lg shadow-sm border max-w-md">
                <div className="text-gray-400 mb-3">
                  <Calendar className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-700">No projects found</h3>
                <p className="mt-2 text-sm text-gray-500">
                  There are no projects scheduled for this time period. Add a new project to get started.
                </p>
              </div>
            </div>
          )}
          
          {/* Has projects but none displayed after filtering - Simplified to avoid errors */}
          {projects && projects.length > 0 && 
           processedProjects && 
           processedProjects.projectsByDate && 
           Array.from(processedProjects.projectsByDate.values()).every(dateProjects => dateProjects.length === 0) && 
           /* This condition is now simpler and safer */
           scrolledToTodayRef.current && 
           !window.sessionStorage.getItem('calendarAutoScrollTarget') &&
          (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="text-center p-6 bg-gray-50 rounded-lg shadow-sm border max-w-md">
                <div className="text-gray-400 mb-3">
                  <Calendar className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-700">No projects visible in this range</h3>
                <p className="mt-2 text-sm text-gray-500">
                  You have {projects.length} project(s), but none are visible in the current date range.
                  Try using the "Refresh" button to load projects from nearby months.
                </p>
              </div>
            </div>
          )}
        </>
      )}
      <CardContent className="p-0 h-full flex flex-col">
        {/* Zoom controls */}
        <div className="flex items-center justify-between p-2 border-b bg-gray-50/50 text-gray-600">
          <div className="text-xs flex items-center">
            <span className="mr-2">Pinch or Ctrl+Wheel to zoom (50-100%)</span>
            <span className="text-gray-400 text-[9px] px-1.5 py-0.5 bg-gray-100 rounded-full">
              {pastMonths}/{MAX_PAST_MONTHS} past · {futureMonths}/{MAX_FUTURE_MONTHS} future
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View toggle - Calendar/List */}
            {onViewChange && (
              <div className="flex items-center gap-1 bg-white/50 rounded p-0.5">
                <button
                  onClick={() => onViewChange('calendar')}
                  className={cn(
                    "p-1.5 rounded transition-colors",
                    currentView === 'calendar'
                      ? "bg-primary text-primary-foreground"
                      : "text-primary hover:bg-primary/10"
                  )}
                  title="Calendar view"
                  aria-label="Switch to calendar view"
                >
                  <Calendar className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onViewChange('list')}
                  className={cn(
                    "p-1.5 rounded transition-colors",
                    currentView === 'list'
                      ? "bg-primary text-primary-foreground"
                      : "text-primary hover:bg-primary/10"
                  )}
                  title="List view"
                  aria-label="Switch to list view"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Month selector dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const dropdown = document.getElementById('month-dropdown');
                  if (dropdown) {
                    dropdown.classList.toggle('hidden');
                  }
                }}
                className="bg-primary/10 text-primary px-3 py-1 rounded-md text-xs font-semibold cursor-pointer hover:bg-primary/20 transition-colors flex items-center"
              >
                <span>{syncToDate ? format(date, 'MMMM yyyy') : visibleMonth}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
                
              {/* Dropdown for quick month navigation */}
              <div id="month-dropdown" className="absolute mt-1 left-0 bg-white shadow-md rounded-md p-1 hidden z-50 w-40 max-h-40 overflow-auto">
                {dates
                  .filter((day, i, arr) => day.getDate() === 1) // Only first day of each month
                  .map(day => {
                    const monthStr = format(day, 'MMMM yyyy');
                    return (
                      <button 
                        key={monthStr}
                        className={`w-full text-left px-2 py-1 text-xs hover:bg-gray-100 cursor-pointer rounded-sm ${
                          visibleMonth === monthStr ? 'bg-primary/10 font-medium' : ''
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Find the month element and scroll to it
                          const monthElement = document.querySelector(`[data-month-marker="${monthStr}"]`) as HTMLElement;
                          if (monthElement && containerRef.current) {
                            const topPosition = monthElement.offsetTop;
                            // Update visible month state
                            setVisibleMonth(monthStr);
                            
                            // Scroll to the month element
                            containerRef.current.scrollTo({
                              top: topPosition - 100, // Offset to show a bit of the previous content
                              behavior: 'smooth'
                            });
                            
                            // Hide dropdown after selection
                            const dropdown = document.getElementById('month-dropdown');
                            if (dropdown) {
                              dropdown.classList.add('hidden');
                            }
                          }
                        }}
                      >
                        {monthStr}
                      </button>
                    );
                  })
                }
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-semibold cursor-pointer hover:bg-primary/20 transition-colors flex items-center gap-1"
                onClick={() => {
                  // Scroll to today functionality (moved from card click)
                  if (containerRef.current) {
                    const today = new Date();
                    const todayIndex = dates.findIndex(d => 
                      isSameDay(d, today) && 
                      d.getFullYear() === today.getFullYear()
                    );
                    
                    if (todayIndex > 0) {
                      // Calculate scroll position to center today
                      const rowHeight = 32; // Height of each date row in pixels
                      const containerHeight = containerRef.current.clientHeight;
                      const scrollPosition = Math.max(0, (todayIndex * rowHeight) - (containerHeight / 2) + rowHeight);
                      
                      // Use direct scrollTop for more reliable scrolling
                      containerRef.current.scrollTop = scrollPosition;
                      
                      // Mark as scrolled to today
                      scrolledToTodayRef.current = true;
                      
                      // Update visible month state
                      const todayMonth = format(today, 'MMMM yyyy');
                      setVisibleMonth(todayMonth);
                      
                      // Add extra highlight to today's element temporarily for visual feedback
                      try {
                        const todayElements = document.querySelectorAll('.today-highlight');
                        todayElements.forEach(el => {
                          // Add a stronger highlight class
                          el.classList.add('today-highlight-strong');
                          
                          // Remove it after animation completes
                          setTimeout(() => {
                            el.classList.remove('today-highlight-strong');
                          }, 2000);
                        });
                      } catch (e) {
                        console.warn('Error adding today highlight:', e);
                      }
                    }
                  }
                }}
                title="Scroll to today"
                aria-label="Scroll to today's date"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span>Today</span>
              </button>
              
              <div className="bg-gray-100 rounded-lg flex items-center p-0.5 shadow-sm">
                <button 
                  className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-gray-200 text-gray-600" 
                  onClick={handleZoomOut}
                  title="Zoom out"
                  aria-label="Zoom out"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
                <button 
                  className="w-6 h-6 flex items-center justify-center text-xs font-medium hover:bg-gray-200 text-gray-600 mx-0.5"
                  onClick={handleResetZoom}
                  title="Reset zoom"
                  aria-label="Reset zoom"
                >
                  {Math.round(zoomLevel * 100)}%
                </button>
                <button 
                  className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-gray-200 text-gray-600"
                  onClick={handleZoomIn}
                  title="Zoom in"
                  aria-label="Zoom in"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      
        <div className="h-full overflow-auto relative" ref={containerRef}>
          {/* Add style tag for today's highlight animation */}
          <style dangerouslySetInnerHTML={{ __html: todayHighlightAnimation }} />
          
          {/* Floating month indicator - fixed in the center of the viewport */}
          {showFloatingMonth && (
            <div 
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
              style={{
                position: 'fixed',  /* Use fixed instead of absolute to center in viewport */
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }}
              aria-hidden="true"
            >
              <div className="bg-black/30 backdrop-blur-sm text-white/90 text-5xl font-bold rounded-xl px-10 py-8 animate-fade-in-out shadow-xl border border-white/20">
                <div className="flex flex-col items-center">
                  <span className="text-white/60 text-lg mb-1">
                    {visibleMonth.split(' ')[1]} {/* Year part */}
                  </span>
                  <span>
                    {visibleMonth.split(' ')[0]} {/* Month part */}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-[60px_1fr] min-w-full md:min-w-0" 
            style={{ 
              minWidth: `${minContentWidth + 60}px`,
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top left',
              height: `${100 / zoomLevel}%`, // Adjust to maintain scrollable area
              width: `${100 / zoomLevel}%`,  // Adjust to maintain scrollable area
              willChange: 'transform, scroll-position', // Optimize both transform and scroll
              overflowY: 'visible',      // Ensure content remains scrollable
              backfaceVisibility: 'hidden', // Improve performance
              WebkitBackfaceVisibility: 'hidden',
              perspective: 1000, // Add 3D acceleration
              WebkitPerspective: 1000
            }}
            role="grid"
            aria-label="Project calendar view"
          >
            {/* Date sidebar - fixed on the left */}
            <div className="sticky left-0 bg-background z-10 border-r" role="rowgroup" aria-label="Date headers">
              {dates.map((day, index) => {
                // Check if day is a Malaysian holiday
                const isHoliday = isPublicHoliday(day);
                const holidayDetails = isHoliday ? getHolidayDetails(day) : null;
                
                return (
                  <TooltipProvider key={day.toISOString()}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "h-[32px] flex items-center justify-center border-b",
                            index === dates.length - 1 && "border-b-0",
                            isWeekend(day) && "bg-[#F5F5F5] dark:bg-neutral-800",
                            isHoliday && "text-red-600 font-semibold hover:bg-red-50 cursor-help ring-1 ring-red-200 bg-red-50/50",
                            isSameMonth(day, date) && "font-medium bg-primary/5",
                            // Check if this is truly today (same day, month, and year)
                            (isSameDay(day, new Date()) && day.getFullYear() === new Date().getFullYear()) && 
                            "bg-primary/20 border-primary border-2 rounded-md text-primary font-bold relative shadow-sm after:content-[''] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-1 after:bg-primary today-highlight",
                            isSameMonth(day, date) && isSameDay(day, endOfMonth(date)) && "border-b-2 border-b-primary/50",
                            // Add special styling for first day of month
                            day.getDate() === 1 && "border-t-2 border-t-primary/70"
                          )}
                          role="row"
                          aria-label={`${format(day, 'EEEE, MMMM d, yyyy')}${isHoliday ? ` - ${holidayDetails?.name}` : ''}`}
                          // Add data attribute for month marker if this is the first day of month
                          {...(day.getDate() === 1 ? { 'data-month-marker': format(day, 'MMMM yyyy') } : {})}
                        >
                          <div className="flex flex-col items-center">
                            {/* Show month name on first day of month */}
                            {day.getDate() === 1 && (
                              <div className="absolute top-0 left-0 right-0 -mt-5 text-[10px] font-bold text-primary bg-background px-1 py-0.5 text-center border-t border-primary/30 rounded-t-sm">
                                {format(day, 'MMMM yyyy')}
                              </div>
                            )}
                            <span className="text-[10px] font-medium">
                              {day.getDate()}
                            </span>
                            <span className={cn(
                              "text-[8px] uppercase",
                              isHoliday ? "text-red-500" : "text-muted-foreground"
                            )}>
                              {format(day, 'EEE')}
                            </span>
                            {/* Small indicator for holidays */}
                            {isHoliday && (
                              <div className="absolute -bottom-1 left-0 right-0 h-[2px] bg-red-500"></div>
                            )}
                          </div>
                        </div>
                      </TooltipTrigger>
                      {/* Only show tooltip content for holidays */}
                      {isHoliday && holidayDetails && (
                        <TooltipContent side="right" align="center" className="p-3 max-w-[200px]">
                          <div className="space-y-2">
                            <div className="font-semibold text-red-600">{holidayDetails.name}</div>
                            <div className="text-xs text-gray-600">{holidayDetails.description}</div>
                            <div className="text-[10px] mt-1 bg-gray-100 px-2 py-0.5 rounded-full inline-block">
                              {holidayDetails.type} Holiday
                            </div>
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
            
            {/* Content area - scrolls with dates */}
            <div>
              {dates.map((day, index) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayProjects = processedProjects.projectsByDate.get(dateKey) || [];
                // Check if day is a Malaysian holiday
                const isHoliday = isPublicHoliday(day);
                
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "h-[32px] relative border-b",
                      index === dates.length - 1 && "border-b-0",
                      isWeekend(day) && "bg-[#F5F5F5] dark:bg-neutral-800",
                      isHoliday && "bg-red-50/50 ring-1 ring-red-200",
                      // Check if this is truly today (same day, month, and year)
                    (isSameDay(day, new Date()) && day.getFullYear() === new Date().getFullYear()) && 
                    "bg-primary/20 border-primary border-2 rounded-md text-primary font-bold relative shadow-sm after:content-[''] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-1 after:bg-primary today-highlight",
                      isSameMonth(day, date) && isSameDay(day, endOfMonth(date)) && "border-b-2 border-b-primary/50",
                      // Highlight first day of month
                      day.getDate() === 1 && "bg-primary/5 border-t-2 border-t-primary/70"
                    )}
                  >
                    {/* Projects on this day */}
                    {dayProjects.map(({ project, column, index }) => {
                      // For multi-month events, we need special handling to ensure they display properly
                      const startDate = new Date(project.start_date);
                      const endDate = project.end_date ? new Date(project.end_date) : startDate;
                      
                      // For regular projects, only render on start date to avoid duplicates
                      // But for multi-month projects, we need to show the full duration
                      if (!isSameDay(day, startDate) && 
                          // Check if this is a multi-month project (spanning more than 31 days)
                          differenceInDays(endDate, startDate) <= 31) {
                        return null;
                      }
                      
                      // If it's a month boundary, we want to render the project for continuity
                      const isMonthBoundary = day.getDate() === 1;
                      
                      // Check if this day is beyond the project's end date
                      if (day > endDate) {
                        return null;
                      }
                      
                      // Only render on start date or first day of each month for long projects
                      if (!isSameDay(day, startDate) && !isMonthBoundary) {
                        return null;
                      }
                      
                      return (
                        <ProjectCard
                          key={`${project.id}-${format(day, 'yyyy-MM-dd')}`}
                          project={project}
                          column={column}
                          day={day}
                          index={index}
                          isActiveDay={isSameDay(day, new Date()) && day.getFullYear() === new Date().getFullYear()}
                          onProjectClick={onProjectClick}
                          onProjectDelete={onProjectDelete}
                          isSelected={selectedProjects.includes(project.id)}
                          onSelect={onProjectSelect}
                          selectionMode={selectionMode}
                          zoomLevel={zoomLevel}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

