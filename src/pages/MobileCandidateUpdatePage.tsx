import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { RainbowButton } from '@/components/ui/rainbow-button';
import { TextAnimate } from '@/components/ui/text-animate';
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text';
import { SparklesText } from '@/components/ui/sparkles-text';
import { MagicCard } from '@/components/ui/magic-card';
import { ShineButton } from '@/components/ui/shine-border';
import { 
  UserPlus, 
  AlertCircle, 
  LockKeyhole, 
  UserCheck, 
  Shield, 
  Clock, 
  Ban, 
  Camera,
  Upload,
  CheckCircle,
  Sparkles,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Users,
  User,
  ChevronRight,
  Check,
  CheckCircle2,
  Info as InfoCircle,
  Loader2,
  Building2,
  CreditCard,
  FileText,
  Briefcase,
  Plus,
  X,
  GraduationCap,
  Car
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as SelectPrimitive from '@radix-ui/react-select';
import { CheckIcon, CaretSortIcon } from '@radix-ui/react-icons';
import { Textarea } from '@/components/ui/textarea';
import { PublicPageWrapper } from '@/components/PublicPageWrapper';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { BorderBeam } from '@/components/ui/border-beam';
import { ShineBorder } from '@/components/ui/shine-border';
import { NeonGradientCard } from '@/components/ui/neon-gradient-card';
import { AnimatedList } from '@/components/ui/animated-list';
import { Meteors } from '@/components/ui/meteors';
import { Particles } from '@/components/ui/particles';
import { DotPattern } from '@/components/ui/dot-pattern';

// Bank codes for DuitNow
// Custom centered select components
const CenteredSelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex h-8 w-full items-center justify-between relative whitespace-nowrap rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  >
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <span className="text-center">{children}</span>
    </div>
    <div className="flex-1" />
    <SelectPrimitive.Icon asChild>
      <CaretSortIcon className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
CenteredSelectTrigger.displayName = 'CenteredSelectTrigger';

const CenteredSelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-default select-none items-center justify-center rounded-sm py-1.5 px-8 text-xs outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  >
    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <CheckIcon className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
CenteredSelectItem.displayName = 'CenteredSelectItem';

const BANK_OPTIONS = [
  { value: 'MBB0228', label: 'Maybank' },
  { value: 'BCBB0235', label: 'CIMB Bank' },
  { value: 'PBB0233', label: 'Public Bank' },
  { value: 'RHBB0218', label: 'RHB Bank' },
  { value: 'BIMB0340', label: 'Bank Islam' },
  { value: 'HLB0224', label: 'Hong Leong Bank' },
  { value: 'BKRM0602', label: 'Bank Rakyat' },
  { value: 'AMBB0209', label: 'AmBank' },
  { value: 'MFBB0228', label: 'Alliance Bank' },
  { value: 'HSBC0223', label: 'HSBC Bank' },
  { value: 'OCBC0229', label: 'OCBC Bank' },
  { value: 'SCB0216', label: 'Standard Chartered' },
  { value: 'UOB0226', label: 'UOB Bank' },
  { value: 'BMMB0341', label: 'Bank Muamalat' },
  { value: 'AFFIN0224', label: 'Affin Bank' },
  { value: 'CITI0219', label: 'Citibank' },
];


// Helper function to normalize database values to match dropdown options
const normalizeDropdownValue = (value: string | null | undefined, type: string): string => {
  if (!value) return '';
  
  const normalized = value.toLowerCase().trim();
  
  // Map database values to dropdown values
  const mappings: Record<string, Record<string, string>> = {
    race: {
      'malay': 'malay',
      'chinese': 'chinese',
      'indian': 'indian',
      'others': 'others',
      'other': 'others'
    },
    education: {
      'primary': 'primary',
      'primary school': 'primary',
      'secondary': 'secondary',
      'secondary school': 'secondary',
      'diploma': 'diploma',
      'degree': 'degree',
      "bachelor's degree": 'degree',
      'bachelor degree': 'degree',
      'master': 'master',
      "master's degree": 'master',
      'master degree': 'master',
      'phd': 'phd',
      'other': 'other'
    },
    relationship: {
      'parent': 'parent',
      'spouse': 'spouse',
      'sibling': 'sibling',
      'friend': 'friend',
      'relative': 'relative',
      'other': 'other'
    }
  };
  
  return mappings[type]?.[normalized] || normalized;
};

export default function MobileCandidateUpdatePage() {
  const { candidateId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const secureToken = searchParams.get('secure_token');
  
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<any>({
    ic_number: '',
    race: ''
  });
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [fullBodyPhoto, setFullBodyPhoto] = useState<string | null>(null);
  const [halfBodyPhoto, setHalfBodyPhoto] = useState<string | null>(null);
  const fullBodyInputRef = useRef<HTMLInputElement>(null);
  const halfBodyInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [showPDPADialog, setShowPDPADialog] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [idFieldEdited, setIdFieldEdited] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  
  const { toast } = useToast();
  
  // Import security services
  const [authError, setAuthError] = useState('');
  const [icAttempts, setIcAttempts] = useState(0);
  const [showIcVerification, setShowIcVerification] = useState(false);
  const [icInput, setIcInput] = useState('');
  const [tokenValid, setTokenValid] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const attemptCount = useRef(0);
  
  // Validate secure token on mount
  useEffect(() => {
    if (!secureToken || !candidateId) {
      setError('Invalid access link');
      setLoading(false);
      return;
    }
    
    validateToken();
  }, [secureToken, candidateId]);
  
  // Debug: Monitor formData changes
  useEffect(() => {
    console.log('FormData updated:', {
      race: formData.race,
      shirt_size: formData.shirt_size,
      emergency_contact_relationship: formData.emergency_contact_relationship,
      highest_education: formData.highest_education
    });
  }, [formData.race, formData.shirt_size, formData.emergency_contact_relationship, formData.highest_education]);
  
  // Debug: Log when component renders
  useEffect(() => {
    console.log('Component rendered. isAuthenticated:', isAuthenticated, 'formData.race:', formData.race);
  });
  
  // Workaround for Radix UI Select not updating properly
  useEffect(() => {
    if (isAuthenticated && formData.race) {
      console.log('Race value exists, forcing update');
      // Force the Select components to recognize the new value
      const timer = setTimeout(() => {
        setFormData(prev => ({ ...prev }));
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);
  
  const validateToken = async () => {
    if (!secureToken || !candidateId) return;
    
    try {
      setLoading(true);
      setAuthError('');
      
      const userAgent = navigator.userAgent;
      
      // Validate token using the secure function
      const { data, error } = await supabase
        .rpc('validate_candidate_token_secure', {
          p_token: secureToken,
          p_candidate_id: candidateId,
          p_ic_number: '', // Will validate IC later
          p_ip_address: null,
          p_user_agent: userAgent
        });
      
      if (error) {
        console.error('Token validation error:', error);
        setError('Invalid or expired link');
        setLoading(false);
        return;
      }
      
      const validationResult = data?.[0];
      
      if (!validationResult?.valid) {
        setError(validationResult?.reason || 'Invalid or expired link');
        setLoading(false);
        return;
      }
      
      // Token is valid, store candidate data but don't show form yet
      setTokenValid(true);
      // Store candidate data from validation
      const candidateData = validationResult.candidate_data;
      setCandidate({
        id: candidateId,
        ic_number: candidateData?.ic_number,
        full_name: candidateData?.full_name
      });
      setLoading(false);
    } catch (error) {
      console.error('Error validating token:', error);
      setError('Failed to validate access');
      setLoading(false);
    }
  };
  
  const fetchCandidateData = async () => {
    try {
      // Fetch candidate data
      const { data: candidateData, error: candidateError } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', candidateId)
        .single();

      if (candidateError || !candidateData) {
        setError('Failed to load candidate data');
        setLoading(false);
        return;
      }

      setCandidate(candidateData);
      setLoading(false);
      setIsEditMode(true);
      
      // Debug: Log the actual values from database
      console.log('Candidate data from DB:', {
        race: candidateData.race,
        shirt_size: candidateData.shirt_size,
        emergency_contact_relationship: candidateData.emergency_contact_relationship,
        highest_education: candidateData.highest_education,
        languages_spoken: candidateData.languages_spoken,
        field_of_study: candidateData.field_of_study
      });
      const normalizedData = {
        race: normalizeDropdownValue(candidateData.race, 'race'),
        emergency_contact_relationship: normalizeDropdownValue(candidateData.emergency_contact_relationship, 'relationship'),
        highest_education: normalizeDropdownValue(candidateData.highest_education, 'education'),
        shirt_size: candidateData.shirt_size || ''
      };
      
      console.log('Normalized values:', normalizedData);
      
      const newFormData = {
        full_name: candidateData.full_name || '',
        ic_number: candidateData.ic_number || '',
        email: candidateData.email || '',
        phone_number: candidateData.phone_number || '',
        date_of_birth: candidateData.date_of_birth || '',
        gender: candidateData.gender?.toLowerCase() || '',
        nationality: candidateData.nationality || 'Malaysian',
        race: normalizedData.race,
        emergency_contact_name: candidateData.emergency_contact_name || '',
        emergency_contact_number: candidateData.emergency_contact_number || '',
        emergency_contact_relationship: normalizedData.emergency_contact_relationship,
        profile_photo: candidateData.profile_photo || '',
        home_address: candidateData.home_address || '',
        business_address: candidateData.business_address || '',
        bank_name: candidateData.bank_name || '',
        bank_account_number: candidateData.bank_account_number || '',
        bank_account_name: candidateData.bank_account_name || candidateData.full_name || '',
        bank_account_relationship: candidateData.bank_account_relationship || '',
        not_own_account: candidateData.bank_account_name !== candidateData.full_name,
        highest_education: normalizedData.highest_education,
        field_of_study: candidateData.field_of_study || '',
        has_vehicle: candidateData.has_vehicle || false,
        vehicle_type: candidateData.vehicle_type || '',
        work_experience: candidateData.work_experience || '',
        shirt_size: normalizedData.shirt_size,
        languages_spoken: candidateData.languages_spoken || '',
        passport_number: candidateData.passport_number || '',
        custom_fields: candidateData.custom_fields || {},
        pdpa_consent: candidateData.custom_fields?.pdpa_consent || false
      };
      
      console.log('Setting form data in fetchCandidateData:', {
        race: newFormData.race,
        shirt_size: newFormData.shirt_size,
        emergency_contact_relationship: newFormData.emergency_contact_relationship
      });
      
      setFormData(newFormData);
      
      if (candidateData.profile_photo) {
        setPhotoPreview(candidateData.profile_photo);
      }
    } catch (error) {
      console.error('Error fetching candidate:', error);
      setError('Failed to load candidate data');
      setLoading(false);
    }
  };
  
  const handleIcVerification = async () => {
    if (!candidateId || !secureToken || !icInput) {
      setAuthError('Please enter your IC number');
      return;
    }
    
    setVerifying(true);
    setAuthError('');
    attemptCount.current += 1;
    
    try {
      // Validate with IC number
      const { data, error } = await supabase
        .rpc('validate_candidate_token_secure', {
          p_token: secureToken,
          p_candidate_id: candidateId,
          p_ic_number: icInput,
          p_ip_address: null,
          p_user_agent: navigator.userAgent
        });
      
      if (error) {
        console.error('IC verification error:', error);
        setAuthError('IC verification failed. Please check your IC number.');
        setVerifying(false);
        return;
      }
      
      const validationResult = data?.[0];
      
      if (!validationResult?.valid) {
        setRemainingAttempts(Math.max(0, 3 - attemptCount.current));
        setAuthError(validationResult?.reason || `IC verification failed. Please check your IC number. ${3 - attemptCount.current} attempts remaining.`);
        setVerifying(false);
        
        if (attemptCount.current >= 3) {
          setAuthError('Too many failed attempts. Your access has been blocked for security reasons.');
        }
        return;
      }
      
      // IC verified successfully - load full candidate data
      const candidateData = validationResult.candidate_data;
      console.log('Candidate data from validation:', candidateData);
      setCandidate(candidateData);
      setIsAuthenticated(true);
      
      // We need to fetch the full candidate data as the validation might return limited fields
      const { data: fullCandidateData, error: fetchError } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', candidateId)
        .single();
        
      if (fetchError || !fullCandidateData) {
        console.error('Error fetching full candidate data:', fetchError);
        setAuthError('Failed to load candidate data');
        return;
      }
      
      console.log('Full candidate data from DB:', fullCandidateData);
      
      // Initialize form with actual candidate data
      console.log('Setting form data after IC verification with:', {
        race: normalizeDropdownValue(fullCandidateData.race, 'race'),
        shirt_size: fullCandidateData.shirt_size,
        emergency_contact_relationship: normalizeDropdownValue(fullCandidateData.emergency_contact_relationship, 'relationship'),
        highest_education: normalizeDropdownValue(fullCandidateData.highest_education, 'education')
      });
      
      const newFormData = {
        full_name: fullCandidateData.full_name || '',
        ic_number: fullCandidateData.ic_number || '',
        email: fullCandidateData.email || '',
        phone_number: fullCandidateData.phone_number || '',
        date_of_birth: fullCandidateData.date_of_birth || '',
        gender: fullCandidateData.gender?.toLowerCase() || '',
        nationality: fullCandidateData.nationality || 'Malaysian',
        race: normalizeDropdownValue(fullCandidateData.race, 'race'),
        emergency_contact_name: fullCandidateData.emergency_contact_name || '',
        emergency_contact_number: fullCandidateData.emergency_contact_number || '',
        emergency_contact_relationship: normalizeDropdownValue(fullCandidateData.emergency_contact_relationship, 'relationship'),
        profile_photo: fullCandidateData.profile_photo || '',
        home_address: fullCandidateData.home_address || '',
        business_address: fullCandidateData.business_address || '',
        bank_name: fullCandidateData.bank_name || '',
        bank_account_number: fullCandidateData.bank_account_number || '',
        bank_account_name: fullCandidateData.bank_account_name || fullCandidateData.full_name || '',
        bank_account_relationship: fullCandidateData.bank_account_relationship || '',
        not_own_account: fullCandidateData.bank_account_name !== fullCandidateData.full_name,
        highest_education: normalizeDropdownValue(fullCandidateData.highest_education, 'education'),
        field_of_study: fullCandidateData.field_of_study || '',
        has_vehicle: fullCandidateData.has_vehicle || false,
        vehicle_type: fullCandidateData.vehicle_type || '',
        work_experience: fullCandidateData.work_experience || '',
        shirt_size: fullCandidateData.shirt_size || '',
        languages_spoken: fullCandidateData.languages_spoken || '',
        passport_number: fullCandidateData.passport_number || '',
        custom_fields: fullCandidateData.custom_fields || {},
        pdpa_consent: fullCandidateData.custom_fields?.pdpa_consent || false
      };
      
      console.log('Setting form data with normalized values:', {
        race: newFormData.race,
        shirt_size: newFormData.shirt_size,
        emergency_contact_relationship: newFormData.emergency_contact_relationship
      });
      
      setFormData(newFormData);
      
      if (fullCandidateData.profile_photo) {
        setPhotoPreview(fullCandidateData.profile_photo);
      }
      
      setIsEditMode(true);
      setLoading(false);
    } catch (error) {
      console.error('Error verifying IC:', error);
      setAuthError('Verification failed. Please try again.');
    }
  };
  
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      toast({
        title: 'Photo uploaded',
        description: 'Your photo has been uploaded successfully.',
      });
    }
  };
  
  const handleFullBodyPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload only JPEG or PNG files.',
          variant: 'destructive',
        });
        return;
      }
      
      // Check file size (5MB = 5 * 1024 * 1024 bytes)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({
          title: 'File too large',
          description: 'Please upload a file smaller than 5MB.',
          variant: 'destructive',
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFullBodyPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      toast({
        title: 'Full body photo uploaded',
        description: 'Your full body photo has been uploaded successfully.',
      });
    }
  };
  
  const handleHalfBodyPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload only JPEG or PNG files.',
          variant: 'destructive',
        });
        return;
      }
      
      // Check file size (5MB = 5 * 1024 * 1024 bytes)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({
          title: 'File too large',
          description: 'Please upload a file smaller than 5MB.',
          variant: 'destructive',
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setHalfBodyPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      toast({
        title: 'Half body photo uploaded',
        description: 'Your half body photo has been uploaded successfully.',
      });
    }
  };
  
  // Real-time validation functions
  const validateEmail = (email: string) => {
    if (!email) return '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const validatePhoneNumber = (phone: string) => {
    if (!phone) return 'Phone number is required';
    
    // Check if Malaysian or other nationality
    if (formData.nationality === 'Malaysian') {
      // Malaysian phone number format: +60 followed by 9-10 digits
      const phoneRegex = /^(\+?6?0)?(\d{9,10})$/;
      if (!phoneRegex.test(phone.replace(/[\s-]/g, ''))) {
        return 'Please enter a valid Malaysian phone number (e.g., +60123456789)';
      }
    } else {
      // International phone number - more flexible validation
      const phoneRegex = /^\+?[\d\s-]{8,20}$/;
      if (!phoneRegex.test(phone.replace(/[\s-]/g, ''))) {
        return 'Please enter a valid phone number with country code';
      }
    }
    return '';
  };

  const validateRequired = (value: string, fieldName: string) => {
    if (!value || value.trim() === '') {
      return `${fieldName} is required`;
    }
    return '';
  };

  // Update field with validation
  const updateFieldWithValidation = (fieldName: string, value: string) => {
    let error = '';
    
    // Run specific validations based on field
    switch (fieldName) {
      case 'email':
        error = validateEmail(value);
        break;
      case 'phone_number':
      case 'emergency_contact_number':
        error = validatePhoneNumber(value);
        break;
      case 'full_name':
        error = validateRequired(value, 'Full name');
        break;
      case 'nationality':
        error = validateRequired(value, 'Nationality');
        break;
      case 'emergency_contact_name':
        error = validateRequired(value, 'Emergency contact name');
        break;
    }
    
    // Update form data
    setFormData({...formData, [fieldName]: value});
    
    // Update errors
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  };

  // Map fields to their respective tabs
  const getTabForField = (fieldName: string): string => {
    const fieldToTabMap: Record<string, string> = {
      // Personal tab
      'full_name': 'personal',
      'ic_number': 'personal',
      'passport_number': 'personal',
      'email': 'personal',
      'phone_number': 'personal',
      'date_of_birth': 'personal',
      'gender': 'personal',
      'nationality': 'personal',
      'race': 'personal',
      'emergency_contact_name': 'personal',
      'emergency_contact_number': 'personal',
      'emergency_contact_relationship': 'personal',
      // Contact/Address tab
      'home_address': 'contact',
      'business_address': 'contact',
      // Banking tab
      'bank_name': 'banking',
      'bank_account_number': 'banking',
      'bank_account_name': 'banking',
      'bank_account_relationship': 'banking',
      // Experience tab
      'highest_education': 'experience',
      'field_of_study': 'experience',
      'work_experience': 'experience',
      'shirt_size': 'experience',
      'languages_spoken': 'experience',
      // Photos tab
      'profile_photo': 'photos',
    };
    
    return fieldToTabMap[fieldName] || 'personal';
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    // Validate all fields
    if (formData.email) {
      const emailError = validateEmail(formData.email);
      if (emailError) errors.email = emailError;
    }
    
    const phoneError = validatePhoneNumber(formData.phone_number);
    if (phoneError) errors.phone_number = phoneError;
    
    const nameError = validateRequired(formData.full_name, 'Full name');
    if (nameError) errors.full_name = nameError;
    
    const nationalityError = validateRequired(formData.nationality, 'Nationality');
    if (nationalityError) errors.nationality = nationalityError;
    
    // Validate IC for Malaysians, Passport for others
    if (formData.nationality === 'Malaysian') {
      if (!formData.ic_number) {
        errors.ic_number = 'IC number is required';
      } else if (!/^\d{6}-?\d{2}-?\d{4}$/.test(formData.ic_number.replace(/\s/g, ''))) {
        errors.ic_number = 'Invalid IC format (e.g., 950115-14-5678)';
      }
    } else {
      if (!formData.passport_number) {
        errors.passport_number = 'Passport number is required';
      }
    }
    
    const emergencyNameError = validateRequired(formData.emergency_contact_name, 'Emergency contact name');
    if (emergencyNameError) errors.emergency_contact_name = emergencyNameError;
    
    const emergencyPhoneError = validatePhoneNumber(formData.emergency_contact_number);
    if (emergencyPhoneError) errors.emergency_contact_number = emergencyPhoneError;
    
    // Validate emergency contact relationship
    if (formData.emergency_contact_name && !formData.emergency_contact_relationship) {
      errors.emergency_contact_relationship = 'Please specify relationship';
    }
    
    // Validate address
    if (!formData.home_address) {
      errors.home_address = 'Home address is required';
    }
    
    // Validate bank information
    if (!formData.bank_name) {
      errors.bank_name = 'Bank name is required';
    }
    
    if (!formData.bank_account_number) {
      errors.bank_account_number = 'Bank account number is required';
    }
    
    if (formData.not_own_account && !formData.bank_account_relationship) {
      errors.bank_account_relationship = 'Please specify relationship to account holder';
    }
    
    // Validate date of birth
    if (formData.nationality !== 'Malaysian' && !formData.date_of_birth) {
      errors.date_of_birth = 'Date of birth is required';
    }
    
    setFieldErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      // Find the first tab with errors
      const errorFields = Object.keys(errors);
      const tabsWithErrors = new Set(errorFields.map(field => getTabForField(field)));
      const firstTabWithError = ['personal', 'contact', 'photos', 'experience', 'banking']
        .find(tab => tabsWithErrors.has(tab));
      
      // Group errors by tab
      const errorsByTab: Record<string, string[]> = {};
      errorFields.forEach(field => {
        const tab = getTabForField(field);
        if (!errorsByTab[tab]) {
          errorsByTab[tab] = [];
        }
        const fieldName = field
          .replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase())
          .replace('Ic Number', 'IC Number')
          .replace('Email', 'Email Address')
          .replace('Emergency Contact Name', 'Emergency Contact Name')
          .replace('Emergency Contact Number', 'Emergency Contact Phone');
        errorsByTab[tab].push(fieldName);
      });
      
      // Set validation errors and show dialog
      setValidationErrors(errorsByTab);
      setShowValidationDialog(true);
      
      return false;
    }
    
    return true;
  };

  const handleSaveChanges = async () => {
    console.log('Save button clicked');
    console.log('Current form data:', {
      race: formData.race,
      shirt_size: formData.shirt_size,
      emergency_contact_relationship: formData.emergency_contact_relationship,
      highest_education: formData.highest_education
    });
    
    if (!validateForm()) {
      console.log('Validation failed');
      return;
    }
    
    console.log('Validation passed, showing confirmation dialog');
    // Show confirmation dialog
    setShowConfirmDialog(true);
  };
  
  const confirmSaveChanges = async () => {
    setShowConfirmDialog(false);
    
    // Show PDPA dialog if not consented yet
    if (!formData.pdpa_consent) {
      setShowPDPADialog(true);
      return;
    }
    
    setSaving(true);
    
    try {
      // Upload photos first if any
      let profilePhotoUrl = formData.profile_photo;
      let fullBodyPhotoUrl = null;
      let halfBodyPhotoUrl = null;
      
      if (photoPreview && photoPreview.startsWith('data:')) {
        // Upload profile photo
        const profilePhotoFile = await fetch(photoPreview).then(r => r.blob());
        const profilePhotoName = `${candidateId || 'temp'}-profile-${Date.now()}.jpg`;
        const { data: profileUpload, error: profileError } = await supabase.storage
          .from('avatars')
          .upload(`candidates/${profilePhotoName}`, profilePhotoFile, { upsert: true });
          
        if (profileError) throw profileError;
        
        // Get the public URL for the uploaded photo
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(profileUpload.path);
        
        profilePhotoUrl = publicUrl;
      }
      
      if (fullBodyPhoto && fullBodyPhoto.startsWith('data:')) {
        // Upload full body photo
        const fullBodyFile = await fetch(fullBodyPhoto).then(r => r.blob());
        const fullBodyName = `${candidateId || 'temp'}-fullbody-${Date.now()}.jpg`;
        const { data: fullBodyUpload, error: fullBodyError } = await supabase.storage
          .from('avatars')
          .upload(`candidates/${fullBodyName}`, fullBodyFile, { upsert: true });
          
        if (fullBodyError) throw fullBodyError;
        
        // Get the public URL for the uploaded photo
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fullBodyUpload.path);
        
        fullBodyPhotoUrl = publicUrl;
      }
      
      if (halfBodyPhoto && halfBodyPhoto.startsWith('data:')) {
        // Upload half body photo
        const halfBodyFile = await fetch(halfBodyPhoto).then(r => r.blob());
        const halfBodyName = `${candidateId || 'temp'}-halfbody-${Date.now()}.jpg`;
        const { data: halfBodyUpload, error: halfBodyError } = await supabase.storage
          .from('avatars')
          .upload(`candidates/${halfBodyName}`, halfBodyFile, { upsert: true });
          
        if (halfBodyError) throw halfBodyError;
        
        // Get the public URL for the uploaded photo
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(halfBodyUpload.path);
        
        halfBodyPhotoUrl = publicUrl;
      }
      
      // Convert languages and vehicle types to arrays
      const languagesArray = formData.languages_spoken
        ? formData.languages_spoken.split(',').map((l: string) => l.trim()).filter((l: string) => l)
        : [];
      
      const vehicleTypesArray = formData.vehicle_type
        ? formData.vehicle_type.split(',').map((v: string) => v.trim()).filter((v: string) => v)
        : [];
      
      // Debug: Log what we're saving
      console.log('Saving to database:', {
        race: formData.race,
        shirt_size: formData.shirt_size,
        emergency_contact_relationship: formData.emergency_contact_relationship,
        highest_education: formData.highest_education,
        languages_spoken: languagesArray.join(',')
      });
      
      // Prepare update data
      const updateData = {
        full_name: formData.full_name,
        phone_number: formData.phone_number,
        email: formData.email,
        nationality: formData.nationality,
        ic_number: formData.ic_number || null,
        passport_number: formData.passport_number || null,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender,
        race: formData.race,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_number: formData.emergency_contact_number,
        emergency_contact_relationship: formData.emergency_contact_relationship,
        profile_photo: profilePhotoUrl,
        home_address: formData.home_address,
        business_address: formData.business_address,
        bank_name: formData.bank_name,
        bank_account_number: formData.bank_account_number,
        bank_account_name: formData.bank_account_name,
        bank_account_relationship: formData.not_own_account ? formData.bank_account_relationship : null,
        highest_education: formData.highest_education,
        field_of_study: formData.field_of_study,
        has_vehicle: formData.has_vehicle,
        vehicle_type: vehicleTypesArray.join(','), // Store as comma-separated for now
        work_experience: formData.work_experience,
        shirt_size: formData.shirt_size,
        languages_spoken: languagesArray.join(','), // Store as comma-separated for now
        custom_fields: {
          ...formData.custom_fields,
          transport_mode: formData.custom_fields?.transport_mode || null,
          other_languages: formData.custom_fields?.other_languages || null,
          tin_number: formData.custom_fields?.tin_number || null,
          full_body_photo: fullBodyPhotoUrl,
          half_body_photo: halfBodyPhotoUrl,
          pdpa_consent: formData.pdpa_consent,
          pdpa_consent_date: formData.pdpa_consent ? new Date().toISOString() : null
        },
        updated_at: new Date().toISOString()
      };
      
      // Log the full update data
      console.log('Full update data being sent to Supabase:', updateData);
      
      // Update candidate
      const { error: updateError } = await supabase
        .from('candidates')
        .update(updateData)
        .eq('id', candidateId);
        
      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }
      
      console.log('Update successful');
      
      // Log activity
      await supabase
        .from('activity_logs')
        .insert({
          action: 'candidate_profile_updated',
          entity_type: 'candidate',
          entity_id: candidateId,
          details: {
            updated_fields: Object.keys(updateData),
            update_source: 'self_service'
          }
        });
      
      toast({
        title: 'Profile Updated',
        description: 'Your profile information has been updated successfully.',
      });
      
      setUpdateSuccess(true);
      
      // Show success message for 3 seconds then close
      setTimeout(() => {
        toast({
          title: 'Thank You!',
          description: 'You can now close this window.',
        });
      }, 3000);
      
    } catch (error: any) {
      console.error('Error saving candidate:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handlePDPAConsent = () => {
    setFormData({...formData, pdpa_consent: true});
    setShowPDPADialog(false);
    confirmSaveChanges();
  };
  
  // Loading state
  if (loading) {
    return (
      <PublicPageWrapper>
        <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
          <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="w-full max-w-sm sm:max-w-md p-8">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <LoadingSpinner className="h-12 w-12" />
                  </motion.div>
                  <p className="text-sm text-gray-600 text-center">Validating secure link...</p>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </PublicPageWrapper>
    );
  }
  
  // Error state
  if (error) {
    return (
      <PublicPageWrapper>
        <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
          <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-sm sm:max-w-md"
            >
              <Card className="p-8 shadow-xl">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                      delay: 0.1 
                    }}
                  >
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertCircle className="h-8 w-8 text-red-500" />
                    </div>
                  </motion.div>
                  <CardTitle className="text-xl font-semibold text-red-600">Error</CardTitle>
                  <p className="text-sm text-gray-600 text-center px-4">{error}</p>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.reload()}
                    className="mt-4"
                  >
                    Try Again
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </PublicPageWrapper>
    );
  }
  
  if (updateSuccess) {
    return (
      <PublicPageWrapper>
        <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-sm sm:max-w-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <MagicCard className="w-full text-center">
                  <CardHeader className="space-y-6">
                    <div className="mx-auto">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 p-1 animate-pulse">
                          <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
                            <Check className="h-12 w-12 text-green-600 dark:text-green-400" />
                          </div>
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center animate-bounce">
                          <Sparkles className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <CardTitle className="text-3xl font-bold">
                        <AnimatedGradientText 
                          colorFrom="#3B82F6" 
                          colorTo="#06B6D4"
                          speed={0.5}
                        >
                          Success!
                        </AnimatedGradientText>
                      </CardTitle>
                      <CardDescription className="text-lg">
                        Your profile has been updated successfully
                      </CardDescription>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <Button onClick={() => setUpdateSuccess(false)} className="w-full">
                      Back to Form
                    </Button>
                  </CardContent>
                </MagicCard>
              </motion.div>
            </div>
          </div>
        </div>
      </PublicPageWrapper>
    );
  }
  
  // IC Verification Screen
  if (tokenValid && !isAuthenticated) {
    return (
      <PublicPageWrapper>
        <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
          {/* MagicUI Background Effects */}
          <DotPattern
            width={20}
            height={20}
            className="absolute inset-0 opacity-30"
            cr={1}
          />
          <Particles
            className="absolute inset-0"
            quantity={50}
            ease={80}
            color="#3b82f6"
            refresh
          />
          
          {/* Center container for all screen sizes */}
          <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="w-full max-w-sm sm:max-w-md"
            >
              <NeonGradientCard className="relative overflow-hidden">
                <BorderBeam size={200} duration={12} delay={9} />
                <div className="relative z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-xl">
              <CardHeader className="text-center pb-6 pt-8 px-6 sm:px-8 sm:pt-10">
                <motion.div className="mx-auto mb-4 sm:mb-6">
                  <div className="relative">
                    <MagicCard 
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-0.5"
                      gradientColor="#3b82f6"
                    >
                      <motion.div
                        className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 p-1"
                        animate={{ 
                          rotate: 360
                        }}
                        transition={{ 
                          duration: 20,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                      >
                        <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
                          <Shield className="h-10 w-10 sm:h-12 sm:w-12 text-indigo-600" />
                        </div>
                      </motion.div>
                    </MagicCard>
                    <motion.div
                      className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-8 sm:h-8"
                      animate={{ 
                        scale: [1, 1.2, 1]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <ShineBorder
                        className="rounded-full bg-gradient-to-br from-green-400 to-emerald-500 w-full h-full flex items-center justify-center"
                        color={["#10b981", "#34d399"]}
                      >
                        <Check className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      </ShineBorder>
                    </motion.div>
                  </div>
                </motion.div>
                <CardTitle className="text-2xl sm:text-3xl font-bold">
                  <AnimatedGradientText>
                    Secure Verification
                  </AnimatedGradientText>
                </CardTitle>
                <CardDescription className="mt-2 sm:mt-3 text-sm sm:text-base text-gray-600 px-4">
                  Verify your identity to access and update your profile
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4 sm:space-y-6 pb-6 sm:pb-8 px-6 sm:px-8">
                <div className="space-y-3">
                  <Label htmlFor="ic_auth" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                      <span className="text-xs">🆔</span>
                    </div>
                    IC Number
                  </Label>
                  <div className="relative">
                    <ShineBorder
                      className="rounded-md"
                      color={["#6366f1", "#8b5cf6"]}
                      borderWidth={2}
                    >
                      <Input
                        id="ic_auth"
                        type="text"
                        placeholder="e.g., 901231-14-5678"
                        value={icInput}
                        onChange={(e) => setIcInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleIcVerification();
                          }
                        }}
                        className="h-11 sm:h-12 pl-4 pr-10 text-base sm:text-lg font-medium border-0 focus:ring-0 bg-transparent"
                        disabled={verifying}
                      />
                    </ShineBorder>
                    {icInput && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 z-10"
                      >
                        <SparklesText className="text-indigo-600" sparklesCount={3}>
                          <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                        </SparklesText>
                      </motion.div>
                    )}
                  </div>
                  {authError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Alert variant="destructive" className="mt-3 border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="font-medium">{authError}</AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                  {attemptCount.current > 0 && attemptCount.current < 3 && !authError && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-center gap-2 mt-3"
                    >
                      <div className="flex gap-1">
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              i < attemptCount.current
                                ? 'bg-red-400'
                                : 'bg-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-600">
                        {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining
                      </p>
                    </motion.div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <RainbowButton
                    onClick={handleIcVerification}
                    disabled={verifying || !icInput || attemptCount.current >= 3}
                    className="w-full h-11 sm:h-12 text-sm sm:text-base"
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                        Verifying Identity...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                        Verify My Identity
                      </>
                    )}
                  </RainbowButton>
                  
                  <MagicCard 
                    className="p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900"
                    gradientColor="#e5e7eb"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                        <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                      </div>
                      <div className="text-xs text-gray-600 space-y-0.5 sm:space-y-1">
                        <p className="font-semibold text-gray-700 text-xs sm:text-sm">Your information is protected</p>
                        <p className="text-[10px] sm:text-xs">• One-time secure link (1-hour validity)</p>
                        <p className="text-[10px] sm:text-xs">• End-to-end encryption</p>
                        <p className="text-[10px] sm:text-xs">• Activity monitoring</p>
                      </div>
                    </div>
                  </MagicCard>
                  
                  <div className="text-center">
                    <p className="text-[11px] sm:text-xs text-gray-500">
                      Need help? Contact support at{' '}
                      <a href="mailto:support@example.com" className="text-indigo-600 hover:underline">
                        support@example.com
                      </a>
                    </p>
                  </div>
                </div>
              </CardContent>
                </div>
              </NeonGradientCard>
            </motion.div>
          </div>
          
          {/* Meteors effect for desktop only */}
          <div className="hidden sm:block">
            <Meteors number={20} />
          </div>
        </div>
      </PublicPageWrapper>
    );
  }
  
  return (
    <PublicPageWrapper>
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 overflow-y-auto">
        <div className="min-h-full flex flex-col">
          <div className="flex-1 flex flex-col px-4 pt-2">
            <div className="w-full max-w-[390px] mx-auto flex flex-col" style={{ minHeight: 'calc(100vh - 60px)' }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full flex flex-col flex-1"
              >
                {/* Profile Photo Section - Above everything */}
                <div className="text-center mb-3">
                  <div className="relative inline-block">
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 rounded-full blur-xl opacity-30"
                      animate={{ 
                        scale: [1, 1.1, 1],
                        opacity: [0.3, 0.5, 0.3],
                      }}
                      transition={{ 
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    <Avatar className="h-16 w-16 border-3 border-white shadow-xl relative z-10 ring-2 ring-blue-100">
                      <AvatarImage src={photoPreview || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-2xl font-bold">
                        {formData.full_name?.charAt(0) || candidate?.full_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <motion.button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 p-1.5 bg-white rounded-full shadow-lg border border-blue-200 hover:border-blue-400 transition-all hover:scale-110 z-20"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Camera className="h-3 w-3 text-blue-600" />
                    </motion.button>
                  </div>
                  <motion.div 
                    className="mt-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h3 className="text-xs font-semibold">
                      <AnimatedGradientText 
                        colorFrom="#3B82F6" 
                        colorTo="#06B6D4"
                        speed={0.5}
                      >
                        {formData.full_name || candidate?.full_name || 'Guest'}
                      </AnimatedGradientText>
                    </h3>
                  </motion.div>
                </div>
                
                <div className="w-full flex flex-col flex-1">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
                    <MagicCard className="relative w-full overflow-visible rounded-lg mb-2">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-cyan-50/50 pointer-events-none" />
                      <CardContent className="px-2 pt-2 pb-2 relative z-10">
                        <TabsList className="grid w-full grid-cols-5 bg-blue-50/50 dark:bg-blue-900/20 p-0.5 border border-blue-100">
                      <TabsTrigger value="personal" className="text-[10px] px-1 py-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 transition-all relative">
                        <UserPlus className="h-3 w-3 mr-0.5" />
                        <span>Info</span>
                        {Object.keys(fieldErrors).some(field => getTabForField(field) === 'personal') && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="contact" className="text-[10px] px-1 py-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 transition-all relative">
                        <MapPin className="h-3 w-3 mr-0.5" />
                        <span>Addr</span>
                        {Object.keys(fieldErrors).some(field => getTabForField(field) === 'contact') && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="photos" className="text-[10px] px-1 py-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 transition-all relative">
                        <Camera className="h-3 w-3 mr-0.5" />
                        <span>Pics</span>
                        {Object.keys(fieldErrors).some(field => getTabForField(field) === 'photos') && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="experience" className="text-[10px] px-1 py-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 transition-all relative">
                        <Briefcase className="h-3 w-3 mr-0.5" />
                        Skills
                        {Object.keys(fieldErrors).some(field => getTabForField(field) === 'experience') && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="banking" className="text-[10px] px-1 py-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 transition-all relative">
                        <Building2 className="h-3 w-3 mr-0.5" />
                        <span>Bank</span>
                        {Object.keys(fieldErrors).some(field => getTabForField(field) === 'banking') && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                        )}
                      </TabsTrigger>
                    </TabsList>
                      </CardContent>
                    </MagicCard>
                    
                    <div className="relative w-full flex-1 overflow-hidden pb-4 h-full rounded-lg">
                      <div className="absolute inset-0 bg-white/80 pointer-events-none rounded-lg" />
                      <div className="relative z-10 h-full">
                      {/* Personal Information Tab */}
                      <TabsContent value="personal" className="mt-0 px-2 h-full overflow-y-auto">
                        <div className="space-y-3">
                          <div className="relative mb-3">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 blur-sm opacity-25"></div>
                            <h4 className="font-semibold flex items-center justify-center gap-2 relative bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                              <UserPlus className="h-4 w-4 text-blue-600" />
                              Personal Details
                            </h4>
                          </div>
                          <div className="space-y-3">
                            {/* Full Name field first */}
                            <div>
                              <Label htmlFor="full_name" className="text-xs text-center block bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-semibold">Full Name *</Label>
                              <Input
                                id="full_name"
                                value={formData.full_name || ''}
                                onChange={(e) => updateFieldWithValidation('full_name', e.target.value)}
                                className={cn(
                                  "mt-1 text-center text-sm",
                                  fieldErrors.full_name && "border-red-500 focus:ring-red-500"
                                )}
                              />
                              {fieldErrors.full_name && (
                                <p className="text-[10px] text-red-500 mt-1 text-center">{fieldErrors.full_name}</p>
                              )}
                            </div>
                            
                            {/* Nationality and DOB side by side */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label htmlFor="nationality" className="text-xs text-center block bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-semibold">Nationality *</Label>
                                <Select
                                  value={formData.nationality || 'Malaysian'}
                                  onValueChange={(value) => {
                                    // Clear IC/Passport when nationality changes
                                    if (value !== 'Malaysian') {
                                      setFormData(prev => ({...prev, nationality: value, ic_number: '', date_of_birth: prev.date_of_birth || ''}));
                                    } else {
                                      setFormData(prev => ({...prev, nationality: value, passport_number: '', date_of_birth: ''}));
                                    }
                                    updateFieldWithValidation('nationality', value);
                                  }}
                                >
                                  <CenteredSelectTrigger id="nationality" className="mt-1">
                                    <SelectValue placeholder="Select nationality" />
                                  </CenteredSelectTrigger>
                                  <SelectContent>
                                    <CenteredSelectItem value="Malaysian">Malaysian</CenteredSelectItem>
                                    <CenteredSelectItem value="Singaporean">Singaporean</CenteredSelectItem>
                                    <CenteredSelectItem value="Indonesian">Indonesian</CenteredSelectItem>
                                    <CenteredSelectItem value="Thai">Thai</CenteredSelectItem>
                                    <CenteredSelectItem value="Filipino">Filipino</CenteredSelectItem>
                                    <CenteredSelectItem value="Vietnamese">Vietnamese</CenteredSelectItem>
                                    <CenteredSelectItem value="Bangladeshi">Bangladeshi</CenteredSelectItem>
                                    <CenteredSelectItem value="Indian">Indian</CenteredSelectItem>
                                    <CenteredSelectItem value="Chinese">Chinese</CenteredSelectItem>
                                    <CenteredSelectItem value="Other">Other</CenteredSelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div>
                                <Label htmlFor="age" className="text-xs text-center block bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-semibold">
                                  {formData.nationality === 'Malaysian' ? 'Age' : 'Date of Birth'}
                                </Label>
                                {formData.nationality === 'Malaysian' && formData.ic_number ? (
                                  <Input
                                    id="age"
                                    value={(() => {
                                      // Calculate age from IC for Malaysians
                                      const ic = formData.ic_number;
                                      if (!ic || ic.length < 6) return '';
                                      
                                      const yearPrefix = ic.substring(0, 2);
                                      const month = ic.substring(2, 4);
                                      const day = ic.substring(4, 6);
                                      
                                      const currentYear = new Date().getFullYear();
                                      const currentCentury = Math.floor(currentYear / 100) * 100;
                                      const year = parseInt(yearPrefix) + (parseInt(yearPrefix) > currentYear % 100 ? currentCentury - 100 : currentCentury);
                                      
                                      const birthDate = new Date(year, parseInt(month) - 1, parseInt(day));
                                      const today = new Date();
                                      
                                      let age = today.getFullYear() - birthDate.getFullYear();
                                      const monthDiff = today.getMonth() - birthDate.getMonth();
                                      
                                      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                                        age--;
                                      }
                                      
                                      return age ? `${age} years` : '';
                                    })()}
                                    disabled
                                    className="mt-1 bg-gray-100 cursor-not-allowed text-center text-xs"
                                  />
                                ) : (
                                  <Input
                                    id="date_of_birth"
                                    type="date"
                                    value={formData.date_of_birth || ''}
                                    onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                                    className="mt-1 text-center text-xs"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          {/* Conditional IC/Passport field */}
                          {formData.nationality === 'Malaysian' ? (
                            <div>
                              <Label htmlFor="ic_number" className="text-xs text-center block bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-semibold">
                                IC Number * {idFieldEdited && <span className="text-[10px] text-gray-500">(Locked)</span>}
                              </Label>
                              <Input
                                id="ic_number"
                                value={formData.ic_number || ''}
                                disabled={idFieldEdited}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setFormData({...formData, ic_number: value});
                                  // Validate IC format
                                  if (value && !/^\d{6}-?\d{2}-?\d{4}$/.test(value.replace(/\s/g, ''))) {
                                    setFieldErrors({...fieldErrors, ic_number: 'Invalid IC format (e.g., 950115-14-5678)'});
                                  } else {
                                    setFieldErrors({...fieldErrors, ic_number: ''});
                                  }
                                }}
                                onBlur={() => {
                                  if (formData.ic_number && formData.ic_number !== candidate?.ic_number) {
                                    setIdFieldEdited(true);
                                  }
                                }}
                                className={cn(
                                  "mt-1 text-center text-xs",
                                  idFieldEdited && "bg-gray-100 cursor-not-allowed",
                                  fieldErrors.ic_number && "border-red-500 focus:ring-red-500"
                                )}
                                placeholder="e.g., 950115-14-5678"
                              />
                              {fieldErrors.ic_number && (
                                <p className="text-[10px] text-red-500 mt-1 text-center">{fieldErrors.ic_number}</p>
                              )}
                            </div>
                          ) : (
                            <div>
                              <Label htmlFor="passport_number" className="text-xs text-center block bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-semibold">
                                Passport No * {idFieldEdited && <span className="text-[10px] text-gray-500">(Locked)</span>}
                              </Label>
                              <Input
                                id="passport_number"
                                value={formData.passport_number || ''}
                                disabled={idFieldEdited}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setFormData({...formData, passport_number: value});
                                  if (!value) {
                                    setFieldErrors({...fieldErrors, passport_number: 'Passport number is required'});
                                  } else {
                                    setFieldErrors({...fieldErrors, passport_number: ''});
                                  }
                                }}
                                onBlur={() => {
                                  if (formData.passport_number && formData.passport_number !== candidate?.passport_number) {
                                    setIdFieldEdited(true);
                                  }
                                }}
                                className={cn(
                                  "mt-1 text-center text-xs",
                                  idFieldEdited && "bg-gray-100 cursor-not-allowed",
                                  fieldErrors.passport_number && "border-red-500 focus:ring-red-500"
                                )}
                                placeholder="Enter passport number"
                              />
                              {fieldErrors.passport_number && (
                                <p className="text-[10px] text-red-500 mt-1 text-center">{fieldErrors.passport_number}</p>
                              )}
                            </div>
                          )}
                          
                          <div>
                            <Label htmlFor="gender" className="text-xs text-center block bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-semibold">Gender</Label>
                            <Select
                              value={formData.gender || ''}
                              onValueChange={(value) => setFormData({...formData, gender: value})}
                            >
                              <CenteredSelectTrigger id="gender" className="mt-1">
                                <SelectValue placeholder="Select" />
                              </CenteredSelectTrigger>
                              <SelectContent>
                                <CenteredSelectItem value="male">Male</CenteredSelectItem>
                                <CenteredSelectItem value="female">Female</CenteredSelectItem>
                                <CenteredSelectItem value="other">Other</CenteredSelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="race" className="text-xs text-center block bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-semibold">Race</Label>
                            <Select
                              value={formData.race || undefined}
                              onValueChange={(value) => {
                                console.log('Race changed to:', value);
                                setFormData({...formData, race: value});
                              }}
                            >
                              <CenteredSelectTrigger id="race" className="mt-1">
                                <SelectValue placeholder="Select race" />
                              </CenteredSelectTrigger>
                              <SelectContent>
                                <CenteredSelectItem value="malay">Malay</CenteredSelectItem>
                                <CenteredSelectItem value="chinese">Chinese</CenteredSelectItem>
                                <CenteredSelectItem value="indian">Indian</CenteredSelectItem>
                                <CenteredSelectItem value="others">Others</CenteredSelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor="shirt_size" className="text-xs text-center block bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-semibold">Shirt Size</Label>
                            <Select
                              value={formData.shirt_size || undefined}
                              onValueChange={(value) => {
                                console.log('Shirt size changed to:', value);
                                setFormData({...formData, shirt_size: value});
                              }}
                            >
                              <CenteredSelectTrigger id="shirt_size" className="mt-1">
                                <SelectValue placeholder="Select size" />
                              </CenteredSelectTrigger>
                              <SelectContent>
                                <CenteredSelectItem value="XS">XS</CenteredSelectItem>
                                <CenteredSelectItem value="S">S</CenteredSelectItem>
                                <CenteredSelectItem value="M">M</CenteredSelectItem>
                                <CenteredSelectItem value="L">L</CenteredSelectItem>
                                <CenteredSelectItem value="XL">XL</CenteredSelectItem>
                                <CenteredSelectItem value="XXL">XXL</CenteredSelectItem>
                                <CenteredSelectItem value="XXXL">XXXL</CenteredSelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="phone_number" className="text-xs flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-semibold">
                              <Phone className="h-4 w-4 text-blue-600" />
                              Phone *
                            </Label>
                            <Input
                              id="phone_number"
                              type="tel"
                              value={formData.phone_number || ''}
                              onChange={(e) => updateFieldWithValidation('phone_number', e.target.value)}
                              className={cn(
                                "mt-1 text-center text-xs",
                                fieldErrors.phone_number && "border-red-500 focus:ring-red-500"
                              )}
                              placeholder="+60123456789"
                            />
                            {fieldErrors.phone_number && (
                              <p className="text-[10px] text-red-500 mt-1 text-center">{fieldErrors.phone_number}</p>
                            )}
                          </div>
                          
                          <div>
                            <Label htmlFor="email" className="text-xs flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-semibold">
                              <Mail className="h-4 w-4 text-blue-600" />
                              Email
                            </Label>
                            <Input
                              id="email"
                              type="email"
                              value={formData.email || ''}
                              onChange={(e) => updateFieldWithValidation('email', e.target.value)}
                              className={cn(
                                "mt-1 text-center text-xs",
                                fieldErrors.email && "border-red-500 focus:ring-red-500"
                              )}
                              placeholder="example@email.com"
                            />
                            {fieldErrors.email && (
                              <p className="text-[10px] text-red-500 mt-1 text-center">{fieldErrors.email}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <Label className="text-xs text-center block bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-semibold mb-2">Languages</Label>
                          <div className="flex flex-wrap items-center justify-center gap-4">
                            {['English', 'Malay', 'Mandarin', 'Other'].map((lang) => (
                              <div key={lang} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`lang_${lang.toLowerCase()}`}
                                  checked={formData.languages_spoken?.includes(lang) || false}
                                  onCheckedChange={(checked) => {
                                    const currentLangs = formData.languages_spoken ? formData.languages_spoken.split(',').map(l => l.trim()).filter(l => l) : [];
                                    if (checked) {
                                      if (lang === 'Other' && !currentLangs.includes('Other')) {
                                        currentLangs.push(lang);
                                      } else if (lang !== 'Other') {
                                        currentLangs.push(lang);
                                      }
                                    } else {
                                      if (lang === 'Other') {
                                        // Remove "Other" and any custom languages
                                        const standardLangs = ['English', 'Malay', 'Mandarin'];
                                        const filteredLangs = currentLangs.filter(l => standardLangs.includes(l));
                                        setFormData({...formData, languages_spoken: filteredLangs.join(', '), custom_fields: {...formData.custom_fields, other_languages: ''}});
                                        return;
                                      } else {
                                        const index = currentLangs.indexOf(lang);
                                        if (index > -1) currentLangs.splice(index, 1);
                                      }
                                    }
                                    setFormData({...formData, languages_spoken: currentLangs.join(', ')});
                                  }}
                                />
                                <Label htmlFor={`lang_${lang.toLowerCase()}`} className="text-xs font-normal cursor-pointer">
                                  {lang}
                                </Label>
                              </div>
                            ))}
                          </div>
                          {formData.languages_spoken?.includes('Other') && (
                            <div className="mt-2">
                              <Input
                                id="other_languages"
                                value={formData.custom_fields?.other_languages || ''}
                                onChange={(e) => {
                                  const otherLangs = e.target.value;
                                  setFormData(prev => ({
                                    ...prev, 
                                    custom_fields: {
                                      ...prev.custom_fields, 
                                      other_languages: otherLangs
                                    }
                                  }));
                                }}
                                onBlur={(e) => {
                                  const otherLangs = e.target.value;
                                  // Update the languages_spoken field with all languages when user finishes typing
                                  const standardLangs = ['English', 'Malay', 'Mandarin', 'Other'].filter(lang => 
                                    formData.languages_spoken?.includes(lang)
                                  );
                                  
                                  if (otherLangs.trim()) {
                                    const customLangs = otherLangs.split(';').map(l => l.trim()).filter(l => l);
                                    const allLangs = [...standardLangs.filter(l => l !== 'Other'), ...customLangs];
                                    setFormData(prev => ({...prev, languages_spoken: allLangs.join(', ')}));
                                  } else {
                                    setFormData(prev => ({...prev, languages_spoken: standardLangs.join(', ')}));
                                  }
                                }}
                                className="mt-1 text-center text-xs"
                                placeholder="e.g. Cantonese; Hindi; Japanese (separate with semicolon)"
                              />
                              <p className="text-[10px] text-gray-500 mt-1 text-center">
                                Enter other languages separated by semicolon (;)
                              </p>
                            </div>
                          )}
                        </div>
                        </div>
                      </TabsContent>
                      
                      {/* Photos Tab */}
                      <TabsContent value="photos" className="mt-0 px-2 h-full overflow-y-auto">
                        <div className="space-y-4">
                          <div className="relative mb-3">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 blur-sm opacity-25"></div>
                            <h4 className="font-semibold flex items-center justify-center gap-2 relative bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                              <Camera className="h-4 w-4 text-blue-600" />
                              Photos
                            </h4>
                          </div>
                          <div className="space-y-4">
                          
                          {/* Full Body Photo Section */}
                          <div className="space-y-3">
                            <Label className="text-xs font-semibold text-center block bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                              Full Body Photo
                            </Label>
                            <div className="flex flex-col items-center space-y-3">
                              <div className="relative h-48 w-36 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                                {fullBodyPhoto ? (
                                  <>
                                    <img 
                                      src={fullBodyPhoto} 
                                      alt="Full body" 
                                      className="h-full w-full object-cover"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setFullBodyPhoto(null)}
                                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </>
                                ) : (
                                  <div 
                                    className="h-full w-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"
                                    onClick={() => fullBodyInputRef.current?.click()}
                                  >
                                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                    <p className="text-xs text-gray-500">Upload full body photo</p>
                                  </div>
                                )}
                              </div>
                              <input
                                ref={fullBodyInputRef}
                                type="file"
                                accept="image/jpeg,image/jpg,image/png"
                                onChange={handleFullBodyPhotoUpload}
                                className="hidden"
                              />
                            </div>
                          </div>
                          
                          <Separator className="my-4" />
                          
                          {/* Half Body Photos Section - 3 placeholders */}
                          <div className="space-y-3">
                            <Label className="text-xs font-semibold text-center block bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                              Half Body Photos
                            </Label>
                            <div className="grid grid-cols-3 gap-3">
                              {[1, 2, 3].map((index) => (
                                <div key={index}>
                                  <div 
                                    className="relative h-32 w-full border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => halfBodyInputRef.current?.click()}
                                  >
                                    <div className="h-full w-full flex flex-col items-center justify-center">
                                      <Upload className="h-6 w-6 text-gray-400 mb-1" />
                                      <p className="text-xs text-gray-500">Half Body {index}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <input
                              ref={halfBodyInputRef}
                              type="file"
                              accept="image/jpeg,image/jpg,image/png"
                              onChange={handleHalfBodyPhotoUpload}
                              className="hidden"
                            />
                            <p className="text-[10px] text-gray-500 text-center">
                              Only JPEG/PNG files, max 5MB each
                            </p>
                          </div>
                        </div>
                        </div>
                      </TabsContent>
                      
                      {/* Banking Tab */}
                      <TabsContent value="banking" className="mt-0 px-2 h-full overflow-y-auto">
                        <div className="space-y-4">
                          <div className="relative mb-3">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 blur-sm opacity-25"></div>
                            <h4 className="font-semibold flex items-center justify-center gap-2 relative bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                              <Building2 className="h-4 w-4 text-blue-600" />
                              Banking Information
                            </h4>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex items-center justify-center space-x-2 mb-4">
                              <Switch
                                id="not_own_account"
                                checked={formData.not_own_account || false}
                                onCheckedChange={(checked) => {
                                  setFormData({
                                    ...formData, 
                                    not_own_account: checked,
                                    bank_account_name: checked ? '' : formData.full_name || candidate?.full_name || '',
                                    bank_account_relationship: checked ? formData.bank_account_relationship : ''
                                  });
                                }}
                              />
                              <Label htmlFor="not_own_account" className="text-xs font-medium">
                                Using someone else's bank account?
                              </Label>
                            </div>
                            
                            <div>
                              <Label htmlFor="bank_account_name" className="text-xs flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-semibold">
                                <CreditCard className="h-4 w-4 text-blue-600" />
                                Account Name
                              </Label>
                              <Input
                                id="bank_account_name"
                                value={formData.bank_account_name || (formData.not_own_account ? '' : formData.full_name || candidate?.full_name || '')}
                                onChange={(e) => setFormData({...formData, bank_account_name: e.target.value})}
                                className="mt-1 text-center text-xs"
                                placeholder="Enter account holder name"
                                disabled={!formData.not_own_account}
                              />
                            </div>
                            
                            {formData.not_own_account && (
                              <div>
                                <Label htmlFor="bank_account_relationship" className="text-xs text-center block bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-semibold">Relationship</Label>
                                <Select
                                  value={formData.bank_account_relationship || ''}
                                  onValueChange={(value) => setFormData({...formData, bank_account_relationship: value})}
                                >
                                  <CenteredSelectTrigger id="bank_account_relationship" className="mt-1">
                                    <SelectValue placeholder="Select relationship" />
                                  </CenteredSelectTrigger>
                                  <SelectContent>
                                    <CenteredSelectItem value="parent">Parent</CenteredSelectItem>
                                    <CenteredSelectItem value="spouse">Spouse</CenteredSelectItem>
                                    <CenteredSelectItem value="sibling">Sibling</CenteredSelectItem>
                                    <CenteredSelectItem value="friend">Friend</CenteredSelectItem>
                                    <CenteredSelectItem value="relative">Relative</CenteredSelectItem>
                                    <CenteredSelectItem value="other">Other</CenteredSelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            
                            <div>
                              <Label htmlFor="bank_name" className="text-xs flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-semibold">
                                <Building2 className="h-4 w-4 text-blue-600" />
                                Bank Name
                              </Label>
                              <Select
                                value={formData.bank_name || ''}
                                onValueChange={(value) => setFormData({...formData, bank_name: value})}
                              >
                                <CenteredSelectTrigger id="bank_name" className="mt-1">
                                  <SelectValue placeholder="Select your bank" />
                                </CenteredSelectTrigger>
                                <SelectContent>
                                  {BANK_OPTIONS.map(bank => (
                                    <CenteredSelectItem key={bank.value} value={bank.value}>
                                      {bank.label}
                                    </CenteredSelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label htmlFor="bank_account_number" className="text-xs flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-semibold">
                                <CreditCard className="h-4 w-4 text-blue-600" />
                                Account Number
                              </Label>
                              <Input
                                id="bank_account_number"
                                value={formData.bank_account_number || ''}
                                onChange={(e) => setFormData({...formData, bank_account_number: e.target.value})}
                                className="mt-1 text-center text-xs"
                                placeholder="Enter account number"
                              />
                            </div>
                            
                          </div>
                          
                          <Separator className="my-4" />
                          
                          <div className="space-y-3">
                            <h4 className="font-medium text-sm text-center bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Tax Information</h4>
                            <div>
                              <Label htmlFor="tin_number" className="text-xs flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-semibold">
                                <FileText className="h-4 w-4 text-blue-600" />
                                TIN Number (Optional)
                              </Label>
                              <Input
                                id="tin_number"
                                value={formData.custom_fields?.tin_number || ''}
                                onChange={(e) => setFormData({
                                  ...formData, 
                                  custom_fields: {
                                    ...formData.custom_fields,
                                    tin_number: e.target.value
                                  }
                                })}
                                className="mt-1 text-center text-xs"
                                placeholder="Tax Identification Number"
                              />
                              <p className="text-[10px] text-gray-500 mt-1">
                                Required if you have income tax obligations
                              </p>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                      
                      {/* Experience Tab */}
                      <TabsContent value="experience" className="mt-0 px-2 h-full flex flex-col">
                        <div className="flex-1 overflow-y-auto">
                          <div className="space-y-4 pb-2">
                            <div className="relative mb-3">
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 blur-sm opacity-25"></div>
                              <h4 className="font-semibold flex items-center justify-center gap-2 relative bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                                <GraduationCap className="h-4 w-4 text-blue-600" />
                                Education
                              </h4>
                            </div>
                            
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label htmlFor="highest_education" className="text-xs text-center block bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-semibold">Highest Education</Label>
                                  <Select
                                    key={`highest_education-${formData.highest_education}`}
                                    value={formData.highest_education || ''}
                                    onValueChange={(value) => setFormData({...formData, highest_education: value})}
                                  >
                                    <CenteredSelectTrigger id="highest_education" className="mt-1">
                                      <SelectValue placeholder="Select level" />
                                    </CenteredSelectTrigger>
                                    <SelectContent>
                                      <CenteredSelectItem value="primary">Primary School</CenteredSelectItem>
                                      <CenteredSelectItem value="secondary">Secondary School</CenteredSelectItem>
                                      <CenteredSelectItem value="diploma">Diploma</CenteredSelectItem>
                                      <CenteredSelectItem value="degree">Bachelor's Degree</CenteredSelectItem>
                                      <CenteredSelectItem value="master">Master's Degree</CenteredSelectItem>
                                      <CenteredSelectItem value="phd">PhD</CenteredSelectItem>
                                      <CenteredSelectItem value="other">Other</CenteredSelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div>
                                  <Label htmlFor="field_of_study" className="text-xs text-center block bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-semibold">Field of Study</Label>
                                  <Input
                                    id="field_of_study"
                                    value={formData.field_of_study || ''}
                                    onChange={(e) => setFormData({...formData, field_of_study: e.target.value})}
                                    className="mt-1 text-center text-xs"
                                    placeholder="e.g. Engineering"
                                  />
                                </div>
                              </div>
                              
                              <Separator className="my-3 bg-gradient-to-r from-transparent via-blue-200 to-transparent" />
                              
                              <div className="relative mb-3">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 blur-sm opacity-25"></div>
                                <h4 className="font-semibold flex items-center justify-center gap-2 relative bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                                  <Briefcase className="h-4 w-4 text-blue-600" />
                                  Work Experience
                                </h4>
                              </div>
                              <div>
                                <Textarea
                                  id="work_experience"
                                  value={formData.work_experience || ''}
                                  onChange={(e) => setFormData({...formData, work_experience: e.target.value})}
                                  className="mt-1 min-h-[220px] font-mono text-xs"
                                  placeholder={`Example format:
Working Experiences (list ALL):
- Photobooth Crew PopBox
- Event Crew 2 tahun Madani
- Promoter Nuuna
- Event Crew Keluarga Malaysia Pahang
- Event Crew Keluarga Malaysia N9
- Livehost

Or include:
Brand: [Company Name]
Position: [Job Title]
Days Committed: [Number]`}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Sticky bottom section */}
                        <div>
                          <Separator className="mb-2 bg-gradient-to-r from-transparent via-blue-200 to-transparent" />
                          <Alert className="bg-blue-50 border-blue-200 py-2">
                            <div className="flex items-start gap-2">
                              <InfoCircle className="h-3 w-3 text-blue-600 mt-0.5" />
                              <div className="flex-1">
                                <AlertTitle className="text-[10px] text-blue-900 mb-0.5">Quick Paste Format</AlertTitle>
                                <AlertDescription className="text-[9px] text-blue-800 leading-tight">
                                  Copy and paste your work experience list - we'll save it as formatted.
                                </AlertDescription>
                              </div>
                            </div>
                          </Alert>
                        </div>
                      </TabsContent>
                      
                      {/* Contact Tab */}
                      <TabsContent value="contact" className="mt-0 px-2 h-full overflow-y-auto">
                        <div className="space-y-4">
                          
                          <div className="space-y-4">
                            <div className="relative mb-3">
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 blur-sm opacity-25"></div>
                              <h4 className="font-semibold flex items-center justify-center gap-2 relative bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                                <MapPin className="h-4 w-4 text-blue-600" />
                                Address
                              </h4>
                            </div>
                            <div>
                              <Label htmlFor="home_address" className="text-xs text-center block bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-semibold">
                                Current Staying Address *
                              </Label>
                              <Textarea
                                id="home_address"
                                value={formData.home_address || ''}
                                onChange={(e) => setFormData({...formData, home_address: e.target.value})}
                                className={cn(
                                  "mt-1 text-xs",
                                  fieldErrors.home_address && "border-red-500 focus:ring-red-500"
                                )}
                                rows={3}
                                placeholder="Enter your current address"
                              />
                              {fieldErrors.home_address && (
                                <p className="text-[10px] text-red-500 mt-1 text-center">{fieldErrors.home_address}</p>
                              )}
                            </div>
                            
                            <div className="relative mb-3">
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 blur-sm opacity-25"></div>
                              <h4 className="font-semibold flex items-center justify-center gap-2 relative bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                                <Car className="h-4 w-4 text-blue-600" />
                                Transport Type
                              </h4>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <Label className="text-xs text-center block bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-semibold mb-2">
                                  How will you commute to work?
                                </Label>
                                <Select
                                  value={
                                    formData.has_vehicle 
                                      ? 'own_vehicle' 
                                      : (formData.custom_fields?.transport_mode || 'public_transport')
                                  }
                                  onValueChange={(value) => {
                                    if (value === 'public_transport') {
                                      setFormData({
                                        ...formData, 
                                        has_vehicle: false, 
                                        vehicle_type: '',
                                        custom_fields: {
                                          ...formData.custom_fields,
                                          transport_mode: 'public_transport'
                                        }
                                      });
                                    } else if (value === 'carpool') {
                                      setFormData({
                                        ...formData, 
                                        has_vehicle: false, 
                                        vehicle_type: '',
                                        custom_fields: {
                                          ...formData.custom_fields,
                                          transport_mode: 'carpool'
                                        }
                                      });
                                    } else if (value === 'flexible') {
                                      setFormData({
                                        ...formData, 
                                        has_vehicle: false, 
                                        vehicle_type: formData.vehicle_type || '',
                                        custom_fields: {
                                          ...formData.custom_fields,
                                          transport_mode: 'flexible'
                                        }
                                      });
                                    } else {
                                      setFormData({
                                        ...formData, 
                                        has_vehicle: true, 
                                        vehicle_type: formData.vehicle_type || '',
                                        custom_fields: {
                                          ...formData.custom_fields,
                                          transport_mode: 'own_vehicle'
                                        }
                                      });
                                    }
                                  }}
                                >
                                  <CenteredSelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select transport type" />
                                  </CenteredSelectTrigger>
                                  <SelectContent>
                                    <CenteredSelectItem value="public_transport">Public Transport</CenteredSelectItem>
                                    <CenteredSelectItem value="own_vehicle">I have own vehicle</CenteredSelectItem>
                                    <CenteredSelectItem value="carpool">Carpool / e-hailing</CenteredSelectItem>
                                    <CenteredSelectItem value="flexible">Flexible (depends on location)</CenteredSelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              {(formData.has_vehicle || formData.custom_fields?.transport_mode === 'flexible') && (
                                <div>
                                  <Label className="text-xs text-center block bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-semibold mb-2">
                                    {formData.custom_fields?.transport_mode === 'flexible' 
                                      ? 'Vehicle Type (when available)' 
                                      : 'Vehicle Type'}
                                  </Label>
                                  <div className="flex items-center justify-center gap-4">
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id="vehicle_car"
                                        checked={formData.vehicle_type?.includes('car') || false}
                                        onCheckedChange={(checked) => {
                                          const currentTypes = formData.vehicle_type ? formData.vehicle_type.split(',').filter(t => t) : [];
                                          if (checked) {
                                            currentTypes.push('car');
                                          } else {
                                            const index = currentTypes.indexOf('car');
                                            if (index > -1) currentTypes.splice(index, 1);
                                          }
                                          setFormData({...formData, vehicle_type: currentTypes.join(',')});
                                        }}
                                      />
                                      <Label htmlFor="vehicle_car" className="text-xs font-normal cursor-pointer">
                                        Car
                                      </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id="vehicle_motorcycle"
                                        checked={formData.vehicle_type?.includes('motorcycle') || false}
                                        onCheckedChange={(checked) => {
                                          const currentTypes = formData.vehicle_type ? formData.vehicle_type.split(',').filter(t => t) : [];
                                          if (checked) {
                                            currentTypes.push('motorcycle');
                                          } else {
                                            const index = currentTypes.indexOf('motorcycle');
                                            if (index > -1) currentTypes.splice(index, 1);
                                          }
                                          setFormData({...formData, vehicle_type: currentTypes.join(',')});
                                        }}
                                      />
                                      <Label htmlFor="vehicle_motorcycle" className="text-xs font-normal cursor-pointer">
                                        Motorcycle
                                      </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id="vehicle_van"
                                        checked={formData.vehicle_type?.includes('van') || false}
                                        onCheckedChange={(checked) => {
                                          const currentTypes = formData.vehicle_type ? formData.vehicle_type.split(',').filter(t => t) : [];
                                          if (checked) {
                                            currentTypes.push('van');
                                          } else {
                                            const index = currentTypes.indexOf('van');
                                            if (index > -1) currentTypes.splice(index, 1);
                                          }
                                          setFormData({...formData, vehicle_type: currentTypes.join(',')});
                                        }}
                                      />
                                      <Label htmlFor="vehicle_van" className="text-xs font-normal cursor-pointer">
                                        Van
                                      </Label>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <Separator className="my-4 bg-gradient-to-r from-transparent via-blue-200 to-transparent" />
                            
                            <div className="relative">
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 blur-sm opacity-25"></div>
                              <h4 className="font-semibold flex items-center justify-center gap-2 relative bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                                <Users className="h-4 w-4 text-blue-600" />
                                Emergency Contact
                              </h4>
                            </div>
                            
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label htmlFor="emergency_contact_name" className="text-xs text-center block bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-semibold">Contact Name *</Label>
                                  <Input
                                    id="emergency_contact_name"
                                    value={formData.emergency_contact_name || ''}
                                    onChange={(e) => updateFieldWithValidation('emergency_contact_name', e.target.value)}
                                    className={cn(
                                      "mt-1 text-center text-xs",
                                      fieldErrors.emergency_contact_name && "border-red-500 focus:ring-red-500"
                                    )}
                                  />
                                  {fieldErrors.emergency_contact_name && (
                                    <p className="text-[10px] text-red-500 mt-1 text-center">{fieldErrors.emergency_contact_name}</p>
                                  )}
                                </div>
                                
                                <div>
                                  <Label htmlFor="emergency_contact_relationship" className="text-xs text-center block bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-semibold">Relationship</Label>
                                  <Select
                                    value={formData.emergency_contact_relationship || undefined}
                                    onValueChange={(value) => {
                                      console.log('Emergency relationship changed to:', value);
                                      setFormData({...formData, emergency_contact_relationship: value});
                                    }}
                                  >
                                    <CenteredSelectTrigger id="emergency_contact_relationship" className="mt-1">
                                      <SelectValue placeholder="Select relationship" />
                                    </CenteredSelectTrigger>
                                    <SelectContent>
                                      <CenteredSelectItem value="parent">Parent</CenteredSelectItem>
                                      <CenteredSelectItem value="spouse">Spouse</CenteredSelectItem>
                                      <CenteredSelectItem value="sibling">Sibling</CenteredSelectItem>
                                      <CenteredSelectItem value="friend">Friend</CenteredSelectItem>
                                      <CenteredSelectItem value="relative">Relative</CenteredSelectItem>
                                      <CenteredSelectItem value="other">Other</CenteredSelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              
                              <div>
                                <Label htmlFor="emergency_contact_number" className="text-xs text-center block bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-semibold">Contact Number *</Label>
                                <Input
                                  id="emergency_contact_number"
                                  type="tel"
                                  value={formData.emergency_contact_number || ''}
                                  onChange={(e) => updateFieldWithValidation('emergency_contact_number', e.target.value)}
                                  className={cn(
                                    "mt-1 text-center text-xs",
                                    fieldErrors.emergency_contact_number && "border-red-500 focus:ring-red-500"
                                  )}
                                  placeholder="+60123456789"
                                />
                                {fieldErrors.emergency_contact_number && (
                                  <p className="text-[10px] text-red-500 mt-1 text-center">{fieldErrors.emergency_contact_number}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                      </div>
                    </div>
                  </Tabs>
                </div>
                
                {/* PDPA Consent Indicator */}
                {formData.pdpa_consent && (
                  <div className="mt-2 text-center">
                    <p className="text-[10px] text-green-600 flex items-center justify-center gap-1">
                      <Check className="h-3 w-3" />
                      PDPA consent provided
                    </p>
                  </div>
                )}
                
                {/* Action Button - At bottom of blue section */}
                <div className="mt-2">
                  <RainbowButton
                    onClick={handleSaveChanges}
                    disabled={saving}
                    className="w-full h-11 text-xs font-semibold"
                  >
                    {saving ? (
                      <>
                        <LoadingSpinner className="mr-2" />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Save All Changes
                      </>
                    )}
                  </RainbowButton>
                </div>
              </motion.div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="bg-white/80 backdrop-blur-sm border-t border-gray-200 py-3">
            <p className="text-center text-xs text-gray-600">
              Created by{' '}
              <span className="font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Baito Events
              </span>
            </p>
          </div>
        </div>
      </div>
      
      
      {/* PDPA Consent Dialog */}
      <Dialog open={showPDPADialog} onOpenChange={setShowPDPADialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-center">
              Personal Data Protection Notice
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            <div className="bg-gray-50 p-3 rounded-md space-y-2">
              <p className="text-xs font-semibold">Your data will be used for:</p>
              <ul className="list-disc list-inside space-y-1 text-[10px] text-gray-600 ml-2">
                <li>Employment and project management</li>
                <li>Sharing with clients for staffing needs</li>
                <li>Retention for max 2 years</li>
              </ul>
            </div>
            
            <p className="text-[10px] text-gray-600 text-center">
              You can access, correct, or delete your data anytime.
              <br />
              <a href="#" className="text-blue-600 underline">Privacy Policy</a>
            </p>
          </div>
          
          <DialogFooter className="flex gap-2 mt-3">
            <Button
              variant="outline"
              onClick={() => setShowPDPADialog(false)}
              className="flex-1 h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePDPAConsent}
              className="flex-1 h-8 text-xs bg-blue-600 hover:bg-blue-700"
            >
              I Consent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-center flex items-center justify-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              Confirm Changes
            </DialogTitle>
            <DialogDescription className="text-center text-xs">
              Are you sure you want to save all changes to your profile?
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-xs text-gray-700 text-center">
              {idFieldEdited && (
                <span className="text-red-600 font-semibold">
                  Note: Your IC/Passport number will be permanently updated and cannot be changed again.
                  <br />
                </span>
              )}
              Please review your information before saving.
            </p>
          </div>
          
          <DialogFooter className="flex gap-2 mt-3">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className="flex-1 h-8 text-xs"
            >
              Review Again
            </Button>
            <Button
              onClick={confirmSaveChanges}
              className="flex-1 h-8 text-xs bg-blue-600 hover:bg-blue-700"
            >
              Yes, Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Validation Error Dialog */}
      <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Required Fields Missing
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              Please fill in the following required fields before saving:
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[400px] overflow-y-auto space-y-4">
            {Object.entries(validationErrors).map(([tab, fields]) => {
              const tabName = tab.charAt(0).toUpperCase() + tab.slice(1);
              const tabIcon = {
                personal: <User className="h-4 w-4" />,
                contact: <MapPin className="h-4 w-4" />,
                photos: <Camera className="h-4 w-4" />,
                experience: <Briefcase className="h-4 w-4" />,
                banking: <CreditCard className="h-4 w-4" />
              }[tab];
              
              return (
                <div key={tab} className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center gap-2 mb-2 font-semibold text-sm">
                    {tabIcon}
                    {tabName} Tab
                  </div>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    {fields.map((field, index) => (
                      <li key={index} className="text-sm text-red-600">{field}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          
          <DialogFooter>
            <Button
              onClick={() => {
                setShowValidationDialog(false);
                // Navigate to the first tab with errors
                const firstTabWithError = Object.keys(validationErrors)[0];
                if (firstTabWithError) {
                  setActiveTab(firstTabWithError);
                }
              }}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Go to Missing Fields
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PublicPageWrapper>
  );
}