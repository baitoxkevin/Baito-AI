import React, { useState, useEffect } from 'react';
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
  Building2,
  User,
  DollarSign,
  ChevronRight,
  Briefcase,
  Calendar,
  MapPinIcon,
  UserCheck,
  Link
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from "@/components/ui/textarea";
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { createProject } from '@/lib/projects';
import { fetchBrandLogo } from '@/lib/logo-service';
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
  { id: 'project-info', label: 'Project Information', icon: FileText, description: 'Basic details about your project' },
  { id: 'event-details', label: 'Event Details', icon: Palette, description: 'Type and description of the event' },
  { id: 'location', label: 'Location', icon: MapPin, description: 'Where the project will take place' },
  { id: 'schedule', label: 'Schedule', icon: Clock, description: 'When the project will happen' },
  { id: 'staffing', label: 'Staffing', icon: Users, description: 'Team requirements' },
  { id: 'advanced', label: 'Advanced', icon: Cog, description: 'Additional settings' },
  { id: 'review', label: 'Review & Create', icon: Share2, description: 'Confirm all details' },
];

const projectSchema = z.object({
  // Project Information
  title: z.string().min(1, 'Project name is required'),
  client_id: z.string().min(1, 'Customer is required'),
  manager_id: z.string().min(1, 'Person in charge is required'),
  brand_name: z.string().optional(),
  brand_logo: z.string().url().optional().or(z.literal('')),
  
  // Event Details
  event_type: z.string().min(1, 'Event type is required'),
  description: z.string().optional(),
  project_type: z.enum(['recruitment', 'internal_event', 'custom']).optional(),
  
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
  status: z.enum(['planning', 'confirmed', 'in_progress', 'completed', 'cancelled']).default('planning'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  budget: z.number().min(0).optional(),
  invoice_number: z.string().optional(),
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
  const [customers, setCustomers] = useState<{ id: string; full_name: string; company_name?: string; logo_url?: string }[]>([]);
  const [managers, setManagers] = useState<{ id: string; full_name: string; }[]>([]);
  const [visitedSteps, setVisitedSteps] = useState<Set<Step>>(new Set(['project-info']));
  const { toast } = useToast();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: '',
      client_id: '',
      manager_id: '',
      brand_name: '',
      brand_logo: '',
      event_type: '',
      description: '',
      project_type: undefined,
      venue_address: '',
      venue_details: '',
      start_date: initialDates?.start || new Date(),
      end_date: initialDates?.end,
      working_hours_start: '09:00',
      working_hours_end: '18:00',
      schedule_type: 'single',
      crew_count: 1,
      supervisors_required: 0,
      status: 'planning',
      priority: 'medium',
      budget: 0,
      invoice_number: '',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (open) {
      // Reset to default values immediately
      form.reset({
        title: '',
        client_id: '',
        manager_id: '',
        brand_name: '',
        brand_logo: '',
        event_type: '',
        description: '',
        project_type: undefined,
        venue_address: '',
        venue_details: '',
        start_date: initialDates?.start || new Date(),
        end_date: initialDates?.end,
        working_hours_start: '09:00',
        working_hours_end: '18:00',
        schedule_type: 'single',
        crew_count: 1,
        supervisors_required: 0,
        status: 'planning',
        priority: 'medium',
        budget: 0,
        invoice_number: '',
      }, {
        keepErrors: false,
        keepDirty: false,
        keepValues: false,
        keepTouched: false,
        keepIsValid: false,
        keepIsSubmitting: false,
        keepIsValidating: false,
        keepSubmitCount: false,
      });
      
      fetchCustomersAndManagers();
      setCurrentStep('project-info');
      setVisitedSteps(new Set(['project-info']));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, form, initialDates]);

  const fetchCustomersAndManagers = async () => {
    try {
      const [companiesResult, managersResult] = await Promise.all([
        supabase.from('companies').select('id, name, company_name, logo_url').order('name'),
        supabase.from('users').select('id, full_name, role').in('role', ['admin', 'super_admin', 'manager']).order('full_name')
      ]);

      if (companiesResult.error) throw companiesResult.error;
      if (managersResult.error) throw managersResult.error;

      setCustomers(companiesResult.data?.map(company => ({
        id: company.id,
        full_name: company.company_name || company.name || 'Unknown Company',
        company_name: company.company_name || company.name || 'Unknown Company',
        logo_url: company.logo_url
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
    const isValid = await form.trigger(fieldsToValidate as (keyof ProjectFormValues)[]);
    
    if (isValid) {
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < steps.length) {
        const nextStep = steps[nextIndex].id;
        
        // Force a clean render of the next step
        setCurrentStep(nextStep);
        setVisitedSteps(prev => new Set([...prev, nextStep]));
      }
    }
    // Prevent form submission
    return false;
  };

  const handlePrevious = () => {
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
        return ['status', 'priority', 'budget', 'invoice_number'];
      default:
        return [];
    }
  };

  const onSubmit = async (values: ProjectFormValues) => {
    setIsLoading(true);
    try {
      // Convert empty strings to null for optional fields
      const processedData = {
        ...values,
        project_type: values.project_type || null,
        description: values.description || null,
        venue_details: values.venue_details || null,
        supervisors_required: values.supervisors_required ?? 0,
        budget: values.budget || null,
        invoice_number: values.invoice_number || null,
        brand_name: values.brand_name || null,
        brand_logo: values.brand_logo || null,
        start_date: format(values.start_date, 'yyyy-MM-dd'),
        end_date: values.end_date ? format(values.end_date, 'yyyy-MM-dd') : null,
      };
      
      const result = await createProject(processedData);
      
      if (!result) {
        throw new Error("Failed to create project");
      }

      toast({
        title: "Success",
        description: "Project created successfully",
      });

      onProjectAdded();
      onOpenChange(false);
      
      // Reset form and step
      form.reset();
      setCurrentStep('project-info');
      setVisitedSteps(new Set(['project-info']));
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: (error as Error)?.message || "Failed to create project. Please check all required fields.",
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
            key="project-info-step"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Basic Information</CardTitle>
                <CardDescription>Start by entering the fundamental details of your project</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={cn(
                        "flex items-center gap-1",
                        form.formState.errors.title && "text-red-500"
                      )}>
                        Project Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          value={field.value || ''}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                          placeholder="e.g., Annual Company Conference 2024" 
                          className={cn(
                            "h-11 transition-all hover:border-gray-400 focus:border-gray-600",
                            form.formState.errors.title && "border-red-500 focus:border-red-500"
                          )}
                          autoComplete="off"
                          data-lpignore="true"
                          data-form-type="other"
                        />
                      </FormControl>
                      <FormDescription>Choose a clear, descriptive name for your project</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={cn(
                        "flex items-center gap-1",
                        form.formState.errors.client_id && "text-red-500"
                      )}>
                        <Building2 className={cn(
                          "h-4 w-4",
                          form.formState.errors.client_id ? "text-red-500" : ""
                        )} />
                        Customer <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className={cn(
                            "h-11 transition-all hover:border-gray-400",
                            form.formState.errors.client_id && "border-red-500 focus:border-red-500"
                          )}>
                            <SelectValue placeholder="Select a customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              <div className="flex items-center gap-2">
                                {customer.logo_url ? (
                                  <img 
                                    src={customer.logo_url} 
                                    alt={customer.company_name || customer.full_name}
                                    className="h-5 w-5 rounded object-cover"
                                  />
                                ) : (
                                  <Building2 className="h-4 w-4 text-gray-500" />
                                )}
                                {customer.company_name || customer.full_name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Select the company or client for this project</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="manager_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={cn(
                        "flex items-center gap-1",
                        form.formState.errors.manager_id && "text-red-500"
                      )}>
                        <User className={cn(
                          "h-4 w-4",
                          form.formState.errors.manager_id ? "text-red-500" : ""
                        )} />
                        Person in Charge <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className={cn(
                            "h-11 transition-all hover:border-gray-400",
                            form.formState.errors.manager_id && "border-red-500 focus:border-red-500"
                          )}>
                            <SelectValue placeholder="Select a manager" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {managers.map((manager) => (
                            <SelectItem key={manager.id} value={manager.id}>
                              <div className="flex items-center gap-2">
                                <UserCheck className="h-3 w-3 text-gray-500" />
                                {manager.full_name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Assign the project manager responsible for this project</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Brand Fields */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <FormField
                    control={form.control}
                    name="brand_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          Brand Name
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              {...field} 
                              placeholder="e.g., Nike, Coca-Cola" 
                              className="h-11 transition-all hover:border-gray-400 focus:border-gray-600"
                              onBlur={async (e) => {
                                field.onBlur();
                                // Auto-fetch logo when brand name is entered
                                const brandName = e.target.value.trim();
                                if (brandName && !form.getValues('brand_logo')) {
                                  try {
                                    // Show loading state
                                    toast({
                                      title: "Fetching brand logo...",
                                      description: "Please wait while we find the logo for " + brandName,
                                    });
                                    
                                    // Fetch logo automatically
                                    const logoUrl = await fetchBrandLogo(brandName, true);
                                    
                                    // Set the logo URL in the form
                                    form.setValue('brand_logo', logoUrl);
                                    
                                    toast({
                                      title: "Logo found!",
                                      description: "Brand logo has been added automatically.",
                                    });
                                  } catch (error) {
                                    console.error('Error fetching logo:', error);
                                    // Silent fail - user can still enter manually
                                  }
                                }
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>Enter the brand or company name</FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="brand_logo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <Link className="h-4 w-4" />
                          Brand Logo URL
                        </FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <Input 
                                {...field} 
                                placeholder="https://example.com/logo.png" 
                                className="h-11 transition-all hover:border-gray-400 focus:border-gray-600"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-11 w-11"
                                onClick={() => {
                                  const brandName = form.getValues('brand_name');
                                  if (brandName) {
                                    // Generate Google Image search URL
                                    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(brandName + ' logo transparent png')}&tbm=isch`;
                                    window.open(searchUrl, '_blank');
                                  } else {
                                    toast({
                                      title: "Enter brand name first",
                                      description: "Please enter a brand name before searching for logos",
                                      variant: "destructive"
                                    });
                                  }
                                }}
                                title="Search for logo on Google Images"
                              >
                                <Building2 className="h-4 w-4" />
                              </Button>
                            </div>
                            {field.value && (
                              <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <img 
                                  src={field.value} 
                                  alt="Brand logo preview" 
                                  className="h-8 w-auto object-contain"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                                <a 
                                  href={field.value} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-500 hover:text-blue-700 underline"
                                >
                                  View full size
                                </a>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription>Logo URL (will auto-fetch based on brand name)</FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 'event-details':
        return (
          <motion.div
            key="event-details-step"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Event Details</CardTitle>
                <CardDescription>Describe the nature and type of your event</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="event_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={cn(
                        "flex items-center gap-1",
                        form.formState.errors.event_type && "text-red-500"
                      )}>
                        <Briefcase className={cn(
                          "h-4 w-4",
                          form.formState.errors.event_type ? "text-red-500" : ""
                        )} />
                        Event Type <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          value={field.value || ''}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                          placeholder="e.g., Conference, Wedding, Corporate Event, Exhibition" 
                          className={cn(
                            "h-11 transition-all hover:border-gray-400 focus:border-gray-600",
                            form.formState.errors.event_type && "border-red-500 focus:border-red-500"
                          )}
                          autoComplete="off"
                          data-lpignore="true"
                          data-form-type="other"
                        />
                      </FormControl>
                      <FormDescription>What kind of event is this?</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="project_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11 transition-all hover:border-gray-400">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="recruitment">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Recruitment
                            </div>
                          </SelectItem>
                          <SelectItem value="internal_event">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Internal Event
                            </div>
                          </SelectItem>
                          <SelectItem value="custom">
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-4 w-4" />
                              Custom
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>Categorize your project for better organization</FormDescription>
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
                          value={field.value || ''}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                          placeholder="Provide additional details about the project..."
                          rows={5}
                          className="resize-none transition-all hover:border-gray-400 focus:border-gray-600"
                          autoComplete="off"
                          data-lpignore="true"
                          data-form-type="other"
                        />
                      </FormControl>
                      <FormDescription>
                        Include any important information that team members should know
                      </FormDescription>
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Location Information</CardTitle>
                <CardDescription>Where will this project take place?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="venue_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={cn(
                        "flex items-center gap-1",
                        form.formState.errors.venue_address && "text-red-500"
                      )}>
                        <MapPinIcon className={cn(
                          "h-4 w-4",
                          form.formState.errors.venue_address ? "text-red-500" : ""
                        )} />
                        Venue Address <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="123 Main Street, City, State 12345" 
                          className={cn(
                            "h-11 transition-all hover:border-gray-400 focus:border-gray-600",
                            form.formState.errors.venue_address && "border-red-500 focus:border-red-500"
                          )}
                        />
                      </FormControl>
                      <FormDescription>Full address including street, city, and postal code</FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="venue_details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Venue Details</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="e.g., Conference Room A, 3rd Floor, Parking available at basement..."
                          rows={4}
                          className="resize-none transition-all hover:border-gray-400 focus:border-gray-600"
                        />
                      </FormControl>
                      <FormDescription>
                        Include specific location details, access instructions, or landmarks
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 dark:text-blue-200">
                    Make sure to include clear directions and any special access requirements for the venue.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 'schedule':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Schedule & Timing</CardTitle>
                <CardDescription>Set the dates and working hours for your project</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          Start Date <span className="text-red-500">*</span>
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full h-11 justify-start text-left font-normal transition-all hover:border-gray-400",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
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
                        <FormLabel>End Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full h-11 justify-start text-left font-normal transition-all hover:border-gray-400",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
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
                        <FormDescription>Leave empty for single-day projects</FormDescription>
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
                        <FormLabel className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Start Time <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="time" 
                            className="h-11 transition-all hover:border-gray-400 focus:border-gray-600"
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
                        <FormLabel className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          End Time <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="time" 
                            className="h-11 transition-all hover:border-gray-400 focus:border-gray-600"
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
                          <SelectTrigger className="h-11 transition-all hover:border-gray-400">
                            <SelectValue placeholder="Select schedule type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="single">Single Event</SelectItem>
                          <SelectItem value="recurring">Recurring</SelectItem>
                          <SelectItem value="multiple">Multiple Days</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>How often does this project occur?</FormDescription>
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Staffing Requirements</CardTitle>
                <CardDescription>Define the team size and supervision needs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="crew_count"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          Crew Count <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number"
                            min="1"
                            className="h-11 transition-all hover:border-gray-400 focus:border-gray-600"
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              field.onChange(isNaN(value) ? 1 : Math.max(1, value));
                            }}
                          />
                        </FormControl>
                        <FormDescription>Total number of crew members needed</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="supervisors_required"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <UserCheck className="h-4 w-4" />
                          Supervisors
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number"
                            min="0"
                            max="9"
                            className="h-11 transition-all hover:border-gray-400 focus:border-gray-600"
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              field.onChange(isNaN(value) ? 0 : Math.max(0, Math.min(9, value)));
                            }}
                          />
                        </FormControl>
                        <FormDescription>Number of supervisors (if any)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                  <Info className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800 dark:text-amber-200">
                    <strong>Tip:</strong> Consider adding 10-15% extra crew members for large events to account for last-minute changes or no-shows.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 'advanced':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Advanced Settings</CardTitle>
                <CardDescription>Configure status, priority, and budget</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 transition-all hover:border-gray-400">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="planning">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-gray-500" />
                                Planning
                              </div>
                            </SelectItem>
                            <SelectItem value="confirmed">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-purple-500" />
                                Confirmed
                              </div>
                            </SelectItem>
                            <SelectItem value="in_progress">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                                In Progress
                              </div>
                            </SelectItem>
                            <SelectItem value="completed">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500" />
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
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 transition-all hover:border-gray-400">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">
                              <Badge variant="secondary" className="text-xs">Low</Badge>
                            </SelectItem>
                            <SelectItem value="medium">
                              <Badge variant="default" className="text-xs">Medium</Badge>
                            </SelectItem>
                            <SelectItem value="high">
                              <Badge variant="destructive" className="text-xs">High</Badge>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          Budget (RM)
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="h-11 transition-all hover:border-gray-400 focus:border-gray-600"
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              field.onChange(isNaN(value) ? 0 : Math.max(0, value));
                            }}
                          />
                        </FormControl>
                        <FormDescription>Estimated budget for this project</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="invoice_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <Link className="h-4 w-4" />
                          Invoice Link/Number
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="e.g., INV-2024-001 or https://..."
                            className="h-11 transition-all hover:border-gray-400 focus:border-gray-600"
                          />
                        </FormControl>
                        <FormDescription>Invoice number or link</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 'review': {
        const values = form.getValues();
        const customer = customers.find(c => c.id === values.client_id);
        const manager = managers.find(m => m.id === values.manager_id);
        
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <Card className="shadow-sm">
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {/* Project Information */}
                  <div>
                    <h4 className="font-medium text-sm text-gray-500 mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      PROJECT INFORMATION
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Project Name</p>
                        <p className="font-medium">{values.title || '-'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Customer</p>
                        <div className="flex items-center gap-2 mt-1">
                          {customer && customer.logo_url && (
                            <img 
                              src={customer.logo_url} 
                              alt={customer.company_name || customer.full_name}
                              className="h-5 w-5 rounded object-cover"
                            />
                          )}
                          <p className="font-medium">{customer?.company_name || customer?.full_name || '-'}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Manager</p>
                        <p className="font-medium">{manager?.full_name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Event Type</p>
                        <p className="font-medium">{values.event_type || '-'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Project Category</p>
                        <p className="font-medium capitalize">{values.project_type || '-'}</p>
                      </div>
                      {values.brand_name && (
                        <div>
                          <p className="text-muted-foreground">Brand</p>
                          <div className="flex items-center gap-2 mt-1">
                            {values.brand_logo && (
                              <img 
                                src={values.brand_logo} 
                                alt={values.brand_name}
                                className="h-5 w-5 object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                            <p className="font-medium">{values.brand_name}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Schedule & Location */}
                  <div>
                    <h4 className="font-medium text-sm text-gray-500 mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      SCHEDULE & LOCATION
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Start Date</p>
                        <p className="font-medium">{values.start_date ? format(values.start_date, 'PPP') : '-'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">End Date</p>
                        <p className="font-medium">{values.end_date ? format(values.end_date, 'PPP') : 'Single Day'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Working Hours</p>
                        <p className="font-medium">{values.working_hours_start} - {values.working_hours_end}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Venue</p>
                        <p className="font-medium">{values.venue_address || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Staffing & Budget */}
                  <div>
                    <h4 className="font-medium text-sm text-gray-500 mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      STAFFING & SETTINGS
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Crew Count</p>
                        <p className="font-medium">{values.crew_count} members</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Supervisors</p>
                        <p className="font-medium">{values.supervisors_required || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <Badge variant={values.status === 'planning' ? 'secondary' : 'default'} className="mt-1">
                          {values.status}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Budget</p>
                        <p className="font-medium">RM {values.budget?.toFixed(2) || '0.00'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Invoice Number</p>
                        <p className="font-medium">{values.invoice_number || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 h-[90vh] max-h-[800px] flex flex-col overflow-hidden">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full" autoComplete="off" noValidate>
            <div className="flex flex-1 overflow-hidden">
              {/* Left Sidebar */}
              <div className="w-72 bg-gray-50 dark:bg-gray-900 p-4 flex flex-col border-r">
                <div className="flex-1 overflow-y-auto">
                  <div className="mb-8 relative">
                    {/* Animated gradient background for main title */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-500/10 to-purple-600/10 rounded-lg"
                      animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                      style={{ backgroundSize: "200% 100%" }}
                    />
                    <div className="relative z-10 p-4">
                      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Create Project</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Complete all steps to set up your new project.
                      </p>
                    </div>
                  </div>

                  <nav className="space-y-1">
                    {steps.map((step, index) => {
                      const isActive = currentStep === step.id;
                      const isVisited = visitedSteps.has(step.id);

                      return (
                        <motion.button
                          key={step.id}
                          type="button"
                          onClick={() => {
                            // Allow free navigation to any step
                            setCurrentStep(step.id);
                            setVisitedSteps(prev => new Set([...prev, step.id]));
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                            isActive
                              ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-md"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                          )}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className={cn(
                            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                            isActive
                              ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                              : isVisited
                              ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400"
                              : "bg-gray-200 dark:bg-gray-700"
                          )}>
                            {isVisited && !isActive ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <span className="text-xs font-semibold">{index + 1}</span>
                            )}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-medium">{step.label}</p>
                            {isActive && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {step.description}
                              </p>
                            )}
                          </div>
                          {isActive && (
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          )}
                        </motion.button>
                      );
                    })}
                  </nav>
                </div>

                {/* Step Progress at bottom of sidebar */}
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Progress</span>
                    <span className="text-sm text-gray-500">
                      {currentStepIndex + 1} / {steps.length}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <motion.div 
                      className="h-full rounded-full bg-gradient-to-r from-gray-600 to-gray-800"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                    />
                  </div>
                </div>
              </div>

              {/* Right Content */}
              <div className="flex-1 flex flex-col bg-gray-50/50 dark:bg-gray-900/50">
                {/* Header */}
                <div className="p-6 pb-4 border-b">
                  <div className="flex justify-between items-start relative">
                    {/* Animated gradient background */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-purple-600/5 via-pink-500/5 to-purple-600/5 rounded-lg"
                      animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      style={{ backgroundSize: "200% 100%" }}
                    />
                    <div className="relative z-10 flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        {React.createElement(steps[currentStepIndex].icon, { className: "h-5 w-5" })}
                        {steps[currentStepIndex].label}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {steps[currentStepIndex].description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenChange(false)}
                      className="relative z-10 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto p-6">
                  <AnimatePresence mode="wait">
                    <div key={currentStep}>
                      {renderStepContent()}
                    </div>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Fixed Footer */}
            <div className="border-t bg-white dark:bg-gray-900 p-6 flex-shrink-0">
              <div className="flex justify-between gap-4">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
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
                <div className="flex gap-2">
                  {currentStepIndex > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="lg"
                      onClick={() => onOpenChange(false)}
                      className="min-w-[100px]"
                    >
                      Cancel
                    </Button>
                  )}
                  {currentStep === 'review' ? (
                    <Button 
                      type="submit" 
                      size="lg"
                      disabled={isLoading}
                      className="min-w-[160px] bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black text-white"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Project...
                        </>
                      ) : (
                        'Create Project'
                      )}
                    </Button>
                  ) : (
                    <Button 
                      type="button" 
                      size="lg"
                      onClick={(e) => {
                        e.preventDefault();
                        handleNext();
                      }}
                      className="min-w-[100px] gap-2"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
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