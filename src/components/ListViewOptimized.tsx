import React, { useMemo, useRef, useEffect, useState, useCallback, memo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isWeekend, 
  addMonths, 
  isSameMonth, 
  isSameDay 
} from 'date-fns';
import { cn, eventColors, formatTimeString, getBestTextColor } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Calendar, Clock, Users, MapPin, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { Project } from '@/lib/types';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

// Memoized project card component
const ProjectCard = memo(({
  project,
  isSelected,
  onSelect,
  onClick,
  onDelete,
  selectionMode,
}: {
  project: Project;
  isSelected: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  onClick?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  selectionMode: boolean;
}) => {
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectionMode && onSelect) {
      onSelect(project.id, !isSelected);
    } else if (onClick) {
      onClick(project);
    }
  }, [selectionMode, onSelect, onClick, project, isSelected]);
  
  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(project);
    }
  }, [onDelete, project]);
  
  const eventColor = project.color 
    ? '' 
    : eventColors[project.event_type as keyof typeof eventColors] || "bg-blue-200 text-blue-800";
  
  return (
    <div
      className={cn(
        "rounded-lg border p-3 cursor-pointer transition-all",
        "hover:shadow-md hover:scale-[1.02]",
        isSelected && "ring-2 ring-primary",
        eventColor
      )}
      style={project.color ? {
        backgroundColor: project.color,
        color: getBestTextColor(project.color),
        borderColor: project.color
      } : undefined}
      onClick={handleClick}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          {selectionMode && onSelect && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelect(project.id, checked === true)}
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4"
            />
          )}
          <h3 className="font-medium text-sm">{project.title}</h3>
        </div>
        {!selectionMode && onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-full hover:bg-red-100 hover:text-red-600"
            onClick={handleDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      
      <div className="space-y-1 text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="h-3 w-3" />
          <span>
            {format(new Date(project.start_date), 'MMM d')}
            {project.end_date && ` - ${format(new Date(project.end_date), 'MMM d')}`}
          </span>
        </div>
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
        {project.venue_address && (
          <div className="flex items-center gap-2">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{project.venue_address}</span>
          </div>
        )}
      </div>
    </div>
  );
});

ProjectCard.displayName = 'ProjectCard';

// Memoized day group component
const DayGroup = memo(({
  date,
  projects,
  isToday,
  isWeekend,
  selectionMode,
  selectedProjects,
  onProjectSelect,
  onProjectClick,
  onProjectDelete,
}: {
  date: Date;
  projects: Project[];
  isToday: boolean;
  isWeekend: boolean;
  selectionMode: boolean;
  selectedProjects: string[];
  onProjectSelect?: (id: string, selected: boolean) => void;
  onProjectClick?: (project: Project) => void;
  onProjectDelete?: (project: Project) => void;
}) => {
  return (
    <div className="mb-6">
      <div className={cn(
        "sticky top-0 z-10 px-4 py-2 mb-3 rounded-lg",
        isToday ? "bg-primary/10 border-primary" : "bg-gray-50",
        isWeekend && "bg-gray-100"
      )}>
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-sm">
            {format(date, 'EEEE, MMMM d')}
            {isToday && <span className="ml-2 text-xs text-primary">(Today)</span>}
          </h3>
          <span className="text-xs text-gray-500">
            {projects.length} {projects.length === 1 ? 'project' : 'projects'}
          </span>
        </div>
      </div>
      
      <div className="grid gap-3 px-4">
        {projects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            isSelected={selectedProjects.includes(project.id)}
            onSelect={onProjectSelect}
            onClick={onProjectClick}
            onDelete={onProjectDelete}
            selectionMode={selectionMode}
          />
        ))}
      </div>
    </div>
  );
});

DayGroup.displayName = 'DayGroup';

