import { useState, useEffect } from 'react';
import { 
  SearchIcon, 
  FilterIcon,
  ArrowUpDownIcon,
  ClockIcon,
  Plus,
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/lib/supabase';
import NewProjectDialog from './NewProjectDialog';
import EditProjectDialog from './EditProjectDialog';
import { useToast } from '@/hooks/use-toast';

const statusColors = {
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  "in-progress": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  new: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
} as const;

const priorityColors = {
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
} as const;

interface SupabaseProject {
  id: string;
  title: string;
  client: {
    full_name: string;
  } | null;
  client_id: string;
  manager_id: string;
  status: string;
  priority: string;
  start_date: string;
  end_date: string | null;
  crew_count: number;
  filled_positions: number;
  created_at: string;
  working_hours_start: string;
  working_hours_end: string;
  event_type: string;
  venue_address: string;
  venue_details: string | null;
  supervisors_required: number;
  deleted_at: string | null;
  deleted_by: string | null;
}

type Project = Omit<SupabaseProject, 'status' | 'priority'> & {
  client: {
    full_name: string;
  };
  status: keyof typeof statusColors;
  priority: keyof typeof priorityColors;
};

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const { toast } = useToast();

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: userData } = await supabase
        .from('users')
        .select('is_super_admin')
        .eq('id', user?.id)
        .single();

      const isSuperAdmin = userData?.is_super_admin === true;

      const query = supabase
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
          created_at,
          working_hours_start,
          working_hours_end,
          event_type,
          venue_address,
          venue_details,
          supervisors_required,
          deleted_at,
          deleted_by
        `)
        .order('created_at', { ascending: false });

      // Super admins see all projects, regular admins only see non-deleted
      if (!isSuperAdmin) {
        query.is('deleted_at', null);
      }

      const { data, error } = await query;

      if (error) throw error;
      const formattedProjects = (data || []).map((rawProject: any) => {
        const project: SupabaseProject = {
          ...rawProject,
          client: rawProject.client || null,
          deleted_at: rawProject.deleted_at || null,
          deleted_by: rawProject.deleted_by || null
        };
        return {
          ...project,
          client: { 
            full_name: project.client?.full_name || 'N/A'
          },
          status: project.status as keyof typeof statusColors,
          priority: project.priority as keyof typeof priorityColors,
        } as Project;
      });
      setProjects(formattedProjects);
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

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setEditDialogOpen(true);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.client?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Projects</h1>
        <div className="flex items-center gap-4">
          <Button onClick={() => setNewProjectDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
          <NewProjectDialog 
            open={newProjectDialogOpen}
            onOpenChange={setNewProjectDialogOpen}
            onProjectAdded={loadProjects}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <FilterIcon className="mr-2 h-4 w-4" />
              Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter("all")}>
              All
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("new")}>
              New
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("in-progress")}>
              In Progress
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("completed")}>
              Completed
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("cancelled")}>
              Cancelled
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <ArrowUpDownIcon className="mr-2 h-4 w-4" />
              Priority
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setPriorityFilter("all")}>
              All
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPriorityFilter("high")}>
              High
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPriorityFilter("medium")}>
              Medium
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPriorityFilter("low")}>
              Low
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No projects found. Create your first project to get started.</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Timeline</TableHead>
                <TableHead>Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project) => (
                <TableRow 
                  key={project.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleProjectClick(project)}
                >
                  <TableCell className="font-medium">{project.title}</TableCell>
                  <TableCell>{project.client?.full_name || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary"
                      className={statusColors[project.status]}
                    >
                      {project.status === "in-progress" ? "In Progress" : 
                        project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary"
                      className={priorityColors[project.priority]}
                    >
                      {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <ClockIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(project.start_date).toLocaleDateString()}
                        {project.end_date && ` - ${new Date(project.end_date).toLocaleDateString()}`}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2"
                          style={{ 
                            width: `${(project.filled_positions / project.crew_count * 100)}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {project.filled_positions}/{project.crew_count} positions filled
                      </span>
                    </div>
                   </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

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
