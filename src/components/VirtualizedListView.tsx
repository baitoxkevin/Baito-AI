import { useMemo } from 'react';
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, 
  addMonths, differenceInDays, isSameMonth, isSameDay 
} from 'date-fns';
import { cn, isPublicHoliday } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Clock, Users, MapPin } from 'lucide-react';
import type { Project } from '@/lib/types';
import { eventColors, formatTimeString, projectsOverlap } from './CalendarView';

interface ProjectTooltipProps {
  project: Project;
}

const ProjectTooltip = ({ project }: ProjectTooltipProps) => (
  <div className="space-y-2 p-2 max-w-xs">
    <div className="font-medium">{project.title}</div>
    {project.client?.full_name && (
      <div className="text-sm text-muted-foreground">
        {project.client.full_name}
      </div>
    )}
    <div className="grid gap-2 text-sm">
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

interface DayRowProps {
  day: Date;
  style: React.CSSProperties;
  index: number;
  projectsWithColumns: { project: Project; column: number }[];
  calculatePosition: (project: Project, column: number) => { top: string; height: string; left: string };
  onProjectClick: (project: Project) => void;
  minWidth: number;
  startDate: Date;
  isLast: boolean;
}

const DayRow = ({ 
  day, 
  style, 
  projectsWithColumns, 
  calculatePosition, 
  onProjectClick, 
  minWidth, 
  startDate,
  isLast,
  index
}: DayRowProps) => {
  // Filter projects that belong to this day - avoid useMemo to fix rendering issues
  const dayProjects = projectsWithColumns.filter(({ project }) => {
    const projectStart = new Date(project.start_date);
    const projectEnd = project.end_date ? new Date(project.end_date) : projectStart;
    const currentDay = new Date(day);
    
    return (
      (projectStart <= currentDay && projectEnd >= currentDay)
    );
  });
  
  return (
    <div style={style} className="relative">
      <div 
        className={cn(
          "h-[32px] border-b",
          isLast && "border-b-0",
          isWeekend(day) && "bg-[#F5F5F5] dark:bg-neutral-800",
          isSameMonth(day, startDate) && isSameDay(day, endOfMonth(startDate)) && "border-b-2 border-b-primary/50"
        )}
        style={{ minWidth: `${minWidth}px` }}
      />
      
      {dayProjects.map(({ project, column }) => {
        const position = calculatePosition(project, column);
        const startDate = new Date(project.start_date);
        const endDate = project.end_date ? new Date(project.end_date) : startDate;
        const duration = differenceInDays(endDate, startDate) + 1;
        
        return (
          <TooltipProvider key={project.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="absolute"
                  style={{
                    left: position.left,
                    width: '85px',
                    top: '0px',
                    height: position.height
                  }}
                >
                  <div 
                    className={`
                      rounded-xl border bg-card text-card-foreground shadow h-full
                      px-1.5 cursor-pointer hover:opacity-80 transition-opacity
                      ${eventColors[project.event_type as keyof typeof eventColors] || 'bg-blue-200 text-blue-800'}
                      ${duration <= 2 ? 'flex items-center justify-center' : 'flex flex-col justify-center py-0.5'}
                    `}
                    onClick={() => onProjectClick(project)}
                  >
                    {duration <= 2 ? (
                      <div className="text-[10px] font-medium text-center line-clamp-2">
                        {project.title.length > 20 ? `${project.title.slice(0, 20)}...` : project.title}
                      </div>
                    ) : (
                      <div className="space-y-0.5 w-full">
                        <div className="font-medium text-[10px] text-center line-clamp-2">
                          {project.title}
                        </div>
                        <div className="flex flex-col items-center text-[8px] opacity-75 space-y-0.5">
                          <div>{formatTimeString(project.working_hours_start)} - {formatTimeString(project.working_hours_end)}</div>
                          <div>{project.filled_positions}/{project.crew_count} crew</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" align="start">
                <ProjectTooltip project={project} />
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
};

interface DateColumnProps {
  days: Date[];
  startDate: Date;
}

const DateColumn = ({ days, startDate }: DateColumnProps) => {
  return (
    <div className="bg-background relative" style={{ height: days.length * 32 }}>
      {days.map((day, index) => (
        <div
          key={day.toISOString()}
          className={cn(
            "absolute w-full flex items-center justify-center h-[32px] border-b relative",
            index === days.length - 1 && "border-b-0",
            isWeekend(day) && "bg-[#F5F5F5] dark:bg-neutral-800",
            isPublicHoliday(day) && "text-red-600 font-semibold",
            isSameMonth(day, addMonths(startDate, 1)) && "font-medium",
            isSameMonth(day, startDate) && isSameDay(day, endOfMonth(startDate)) && "border-b-2 border-b-primary/50"
          )}
          style={{ top: index * 32 }}
        >
          <div className="absolute right-0 top-0 bottom-0 w-px bg-border" />
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-medium">
              {day.getDate()}
            </span>
            <span className={cn(
              "text-[8px] uppercase",
              isPublicHoliday(day) ? "text-red-500" : "text-muted-foreground"
            )}>
              {format(day, 'EEE')}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

interface VirtualizedListViewProps {
  date: Date;
  projects: Project[];
  onProjectClick: (project: Project) => void;
}

export default function VirtualizedListView({
  date,
  projects,
  onProjectClick,
}: VirtualizedListViewProps) {
  // Memoize days calculation to prevent unnecessary re-renders
  const { days, startDate, endDate } = useMemo(() => {
    const startDate = startOfMonth(date);
    const endDate = endOfMonth(addMonths(date, 1)); // Show 2 months
    
    const days = eachDayOfInterval({
      start: startDate,
      end: endDate,
    });
    
    return { days, startDate, endDate };
  }, [date]);

  const calculatePosition = (project: Project, column: number = 0) => {
    const startDate = new Date(project.start_date);
    const endDate = project.end_date ? new Date(project.end_date) : startDate;
    const currentMonthStart = startOfMonth(date);
    const nextMonthEnd = endOfMonth(addMonths(date, 1));
    
    // Ensure dates are within the two-month range
    const effectiveStartDate = startDate < currentMonthStart ? currentMonthStart : startDate;
    const effectiveEndDate = endDate > nextMonthEnd ? nextMonthEnd : endDate;
    
    // Calculate duration within the visible range
    const duration = differenceInDays(effectiveEndDate, effectiveStartDate) + 1;
    
    return {
      top: '0px', // Will be positioned by the virtualized list
      height: `${duration * 32 - 4}px`,
      left: `${column * 95}px`, // Reduced spacing between columns
    };
  };

  // Improved overlap detection and column assignment algorithm
  const { projectsWithColumns, minWidth } = useMemo(() => {
    // First sort projects by start date to ensure consistent column assignment
    const sortedProjects = [...projects].sort((a, b) => 
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );
    
    // Clear map of project IDs to columns to prevent duplicates
    const projectColumns = new Map<string, number>();
    
    // Assign columns to projects
    sortedProjects.forEach(project => {
      // Skip if already assigned (prevents duplicates)
      if (projectColumns.has(project.id)) return;
      
      let column = 0;
      let overlapping = true;
      
      // Keep increasing column until we find a non-overlapping position
      while (overlapping) {
        overlapping = false;
        
        // Check against all previously assigned projects
        for (const [existingId, existingColumn] of projectColumns.entries()) {
          // Skip if not in the same column
          if (existingColumn !== column) continue;
          
          // Get the existing project
          const existingProject = sortedProjects.find(p => p.id === existingId);
          if (!existingProject) continue;
          
          // Check if they overlap
          if (projectsOverlap(existingProject, project)) {
            overlapping = true;
            column++;
            break;
          }
        }
      }
      
      // Assign the found column
      projectColumns.set(project.id, column);
    });
    
    // Create array of projects with their columns
    const projectsWithColumns = sortedProjects.map(project => ({
      project,
      column: projectColumns.get(project.id) || 0
    }));

    // Calculate the minimum width needed based on the number of columns
    const maxColumn = Math.max(...projectsWithColumns.map(p => p.column), 0);
    const minWidth = Math.max(300, (maxColumn + 1) * 95 + 60); // Reduced minimum width for mobile
    
    return { projectsWithColumns, minWidth };
  }, [projects]);

  return (
    <Card className="h-full rounded-xl border bg-card text-card-foreground shadow">
      <CardContent className="p-0 h-full">
        <div className="h-full overflow-auto">
          <div className="grid grid-cols-[60px_1fr] h-full min-h-full"
            role="grid"
            aria-label="Project calendar view"
          >
            <div className="bg-background z-10 sticky left-0">
              <DateColumn days={days} startDate={startDate} />
            </div>
            <div className="relative" style={{ minWidth: `${minWidth}px` }}>
              <div style={{ height: days.length * 32, position: 'relative' }}>
              {days.map((day, index) => (
                <div 
                  key={day.toISOString()}
                  className={cn(
                    "absolute w-full h-[32px] border-b",
                    index === days.length - 1 && "border-b-0",
                    isWeekend(day) && "bg-[#F5F5F5] dark:bg-neutral-800",
                    isSameMonth(day, startDate) && isSameDay(day, endOfMonth(startDate)) && "border-b-2 border-b-primary/50"
                  )}
                  style={{ 
                    top: index * 32,
                    minWidth: `${minWidth}px`
                  }}
                >
                  {/* Day content can go here if needed */}
                </div>
              ))}
              
              {/* Project cards positioned absolutely */}
              {projectsWithColumns.map(({ project, column }) => {
                const startDate = new Date(project.start_date);
                const endDate = project.end_date ? new Date(project.end_date) : startDate;
                
                // Find day index for positioning
                const startDayIndex = days.findIndex(day => 
                  isSameDay(day, startDate)
                );
                
                if (startDayIndex === -1) return null;
                
                const duration = differenceInDays(endDate, startDate) + 1;
                
                return (
                  <TooltipProvider key={project.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="absolute"
                          style={{
                            top: startDayIndex * 32 + 2,
                            left: column * 95 + 60, // Left margin + column spacing
                            height: `${Math.min(duration * 32 - 4, (days.length - startDayIndex) * 32 - 4)}px`,
                            width: '85px',
                            zIndex: 10
                          }}
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
                            className={`
                              rounded-xl border bg-card text-card-foreground shadow h-full
                              px-1.5 cursor-pointer hover:opacity-80 transition-opacity
                              ${eventColors[project.event_type as keyof typeof eventColors] || 'bg-blue-200 text-blue-800'}
                              ${duration <= 2 ? 'flex items-center justify-center' : 'flex flex-col justify-center py-0.5'}
                            `}
                            onClick={() => onProjectClick(project)}
                          >
                            {duration <= 2 ? (
                              <div className="text-[10px] font-medium text-center line-clamp-2">
                                {project.title.length > 20 ? `${project.title.slice(0, 20)}...` : project.title}
                              </div>
                            ) : (
                              <div className="space-y-0.5 w-full">
                                <div className="font-medium text-xs sm:text-[10px] text-center line-clamp-2">
                                  {project.title}
                                </div>
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
                        <ProjectTooltip project={project} />
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}