// Main optimized list view component with virtualization
const ListViewOptimized = memo(({
  date,
  projects,
  onProjectClick,
  onProjectDelete,
  selectionMode = false,
  selectedProjects = [],
  onProjectSelect,
  onLoadMoreMonths,
  monthsToShow = 3,
  syncToDate = true,
  onMonthChange,
}: {
  date: Date;
  projects: Project[];
  onProjectClick?: (project: Project) => void;
  onProjectDelete?: (project: Project) => void;
  selectionMode?: boolean;
  selectedProjects?: string[];
  onProjectSelect?: (id: string, selected: boolean) => void;
  onLoadMoreMonths?: (direction: 'past' | 'future', count: number) => Promise<void>;
  monthsToShow?: number;
  syncToDate?: boolean;
  onMonthChange?: (date: Date) => void;
}) => {
  const listRef = useRef<List>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });
  
  // Performance: Track render count
  const renderCount = useRef(0);
  renderCount.current++;
  console.log(`[Performance] ListView render #${renderCount.current}`);
  
  // Generate date range for display
  const dateRange = useMemo(() => {
    console.time('[Performance] Date range calculation');
    const dates = [];
    const startDate = addMonths(startOfMonth(date), -Math.floor(monthsToShow / 2));
    const endDate = addMonths(startOfMonth(date), Math.ceil(monthsToShow / 2));
    
    let current = startDate;
    while (current <= endDate) {
      const monthDays = eachDayOfInterval({
        start: startOfMonth(current),
        end: endOfMonth(current)
      });
      dates.push(...monthDays);
      current = addMonths(current, 1);
    }
    
    console.timeEnd('[Performance] Date range calculation');
    return dates;
  }, [date, monthsToShow]);
  
  // Group projects by day with optimized mapping
  const projectsByDay = useMemo(() => {
    console.time('[Performance] Projects by day grouping');
    const map = new Map<string, Project[]>();
    
    // Pre-calculate date strings for all projects
    const projectsWithDates = projects.map(p => ({
      ...p,
      startDateObj: new Date(p.start_date),
      endDateObj: p.end_date ? new Date(p.end_date) : new Date(p.start_date)
    }));
    
    dateRange.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      const dayProjects = projectsWithDates.filter(p => {
        // Check if day falls within project date range
        return p.startDateObj <= day && p.endDateObj >= day;
      });
      
      if (dayProjects.length > 0) {
        map.set(dayKey, dayProjects);
      }
    });
    
    console.timeEnd('[Performance] Projects by day grouping');
    return map;
  }, [projects, dateRange]);
  
  // Create list items for virtualization
  const listItems = useMemo(() => {
    console.time('[Performance] List items creation');
    const items = [];
    const today = new Date();
    let currentMonth = null;
    
    dateRange.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      const dayProjects = projectsByDay.get(dayKey);
      
      // Add month header if new month
      const month = format(day, 'MMMM yyyy');
      if (month !== currentMonth) {
        currentMonth = month;
        items.push({
          type: 'month-header' as const,
          date: day,
          month
        });
      }
      
      // Add day with projects
      if (dayProjects && dayProjects.length > 0) {
        items.push({
          type: 'day' as const,
          date: day,
          projects: dayProjects,
          isToday: isSameDay(day, today),
          isWeekend: isWeekend(day)
        });
      }
    });
    
    console.timeEnd('[Performance] List items creation');
    return items;
  }, [dateRange, projectsByDay]);
  
  // Find today's index for auto-scrolling
  const todayIndex = useMemo(() => {
    const today = new Date();
    return listItems.findIndex(item => 
      item.type === 'day' && isSameDay(item.date, today)
    );
  }, [listItems]);
  
  // Auto-scroll to today on mount
  useEffect(() => {
    if (syncToDate && todayIndex !== -1 && listRef.current) {
      // Use requestAnimationFrame for smooth scrolling
      requestAnimationFrame(() => {
        listRef.current?.scrollToItem(todayIndex, 'center');
      });
    }
  }, [todayIndex, syncToDate]);
  
  // Handle scroll for infinite loading
  const handleScroll = useCallback(({ visibleStartIndex, visibleStopIndex }) => {
    setVisibleRange({ start: visibleStartIndex, end: visibleStopIndex });
    
    // Load more months when near edges
    if (visibleStartIndex < 5 && onLoadMoreMonths) {
      onLoadMoreMonths('past', 1);
    } else if (visibleStopIndex > listItems.length - 5 && onLoadMoreMonths) {
      onLoadMoreMonths('future', 1);
    }
  }, [listItems.length, onLoadMoreMonths]);
  
  // Row renderer for virtualized list
  const Row = useCallback(({ index, style }) => {
    const item = listItems[index];
    
    if (!item) return null;
    
    if (item.type === 'month-header') {
      return (
        <div style={style} className="flex items-center px-4 py-3 bg-gray-100 font-bold text-lg">
          {item.month}
        </div>
      );
    }
    
    if (item.type === 'day') {
      return (
        <div style={style}>
          <DayGroup
            date={item.date}
            projects={item.projects}
            isToday={item.isToday}
            isWeekend={item.isWeekend}
            selectionMode={selectionMode}
            selectedProjects={selectedProjects}
            onProjectSelect={onProjectSelect}
            onProjectClick={onProjectClick}
            onProjectDelete={onProjectDelete}
          />
        </div>
      );
    }
    
    return null;
  }, [listItems, selectionMode, selectedProjects, onProjectSelect, onProjectClick, onProjectDelete]);
  
  // Calculate item height dynamically
  const getItemSize = useCallback((index: number) => {
    const item = listItems[index];
    if (!item) return 0;
    
    if (item.type === 'month-header') {
      return 60; // Fixed height for month headers
    }
    
    if (item.type === 'day') {
      // Calculate height based on number of projects
      const baseHeight = 80; // Header height
      const projectHeight = 120; // Height per project card
      const gap = 12; // Gap between projects
      return baseHeight + (item.projects.length * (projectHeight + gap));
    }
    
    return 0;
  }, [listItems]);
  
  return (
    <Card className="h-full rounded-xl border bg-card shadow flex flex-col overflow-hidden">
      <div className="flex-grow">
        <AutoSizer>
          {({ height, width }) => (
            <List
              ref={listRef}
              height={height}
              itemCount={listItems.length}
              itemSize={getItemSize}
              width={width}
              onItemsRendered={handleScroll}
              overscanCount={3} // Render 3 items outside visible area for smoother scrolling
            >
              {Row}
            </List>
          )}
        </AutoSizer>
      </div>
    </Card>
  );
});

ListViewOptimized.displayName = 'ListViewOptimized';

export default ListViewOptimized;