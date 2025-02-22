import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, differenceInDays, isSameMonth, isSameDay, addMonths, subMonths, isAfter, isBefore } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { getColorWithOpacity } from '@/lib/colors';
import { Project, isProject } from '@/lib/types';
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Calendar as CalendarIcon,
  List as ListIcon,
  Plus,
  Clock,
  Users,
  MapPin,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import EditProjectDialog from './EditProjectDialog';
import NewProjectDialog from './NewProjectDialog';

// Project colors are now stored in the database

const formatTimeString = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(':');
  const date = new Date();
  date.setHours(parseInt(hours, 10));
  date.setMinutes(parseInt(minutes, 10));
  return format(date, 'h:mm a');
};

// Using Project type from @/lib/types

const projectsOverlap = (a: Project, b: Project) => {
  const aStart = new Date(a.start_date);
  const aEnd = a.end_date ? new Date(a.end_date) : aStart;
  const bStart = new Date(b.start_date);
  const bEnd = b.end_date ? new Date(b.end_date) : bStart;

  return aStart <= bEnd && aEnd >= bStart;
};

// Removed unused function

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

const CalendarView = ({
  date,
  projects,
  onProjectClick,
  onDateRangeSelect,
}: {
  date: Date;
  projects: Project[];
  onProjectClick: (project: Project) => void;
  onDateRangeSelect: (startDate: Date, endDate: Date) => void;
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartDate, setDragStartDate] = useState<Date | null>(null);
  const [dragEndDate, setDragEndDate] = useState<Date | null>(null);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);

  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(calendarStart.getDate() - (monthStart.getDay() - 1 + 7) % 7);
  const calendarEnd = new Date(monthEnd);
  const daysToAdd = (7 - calendarEnd.getDay()) % 7;
  calendarEnd.setDate(calendarEnd.getDate() + daysToAdd);
  const daysInMonth = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

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

  const handleMouseUp = () => {
    if (isDragging && dragStartDate && dragEndDate) {
      const start = dragStartDate < dragEndDate ? dragStartDate : dragEndDate;
      const end = dragStartDate < dragEndDate ? dragEndDate : dragStartDate;
      onDateRangeSelect(start, end);
    }
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
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragStartDate, dragEndDate]);

  const isDateSelected = (day: Date) => {
    return selectedDates.some(selectedDate => 
      isSameDay(selectedDate, day)
    );
  };

  const today = new Date();
  const weeks = Math.ceil(daysInMonth.length / 7);

  return (
    <Card className="flex-none rounded-xl border bg-card text-card-foreground shadow">
      <CardContent className="p-4">
        <div className="grid grid-cols-7 gap-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="h-8 flex items-center justify-center">
              <span className="text-sm font-medium text-muted-foreground">{day}</span>
            </div>
          ))}

          {Array.from({ length: weeks }).map((_, weekIndex) => (
            <div key={weekIndex} className="col-span-7 relative">
              <div className="grid grid-cols-7 gap-2">
                {daysInMonth.slice(weekIndex * 7, (weekIndex + 1) * 7).map((day) => {
                  const isToday = day.getDate() === today.getDate() && 
                                day.getMonth() === today.getMonth() && 
                                day.getFullYear() === today.getFullYear();
                  const isCurrentMonth = isSameMonth(day, date);
                  const isHighlighted = isDateSelected(day);
                  
                  return (
                    <div
                      key={day.toISOString()}
                      className={`
                        relative h-[180px] border p-1 rounded-lg cursor-pointer
                        transition-colors duration-200
                        ${!isCurrentMonth ? 'bg-muted/50 text-muted-foreground' : ''}
                        ${isHighlighted ? 'bg-primary/10 border-primary' : 'border-muted'}
                      `}
                      onMouseDown={() => handleMouseDown(day)}
                      onMouseEnter={() => handleMouseMove(day)}
                    >
                      <div className="flex justify-end">
                        <div className={`
                          relative flex items-center justify-center w-7 h-7
                          ${isToday ? 'before:absolute before:inset-0 before:rounded-full before:border-2 before:border-primary' : ''}
                        `}>
                          <span className="text-sm font-medium relative z-10">{day.getDate()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="absolute inset-0 pointer-events-none">
                {(() => {
                  const weekStart = new Date(daysInMonth[weekIndex * 7]);
                  const weekProjects = projects.filter(project => {
                    const startDate = new Date(project.start_date);
                    const endDate = project.end_date ? new Date(project.end_date) : startDate;
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    
                    return startDate <= weekEnd && endDate >= weekStart;
                  });
                  
                  const groups = groupOverlappingProjects(weekProjects);
                  
                  return groups.map((group, groupIndex) => (
                    <div key={groupIndex} className="absolute inset-0">
                      {group.map((project) => {
                        const startDate = new Date(project.start_date);
                        const endDate = project.end_date ? new Date(project.end_date) : startDate;
                        
                        const projectStartDay = Math.max(0, Math.floor((startDate.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)));
                        const projectEndDay = Math.min(6, Math.floor((endDate.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)));
                        
                        const left = `${(projectStartDay / 7) * 100}%`;
                        const width = `${((projectEndDay - projectStartDay + 1) / 7) * 100}%`;
                        
                        const heightPerProject = 24;
                        const top = 36 + (groupIndex * heightPerProject);
                        
                        return (
                          <TooltipProvider key={project.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className="absolute pointer-events-auto"
                                  style={{
                                    left,
                                    width,
                                    top: `${top}px`,
                                    height: `${heightPerProject - 2}px`,
                                    paddingLeft: '2px',
                                    paddingRight: '2px'
                                  }}
                                >
                                  <div 
                                    className="rounded-md border shadow h-full px-2 py-1 cursor-pointer hover:opacity-80 transition-opacity flex items-center overflow-hidden"
                                    style={{
                                      backgroundColor: getColorWithOpacity(project.color, 0.2),
                                      color: project.color,
                                      borderColor: project.color
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onProjectClick(project);
                                    }}
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs font-medium truncate">
                                        {project.title}
                                      </div>
                                    </div>
                                  </div>
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
                  ));
                })()}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const ListView = ({
  date,
  projects,
  onProjectClick,
}: {
  date: Date;
  projects: Project[];
  onProjectClick: (project: Project) => void;
}) => {
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(date),
    end: endOfMonth(date),
  });

  const calculatePosition = (project: Project, column: number = 0) => {
    const startDate = new Date(project.start_date);
    const endDate = project.end_date ? new Date(project.end_date) : startDate;
    const monthStart = startOfMonth(date);
    
    const startDays = Math.max(0, differenceInDays(startDate, monthStart));
    const duration = differenceInDays(endDate, startDate) + 1;
    
    return {
      top: `${startDays * 48 + 10}px`,
      height: `${duration * 48 - 10}px`,
      left: `${column * 160}px`,
    };
  };

  const projectsWithColumns = projects.reduce((acc: { project: Project; column: number }[], project) => {
    let column = 0;
    while (acc.some(p => p.column === column && projectsOverlap(p.project, project))) {
      column++;
    }
    acc.push({ project, column });
    return acc;
  }, []);

  return (
    <Card className="h-full rounded-xl border bg-card text-card-foreground shadow">
      <CardContent className="p-0">
        <div className="grid grid-cols-[100px_1fr] divide-x">
          <div className="sticky left-0 bg-background z-10 flex flex-col">
            {daysInMonth.map((day) => (
              <div 
                key={day.toISOString()}
                className="flex items-center justify-center h-12 border-b last:border-b-0"
              >
                <div className="flex flex-col items-center">
                  <span className="text-sm font-medium">
                    {day.getDate()}
                  </span>
                  <span className="text-xs text-muted-foreground uppercase">
                    {format(day, 'EEE')}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="relative min-h-full pl-4">
            <div className="absolute inset-0">
              {daysInMonth.map((day) => (
                <div 
                  key={day.toISOString()}
                  className="h-12 border-b last:border-b-0"
                />
              ))}
            </div>

            <div className="relative">
              {projectsWithColumns.map(({ project, column }) => {
                const position = calculatePosition(project, column);
                
                return (
                  <TooltipProvider key={project.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="absolute"
                          style={{
                            ...position,
                            width: '150px'
                          }}
                        >
                          <div 
                            className="rounded-xl border shadow h-full px-3 cursor-pointer hover:opacity-80 transition-opacity flex flex-col justify-center items-center text-center"
                            style={{
                              backgroundColor: getColorWithOpacity(project.color, 0.2),
                              color: project.color,
                              borderColor: project.color
                            }}
                            onClick={() => onProjectClick(project)}
                          >
                            <div className="space-y-1">
                              <div className="font-medium text-xs">
                                {project.title}
                              </div>
                              {project.client?.full_name && (
                                <div className="text-[10px] opacity-75">
                                  {project.client.full_name}
                                </div>
                              )}
                              <div className="text-[10px] opacity-75">
                                {formatTimeString(project.working_hours_start)} - {formatTimeString(project.working_hours_end)}
                              </div>
                              <div className="text-[10px] opacity-75">
                                {project.filled_positions}/{project.crew_count} crew
                              </div>
                            </div>
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
      </CardContent>
    </Card>
  );
};

export default function CalendarPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      // Calculate date range for fetching projects
      const startDate = startOfMonth(subMonths(date, 1)); // Include previous month
      const endDate = endOfMonth(addMonths(date, 1)); // Include next month

      const { data, error } = await supabase
        .from('projects')
        .select(`
          id,
          title,
          client:client_id(full_name),
          client_id,
          manager_id,
          status,
          priority,
          start_date,
          end_date,
          crew_count,
          filled_positions,
          working_hours_start,
          working_hours_end,
          event_type,
          venue_address,
          venue_details,
          supervisors_required,
          color
        `)
        .or(
          `and(start_date.gte.${startDate.toISOString()},start_date.lte.${endDate.toISOString()}),` +
          `and(end_date.gte.${startDate.toISOString()},end_date.lte.${endDate.toISOString()}),` +
          `and(start_date.lte.${startDate.toISOString()},end_date.gte.${endDate.toISOString()})`
        )
        .order('start_date', { ascending: true });

      if (error) throw error;

      if (data && Array.isArray(data)) {
        const validProjects = data.filter((item): item is Project => {
          if (!item) return false;
          return typeof item.id === 'string' &&
            typeof item.title === 'string' &&
            (!item.client || typeof item.client.full_name === 'string') &&
            typeof item.status === 'string' &&
            typeof item.priority === 'string' &&
            typeof item.start_date === 'string' &&
            (item.end_date === null || typeof item.end_date === 'string') &&
            typeof item.working_hours_start === 'string' &&
            typeof item.working_hours_end === 'string' &&
            typeof item.event_type === 'string' &&
            typeof item.venue_address === 'string' &&
            (item.venue_details === null || typeof item.venue_details === 'string') &&
            typeof item.supervisors_required === 'number' &&
            typeof item.crew_count === 'number' &&
            typeof item.filled_positions === 'number' &&
            typeof item.color === 'string';
        });
        setProjects(validProjects);
        if (validProjects.length !== data.length) {
          console.error('Some invalid project data received');
        }
      } else {
        setProjects([]);
        console.error('Invalid project data received');
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      toast({
        title: 'Error loading projects',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [date]);

  const handleProjectClick = (project: Project) => {
    // Reset the selected project and dialog state before setting new values
    setSelectedProject(null);
    setEditDialogOpen(false);
    
    // Use setTimeout to ensure state is cleared before setting new values
    setTimeout(() => {
      setSelectedProject(project);
      setEditDialogOpen(true);
    }, 0);
  };

  const handleDateRangeSelect = (startDate: Date, endDate: Date) => {
    setSelectedDateRange({ start: startDate, end: endDate });
    setNewProjectDialogOpen(true);
  };

  const getFilteredProjects = () => {
    if (view === 'calendar') {
      // For calendar view, show all projects that overlap with the current month
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      return projects.filter(project => {
        const projectStart = new Date(project.start_date);
        const projectEnd = project.end_date ? new Date(project.end_date) : projectStart;
        
        return (
          (isAfter(projectStart, monthStart) || isSameDay(projectStart, monthStart)) &&
          (isBefore(projectStart, monthEnd) || isSameDay(projectStart, monthEnd)) ||
          (isAfter(projectEnd, monthStart) || isSameDay(projectEnd, monthStart)) &&
          (isBefore(projectEnd, monthEnd) || isSameDay(projectEnd, monthEnd)) ||
          (isBefore(projectStart, monthStart) && isAfter(projectEnd, monthEnd))
        );
      });
    } else {
      // For list view, show all projects in the current month
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      return projects.filter(project => {
        const projectStart = new Date(project.start_date);
        return (
          (isAfter(projectStart, monthStart) || isSameDay(projectStart, monthStart)) &&
          (isBefore(projectStart, monthEnd) || isSameDay(projectStart, monthEnd))
        );
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const filteredProjects = getFilteredProjects();

  return (
    <div className="h-[calc(100vh-7rem)] w-full">
      <div className="flex-none flex justify-between items-center p-4 border-b bg-background">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Calendar</h1>
          <Badge variant="outline" className="text-sm">
            {format(date, 'MMMM yyyy')}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <button 
            className="p-2 hover:bg-muted rounded-md"
            onClick={() => setDate(prev => subMonths(prev, 1))}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button
            className="p-2 hover:bg-muted rounded-md"
            onClick={() => setDate(prev => addMonths(prev, 1))}
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
          <Tabs value={view} onValueChange={(v) => setView(v as 'calendar' | 'list')}>
            <TabsList>
              <TabsTrigger value="calendar">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="list">
                <ListIcon className="h-4 w-4 mr-2" />
                List
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <button 
            className="p-2 hover:bg-muted rounded-md flex items-center gap-2 text-sm"
            onClick={() => setNewProjectDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        {view === 'calendar' ? (
          <CalendarView
            date={date}
            projects={filteredProjects}
            onProjectClick={handleProjectClick}
            onDateRangeSelect={handleDateRangeSelect}
          />
        ) : (
          <div className="min-h-[1344px]">
            <ListView
              date={date}
              projects={filteredProjects}
              onProjectClick={handleProjectClick}
            />
          </div>
        )}
      </div>

      {selectedProject && (
        <EditProjectDialog
          project={selectedProject}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onProjectUpdated={loadProjects}
        />
      )}

      <NewProjectDialog
        open={newProjectDialogOpen}
        onOpenChange={setNewProjectDialogOpen}
        onProjectAdded={loadProjects}
        initialDates={selectedDateRange}
      />
    </div>
  );
}
