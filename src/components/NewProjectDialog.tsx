import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2Icon, Plus } from 'lucide-react';
import { ColorPicker } from "@/components/ui/color-picker";
import { PROJECT_COLORS } from '@/lib/colors';
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

const projectSchema = z.object({
  title: z.string().min(1, 'Project name is required'),
  client_id: z.string().min(1, 'Customer is required'),
  manager_id: z.string().min(1, 'Person in charge is required'),
  start_date: z.date({
    required_error: 'Start date is required',
  }).min(new Date(), 'Date cannot be in the past'),
  end_date: z.date().optional(),
  is_all_day: z.boolean().default(false),
  working_hours_start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  working_hours_end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  repeat_option: z.enum(['does-not-repeat', 'daily', 'weekly', 'monthly', 'yearly']).default('does-not-repeat'),
  event_type: z.enum(['roving', 'roadshow', 'in-store', 'ad-hoc', 'corporate', 'wedding', 'concert', 'conference', 'other']),
  crew_count: z.number().min(1, 'Must have at least one crew member'),
  venue_address: z.string().min(1, 'Venue address is required'),
  venue_details: z.string().optional(),
  needs_supervisors: z.boolean().default(false),
  supervisors_required: z.number().min(0).max(9).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').default(PROJECT_COLORS.blue),
  guest_permissions: z.object({
    modify: z.boolean().default(false),
    invite: z.boolean().default(true),
    see_guest_list: z.boolean().default(true)
  }).default({
    modify: false,
    invite: true,
    see_guest_list: true
  })
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectAdded?: () => void;
  initialDates?: { start: Date; end: Date } | null;
}

export default function NewProjectDialog({ 
  open, 
  onOpenChange, 
  onProjectAdded,
  initialDates 
}: NewProjectDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<{ id: string; full_name: string; }[]>([]);
  const [managers, setManagers] = useState<{ id: string; full_name: string; }[]>([]);
  const { toast } = useToast();
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: '',
      client_id: '',
      manager_id: '',
      event_type: 'corporate',
      working_hours_start: '09:00',
      working_hours_end: '17:00',
      needs_supervisors: false,
      supervisors_required: 0,
      crew_count: 1,
      venue_address: '',
      venue_details: '',
      start_date: initialDates?.start || new Date(),
      end_date: initialDates?.end,
      color: PROJECT_COLORS.blue,
      is_all_day: false,
      repeat_option: 'does-not-repeat',
      guest_permissions: {
        modify: false,
        invite: true,
        see_guest_list: true
      }
    },
  });

  useEffect(() => {
    if (initialDates) {
      form.setValue('start_date', initialDates.start);
      form.setValue('end_date', initialDates.end);
    }
  }, [initialDates, form]);

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

  useEffect(() => {
    if (open) {
      loadCustomers();
      loadManagers();
    }
  }, [open]);

  const onSubmit = async (data: ProjectFormValues) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('projects')
        .insert({
          title: data.title,
          client_id: data.client_id,
          manager_id: data.manager_id,
          start_date: data.start_date.toISOString(),
          end_date: data.end_date?.toISOString(),
          working_hours_start: data.is_all_day ? '00:00' : data.working_hours_start,
          working_hours_end: data.is_all_day ? '23:59' : data.working_hours_end,
          event_type: data.event_type,
          crew_count: data.crew_count,
          venue_address: data.venue_address,
          venue_details: data.venue_details,
          supervisors_required: data.needs_supervisors ? data.supervisors_required : 0,
          status: 'new',
          filled_positions: 0,
          priority: 'medium',
          priority_auto_set: false,
          color: data.color,
          is_all_day: data.is_all_day,
          repeat_option: data.repeat_option,
          guest_permissions: data.guest_permissions,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Project created successfully',
      });

      form.reset();
      onOpenChange(false);
      onProjectAdded?.();
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: 'Error creating project',
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
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Fill in the project details. Required fields are marked with an asterisk (*).
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
                          onClick={() => toast({ title: "Coming soon", description: "Adding new clients will be available in a future update" })}
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
                          onClick={() => toast({ title: "Coming soon", description: "Adding new managers will be available in a future update" })}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
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
                            disabled={(date) =>
                              date < new Date()
                            }
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
                Create Project
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
