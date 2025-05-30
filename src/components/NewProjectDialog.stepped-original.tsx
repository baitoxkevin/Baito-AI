import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CalendarIcon, 
  Loader2, 
  X,
  FileText,
  Palette,
  MapPin,
  Clock,
  Users,
  Cog,
  Share2,
  Info,
  Check,
  AlertCircle,
  Sparkles,
  Building2,
  User,
  Calendar as CalendarIconAlt,
  MapPinIcon,
  ClockIcon,
  UsersIcon,
  BriefcaseIcon
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { createProject } from '@/lib/projects';
import { useToast } from '@/hooks/use-toast';

// Define step types
type Step = 
  | 'project-info' 
  | 'event-details' 
  | 'location'
  | 'schedule' 
  | 'staffing'
  | 'advanced'
  | 'review';

const steps: { id: Step; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'project-info', label: 'Project Information', icon: FileText, description: 'Basic project details' },
  { id: 'event-details', label: 'Event Details', icon: Palette, description: 'Event type and description' },
  { id: 'location', label: 'Location', icon: MapPin, description: 'Venue information' },
  { id: 'schedule', label: 'Schedule', icon: Clock, description: 'Dates and times' },
  { id: 'staffing', label: 'Staffing', icon: Users, description: 'Crew requirements' },
  { id: 'advanced', label: 'Advanced Settings', icon: Cog, description: 'Status and priority' },
  { id: 'review', label: 'Review & Create', icon: Share2, description: 'Confirm details' },
];

