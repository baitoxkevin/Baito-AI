import React, { useState, useEffect, useRef, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, differenceInDays } from 'date-fns';
import { cn, eventColors, getBestTextColor, formatTimeString, projectsOverlap } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Clock, Users, MapPin, ChevronLeft, ChevronRight, Calendar, List } from 'lucide-react';
import { EventHoverCard } from './EventHoverCard';
import { useEventHover } from '@/hooks/use-event-hover';
import type { Project } from '@/lib/types';

// Convert Tailwind color names to hex for gradients
const getColorHex = (colorName: string): string => {
  const colorMap: Record<string, string> = {
    'red-200': 'fecaca',
    'blue-200': 'bfdbfe',
    'purple-200': 'e9d5ff',
    'yellow-200': 'fef08a',
    'green-200': 'bbf7d0',
    'pink-200': 'fbcfe8',
    'indigo-200': 'c7d2fe',
    'orange-200': 'fed7aa',
    'gray-200': 'e5e7eb',
  };
  
  return colorMap[colorName] || 'bfdbfe'; // Default to blue if not found
};

const groupOverlappingProjects = (projects: Project[]) => {
  const groups: Project[][] = [];
  
  projects.forEach(project => {
    let added = false;
    for (const group of groups) {
      if (!group.some(p => projectsOverlap(p, project))) {
        group.push(project);
        added = true;
        break;
      }
    }
    if (!added) {
      groups.push([project]);
    }
  });
  
  return groups;
};

const ProjectTooltip = ({ project }: { project: Project }) => (
  <div className="space-y-3 p-3 max-w-xs">
    <div className="font-medium text-gray-900 dark:text-gray-100">{project.title}</div>
    {project.client?.full_name && (
      <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
        {project.client.full_name}
      </div>
    )}
    <div className="grid gap-2.5 text-sm bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-md">
      <div className="flex items-center gap-2.5">
        <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <span className="text-gray-800 dark:text-gray-200">
          {formatTimeString(project.working_hours_start)} - {formatTimeString(project.working_hours_end)}
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <span className="text-gray-800 dark:text-gray-200">
          {project.filled_positions}/{project.crew_count} crew members
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <span className="line-clamp-2 text-gray-800 dark:text-gray-200">
          {project.venue_address}
        </span>
      </div>
    </div>
  </div>
);

interface CalendarViewProps {
  date: Date;
  projects: Project[];
  onProjectClick: (project: Project) => void;
  onDateRangeSelect: (startDate: Date, endDate: Date) => void;
  onDateClick?: (date: Date, projects: Project[]) => void;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  onViewChange?: (view: 'calendar' | 'list') => void;
  currentView?: 'calendar' | 'list';
}

