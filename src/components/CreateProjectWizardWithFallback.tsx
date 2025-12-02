import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '../lib/logger';
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
  WifiOff,
  RefreshCw,
  Zap
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { DateRangeManager, DateRange } from '@/components/DateRangeManager';
import { SpeedAddProjectDialog } from '@/components/SpeedAddProjectDialog';

// ============================================================================
// FALLBACK CONFIGURATION & TYPES
// ============================================================================

type Step =
  | 'project-info'
  | 'event-details'
  | 'location'
  | 'schedule'
  | 'staffing'
  | 'advanced'
  | 'review';

interface FallbackConfig {
  enableOfflineMode: boolean;
  enableAutoSave: boolean;
  enableMockData: boolean;
  retryAttempts: number;
  retryDelay: number;
  cacheTimeout: number;
}

interface CachedData<T> {
  data: T;
  timestamp: number;
  isStale: boolean;
}

// Default fallback configuration
const DEFAULT_FALLBACK_CONFIG: FallbackConfig = {
  enableOfflineMode: true,
  enableAutoSave: true,
  enableMockData: true,
  retryAttempts: 3,
  retryDelay: 1000,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
};

// ============================================================================
// MOCK DATA FALLBACKS
// ============================================================================

const MOCK_DATA = {
  customers: [
    { id: 'mock-1', name: 'Acme Corporation', logo: '🏢' },
    { id: 'mock-2', name: 'Global Events Ltd', logo: '🌍' },
    { id: 'mock-3', name: 'Creative Studios', logo: '🎨' },
  ],
  managers: [
    { id: 'current-user', name: 'Current User', email: 'user@example.com', avatar: '👤', isAvailable: true },
    { id: 'mock-mgr-1', name: 'Sarah Johnson', email: 'sarah@example.com', avatar: '👩', isAvailable: true },
    { id: 'mock-mgr-2', name: 'Mike Chen', email: 'mike@example.com', avatar: '👨', isAvailable: false },
  ],
  eventTypes: [
    { id: 'conference', label: 'Conference' },
    { id: 'exhibition', label: 'Exhibition' },
    { id: 'workshop', label: 'Workshop' },
    { id: 'seminar', label: 'Seminar' },
    { id: 'other', label: 'Other' },
  ],
  staffRoles: [
    { id: 'coordinator', label: 'Event Coordinator', defaultRate: 25 },
    { id: 'assistant', label: 'Assistant', defaultRate: 18 },
    { id: 'technician', label: 'Technical Support', defaultRate: 30 },
    { id: 'security', label: 'Security', defaultRate: 20 },
  ],
};

// ============================================================================
// LOCAL STORAGE UTILITIES
// ============================================================================

class LocalStorageManager {
  private prefix = 'project_wizard_';

  save(key: string, data: any): boolean {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
      return true;
    } catch (error) {
      logger.error('Failed to save to localStorage:', error);
      return false;
    }
  }

  load<T>(key: string, maxAge?: number): CachedData<T> | null {
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return null;

      const parsed = JSON.parse(item);
      const age = Date.now() - parsed.timestamp;
      const isStale = maxAge ? age > maxAge : false;

      return {
        data: parsed.data,
        timestamp: parsed.timestamp,
        isStale,
      };
    } catch (error) {
      logger.error('Failed to load from localStorage:', error);
      return null;
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      logger.error('Failed to remove from localStorage:', error);
    }
  }

  clear(): void {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith(this.prefix))
        .forEach(key => localStorage.removeItem(key));
    } catch (error) {
      logger.error('Failed to clear localStorage:', error);
    }
  }
}

// ============================================================================
// ERROR BOUNDARY COMPONENT
// ============================================================================

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ProjectWizardErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Project Wizard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Alert className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Something went wrong with the project wizard. Please refresh and try again.
            {this.state.error?.message && (
              <div className="mt-2 text-sm text-gray-500">
                Error: {this.state.error.message}
              </div>
            )}
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// DATA FETCHING WITH FALLBACKS
// ============================================================================

