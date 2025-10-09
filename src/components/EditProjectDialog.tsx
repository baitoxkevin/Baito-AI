import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { CalendarIcon, Loader2, MapPin, Users, Clock, DollarSign, Building, Check, ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { logger } from '../lib/logger';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from "@/components/ui/textarea";
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { notificationService } from '@/lib/notification-service';
import { getUser } from '@/lib/auth';
import { X } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { ShineBorder } from "@/components/ui/shine-border";
import { MagicCard } from "@/components/ui/magic-card";
import { TextAnimate } from "@/components/ui/text-animate";
import type { Project } from '@/lib/types';

const editProjectSchema = z.object({
  title: z.string().min(1, 'Project name is required'),
  client_id: z.string().min(1, 'Customer is required'),
  manager_id: z.string().min(1, 'Person in charge is required'),
  status: z.enum(['planning', 'active', 'completed', 'cancelled', 'new', 'in-progress', 'pending']),
  priority: z.enum(['low', 'medium', 'high']),
  event_type: z.string().min(1, 'Event type is required'),
  description: z.string().optional(),
  venue_address: z.string().min(1, 'Venue address is required'),
  venue_details: z.string().optional(),
  start_date: z.date(),
  end_date: z.date().optional(),
  working_hours_start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  working_hours_end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  crew_count: z.number().min(1, 'Must have at least one crew member'),
  supervisors_required: z.number().min(0).max(9).optional(),
  budget: z.number().min(0).optional(),
  project_type: z.string().optional(),
  schedule_type: z.string().optional(),
  cc_client_ids: z.array(z.string()).optional(), // CC contact IDs from company_contacts table
  cc_user_ids: z.array(z.string()).optional(),
});

type EditProjectFormValues = z.infer<typeof editProjectSchema>;

interface EditProjectDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectUpdated: (updatedProject: Project) => void;
}

// Section Card Component
function SectionCard({ 
  title, 
  icon: Icon, 
  children, 
  delay = 0 
}: { 
  title: string; 
  icon: React.ElementType; 
  children: React.ReactNode; 
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <MagicCard 
        className="p-6 bg-white dark:bg-gray-900"
        gradientColor="rgba(147, 51, 234, 0.05)"
      >
        <div className="mb-4 flex items-center gap-2">
          <Icon className="h-5 w-5 text-purple-500" />
          <TextAnimate
            text={title}
            className="text-lg font-semibold text-gray-800 dark:text-gray-200"
            animationType="shine"
          />
        </div>
        <div className="space-y-4">
          {children}
        </div>
      </MagicCard>
    </motion.div>
  );
}

