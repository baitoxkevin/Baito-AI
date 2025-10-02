import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  UserPlus, 
  AlertCircle, 
  LockKeyhole, 
  UserCheck, 
  Shield, 
  Clock, 
  Ban,
  Camera,
  X,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Users,
  Building2,
  Car,
  Languages,
  Camera as CameraIcon,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Candidate } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { 
  validateCandidateUpdateSecurity, 
  validateICNumber,
  detectSQLInjection,
  detectXSS,
  generateCSRFToken,
  logSecurityEvent
} from '@/lib/candidate-security-service';
import { PublicPageWrapper } from '@/components/PublicPageWrapper';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { activityLogger } from '@/lib/activity-logger';

// Bank codes for DuitNow
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

interface TokenValidationResult {
  candidate_id: string;
  full_name: string;
  email: string;
  phone_number: string;
  gender: string;
  ic_number: string;
  nationality: string;
  date_of_birth: string;
  emergency_contact_name: string;
  emergency_contact_number: string;
  custom_fields: any;
  profile_photo: string;
}

export default function StaticCandidateUpdatePage() {
  const { candidateId } = useParams<{ candidateId: string }>();
  const [searchParams] = useSearchParams();
  const secureToken = searchParams.get('secure_token');
  
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [authError, setAuthError] = useState('');
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [icAuthInput, setIcAuthInput] = useState('');
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [securityBlocked, setSecurityBlocked] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [csrfToken] = useState(() => generateCSRFToken());
  const sessionId = useRef(`session-${Date.now()}`);
  const attemptCount = useRef(0);
  
  // Form states
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // IC/Passport edit states
  const [hasEditedIC, setHasEditedIC] = useState(false);
  const [hasEditedPassport, setHasEditedPassport] = useState(false);
  const [originalIC, setOriginalIC] = useState('');
  const [originalPassport, setOriginalPassport] = useState('');
  
  // Language states
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [otherLanguages, setOtherLanguages] = useState('');
  const [showOtherLanguageInput, setShowOtherLanguageInput] = useState(false);
  
  // Vehicle type states
  const [selectedVehicleTypes, setSelectedVehicleTypes] = useState<string[]>([]);
  
  // Confirm dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const { toast } = useToast();
  
  useEffect(() => {
    if (!candidateId || !secureToken) {
      setAuthError('Invalid link. Please check your URL and try again.');
      setLoading(false);
      return;
    }
    
    // Basic security checks before token validation
    if (detectSQLInjection(secureToken) || detectXSS(secureToken)) {
      setSecurityBlocked(true);
      setAuthError('Security violation detected. This incident has been logged.');
      logSecurityEvent('malicious_input_detected', 'critical', {
        type: 'token',
        candidateId
      });
      setLoading(false);
      return;
    }
    
    validateToken();
  }, [candidateId, secureToken]);
  
  const validateToken = async () => {
    if (!secureToken || !candidateId) return;
    
    try {
      setLoading(true);
      setAuthError('');
      
      // Get client info for audit logging
      const userAgent = navigator.userAgent;
      
      // Create a mock request object for security validation
      const mockRequest = {
        headers: {
          get: (name: string) => {
            if (name === 'user-agent') return userAgent;
            if (name === 'origin') return window.location.origin;
            if (name === 'referer') return window.location.href;
            return null;
          }
        }
      } as unknown as Request;
      
      // Perform comprehensive security validation first
      const securityCheck = await validateCandidateUpdateSecurity(
        candidateId,
        secureToken,
        '', // No IC yet at this stage
        mockRequest
      );
      
      if (!securityCheck.passed) {
        if (securityCheck.reason?.includes('Too many')) {
          setSecurityBlocked(true);
          const resetTime = securityCheck.details?.resetTime;
          setAuthError(`Access temporarily blocked due to too many attempts. ${
            resetTime ? `Try again after ${new Date(resetTime).toLocaleTimeString()}.` : 'Please try again later.'
          }`);
        } else {
          setAuthError(securityCheck.reason || 'Security validation failed.');
        }
        return;
      }
      
      // First try the secure validation function, fallback to simpler validation
      let validationResult: any = null;
      let candidateData: any = null;
      
      try {
        // Try the secure function first
        const { data, error } = await supabase
          .rpc('validate_candidate_token_secure', {
            p_token: secureToken,
            p_candidate_id: candidateId,
            p_ic_number: '', // Will validate IC later
            p_ip_address: null,
            p_user_agent: userAgent
          });
        
        if (!error && data && data.length > 0) {
          validationResult = data[0];
          candidateData = validationResult.candidate_data;
        } else {
          throw new Error('Secure validation not available');
        }
      } catch (secureError) {
        console.log('Falling back to simple token validation');
        
        // Fallback: Try simpler token validation
        try {
          const { data: tokenData, error: tokenError } = await supabase
            .from('candidate_verification_tokens')
            .select('*')
            .eq('token', secureToken)
            .eq('candidate_id', candidateId)
            .gte('expires_at', new Date().toISOString())
            .is('used_at', null)
            .single();
          
          if (tokenError || !tokenData) {
            setTokenExpired(true);
            setAuthError('This link has expired or is invalid. Please request a new link from your contact.');
            return;
          }
          
          // Token exists, now get candidate data
          const { data: candidateRecord, error: candidateError } = await supabase
            .from('candidates')
            .select('*')
            .eq('id', candidateId)
            .single();
          
          if (candidateError || !candidateRecord) {
            throw new Error('Candidate not found');
          }
          
          candidateData = candidateRecord;
          validationResult = { valid: true };
        } catch (fallbackError) {
          console.error('Fallback validation error:', fallbackError);
          throw fallbackError;
        }
      }
      
      if (!validationResult?.valid) {
        setAuthError(validationResult?.reason || 'Token validation failed.');
        if (validationResult?.reason?.includes('Too many attempts')) {
          setSecurityBlocked(true);
        }
        return;
      }
      
      // Token is valid, but still require IC verification for security
      setTokenValid(true);
      setCandidate({
        id: candidateData.id,
        ...candidateData
      } as Candidate);
      
    } catch (error) {
      console.error('Error validating token:', error);
      setAuthError('An error occurred while validating your link. Please try again later.');
      
      await logSecurityEvent('token_validation_error', 'medium', {
        candidateId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const verifyCandidate = async (icNumber: string) => {
    if (!candidate || !secureToken || !candidateId) return;
    
    try {
      setVerifying(true);
      setAuthError('');
      attemptCount.current += 1;
      
      // Security checks on IC input
      if (detectSQLInjection(icNumber) || detectXSS(icNumber)) {
        setSecurityBlocked(true);
        setAuthError('Security violation detected. This incident has been logged.');
        await logSecurityEvent('malicious_ic_input', 'critical', {
          candidateId: candidate.id,
          attemptNumber: attemptCount.current
        });
        return;
      }
      
      // Validate IC format
      const icValidation = validateICNumber(icNumber);
      if (!icValidation.passed) {
        setAuthError(icValidation.reason || 'Invalid IC number format.');
        setRemainingAttempts(Math.max(0, 3 - attemptCount.current));
        
        if (attemptCount.current >= 3) {
          setSecurityBlocked(true);
          setAuthError('Too many failed attempts. Your access has been blocked for security reasons.');
          await logSecurityEvent('ic_verification_lockout', 'high', {
            candidateId: candidate.id,
            totalAttempts: attemptCount.current
          });
        }
        return;
      }
      
      // Try secure validation first, then fallback
      let verificationResult: any = null;
      
      try {
        // Try the secure validation function with IC
        const { data, error } = await supabase
          .rpc('validate_candidate_token_secure', {
            p_token: secureToken,
            p_candidate_id: candidateId,
            p_ic_number: icValidation.details?.cleaned || icNumber,
            p_ip_address: null,
            p_user_agent: navigator.userAgent
          });
        
        if (!error && data && data.length > 0) {
          verificationResult = data[0];
        } else {
          throw new Error('Secure validation not available');
        }
      } catch (secureError) {
        console.log('Falling back to simple IC verification');
        
        // Fallback: Compare IC directly
        const cleanedInputIC = (icValidation.details?.cleaned || icNumber).replace(/[^0-9]/g, '');
        const candidateIC = candidate.ic_number?.replace(/[^0-9]/g, '') || '';
        
        if (cleanedInputIC === candidateIC) {
          verificationResult = { valid: true };
          
          // Mark token as used
          await supabase
            .from('candidate_verification_tokens')
            .update({ used_at: new Date().toISOString() })
            .eq('token', secureToken)
            .eq('candidate_id', candidateId);
        } else {
          verificationResult = { 
            valid: false, 
            reason: 'IC verification failed. Please check your IC number and try again.' 
          };
        }
      }
      
      if (!verificationResult?.valid) {
        setRemainingAttempts(Math.max(0, 3 - attemptCount.current));
        setAuthError(verificationResult?.reason || 'IC verification failed. Please check your IC number and try again.');
        
        if (attemptCount.current >= 3 || verificationResult?.reason?.includes('locked')) {
          setSecurityBlocked(true);
          setAuthError('Too many failed attempts. Your access has been blocked for security reasons.');
        }
        return;
      }
      
      // Authentication successful - Initialize form data
      const candidateData = verificationResult.candidate_data || candidate;
      setFormData({
        full_name: candidateData.full_name || '',
        email: candidateData.email || '',
        phone_number: candidateData.phone_number || '',
        date_of_birth: candidateData.date_of_birth || '',
        gender: candidateData.gender || '',
        nationality: candidateData.nationality || '',
        ic_number: candidateData.ic_number || '',
        passport_number: candidateData.passport_number || '',
        home_address: candidateData.home_address || '',
        business_address: candidateData.business_address || '',
        bank_name: candidateData.bank_name || '',
        bank_account_number: candidateData.bank_account_number || '',
        emergency_contact_name: candidateData.emergency_contact_name || '',
        emergency_contact_number: candidateData.emergency_contact_number || '',
        highest_education: candidateData.highest_education || '',
        transportation_type: candidateData.custom_fields?.transportation_type || 'Public Transport',
        profile_photo: candidateData.profile_photo || ''
      });
      
      // Set original IC/Passport values
      setOriginalIC(candidateData.ic_number || '');
      setOriginalPassport(candidateData.passport_number || '');
      
      // Parse languages
      if (candidateData.languages_spoken) {
        const langs = candidateData.languages_spoken.split(';').map((lang: string) => lang.trim());
        const knownLangs = ['English', 'Malay', 'Mandarin'];
        const selected = langs.filter((lang: string) => knownLangs.includes(lang));
        const others = langs.filter((lang: string) => !knownLangs.includes(lang));
        setSelectedLanguages(selected);
        if (others.length > 0) {
          setSelectedLanguages(prev => [...prev, 'Other']);
          setOtherLanguages(others.join('; '));
          setShowOtherLanguageInput(true);
        }
      }
      
      // Parse vehicle types
      if (candidateData.vehicle_type) {
        setSelectedVehicleTypes(candidateData.vehicle_type.split(',').map((v: string) => v.trim()));
      }
      
      // Set profile photo preview
      if (candidateData.profile_photo) {
        setProfilePhotoPreview(candidateData.profile_photo);
      }
      
      setIsEditMode(true);
      
      toast({
        title: 'Verification Successful',
        description: 'You now have access to edit your profile information.',
      });
      
      // Log successful access
      await logSecurityEvent('candidate_update_access_granted', 'low', {
        candidateId: candidate.id,
        candidateName: candidate.full_name,
        sessionId: sessionId.current
      });
      
    } catch (error) {
      console.error('Error verifying candidate:', error);
      setAuthError('An error occurred during verification. Please try again later.');
      
      await logSecurityEvent('ic_verification_error', 'medium', {
        candidateId: candidate.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setVerifying(false);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyCandidate(icAuthInput);
  };
  
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please upload an image smaller than 5MB.',
          variant: 'destructive',
        });
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload an image file (JPEG, PNG, etc.).',
          variant: 'destructive',
        });
        return;
      }
      
      setProfilePhotoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const validateForm = () => {
    // Check required fields
    if (!formData.full_name?.trim()) {
      toast({ title: 'Error', description: 'Full name is required', variant: 'destructive' });
      return false;
    }
    
    if (!formData.phone_number?.trim()) {
      toast({ title: 'Error', description: 'Phone number is required', variant: 'destructive' });
      return false;
    }
    
    if (!formData.home_address?.trim()) {
      toast({ title: 'Error', description: 'Home address is required', variant: 'destructive' });
      return false;
    }
    
    if (!formData.bank_name?.trim() || !formData.bank_account_number?.trim()) {
      toast({ title: 'Error', description: 'Banking information is required', variant: 'destructive' });
      return false;
    }
    
    if (!formData.emergency_contact_name?.trim() || !formData.emergency_contact_number?.trim()) {
      toast({ title: 'Error', description: 'Emergency contact information is required', variant: 'destructive' });
      return false;
    }
    
    // Validate email format if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({ title: 'Error', description: 'Invalid email format', variant: 'destructive' });
      return false;
    }
    
    // Validate phone number format
    if (formData.phone_number && !/^[0-9+\-\s()]+$/.test(formData.phone_number)) {
      toast({ title: 'Error', description: 'Invalid phone number format', variant: 'destructive' });
      return false;
    }
    
    return true;
  };
  
  const confirmSaveChanges = async () => {
    if (!candidate || !validateForm()) return;
    
    try {
      setSaving(true);
      
      // Upload profile photo if changed
      let profilePhotoUrl = formData.profile_photo;
      if (profilePhotoFile) {
        const fileExt = profilePhotoFile.name.split('.').pop();
        const fileName = `${candidate.id}/profile-${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('photos')
          .upload(fileName, profilePhotoFile, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('photos')
          .getPublicUrl(fileName);
        
        profilePhotoUrl = publicUrl;
      }
      
      // Compile languages
      const allLanguages = [...selectedLanguages.filter(l => l !== 'Other')];
      if (selectedLanguages.includes('Other') && otherLanguages.trim()) {
        const otherLangArray = otherLanguages.split(';').map(l => l.trim()).filter(l => l);
        allLanguages.push(...otherLangArray);
      }
      const languagesSpoken = allLanguages.join('; ');
      
      // Compile vehicle types
      const vehicleType = selectedVehicleTypes.join(', ');
      
      // Update candidate data
      const { error: updateError } = await supabase
        .from('candidates')
        .update({
          full_name: formData.full_name,
          email: formData.email || null,
          phone_number: formData.phone_number,
          date_of_birth: formData.date_of_birth,
          gender: formData.gender,
          nationality: formData.nationality,
          ic_number: formData.ic_number,
          passport_number: formData.passport_number,
          home_address: formData.home_address,
          business_address: formData.business_address,
          bank_name: formData.bank_name,
          bank_account_number: formData.bank_account_number,
          emergency_contact_name: formData.emergency_contact_name,
          emergency_contact_number: formData.emergency_contact_number,
          highest_education: formData.highest_education,
          languages_spoken: languagesSpoken,
          has_vehicle: formData.transportation_type === 'I have own vehicle' || 
                       (formData.transportation_type === 'Flexible (depends on location)' && selectedVehicleTypes.length > 0),
          vehicle_type: vehicleType || null,
          profile_photo: profilePhotoUrl,
          custom_fields: {
            ...candidate.custom_fields,
            transportation_type: formData.transportation_type
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', candidate.id);
      
      if (updateError) throw updateError;
      
      // Log the update
      await activityLogger.logActivity({
        action: 'candidate_profile_updated',
        entity_type: 'candidate',
        entity_id: candidate.id,
        details: {
          updated_by: 'self',
          method: 'secure_link',
          fields_updated: Object.keys(formData).filter(key => formData[key] !== candidate[key as keyof Candidate])
        },
        severity: 'low',
        source: 'candidate_update_page'
      });
      
      // Invalidate the token after successful update
      await supabase
        .from('candidate_public_links')
        .update({ is_active: false, used_at: new Date().toISOString() })
        .eq('token', secureToken);
      
      toast({
        title: 'Success!',
        description: 'Your profile has been updated successfully.',
      });
      
      // Redirect to success state
      setIsEditMode(false);
      window.location.reload();
      
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Update Failed',
        description: 'An error occurred while updating your profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
      setShowConfirmDialog(false);
    }
  };
  
  const handleICChange = (value: string) => {
    if (!hasEditedIC) {
      setHasEditedIC(true);
    }
    setFormData({ ...formData, ic_number: value });
  };
  
  const handlePassportChange = (value: string) => {
    if (!hasEditedPassport) {
      setHasEditedPassport(true);
    }
    setFormData({ ...formData, passport_number: value });
  };
  
  const handleLanguageToggle = (language: string) => {
    if (language === 'Other') {
      setShowOtherLanguageInput(!showOtherLanguageInput);
      if (!showOtherLanguageInput) {
        setSelectedLanguages(prev => [...prev, 'Other']);
      } else {
        setSelectedLanguages(prev => prev.filter(l => l !== 'Other'));
        setOtherLanguages('');
      }
    } else {
      setSelectedLanguages(prev =>
        prev.includes(language)
          ? prev.filter(l => l !== language)
          : [...prev, language]
      );
    }
  };
  
  const handleVehicleTypeToggle = (vehicleType: string) => {
    setSelectedVehicleTypes(prev =>
      prev.includes(vehicleType)
        ? prev.filter(v => v !== vehicleType)
        : [...prev, vehicleType]
    );
  };
  
  if (loading) {
    return (
      <PublicPageWrapper>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      </PublicPageWrapper>
    );
  }
  
  if (!candidateId || !secureToken) {
    return (
      <PublicPageWrapper>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Invalid Link</AlertTitle>
              <AlertDescription>
                {authError || 'This link is invalid. Please check your URL and try again.'}
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </PublicPageWrapper>
    );
  }
  
  if (securityBlocked) {
    return (
      <PublicPageWrapper>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Ban className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Access Blocked</CardTitle>
            <CardDescription>
              Your access has been temporarily blocked for security reasons.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <Shield className="h-4 w-4" />
              <AlertTitle>Security Alert</AlertTitle>
              <AlertDescription>
                {authError || 'This access attempt has been blocked due to suspicious activity. If you believe this is an error, please contact support.'}
              </AlertDescription>
            </Alert>
            <div className="mt-4 p-4 bg-gray-100 rounded-lg text-sm text-gray-600">
              <p className="font-medium mb-2">Why was I blocked?</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Too many failed verification attempts</li>
                <li>Suspicious patterns detected</li>
                <li>Security policy violations</li>
              </ul>
            </div>
          </CardContent>
        </Card>
        </div>
      </PublicPageWrapper>
    );
  }
  
  if (tokenExpired) {
    return (
      <PublicPageWrapper>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Link Expired</CardTitle>
            <CardDescription>
              This verification link has expired or has already been used.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Need a new link?</AlertTitle>
              <AlertDescription>
                Please contact the person who sent you this link to request a new one. 
                For security reasons, links are only valid for 1 hour and can only be used once.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
      </PublicPageWrapper>
    );
  }
  
  return (
    <PublicPageWrapper>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {!isEditMode ? (
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
              <UserPlus className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl">Update Your Profile</CardTitle>
            <CardDescription>
              {tokenValid ? 'Verify your identity to proceed' : 'Secure candidate profile update'}
            </CardDescription>
            {tokenValid && (
              <Badge variant="outline" className="mt-2">
                <Shield className="h-3 w-3 mr-1" />
                Secure Link Verified
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {authError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Verification Failed</AlertTitle>
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}
            
            {tokenValid && candidate && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                  <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                    Welcome, {candidate.full_name}
                  </h3>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Please verify your identity with your IC number to access and update your profile information.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ic_auth" className="flex items-center gap-2">
                    <LockKeyhole className="h-4 w-4" />
                    IC Number (without dashes)
                  </Label>
                  <Input 
                    id="ic_auth"
                    placeholder="Enter your IC number"
                    value={icAuthInput}
                    onChange={(e) => {
                      // Remove any dashes from input
                      const formattedValue = e.target.value.replace(/-/g, '');
                      setIcAuthInput(formattedValue);
                    }}
                    className="bg-slate-50 dark:bg-slate-800"
                    required
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Your IC number is required for security verification.
                  </p>
                  {attemptCount.current > 0 && remainingAttempts > 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                      {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining
                    </p>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={verifying || !icAuthInput || remainingAttempts === 0}
                >
                  {verifying ? (
                    <>
                      <LoadingSpinner className="mr-2" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Continue'
                  )}
                </Button>
                
                <div className="text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    This is a secure one-time link. Your data is protected.
                  </p>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="w-full max-w-2xl">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-green-600" />
                  <CardTitle>Update Your Information</CardTitle>
                </div>
                <Badge variant="outline" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Secure Session
                </Badge>
              </div>
              <CardDescription>
                Please review and update your profile information below
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Photo Section */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100">
                    {profilePhotoPreview ? (
                      <img 
                        src={profilePhotoPreview} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  {profilePhotoPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setProfilePhotoFile(null);
                        setProfilePhotoPreview(null);
                      }}
                      className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <div className="flex-1">
                  <Label>Profile Photo</Label>
                  <p className="text-sm text-gray-500 mb-2">
                    Upload a clear photo of yourself (max 5MB, JPEG/PNG)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <CameraIcon className="h-4 w-4 mr-2" />
                    {profilePhotoPreview ? 'Change Photo' : 'Upload Photo'}
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Personal Information</h3>
                
                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name || ''}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nationality">Nationality</Label>
                    <Select
                      value={formData.nationality || ''}
                      onValueChange={(value) => setFormData({ ...formData, nationality: value })}
                    >
                      <SelectTrigger id="nationality">
                        <SelectValue placeholder="Select nationality" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Malaysian">Malaysian</SelectItem>
                        <SelectItem value="Singaporean">Singaporean</SelectItem>
                        <SelectItem value="Indonesian">Indonesian</SelectItem>
                        <SelectItem value="Thai">Thai</SelectItem>
                        <SelectItem value="Filipino">Filipino</SelectItem>
                        <SelectItem value="Vietnamese">Vietnamese</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth || ''}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={formData.gender || ''}
                      onValueChange={(value) => setFormData({ ...formData, gender: value })}
                    >
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="highest_education">Highest Education</Label>
                    <Select
                      value={formData.highest_education || ''}
                      onValueChange={(value) => setFormData({ ...formData, highest_education: value })}
                    >
                      <SelectTrigger id="highest_education">
                        <SelectValue placeholder="Select education level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="primary">Primary School</SelectItem>
                        <SelectItem value="secondary">Secondary School</SelectItem>
                        <SelectItem value="diploma">Diploma</SelectItem>
                        <SelectItem value="degree">Bachelor's Degree</SelectItem>
                        <SelectItem value="masters">Master's Degree</SelectItem>
                        <SelectItem value="phd">PhD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* IC/Passport Numbers */}
                {formData.nationality === 'Malaysian' ? (
                  <div>
                    <Label htmlFor="ic_number">
                      IC Number {hasEditedIC && '(edited)'}
                    </Label>
                    <Input
                      id="ic_number"
                      value={formData.ic_number || ''}
                      onChange={(e) => handleICChange(e.target.value)}
                      disabled={hasEditedIC && formData.ic_number !== originalIC}
                      placeholder="123456-12-1234"
                    />
                    {hasEditedIC && formData.ic_number !== originalIC && (
                      <p className="text-xs text-amber-600 mt-1">
                        IC number can only be edited once for security reasons
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="passport_number">
                      Passport Number {hasEditedPassport && '(edited)'}
                    </Label>
                    <Input
                      id="passport_number"
                      value={formData.passport_number || ''}
                      onChange={(e) => handlePassportChange(e.target.value)}
                      disabled={hasEditedPassport && formData.passport_number !== originalPassport}
                      placeholder="A12345678"
                    />
                    {hasEditedPassport && formData.passport_number !== originalPassport && (
                      <p className="text-xs text-amber-600 mt-1">
                        Passport number can only be edited once for security reasons
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              <Separator />
              
              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone_number">Phone Number *</Label>
                    <Input
                      id="phone_number"
                      type="tel"
                      value={formData.phone_number || ''}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address Information
                </h3>
                
                <div>
                  <Label htmlFor="home_address">Home Address *</Label>
                  <Textarea
                    id="home_address"
                    value={formData.home_address || ''}
                    onChange={(e) => setFormData({ ...formData, home_address: e.target.value })}
                    rows={3}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="business_address">Business Address</Label>
                  <Textarea
                    id="business_address"
                    value={formData.business_address || ''}
                    onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              
              <Separator />
              
              {/* Languages */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Languages className="h-5 w-5" />
                  Languages Spoken
                </h3>
                
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-4">
                    {['English', 'Malay', 'Mandarin', 'Other'].map((language) => (
                      <div key={language} className="flex items-center space-x-2">
                        <Checkbox
                          id={`lang-${language}`}
                          checked={selectedLanguages.includes(language)}
                          onCheckedChange={() => handleLanguageToggle(language)}
                        />
                        <Label htmlFor={`lang-${language}`} className="cursor-pointer">
                          {language}
                        </Label>
                      </div>
                    ))}
                  </div>
                  
                  {showOtherLanguageInput && (
                    <div>
                      <Label htmlFor="other_languages">
                        Other Languages (separate with semicolon)
                      </Label>
                      <Input
                        id="other_languages"
                        value={otherLanguages}
                        onChange={(e) => setOtherLanguages(e.target.value)}
                        onBlur={(e) => setOtherLanguages(e.target.value)}
                        placeholder="e.g., Cantonese; Tamil; Hindi"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <Separator />
              
              {/* Transportation */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Transportation
                </h3>
                
                <div>
                  <Label htmlFor="transportation_type">Transportation Type</Label>
                  <Select
                    value={formData.transportation_type || 'Public Transport'}
                    onValueChange={(value) => {
                      setFormData({ ...formData, transportation_type: value });
                      // Clear vehicle types if not applicable
                      if (value !== 'I have own vehicle' && value !== 'Flexible (depends on location)') {
                        setSelectedVehicleTypes([]);
                      }
                    }}
                  >
                    <SelectTrigger id="transportation_type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Public Transport">Public Transport</SelectItem>
                      <SelectItem value="I have own vehicle">I have own vehicle</SelectItem>
                      <SelectItem value="Carpool / e-hailing">Carpool / e-hailing</SelectItem>
                      <SelectItem value="Flexible (depends on location)">Flexible (depends on location)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {(formData.transportation_type === 'I have own vehicle' || 
                  formData.transportation_type === 'Flexible (depends on location)') && (
                  <div className="space-y-2">
                    <Label>Vehicle Type(s)</Label>
                    <div className="flex flex-wrap gap-4">
                      {['Car', 'Motorcycle', 'Van'].map((vehicleType) => (
                        <div key={vehicleType} className="flex items-center space-x-2">
                          <Checkbox
                            id={`vehicle-${vehicleType}`}
                            checked={selectedVehicleTypes.includes(vehicleType)}
                            onCheckedChange={() => handleVehicleTypeToggle(vehicleType)}
                          />
                          <Label htmlFor={`vehicle-${vehicleType}`} className="cursor-pointer">
                            {vehicleType}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <Separator />
              
              {/* Banking Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Banking Information
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bank_name">Bank *</Label>
                    <Select
                      value={formData.bank_name || ''}
                      onValueChange={(value) => setFormData({ ...formData, bank_name: value })}
                    >
                      <SelectTrigger id="bank_name">
                        <SelectValue placeholder="Select bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {BANK_OPTIONS.map((bank) => (
                          <SelectItem key={bank.value} value={bank.value}>
                            {bank.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="bank_account_number">Account Number *</Label>
                    <Input
                      id="bank_account_number"
                      value={formData.bank_account_number || ''}
                      onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Emergency Contact */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Emergency Contact
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emergency_contact_name">Contact Name *</Label>
                    <Input
                      id="emergency_contact_name"
                      value={formData.emergency_contact_name || ''}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="emergency_contact_number">Contact Number *</Label>
                    <Input
                      id="emergency_contact_number"
                      type="tel"
                      value={formData.emergency_contact_number || ''}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_number: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditMode(false);
                    window.location.reload();
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Changes</DialogTitle>
            <DialogDescription>
              Are you sure you want to save these changes to your profile? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmSaveChanges}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Confirm & Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </PublicPageWrapper>
  );
}