class DataFetcher {
  private storage = new LocalStorageManager();
  private config: FallbackConfig;
  private isOnline = navigator.onLine;

  constructor(config: FallbackConfig = DEFAULT_FALLBACK_CONFIG) {
    this.config = config;

    // Monitor online status
    window.addEventListener('online', () => this.isOnline = true);
    window.addEventListener('offline', () => this.isOnline = false);
  }

  async fetchWithFallback<T>(
    fetcher: () => Promise<T>,
    cacheKey: string,
    mockData?: T
  ): Promise<{ data: T; source: 'fresh' | 'cache' | 'mock'; error?: Error }> {
    // Try to fetch fresh data
    if (this.isOnline) {
      try {
        const data = await this.retryOperation(fetcher);
        // Cache successful response
        this.storage.save(cacheKey, data);
        return { data, source: 'fresh' };
      } catch (error) {
        logger.error(`Failed to fetch ${cacheKey}:`, error);
      }
    }

    // Try cache
    const cached = this.storage.load<T>(cacheKey, this.config.cacheTimeout);
    if (cached && !cached.isStale) {
      return { data: cached.data, source: 'cache' };
    }

    // Use stale cache if available
    if (cached && cached.isStale) {
      // Try to refresh in background
      if (this.isOnline) {
        this.retryOperation(fetcher)
          .then(data => this.storage.save(cacheKey, data))
          .catch(() => {}); // Silent fail for background refresh
      }
      return { data: cached.data, source: 'cache' };
    }

    // Fall back to mock data
    if (mockData && this.config.enableMockData) {
      return { data: mockData, source: 'mock' };
    }

    throw new Error(`No data available for ${cacheKey}`);
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    attempts = this.config.retryAttempts
  ): Promise<T> {
    for (let i = 0; i < attempts; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === attempts - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * (i + 1)));
      }
    }
    throw new Error('Max retry attempts reached');
  }
}

// ============================================================================
// FORM SCHEMA
// ============================================================================

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
  }).optional(),
  end_date: z.date().optional(),
  working_hours_start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').optional(),
  working_hours_end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').optional(),
  schedule_type: z.string().optional().default('single'),
  date_ranges: z.array(z.object({
    id: z.string(),
    startDate: z.date(),
    endDate: z.date(),
    locationId: z.string().optional(),
  })).optional().default([]),

  // Staffing
  crew_count: z.number().min(1, 'At least one staff member is required'),
  hourly_rate: z.number().min(0, 'Hourly rate must be positive'),

  // Advanced
  color: z.string().optional().default('#3B82F6'),
  status: z.string().optional().default('upcoming'),
  priority: z.string().optional().default('medium'),
  enable_applications: z.boolean().optional().default(false),
  is_recurring: z.boolean().optional().default(false),
});

type ProjectFormData = z.infer<typeof projectSchema>;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface CreateProjectWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (project: any) => void;
  onError?: (error: Error) => void;
  fallbackConfig?: Partial<FallbackConfig>;
}

