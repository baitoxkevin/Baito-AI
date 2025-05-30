import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { CalendarIcon, FileText, MapPin, Clock, Users, Cog, Palette, Share2, Check, ChevronRight, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// Removed useCompanies import - will fetch companies directly
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

type Step = 'project-info' | 'event-details' | 'location' | 'schedule' | 'staffing' | 'advanced' | 'review';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  company_id: z.string().min(1, 'Company is required'),
  start_date: z.date(),
  end_date: z.date().optional(),
  venue_name: z.string().optional(),
  venue_address: z.string().optional(),
  contact_name: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email().optional().or(z.literal('')),
  crew_count: z.number().min(0).default(0),
  working_hours_start: z.string().optional(),
  working_hours_end: z.string().optional(),
  break_duration: z.string().optional(),
  meal_provided: z.boolean().default(false),
  parking_provided: z.boolean().default(false),
  color: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  status: z.enum(['planning', 'confirmed', 'in_progress', 'completed', 'cancelled']).default('planning'),
  type: z.enum(['event', 'roadshow', 'construction', 'other']).optional(),
  schedule_type: z.enum(['single', 'multi_day', 'recurring']).optional(),
  recurrence_pattern: z.string().optional(),
  recurrence_end_date: z.date().optional(),
  notes: z.string().optional(),
  budget: z.number().optional(),
  invoice_number: z.string().optional(),
  payment_terms: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditProjectDialogSteppedProps {
  project: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectUpdated?: () => void;
}

const steps: { id: Step; label: string; icon: React.ElementType }[] = [
  { id: 'project-info', label: 'Project Information', icon: FileText },
  { id: 'event-details', label: 'Event Details', icon: Palette },
  { id: 'location', label: 'Location', icon: MapPin },
  { id: 'schedule', label: 'Schedule', icon: Clock },
  { id: 'staffing', label: 'Staffing', icon: Users },
  { id: 'advanced', label: 'Advanced Settings', icon: Cog },
  { id: 'review', label: 'Review & Save', icon: Share2 },
];

export function EditProjectDialogStepped({ project, open, onOpenChange, onProjectUpdated }: EditProjectDialogSteppedProps) {
  const [currentStep, setCurrentStep] = useState<Step>('project-info');
  const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: project?.title || '',
      description: project?.description || '',
      company_id: project?.company_id || '',
      start_date: project?.start_date ? new Date(project.start_date) : new Date(),
      end_date: project?.end_date ? new Date(project.end_date) : undefined,
      venue_name: project?.venue_name || '',
      venue_address: project?.venue_address || '',
      contact_name: project?.contact_name || '',
      contact_phone: project?.contact_phone || '',
      contact_email: project?.contact_email || '',
      crew_count: project?.crew_count || 0,
      working_hours_start: project?.working_hours_start || '09:00',
      working_hours_end: project?.working_hours_end || '18:00',
      break_duration: project?.break_duration || '60',
      meal_provided: project?.meal_provided || false,
      parking_provided: project?.parking_provided || false,
      color: project?.color || '#3B82F6',
      priority: project?.priority || 'medium',
      status: project?.status || 'planning',
      type: project?.type || 'event',
      schedule_type: project?.schedule_type || 'single',
      recurrence_pattern: project?.recurrence_pattern || '',
      recurrence_end_date: project?.recurrence_end_date ? new Date(project.recurrence_end_date) : undefined,
      notes: project?.notes || '',
      budget: project?.budget || undefined,
      invoice_number: project?.invoice_number || '',
      payment_terms: project?.payment_terms || '',
    },
  });

  useEffect(() => {
    if (open) {
      fetchCompanies();
    }
  }, [open]);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, company_name, logo_url')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast({
        title: 'Error',
        description: 'Failed to load companies',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (project) {
      form.reset({
        title: project.title || '',
        description: project.description || '',
        company_id: project.company_id || '',
        start_date: project.start_date ? new Date(project.start_date) : new Date(),
        end_date: project.end_date ? new Date(project.end_date) : undefined,
        venue_name: project.venue_name || '',
        venue_address: project.venue_address || '',
        contact_name: project.contact_name || '',
        contact_phone: project.contact_phone || '',
        contact_email: project.contact_email || '',
        crew_count: project.crew_count || 0,
        working_hours_start: project.working_hours_start || '09:00',
        working_hours_end: project.working_hours_end || '18:00',
        break_duration: project.break_duration || '60',
        meal_provided: project.meal_provided || false,
        parking_provided: project.parking_provided || false,
        color: project.color || '#3B82F6',
        priority: project.priority || 'medium',
        status: project.status || 'planning',
        type: project.type || 'event',
        schedule_type: project.schedule_type || 'single',
        recurrence_pattern: project.recurrence_pattern || '',
        recurrence_end_date: project.recurrence_end_date ? new Date(project.recurrence_end_date) : undefined,
        notes: project.notes || '',
        budget: project.budget || undefined,
        invoice_number: project.invoice_number || '',
        payment_terms: project.payment_terms || '',
      });
    }
  }, [project, form]);

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;

  const validateCurrentStep = async () => {
    let fieldsToValidate: (keyof FormData)[] = [];
    
    switch (currentStep) {
      case 'project-info':
        fieldsToValidate = ['title', 'description', 'company_id'];
        break;
      case 'event-details':
        fieldsToValidate = ['type', 'priority', 'status', 'color'];
        break;
      case 'location':
        fieldsToValidate = ['venue_name', 'venue_address', 'contact_name', 'contact_phone', 'contact_email'];
        break;
      case 'schedule':
        fieldsToValidate = ['start_date', 'end_date', 'schedule_type', 'working_hours_start', 'working_hours_end'];
        break;
      case 'staffing':
        fieldsToValidate = ['crew_count', 'meal_provided', 'parking_provided', 'break_duration'];
        break;
      case 'advanced':
        fieldsToValidate = ['budget', 'invoice_number', 'payment_terms', 'notes'];
        break;
    }

    const result = await form.trigger(fieldsToValidate);
    if (result) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
    }
    return result;
  };

  const goToStep = async (step: Step) => {
    // Allow free navigation between all steps
    setCurrentStep(step);
  };

  const goToNextStep = async () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex < steps.length - 1) {
      // Validate current step but don't block navigation
      await validateCurrentStep();
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };

  const goToPreviousStep = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);

      const updateData: any = {
        ...data,
        start_date: format(data.start_date, 'yyyy-MM-dd'),
        end_date: data.end_date ? format(data.end_date, 'yyyy-MM-dd') : null,
        recurrence_end_date: data.recurrence_end_date ? format(data.recurrence_end_date, 'yyyy-MM-dd') : null,
        updated_at: new Date().toISOString(),
      };

      if (!data.contact_email) {
        delete updateData.contact_email;
      }

      const { error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', project.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Project updated successfully',
      });

      onProjectUpdated?.();
      onOpenChange(false);
      setCurrentStep('project-info');
      setCompletedSteps(new Set());
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: 'Error',
        description: 'Failed to update project. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'project-info':
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter project title" {...field} />
                  </FormControl>
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
                      placeholder="Enter project description" 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="company_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a company" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {companies?.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          <div className="flex items-center gap-2">
                            {company.logo_url ? (
                              <img 
                                src={company.logo_url} 
                                alt={company.company_name || company.name}
                                className="h-5 w-5 rounded object-cover"
                              />
                            ) : (
                              <Building2 className="h-4 w-4 text-gray-500" />
                            )}
                            {company.company_name || company.name || 'Unknown Company'}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 'event-details':
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="roadshow">Roadshow</SelectItem>
                      <SelectItem value="construction">Construction</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
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
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Color</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input 
                        type="color" 
                        {...field} 
                        className="w-20 h-10 p-1 cursor-pointer"
                      />
                      <Input 
                        type="text" 
                        value={field.value} 
                        onChange={field.onChange}
                        placeholder="#3B82F6" 
                        className="flex-1"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 'location':
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="venue_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Venue Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter venue name" {...field} />
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
                  <FormLabel>Venue Address</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter venue address" 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Separator className="my-4" />
            <h4 className="text-sm font-medium">Contact Information</h4>
            <FormField
              control={form.control}
              name="contact_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter contact name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contact_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter contact phone" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contact_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter contact email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 'schedule':
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="schedule_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Schedule Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select schedule type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="single">Single Day</SelectItem>
                      <SelectItem value="multi_day">Multi Day</SelectItem>
                      <SelectItem value="recurring">Recurring</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
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
                            date < new Date(new Date().setHours(0, 0, 0, 0))
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
                  <FormItem>
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
                          disabled={(date) => {
                            const startDate = form.getValues('start_date');
                            return date < startDate;
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Separator className="my-4" />
            <h4 className="text-sm font-medium">Working Hours</h4>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="working_hours_start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
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
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 'staffing':
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="crew_count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Required Crew Count</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      {...field} 
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="break_duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Break Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input placeholder="60" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Separator className="my-4" />
            <h4 className="text-sm font-medium">Staff Amenities</h4>
            <FormField
              control={form.control}
              name="meal_provided"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Meal Provided</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Will meals be provided for staff?
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="parking_provided"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Parking Provided</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Will parking be provided for staff?
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        );

      case 'advanced':
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Enter budget amount" 
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="invoice_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter invoice number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="payment_terms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Terms</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Net 30" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter any additional notes" 
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 'review':
        const formValues = form.getValues();
        const selectedCompany = companies?.find(c => c.id === formValues.company_id);
        
        return (
          <div className="space-y-4">
            <div className="rounded-lg border p-4 bg-muted/50">
              <h3 className="font-semibold mb-3">Review Project Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Title:</span>
                  <span className="font-medium">{formValues.title}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Company:</span>
                  <div className="flex items-center gap-2">
                    {selectedCompany?.logo_url && (
                      <img 
                        src={selectedCompany.logo_url} 
                        alt={selectedCompany?.company_name || selectedCompany?.name}
                        className="h-5 w-5 rounded object-cover"
                      />
                    )}
                    <span className="font-medium">{selectedCompany?.company_name || selectedCompany?.name || 'Unknown Company'}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium capitalize">{formValues.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium capitalize">{formValues.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Priority:</span>
                  <span className="font-medium capitalize">{formValues.priority}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start Date:</span>
                  <span className="font-medium">{format(formValues.start_date, 'PPP')}</span>
                </div>
                {formValues.end_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">End Date:</span>
                    <span className="font-medium">{format(formValues.end_date, 'PPP')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Working Hours:</span>
                  <span className="font-medium">{formValues.working_hours_start} - {formValues.working_hours_end}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Venue:</span>
                  <span className="font-medium">{formValues.venue_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Crew Required:</span>
                  <span className="font-medium">{formValues.crew_count}</span>
                </div>
                {formValues.budget && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Budget:</span>
                    <span className="font-medium">${formValues.budget}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-blue-800">
                Please review all the information above. Click "Save Changes" to update the project.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] p-0">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 dark:bg-gray-900 p-6 border-r">
            <DialogHeader className="mb-6 relative">
              {/* Animated gradient background for title */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-500/10 to-purple-600/10 rounded-lg"
                animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                style={{ backgroundSize: "200% 100%" }}
              />
              <DialogTitle className="relative z-10 p-4">Edit Project</DialogTitle>
            </DialogHeader>
            
            <nav className="space-y-2">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = completedSteps.has(step.id);
                
                return (
                  <button
                    key={step.id}
                    onClick={() => goToStep(step.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                      isActive && "bg-primary text-primary-foreground",
                      !isActive && isCompleted && "text-primary hover:bg-gray-100 dark:hover:bg-gray-800",
                      !isActive && !isCompleted && "text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors",
                      isActive && "border-primary-foreground bg-primary-foreground/20",
                      !isActive && isCompleted && "border-primary bg-primary text-primary-foreground",
                      !isActive && !isCompleted && "border-gray-300 dark:border-gray-600"
                    )}>
                      {isCompleted && !isActive ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                    <span className="text-left">{step.label}</span>
                  </button>
                );
              })}
            </nav>
            
            <div className="mt-6 pt-6 border-t">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Progress</div>
                <Progress value={progressPercentage} className="h-2" />
                <div className="text-xs text-muted-foreground text-right">
                  {currentStepIndex + 1} of {steps.length}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Step header with animated gradient */}
            <div className="p-6 pb-0">
              <div className="relative mb-6">
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-purple-600/5 via-pink-500/5 to-purple-600/5 rounded-lg"
                  animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  style={{ backgroundSize: "200% 100%" }}
                />
                <div className="relative z-10 p-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    {React.createElement(steps[currentStepIndex].icon, { className: "h-5 w-5" })}
                    {steps[currentStepIndex].label}
                  </h3>
                </div>
              </div>
            </div>
            
            <ScrollArea className="flex-1 px-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStep}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      {renderStepContent()}
                    </motion.div>
                  </AnimatePresence>
                </form>
              </Form>
            </ScrollArea>

            {/* Footer Actions */}
            <div className="border-t p-6 flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={goToPreviousStep}
                disabled={currentStepIndex === 0}
              >
                Previous
              </Button>
              
              {currentStep === 'review' ? (
                <Button
                  type="submit"
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={goToNextStep}
                  className="gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}