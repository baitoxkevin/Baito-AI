import React, { useState, useMemo, useCallback, memo, useRef } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  differenceInDays 
} from 'date-fns';
import { cn, eventColors, getBestTextColor, formatTimeString } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Clock, Users, MapPin } from 'lucide-react';
import type { Project } from '@/lib/types';

// Memoized day cell component to prevent unnecessary re-renders
const DayCell = memo(({
  day,
  isToday,
  isCurrentMonth,
  projects,
  onDateClick,
  onProjectClick,
}: {
  day: Date;
  isToday: boolean;
  isCurrentMonth: boolean;
  projects: Project[];
  onDateClick?: (date: Date, projects: Project[]) => void;
  onProjectClick: (project: Project) => void;
}) => {
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDateClick) {
      onDateClick(day, projects);
    }
  }, [day, projects, onDateClick]);
  
  const handleProjectClick = useCallback((e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    onProjectClick(project);
  }, [onProjectClick]);
  
  return (
    <div
      className={cn(
        "relative border cursor-pointer select-none p-2",
        "transition-colors duration-200 flex flex-col",
        "rounded-lg overflow-hidden h-[120px]",
        isToday ? "bg-primary/5 border-primary border-2 shadow-sm" : "bg-card border-gray-200",
        !isCurrentMonth && "text-gray-400 opacity-90",
        "hover:bg-gray-50/70 active:bg-gray-100"
      )}
      onClick={handleClick}
      role="gridcell"
      aria-label={format(day, 'EEEE, MMMM d, yyyy')}
    >
      <div className="flex justify-between items-center mb-1">
        <span className={cn(
          "text-sm font-medium",
          isCurrentMonth ? "text-gray-800" : "text-gray-400",
          isToday && "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center"
        )}>
          {day.getDate()}
        </span>
        
        {projects.length > 0 && (
          <div className="flex gap-0.5">
            {projects.slice(0, 3).map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-primary" />
            ))}
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-hidden space-y-1">
        {projects.slice(0, 3).map(project => (
          <div
            key={project.id}
            className={cn(
              "rounded px-1 py-0.5 text-xs truncate cursor-pointer",
              "hover:opacity-80 transition-opacity",
              eventColors[project.event_type as keyof typeof eventColors] || "bg-blue-200 text-blue-800"
            )}
            style={project.color ? {
              backgroundColor: project.color,
              color: getBestTextColor(project.color)
            } : undefined}
            onClick={(e) => handleProjectClick(e, project)}
          >
            {project.title}
          </div>
        ))}
        
        {projects.length > 3 && (
          <div className="text-xs text-gray-500 text-center">
            +{projects.length - 3} more
          </div>
        )}
      </div>
    </div>
  );
});

DayCell.displayName = 'DayCell';

