import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2Icon, X, Shield, Plus } from 'lucide-react';
import { ColorPicker } from "@/components/ui/color-picker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

type CrewAssignment = {
  id: string;
  project_id: string;
  position_number: number;
  assigned_to?: string;
  supervisor_id?: string;
  is_supervisor: boolean;
  assigned_at?: string;
  status: 'vacant' | 'assigned';
  crew_member_name?: string;
  crew_member_email?: string;
  crew_member_experience?: number;
  supervisor_name?: string;
  supervisor_email?: string;
  supervisor_experience?: number;
};

type Candidate = {
  id: string;
  full_name: string;
  email: string;
  status: string;
  rating: number;
  experience_years: number;
};

const projectSchema = z.object({
  title: z.string().min(1, 'Project name is required'),
  client_id: z.string().min(1, 'Customer is required'),
  manager_id: z.string().min(1, 'Person in charge is required'),
  start_date: z.date({
    required_error: 'Start date is required',
  }),
  end_date: z.date().optional(),
  working_hours_start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  working_hours_end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  event_type: z.enum(['roving', 'roadshow', 'in-store', 'ad-hoc', 'corporate', 'wedding', 'concert', 'conference', 'other']),
  crew_count: z.number().min(1, 'Must have at least one crew member'),
  venue_address: z.string().min(1, 'Venue address is required'),
  venue_details: z.string().optional(),
  needs_supervisors: z.boolean().default(false),
  supervisors_required: z.number().min(0).max(9).optional(),
  status: z.enum(['new', 'in-progress', 'completed', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high']),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').default('#E2E8F0'),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface EditProjectDialogProps {
  project: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectUpdated: () => void;
}

export default function EditProjectDialog({
  project,
  open,
  onOpenChange,
  onProjectUpdated,
}: EditProjectDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<{ id: string; full_name: string; }[]>([]);
  const [managers, setManagers] = useState<{ id: string; full_name: string; }[]>([]);
  const [crewAssignments, setCrewAssignments] = useState<CrewAssignment[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [supervisors, setSupervisors] = useState<Candidate[]>([]);
  const [newClientDialogOpen, setNewClientDialogOpen] = useState(false);
  const [newManagerDialogOpen, setNewManagerDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: project.title,
      client_id: project.client_id,
      manager_id: project.manager_id,
      start_date: new Date(project.start_date),
      end_date: project.end_date ? new Date(project.end_date) : undefined,
      working_hours_start: project.working_hours_start,
      working_hours_end: project.working_hours_end,
      event_type: project.event_type,
      crew_count: project.crew_count,
      venue_address: project.venue_address,
      venue_details: project.venue_details || '',
      needs_supervisors: project.supervisors_required > 0,
      supervisors_required: project.supervisors_required,
      status: project.status,
      priority: project.priority,
      color: project.color || '#E2E8F0',
    },
  });

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('role', 'client');
      
      if (error) {
        toast({
          title: 'Error loading customers',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast({
        title: 'Error loading customers',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  const loadManagers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('role', 'manager');
      
      if (error) {
        toast({
          title: 'Error loading managers',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      setManagers(data);
    } catch (error) {
      console.error('Error loading managers:', error);
      toast({
        title: 'Error loading managers',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  const loadCrewAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('crew_assignments_with_supervisors')
        .select('*')
        .eq('project_id', project.id)
        .order('position_number');

      if (error) throw error;
      setCrewAssignments(data || []);
    } catch (error) {
      console.error('Error loading crew assignments:', error);
      toast({
        title: 'Error loading crew assignments',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  const loadCandidates = async () => {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('status', 'available')
        .order('rating', { ascending: false });

      if (error) throw error;
      
      // Split candidates into regular crew and potential supervisors
      const allCandidates = data || [];
      setCandidates(allCandidates);
      setSupervisors(allCandidates.filter(c => c.experience_years >= 2));
    } catch (error) {
      console.error('Error loading candidates:', error);
      toast({
        title: 'Error loading candidates',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (open) {
      loadCustomers();
      loadManagers();
      loadCrewAssignments();
      loadCandidates();
    }
  }, [open, project.id]);

  const handleAssignCrew = async (positionNumber: number, candidateId: string, isSupervisor: boolean = false) => {
    if (!candidateId) {
      toast({
        title: 'Error',
        description: 'Please select a crew member to assign',
        variant: 'destructive',
      });
      return;
    }

    // Check if we're trying to assign a supervisor
    if (isSupervisor) {
      // Count current supervisors
      const currentSupervisors = crewAssignments.filter(a => a.is_supervisor).length;
      if (currentSupervisors >= project.supervisors_required) {
        toast({
          title: 'Error',
          description: `Maximum number of supervisors (${project.supervisors_required}) already assigned`,
          variant: 'destructive',
        });
        return;
      }
    }

    setLoadingAssignments(true);
    try {
      const { error: assignmentError } = await supabase
        .from('crew_assignments')
        .update({
          assigned_to: candidateId,
          assigned_at: new Date().toISOString(),
          status: 'assigned',
          is_supervisor: isSupervisor,
          supervisor_id: null // Reset supervisor when assigning new crew member
        })
        .eq('project_id', project.id)
        .eq('position_number', positionNumber);

      if (assignmentError) throw assignmentError;

      toast({
        title: 'Success',
        description: `${isSupervisor ? 'Supervisor' : 'Crew member'} assigned successfully`,
      });

      await loadCrewAssignments();
    } catch (error) {
      console.error('Error assigning crew member:', error);
      toast({
        title: 'Error assigning crew member',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoadingAssignments(false);
    }
  };

  const handleAssignSupervisor = async (crewMemberId: string, supervisorId: string | null) => {
    if (!crewMemberId) {
      toast({
        title: 'Error',
        description: 'Invalid crew member',
        variant: 'destructive',
      });
      return;
    }

    setLoadingAssignments(true);
    try {
      const { error: assignmentError } = await supabase
        .from('crew_assignments')
        .update({
          supervisor_id: supervisorId
        })
        .eq('project_id', project.id)
        .eq('assigned_to', crewMemberId);

      if (assignmentError) throw assignmentError;

      toast({
        title: 'Success',
        description: supervisorId ? 'Supervisor assigned successfully' : 'Supervisor removed successfully',
      });

      await loadCrewAssignments();
    } catch (error) {
      console.error('Error assigning supervisor:', error);
      toast({
        title: 'Error assigning supervisor',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoadingAssignments(false);
    }
  };

  const handleRemoveCrew = async (positionNumber: number) => {
    setLoadingAssignments(true);
    try {
      const { error: assignmentError } = await supabase
        .from('crew_assignments')
        .update({
          assigned_to: null,
          assigned_at: null,
          status: 'vacant',
          is_supervisor: false,
          supervisor_id: null
        })
        .eq('project_id', project.id)
        .eq('position_number', positionNumber);

      if (assignmentError) throw assignmentError;

      toast({
        title: 'Success',
        description: 'Crew member removed successfully',
      });

      await loadCrewAssignments();
    } catch (error) {
      console.error('Error removing crew member:', error);
      toast({
        title: 'Error removing crew member',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoadingAssignments(false);
    }
  };

  const onSubmit = async (data: ProjectFormValues) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          title: data.title,
          client_id: data.client_id,
          manager_id: data.manager_id,
          start_date: data.start_date.toISOString(),
          end_date: data.end_date?.toISOString(),
          working_hours_start: data.working_hours_start,
          working_hours_end: data.working_hours_end,
          event_type: data.event_type,
          crew_count: data.crew_count,
          venue_address: data.venue_address,
          venue_details: data.venue_details,
          supervisors_required: data.needs_supervisors ? data.supervisors_required : 0,
          status: data.status,
          priority: data.priority,
          color: data.color,
        })
        .eq('id', project.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Project updated successfully',
      });

      onOpenChange(false);
      onProjectUpdated();
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: 'Error updating project',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update the project details. Required fields are marked with an asterisk (*).
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Client *</FormLabel>
                      <div className="flex gap-2">
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select client" />
                          </SelectTrigger>
                          <SelectContent>
                            {customers.map((customer) => (
                              <SelectItem key={customer.id} value={customer.id}>
                                {customer.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setNewClientDialogOpen(true)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="manager_id"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Person in Charge *</FormLabel>
                      <div className="flex gap-2">
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select manager" />
                          </SelectTrigger>
                          <SelectContent>
                            {managers.map((manager) => (
                              <SelectItem key={manager.id} value={manager.id}>
                                {manager.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setNewManagerDialogOpen(true)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Color</FormLabel>
                    <FormControl>
                      <ColorPicker
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Status *</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Priority *</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Project Schedule</h3>
              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Start Date *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < form.getValues('start_date')
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="working_hours_start"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Working Hours Start *</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="working_hours_end"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Working Hours End *</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Event Details</h3>
              <FormField
                control={form.control}
                name="event_type"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Event Type *</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select event type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="roving">Roving</SelectItem>
                          <SelectItem value="roadshow">Roadshow</SelectItem>
                          <SelectItem value="in-store">In-store</SelectItem>
                          <SelectItem value="ad-hoc">Ad-hoc</SelectItem>
                          <SelectItem value="corporate">Corporate</SelectItem>
                          <SelectItem value="wedding">Wedding</SelectItem>
                          <SelectItem value="concert">Concert</SelectItem>
                          <SelectItem value="conference">Conference</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="venue_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Venue Address *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="venue_details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Venue Details</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Additional venue information" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Staffing</h3>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="crew_count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Crew Members *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          value={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="needs_supervisors"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Additional Supervisor(s) Required
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch('needs_supervisors') && (
                  <FormField
                    control={form.control}
                    name="supervisors_required"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Supervisors</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={9}
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            value={field.value}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Crew Assignments</h3>
              <div className="grid gap-4">
                {Array.from({ length: form.watch('crew_count') }).map((_, index) => {
                  const assignment = crewAssignments.find(a => a.position_number === index + 1);
                  const isSupervisorPosition = index < form.watch('supervisors_required');
                  const availableSupervisors = supervisors.filter(s => 
                    !crewAssignments.some(a => a.assigned_to === s.id && a.is_supervisor)
                  );

                  return (
                    <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-2">
                          Position {index + 1}
                          {isSupervisorPosition && (
                            <Shield className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        {assignment?.assigned_to ? (
                          <div className="space-y-1">
                            <div className="text-sm">
                              {assignment.crew_member_name} ({assignment.crew_member_email})
                            </div>
                            {!assignment.is_supervisor && (
                              <div className="text-sm text-muted-foreground">
                                Supervisor: {assignment.supervisor_name || 'None'}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">Unassigned</div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {assignment?.assigned_to ? (
                          <>
                            {!assignment.is_supervisor && (
                              <Select
                                disabled={loadingAssignments}
                                value={assignment.supervisor_id || 'none'}
                                onValueChange={(value) => handleAssignSupervisor(assignment.assigned_to!, value === 'none' ? null : value)}
                              >
                                <SelectTrigger className="w-[200px]">
                                  <SelectValue placeholder="Assign supervisor" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">No Supervisor</SelectItem>
                                  {crewAssignments
                                    .filter(a => a.is_supervisor)
                                    .map((supervisor) => (
                                      <SelectItem key={supervisor.assigned_to} value={supervisor.assigned_to!}>
                                        {supervisor.crew_member_name}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveCrew(index + 1)}
                              disabled={loadingAssignments}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Select
                            disabled={loadingAssignments}
                            onValueChange={(value) => handleAssignCrew(index + 1, value, isSupervisorPosition)}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder={
                                isSupervisorPosition ? "Assign supervisor" : "Assign crew member"
                              } />
                            </SelectTrigger>
                            <SelectContent>
                              {(isSupervisorPosition ? availableSupervisors : candidates).map((candidate) => (
                                <SelectItem key={candidate.id} value={candidate.id}>
                                  {candidate.full_name} ({candidate.experience_years}y, {candidate.rating}★)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                     </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