export function EditProjectDialog({
  project,
  open,
  onOpenChange,
  onProjectUpdated
}: EditProjectDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<{ id: string; full_name: string; company_name?: string }[]>([]);
  const [contacts, setContacts] = useState<{ id: string; name: string; company_id: string; company_name: string; email?: string; designation?: string }[]>([]);
  const [managers, setManagers] = useState<{ id: string; full_name: string; }[]>([]);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<EditProjectFormValues>({
    resolver: zodResolver(editProjectSchema),
    defaultValues: {
      title: project.title || '',
      client_id: project.client_id || '',
      manager_id: project.manager_id || '',
      status: project.status || 'planning',
      priority: project.priority || 'medium',
      event_type: project.event_type || '',
      description: 'description' in project ? (project as { description?: string }).description || '' : '',
      venue_address: project.venue_address || '',
      venue_details: project.venue_details || '',
      start_date: project.start_date ? new Date(project.start_date) : new Date(),
      end_date: project.end_date ? new Date(project.end_date) : undefined,
      working_hours_start: project.working_hours_start || '09:00',
      working_hours_end: project.working_hours_end || '17:00',
      crew_count: project.crew_count || 1,
      supervisors_required: project.supervisors_required || 0,
      budget: project.budget || 0,
      project_type: project.project_type || 'recruitment',
      schedule_type: project.schedule_type || 'single',
      cc_client_ids: 'cc_client_ids' in project ? (project as Project & { cc_client_ids?: string[] }).cc_client_ids || [] : [],
      cc_user_ids: 'cc_user_ids' in project ? (project as Project & { cc_user_ids?: string[] }).cc_user_ids || [] : [],
    },
  });

  // Reset form when project changes
  useEffect(() => {
    form.reset({
      title: project.title || '',
      client_id: project.client_id || '',
      manager_id: project.manager_id || '',
      status: project.status || 'planning',
      priority: project.priority || 'medium',
      event_type: project.event_type || '',
      description: 'description' in project ? (project as { description?: string }).description || '' : '',
      venue_address: project.venue_address || '',
      venue_details: project.venue_details || '',
      start_date: project.start_date ? new Date(project.start_date) : new Date(),
      end_date: project.end_date ? new Date(project.end_date) : undefined,
      working_hours_start: project.working_hours_start || '09:00',
      working_hours_end: project.working_hours_end || '17:00',
      crew_count: project.crew_count || 1,
      supervisors_required: project.supervisors_required || 0,
      budget: project.budget || 0,
      project_type: project.project_type || 'recruitment',
      schedule_type: project.schedule_type || 'single',
      cc_client_ids: 'cc_client_ids' in project ? (project as Project & { cc_client_ids?: string[] }).cc_client_ids || [] : [],
      cc_user_ids: 'cc_user_ids' in project ? (project as Project & { cc_user_ids?: string[] }).cc_user_ids || [] : [],
    });
  }, [project, form]);

  const fetchCustomersAndManagers = useCallback(async () => {
    try {
      // Fetch companies as customers
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, company_name')
        .order('company_name');

      if (companiesError) throw companiesError;

      setCustomers(companiesData?.map(company => ({
        id: company.id,
        full_name: company.company_name,
        company_name: company.company_name
      })) || []);

      // Fetch company contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from('company_contacts')
        .select(`
          id,
          name,
          email,
          designation,
          company_id,
          companies!company_contacts_company_id_fkey (
            company_name
          )
        `)
        .order('name');

      if (contactsError) throw contactsError;

      setContacts(contactsData?.map(contact => ({
        id: contact.id,
        name: contact.name,
        email: contact.email,
        designation: contact.designation,
        company_id: contact.company_id,
        company_name: contact.companies?.company_name || ''
      })) || []);

      // Fetch managers (admin and super_admin users)
      const { data: managersData, error: managersError } = await supabase
        .from('users')
        .select('id, full_name, role')
        .in('role', ['admin', 'super_admin', 'manager'])
        .order('full_name');

      if (managersError) throw managersError;

      setManagers(managersData || []);
    } catch (error) {
      logger.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load customers and managers",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Fetch customers and managers when dialog opens
  useEffect(() => {
    if (open) {
      fetchCustomersAndManagers();
    }
  }, [open, fetchCustomersAndManagers]);

  // Clear CC contacts when customer changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'client_id') {
        // Clear CC contacts when customer changes
        form.setValue('cc_client_ids', []);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = async (values: EditProjectFormValues) => {
    setIsSubmitting(true);
    try {
      // Get current user for notification
      const currentUser = await getUser();
      const userName = currentUser?.full_name || currentUser?.email || 'Someone';

      // Track changed fields for notification
      const changedFields: Record<string, { old: unknown; new: unknown }> = {};
      
      // Compare values with original project data
      Object.entries(values).forEach(([key, value]) => {
        const originalValue = project[key as keyof Project];
        
        // Special handling for dates
        if (key === 'start_date' || key === 'end_date') {
          const formattedNew = value ? format(value as Date, 'yyyy-MM-dd') : null;
          const formattedOld = originalValue ? format(new Date(originalValue as string), 'yyyy-MM-dd') : null;
          if (formattedNew !== formattedOld) {
            changedFields[key] = { old: formattedOld, new: formattedNew };
          }
        } 
        // Handle other fields
        else if (value !== originalValue) {
          changedFields[key] = { old: originalValue, new: value };
        }
      });

      const updateData = {
        ...values,
        start_date: format(values.start_date, 'yyyy-MM-dd'),
        end_date: values.end_date ? format(values.end_date, 'yyyy-MM-dd') : null,
        cc_client_ids: values.cc_client_ids || [],
        cc_user_ids: values.cc_user_ids || [],
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', project.id)
        .select('*')
        .single();

      if (error) throw error;

      // Send notification to client and CC to person in charge
      if (Object.keys(changedFields).length > 0) {
        try {
          const { subject, body } = notificationService.formatProjectUpdateEmail(
            project.title,
            changedFields,
            userName
          );
          
          await notificationService.notifyProjectStakeholders(
            project.id,
            subject,
            body,
            'project_update'
          );
        } catch (notifError) {
          logger.error('Failed to send notification:', notifError);
          // Don't fail the update if notification fails
        }
      }

      toast({
        title: "Success",
        description: "Project updated successfully",
      });

      onProjectUpdated(data);
      onOpenChange(false);
    } catch (error) {
      logger.error('Error updating project:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update project",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10"></div>
          
          <DialogHeader className="relative z-10 p-6 pb-0">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <DialogTitle className="text-2xl font-bold">
                <TextAnimate
                  text="Edit Project Details"
                  className="text-gray-900 dark:text-gray-100"
                  animationType="sparkle"
                />
              </DialogTitle>
              <DialogDescription className="mt-2 text-muted-foreground">
                Update the project information below
              </DialogDescription>
            </motion.div>
          </DialogHeader>
        
          <div className="relative z-10 p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Project Title with Shine Border */}
                <ShineBorder 
                  color={["#A07CFE", "#FE8FB5", "#FFBE7B"]} 
                  borderRadius={12} 
                  className="p-4"
                >
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-medium">Project Name</FormLabel>
                        <FormControl>
                          <Input {...field} className="text-lg" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </ShineBorder>

                {/* Basic Information */}
                <SectionCard title="Basic Information" icon={Building} delay={0.1}>
                  <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.company_name || customer.full_name}
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
                            <SelectValue placeholder="Select manager" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {managers.map((manager) => (
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="planning">Planning</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
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
                            <SelectValue />
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="project_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
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
                  name="schedule_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Schedule Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="single">Single</SelectItem>
                          <SelectItem value="recurring">Recurring</SelectItem>
                          <SelectItem value="multiple">Multiple</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="event_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Type</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Conference, Wedding, Corporate Event" />
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
                        {...field} 
                        placeholder="Add a description for this project..."
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </SectionCard>

            {/* Additional Stakeholders (CC) */}
            <SectionCard title="Additional Stakeholders (CC)" icon={Users} delay={0.15}>
              <div className="space-y-4">
                {/* CC Contacts */}
                <FormField
                  control={form.control}
                  name="cc_client_ids"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CC Contacts</FormLabel>
                      <FormDescription>
                        {form.watch('client_id') 
                          ? "Add additional client contacts to keep informed about this project"
                          : "Select a customer first to see their contacts"}
                      </FormDescription>
                      <Popover modal={true}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              disabled={!form.watch('client_id')}
                              className={cn(
                                "w-full justify-between",
                                !field.value?.length && "text-muted-foreground"
                              )}
                            >
                              {!form.watch('client_id') 
                                ? "Select a customer first"
                                : field.value?.length
                                  ? `${field.value.length} contact${field.value.length > 1 ? 's' : ''} selected`
                                  : "Select additional contacts"}
                              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Search contacts..." />
                            <CommandEmpty>
                              {form.watch('client_id') 
                                ? "No contacts found for this company" 
                                : "No contact found"}
                            </CommandEmpty>
                            <CommandGroup>
                              {contacts
                                .filter(contact => contact.company_id === form.getValues('client_id'))
                                .map((contact) => (
                                <CommandItem
                                  key={contact.id}
                                  value={contact.id}
                                  onSelect={() => {
                                    const currentValue = field.value || [];
                                    const isSelected = currentValue.includes(contact.id);
                                    const newValue = isSelected
                                      ? currentValue.filter((id) => id !== contact.id)
                                      : [...currentValue, contact.id];
                                    field.onChange(newValue);
                                  }}
                                >
                                  <div className="flex items-center">
                                    <div className={cn(
                                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                      field.value?.includes(contact.id)
                                        ? "bg-primary text-primary-foreground"
                                        : "opacity-50 [&_svg]:invisible"
                                    )}>
                                      <Check className="h-4 w-4" />
                                    </div>
                                    <div>
                                      <div className="font-medium">{contact.name}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {contact.designation || 'Contact'}
                                      </div>
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {field.value?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {field.value.map((contactId) => {
                            const contact = contacts.find(c => c.id === contactId);
                            return contact ? (
                              <Badge key={contactId} variant="secondary">
                                <span>{contact.name}</span>
                                {contact.designation && (
                                  <span className="text-xs text-muted-foreground ml-1">({contact.designation})</span>
                                )}
                                <button
                                  type="button"
                                  className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                  onClick={() => {
                                    field.onChange(field.value.filter(id => id !== contactId));
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* CC Users */}
                <FormField
                  control={form.control}
                  name="cc_user_ids"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CC Users</FormLabel>
                      <FormDescription>
                        Add additional team members to keep informed about this project
                      </FormDescription>
                      <Popover modal={true}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value?.length && "text-muted-foreground"
                              )}
                            >
                              {field.value?.length
                                ? `${field.value.length} user${field.value.length > 1 ? 's' : ''} selected`
                                : "Select additional users"}
                              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Search users..." />
                            <CommandEmpty>No user found.</CommandEmpty>
                            <CommandGroup>
                              {managers
                                .filter(m => m.id !== form.getValues('manager_id'))
                                .map((manager) => (
                                  <CommandItem
                                    key={manager.id}
                                    value={manager.id}
                                    onSelect={() => {
                                      const currentValue = field.value || [];
                                      const isSelected = currentValue.includes(manager.id);
                                      const newValue = isSelected
                                        ? currentValue.filter((id) => id !== manager.id)
                                        : [...currentValue, manager.id];
                                      field.onChange(newValue);
                                    }}
                                  >
                                    <div className="flex items-center">
                                      <div className={cn(
                                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                        field.value?.includes(manager.id)
                                          ? "bg-primary text-primary-foreground"
                                          : "opacity-50 [&_svg]:invisible"
                                      )}>
                                        <Check className="h-4 w-4" />
                                      </div>
                                      {manager.full_name}
                                    </div>
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {field.value?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {field.value.map((userId) => {
                            const user = managers.find(m => m.id === userId);
                            return user ? (
                              <Badge key={userId} variant="secondary">
                                {user.full_name}
                                <button
                                  type="button"
                                  className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                  onClick={() => {
                                    field.onChange(field.value.filter(id => id !== userId));
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </SectionCard>

            {/* Location Details */}
            <SectionCard title="Location Details" icon={MapPin} delay={0.2}>
              
              <FormField
                control={form.control}
                name="venue_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Venue Address</FormLabel>
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
                      <Textarea 
                        {...field} 
                        placeholder="Additional venue information..."
                        rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </SectionCard>

            {/* Schedule */}
            <SectionCard title="Schedule" icon={Clock} delay={0.3}>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <Popover modal={true} open={startDateOpen} onOpenChange={setStartDateOpen}>
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
                            onSelect={(date) => {
                              field.onChange(date);
                              setStartDateOpen(false);
                            }}
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
                      <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
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
                            onSelect={(date) => {
                              field.onChange(date);
                              setEndDateOpen(false);
                            }}
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
                      <FormLabel>Working Hours Start</FormLabel>
                      <FormControl>
                        <Input {...field} type="time" />
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
                      <FormLabel>Working Hours End</FormLabel>
                      <FormControl>
                        <Input {...field} type="time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </SectionCard>

            {/* Staffing & Budget */}
            <SectionCard title="Staffing & Budget" icon={Users} delay={0.4}>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="crew_count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Crew Count</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number"
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
                          {...field} 
                          type="number"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget (RM)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input 
                          {...field} 
                          type="number"
                          step="0.01"
                          className="pl-10"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </SectionCard>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </motion.div>
            </DialogFooter>
          </form>
        </Form>
      </div>
    </div>
  </DialogContent>
</Dialog>
  );
}