// Memoized multi-day project bar component
const MultiDayProjectBar = memo(({
  project,
  startIndex,
  endIndex,
  row,
  daysInMonth,
  onProjectClick,
}: {
  project: Project;
  startIndex: number;
  endIndex: number;
  row: number;
  daysInMonth: Date[];
  onProjectClick: (project: Project) => void;
}) => {
  const spans = useMemo(() => {
    const result = [];
    const startCol = startIndex % 7;
    const startRow = Math.floor(startIndex / 7);
    const endCol = endIndex % 7;
    const endRow = Math.floor(endIndex / 7);
    
    if (startRow === endRow) {
      result.push({
        startCol,
        endCol,
        row: startRow,
        width: endCol - startCol + 1
      });
    } else {
      // First row
      result.push({
        startCol,
        endCol: 6,
        row: startRow,
        width: 7 - startCol
      });
      
      // Middle rows
      for (let r = startRow + 1; r < endRow; r++) {
        result.push({
          startCol: 0,
          endCol: 6,
          row: r,
          width: 7
        });
      }
      
      // Last row
      result.push({
        startCol: 0,
        endCol,
        row: endRow,
        width: endCol + 1
      });
    }
    
    return result;
  }, [startIndex, endIndex]);
  
  const colorClass = project.color 
    ? '' 
    : eventColors[project.event_type as keyof typeof eventColors] || "bg-blue-200 text-blue-800";
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="project-segments-container">
            {spans.map((span, index) => {
              const topOffset = 32 + (span.row * 120) + (row * 25 + 42);
              const leftOffset = (span.startCol * (100 / 7)) + 0.25;
              const widthPerc = (span.width * (100 / 7)) - 1.0;
              
              return (
                <div
                  key={`${project.id}-${index}`}
                  className={cn(
                    "absolute rounded-md border shadow-md h-[22px]",
                    "cursor-pointer transition-all hover:brightness-110",
                    colorClass,
                    index === 0 ? "rounded-l-md" : "rounded-l-none",
                    index === spans.length - 1 ? "rounded-r-md" : "rounded-r-none"
                  )}
                  style={{
                    top: `${topOffset}px`,
                    left: `${leftOffset}%`,
                    width: `${widthPerc}%`,
                    zIndex: 30,
                    ...(project.color && {
                      backgroundColor: project.color,
                      borderColor: project.color,
                      color: getBestTextColor(project.color)
                    })
                  }}
                  onClick={() => onProjectClick(project)}
                >
                  {index === 0 && (
                    <div className="flex items-center h-full px-2 overflow-hidden">
                      <div className="truncate text-xs font-medium">
                        {project.title}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-2 p-2">
            <div className="font-medium">{project.title}</div>
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span>
                  {formatTimeString(project.working_hours_start)} - 
                  {formatTimeString(project.working_hours_end)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-3 w-3" />
                <span>{project.filled_positions}/{project.crew_count} crew</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3" />
                <span className="line-clamp-2">{project.venue_address}</span>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

MultiDayProjectBar.displayName = 'MultiDayProjectBar';

// Main optimized calendar view component
const CalendarViewOptimized = memo(({
  date,
  projects,
  onProjectClick,
  onDateRangeSelect,
  onDateClick,
}: {
  date: Date;
  projects: Project[];
  onProjectClick: (project: Project) => void;
  onDateRangeSelect: (startDate: Date, endDate: Date) => void;
  onDateClick?: (date: Date, projects: Project[]) => void;
}) => {
  const [eventTypeFilter, setEventTypeFilter] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartDate, setDragStartDate] = useState<Date | null>(null);
  const [dragEndDate, setDragEndDate] = useState<Date | null>(null);
  
  // Performance: Track render count
  const renderCount = useRef(0);
  renderCount.current++;
  console.log(`[Performance] CalendarView render #${renderCount.current}`);
  
  // Memoize calendar dates calculation
  const { monthStart, monthEnd, calendarStart, calendarEnd, daysInMonth } = useMemo(() => {
    console.time('[Performance] Calendar dates calculation');
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    
    const calendarStart = new Date(monthStart);
    calendarStart.setDate(calendarStart.getDate() - (monthStart.getDay() - 1 + 7) % 7);
    
    const calendarEnd = new Date(calendarStart);
    calendarEnd.setDate(calendarStart.getDate() + 41);
    
    const daysInMonth = eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd,
    });
    
    console.timeEnd('[Performance] Calendar dates calculation');
    return { monthStart, monthEnd, calendarStart, calendarEnd, daysInMonth };
  }, [date]);
  
  // Memoize filtered projects
  const filteredProjects = useMemo(() => {
    console.time('[Performance] Filter projects');
    const result = eventTypeFilter.length === 0 
      ? projects 
      : projects.filter(p => eventTypeFilter.includes(p.event_type));
    console.timeEnd('[Performance] Filter projects');
    return result;
  }, [projects, eventTypeFilter]);
  
  // Memoize projects by day mapping
  const projectsByDay = useMemo(() => {
    console.time('[Performance] Projects by day mapping');
    const map = new Map<string, Project[]>();
    
    daysInMonth.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      const dayProjects = filteredProjects.filter(project => {
        const startDate = new Date(project.start_date);
        const endDate = project.end_date ? new Date(project.end_date) : startDate;
        return startDate <= day && endDate >= day;
      });
      
      if (dayProjects.length > 0) {
        map.set(dayKey, dayProjects);
      }
    });
    
    console.timeEnd('[Performance] Projects by day mapping');
    return map;
  }, [daysInMonth, filteredProjects]);
  
  // Memoize multi-day projects
  const multiDayProjects = useMemo(() => {
    console.time('[Performance] Multi-day projects calculation');
    const result = [];
    const rowOccupancy = [[], [], []]; // Track 3 rows
    
    const multiDay = filteredProjects.filter(project => {
      const startDate = new Date(project.start_date);
      const endDate = project.end_date ? new Date(project.end_date) : startDate;
      return !isSameDay(startDate, endDate) && startDate <= calendarEnd && endDate >= calendarStart;
    });
    
    multiDay.sort((a, b) => {
      const aStart = new Date(a.start_date);
      const bStart = new Date(b.start_date);
      return aStart.getTime() - bStart.getTime();
    });
    
    multiDay.forEach(project => {
      const startDate = new Date(project.start_date);
      const endDate = project.end_date ? new Date(project.end_date) : startDate;
      
      const adjustedStart = startDate < calendarStart ? calendarStart : startDate;
      const adjustedEnd = endDate > calendarEnd ? calendarEnd : endDate;
      
      const startIndex = daysInMonth.findIndex(day => isSameDay(day, adjustedStart));
      const endIndex = daysInMonth.findIndex(day => isSameDay(day, adjustedEnd));
      
      if (startIndex !== -1 && endIndex !== -1) {
        // Find available row
        let selectedRow = 0;
        for (let row = 0; row < 3; row++) {
          const hasOverlap = rowOccupancy[row].some(range => 
            !(endIndex < range.startIndex || startIndex > range.endIndex)
          );
          
          if (!hasOverlap) {
            selectedRow = row;
            break;
          }
        }
        
        rowOccupancy[selectedRow].push({ startIndex, endIndex });
        
        result.push({
          project,
          startIndex,
          endIndex,
          row: selectedRow
        });
      }
    });
    
    console.timeEnd('[Performance] Multi-day projects calculation');
    return result;
  }, [filteredProjects, calendarStart, calendarEnd, daysInMonth]);
  
  // Memoize event types
  const eventTypes = useMemo(() => {
    const types = new Set<string>();
    projects.forEach(p => {
      if (p.event_type) types.add(p.event_type);
    });
    return Array.from(types).sort();
  }, [projects]);
  
  // Handlers
  const handleMouseDown = useCallback((day: Date) => {
    setIsDragging(true);
    setDragStartDate(day);
    setDragEndDate(day);
  }, []);
  
  const handleMouseUp = useCallback(() => {
    if (isDragging && dragStartDate && dragEndDate) {
      if (!isSameDay(dragStartDate, dragEndDate)) {
        const start = dragStartDate < dragEndDate ? dragStartDate : dragEndDate;
        const end = dragStartDate < dragEndDate ? dragEndDate : dragStartDate;
        onDateRangeSelect(start, end);
      } else if (onDateClick) {
        const dayKey = format(dragStartDate, 'yyyy-MM-dd');
        const dayProjects = projectsByDay.get(dayKey) || [];
        onDateClick(dragStartDate, dayProjects);
      }
    }
    
    setIsDragging(false);
    setDragStartDate(null);
    setDragEndDate(null);
  }, [isDragging, dragStartDate, dragEndDate, onDateRangeSelect, onDateClick, projectsByDay]);
  
  const today = useMemo(() => new Date(), []);
  
  return (
    <Card className="h-full rounded-xl border bg-card shadow flex flex-col overflow-hidden">
      {/* Filters */}
      <div className="p-3 border-b flex gap-2 flex-wrap bg-gray-50/50">
        <span className="text-xs font-medium text-gray-500">Filter:</span>
        {eventTypes.map(type => (
          <button
            key={type}
            className={cn(
              "text-xs px-3 py-1.5 rounded-full border transition-all",
              eventTypeFilter.includes(type)
                ? `${eventColors[type as keyof typeof eventColors]} font-medium`
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            )}
            onClick={() => {
              setEventTypeFilter(prev =>
                prev.includes(type)
                  ? prev.filter(t => t !== type)
                  : [...prev, type]
              );
            }}
          >
            {type}
          </button>
        ))}
        {eventTypeFilter.length > 0 && (
          <button
            className="text-xs px-3 py-1.5 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 ml-auto"
            onClick={() => setEventTypeFilter([])}
          >
            Clear
          </button>
        )}
      </div>
      
      {/* Calendar Grid */}
      <div className="flex-grow overflow-auto p-2">
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(day => (
            <div key={day} className="h-6 flex items-center justify-center text-xs font-medium text-gray-600">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {daysInMonth.map(day => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayProjects = projectsByDay.get(dayKey) || [];
            const singleDayProjects = dayProjects.filter(p => {
              const start = new Date(p.start_date);
              const end = p.end_date ? new Date(p.end_date) : start;
              return isSameDay(start, end);
            });
            
            return (
              <DayCell
                key={dayKey}
                day={day}
                isToday={isSameDay(day, today)}
                isCurrentMonth={isSameMonth(day, date)}
                projects={singleDayProjects}
                onDateClick={onDateClick}
                onProjectClick={onProjectClick}
              />
            );
          })}
          
          {/* Multi-day project bars */}
          {multiDayProjects.map(item => (
            <MultiDayProjectBar
              key={item.project.id}
              project={item.project}
              startIndex={item.startIndex}
              endIndex={item.endIndex}
              row={item.row}
              daysInMonth={daysInMonth}
              onProjectClick={onProjectClick}
            />
          ))}
        </div>
      </div>
    </Card>
  );
});

CalendarViewOptimized.displayName = 'CalendarViewOptimized';

export default CalendarViewOptimized;