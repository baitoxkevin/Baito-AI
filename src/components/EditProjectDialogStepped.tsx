import React, { useState, useEffect, useCallback } from 'react';
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
import { AmountInput } from '@/components/ui/amount-input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { logger } from '../lib/logger';
// import { checkProjectLocationsTable } from '@/lib/create-project-locations-table'; // Removed - Multiple Locations feature removed
// Removed Calendar and Popover imports - using native date inputs instead
import { cn } from '@/lib/utils';
import { FileText, MapPin, Clock, Users, Cog, Palette, Share2, Check, ChevronRight, Building2, Loader2, Search, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// Removed useCompanies import - will fetch companies directly
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { BrandLogoSelector } from '@/components/BrandLogoSelector';
// import { ProjectLocationManager } from '@/components/ProjectLocationManager'; // Removed - Multiple Locations feature removed

type Step = 'project-info' | 'event-details' | 'location' | 'schedule' | 'staffing' | 'advanced' | 'review';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  client_id: z.string().min(1, 'Company is required'),
  manager_id: z.string().min(1, 'Manager is required'),
  start_date: z.date(),
  end_date: z.date().optional(),
  // venue_name: z.string().optional(), // Not in DB - only venue_address exists
  venue_address: z.string().optional(),
  venue_details: z.string().optional(), // This field exists in DB
  // locations removed - Multiple Locations feature removed
  // contact_name: z.string().optional(), // Not in DB
  // contact_phone: z.string().optional(), // Not in DB
  // contact_email: z.string().email().optional().or(z.literal('')), // Not in DB
  crew_count: z.number().min(0).default(0),
  supervisors_required: z.number().min(0).max(9).optional(),
  special_skills_required: z.string().optional(),
  working_hours_start: z.string().optional(),
  working_hours_end: z.string().optional(),
  // break_duration: z.string().optional(), // Not in DB
  // meal_provided: z.boolean().default(false), // Not in DB
  // parking_provided: z.boolean().default(false), // Not in DB
  color: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  status: z.enum(['planning', 'confirmed', 'in_progress', 'completed', 'cancelled']).default('planning'),
  // type: z.enum(['event', 'roadshow', 'construction', 'other']).optional(), // Field is project_type, not type
  project_type: z.enum(['recruitment', 'internal_event', 'custom']).optional(),
  schedule_type: z.enum(['single', 'recurring', 'multiple']).optional(), // Updated to match DB constraint
  // recurrence_pattern: z.string().optional(), // Stored in separate project_recurrence table
  // recurrence_days: z.array(z.number()).optional(), // Stored in separate project_recurrence table
  // recurrence_end_date: z.date().optional(), // Not in DB
  // notes: z.string().optional(), // Not in DB
  budget: z.number().optional(),
  invoice_number: z.string().optional(),
  // payment_terms: z.string().optional(), // Not in DB
  // Fields that exist in the Project interface - removed duplicates
  brand_name: z.string().optional(),
  brand_logo: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditProjectDialogSteppedProps {
  project: unknown;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectUpdated?: (updatedProject?: unknown) => void;
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
  const [showSuccess, setShowSuccess] = useState(false);
  const [companies, setCompanies] = useState<Array<{id: string; name?: string; company_name?: string; logo_url?: string}>>([]);
  const [managers, setManagers] = useState<Array<{id: string; full_name: string}>>([]);
  const [showLogoSelector, setShowLogoSelector] = useState(false);
  const [currentBrandName, setCurrentBrandName] = useState('');
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: project?.title || '',
      description: project?.description || '',
      client_id: project?.client_id || '',
      manager_id: project?.manager_id || '',
      start_date: project?.start_date ? new Date(project.start_date) : new Date(),
      end_date: project?.end_date ? new Date(project.end_date) : undefined,
      // venue_name: project?.venue_name || '', // Not in DB
      venue_address: project?.venue_address || '',
      venue_details: project?.venue_details || '',
      // contact_name: project?.contact_name || '', // Not in DB
      // contact_phone: project?.contact_phone || '', // Not in DB
      // contact_email: project?.contact_email || '', // Not in DB
      crew_count: project?.crew_count || 0,
      supervisors_required: project?.supervisors_required || 0,
      special_skills_required: project?.special_skills_required || '',
      working_hours_start: project?.working_hours_start || '09:00',
      working_hours_end: project?.working_hours_end || '18:00',
      // break_duration: project?.break_duration || '60', // This field doesn't exist in DB
      // meal_provided: project?.meal_provided || false, // This field doesn't exist in DB
      // parking_provided: project?.parking_provided || false, // This field doesn't exist in DB
      color: project?.color || '#3B82F6',
      priority: project?.priority || 'medium',
      status: project?.status || 'planning',
      // type: project?.type || 'event', // Field is project_type
      project_type: project?.project_type || undefined,
      schedule_type: project?.schedule_type || 'single',
      // recurrence_pattern: project?.recurrence_pattern || '', // Stored in separate table
      // recurrence_days: project?.recurrence_days || [], // Stored in separate table
      // recurrence_end_date: project?.recurrence_end_date ? new Date(project.recurrence_end_date) : undefined, // Not in DB
      // notes: project?.notes || '', // Not in DB
      budget: project?.budget || undefined,
      invoice_number: project?.invoice_number || '',
      // payment_terms: project?.payment_terms || '', // Not in DB
      brand_name: project?.brand_name || '',
      brand_logo: project?.brand_logo || '',
    },
  });

  // loadProjectLocations removed - Multiple Locations feature removed

  const fetchCompaniesAndManagers = useCallback(async () => {
    try {
      const [companiesResult, managersResult] = await Promise.all([
        supabase.from('companies').select('*').order('name'),
        supabase.from('users').select('id, full_name, role').in('role', ['admin', 'super_admin', 'manager']).order('full_name')
      ]);

      if (companiesResult.error) throw companiesResult.error;
      if (managersResult.error) throw managersResult.error;
      
      setCompanies(companiesResult.data || []);
      setManagers(managersResult.data || []);
    } catch (error) {
      logger.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load companies and managers',
        variant: 'destructive',
      });
    }
  }, [toast]);

  useEffect(() => {
    if (open) {
      fetchCompaniesAndManagers();
      // Locations table check removed - Multiple Locations feature removed
    }
  }, [open, fetchCompaniesAndManagers]);

  useEffect(() => {
    if (project && open) {
      console.log('Dialog opened for project:', project.id);
      form.reset({
        title: project.title || '',
        description: project.description || '',
        client_id: project.client_id || '',
        manager_id: project.manager_id || '',
        start_date: project.start_date ? new Date(project.start_date) : new Date(),
        end_date: project.end_date ? new Date(project.end_date) : undefined,
        // venue_name: project.venue_name || '', // Not in DB
        venue_address: project.venue_address || '',
        venue_details: project.venue_details || '',
        // contact_name: project.contact_name || '', // Not in DB
        // contact_phone: project.contact_phone || '', // Not in DB
        // contact_email: project.contact_email || '', // Not in DB
        crew_count: project.crew_count || 0,
        supervisors_required: project.supervisors_required || 0,
        special_skills_required: project.special_skills_required || '',
        working_hours_start: project.working_hours_start || '09:00',
        working_hours_end: project.working_hours_end || '18:00',
        // break_duration: project.break_duration || '60', // Not in DB
        // meal_provided: project.meal_provided || false, // Not in DB
        // parking_provided: project.parking_provided || false, // Not in DB
        color: project.color || '#3B82F6',
        priority: project.priority || 'medium',
        status: project.status || 'planning',
        // type: project.type || 'event', // Field is project_type
        project_type: project.project_type || undefined,
        schedule_type: project.schedule_type || 'single',
        // recurrence_pattern: project.recurrence_pattern || '', // Stored in separate table
        // recurrence_days: project.recurrence_days || [], // Stored in separate table
        // recurrence_end_date: project.recurrence_end_date ? new Date(project.recurrence_end_date) : undefined, // Not in DB
        // notes: project.notes || '', // Not in DB
        budget: project.budget || undefined,
        invoice_number: project.invoice_number || '',
        // payment_terms: project.payment_terms || '', // Not in DB
        brand_name: project.brand_name || '',
        brand_logo: project.brand_logo || '',
        // locations removed - Multiple Locations feature removed
      });
      
      // Locations loading removed - Multiple Locations feature removed
    }
  }, [project, open, form]);

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;

  const validateCurrentStep = async () => {
    let fieldsToValidate: (keyof FormData)[] = [];
    
    switch (currentStep) {
      case 'project-info':
        fieldsToValidate = ['title', 'description', 'client_id', 'manager_id', 'brand_name', 'brand_logo'];
        break;
      case 'event-details':
        fieldsToValidate = ['event_type', 'project_type', 'priority', 'status', 'color'];
        break;
      case 'location':
        fieldsToValidate = ['venue_address', 'venue_details'];
        break;
      case 'schedule':
        fieldsToValidate = ['start_date', 'end_date', 'schedule_type', 'working_hours_start', 'working_hours_end'];
        break;
      case 'staffing':
        fieldsToValidate = ['crew_count', 'supervisors_required'];
        break;
      case 'advanced':
        fieldsToValidate = ['budget', 'invoice_number'];
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

      // Locations removed - Multiple Locations feature removed
      const projectData = data;
      
      const updateData: Record<string, unknown> = {
        ...projectData,
        start_date: format(projectData.start_date, 'yyyy-MM-dd'),
        end_date: projectData.end_date ? format(projectData.end_date, 'yyyy-MM-dd') : null,
        // recurrence_end_date: data.recurrence_end_date ? format(data.recurrence_end_date, 'yyyy-MM-dd') : null, // Not in DB
        updated_at: new Date().toISOString(),
      };

      // Remove any fields that don't exist in DB
      delete updateData.venue_name;
      delete updateData.contact_name;
      delete updateData.contact_phone;
      delete updateData.contact_email;
      delete updateData.recurrence_pattern;
      delete updateData.recurrence_days;
      delete updateData.recurrence_end_date;
      delete updateData.notes;
      delete updateData.payment_terms;
      delete updateData.type; // The field is project_type
      delete updateData.break_duration;
      delete updateData.meal_provided;
      delete updateData.parking_provided;

      const { data: updatedProject, error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', project.id)
        .select()
        .single();

      if (error) throw error;

      // Locations saving removed - Multiple Locations feature removed

      // Fetch manager information if manager_id exists
      const projectWithDetails = { ...updatedProject };
      if (updatedProject.manager_id) {
        const { data: managerData } = await supabase
          .from('users')
          .select('*')
          .eq('id', updatedProject.manager_id)
          .single();
        
        if (managerData) {
          projectWithDetails.manager = managerData;
        }
      }

      // Fetch client information if client_id exists
      if (updatedProject.client_id) {
        // First try to fetch from companies table
        const { data: companyData } = await supabase
          .from('companies')
          .select('*')
          .eq('id', updatedProject.client_id)
          .single();
        
        if (companyData) {
          projectWithDetails.client = {
            ...companyData,
            name: companyData.name || companyData.company_name,
            logo_url: companyData.logo_url
          };
        } else {
          // If not found in companies, try users table
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', updatedProject.client_id)
            .single();
          
          if (userData) {
            projectWithDetails.client = {
              ...userData,
              name: userData.full_name || userData.company_name
            };
          }
        }
      }

      // Show success toast with more details
      toast({
        title: '✅ Project Updated Successfully',
        description: `"${updatedProject.title}" has been updated with your changes.`,
        duration: 4000,
      });

      // Add a small delay before closing to show the success state
      setIsSubmitting(false);
      setShowSuccess(true);
      
      // Show a success animation or state
      setTimeout(() => {
        // Pass the updated project data with manager and client info to the callback
        onProjectUpdated?.(projectWithDetails);
        onOpenChange(false);
        setCurrentStep('project-info');
        setCompletedSteps(new Set());
        setShowSuccess(false);
      }, 1500); // Show success state for 1.5 seconds
    } catch (error) {
      logger.error('Error updating project:', error);
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
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="client_id"
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
              
              <FormField
                control={form.control}
                name="manager_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Person in Charge</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a manager" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {managers?.map((manager) => (
                          <SelectItem key={manager.id} value={manager.id}>
                            {manager.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Display Client PIC Information in a compact format */}
            {form.watch('client_id') && (() => {
              const selectedCompany = companies?.find(c => c.id === form.watch('client_id'));
              return selectedCompany && 'pic_name' in selectedCompany && selectedCompany.pic_name ? (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <User className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-blue-700 dark:text-blue-300 font-medium">Client PIC:</span>
                    <span className="text-blue-900 dark:text-blue-100 font-semibold">{(selectedCompany as { pic_name?: string }).pic_name}</span>
                    {'pic_designation' in selectedCompany && selectedCompany.pic_designation && (
                      <span className="text-blue-600 dark:text-blue-400">({(selectedCompany as { pic_designation?: string }).pic_designation})</span>
                    )}
                    {'pic_phone' in selectedCompany && selectedCompany.pic_phone && (
                      <>
                        <span className="text-blue-500 dark:text-blue-500">•</span>
                        <span className="text-blue-600 dark:text-blue-400">{(selectedCompany as { pic_phone?: string }).pic_phone}</span>
                      </>
                    )}
                  </div>
                </div>
              ) : null;
            })()}
            
            {/* Brand Fields */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="brand_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand Name</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input 
                          {...field} 
                          placeholder="e.g., Nike, Coca-Cola" 
                          onBlur={(e) => {
                            field.onBlur();
                            const brandName = e.target.value.trim();
                            if (brandName) {
                              setCurrentBrandName(brandName);
                            }
                          }}
                          onChange={(e) => {
                            field.onChange(e);
                            setCurrentBrandName(e.target.value.trim());
                          }}
                        />
                        {currentBrandName && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowLogoSelector(true)}
                          >
                            <Search className="h-4 w-4 mr-2" />
                            Find Logo
                          </Button>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="brand_logo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand Logo URL</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Input 
                          {...field} 
                          placeholder="https://example.com/logo.png" 
                        />
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
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 'event-details':
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="event_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="roving">Roving</SelectItem>
                      <SelectItem value="roadshow">Roadshow</SelectItem>
                      <SelectItem value="in-store">In-Store</SelectItem>
                      <SelectItem value="ad-hoc">Ad-Hoc</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                      <SelectItem value="wedding">Wedding</SelectItem>
                      <SelectItem value="concert">Concert</SelectItem>
                      <SelectItem value="conference">Conference</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
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
                      <SelectTrigger>
                        <SelectValue placeholder="Select project type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="recruitment">Recruitment</SelectItem>
                      <SelectItem value="internal_event">Internal Event</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
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
            <FormField
              control={form.control}
              name="venue_details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Venue Details</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter additional venue details" 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Contact fields don't exist in the database
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
            */}
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
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="multiple">Multiple Locations</SelectItem>
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
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : undefined;
                          field.onChange(date);
                        }}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : undefined;
                          field.onChange(date);
                        }}
                        min={form.watch('start_date') ? format(form.watch('start_date'), 'yyyy-MM-dd') : ''}
                        className="w-full"
                      />
                    </FormControl>
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
              name="supervisors_required"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supervisors Required</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0"
                      max="9"
                      placeholder="0" 
                      {...field} 
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        field.onChange(isNaN(value) ? 0 : Math.max(0, Math.min(9, value)));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="special_skills_required"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Skills / Requirements</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Bilingual (English + Mandarin), Forklift certified, First Aid trained, Event experience, etc."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-sm text-muted-foreground">
                    Specify any special skills, certifications, or requirements needed for this project
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Commented out - these fields don't exist in the database
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
            */}
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
                    <AmountInput 
                      placeholder="0.00" 
                      value={field.value || ''}
                      onChange={(value) => field.onChange(parseFloat(value) || undefined)}
                      currency="RM"
                      preventSelectAll={true}
                      formatOnBlur={true}
                      minValue={0}
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
            {/* Payment terms field doesn't exist in the database
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
            */}
            {/* Notes field doesn't exist in the database
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
            */}
          </div>
        );

      case 'review': {
        const formValues = form.getValues();
        const selectedCompany = companies?.find(c => c.id === formValues.client_id);
        
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
                  <span className="text-muted-foreground">Event Type:</span>
                  <span className="font-medium capitalize">{formValues.event_type}</span>
                </div>
                {formValues.project_type && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Project Type:</span>
                    <span className="font-medium capitalize">{formValues.project_type.replace('_', ' ')}</span>
                  </div>
                )}
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
                  <span className="font-medium">{formValues.venue_address || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Crew Required:</span>
                  <span className="font-medium">{formValues.crew_count}</span>
                </div>
                {formValues.special_skills_required && (
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground">Special Skills:</span>
                    <span className="text-sm bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded p-2">
                      {formValues.special_skills_required}
                    </span>
                  </div>
                )}
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
      }

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] max-w-4xl w-[90vw] max-h-[85vh] p-0 overflow-hidden bg-white dark:bg-gray-900 rounded-lg shadow-2xl">
        <div className="flex h-[85vh] relative">
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
              {steps.map((step) => {
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
                  disabled={isSubmitting || showSuccess}
                  className={cn(
                    "min-w-[120px] transition-all",
                    showSuccess && "bg-green-600 hover:bg-green-600"
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : showSuccess ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Saved!
                    </>
                  ) : (
                    'Save Changes'
                  )}
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
          
          {/* Success Overlay */}
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/95 dark:bg-gray-900/95 z-50 flex items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
                  </motion.div>
                  <motion.h3
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2"
                  >
                    Project Updated!
                  </motion.h3>
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-gray-600 dark:text-gray-400"
                  >
                    Your changes have been saved successfully.
                  </motion.p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
      
      <BrandLogoSelector
        open={showLogoSelector}
        onOpenChange={setShowLogoSelector}
        brandName={currentBrandName}
        onSelectLogo={(logoUrl) => {
          form.setValue('brand_logo', logoUrl);
          toast({
            title: "Logo selected",
            description: "Brand logo has been added to your project.",
          });
        }}
      />
    </Dialog>
  );
}