const projectSchema = z.object({
  // Project Information
  title: z.string().min(1, 'Project name is required').max(100, 'Project name is too long'),
  client_id: z.string().min(1, 'Customer is required'),
  manager_id: z.string().min(1, 'Person in charge is required'),
  
  // Event Details
  event_type: z.string().min(1, 'Event type is required'),
  description: z.string().optional(),
  project_type: z.string().optional().default('recruitment'),
  
  // Location
  venue_address: z.string().min(1, 'Venue address is required'),
  venue_details: z.string().optional(),
  
  // Schedule
  start_date: z.date({
    required_error: 'Start date is required',
  }),
  end_date: z.date().optional(),
  working_hours_start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  working_hours_end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  schedule_type: z.string().optional().default('single'),
  
  // Staffing
  crew_count: z.number().min(1, 'Must have at least one crew member'),
  supervisors_required: z.number().min(0).max(9).optional(),
  
  // Advanced
  status: z.enum(['new', 'in-progress', 'completed', 'cancelled', 'pending']).default('new'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  budget: z.number().min(0).optional(),
}).refine((data) => {
  if (data.end_date && data.start_date > data.end_date) {
    return false;
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["end_date"],
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectAdded: () => void;
  initialDates?: { start: Date; end: Date } | null;
}

export function NewProjectDialog({
  open,
  onOpenChange,
  onProjectAdded,
  initialDates,
}: NewProjectDialogProps) {
  const [currentStep, setCurrentStep] = useState<Step>('project-info');
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<{ id: string; full_name: string; company_name?: string }[]>([]);
  const [managers, setManagers] = useState<{ id: string; full_name: string; }[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: '',
      client_id: '',
      manager_id: '',
      event_type: '',
      description: '',
      project_type: 'recruitment',
      venue_address: '',
      venue_details: '',
      start_date: initialDates?.start || new Date(),
      end_date: initialDates?.end,
      working_hours_start: '09:00',
      working_hours_end: '17:00',
      schedule_type: 'single',
      crew_count: 1,
      supervisors_required: 0,
      status: 'new',
      priority: 'medium',
      budget: 0,
    },
  });

  useEffect(() => {
    if (open) {
      fetchCustomersAndManagers();
      setCurrentStep('project-info');
      setValidationErrors([]);
    }
  }, [open]);

  const fetchCustomersAndManagers = async () => {
    try {
      const [companiesResult, managersResult] = await Promise.all([
        supabase.from('companies').select('id, company_name').order('company_name'),
        supabase.from('users').select('id, full_name, role').in('role', ['admin', 'super_admin', 'manager']).order('full_name')
      ]);

      if (companiesResult.error) throw companiesResult.error;
      if (managersResult.error) throw managersResult.error;

      setCustomers(companiesResult.data?.map(company => ({
        id: company.id,
        full_name: company.company_name,
        company_name: company.company_name
      })) || []);

      setManagers(managersResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load customers and managers",
        variant: "destructive",
      });
    }
  };

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleNext = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await form.trigger(fieldsToValidate as any);
    
    if (isValid) {
      setValidationErrors([]);
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < steps.length) {
        setCurrentStep(steps[nextIndex].id);
      }
    } else {
      const errors = Object.keys(form.formState.errors).map(
        key => form.formState.errors[key as keyof ProjectFormValues]?.message || ''
      ).filter(Boolean);
      setValidationErrors(errors);
    }
  };

  const handlePrevious = () => {
    setValidationErrors([]);
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const getFieldsForStep = (step: Step): (keyof ProjectFormValues)[] => {
    switch (step) {
      case 'project-info':
        return ['title', 'client_id', 'manager_id'];
      case 'event-details':
        return ['event_type', 'description', 'project_type'];
      case 'location':
        return ['venue_address', 'venue_details'];
      case 'schedule':
        return ['start_date', 'end_date', 'working_hours_start', 'working_hours_end', 'schedule_type'];
      case 'staffing':
        return ['crew_count', 'supervisors_required'];
      case 'advanced':
        return ['status', 'priority', 'budget'];
      default:
        return [];
    }
  };

  const onSubmit = async (values: ProjectFormValues) => {
    setIsLoading(true);
    try {
      await createProject({
        ...values,
        start_date: format(values.start_date, 'yyyy-MM-dd'),
        end_date: values.end_date ? format(values.end_date, 'yyyy-MM-dd') : null,
      });

      toast({
        title: "Success",
        description: "Project created successfully",
      });

      onProjectAdded();
      onOpenChange(false);
      
      // Reset form and step
      form.reset();
      setCurrentStep('project-info');
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'project-info':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Basic Information</CardTitle>
                <CardDescription>Let's start with the essential details of your project</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <BriefcaseIcon className="h-4 w-4 text-muted-foreground" />
                        Project Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="e.g., Annual Tech Conference 2024"
                          className="transition-all duration-200 hover:border-gray-400 focus:border-primary"
                        />
                      </FormControl>
                      <FormDescription>
                        Choose a clear, descriptive name for your project
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        Customer <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="transition-all duration-200 hover:border-gray-400">
                            <SelectValue placeholder="Select a customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                {customer.company_name || customer.full_name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The company or client this project is for
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="manager_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        Person in Charge <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="transition-all duration-200 hover:border-gray-400">
                            <SelectValue placeholder="Select a manager" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {managers.map((manager) => (
                            <SelectItem key={manager.id} value={manager.id}>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                {manager.full_name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The project manager responsible for this project
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </motion.div>
        );

      case 'event-details':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Event Information</CardTitle>
                <CardDescription>Provide details about the event type and nature</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="event_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Event Type <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="e.g., Conference, Wedding, Corporate Event"
                          className="transition-all duration-200 hover:border-gray-400 focus:border-primary"
                        />
                      </FormControl>
                      <FormDescription>
                        Specify the type of event you're organizing
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="project_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="transition-all duration-200 hover:border-gray-400">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="recruitment">Recruitment</SelectItem>
                          <SelectItem value="internal_event">Internal Event</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select how this project will be categorized
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Provide additional details about the project..."
                          rows={4}
                          className="transition-all duration-200 hover:border-gray-400 focus:border-primary resize-none"
                        />
                      </FormControl>
                      <FormDescription>
                        Any additional information that would be helpful
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </motion.div>
        );

      case 'location':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Venue Details</CardTitle>
                <CardDescription>Where will this event take place?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="venue_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                        Venue Address <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="123 Main Street, City, State"
                          className="transition-all duration-200 hover:border-gray-400 focus:border-primary"
                        />
                      </FormControl>
                      <FormDescription>
                        Full address of the venue
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="venue_details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Venue Information</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="e.g., Parking instructions, entry points, specific rooms..."
                          rows={3}
                          className="transition-all duration-200 hover:border-gray-400 focus:border-primary resize-none"
                        />
                      </FormControl>
                      <FormDescription>
                        Any specific details about the venue
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </motion.div>
        );

      case 'schedule':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Schedule Information</CardTitle>
                <CardDescription>Set the dates and working hours for your project</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <CalendarIconAlt className="h-4 w-4 text-muted-foreground" />
                          Start Date <span className="text-red-500">*</span>
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal transition-all duration-200 hover:border-gray-400",
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
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <CalendarIconAlt className="h-4 w-4 text-muted-foreground" />
                          End Date
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal transition-all duration-200 hover:border-gray-400",
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="working_hours_start"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <ClockIcon className="h-4 w-4 text-muted-foreground" />
                          Working Hours Start
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="time"
                            className="transition-all duration-200 hover:border-gray-400 focus:border-primary"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="working_hours_end"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <ClockIcon className="h-4 w-4 text-muted-foreground" />
                          Working Hours End
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="time"
                            className="transition-all duration-200 hover:border-gray-400 focus:border-primary"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="schedule_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Schedule Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="transition-all duration-200 hover:border-gray-400">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="single">Single Event</SelectItem>
                          <SelectItem value="recurring">Recurring Event</SelectItem>
                          <SelectItem value="multiple">Multiple Sessions</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How will this event be scheduled?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </motion.div>
        );

      case 'staffing':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Staffing Requirements</CardTitle>
                <CardDescription>How many people do you need for this project?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="crew_count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <UsersIcon className="h-4 w-4 text-muted-foreground" />
                        Total Crew Required <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number"
                          min="1"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          className="transition-all duration-200 hover:border-gray-400 focus:border-primary"
                        />
                      </FormControl>
                      <FormDescription>
                        The total number of crew members needed
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="supervisors_required"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        Supervisors Required
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number"
                          min="0"
                          max="9"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          className="transition-all duration-200 hover:border-gray-400 focus:border-primary"
                        />
                      </FormControl>
                      <FormDescription>
                        Number of supervisors from the total crew
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900 dark:text-blue-300">Staffing Tip</p>
                      <p className="text-blue-700 dark:text-blue-400 mt-1">
                        Consider including extra crew members for larger events to account for breaks and unexpected situations.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 'advanced':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Advanced Settings</CardTitle>
                <CardDescription>Configure status, priority, and budget</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="transition-all duration-200 hover:border-gray-400">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="new">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-blue-500" />
                              New
                            </div>
                          </SelectItem>
                          <SelectItem value="pending">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-yellow-500" />
                              Pending
                            </div>
                          </SelectItem>
                          <SelectItem value="in-progress">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-green-500" />
                              In Progress
                            </div>
                          </SelectItem>
                          <SelectItem value="completed">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-gray-500" />
                              Completed
                            </div>
                          </SelectItem>
                          <SelectItem value="cancelled">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-red-500" />
                              Cancelled
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority Level</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="transition-all duration-200 hover:border-gray-400">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">Low</Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="medium">
                            <div className="flex items-center gap-2">
                              <Badge variant="default">Medium</Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="high">
                            <div className="flex items-center gap-2">
                              <Badge variant="destructive">High</Badge>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Budget (RM)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            RM
                          </span>
                          <Input 
                            {...field} 
                            type="number"
                            step="0.01"
                            min="0"
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            className="pl-12 transition-all duration-200 hover:border-gray-400 focus:border-primary"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Optional budget allocation for this project
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </motion.div>
        );

      case 'review':
        const values = form.getValues();
        const customer = customers.find(c => c.id === values.client_id);
        const manager = managers.find(m => m.id === values.manager_id);
        
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  Project Summary
                </CardTitle>
                <CardDescription>Review all details before creating your project</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Project Info */}
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Project Information</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Project Name</p>
                        <p className="font-medium">{values.title || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Event Type</p>
                        <p className="font-medium">{values.event_type || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Customer</p>
                        <p className="font-medium">{customer?.company_name || customer?.full_name || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Manager</p>
                        <p className="font-medium">{manager?.full_name || '-'}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Schedule & Location */}
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Schedule & Location</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Start Date</p>
                        <p className="font-medium">{values.start_date ? format(values.start_date, 'PPP') : '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">End Date</p>
                        <p className="font-medium">{values.end_date ? format(values.end_date, 'PPP') : 'Single day'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Working Hours</p>
                        <p className="font-medium">{values.working_hours_start} - {values.working_hours_end}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Venue</p>
                        <p className="font-medium truncate">{values.venue_address || '-'}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Staffing & Settings */}
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Staffing & Settings</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Total Crew</p>
                        <p className="font-medium">{values.crew_count} members</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Supervisors</p>
                        <p className="font-medium">{values.supervisors_required || 0} required</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge variant={values.status === 'new' ? 'default' : 'secondary'}>
                          {values.status}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Priority</p>
                        <Badge variant={values.priority === 'high' ? 'destructive' : values.priority === 'medium' ? 'default' : 'secondary'}>
                          {values.priority}
                        </Badge>
                      </div>
                    </div>
                    {values.budget && values.budget > 0 && (
                      <div className="mt-3 space-y-1">
                        <p className="text-sm text-muted-foreground">Budget</p>
                        <p className="font-medium">RM {values.budget.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-900 dark:text-amber-300">Ready to create?</p>
                  <p className="text-amber-700 dark:text-amber-400 mt-1">
                    Once created, you can add staff members and manage all project details.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl p-0 h-[90vh] max-h-[720px] overflow-hidden">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex h-full">
            {/* Left Sidebar */}
            <div className="w-80 bg-gray-50 dark:bg-gray-900/50 p-6 flex flex-col border-r">
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Create New Project</h2>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onOpenChange(false)}
                    className="hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Follow the steps below to set up your new project
                </p>
              </div>

              <nav className="space-y-1 flex-1">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = currentStep === step.id;
                  const isCompleted = currentStepIndex > index;

                  return (
                    <motion.button
                      key={step.id}
                      type="button"
                      onClick={() => {
                        if (isCompleted || currentStepIndex === index) {
                          setCurrentStep(step.id);
                        }
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                        isActive
                          ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm"
                          : isCompleted
                          ? "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                          : "text-gray-400 dark:text-gray-500 cursor-not-allowed"
                      )}
                      disabled={!isCompleted && currentStepIndex !== index}
                      whileHover={isCompleted || currentStepIndex === index ? { scale: 1.02 } : {}}
                      whileTap={isCompleted || currentStepIndex === index ? { scale: 0.98 } : {}}
                    >
                      <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-200",
                        isActive
                          ? "bg-primary text-white"
                          : isCompleted
                          ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400"
                          : "bg-gray-200 dark:bg-gray-700"
                      )}>
                        {isCompleted ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium">{step.label}</p>
                        <p className="text-xs text-muted-foreground">{step.description}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </nav>

              <div className="mt-6">
                <div className="text-xs text-muted-foreground mb-2">
                  Step {currentStepIndex + 1} of {steps.length}
                </div>
                <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <motion.div 
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div className="flex-1 flex flex-col">
              <div className="flex-1 p-8 overflow-y-auto">
                {validationErrors.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4"
                  >
                    <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                          <div>
                            <p className="font-medium text-red-900 dark:text-red-300">
                              Please fix the following errors:
                            </p>
                            <ul className="mt-2 space-y-1">
                              {validationErrors.map((error, index) => (
                                <li key={index} className="text-sm text-red-700 dark:text-red-400">
                                  • {error}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                <AnimatePresence mode="wait">
                  {renderStepContent()}
                </AnimatePresence>
              </div>

              <div className="border-t p-6 bg-gray-50 dark:bg-gray-900/30">
                <div className="flex justify-between gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (currentStepIndex === 0) {
                        onOpenChange(false);
                      } else {
                        handlePrevious();
                      }
                    }}
                    className="min-w-[100px]"
                  >
                    {currentStepIndex === 0 ? 'Cancel' : 'Previous'}
                  </Button>

                  {currentStep === 'review' ? (
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="min-w-[140px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Create Project
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button 
                      type="button" 
                      onClick={handleNext}
                      className="min-w-[100px]"
                    >
                      Continue
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Default export for backward compatibility
export default NewProjectDialog;