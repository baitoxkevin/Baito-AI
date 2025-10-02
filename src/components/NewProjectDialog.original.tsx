import { useState, useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { getSession } from '@/lib/auth';
import { CalendarIcon, ChevronLeft, ChevronRight, Loader2, Shield, Palette, Sparkles, Wand2, Calendar as CalendarLucide, Building, Info, Users, Plus, MapPin, Clock, PlusCircle, Briefcase, ClipboardList, ListTodo, FileSpreadsheet } from 'lucide-react';
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from "@/components/ui/textarea";
import { cn, formatTimeString, getGoogleMapsLink, getWazeLink, createDialogHandler } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { createProject } from '@/lib/projects';
import { useToast } from '@/hooks/use-toast';
import { getTaskSuggestions, TaskSuggestion } from '@/lib/ai-service';
import NewCompanyDialog from '@/components/NewCompanyDialog';

// Define step types
type Step = 
  | 'project-info' 
  | 'event-details' 
  | 'schedule' 
  | 'staffing' 
  | 'task-creation';

// Make schema more step-friendly
const projectSchema = z.object({
  // Step 1: Project Information
  title: z.string().min(1, 'Project name is required'),
  client_id: z.string().min(1, 'Customer is required'),
  manager_id: z.string().min(1, 'Person in charge is required'),
  status: z.enum(['new', 'in-progress', 'completed', 'cancelled', 'pending']).default('new'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, 'Must be a valid hex color').optional(),
  
  // Step 2: Event Details & Branding
  event_type: z.string().min(1, 'Event type is required'),
  logo_url: z.string().optional(), // Added back as it exists in the database schema (per migration file)
  venue_address: z.string().min(1, 'Venue address is required'),
  venue_details: z.string().optional(),
  
  // Step 3: Schedule
  start_date: z.date({
    required_error: 'Start date is required',
  }),
  end_date: z.date().optional(),
  working_hours_start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  working_hours_end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  
  // For recurring schedules
  recurrence_pattern: z.enum(['daily', 'weekly', 'biweekly', 'monthly']).optional(),
  recurrence_days: z.array(z.number().min(0).max(6)).optional(),
  
  // For multiple locations
  locations: z.array(z.object({
    address: z.string().min(1, 'Location address is required'),
    date: z.string().min(1, 'Location date is required'),
    is_primary: z.boolean().default(false),
    notes: z.string().optional()
  })).optional(),
  
  // Step 4: Staffing
  crew_count: z.number().min(1, 'Must have at least one crew member'),
  needs_supervisors: z.boolean().default(false),
  supervisors_required: z.number().min(0).max(9).optional(),
  project_type: z.string().optional().default('recruitment'), // Added project_type
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectAdded: () => void;
  initialDates: { start: Date; end: Date } | null;
}

export default function NewProjectDialog({
  open,
  onOpenChange,
  onProjectAdded,
  initialDates,
}: NewProjectDialogProps) {
  // Navigation state
  const [currentStep, setCurrentStep] = useState<Step>('project-info');
  const [isSkipStaffing, setIsSkipStaffing] = useState(false);
  
  // Form state
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [customers, setCustomers] = useState<{ id: string; full_name: string; }[]>([]);
  const [managers, setManagers] = useState<{ id: string; full_name: string; }[]>([]);
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<number[]>([]);
  const [suggestedTasks, setSuggestedTasks] = useState<TaskSuggestion[]>([]);
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
  const colorWasSelected = useRef(false);
  const [selectedColor, setSelectedColor] = useState('#CBD5E1');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const [needsStaffing, setNeedsStaffing] = useState<boolean>(false);
  const [scheduleType, setScheduleType] = useState<'single' | 'recurring' | 'multiple'>('single');
  
  // Check for saved locations data when dialog opens
  useEffect(() => {
    if (open && scheduleType === 'multiple') {
      try {
        const savedLocations = localStorage.getItem('extractedLocations');
        if (savedLocations) {
          const parsedLocations = JSON.parse(savedLocations);
          if (Array.isArray(parsedLocations) && parsedLocations.length > 0) {
            // Format the locations to match our internal format
            const newLocations = parsedLocations.map((loc, index) => ({
              id: `imported-${index}`,
              address: loc.location || '',
              date: loc.date || '',
              isPrimary: index === 0, // First location is primary
              notes: `${loc.time || ''} ${loc.staff ? `• Staff: ${loc.staff}` : ''} ${loc.region ? `• ${loc.region}` : ''}`
            }));
            
            // Set the locations
            setLocations(newLocations);
            
            // Update the main project fields with the primary location data
            if (newLocations[0]) {
              form.setValue('venue_address', newLocations[0].address);
              if (newLocations[0].date) {
                const date = new Date(newLocations[0].date);
                if (!isNaN(date.getTime())) {
                  form.setValue('start_date', date);
                }
              }
            }
            
            toast({
              title: 'Locations Loaded',
              description: `${newLocations.length} locations imported from the Data Extraction Tool.`,
            });
            
            // Clear the localStorage to avoid confusion on subsequent opens
            localStorage.removeItem('extractedLocations');
          }
        }
      } catch (err) {
        logger.error('Error loading saved locations:', err);
      }
    }
  }, [open, scheduleType]);
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Default to weekdays
  const [locations, setLocations] = useState<Array<{
    id: string;
    address: string;
    date: string;
    isPrimary: boolean;
    notes?: string;
  }>>([
    {
      id: '1',
      address: '',
      date: '',
      isPrimary: true,
      notes: ''
    },
    {
      id: '2',
      address: '',
      date: '',
      isPrimary: false,
      notes: ''
    }
  ]);
  const [staffTypes, setStaffTypes] = useState<{id: string, name: string, count: number}[]>([
    { id: '1', name: 'Promoters', count: 0 },
    { id: '2', name: 'BAs', count: 0 },
    { id: '3', name: 'Models', count: 0 },
    { id: '4', name: 'Supervisors', count: 0 }
  ]);

  // Define steps for navigation
  const steps: { id: Step; title: string; icon: React.ReactNode; description: string }[] = [
    { 
      id: 'project-info', 
      title: 'Project Information', 
      icon: <Briefcase className="w-5 h-5" />,
      description: 'Basic project details and client information'
    },
    { 
      id: 'event-details', 
      title: 'Event Details & Brand', 
      icon: <Building className="w-5 h-5" />,
      description: 'Event type, branding, and venue information'
    },
    { 
      id: 'schedule', 
      title: 'Project Schedule', 
      icon: <CalendarLucide className="w-5 h-5" />,
      description: 'Date, time, and schedule settings'
    },
    { 
      id: 'staffing', 
      title: 'Staffing Requirements', 
      icon: <Users className="w-5 h-5" />,
      description: 'Specify staff needs for the project'
    },
    { 
      id: 'task-creation', 
      title: 'Tasks & Setup', 
      icon: <ListTodo className="w-5 h-5" />,
      description: 'Create initial tasks and finalize setup'
    }
  ];

  // Get current step index
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  const totalSteps = steps.length;
  
  // For navigation between steps
  const nextStep = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex < steps.length - 1) {
      // Handle special case for staffing
      if (steps[currentIndex + 1].id === 'staffing' && isSkipStaffing) {
        setCurrentStep(steps[currentIndex + 2].id);
      } else {
        setCurrentStep(steps[currentIndex + 1].id);
      }
    }
  };
  
  const prevStep = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex > 0) {
      // Always move to the previous step, don't skip staffing on back navigation
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  // Allow jumping to any previous step directly
  const jumpToStep = (stepId: Step) => {
    const targetIndex = steps.findIndex(step => step.id === stepId);
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    
    // Only allow going to previous steps or current step
    if (targetIndex <= currentIndex) {
      setCurrentStep(stepId);
    }
  };

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: '',
      event_type: 'other',
      working_hours_start: '09:00',
      working_hours_end: '17:00',
      crew_count: 1,
      needs_supervisors: false,
      supervisors_required: 0,
      status: 'new',
      priority: 'medium',
      start_date: initialDates?.start || new Date(),
      end_date: initialDates?.end,
      venue_address: '',
      venue_details: '',
      color: '#CBD5E1', // Default gray color
      // logo_url field is not in the database schema but included in form for future use
      logo_url: '',
      project_type: 'recruitment',
    },
    mode: 'onChange'
  });
  
  // Update form with locations data
  useEffect(() => {
    if (scheduleType === 'multiple') {
      // Initialize locations with form data if we have venue info
      if (form.getValues().venue_address) {
        const currentLocations = [...locations];
        if (currentLocations.length > 0) {
          currentLocations[0] = {
            ...currentLocations[0],
            address: form.getValues().venue_address || '',
            date: form.getValues().start_date ? format(form.getValues().start_date, "yyyy-MM-dd") : '',
          };
          setLocations(currentLocations);
        }
      }
    }
  }, [scheduleType]);
  
  // Update form data whenever locations change
  useEffect(() => {
    if (scheduleType === 'multiple') {
      // Map to the format expected by the API
      const formattedLocations = locations.map(loc => ({
        address: loc.address,
        date: loc.date,
        is_primary: loc.isPrimary,
        notes: loc.notes
      }));
      
      // Update form data
      const projectData = form.getValues();
      projectData.locations = formattedLocations;
      
      // Also set the main venue address to the primary location
      const primaryLocation = locations.find(loc => loc.isPrimary);
      if (primaryLocation?.address) {
        form.setValue('venue_address', primaryLocation.address);
      }
      
      // Set the start_date to the primary location date
      if (primaryLocation?.date) {
        const date = new Date(primaryLocation.date);
        if (!isNaN(date.getTime())) {
          form.setValue('start_date', date);
        }
      }
    }
  }, [locations, scheduleType]);
  
  // Update form with selected days
  useEffect(() => {
    if (scheduleType === 'recurring') {
      const projectData = form.getValues();
      projectData.recurrence_days = selectedDays;
    }
  }, [selectedDays, scheduleType]);

  // Reset form and state when dialog opens
  useEffect(() => {
    if (open) {
      // Reset step
      setCurrentStep('project-info');
      
      // Reset color selection state
      colorWasSelected.current = false;
      setSelectedColor('#CBD5E1');
      
      // Reset logo state
      setLogoFile(null);
      setLogoPreview(null);
      
      // Reset schedule type
      setScheduleType('single');
      
      // Reset days selection for recurring events
      setSelectedDays([1, 2, 3, 4, 5]); // Default to weekdays
      
      // Reset locations for multiple locations
      setLocations([
        {
          id: '1',
          address: '',
          date: '',
          isPrimary: true,
          notes: ''
        },
        {
          id: '2',
          address: '',
          date: '',
          isPrimary: false,
          notes: ''
        }
      ]);
      
      // Reset form with new values
      form.reset({
        title: '',
        event_type: 'other',
        working_hours_start: '09:00',
        working_hours_end: '17:00',
        crew_count: 1,
        needs_supervisors: false,
        supervisors_required: 0,
        status: 'new',
        priority: 'medium',
        start_date: initialDates?.start || new Date(),
        end_date: initialDates?.end,
        venue_address: '',
        venue_details: '',
        color: '#CBD5E1', // Default gray color
        logo_url: '', // Default empty logo URL
      });
    }
  }, [open, initialDates, form]);

  const loadCustomers = async () => {
    try {
      // First try loading clients
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('role', 'client');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setCustomers(data);
      } else {
        // logger.debug('No users with role "client" found, { data: trying to load from companies table...' });
        
        // If no clients, try loading from companies table as fallback
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('id, company_name');
          
        if (companyError) throw companyError;
        
        // Map companies to customers format
        const companiesAsCustomers = companyData.map(company => ({
          id: company.id,
          full_name: company.company_name
        }));
        
        setCustomers(companiesAsCustomers);
      }
    } catch (error) {
      logger.error('Error loading customers:', error);
      toast({
        title: 'Error loading customers',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  const loadManagers = async () => {
    try {
      // First try to load users with manager role
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('role', 'manager');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setManagers(data);
      } else {
        // logger.debug('No users with role "manager" found, { data: loading all users as fallback...' });
        
        // If no managers, try loading all users as fallback
        const { data: allUsers, error: usersError } = await supabase
          .from('users')
          .select('id, full_name');
          
        if (usersError) throw usersError;
        
        if (allUsers && allUsers.length > 0) {
          setManagers(allUsers);
        } else {
          // If still no users, create a default manager
          setManagers([{ 
            id: '00000000-0000-0000-0000-000000000000', 
            full_name: 'Default Manager' 
          }]);
        }
      }
    } catch (error) {
      logger.error('Error loading managers:', error);
      toast({
        title: 'Error loading managers',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
      
      // Set a fallback option to prevent UI errors
      setManagers([{ 
        id: '00000000-0000-0000-0000-000000000000', 
        full_name: 'Default Manager' 
      }]);
    }
  };

  useEffect(() => {
    if (open) {
      loadCustomers();
      loadManagers();
      // Reset suggestions when dialog opens
      setSuggestions([]);
      setSelectedSuggestions([]);
      setSuggestedTasks([]);
    }
  }, [open]);
  
  // Handle logo file selection
  const handleLogoChange = (file: File | null) => {
    if (!file) {
      setLogoFile(null);
      setLogoPreview(null);
      form.setValue('logo_url', '');
      return;
    }
    
    // Validate file type
    const validFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
    if (!validFileTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Logo must be a JPG, PNG, GIF, or SVG image',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Logo image must be less than 2MB',
        variant: 'destructive',
      });
      return;
    }
    
    setLogoFile(file);
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);
  };
  
  // Upload logo to storage and get URL
  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) {
      return form.getValues().logo_url || null; // Return existing URL if no new file
    }
    
    setIsUploading(true);
    
    try {
      // First, try to ensure the bucket exists
      const bucketResult = await ensureLogosBucketExists();
      if (!bucketResult.success) {
        // logger.warn('Error ensuring logos bucket:', bucketResult.message);
        // Continue anyway, in case it's just a permission issue but the bucket actually exists
      }
      
      // Create a unique file path
      const fileExt = logoFile.name.split('.').pop()?.toLowerCase() || 'png';
      const fileName = `project-logo-${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `project-logos/${fileName}`;
      
      // Create project-logos folder if needed
      try {
        const { data: folderData, error: folderError } = await supabase.storage
          .from('logos')
          .upload('project-logos/.folder', new Blob(['']));
          
        if (folderError && !folderError.message.includes('already exists')) {
          // logger.warn('Error creating folder:', folderError);
        }
      } catch (folderError) {
        // logger.warn('Error creating folder:', folderError);
      }
      
      // Upload the file
      const { data, error } = await supabase.storage
        .from('logos')
        .upload(filePath, logoFile, {
          cacheControl: '3600',
          upsert: true // Set to true to overwrite if needed
        });
      
      if (error) {
        if (error.message.includes('Bucket not found')) {
          // Special handling for bucket not found
          toast({
            title: 'Storage bucket missing',
            description: 'Please use the fix-company-logo.html tool to fix this issue',
            variant: 'destructive',
          });
        }
        throw error;
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);
        
      // Return the public URL
      return urlData.publicUrl;
    } catch (error) {
      logger.error('Error uploading logo:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload project logo. Check console for details.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Function to determine if we have enough info for suggestions
  const formHasEnoughInfo = useMemo(() => {
    const values = form.getValues();
    return (
      values.title && 
      values.event_type && 
      (needsStaffing ? values.crew_count > 0 : true) && 
      (scheduleType === 'multiple' ? true : values.venue_address)
    );
  }, [
    form.watch('title'), 
    form.watch('event_type'), 
    form.watch('crew_count'), 
    form.watch('venue_address'), 
    needsStaffing,
    scheduleType
  ]);
  
  // Logo and branding info based on event type
  const eventInfo = useMemo(() => {
    // This would come from your database or API in a real app
    const eventDetails: Record<string, { color: string, logo?: string }> = {
      'nestle': { 
        color: '#FCA5A5',
        logo: 'https://upload.wikimedia.org/wikipedia/en/d/d8/Nestl%C3%A9.svg'
      },
      'ribena': { 
        color: '#DDD6FE',
        logo: 'https://upload.wikimedia.org/wikipedia/en/6/6a/Ribena_logo.svg' 
      },
      'mytown': { color: '#FDA4AF' },
      'warrior': { 
        color: '#93C5FD',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Red_Bull_brand_mark.svg'
      },
      'diy': { color: '#FEF08A' },
      'blackmores': { color: '#E2E8F0' },
      'lapasar': { color: '#F9A8D4' },
      'spritzer': { color: '#BBF7D0' },
      'redoxon': { color: '#FDBA74' },
      'double-mint': { color: '#67E8F9' },
      'softlan': { color: '#E2E8F0' },
      'colgate': { 
        color: '#FED7AA',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/8/86/Colgate_Logo.svg'
      },
      'hsbc': { 
        color: '#FCA5A5',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/a/aa/HSBC_logo_%282018%29.svg'
      },
      'asw': { color: '#93C5FD' },
      'lee-frozen': { color: '#E2E8F0' },
      'maggle': { color: '#E2E8F0' },
      'unifi': { 
        color: '#FEF9C3',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/UniFi_Logo.svg'
      },
      'brands': { color: '#BBF7D0' },
      'oppo': { 
        color: '#93C5FD',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/8/83/OPPO_Logo_wiki.png'
      },
      'chrissy': { color: '#F9A8D4' },
      'xiao-mi': { color: '#E2E8F0' },
      'mcd': { 
        color: '#DDD6FE',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/3/36/McDonald%27s_Golden_Arches.svg'
      },
      'te': { color: '#F472B6' },
      'cpoc': { color: '#86EFAC' },
      'drora': { color: '#FEF9C3' },
      'roving': { color: '#FCA5A5' },
      'roadshow': { color: '#93C5FD' },
      'in-store': { color: '#DDD6FE' },
      'ad-hoc': { color: '#FEF08A' },
      'corporate': { color: '#BBF7D0' },
      'wedding': { color: '#F9A8D4' },
      'concert': { color: '#93C5FD' },
      'conference': { color: '#FDBA74' },
      'other': { color: '#CBD5E1' },
    };
    
    const selectedEvent = form.watch('event_type');
    const details = eventDetails[selectedEvent] || { color: '#CBD5E1' };
    
    // Auto-update color and logo when event type changes
    if (details.color) {
      form.setValue('color', details.color);
    }
    
    if (details.logo) {
      form.setValue('logo_url', details.logo);
    }
    
    return details;
  }, [form.watch('event_type')]);
  
  // Function to get task suggestions from AI
  const handleGetSuggestions = async () => {
    setIsSuggestionsLoading(true);
    setSuggestions([]);
    setSelectedSuggestions([]);
    
    try {
      const formData = form.getValues();
      
      const projectDetails = {
        title: formData.title,
        // project_type field removed as it's not in the database schema
        event_type: formData.event_type,
        crew_count: formData.crew_count,
        supervisors_required: formData.needs_supervisors ? formData.supervisors_required : 0,
        venue_address: formData.venue_address,
        start_date: formData.start_date,
        end_date: formData.end_date,
      };
      
      const taskSuggestions = await getTaskSuggestions(projectDetails);
      
      setSuggestions(taskSuggestions);
      // Select all suggestions by default
      setSelectedSuggestions(taskSuggestions.map((_, index) => index));
      
      toast({
        title: 'Suggestions ready',
        description: `${taskSuggestions.length} task suggestions generated based on your project details`,
      });
      
    } catch (error) {
      logger.error('Error getting suggestions:', error);
      toast({
        title: 'Error getting suggestions',
        description: 'Failed to generate task suggestions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSuggestionsLoading(false);
    }
  };
  
  // Function to add selected suggestions to tasks list
  const handleAddSelectedSuggestions = () => {
    const tasksToAdd = selectedSuggestions.map(index => suggestions[index]);
    setSuggestedTasks(tasksToAdd);
    
    toast({
      title: 'Tasks ready',
      description: `${tasksToAdd.length} tasks will be created with this project.`,
    });
    
    // Clear the suggestions UI after adding
    setSuggestions([]);
    setSelectedSuggestions([]);
  };

  // Project type detection function - no longer used with database schema, kept for reference
  const determineProjectType = (data: ProjectFormValues): 'recruitment' | 'internal_event' | 'custom' => {
    if (data.crew_count > 0) {
      return 'recruitment';
    } else if (['roadshow', 'in-store', 'corporate', 'wedding', 'concert', 'conference'].includes(data.event_type)) {
      return 'internal_event';
    } else {
      return 'custom';
    }
  };

  const onSubmit = async (data: ProjectFormValues) => {
    // logger.debug('[NewProjectDialog] onSubmit - Function start. Initial data:', { data: JSON.stringify(data, null, 2 }));
    setIsLoading(true);
    
    try {
      // logger.debug("[NewProjectDialog] onSubmit - Form submission started with data (raw object):", data);
      // logger.debug("[NewProjectDialog] onSubmit - Current form.getValues():", JSON.stringify(form.getValues(), null, 2));
      // logger.debug("[NewProjectDialog] onSubmit - Form validation state (form.formState.errors):", JSON.stringify(form.formState.errors, null, 2));
      
      // Get automatic color for event type if not provided
      const eventColors = {
        'nestle': '#FCA5A5',
        'ribena': '#DDD6FE',
        'mytown': '#FDA4AF',
        'warrior': '#93C5FD',
        'diy': '#FEF08A',
        'blackmores': '#E2E8F0',
        'lapasar': '#F9A8D4',
        'spritzer': '#BBF7D0',
        'redoxon': '#FDBA74',
        'double-mint': '#67E8F9',
        'softlan': '#E2E8F0',
        'colgate': '#FED7AA',
        'hsbc': '#FCA5A5',
        'asw': '#93C5FD',
        'lee-frozen': '#E2E8F0',
        'maggle': '#E2E8F0',
        'unifi': '#FEF9C3',
        'brands': '#BBF7D0',
        'oppo': '#93C5FD',
        'chrissy': '#F9A8D4',
        'xiao-mi': '#E2E8F0',
        'mcd': '#DDD6FE',
        'te': '#F472B6',
        'cpoc': '#86EFAC',
        'drora': '#FEF9C3',
        'roving': '#FCA5A5',
        'roadshow': '#93C5FD',
        'in-store': '#DDD6FE',
        'ad-hoc': '#FEF08A',
        'corporate': '#BBF7D0',
        'wedding': '#F9A8D4',
        'concert': '#93C5FD',
        'conference': '#FDBA74',
        'other': '#CBD5E1',
      };
      
      // Use selected color if explicitly chosen, otherwise use the event type color
      const finalColor = colorWasSelected.current 
        ? selectedColor
        : (data.color || eventColors[data.event_type] || '#CBD5E1');
      
      // Upload logo if one was selected
      let logoUrl = data.logo_url;
      // logger.debug('[NewProjectDialog] onSubmit - Initial logoUrl from data:', { data: logoUrl });
      if (logoFile) {
        // logger.debug('[NewProjectDialog] onSubmit - logoFile is present. Attempting to upload.');
        const uploadedLogoUrl = await uploadLogo();
        // logger.debug('[NewProjectDialog] onSubmit - uploadLogo() returned:', uploadedLogoUrl);
        logoUrl = uploadedLogoUrl || logoUrl;
        // logger.debug('[NewProjectDialog] onSubmit - Final logoUrl after upload attempt:', { data: logoUrl });
      }
      
      // Determine project type
      const projectType = determineProjectType(data);

      // Create the project object with schedule type and associated data
      const projectData: any = {
        title: data.title,
        client_id: data.client_id,
        manager_id: data.manager_id,
        start_date: data.start_date.toISOString(),
        end_date: data.end_date?.toISOString(),
        working_hours_start: data.working_hours_start,
        working_hours_end: data.working_hours_end,
        event_type: data.event_type,
        // project_type field removed as it's not in the database schema
        crew_count: data.crew_count,
        filled_positions: 0,
        venue_address: data.venue_address,
        venue_details: data.venue_details,
        supervisors_required: data.needs_supervisors ? data.supervisors_required : 0,
        status: data.status,
        priority: data.priority,
        color: finalColor,
        logo_url: logoUrl || null, // Use the newly uploaded logo URL if available
        project_type: projectType,
        schedule_type: scheduleType
      };
      
      // Add schedule-type specific properties
      if (scheduleType === 'recurring') {
        // Get recurrence data from form state (temporary until we have proper form field)
        // Default to weekdays if not specified
        const recurrenceDays = data.recurrence_days || [1, 2, 3, 4, 5]; 
        const recurrencePattern = data.recurrence_pattern || 'weekly';
        
        projectData.recurrence_pattern = recurrencePattern;
        projectData.recurrence_days = recurrenceDays;
      }
      
      // Add locations data for multiple locations
      if (scheduleType === 'multiple') {
        // This should already be set in the form data from our location component
        projectData.locations = data.locations || [];
      }

      // Get current user ID for authentication context
      const session = await getSession();
      if (!session?.user) {
        throw new Error("You must be logged in to create a project");
      }
      
      // Add user ID to project data as manager_id if not already set
      if (!projectData.manager_id) {
        projectData.manager_id = session.user.id;
      }
      
      // If client_id is set but appears invalid, remove it to avoid FK errors
      if (projectData.client_id) {
        try {
          // Simple validation - if it's not a UUID, it's not valid
          const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectData.client_id);
          if (!isValidUUID) {
            // logger.warn("Removing invalid client_id to avoid FK constraint error");
            delete projectData.client_id;
          }
        } catch (e) {
          // If any issue occurs, just remove the client_id to be safe
          // logger.warn("Error validating client_id, removing it", e);
          delete projectData.client_id;
        }
      }
      
      // Create the project
      // logger.debug('[NewProjectDialog] onSubmit - Assembled projectData before calling createProject:', { data: JSON.stringify(projectData, null, 2 }));
      const projectResponse = await createProject(projectData);
      // logger.debug('[NewProjectDialog] onSubmit - Response from createProject:', { data: JSON.stringify(projectResponse, null, 2 }));
      
      // If we have suggested tasks and they've been approved, create them
      if (suggestedTasks.length > 0 && projectResponse?.id) { // Added optional chaining for projectResponse
        // logger.debug('[NewProjectDialog] onSubmit - projectResponse.id exists and suggestedTasks present. Proceeding to create tasks. Project ID:', { data: projectResponse.id });
        const projectId = projectResponse.id;
        
        // Create tasks in bulk
        try {
          // logger.debug('[NewProjectDialog] onSubmit - Tasks to be created:', { data: JSON.stringify(suggestedTasks, null, 2 }));
          await Promise.all(suggestedTasks.map(async (task) => {
            // Calculate due date based on relative value
            const daysFromStart = parseInt(task.due_date_relative.split(' ')[0]) || 0;
            const startDate = new Date(data.start_date);
            const dueDate = new Date(startDate);
            dueDate.setDate(startDate.getDate() + daysFromStart);
            
            await supabase.from('tasks').insert({
              project_id: projectId,
              title: task.title,
              description: task.description,
              status: task.status,
              priority: task.priority,
              due_date: dueDate.toISOString().split('T')[0],
              created_at: new Date().toISOString(),
            });
          }));
          
          toast({
            title: 'Tasks added',
            description: `${suggestedTasks.length} tasks were created for this project`,
          });
        } catch (taskError) {
          logger.error('Error creating tasks:', taskError);
          toast({
            title: 'Warning',
            description: 'Project created but there was an issue creating tasks',
            variant: 'destructive',
          });
        }
      }

      toast({
        title: 'Success',
        description: 'Project created successfully',
      });

      onProjectAdded();
      onOpenChange(false);
      // logger.debug('[NewProjectDialog] onSubmit - Successfully created project and tasks (if any). Dialog closing.');
    } catch (error) {
      logger.error('[NewProjectDialog] onSubmit - ERROR caught during submission:', error);
      logger.error('Error creating project:', error); // Keep original error log too
      
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      // More descriptive error messages
      if (error instanceof Error) {
        if (error.message.includes('foreign key constraint')) {
          errorMessage = 'Client or manager not found. Please check your selection.';
        } else if (error.message.includes('unique constraint')) {
          errorMessage = 'A project with this name already exists.';
        } else if (error.message.includes('not found')) {
          errorMessage = 'Required data not found. Please check all fields.';
        } else if (error.message.includes('permission denied')) {
          errorMessage = 'You do not have permission to create projects.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('required')) {
          errorMessage = 'Missing required fields. Please check all mandatory fields.';
        } else if (error.message.includes('validation')) {
          errorMessage = 'Invalid data provided. Please check all fields.';
        } else {
          // Include part of the error message for debugging but keep it user-friendly
          errorMessage = `Error: ${error.message.substring(0, 100)}${error.message.length > 100 ? '...' : ''}`;
        }
      }
      
      toast({
        title: 'Project creation failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check if form data is valid for the current step
  const isCurrentStepValid = () => {
    const values = form.getValues();
    
    switch(currentStep) {
      case 'project-info':
        return !!values.title && !!values.client_id && !!values.manager_id;
      case 'event-details':
        return !!values.event_type && !!values.venue_address;
      case 'schedule':
        return !!values.start_date && 
          !!values.working_hours_start && 
          !!values.working_hours_end;
      case 'staffing':
        return true; // Can be skipped, so always valid
      case 'task-creation':
        return true; // No required fields just tasks
      default:
        return false;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={createDialogHandler(onOpenChange)}>
        <DialogContent 
          className="w-[95%] sm:max-w-[800px] max-h-[95vh] overflow-hidden p-0 border-primary/10 bg-background shadow-lg shadow-primary/5"
          overlayClassName="bg-black/25 backdrop-blur-[1px]"
        >
          <div className="flex h-full">
            {/* Sidebar */}
            <div className="hidden md:block w-1/3 border-r border-gray-200 p-6 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
              <h2 className="text-lg font-semibold mb-4">Create Project</h2>
              <p className="text-gray-500 mb-6 text-sm">
                Complete all steps to set up your new project.
              </p>
              <nav className="space-y-2">
                {steps.map((step, index) => (
                  <button
                    key={step.id}
                    className={cn(
                      "flex items-center text-gray-500 w-full p-2 rounded-lg text-left",
                      currentStep === step.id && "bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 text-gray-900 dark:text-gray-100 font-medium"
                    )}
                    onClick={() => jumpToStep(step.id)}
                    disabled={index > currentStepIndex}
                  >
                    <div className={cn(
                      "flex items-center justify-center w-7 h-7 rounded-full mr-2",
                      index < currentStepIndex ? "bg-green-100 text-green-600" : 
                      index === currentStepIndex ? "bg-blue-100 text-blue-600" : 
                      "bg-gray-100 text-gray-400"
                    )}>
                      {index < currentStepIndex ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    <span className="align-middle">{step.title}</span>
                  </button>
                ))}
              </nav>
              <div className="mt-6 text-gray-500 text-sm bottom-6 absolute md:relative md:bottom-auto">
                <p>Step {currentStepIndex + 1} of {totalSteps}</p>
                <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                  <div 
                    className="h-1 rounded-full bg-gradient-to-r from-blue-400 to-blue-500"
                    style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="w-full md:w-2/3 flex flex-col">
              <div className="flex justify-between items-center p-6 border-b">
                <div>
                  <h2 className="text-lg font-semibold flex items-center">
                    {steps[currentStepIndex].icon}
                    <span className="ml-2">{steps[currentStepIndex].title}</span>
                  </h2>
                  <p className="text-gray-500 text-sm">{steps[currentStepIndex].description}</p>
                </div>
                {/* Mobile step indicator */}
                <div className="flex md:hidden items-center space-x-1">
                  {steps.map((_, index) => (
                    <div 
                      key={index}
                      className={cn(
                        "w-2 h-2 rounded-full", 
                        index === currentStepIndex 
                          ? "bg-blue-500" 
                          : index < currentStepIndex 
                            ? "bg-green-500" 
                            : "bg-gray-300"
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="flex-grow overflow-y-auto p-6 max-h-[70vh]">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Step 1: Project Info */}
                    {currentStep === 'project-info' && (
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => {
                            const [colorPickerOpen, setColorPickerOpen] = useState(false);
                            return (
                              <FormItem>
                                <FormLabel>Project Name *</FormLabel>
                                <div className="relative">
                                  <FormControl>
                                    <div className="flex">
                                      <Input {...field} className="font-medium" />
                                      <div className="absolute right-1 top-1/2 -mt-3 flex items-center">
                                        <button 
                                          type="button" 
                                          className="p-1 rounded-md hover:bg-muted group relative" 
                                          onClick={() => setColorPickerOpen(!colorPickerOpen)}
                                          style={{ backgroundColor: selectedColor || form.watch('color') || '#CBD5E1' }}
                                        >
                                          <Palette className="h-4 w-4 group-hover:text-white" />
                                        </button>
                                      </div>
                                    </div>
                                  </FormControl>
                                  
                                  {colorPickerOpen && (
                                    <div className="absolute right-0 top-full mt-1 z-50 p-2 grid grid-cols-5 gap-1 border rounded-md bg-background shadow-md animate-in fade-in w-56">
                                      {[
                                        { name: "Red", color: "#FCA5A5" },
                                        { name: "Orange", color: "#FDBA74" },
                                        { name: "Yellow", color: "#FEF08A" },
                                        { name: "Green", color: "#BBF7D0" },
                                        { name: "Teal", color: "#67E8F9" },
                                        { name: "Blue", color: "#93C5FD" },
                                        { name: "Purple", color: "#DDD6FE" },
                                        { name: "Pink", color: "#F9A8D4" },
                                        { name: "Gray", color: "#E2E8F0" },
                                        { name: "Default", color: "#CBD5E1" }
                                      ].map(colorOption => (
                                        <div 
                                          key={colorOption.color}
                                          className={`aspect-square rounded-md cursor-pointer transition-all border flex items-center justify-center ${(form.watch('color') === colorOption.color || selectedColor === colorOption.color) ? 'ring-2 ring-primary ring-offset-2' : 'hover:scale-105'}`}
                                          style={{ backgroundColor: colorOption.color }}
                                          onClick={() => {
                                            // Mark that a color was explicitly selected
                                            colorWasSelected.current = true;
                                            
                                            // Update state and form values
                                            setSelectedColor(colorOption.color);
                                            form.setValue('color', colorOption.color, { shouldValidate: true });
                                            
                                            // Close color picker after selection
                                            setTimeout(() => setColorPickerOpen(false), 200);
                                          }}
                                          title={colorOption.name}
                                        >
                                          {(form.watch('color') === colorOption.color || selectedColor === colorOption.color) && (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4 text-primary-foreground" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                              <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )
                          }}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                          <FormField
                            control={form.control}
                            name="client_id"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Customer *</FormLabel>
                                <Select 
                                  onValueChange={(value) => {
                                    if (value === "new_client") {
                                      // Open the company dialog when "New Client" is selected
                                      setCompanyDialogOpen(true);
                                      // Don't update the field value yet
                                    } else {
                                      field.onChange(value);
                                    }
                                  }} 
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Select customer" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem 
                                      value="new_client" 
                                      className="text-primary border-b mb-1 pb-1 font-medium text-center justify-center"
                                    >
                                      + New Client
                                    </SelectItem>
                                    {customers.map((customer) => (
                                      <SelectItem key={customer.id} value={customer.id}>
                                        {customer.full_name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <div className="text-xs text-amber-500 mt-1">
                                  <strong>Note:</strong> Companies must be linked to user accounts to be valid project clients.
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="manager_id"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Person in Charge *</FormLabel>
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
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
                                    <SelectItem value="new">New</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="in-progress">In Progress</SelectItem>
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
                      </div>
                    )}

                    {/* Step 2: Event Details & Branding */}
                    {currentStep === 'event-details' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="event_type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Event Type / Brand *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select event type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="max-h-80 overflow-y-auto">
                                    <SelectItem value="roving">Roving</SelectItem>
                                    <SelectItem value="roadshow">Roadshow</SelectItem>
                                    <SelectItem value="in-store">In-store</SelectItem>
                                    <SelectItem value="ad-hoc">Ad-hoc</SelectItem>
                                    <SelectItem value="corporate">Corporate</SelectItem>
                                    <SelectItem value="wedding">Wedding</SelectItem>
                                    <SelectItem value="concert">Concert</SelectItem>
                                    <SelectItem value="conference">Conference</SelectItem>
                                    
                                    {/* Brand specific event types */}
                                    <SelectItem value="nestle">Nestle Choy Sun</SelectItem>
                                    <SelectItem value="ribena">Ribena</SelectItem>
                                    <SelectItem value="mytown">Mytown</SelectItem>
                                    <SelectItem value="warrior">Warrior</SelectItem>
                                    <SelectItem value="diy">DIY/MrDIY</SelectItem>
                                    <SelectItem value="blackmores">Blackmores</SelectItem>
                                    <SelectItem value="lapasar">Lapasar</SelectItem>
                                    <SelectItem value="spritzer">Spritzer</SelectItem>
                                    <SelectItem value="redoxon">Redoxon</SelectItem>
                                    <SelectItem value="double-mint">Double Mint</SelectItem>
                                    <SelectItem value="softlan">Softlan</SelectItem>
                                    <SelectItem value="colgate">Colgate</SelectItem>
                                    <SelectItem value="hsbc">HSBC</SelectItem>
                                    <SelectItem value="asw">ASW</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="logo_url"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Project Logo</FormLabel>
                                <FormControl>
                                  <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-3">
                                      <Input 
                                        {...field} 
                                        placeholder="Enter logo URL or upload a file" 
                                        className="flex-grow"
                                        onChange={(e) => {
                                          field.onChange(e.target.value);
                                          // Clear any uploaded file state when manually entering URL
                                          if (logoFile) {
                                            setLogoFile(null);
                                            setLogoPreview(null);
                                          }
                                        }}
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="whitespace-nowrap"
                                        onClick={() => {
                                          // Create a file input and trigger click
                                          const input = document.createElement('input');
                                          input.type = 'file';
                                          input.accept = 'image/*';
                                          input.onchange = (e) => {
                                            const files = (e.target as HTMLInputElement).files;
                                            if (files && files.length > 0) {
                                              handleLogoChange(files[0]);
                                            }
                                          };
                                          input.click();
                                        }}
                                      >
                                        Upload
                                      </Button>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                      {/* Show the logo preview if available */}
                                      {(logoPreview || field.value) && (
                                        <div className="h-16 w-16 rounded-md border flex items-center justify-center overflow-hidden bg-gray-50">
                                          <img 
                                            src={logoPreview || field.value} 
                                            alt="Logo preview" 
                                            className="max-h-full max-w-full object-contain"
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).src = 'https://placehold.co/40x40/EEE/999?text=Logo';
                                            }}
                                          />
                                        </div>
                                      )}
                                      
                                      {/* Show upload status or info */}
                                      {isUploading ? (
                                        <div className="text-sm text-muted-foreground flex items-center">
                                          <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                          <span>Uploading logo...</span>
                                        </div>
                                      ) : (logoFile || logoPreview) ? (
                                        <div className="text-sm text-muted-foreground">
                                          <p>{logoFile?.name}</p>
                                          <p className="text-xs">Logo will be uploaded when you create the project</p>
                                        </div>
                                      ) : null}
                                    </div>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="mt-4">
                          <FormField
                            control={form.control}
                            name="venue_address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Venue Address *</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                {field.value && (
                                  <div className="flex gap-2 mt-1">
                                    <a 
                                      href={getGoogleMapsLink(field.value)} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 inline-flex items-center"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-3 h-3 mr-1" fill="currentColor">
                                        <path d="M19.527 4.799c1.212 2.608.937 5.678-.405 8.173-1.101 2.047-2.744 3.74-4.098 5.614-.619.858-1.244 1.75-1.669 2.727-.141.325-.263.658-.383.992-.121.333-.224.673-.34 1.008-.109.314-.236.684-.627.687h-.007c-.466-.001-.579-.53-.695-.887-.284-.874-.581-1.713-1.019-2.525-.51-.944-1.145-1.817-1.79-2.671L19.527 4.799zM8.545 7.705l-3.959 4.707c.724 1.54 1.821 2.863 2.871 4.18.247.31.494.622.737.936l4.984-5.925-.029.01c-1.741.601-3.691-.291-4.392-1.987a3.377 3.377 0 0 1-.209-.716c-.063-.437-.077-.761-.004-1.198l.001-.007zM5.492 3.149l-.003.004c-1.947 2.466-2.281 5.88-1.117 8.77l4.785-5.689-.058-.05-3.607-3.035zM14.661.436l-3.838 4.563a.295.295 0 0 1 .027-.01c1.6-.551 3.403.15 4.22 1.626.176.319.323.683.377 1.045.068.446.085.773.012 1.22l-.003.016 3.836-4.561A8.382 8.382 0 0 0 14.67.439l-.009-.003z" />
                                      </svg>
                                      Google Maps
                                    </a>
                                    <a 
                                      href={getWazeLink(field.value)} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 inline-flex items-center"
                                    >
                                      <svg viewBox="0 0 24 24" className="w-3 h-3 mr-1" fill="currentColor">
                                        <path d="M20.54 6.63c0-2.35-1.21-4.57-3.21-5.96C15.34-0.7 12.66-0.7 10.67.67c-2 1.39-3.21 3.61-3.21 5.96 0 3.83 4.15 8.87 6.53 11.74l.14.18c.14.17.35.27.57.27.23 0 .44-.1.58-.27l.14-.18c2.39-2.87 6.53-7.91 6.53-11.74zm-4.86 0c0 1.3-1.06 2.36-2.36 2.36S10.97 7.93 10.97 6.63s1.06-2.36 2.36-2.36 2.35 1.06 2.35 2.36z" />
                                      </svg>
                                      Waze
                                    </a>
                                  </div>
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="mt-4">
                          <FormField
                            control={form.control}
                            name="venue_details"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Venue Details (Optional)</FormLabel>
                                <FormControl>
                                  <Textarea {...field} rows={3} placeholder="Additional venue information" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}

                    {/* Step 3: Project Schedule */}
                    {currentStep === 'schedule' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center mb-3">
                          <div className="text-sm text-muted-foreground">Schedule Type:</div>
                          <div className="flex space-x-2">
                            <Button 
                              type="button"
                              size="sm"
                              variant={scheduleType === 'single' ? 'default' : 'outline'}
                              onClick={() => setScheduleType('single')}
                            >
                              Single Period
                            </Button>
                            <Button 
                              type="button"
                              size="sm"
                              variant={scheduleType === 'recurring' ? 'default' : 'outline'}
                              onClick={() => setScheduleType('recurring')}
                            >
                              Recurring
                            </Button>
                            <Button 
                              type="button"
                              size="sm"
                              variant={scheduleType === 'multiple' ? 'default' : 'outline'}
                              onClick={() => setScheduleType('multiple')}
                            >
                              Multiple Locations
                            </Button>
                          </div>
                        </div>

                        {scheduleType === 'recurring' && (
                          <div className="space-y-4 border rounded-md p-4">
                            <div className="flex items-start mb-2">
                              <CalendarLucide className="w-5 h-5 text-primary mr-2 mt-0.5" />
                              <div>
                                <h4 className="font-medium">Recurring Schedule</h4>
                                <p className="text-sm text-muted-foreground">
                                  Set up a recurring schedule for this project
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label>Start Date *</Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className="w-full pl-3 text-left font-normal"
                                    >
                                      {form.watch('start_date') ? (
                                        format(form.watch('start_date'), "PPP")
                                      ) : (
                                        <span>Pick a date</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={form.watch('start_date')}
                                      onSelect={(date) => form.setValue('start_date', date as Date)}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>

                              <div>
                                <Label>End Date *</Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className="w-full pl-3 text-left font-normal"
                                    >
                                      {form.watch('end_date') ? (
                                        format(form.watch('end_date'), "PPP")
                                      ) : (
                                        <span>Pick a date</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={form.watch('end_date')}
                                      onSelect={(date) => form.setValue('end_date', date as Date)}
                                      disabled={(date) => date < form.getValues('start_date')}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </div>

                            <div className="mt-4">
                              <Label>Repeat Pattern</Label>
                              <Select 
                                defaultValue="weekly" 
                                onValueChange={(val: 'daily' | 'weekly' | 'biweekly' | 'monthly') => {
                                  const projectData = form.getValues();
                                  projectData.recurrence_pattern = val;
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select frequency" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="daily">Daily</SelectItem>
                                  <SelectItem value="weekly">Weekly</SelectItem>
                                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                                  <SelectItem value="monthly">Monthly</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="mt-4 grid grid-cols-7 gap-2">
                              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                                <div key={i} className="text-center">
                                  <Button 
                                    type="button" 
                                    size="sm" 
                                    variant={selectedDays.includes(i) ? "default" : "outline"} 
                                    className="w-10 h-10 rounded-full"
                                    onClick={() => {
                                      const newSelectedDays = selectedDays.includes(i)
                                        ? selectedDays.filter(d => d !== i)
                                        : [...selectedDays, i];
                                      
                                      setSelectedDays(newSelectedDays);
                                      
                                      // Update form state
                                      const projectData = form.getValues();
                                      projectData.recurrence_days = newSelectedDays;
                                    }}
                                  >
                                    {day}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {scheduleType === 'multiple' && (
                          <div className="space-y-4 border rounded-md p-4 max-h-[50vh] overflow-y-auto">
                            <div className="flex items-start mb-2">
                              <MapPin className="w-5 h-5 text-primary mr-2 mt-0.5" />
                              <div>
                                <h4 className="font-medium">Multiple Locations</h4>
                                <p className="text-sm text-muted-foreground">
                                  Set up the project at multiple venues
                                </p>
                              </div>
                            </div>

                            
                            {(()=> {
                              // These functions are defined inside the render function
                              // to avoid hook rule violations
                              
                              // Add a new empty location
                              const addLocation = () => {
                                setLocations([
                                  ...locations,
                                  {
                                    id: Date.now().toString(),
                                    address: '',
                                    date: '',
                                    isPrimary: false,
                                    notes: ''
                                  }
                                ]);
                              };

                              // Update a location
                              const updateLocation = (id: string, field: string, value: string | boolean) => {
                                setLocations(locations.map(loc => 
                                  loc.id === id ? { ...loc, [field]: value } : loc
                                ));
                                
                                // If setting a new primary, update all others to not be primary
                                if (field === 'isPrimary' && value === true) {
                                  setLocations(locations.map(loc => 
                                    loc.id === id ? { ...loc, isPrimary: true } : { ...loc, isPrimary: false }
                                  ));
                                }
                              };

                              // Remove a location
                              const removeLocation = (id: string) => {
                                // Don't remove if it's the only location or if it's the primary one
                                if (locations.length <= 1) return;
                                
                                const locToRemove = locations.find(loc => loc.id === id);
                                if (locToRemove?.isPrimary) {
                                  // Cannot remove primary location
                                  return;
                                }
                                
                                setLocations(locations.filter(loc => loc.id !== id));
                              };

                              return (
                                <>
                                  {locations.map((location, index) => (
                                    <div key={location.id} className="border rounded-md p-3 bg-background">
                                      <div className="flex justify-between items-center mb-2">
                                        <h5 className="font-medium text-sm">Location {index + 1}</h5>
                                        <div className="flex items-center gap-2">
                                          {location.isPrimary ? (
                                            <Badge variant="default">Primary</Badge>
                                          ) : (
                                            <Button 
                                              type="button" 
                                              variant="ghost" 
                                              size="sm"
                                              className="h-6"
                                              onClick={() => updateLocation(location.id, 'isPrimary', true)}
                                            >
                                              Set as Primary
                                            </Button>
                                          )}
                                          
                                          {!location.isPrimary && (
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="icon"
                                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                              onClick={() => removeLocation(location.id)}
                                            >
                                              <svg 
                                                xmlns="http://www.w3.org/2000/svg" 
                                                width="14" 
                                                height="14" 
                                                viewBox="0 0 24 24" 
                                                fill="none" 
                                                stroke="currentColor" 
                                                strokeWidth="2" 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round"
                                              >
                                                <path d="M18 6L6 18"></path>
                                                <path d="M6 6l12 12"></path>
                                              </svg>
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                      
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                          <Label className="text-xs">Address *</Label>
                                          <div className="space-y-1">
                                            <Input 
                                              placeholder="Enter venue address"
                                              value={location.address}
                                              onChange={(e) => updateLocation(location.id, 'address', e.target.value)}
                                            />
                                            {location.address && (
                                              <div className="flex gap-2">
                                                <a 
                                                  href={getGoogleMapsLink(location.address)} 
                                                  target="_blank" 
                                                  rel="noopener noreferrer"
                                                  className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 inline-flex items-center"
                                                  onClick={(e) => e.stopPropagation()}
                                                >
                                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-3 h-3 mr-1" fill="currentColor">
                                                    <path d="M19.527 4.799c1.212 2.608.937 5.678-.405 8.173-1.101 2.047-2.744 3.74-4.098 5.614-.619.858-1.244 1.75-1.669 2.727-.141.325-.263.658-.383.992-.121.333-.224.673-.34 1.008-.109.314-.236.684-.627.687h-.007c-.466-.001-.579-.53-.695-.887-.284-.874-.581-1.713-1.019-2.525-.51-.944-1.145-1.817-1.79-2.671L19.527 4.799zM8.545 7.705l-3.959 4.707c.724 1.54 1.821 2.863 2.871 4.18.247.31.494.622.737.936l4.984-5.925-.029.01c-1.741.601-3.691-.291-4.392-1.987a3.377 3.377 0 0 1-.209-.716c-.063-.437-.077-.761-.004-1.198l.001-.007zM5.492 3.149l-.003.004c-1.947 2.466-2.281 5.88-1.117 8.77l4.785-5.689-.058-.05-3.607-3.035zM14.661.436l-3.838 4.563a.295.295 0 0 1 .027-.01c1.6-.551 3.403.15 4.22 1.626.176.319.323.683.377 1.045.068.446.085.773.012 1.22l-.003.016 3.836-4.561A8.382 8.382 0 0 0 14.67.439l-.009-.003z" />
                                                  </svg>
                                                  Maps
                                                </a>
                                                <a 
                                                  href={getWazeLink(location.address)} 
                                                  target="_blank" 
                                                  rel="noopener noreferrer"
                                                  className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 inline-flex items-center"
                                                  onClick={(e) => e.stopPropagation()}
                                                >
                                                  <svg viewBox="0 0 24 24" className="w-3 h-3 mr-1" fill="currentColor">
                                                    <path d="M20.54 6.63c0-2.35-1.21-4.57-3.21-5.96C15.34-0.7 12.66-0.7 10.67.67c-2 1.39-3.21 3.61-3.21 5.96 0 3.83 4.15 8.87 6.53 11.74l.14.18c.14.17.35.27.57.27.23 0 .44-.1.58-.27l.14-.18c2.39-2.87 6.53-7.91 6.53-11.74zm-4.86 0c0 1.3-1.06 2.36-2.36 2.36S10.97 7.93 10.97 6.63s1.06-2.36 2.36-2.36 2.35 1.06 2.35 2.36z" />
                                                  </svg>
                                                  Waze
                                                </a>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <div>
                                          <Label className="text-xs">Date *</Label>
                                          <Input 
                                            type="date"
                                            value={location.date}
                                            onChange={(e) => updateLocation(location.id, 'date', e.target.value)}
                                          />
                                        </div>
                                      </div>
                                      
                                      <div className="mt-2">
                                        <Label className="text-xs">Notes (Optional)</Label>
                                        <Input 
                                          placeholder="Additional location details"
                                          value={location.notes || ''}
                                          onChange={(e) => updateLocation(location.id, 'notes', e.target.value)}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                  
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm"
                                    className="mt-2"
                                    onClick={addLocation}
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Another Location
                                  </Button>
                                </>
                              );
                            })()}
                          </div>
                        )}
                        
                        {/* Single Period Schedule (Default) */}
                        {scheduleType === 'single' && (<div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="start_date"
                              render={({ field }) => (
                                <FormItem>
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
                                <FormItem>
                                  <FormLabel>End Date (Optional)</FormLabel>
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
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="working_hours_start"
                              render={({ field }) => (
                                <FormItem>
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
                                <FormItem>
                                  <FormLabel>Working Hours End *</FormLabel>
                                  <FormControl>
                                    <Input type="time" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>)}
                       
                        {/* Add Schedule Period button and functionality */}
                        {scheduleType === 'recurring' && (
                          <div className="mt-4">
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm" 
                              className="w-full relative bg-muted/20 border-dashed border-muted-foreground/30"
                              onClick={() => {
                                // For recurring, toggle weekend days
                                const hasWeekends = selectedDays.includes(0) && selectedDays.includes(6);
                                
                                if (hasWeekends) {
                                  // Remove weekends
                                  setSelectedDays(selectedDays.filter(d => d !== 0 && d !== 6));
                                } else {
                                  // Add weekends
                                  setSelectedDays([...selectedDays, 0, 6]);
                                }
                                
                                toast({
                                  title: hasWeekends ? "Weekends Removed" : "Weekends Added",
                                  description: hasWeekends 
                                    ? "Removed weekend days from schedule" 
                                    : "Added weekend days to schedule",
                                });
                              }}
                            >
                              <Plus className="h-4 w-4 mr-1" /> 
                              Toggle Weekend Days
                            </Button>
                            <div className="flex justify-between text-xs text-muted-foreground mt-1 px-1">
                              <span>Quickly add or remove weekend days (Saturday and Sunday)</span>
                              <Badge variant="outline" className="text-[10px] h-4 font-normal">
                                Weekend
                              </Badge>
                            </div>
                          </div>
                        )}
                        
                        {scheduleType === 'multiple' && (
                          <div className="mt-4">
                            <Button 
                              type="button" 
                              variant="default" 
                              size="sm"
                              className="bg-primary/90 hover:bg-primary w-full"
                              onClick={() => {
                                // Close this dialog and open the tools page
                                onOpenChange(false);
      // logger.debug('[NewProjectDialog] onSubmit - Successfully created project and tasks (if any). Dialog closing.');
                                
                                // Create a new event that bubbles up to notify the parent components
                                // that we want to navigate to the extraction tool
                                const event = new CustomEvent('navigate', {
                                  bubbles: true,
                                  detail: { path: '/tools', tool: 'extraction' }
                                });
                                document.dispatchEvent(event);
                                
                                toast({
                                  title: "Opening Data Extraction Tool",
                                  description: "Import multiple locations from spreadsheets",
                                });
                              }}
                            >
                              <FileSpreadsheet className="h-4 w-4 mr-1" /> 
                              Import Locations from File/URL
                            </Button>
                            <div className="flex justify-between text-xs text-muted-foreground mt-1 px-1">
                              <span>Import multiple locations from spreadsheets</span>
                              <Badge variant="outline" className="text-[10px] h-4 font-normal">
                                Import
                              </Badge>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 4: Staffing */}
                    {currentStep === 'staffing' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center mb-4">
                          <div className="text-sm text-muted-foreground">Enable staffing for this project:</div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="staffing-toggle"
                              checked={needsStaffing}
                              onCheckedChange={(checked) => {
                                setNeedsStaffing(checked);
                                setIsSkipStaffing(!checked);
                              }}
                            />
                            <Label htmlFor="staffing-toggle">Needs Staffing</Label>
                          </div>
                        </div>
                        
                        {needsStaffing && (
                          <>
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
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <div className="border rounded-md p-3 bg-background mt-4">
                              <h4 className="text-sm font-medium mb-2 flex justify-between items-center">
                                <span>Crew Composition</span>
                                <Badge variant="outline" className="font-normal">
                                  Total: {staffTypes.reduce((sum, t) => sum + t.count, 0)}
                                </Badge>
                              </h4>
                              
                              <div className="space-y-3 text-sm">
                                <div className="overflow-hidden rounded-md border">
                                  <table className="w-full caption-bottom text-sm">
                                    <thead className="[&_tr]:border-b bg-muted/50">
                                      <tr className="border-b">
                                        <th className="h-9 px-3 text-left align-middle font-medium">Staff Type</th>
                                        <th className="h-9 px-2 text-center align-middle font-medium w-16">Count</th>
                                        <th className="h-9 px-2 text-center align-middle font-medium w-16">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="[&_tr:last-child]:border-0">
                                      {staffTypes.length === 0 ? (
                                        <tr>
                                          <td colSpan={3} className="p-3 text-center text-muted-foreground">
                                            No staff types added yet
                                          </td>
                                        </tr>
                                      ) : (
                                        staffTypes.map((staffType) => (
                                          <tr key={staffType.id} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-2 align-middle">
                                              {staffType.name}
                                            </td>
                                            <td className="p-1 align-middle text-center">
                                              <Input 
                                                type="number" 
                                                min={0} 
                                                className="w-14 h-8 text-center" 
                                                placeholder="0"
                                                value={staffType.count}
                                                onChange={(e) => {
                                                  const newCount = parseInt(e.target.value) || 0;
                                                  setStaffTypes(prev => 
                                                    prev.map(type => 
                                                      type.id === staffType.id 
                                                        ? { ...type, count: newCount }
                                                        : type
                                                    )
                                                  );
                                                  // Update crew count field with total
                                                  const total = staffTypes
                                                    .filter(t => t.id !== staffType.id)
                                                    .reduce((sum, t) => sum + t.count, 0) + newCount;
                                                  form.setValue('crew_count', total);
                                                }}
                                              />
                                            </td>
                                            <td className="p-1 align-middle text-center">
                                              <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-7 w-7 hover:bg-red-100 hover:text-red-600" 
                                                onClick={() => {
                                                  setStaffTypes(prev => prev.filter(t => t.id !== staffType.id))
                                                  // Recalculate total after removing
                                                  const total = staffTypes
                                                    .filter(t => t.id !== staffType.id)
                                                    .reduce((sum, t) => sum + t.count, 0);
                                                  form.setValue('crew_count', total);
                                                }}
                                              >
                                                <svg 
                                                  xmlns="http://www.w3.org/2000/svg" 
                                                  width="15" 
                                                  height="15" 
                                                  viewBox="0 0 24 24" 
                                                  fill="none" 
                                                  stroke="currentColor" 
                                                  strokeWidth="2" 
                                                  strokeLinecap="round" 
                                                  strokeLinejoin="round" 
                                                >
                                                  <path d="M3 6h18"></path>
                                                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                                </svg>
                                              </Button>
                                            </td>
                                          </tr>
                                        ))
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                                
                                <div className="flex gap-2 mt-3">
                                  <Input 
                                    type="text" 
                                    placeholder="New staff type..."
                                    className="flex-grow"
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                                        setStaffTypes([...staffTypes, {
                                          id: Date.now().toString(),
                                          name: (e.target as HTMLInputElement).value.trim(),
                                          count: 0
                                        }]);
                                        (e.target as HTMLInputElement).value = '';
                                      }
                                    }}
                                  />
                                  <Button 
                                    type="button"
                                    className="bg-primary hover:bg-primary/90"
                                    onClick={() => {
                                      const input = document.querySelector('input[placeholder="New staff type..."]') as HTMLInputElement;
                                      if (input?.value.trim()) {
                                        setStaffTypes([...staffTypes, {
                                          id: Date.now().toString(),
                                          name: input.value.trim(),
                                          count: 0
                                        }]);
                                        input.value = '';
                                      }
                                    }}
                                  >
                                    <Plus className="h-4 w-4 mr-1" /> Add
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                        
                        {!needsStaffing && (
                          <div className="text-sm text-muted-foreground p-2 bg-muted rounded-md">
                            <p className="mb-2">If this project doesn't require staffing, you can skip this step or toggle staffing on above.</p>
                            <p className="font-semibold">Click "Next" to continue to task creation.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 5: Task Creation */}
                    {currentStep === 'task-creation' && (
                      <div className="space-y-4">
                        {/* Show this when we have enough info to make suggestions */}
                        {formHasEnoughInfo && suggestedTasks.length === 0 && (
                          <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
                            <div className="flex items-center">
                              <Sparkles className="h-5 w-5 text-primary mr-2" />
                              <span>AI task suggestions available based on your project details</span>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleGetSuggestions}
                              disabled={isSuggestionsLoading}
                            >
                              {isSuggestionsLoading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Getting suggestions...
                                </>
                              ) : (
                                <>
                                  <Wand2 className="mr-2 h-4 w-4" />
                                  Get Suggestions
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                        
                        {/* Show suggestions if we have them */}
                        {suggestions.length > 0 && (
                          <div className="space-y-3">
                            <div className="max-h-60 overflow-y-auto border rounded-lg p-3 space-y-2">
                              {suggestions.map((suggestion, index) => (
                                <div key={index} className="flex items-start space-x-2 py-2 border-b last:border-b-0">
                                  <Checkbox
                                    id={`suggestion-${index}`}
                                    checked={selectedSuggestions.includes(index)}
                                    onCheckedChange={(checked) => {
                                      setSelectedSuggestions(prev => 
                                        checked 
                                          ? [...prev, index]
                                          : prev.filter(i => i !== index)
                                      );
                                    }}
                                  />
                                  <div className="flex-1">
                                    <label 
                                      htmlFor={`suggestion-${index}`}
                                      className="font-medium cursor-pointer"
                                    >
                                      {suggestion.title}
                                    </label>
                                    <div className="text-sm text-muted-foreground">{suggestion.description}</div>
                                    <div className="flex mt-1 space-x-2 text-xs">
                                      <Badge variant={suggestion.priority === 'high' ? 'destructive' : suggestion.priority === 'medium' ? 'default' : 'outline'}>
                                        {suggestion.priority}
                                      </Badge>
                                      <Badge variant="outline">
                                        Due: {suggestion.due_date_relative}
                                      </Badge>
                                      <Badge variant="secondary">
                                        Status: {suggestion.status}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">
                                {selectedSuggestions.length} of {suggestions.length} suggestions selected
                              </span>
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={handleAddSelectedSuggestions}
                                disabled={selectedSuggestions.length === 0}
                              >
                                Add Selected Tasks
                              </Button>
                            </div>
                          </div>
                        )}

                        {!formHasEnoughInfo && suggestedTasks.length === 0 && (
                          <div className="text-sm text-muted-foreground p-2 bg-muted rounded-md">
                            <p className="mb-2">Fill in project details to enable AI task suggestions. Each field provides more context for better task suggestions.</p>
                            <p>Missing info required for suggestions:</p>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                              {!form.getValues().title && <li>Project name</li>}
                              {!form.getValues().event_type && <li>Event type</li>}
                              {needsStaffing && (!form.getValues().crew_count || form.getValues().crew_count < 1) && <li>Crew count</li>}
                              {!form.getValues().venue_address && <li>Venue address</li>}
                            </ul>
                          </div>
                        )}

                        {/* Show message when tasks have been added */}
                        {suggestedTasks.length > 0 && (
                          <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium">{suggestedTasks.length} tasks will be added to this project</p>
                              <p className="text-sm">These tasks will be created automatically when you create the project</p>
                            </div>
                          </div>
                        )}

                        <div className="border-t pt-3 mt-3">
                          <h3 className="text-sm font-medium mb-2">Project Summary</h3>
                          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            <div>
                              <dt className="text-muted-foreground">Project Name:</dt>
                              <dd className="font-medium">{form.getValues().title || '(Not set)'}</dd>
                            </div>
                            <div>
                              <dt className="text-muted-foreground">Event Type:</dt>
                              <dd className="font-medium">{form.getValues().event_type || '(Not set)'}</dd>
                            </div>
                            <div>
                              <dt className="text-muted-foreground">Date:</dt>
                              <dd className="font-medium">
                                {form.getValues().start_date ? format(form.getValues().start_date, "MMM d, yyyy") : '(Not set)'}
                                {form.getValues().end_date ? ` - ${format(form.getValues().end_date, "MMM d, yyyy")}` : ''}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-muted-foreground">Venue:</dt>
                              <dd className="font-medium truncate">{form.getValues().venue_address || '(Not set)'}</dd>
                            </div>
                          </dl>
                        </div>
                      </div>
                    )}
                  
                    {/* Navigation Footer */}
                    <div className="border-t mt-8 pt-4 flex justify-between">
                      {currentStepIndex > 0 ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={prevStep}
                          className="flex items-center"
                        >
                          <ChevronLeft className="w-4 h-4 mr-1" />
                          Back
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => onOpenChange(false)}
                        >
                          Cancel
                        </Button>
                      )}

                      <div className="flex space-x-2">
                        {/* Optional Skip button */}
                        {currentStepIndex < steps.length - 1 && currentStep === 'staffing' && (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setIsSkipStaffing(true);
                              nextStep();
                            }}
                            className="text-muted-foreground"
                          >
                            Skip this step
                          </Button>
                        )}
                        
                        {currentStepIndex < steps.length - 1 ? (
                          <Button
                            type="button"
                            onClick={nextStep}
                            className="flex items-center"
                          >
                            Next
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        ) : (
                          <Button 
                            type="button" 
                            disabled={isLoading}
                            onClick={() => {
                              // Check basic required fields first
                              const values = form.getValues();
                              const missingFields = [];
                              
                              if (!values.title) missingFields.push("Project title");
                              if (!values.client_id) missingFields.push("Customer");
                              if (!values.manager_id) missingFields.push("Person in charge");
                              if (!values.venue_address) missingFields.push("Venue address");
                              
                              if (missingFields.length > 0) {
                                toast({
                                  title: "Missing required fields",
                                  description: `Please complete these fields: ${missingFields.join(", ")}`,
                                  variant: "destructive"
                                });
                                return;
                              }
                              
                              // Manually trigger form validation and submission
                              form.handleSubmit(onSubmit)();
                            }}
                            className="flex items-center bg-green-600 hover:bg-green-700"
                          >
                            {isLoading ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Create Project
                          </Button>
                        )}
                      </div>
                    </div>
                  </form>
                </Form>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Company dialog */}
      <NewCompanyDialog
        open={companyDialogOpen}
        onOpenChange={setCompanyDialogOpen}
        onCompanyAdded={() => {
          // Refresh the customers list when a new company is added
          loadCustomers();
          toast({
            title: "Company added",
            description: "New company has been added successfully",
          });
        }}
      />
    </>
  );
}