export function CreateProjectWizardWithFallback({
  open,
  onOpenChange,
  onSuccess,
  onError,
  fallbackConfig,
}: CreateProjectWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>('project-info');
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [dataSource, setDataSource] = useState<'fresh' | 'cache' | 'mock'>('fresh');
  const [speedAddOpen, setSpeedAddOpen] = useState(false);

  // Data states
  const [customers, setCustomers] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [eventTypes] = useState(MOCK_DATA.eventTypes);

  const { toast } = useToast();
  const storage = new LocalStorageManager();
  const dataFetcher = new DataFetcher({ ...DEFAULT_FALLBACK_CONFIG, ...fallbackConfig });
  const autoSaveTimer = useRef<NodeJS.Timeout>();

  const steps: { id: Step; label: string; icon: React.ElementType }[] = [
    { id: 'project-info', label: 'Project Information', icon: FileText },
    { id: 'event-details', label: 'Event Details', icon: Palette },
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'schedule', label: 'Schedule', icon: Clock },
    { id: 'staffing', label: 'Staffing', icon: Users },
    { id: 'advanced', label: 'Advanced Settings', icon: Cog },
    { id: 'review', label: 'Review & Create', icon: Share2 },
  ];

  const form = useForm<ProjectFormData>({
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
      working_hours_start: '09:00',
      working_hours_end: '17:00',
      schedule_type: 'single',
      date_ranges: [],
      crew_count: 1,
      hourly_rate: 20,
      color: '#3B82F6',
      status: 'upcoming',
      priority: 'medium',
      enable_applications: false,
      is_recurring: false,
    },
  });

  // ============================================================================
  // EFFECTS & LIFECYCLE
  // ============================================================================

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      toast({
        title: "Back online",
        description: "Connection restored. Syncing data...",
      });
      loadData();
    };

    const handleOffline = () => {
      setIsOffline(true);
      toast({
        title: "Working offline",
        description: "Changes will be saved locally and synced when connection is restored.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (open) {
      loadData();
      loadDraft();
    }
  }, [open]);

  useEffect(() => {
    // Auto-save draft
    if (fallbackConfig?.enableAutoSave !== false) {
      clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        saveDraft();
      }, 2000); // Save after 2 seconds of inactivity
    }

    return () => clearTimeout(autoSaveTimer.current);
  }, [form.watch()]);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadData = async () => {
    setIsLoading(true);

    try {
      // Load customers
      const customersResult = await dataFetcher.fetchWithFallback(
        async () => {
          const { data, error } = await supabase
            .from('companies')
            .select('*')
            .order('name');
          if (error) throw error;
          return data;
        },
        'customers',
        MOCK_DATA.customers
      );
      setCustomers(customersResult.data);

      // Load managers
      const managersResult = await dataFetcher.fetchWithFallback(
        async () => {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('name');
          if (error) throw error;
          return data;
        },
        'managers',
        MOCK_DATA.managers
      );
      setManagers(managersResult.data);

      // Update data source indicator
      setDataSource(customersResult.source);

      // Auto-select current user as manager if available
      const currentUser = managersResult.data.find(m => m.id === 'current-user');
      if (currentUser && !form.getValues('manager_id')) {
        form.setValue('manager_id', currentUser.id);
      }

    } catch (error) {
      logger.error('Failed to load data:', error);
      toast({
        title: "Data loading failed",
        description: "Using cached or default data. Some features may be limited.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // DRAFT MANAGEMENT
  // ============================================================================

  const saveDraft = () => {
    const formData = form.getValues();
    const saved = storage.save('draft', {
      ...formData,
      currentStep,
    });

    if (saved) {
      logger.info('Draft saved');
    }
  };

  const loadDraft = () => {
    const draft = storage.load<any>('draft');
    if (draft && !draft.isStale) {
      const { currentStep: savedStep, ...formData } = draft.data;

      // Restore form data
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          form.setValue(key as any, value);
        }
      });

      // Restore step
      if (savedStep) {
        setCurrentStep(savedStep);
      }

      toast({
        title: "Draft restored",
        description: "Your previous progress has been loaded.",
      });
    }
  };

  const clearDraft = () => {
    storage.remove('draft');
  };

  // ============================================================================
  // SPEED ADD HANDLER
  // ============================================================================

  const handleSpeedAddData = (extractedData: any) => {
    // Pre-fill form with extracted data
    if (extractedData.title) form.setValue('title', extractedData.title);
    if (extractedData.event_type) form.setValue('event_type', extractedData.event_type);
    if (extractedData.description) form.setValue('description', extractedData.description);
    if (extractedData.venue_address) form.setValue('venue_address', extractedData.venue_address);
    if (extractedData.venue_details) form.setValue('venue_details', extractedData.venue_details);
    if (extractedData.start_date) form.setValue('start_date', extractedData.start_date);
    if (extractedData.end_date) form.setValue('end_date', extractedData.end_date);
    if (extractedData.working_hours_start) form.setValue('working_hours_start', extractedData.working_hours_start);
    if (extractedData.working_hours_end) form.setValue('working_hours_end', extractedData.working_hours_end);
    if (extractedData.crew_count) form.setValue('crew_count', extractedData.crew_count);
    if (extractedData.hourly_rate) form.setValue('hourly_rate', extractedData.hourly_rate);

    toast({
      title: "Data Loaded",
      description: "Project information has been pre-filled. Please review and complete any missing fields.",
    });
  };

  // ============================================================================
  // FORM SUBMISSION
  // ============================================================================

  const handleSubmit = async (data: ProjectFormData) => {
    setIsLoading(true);

    try {
      if (!navigator.onLine && fallbackConfig?.enableOfflineMode !== false) {
        // Save for later sync
        const offlineQueue = storage.load<any[]>('offline_queue')?.data || [];
        offlineQueue.push({
          type: 'create_project',
          data,
          timestamp: Date.now(),
        });
        storage.save('offline_queue', offlineQueue);

        toast({
          title: "Saved offline",
          description: "Project will be created when connection is restored.",
        });

        clearDraft();
        onOpenChange(false);
        onSuccess?.({ ...data, id: 'offline-' + Date.now() });
        return;
      }

      // Try to create project directly in database
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // Prepare project data (remove date_ranges from main insert)
      const { date_ranges, ...projectFormData } = data;

      const projectData: any = {
        ...projectFormData,
        filled_positions: 0,
        completion_percentage: 0,
        payment_status: 'pending',
        user_id: user.user.id,
      };

      // For single-schedule mode: include start_date/end_date/working_hours in main project
      if (data.schedule_type === 'single') {
        projectData.start_date = data.start_date ? format(data.start_date, 'yyyy-MM-dd') : null;
        projectData.end_date = data.end_date ? format(data.end_date, 'yyyy-MM-dd') : null;
      } else {
        // For multi-schedule: set first date range as main project dates for backward compat
        if (date_ranges && date_ranges.length > 0) {
          projectData.start_date = format(date_ranges[0].startDate, 'yyyy-MM-dd');
          projectData.end_date = format(date_ranges[0].endDate, 'yyyy-MM-dd');
        }
      }

      // Create project
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert([projectData])
        .select()
        .single();

      if (projectError) throw projectError;

      // For multi-schedule: create project_schedules entries
      if (data.schedule_type === 'multi' && date_ranges && date_ranges.length > 0) {
        const schedules = date_ranges.map(range => ({
          project_id: newProject.id,
          start_date: format(range.startDate, 'yyyy-MM-dd HH:mm:ssX'),
          end_date: format(range.endDate, 'yyyy-MM-dd HH:mm:ssX'),
          working_hours_start: data.working_hours_start || '09:00',
          working_hours_end: data.working_hours_end || '17:00',
          daily_rate: data.hourly_rate ? data.hourly_rate * 8 : null, // Convert hourly to daily (8h)
          is_active: true,
        }));

        const { error: schedulesError } = await supabase
          .from('project_schedules')
          .insert(schedules);

        if (schedulesError) {
          logger.error('Failed to create schedules:', schedulesError);
          // Don't throw - project is created, just warn user
          toast({
            title: "Warning",
            description: "Project created but some schedules may not have saved correctly. Please edit the project to fix.",
            variant: "destructive",
          });
        }
      }

      toast({
        title: "Success",
        description: data.schedule_type === 'multi'
          ? `Multi-schedule project created with ${date_ranges?.length || 0} date ranges`
          : "Project created successfully",
      });

      clearDraft();
      onOpenChange(false);
      onSuccess?.(newProject);

    } catch (error: any) {
      logger.error('Failed to create project:', error);

      // Try fallback creation method if available
      if (fallbackConfig?.enableOfflineMode !== false) {
        handleSubmit(data); // Retry with offline mode
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to create project",
          variant: "destructive",
        });
        onError?.(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const goToStep = (step: Step) => {
    // Validate current step before moving
    const fieldsToValidate = getStepFields(currentStep);
    const isValid = fieldsToValidate.every(field =>
      !form.formState.errors[field as keyof ProjectFormData]
    );

    if (!isValid && steps.findIndex(s => s.id === step) > currentStepIndex) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before proceeding",
        variant: "destructive",
      });
      return;
    }

    setCurrentStep(step);
  };

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      goToStep(steps[currentStepIndex + 1].id);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      goToStep(steps[currentStepIndex - 1].id);
    }
  };

  const getStepFields = (step: Step): string[] => {
    switch (step) {
      case 'project-info':
        return ['title', 'client_id', 'manager_id'];
      case 'event-details':
        return ['event_type'];
      case 'location':
        return ['venue_address'];
      case 'schedule':
        return ['start_date', 'working_hours_start', 'working_hours_end'];
      case 'staffing':
        return ['crew_count', 'hourly_rate'];
      default:
        return [];
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <ProjectWizardErrorBoundary>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0">
          <div className="flex h-full">
            {/* Sidebar Navigation */}
            <div className="w-72 bg-gray-50 p-6 border-r">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Create Project</h2>
                  <p className="text-sm text-gray-600">
                    Complete all steps to set up your new project
                  </p>
                </div>

                {/* Speed Add Button */}
                <Button
                  onClick={() => setSpeedAddOpen(true)}
                  variant="outline"
                  className="w-full border-2 border-dashed border-yellow-400 hover:border-yellow-500 hover:bg-yellow-50"
                  size="sm"
                >
                  <Zap className="mr-2 h-4 w-4 text-yellow-500" />
                  Speed Add from Job Ad
                </Button>

                {/* Connection Status */}
                {(isOffline || dataSource !== 'fresh') && (
                  <Alert className="py-2">
                    <WifiOff className="h-3 w-3" />
                    <AlertDescription className="text-xs">
                      {isOffline ? 'Working offline' : `Using ${dataSource} data`}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Steps */}
                <nav className="space-y-2">
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = step.id === currentStep;
                    const isCompleted = index < currentStepIndex;
                    const isClickable = isCompleted || index <= currentStepIndex;

                    return (
                      <button
                        key={step.id}
                        onClick={() => isClickable && goToStep(step.id)}
                        disabled={!isClickable}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg transition-all",
                          isActive && "bg-blue-50 border-blue-200 border",
                          !isActive && isClickable && "hover:bg-gray-100",
                          !isClickable && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                          isCompleted && "bg-green-500 text-white",
                          isActive && !isCompleted && "bg-blue-500 text-white",
                          !isActive && !isCompleted && "bg-gray-300 text-gray-600"
                        )}>
                          {isCompleted ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <span>{index + 1}</span>
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <div className={cn(
                            "font-medium text-sm",
                            isActive && "text-blue-600",
                            !isActive && "text-gray-700"
                          )}>
                            {step.label}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </nav>

                {/* Progress */}
                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>{currentStepIndex + 1} / {steps.length}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
              {/* Header */}
              <div className="px-8 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {React.createElement(
                      steps.find(s => s.id === currentStep)?.icon || FileText,
                      { className: "w-5 h-5 text-blue-600" }
                    )}
                    <div>
                      <h3 className="text-lg font-semibold">
                        {steps.find(s => s.id === currentStep)?.label}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {currentStep === 'project-info' && 'Basic details about your project'}
                        {currentStep === 'event-details' && 'Specify the type and nature of your event'}
                        {currentStep === 'location' && 'Where will the project take place'}
                        {currentStep === 'schedule' && 'Set dates and working hours'}
                        {currentStep === 'staffing' && 'Define staffing requirements'}
                        {currentStep === 'advanced' && 'Configure additional options'}
                        {currentStep === 'review' && 'Review all details before creating'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={saveDraft}
                    >
                      Save Draft
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onOpenChange(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <div className="flex-1 overflow-y-auto px-8 py-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        {/* Step Content - Simplified for brevity */}
                        {currentStep === 'project-info' && (
                          <div className="space-y-6">
                            <FormField
                              control={form.control}
                              name="title"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Project Name *</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Input
                                        {...field}
                                        placeholder="e.g., Annual Company Conference 2024"
                                        className="pr-16"
                                      />
                                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                                        {field.value?.length || 0}/100
                                      </span>
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="client_id"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Customer *</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select a customer" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {customers.map((customer) => (
                                        <SelectItem key={customer.id} value={customer.id}>
                                          <div className="flex items-center gap-2">
                                            <span>{customer.logo}</span>
                                            <span>{customer.name}</span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                      <SelectItem value="new">
                                        <div className="flex items-center gap-2 text-blue-600">
                                          <span>+</span>
                                          <span>Add New Customer</span>
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
                              name="manager_id"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Person in Charge *</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select a manager" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {managers.map((manager) => (
                                        <SelectItem key={manager.id} value={manager.id}>
                                          <div className="flex items-center gap-2">
                                            <span>{manager.avatar}</span>
                                            <div>
                                              <div>{manager.name}</div>
                                              <div className="text-xs text-gray-500">{manager.email}</div>
                                            </div>
                                            {manager.isAvailable === false && (
                                              <span className="ml-auto text-xs text-orange-600">Busy</span>
                                            )}
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
                        )}

                        {/* Schedule Step */}
                        {currentStep === 'schedule' && (
                          <div className="space-y-6">
                            {/* Schedule Type Toggle */}
                            <FormField
                              control={form.control}
                              name="schedule_type"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Schedule Type *</FormLabel>
                                  <div className="grid grid-cols-2 gap-4">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        field.onChange('single');
                                        form.setValue('date_ranges', []);
                                      }}
                                      className={cn(
                                        "p-4 border-2 rounded-lg transition-all text-left",
                                        field.value === 'single'
                                          ? "border-blue-500 bg-blue-50"
                                          : "border-gray-200 hover:border-gray-300"
                                      )}
                                    >
                                      <div className="font-medium mb-1">Single Day/Range</div>
                                      <div className="text-xs text-gray-600">
                                        Project at one location on one day or consecutive days
                                      </div>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        field.onChange('multi');
                                        // Initialize with one date range if empty
                                        if (form.getValues('date_ranges')?.length === 0) {
                                          form.setValue('date_ranges', [{
                                            id: `range-${Date.now()}`,
                                            startDate: new Date(),
                                            endDate: new Date(),
                                          }]);
                                        }
                                      }}
                                      className={cn(
                                        "p-4 border-2 rounded-lg transition-all text-left",
                                        field.value === 'multi'
                                          ? "border-blue-500 bg-blue-50"
                                          : "border-gray-200 hover:border-gray-300"
                                      )}
                                    >
                                      <div className="font-medium mb-1">Multi-Schedule</div>
                                      <div className="text-xs text-gray-600">
                                        Project across multiple days, locations, or non-consecutive dates
                                      </div>
                                    </button>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Single Schedule Mode */}
                            {form.watch('schedule_type') === 'single' && (
                              <>
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
                                                  "w-full justify-start text-left font-normal",
                                                  !field.value && "text-gray-400"
                                                )}
                                              >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                              </Button>
                                            </FormControl>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-auto p-0">
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
                                                  "w-full justify-start text-left font-normal",
                                                  !field.value && "text-gray-400"
                                                )}
                                              >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                              </Button>
                                            </FormControl>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-auto p-0">
                                            <Calendar
                                              mode="single"
                                              selected={field.value}
                                              onSelect={field.onChange}
                                              disabled={(date) =>
                                                form.watch('start_date') ? date < form.watch('start_date') : false
                                              }
                                              initialFocus
                                            />
                                          </PopoverContent>
                                        </Popover>
                                        <p className="text-xs text-gray-500 mt-1">
                                          Leave empty for single-day event
                                        </p>
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
                                        <FormLabel>Start Time *</FormLabel>
                                        <FormControl>
                                          <Input
                                            type="time"
                                            {...field}
                                            placeholder="09:00"
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
                                        <FormLabel>End Time *</FormLabel>
                                        <FormControl>
                                          <Input
                                            type="time"
                                            {...field}
                                            placeholder="17:00"
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              </>
                            )}

                            {/* Multi-Schedule Mode */}
                            {form.watch('schedule_type') === 'multi' && (
                              <FormField
                                control={form.control}
                                name="date_ranges"
                                render={({ field }) => (
                                  <FormItem>
                                    <DateRangeManager
                                      dateRanges={field.value || []}
                                      onChange={field.onChange}
                                    />
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}

                            {/* Schedule Summary Info */}
                            {form.watch('schedule_type') === 'single' && form.watch('start_date') && (
                              <Alert>
                                <Info className="h-4 w-4" />
                                <AlertDescription>
                                  {form.watch('end_date')
                                    ? `${Math.ceil((form.watch('end_date')!.getTime() - form.watch('start_date')!.getTime()) / (1000 * 60 * 60 * 24)) + 1} days scheduled`
                                    : 'Single-day event'}
                                  {form.watch('working_hours_start') && form.watch('working_hours_end') && (
                                    <> • Working hours: {form.watch('working_hours_start')} - {form.watch('working_hours_end')}</>
                                  )}
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                        )}

                        {/* Add other step contents here... */}
                        {currentStep === 'review' && (
                          <div className="space-y-6">
                            <Alert>
                              <Info className="h-4 w-4" />
                              <AlertDescription>
                                Please review all the details before creating the project.
                                {isOffline && " Note: You're currently offline. The project will be synced when connection is restored."}
                              </AlertDescription>
                            </Alert>

                            {/* Summary of all form data */}
                            <div className="space-y-4">
                              <div className="p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-medium mb-2">Project Summary</h4>
                                <dl className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <dt className="text-gray-600">Name:</dt>
                                    <dd className="font-medium">{form.watch('title') || 'Not set'}</dd>
                                  </div>
                                  <div className="flex justify-between">
                                    <dt className="text-gray-600">Customer:</dt>
                                    <dd className="font-medium">
                                      {customers.find(c => c.id === form.watch('client_id'))?.name || 'Not set'}
                                    </dd>
                                  </div>
                                  <div className="flex justify-between">
                                    <dt className="text-gray-600">Manager:</dt>
                                    <dd className="font-medium">
                                      {managers.find(m => m.id === form.watch('manager_id'))?.name || 'Not set'}
                                    </dd>
                                  </div>
                                </dl>
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </form>
                </Form>
              </div>

              {/* Footer Actions */}
              <div className="px-8 py-4 border-t bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={saveDraft}
                    >
                      Save Draft
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 mr-2">
                      Alt+← Previous • Alt+→ Next
                    </span>
                    <Button
                      variant="outline"
                      onClick={prevStep}
                      disabled={currentStepIndex === 0}
                    >
                      Previous
                    </Button>
                    {currentStep === 'review' ? (
                      <Button
                        onClick={form.handleSubmit(handleSubmit)}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          'Create Project'
                        )}
                      </Button>
                    ) : (
                      <Button onClick={nextStep}>
                        Next
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Speed Add Dialog */}
      <SpeedAddProjectDialog
        open={speedAddOpen}
        onOpenChange={setSpeedAddOpen}
        onDataExtracted={handleSpeedAddData}
      />
    </ProjectWizardErrorBoundary>
  );
}