const CalendarView = React.memo(React.forwardRef<HTMLDivElement, CalendarViewProps>(({
  date,
  projects,
  onProjectClick,
  onDateRangeSelect,
  onDateClick,
  onPrevMonth,
  onNextMonth,
  onViewChange,
  currentView = 'calendar',
}, ref) => {
  // Safety check for required props
  if (!date) {
    console.error('CalendarView: date prop is required but was not provided');
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-600">Error: date prop is required</p>
      </div>
    );
  }
  
  if (!Array.isArray(projects)) {
    console.error('CalendarView: projects prop must be an array');
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-600">Error: invalid projects data</p>
      </div>
    );
  }
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartDate, setDragStartDate] = useState<Date | null>(null);
  const [dragEndDate, setDragEndDate] = useState<Date | null>(null);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [eventTypeFilter, setEventTypeFilter] = useState<string[]>([]);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Enhanced hover card functionality
  const {
    hoveredProject,
    hoverPosition,
    handleEventHover,
    handleEventLeave,
    isHovering,
  } = useEventHover(300); // 300ms delay before showing
  
  // Add CSS for project segment hover effects and proper z-index hierarchy
  useEffect(() => {
    // Add style element if it doesn't exist
    let styleElement = document.getElementById('project-hover-styles');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'project-hover-styles';
      document.head.appendChild(styleElement);
    }
    
    // Define the hover effect styles and z-index hierarchy
    const css = `
      /* Set proper z-index hierarchy */
      .day-single-event {
        position: relative;
        z-index: 50 !important; /* Single day events always on top */
      }
      
      .day-more-indicator {
        position: relative;
        z-index: 60 !important; /* "+more" indicator always on top of everything */
      }
      
      /* ====== HOVER EFFECTS ====== */
      
      /* When any project is hovered, dim all others - optimized for high performance */
      .calendar-container.hovering-project .project-segment,
      .calendar-container.hovering-project .day-single-event {
        opacity: 0.3 !important;
        /* Remove filters for better performance during high traffic situations */
        /* filter: grayscale(0.5); */
        transition: opacity 0.15s ease;
        will-change: opacity;
        /* Use hardware acceleration for better performance */
        transform: translateZ(0);
      }
      
      /* Restore and highlight hovered multi-day events - high performance version */
      .calendar-container.hovering-project .project-segments-container:hover .project-segment {
        opacity: 1 !important;
        /* Remove filter for better performance */
        /* filter: brightness(1.1) !important; */
        box-shadow: 0 0 0 2px currentColor !important;
        z-index: 30 !important; /* Keep consistent z-index for multi-day events */
        transform: translateZ(0); /* Hardware acceleration */
      }
      
      /* Restore and highlight hovered single-day events - high performance version */
      .calendar-container.hovering-project .day-single-event:hover {
        opacity: 1 !important;
        /* Remove filter for better performance */
        /* filter: brightness(1.1) !important; */
        box-shadow: 0 0 0 2px currentColor !important;
        z-index: 40 !important; /* Keep consistent z-index for single-day events */
        transform: translateZ(0); /* Hardware acceleration */
      }
      
      /* Consistent z-index values */
      .day-number {
        z-index: 45 !important;
      }
      
      .event-dot {
        z-index: 50 !important;
      }
      
      /* Ensure date display container is always on top */
      .date-display {
        z-index: 46 !important;
        position: relative;
        background-color: inherit !important;
      }
      
      /* Responsive event dots */
      @media (max-width: 640px) {
        .event-dot {
          width: 6px !important;
          height: 6px !important;
        }
        
        .event-dots-container {
          gap: 1px !important;
        }
      }
      
      @media (min-width: 641px) and (max-width: 1024px) {
        .event-dot {
          width: 8px !important;
          height: 8px !important;
        }
      }
    `;
    
    styleElement.textContent = css;
    
    // Clean up on unmount
    return () => {
      if (styleElement && document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  // Memoize these calculations to prevent unnecessary re-renders
  const { monthStart, monthEnd, calendarStart, calendarEnd, daysInMonth, weeks } = useMemo(() => {
    // Add error checking for date
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      console.error('CalendarView: Invalid date provided:', date);
      // Use today as fallback
      const fallbackDate = new Date();
      const monthStart = startOfMonth(fallbackDate);
      const monthEnd = endOfMonth(fallbackDate);
      const calendarStart = new Date(monthStart);
      const dayOfWeek = calendarStart.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      calendarStart.setDate(calendarStart.getDate() - daysToMonday);
      const calendarEnd = new Date(calendarStart);
      calendarEnd.setDate(calendarStart.getDate() + 34);
      const daysInMonth = eachDayOfInterval({
        start: calendarStart,
        end: calendarEnd,
      });
      console.warn('CalendarView: Using fallback date calculation');
      return { monthStart, monthEnd, calendarStart, calendarEnd, daysInMonth, weeks: 5 };
    }

    // Create a normalized date to ensure consistent month/year
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthStart = startOfMonth(normalizedDate);
    const monthEnd = endOfMonth(normalizedDate);

    // Always create a 5-week calendar for better height utilization
    // Start on Monday (1) of the week containing the 1st of the month
    const calendarStart = new Date(monthStart);
    // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const dayOfWeek = calendarStart.getDay();
    // Calculate how many days to go back to get to Monday
    // If Sunday (0), go back 6 days; if Monday (1), go back 0 days; if Tuesday (2), go back 1 day, etc.
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    calendarStart.setDate(calendarStart.getDate() - daysToMonday);

    // Always show 5 weeks (35 days) for optimal cell height
    const calendarEnd = new Date(calendarStart);
    calendarEnd.setDate(calendarStart.getDate() + 34); // 5 weeks = 35 days - 1

    const daysInMonth = eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd,
    });

    console.log('CalendarView: Calculating calendar for', {
      inputDate: date.toISOString(),
      targetMonth: format(normalizedDate, 'MMMM yyyy'),
      monthStart: monthStart.toISOString(),
      calendarStart: calendarStart.toISOString(),
      calendarEnd: calendarEnd.toISOString(),
      daysCount: daysInMonth.length,
      firstDay: daysInMonth[0] ? format(daysInMonth[0], 'MMM d yyyy') : 'none',
      lastDay: daysInMonth[daysInMonth.length - 1] ? format(daysInMonth[daysInMonth.length - 1], 'MMM d yyyy') : 'none'
    });

    // Should always be 5 weeks for optimal height
    const weeks = 5;

    return { monthStart, monthEnd, calendarStart, calendarEnd, daysInMonth, weeks };
  }, [date]);
  
  // Monitor scroll position to adjust month indicators for better visibility
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      // Calculate scroll progress (0 to 1)
      const scrollMax = container.scrollHeight - container.clientHeight;
      const scrollProgress = container.scrollTop / scrollMax;
      
      // Get all month indicators
      const monthIndicators = container.querySelectorAll('.month-indicator');
      
      // Apply different styles based on scroll position
      // When scrolled past 50%, show month name to the right instead of above
      monthIndicators.forEach((element, i) => {
        const indicator = element as HTMLElement;
        const tooltipTrigger = indicator.closest('[role="button"]');
        const isFirstInView = indicator.classList.contains('first-in-view');
        
        if (scrollProgress >= 0.5) {
          // When scrolled past halfway, position month indicators differently
          if (isFirstInView) {
            // First month indicator gets special treatment
            indicator.style.top = '1px';
            indicator.style.left = '22px';
            indicator.style.fontSize = '9px';  
            indicator.style.padding = '1px 3px';
            indicator.style.maxWidth = '85px';
            indicator.style.opacity = '1';
            indicator.style.zIndex = '48';
          } else {
            // Regular month indicators
            indicator.style.top = '1px';
            indicator.style.left = '22px';
            indicator.style.fontSize = '8px';
            indicator.style.padding = '1px 2px';
            indicator.style.maxWidth = '70px';
            indicator.style.opacity = '0.85';
          }
          
          // If there's a tooltip trigger, update its data attribute
          if (tooltipTrigger) {
            tooltipTrigger.setAttribute('data-side', 'right');
          }
        } else {
          // When at top, position month above
          if (isFirstInView) {
            // First month indicator gets special treatment
            indicator.style.top = '-5px';
            indicator.style.left = '7px';
            indicator.style.fontSize = '9px';
            indicator.style.padding = '1px 4px';
            indicator.style.maxWidth = '90px';
            indicator.style.opacity = '1';
            indicator.style.zIndex = '48';
          } else {
            // Regular month indicators
            indicator.style.top = '-5px';
            indicator.style.left = '7px';
            indicator.style.fontSize = '8px';
            indicator.style.padding = '1px 3px';
            indicator.style.maxWidth = '80px';
            indicator.style.opacity = '0.9';
          }
          
          // If there's a tooltip trigger, update its data attribute
          if (tooltipTrigger) {
            tooltipTrigger.setAttribute('data-side', 'top');
          }
        }
      });
    };
    
    // Set initial positions
    handleScroll();
    
    // Add scroll listener
    container.addEventListener('scroll', handleScroll);
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  // Filter projects based on selected event types
  const filteredProjects = useMemo(() => {
    if (eventTypeFilter.length === 0) return projects;
    return projects.filter(project => 
      eventTypeFilter.includes(project.event_type)
    );
  }, [projects, eventTypeFilter]);

  // Create a data structure for tracking day occupancy for both multi-day and single-day events
  const dayOccupancyMap = useMemo(() => {
    // Create a map to track which events are on which days
    // This is used for collision detection between multi-day and single-day events
    const occupancyMap = new Map<number, {
      multiDayRows: boolean[];  // Rows occupied by multi-day events
      singleDayCount: number;   // Number of single-day events
      totalUsedHeight: number;  // Total height used by all events in pixels
    }>();
    
    // Initialize for all days in month
    daysInMonth.forEach((_, index) => {
      occupancyMap.set(index, {
        multiDayRows: Array(3).fill(false), // Track 3 possible rows for multi-day events
        singleDayCount: 0,
        totalUsedHeight: 0
      });
    });
    
    // First, add single-day events to the map
    filteredProjects.forEach(project => {
      const startDate = new Date(project.start_date);
      const endDate = project.end_date ? new Date(project.end_date) : startDate;
      
      // Skip if outside calendar range
      if (endDate < calendarStart || startDate > calendarEnd) return;
      
      // For single-day events, increment counter for that day
      if (isSameDay(startDate, endDate)) {
        const dayIndex = daysInMonth.findIndex(day => isSameDay(day, startDate));
        if (dayIndex !== -1) {
          const dayData = occupancyMap.get(dayIndex)!;
          dayData.singleDayCount++;
          // Add 16px per single-day event (typical height)
          dayData.totalUsedHeight += 16;
          occupancyMap.set(dayIndex, dayData);
        }
      }
    });
    
    return occupancyMap;
  }, [filteredProjects, daysInMonth, calendarStart, calendarEnd]);

  // Enhanced multi-day project rendering with consistent positioning and debugging
  const processedProjects = useMemo(() => {
    // Maximum number of multi-day event rows we want to show
    const MAX_MULTIDAY_ROWS = 3; // Limit to 3 rows for consistency
    
    // Group projects by row position for proper stacking
    const multiDayProjects: {
      project: Project;
      startIndex: number;
      endIndex: number;
      duration: number;
      row: number;
      eventColor: string;
      zIndex: number;
      customColor?: string;
    }[] = [];
    
    // Process multi-day projects
    filteredProjects.forEach(project => {
      const startDate = new Date(project.start_date);
      const endDate = project.end_date ? new Date(project.end_date) : startDate;
      
      // Skip projects outside calendar range
      if (endDate < calendarStart || startDate > calendarEnd) return;
      
      // No need to log colors in production code
      
      // Skip single-day projects (those will be handled separately)
      if (isSameDay(startDate, endDate)) return;
      
      // Get the adjusted dates within calendar bounds
      const adjustedStart = startDate < calendarStart ? calendarStart : startDate;
      const adjustedEnd = endDate > calendarEnd ? calendarEnd : endDate;
      
      // Find indexes in the daysInMonth array
      const startIndex = daysInMonth.findIndex(day => isSameDay(day, adjustedStart));
      const endIndex = daysInMonth.findIndex(day => isSameDay(day, adjustedEnd));
      
      // Check for valid indexes to ensure proper rendering
      if (startIndex === -1 || endIndex === -1) {
        return;
      }
      
      // Validate duration calculation
      const duration = endIndex - startIndex + 1;
      if (duration <= 0) {
        return;
      }
      
      // Only process multi-day events with valid duration
      if (duration > 1) {
        // Check if project has a custom color in the database
        let eventColor;
        
        if (project.color) {
          // If project has a custom color, create a custom class
          const hexColor = project.color;
          // Extract color components for text contrast calculation
          const r = parseInt(hexColor.slice(1, 3), 16);
          const g = parseInt(hexColor.slice(3, 5), 16);
          const b = parseInt(hexColor.slice(5, 7), 16);
          
          // Simple formula to determine if text should be dark or light
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          const textColor = brightness > 140 ? 'text-gray-900' : 'text-gray-50';
          
          // Use inline style instead of Tailwind class for custom color
          eventColor = `custom-color ${textColor}`;
        } else {
          // Fallback to predefined event colors by type
          eventColor = eventColors[project.event_type as keyof typeof eventColors] || "bg-blue-200 text-blue-800";
        }
        
        multiDayProjects.push({
          project,
          startIndex,
          endIndex,
          duration,
          row: 0, // Will be assigned below
          eventColor,
          zIndex: 10, // Base z-index
          customColor: project.color // Store custom color for use in inline style
        });
      }
    });
    
    // Sort multi-day projects for optimal layout:
    // 1. First by start date (ascending)
    // 2. Then by duration (descending)
    multiDayProjects.sort((a, b) => {
      // First sort by start date (ascending)
      const startDiff = a.startIndex - b.startIndex;
      if (startDiff !== 0) return startDiff;
      
      // Then by duration (descending)
      return b.duration - a.duration;
    });
    
    // Simple row tracking for the entire calendar
    const rowOccupancyRanges: { startIndex: number, endIndex: number }[][] = [
      [], [], [] // One array for each of the 3 possible rows
    ];
    
    // Assign specific rows by project title for consistent positioning
    multiDayProjects.forEach(projectItem => {
      // Default row assignment
      let selectedRow = 0;
      
      // Find an unoccupied row dynamically without hardcoding specific event names
      {
        // Attempt to find an unoccupied row for other projects
        for (let row = 0; row < MAX_MULTIDAY_ROWS; row++) {
          // Check if this row has any overlapping projects
          const hasOverlap = rowOccupancyRanges[row].some(range => 
            !(projectItem.endIndex < range.startIndex || projectItem.startIndex > range.endIndex)
          );
          
          if (!hasOverlap) {
            selectedRow = row;
            break;
          }
        }
      }
      
      // Assign the row
      projectItem.row = selectedRow;
      
      // Set consistent z-index for multi-day events
      projectItem.zIndex = 30;
      
      // Mark this row as occupied for this range
      rowOccupancyRanges[selectedRow].push({
        startIndex: projectItem.startIndex,
        endIndex: projectItem.endIndex
      });
    });
    
    // Process multi-day projects silently
    
    return multiDayProjects;
  }, [filteredProjects, daysInMonth, calendarStart, calendarEnd]);

  const handleMouseDown = (day: Date) => {
    setIsDragging(true);
    setDragStartDate(day);
    setDragEndDate(day);
    setSelectedDates([day]);
  };

  const handleMouseMove = (day: Date) => {
    if (isDragging && dragStartDate) {
      setDragEndDate(day);
      
      const start = dragStartDate < day ? dragStartDate : day;
      const end = dragStartDate < day ? day : dragStartDate;
      
      const datesInRange = eachDayOfInterval({ start, end });
      setSelectedDates(datesInRange);
    }
  };

  const handleMouseUp = (day?: Date) => {
    // If we were dragging between dates, handle as date range selection
    if (isDragging && dragStartDate && dragEndDate && 
        (dragStartDate.getTime() !== dragEndDate.getTime())) {
      // If dragging between different dates, handle it as date range selection
      const start = dragStartDate < dragEndDate ? dragStartDate : dragEndDate;
      const end = dragStartDate < dragEndDate ? dragEndDate : dragStartDate;
      onDateRangeSelect(start, end);
    } else if (day && onDateClick) {
      // For single clicks or clicks on the same date, handle as a day click
      // Find projects for this day
      const dayProjects = filteredProjects.filter(project => {
        const startDate = new Date(project.start_date);
        const endDate = project.end_date ? new Date(project.end_date) : startDate;
        
        // Check if this day falls within the project's date range
        return (startDate <= day && endDate >= day);
      });
      
      // Call the onDateClick handler with the day and its projects
      onDateClick(day, dayProjects);
    } else {
      // No valid click target or handler
    }
    
    // Reset drag state
    setIsDragging(false);
    setDragStartDate(null);
    setDragEndDate(null);
    setSelectedDates([]);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    
    // Add keyboard navigation (< for previous month, > for next month)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '<' || e.key === ',') {
        // Navigate to previous month
        const prevMonth = new Date(date);
        prevMonth.setMonth(prevMonth.getMonth() - 1);
        // Create a custom event to notify parent component
        const customEvent = new CustomEvent('calendarPrevMonth', { detail: prevMonth });
        calendarRef.current?.dispatchEvent(customEvent);
      } else if (e.key === '>' || e.key === '.') {
        // Navigate to next month
        const nextMonth = new Date(date);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        // Create a custom event to notify parent component
        const customEvent = new CustomEvent('calendarNextMonth', { detail: nextMonth });
        calendarRef.current?.dispatchEvent(customEvent);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDragging, dragStartDate, dragEndDate, date]);

  const isDateSelected = (day: Date) => {
    return selectedDates.some(selectedDate => 
      isSameDay(selectedDate, day)
    );
  };

  const today = new Date();

  // Use ResizeObserver for responsive calculations
  const [containerSize, setContainerSize] = useState({ height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use ResizeObserver to track container size changes
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create ResizeObserver instance
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerSize({
          height: entry.contentRect.height
        });
      }
    });
    
    // Start observing
    resizeObserver.observe(containerRef.current);
    
    // Cleanup
    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  
  // Static calendar height as requested - no calculations
  const calendarHeight = 120; // Fixed height value

  // Get unique event types for filters, sorted alphabetically
  const eventTypes = useMemo(() => {
    const types = new Set<string>();
    projects.forEach(project => {
      if (project.event_type) {
        types.add(project.event_type);
      }
    });
    return Array.from(types).sort();
  }, [projects]);

  // State for tracking project hover
  const [isHoveringProject, setIsHoveringProject] = useState(false);
  
  // Event handlers for project hover
  const handleProjectMouseEnter = () => {
    setIsHoveringProject(true);
  };
  
  const handleProjectMouseLeave = () => {
    setIsHoveringProject(false);
  };

  return (
    <Card ref={(el) => {
      // Assign to both internal ref and the forwarded ref
      calendarRef.current = el;
      if (typeof ref === 'function') {
        ref(el);
      } else if (ref) {
        ref.current = el;
      }
    }} className={`h-full rounded-xl border bg-card text-card-foreground shadow flex flex-col overflow-hidden calendar-container ${isHoveringProject ? 'hovering-project' : ''}`}>
      <div ref={containerRef} className="px-1 sm:px-2 pt-0.5 pb-2 flex flex-col flex-grow h-full">
        <div className="grid grid-cols-7 gap-1 mt-0 pb-4 relative bg-gray-100"
             style={{
               isolation: 'isolate',
               gridTemplateRows: 'auto auto repeat(5, 1fr)'
             }}>
          {/* Add styles for project bars to ensure they don't overlap date numbers */}
          <style>{`
            /* FORCE calendar cells to be visible */
            [role="gridcell"] {
              background-color: white !important;
              border: 2px solid #e5e7eb !important;
              z-index: 10 !important;
              position: relative !important;
              display: flex !important;
              flex-direction: column !important;
              min-height: 90px !important;
              width: 100% !important;
              opacity: 1 !important;
              visibility: visible !important;
            }

            /* Dark mode support */
            .dark [role="gridcell"] {
              background-color: #1f2937 !important;
              border: 2px solid #374151 !important;
            }

            /* Ensure grid container is visible */
            .grid {
              background-color: transparent !important;
              width: 100% !important;
              height: 100% !important;
              display: grid !important;
            }

            /* Ensure date display area has consistent spacing */
            .date-display {
              height: 30px !important;
              min-height: 30px !important;
              z-index: 45 !important;
              position: relative !important;
              background: transparent !important;
              padding-top: 6px !important;
              margin-bottom: 0px !important;
              border-bottom: 1px solid rgba(229, 231, 235, 0.4) !important;
              pointer-events: auto !important;
              display: flex !important;
              justify-content: space-between !important;
              align-items: center !important;
            }

            /* Day number visibility */
            .day-number {
              z-index: 50 !important;
              display: block !important;
              visibility: visible !important;
              opacity: 1 !important;
              color: #1f2937 !important;
              font-weight: 500 !important;
            }

            .dark .day-number {
              color: #f3f4f6 !important;
            }
            /* Set consistent z-index values as requested */
            .project-segment {
              z-index: 30 !important; /* Multi-day events */
              position: absolute !important;
            }
            .day-single-event {
              z-index: 40 !important; /* Single-day events */
              position: absolute !important;
            }
            .day-number {
              z-index: 45 !important; /* Day numbers */
              pointer-events: auto !important;
            }
            .event-dot {
              z-index: 50 !important; /* Event dots */
            }
            
            /* Month indicator styles for first day of month */
            .month-indicator {
              position: absolute !important;
              top: -5px !important;
              left: 7px !important;
              font-size: 9px !important;
              font-weight: 600 !important;
              color: rgb(79, 70, 229) !important; /* Indigo color for better visibility */
              pointer-events: auto !important; /* Enable pointer events for tooltip */
              user-select: none !important;
              z-index: 47 !important;
              background: rgba(255, 255, 255, 0.9) !important;
              white-space: nowrap !important;
              padding: 1px 4px !important;
              border-radius: 4px !important;
              box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
              cursor: help !important;
              border: 1px solid rgba(79, 70, 229, 0.3) !important;
              max-width: 90px !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
            }
            
            /* Special style for first day in view */
            .month-indicator.first-in-view {
              background: rgba(79, 70, 229, 0.1) !important;
              font-weight: 700 !important;
              border: 1px solid rgba(79, 70, 229, 0.5) !important;
            }
          `}</style>
          {/* Current Month Display Header - Fixed at top of calendar */}
          <div className="col-span-7 flex items-center justify-between px-2 py-1 bg-primary/10 border-b border-primary/20 rounded-t-lg">
            <div className="flex items-center gap-2">
              {onPrevMonth && (
                <button
                  onClick={onPrevMonth}
                  className="p-1 hover:bg-primary/20 rounded transition-colors"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4 text-primary" />
                </button>
              )}
              <h3 className="text-sm font-semibold text-primary min-w-[140px] text-center">
                {format(date, 'MMMM yyyy')}
              </h3>
              {onNextMonth && (
                <button
                  onClick={onNextMonth}
                  className="p-1 hover:bg-primary/20 rounded transition-colors"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4 text-primary" />
                </button>
              )}
            </div>

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
                  aria-label="Calendar view"
                  title="Calendar view"
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
                  aria-label="List view"
                  title="List view"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
          
          {/* Day headers */}
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day) => (
            <div 
              key={day} 
              className="h-5 sm:h-6 flex items-center justify-center bg-card z-10 first:rounded-tl-none last:rounded-tr-none text-center"
              role="columnheader"
            >
              <span className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400">
                {day}
              </span>
            </div>
          ))}

          {/* Calendar days with animation */}
          <AnimatePresence mode="popLayout">
          {daysInMonth.map((day, index) => {
            const isToday = isSameDay(day, today);
            const isCurrentMonth = isSameMonth(day, date);
            const isHighlighted = isDateSelected(day);

            return (
              <motion.div
                key={`${format(day, 'yyyy-MM-dd')}`}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{
                  duration: 0.2,
                  delay: index * 0.005, // Stagger animation
                  ease: "easeInOut"
                }}
                className={cn(
                  "relative cursor-pointer select-none p-0 transition-colors duration-200 flex flex-col rounded-lg overflow-hidden border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isCurrentMonth
                    ? "bg-white border-gray-300 hover:bg-gray-50"
                    : "bg-gray-100 border-gray-200 opacity-40 text-gray-400"
                )}
                style={{
                  boxSizing: 'border-box',
                  zIndex: 1,
                  position: 'relative'
                }}
                role="gridcell"
                tabIndex={0}
                aria-label={format(day, 'EEEE, MMMM d, yyyy')}
                onMouseDown={() => handleMouseDown(day)}
                onMouseEnter={() => handleMouseMove(day)}
                onClick={(e) => {
                  e.stopPropagation(); // Stop propagation to prevent bubbling 
                  // Only trigger day click if not actually dragging
                  // or if it's just a simple click (dragStartDate is the same as this day)
                  if (!isDragging || (dragStartDate && isSameDay(dragStartDate, day))) {
                    handleMouseUp(day);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleMouseDown(day);
                    handleMouseUp(day);
                  }
                }}
              >
                {/* Day number - moved to top-left with more padding */}
                <div className="flex justify-between items-center mb-1 pt-1.5 px-2 date-display">
                  <div className="relative flex items-center justify-center">
                    <span className={cn(
                      "text-[12px] font-medium relative z-30 day-number pointer-events-auto",
                      isCurrentMonth ? "text-gray-800 dark:text-gray-200" : "text-gray-400 dark:text-gray-600",
                      isToday ? "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-[11px] shadow-sm" : ""
                    )}>
                      {day.getDate()}
                    </span>
                    {/* Show month indicators for both first day of month AND first day of month in view */}
                    {(
                      // Show on the first day of any month
                      day.getDate() === 1 || 
                      // Also show on the first day of calendar view if it's not already the 1st
                      (index === 0 && day.getDate() !== 1) ||
                      // Also show on days where the month changes within the view
                      (index > 0 && format(day, 'MM-yyyy') !== format(daysInMonth[index-1], 'MM-yyyy'))
                    ) && (
                      <TooltipProvider>
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                            <span 
                              className={`month-indicator ${index === 0 ? 'first-in-view' : ''}`}
                              data-month={format(day, 'M')} 
                              data-year={format(day, 'yyyy')}
                            >
                              {format(day, 'MMM')} {index === 0 || day.getDate() === 1 ? format(day, 'yyyy') : ''}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={5}>
                            <div className="text-sm font-medium py-1">
                              {format(day, 'MMMM yyyy')}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  
                  {/* Event indicator dots showing total number of events with tooltip */}
                  {(() => {
                    // Get current cell index (for multi-day event positioning)
                    const cellIndex = index;
                    
                    // Get visible projects for this day in the cell
                    const visibleSingleDayProjects = filteredProjects.filter(project => {
                      const startDate = new Date(project.start_date);
                      const endDate = project.end_date ? new Date(project.end_date) : startDate;
                      // Check if it's a single-day project that starts on this day
                      return isSameDay(startDate, endDate) && isSameDay(day, startDate);
                    });
                    
                    // Get visible multi-day projects for this cell
                    const visibleMultiDayProjects = processedProjects
                      .filter(item => cellIndex >= item.startIndex && cellIndex <= item.endIndex)
                      .map(item => item.project);
                      
                    // All visible projects (single-day + multi-day)
                    const visibleProjects = [...visibleSingleDayProjects, ...visibleMultiDayProjects];
                    const visibleProjectIds = new Set(visibleProjects.map(p => p.id));
                    
                    // Find ALL projects for this day (for tooltip)
                    const allDayProjects = filteredProjects.filter(project => {
                      const startDate = new Date(project.start_date);
                      const endDate = project.end_date ? new Date(project.end_date) : startDate;
                      return startDate <= day && endDate >= day;
                    });
                    
                    // Find hidden projects (ones not visible in the cell)
                    const hiddenProjects = allDayProjects.filter(project => 
                      !visibleProjectIds.has(project.id)
                    );
                    
                    // Show dots for ANY day with events
                    if (allDayProjects.length > 0) {
                      // Show dots based on all events, but prioritize hidden events for colors
                      const eventTypeSet = new Set<string>();
                      
                      // Show dots for ALL events
                      allDayProjects.forEach(project => {
                        if (project.event_type) {
                          eventTypeSet.add(project.event_type);
                        }
                      });
                      
                      // Convert to array and limit to 3 dots
                      const eventTypesToShow = Array.from(eventTypeSet).slice(0, 3);
                      
                      return (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex gap-0.5 items-center z-40 cursor-pointer h-6 pr-1 event-dots-container">
                                {/* If there are no specific event types, show generic dots */}
                                {eventTypesToShow.length === 0 ? (
                                  Array.from({ length: Math.min(allDayProjects.length, 3) }).map((_, i) => (
                                    <div key={i} className="w-2.5 h-2.5 rounded-full bg-primary event-dot"></div>
                                  ))
                                ) : (
                                  // Show colored dots based on event types
                                  eventTypesToShow.map((eventType) => {
                                    const colorClasses = eventColors[eventType as keyof typeof eventColors] || "bg-primary";
                                    const bgClass = colorClasses.split(' ')[0]; // Get just the background color class
                                    
                                    return (
                                      <div key={eventType} className={`w-2.5 h-2.5 rounded-full ${bgClass} event-dot`}></div>
                                    );
                                  })
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" align="end" className="w-48 p-0">
                              <div className="p-2 pb-1 border-b">
                                <div className="font-medium">{format(day, 'MMMM d')}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {allDayProjects.length} {allDayProjects.length === 1 ? 'event' : 'events'}
                                </div>
                              </div>
                              <div className="p-2 max-h-36 overflow-y-auto">
                                {allDayProjects.map(project => (
                                  <div 
                                    key={project.id} 
                                    className="text-xs mb-1.5 truncate py-1 px-1 rounded hover:bg-muted cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onProjectClick(project);
                                    }}
                                  >
                                    <span 
                                      className={`inline-block w-2 h-2 rounded-full mr-1.5 ${!project.color ? eventColors[project.event_type as keyof typeof eventColors]?.split(' ')[0] || 'bg-primary' : ''}`}
                                      style={project.color ? { backgroundColor: project.color } : {}}
                                    ></span>
                                    {project.title}
                                  </div>
                                ))}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    }
                    return null;
                  })()}
                </div>
                
                {/* Projects for this day (single-day projects only) */}
                <div className="flex-1 overflow-hidden px-2 pb-1.5 relative">
                  {/* Position single-day events at the exact same positions as multi-day events */}
                  {(() => {
                    // Get current cell index (for multi-day event positioning)
                    const cellIndex = index;
                    
                    // Filter projects for this day - ONLY single-day projects 
                    // (multi-day will be rendered separately)
                    const dayProjects = filteredProjects.filter(project => {
                      const startDate = new Date(project.start_date);
                      const endDate = project.end_date ? new Date(project.end_date) : startDate;
                      
                      // Check if it's a single-day project
                      if (differenceInDays(endDate, startDate) === 0) {
                        return isSameDay(day, startDate);
                      }
                      return false; // Skip multi-day projects
                    });
                    
                    // Group projects to prevent too many showing
                    const groups = groupOverlappingProjects(dayProjects);
                    
                    // Calculate which multi-day events affect this day
                    const dayMultiDayEvents = processedProjects.filter(item => {
                      return cellIndex >= item.startIndex && cellIndex <= item.endIndex;
                    });
                    
                    // Check if this day has a start or end of any multi-day event
                    // We'll need to be more careful with positioning single-day events in these cells
                    const hasMultiDayEventStart = dayMultiDayEvents.some(item => cellIndex === item.startIndex);
                    const hasMultiDayEventEnd = dayMultiDayEvents.some(item => cellIndex === item.endIndex);
                    
                    // For multi-day events, calculate how many rows they'll take up
                    // Limit to the configured maximum in processedProjects
                    const multiDayRows = dayMultiDayEvents.length > 0 
                      ? Math.max(...dayMultiDayEvents.map(item => item.row + 1))
                      : 0;
                    
                    // Calculate position offset for single-day events based on multi-day events
                    // This ensures proper spacing between multi-day and single-day events
                    
                    // Calculate position offset for single-day events
                    // (This is now handled directly in the container's paddingTop)
                    
                    // Fixed positions for single-day events that match multi-day events
                    // These are the exact same pixel values used for multi-day events
                    // No calculations, just fixed pixel values as specified

                    // Allow more single-day events to display
                    const maxProjectsToDisplay = Math.min(
                      // Max of 6 single-day events
                      6,
                      // Fixed number of allowed events 
                      6
                    );
                    
                    // Only show the first few projects
                    const visibleGroups = groups.slice(0, Math.max(0, maxProjectsToDisplay));
                    
                    // Calculate if we need a "more" indicator - only if we actually have more projects
                    const totalProjects = groups.reduce((count, group) => count + group.length, 0);
                    const visibleProjects = visibleGroups.reduce((count, group) => count + group.length, 0);
                    const hasMoreProjects = totalProjects > visibleProjects;
                    const additionalProjectsCount = totalProjects - visibleProjects;
                    
                    // Don't use useState in a render function - this was causing the blank view
                    
                    return (
                      <>
                        {visibleGroups.map((group, groupIndex) => 
                          group.map(project => (
                            <TooltipProvider key={project.id}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    className={cn(
                                      `rounded-md border shadow-sm px-2 py-1 cursor-pointer day-single-event`,
                                      "transition-all flex flex-col gap-0.5 font-medium",
                                      isCurrentMonth ? "opacity-100" : "opacity-90", // Make events slightly transparent in non-current months
                                      !project.color ? (eventColors[project.event_type as keyof typeof eventColors] || "bg-blue-200 text-blue-800") : ""
                                    )}
                                    style={{
                                      zIndex: 40, // Consistent z-index for single-day events
                                      position: "absolute", // Fixed absolute positioning
                                      top: `${groupIndex < 6 ? 42 + (groupIndex % 6) * 33 : 42 + 5 * 33}px`, // Increased spacing for 32px height
                                      height: '32px', // Increased height for time display
                                      left: "2%",
                                      width: "96%",
                                      ...(project.color && {
                                        backgroundColor: project.color,
                                        borderColor: project.color,
                                        color: getBestTextColor(project.color)
                                      }),
                                      // Show a small indicator for stacked events beyond 6
                                      ...(groupIndex >= 6 ? {
                                        right: "2%",
                                        width: "auto",
                                        maxWidth: "96%",
                                        paddingRight: "15px"
                                      } : {})
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onProjectClick(project);
                                    }}
                                    onMouseEnter={(e) => {
                                      handleProjectMouseEnter();
                                      handleEventHover(project, e.currentTarget);
                                    }}
                                    onMouseLeave={() => {
                                      handleProjectMouseLeave();
                                      handleEventLeave();
                                    }}
                                  >
                                    {/* Time display */}
                                    <div className="flex items-center gap-1 text-[9px] opacity-75 font-medium">
                                      <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                                      <span>
                                        {formatTimeString(project.working_hours_start).replace(' AM', '').replace(' PM', '')}
                                      </span>
                                    </div>

                                    {/* Title */}
                                    <div className="truncate text-[11px] leading-[14px] font-medium">
                                      {project.title}
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" align="start">
                                  <ProjectTooltip project={project} />
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ))
                        )}
                        
                        {/* Display a "+more" indicator if there are additional projects */}
                        {hasMoreProjects && (
                          <div
                            className="absolute text-center text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-1 py-0.5 cursor-pointer rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm transition-colors mt-1 opacity-80 hover:opacity-100 day-more-indicator"
                            style={{
                              top: `${42 + 5 * 33 + 3}px`, // Position after 6 events with new 32px height + 1px gap
                              left: "2%",
                              width: "96%",
                              zIndex: 60,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (dayProjects.length > 0 && onDateClick) {
                                onDateClick(day, dayProjects);
                              }
                            }}
                          >
                            +{additionalProjectsCount} more
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </motion.div>
            );
          })}
          </AnimatePresence>
          
          {/* Multi-day project bars (absolute positioned across grid) */}
          {processedProjects.map((projectItem) => {
            const { project, startIndex, endIndex, row } = projectItem;
            
            // Calculate grid layout
            const startCol = startIndex % 7;  // column (0-6)
            const startRow = Math.floor(startIndex / 7);
            const endCol = endIndex % 7;      // column (0-6)
            const endRow = Math.floor(endIndex / 7);
            
            // For multi-day events that cross weeks
            const spans = [];
            
            // If event is in the same week
            if (startRow === endRow) {
              spans.push({
                startCol,
                endCol,
                row: startRow,
                width: endCol - startCol + 1
              });
            } else {
              // First row (from start to end of week)
              spans.push({
                startCol,
                endCol: 6,
                row: startRow,
                width: 7 - startCol
              });
              
              // Middle rows (full weeks)
              for (let r = startRow + 1; r < endRow; r++) {
                spans.push({
                  startCol: 0,
                  endCol: 6,
                  row: r,
                  width: 7
                });
              }
              
              // Last row (from start of week to end)
              spans.push({
                startCol: 0,
                endCol,
                row: endRow,
                width: endCol + 1
              });
            }
            
            // Get the event color
            const colorClass = projectItem.eventColor;
            
            return (
              <TooltipProvider key={project.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="project-segments-container"
                      data-project-id={project.id}
                      onMouseEnter={(e) => {
                        handleProjectMouseEnter();
                        handleEventHover(project, e.currentTarget);
                      }}
                      onMouseLeave={() => {
                        handleProjectMouseLeave();
                        handleEventLeave();
                      }}
                    >
                      {spans.map((span, index) => {
                        // FIXED POSITIONING - absolute pixel values for consistency
                        // Header height includes: month header (~40px) + day labels (~24px)
                        const monthHeaderHeight = 40; // Month navigation header
                        const dayLabelsHeight = 24;   // M T W T F S S row
                        const headerHeight = monthHeaderHeight + dayLabelsHeight; // Total: ~64px

                        // Calculate height per week row based on container
                        // Using a more accurate estimate for week row height
                        const weekRowHeight = 140; // Increased from 120px for better spacing

                        // Fixed positions for each project row within a week
                        // These values match the single-day event positioning for visual consistency
                        const rowPositions = [
                          42,  // First row (matches single-day events)
                          75,  // Second row (42 + 33px spacing)
                          108  // Third row (42 + 66px spacing)
                        ];

                        // Always use a valid row position - ensure no row is undefined
                        // If row is somehow invalid, default to first row
                        const rowPosition = projectItem.row >= 0 && projectItem.row < rowPositions.length
                            ? rowPositions[projectItem.row]
                            : rowPositions[0];

                        // Fixed positioning using exact formula
                        const topOffset = headerHeight + (span.row * weekRowHeight) + rowPosition;
                        
                        // This ensures events stay at the exact same vertical position across weeks
                        
                        // Positioning is now handled with fixed values for consistency
                        
                        // Calculate left position: column index * cell width plus small margin
                        const leftOffset = (span.startCol * (100 / 7)) + 0.25;
                        
                        // Calculate width as percentage with margins on both sides
                        const widthPerc = (span.width * (100 / 7)) - 1.0; // Greater reduction to avoid overflow
                        
                        // Extract color values for gradient
                        const colorName = colorClass.split(' ')[0].replace('bg-', '');
                        
                        return (
                          <div
                            key={`${project.id}-${index}`}
                            className={cn(
                              "absolute rounded-md border shadow-md h-[22px]",
                              "cursor-pointer transition-all project-segment hover:brightness-110",
                              // Use color class for all segments unless there's a custom color
                              projectItem.customColor ? '' : colorClass,
                              // Styles for segments
                              index === 0 ? "rounded-l-md border-l-2" : "rounded-l-none border-l-0",
                              index === spans.length - 1 ? "rounded-r-md border-r-2" : "rounded-r-none border-r-0",
                              // Make it visually distinct based on row to help identify
                              projectItem.row === 0 ? "border-t-2" : "",
                              projectItem.row === 1 ? "border-b-2" : ""
                            )}
                            data-project-id={project.id}
                            data-segment-index={index}
                            style={{
                              top: `${topOffset}px`,
                              left: `${leftOffset}%`,
                              width: `${widthPerc}%`,
                              // Always ensure a minimum opacity for visibility
                              opacity: index === 0 ? 1.0 : 
                                      (index === spans.length - 1 ? 0.8 : 0.6),
                              // Consistent z-index for multi-day events
                              zIndex: 30,
                              // Force visibility
                              visibility: 'visible',
                              display: 'block',
                              position: 'absolute',
                              // Apply custom background color if available
                              ...(projectItem.customColor && {
                                backgroundColor: projectItem.customColor,
                                borderColor: projectItem.customColor
                              })
                            }}
                            onClick={() => onProjectClick(project)}
                          >
                            {/* Only show title in the first segment */}
                            {index === 0 ? (
                              <div className="flex items-center h-full px-2 overflow-hidden">
                                <div className="w-2 h-2 rounded-full bg-current opacity-90 flex-shrink-0 mr-1.5" />
                                <div className="truncate text-[11px] leading-[14px] font-medium">
                                  {project.title}
                                </div>
                              </div>
                            ) : (
                              // Show a repeating pattern in continuation segments
                              <div className="h-full w-full bg-current opacity-5 flex items-center justify-center">
                                <div className="w-full h-[2px] bg-current opacity-20" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="start">
                    <ProjectTooltip project={project} />
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </div>

      {/* Hover Card - Rendered as fixed overlay */}
      {isHovering && hoveredProject && hoverPosition && (
        <div
          className="fixed z-[100]"
          style={{
            top: `${hoverPosition.top}px`,
            left: `${hoverPosition.left}px`,
          }}
          onMouseEnter={() => {
            // Keep hover card visible when mouse enters it
            handleProjectMouseEnter();
          }}
          onMouseLeave={() => {
            // Hide when mouse leaves the card
            handleProjectMouseLeave();
            handleEventLeave();
          }}
        >
          <EventHoverCard
            project={hoveredProject}
            onViewDetails={onProjectClick}
            showActions={true}
          />
        </div>
      )}
    </Card>
  );
}));

CalendarView.displayName = "CalendarView";
export default CalendarView;