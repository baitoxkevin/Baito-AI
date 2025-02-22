import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import EditProjectDialog from './EditProjectDialog';
import NewProjectDialog from './NewProjectDialog';

const eventColors = {
  'roving': 'bg-red-200 text-red-800',
  'roadshow': 'bg-blue-200 text-blue-800',
  'in-store': 'bg-purple-200 text-purple-800',
  'ad-hoc': 'bg-yellow-200 text-yellow-800',
  'corporate': 'bg-green-200 text-green-800',
  'wedding': 'bg-pink-200 text-pink-800',
  'concert': 'bg-indigo-200 text-indigo-800',
  'conference': 'bg-orange-200 text-orange-800',
  'other': 'bg-gray-200 text-gray-800',
} as const;

export default function EventListPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

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
          supervisors_required
        `)
        .or(`and(start_date.gte.${monthStart.toISOString()},start_date.lte.${monthEnd.toISOString()}),and(end_date.gte.${monthStart.toISOString()},end_date.lte.${monthEnd.toISOString()}),and(start_date.lte.${monthStart.toISOString()},end_date.gte.${monthEnd.toISOString()})`)
        .order('start_date', { ascending: true });

      if (error) throw error;
      setProjects(data || []);
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
  }, [currentDate]);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const getProjectsForDay = (date: Date) => {
    return projects.filter(project => {
      const startDate = new Date(project.start_date);
      const endDate = project.end_date ? new Date(project.end_date) : startDate;
      
      return isWithinInterval(date, {
        start: startDate,
        end: endDate
      });
    });
  };

  const previousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Master Event List</h1>
          <Badge variant="outline" className="text-sm">
            {format(currentDate, 'MMMM yyyy')}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={previousMonth}>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
          <NewProjectDialog onProjectAdded={loadProjects} />
        </div>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-[100px_1fr] divide-x">
          {/* Left column - Dates */}
          <div className="pr-2">
            {daysInMonth.map((date) => (
              <div 
                key={date.toISOString()}
                className="flex items-center h-12 border-b last:border-b-0"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium w-7 text-right">
                    {date.getDate()}
                  </span>
                  <span className="text-xs text-muted-foreground uppercase">
                    {format(date, 'EEE')}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Right column - Events */}
          <div className="pl-4">
            {daysInMonth.map((date) => {
              const dayProjects = getProjectsForDay(date);
              return (
                <div 
                  key={date.toISOString()}
                  className="flex items-center min-h-[48px] gap-2 border-b last:border-b-0"
                >
                  {dayProjects.map((project) => (
                    <div
                      key={project.id}
                      className={`
                        ${eventColors[project.event_type as keyof typeof eventColors]}
                        px-3 py-1.5 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity
                        flex items-center gap-2 shadow-sm
                      `}
                      onClick={() => {
                        setSelectedProject(project);
                        setEditDialogOpen(true);
                      }}
                    >
                      <span className="font-medium whitespace-nowrap">{project.title}</span>
                      {project.client?.full_name && (
                        <span className="text-[10px] opacity-75 whitespace-nowrap">
                          ({project.client.full_name})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {selectedProject && (
        <EditProjectDialog
          project={selectedProject}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onProjectUpdated={loadProjects}
        />
      )}
    </div>
  );
}
