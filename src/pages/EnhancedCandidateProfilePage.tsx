/**
 * Enhanced Candidate Profile Page with:
 * - JSONB array photo storage
 * - Smart validation with auto-formatting
 * - QR code profile sharing
 * - Activity logging
 * - Profile completion tracking
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { PublicPageWrapper } from '@/components/PublicPageWrapper';
import QRCodeModalWeb from '@/components/QRCodeModalWeb';
import {
  Upload, Camera, X, QrCode, CheckCircle, AlertCircle,
  User, Mail, Phone, MapPin, Sparkles, Loader2, Save,
  Image as ImageIcon, Trash2, Info
} from 'lucide-react';
import {
  formatICNumber,
  formatPhoneNumber,
  validateICNumber,
  validateEmail,
  validatePhone,
  calculateProfileCompletion,
  getCompletionColor,
  getCompletionText,
  getFieldHint,
  validateProfileData
} from '@/lib/validation-enhanced';
import {
  uploadImageToSupabase,
  selectAndUploadProfilePicture,
  uploadDocument,
  deleteFullBodyPhoto,
  deleteHalfBodyPhoto
} from '@/lib/image-upload-service-enhanced';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { motion, AnimatePresence } from 'framer-motion';

export default function EnhancedCandidateProfilePage() {
  const { candidateId } = useParams();
  const [searchParams] = useSearchParams();
  const secureToken = searchParams.get('secure_token');

  // State management
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Form data
  const [formData, setFormData] = useState<any>({
    full_name: '',
    ic_number: '',
    phone: '',
    email: '',
    nationality: '',
    gender: '',
    current_address: '',
  });

  // Photo management
  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [fullBodyPhotos, setFullBodyPhotos] = useState<(string | null)[]>([]);
  const [halfBodyPhotos, setHalfBodyPhotos] = useState<(string | null)[]>([null, null, null]);
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);

  // UI state
  const [showQRModal, setShowQRModal] = useState(false);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const { toast } = useToast();
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  // Validate token and load candidate data
  useEffect(() => {
    if (candidateId && secureToken) {
      validateTokenAndLoadData();
    } else {
      setError('Missing required parameters');
      setLoading(false);
    }
  }, [candidateId, secureToken]);

  // Calculate completion when data changes
  useEffect(() => {
    if (formData) {
      const completion = calculateProfileCompletion(formData);
      setProfileCompletion(completion);
    }
  }, [formData]);

  const validateTokenAndLoadData = async () => {
    try {
      setLoading(true);

      // Verify secure token
      const { data: tokenData, error: tokenError } = await supabase
        .from('secure_update_tokens')
        .select('*')
        .eq('candidate_id', candidateId)
        .eq('token', secureToken)
        .eq('is_active', true)
        .single();

      if (tokenError || !tokenData) {
        setError('Invalid or expired link');
        return;
      }

      // Check expiration
      if (new Date(tokenData.expires_at) < new Date()) {
        setError('This link has expired');
        return;
      }

      setIsAuthenticated(true);

      // Load candidate data
      const { data: candidateData, error: candidateError } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', candidateId)
        .single();

      if (candidateError || !candidateData) {
        setError('Failed to load profile');
        return;
      }

      setCandidate(candidateData);
      setFormData(candidateData);
      setProfilePhoto(candidateData.profile_photo || '');
      setFullBodyPhotos(candidateData.full_body_photos || []);
      setHalfBodyPhotos(candidateData.half_body_photos || [null, null, null]);

    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle form field changes with auto-formatting
  const handleFieldChange = (field: string, value: string) => {
    let formattedValue = value;

    // Apply auto-formatting
    if (field === 'ic_number') {
      formattedValue = formatICNumber(value);
    } else if (field === 'phone') {
      formattedValue = formatPhoneNumber(value);
    }

    setFormData({ ...formData, [field]: formattedValue });

    // Clear error for this field
    if (validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: '' });
    }
  };

  // Handle profile photo upload
  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto('profile');
    try {
      const result = await selectAndUploadProfilePicture(candidateId!, file);

      if (result.success && result.url) {
        setProfilePhoto(result.url);
        toast({
          title: 'Success',
          description: 'Profile photo updated successfully',
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload photo',
        variant: 'destructive',
      });
    } finally {
      setUploadingPhoto(null);
    }
  };

  // Handle document upload
  const handleDocumentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'full-body' | 'half-body',
    index?: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(`${type}-${index}`);
    try {
      const result = await uploadDocument(candidateId!, file, type, index);

      if (result.success && result.url) {
        if (type === 'full-body') {
          setFullBodyPhotos([...fullBodyPhotos, result.url]);
        } else if (type === 'half-body' && index !== undefined) {
          const newPhotos = [...halfBodyPhotos];
          newPhotos[index] = result.url;
          setHalfBodyPhotos(newPhotos);
        }

        toast({
          title: 'Success',
          description: 'Document uploaded successfully',
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload document',
        variant: 'destructive',
      });
    } finally {
      setUploadingPhoto(null);
    }
  };

  // Handle photo deletion
  const handleDeletePhoto = async (type: 'full-body' | 'half-body', indexOrUrl: number | string) => {
    try {
      let result;

      if (type === 'full-body' && typeof indexOrUrl === 'string') {
        result = await deleteFullBodyPhoto(candidateId!, indexOrUrl);
        if (result.success) {
          setFullBodyPhotos(fullBodyPhotos.filter(url => url !== indexOrUrl));
        }
      } else if (type === 'half-body' && typeof indexOrUrl === 'number') {
        result = await deleteHalfBodyPhoto(candidateId!, indexOrUrl);
        if (result.success) {
          const newPhotos = [...halfBodyPhotos];
          newPhotos[indexOrUrl] = null;
          setHalfBodyPhotos(newPhotos);
        }
      }

      if (result?.success) {
        toast({
          title: 'Success',
          description: 'Photo deleted successfully',
        });
      } else {
        throw new Error(result?.error);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete photo',
        variant: 'destructive',
      });
    }
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    // Validate data
    const validation = validateProfileData(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors before saving',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const { error: updateError } = await supabase
        .from('candidates')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', candidateId);

      if (updateError) throw updateError;

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <PublicPageWrapper>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-8">
            <div className="flex flex-col items-center space-y-4">
              <LoadingSpinner size="lg" />
              <p className="text-gray-600">Loading profile...</p>
            </div>
          </Card>
        </div>
      </PublicPageWrapper>
    );
  }

  // Error state
  if (error || !isAuthenticated) {
    return (
      <PublicPageWrapper>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-8">
            <div className="flex flex-col items-center space-y-4">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <h2 className="text-xl font-bold">Access Denied</h2>
              <p className="text-center text-gray-600">{error || 'Unauthorized access'}</p>
            </div>
          </Card>
        </div>
      </PublicPageWrapper>
    );
  }

  return (
    <PublicPageWrapper>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header with Profile Completion */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">Enhanced Profile</h1>
                <p className="text-gray-600">Update your information</p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowQRModal(true)}
                className="relative"
              >
                <QrCode className="h-5 w-5" />
                <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-500" />
              </Button>
            </div>

            {/* Profile Completion */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Profile Completion</span>
                <Badge
                  style={{ backgroundColor: getCompletionColor(profileCompletion) }}
                  className="text-white"
                >
                  {profileCompletion}% - {getCompletionText(profileCompletion)}
                </Badge>
              </div>
              <Progress value={profileCompletion} className="h-2" />
            </div>
          </motion.div>

          {/* Profile Photo Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Photo
              </CardTitle>
              <CardDescription>Upload your profile picture</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profilePhoto} />
                  <AvatarFallback>
                    <User className="h-12 w-12" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <input
                    ref={profilePhotoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePhotoUpload}
                    className="hidden"
                  />
                  <Button
                    onClick={() => profilePhotoInputRef.current?.click()}
                    disabled={uploadingPhoto === 'profile'}
                    className="gap-2"
                  >
                    {uploadingPhoto === 'profile' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4" />
                        Change Photo
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Required fields are marked with *</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name || ''}
                    onChange={(e) => handleFieldChange('full_name', e.target.value)}
                    placeholder="Enter your full name"
                    className={validationErrors.full_name ? 'border-red-500' : ''}
                  />
                  {validationErrors.full_name && (
                    <p className="text-sm text-red-500">{validationErrors.full_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ic_number">IC Number *</Label>
                  <div className="relative">
                    <Input
                      id="ic_number"
                      value={formData.ic_number || ''}
                      onChange={(e) => handleFieldChange('ic_number', e.target.value)}
                      placeholder="YYMMDD-XX-XXXX"
                      className={validationErrors.ic_number ? 'border-red-500' : ''}
                    />
                    {validateICNumber(formData.ic_number) && (
                      <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{getFieldHint('ic_number')}</p>
                  {validationErrors.ic_number && (
                    <p className="text-sm text-red-500">{validationErrors.ic_number}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      value={formData.phone || ''}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      placeholder="60X-XXXX-XXXX"
                      className={validationErrors.phone ? 'border-red-500' : ''}
                    />
                    {validatePhone(formData.phone) && (
                      <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{getFieldHint('phone')}</p>
                  {validationErrors.phone && (
                    <p className="text-sm text-red-500">{validationErrors.phone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      placeholder="your.email@example.com"
                      className={validationErrors.email ? 'border-red-500' : ''}
                    />
                    {validateEmail(formData.email) && (
                      <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                    )}
                  </div>
                  {validationErrors.email && (
                    <p className="text-sm text-red-500">{validationErrors.email}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Photos Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Document Photos
              </CardTitle>
              <CardDescription>Upload full body and half body photos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Full Body Photos */}
              <div className="space-y-3">
                <Label>Full Body Photos</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {fullBodyPhotos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-lg border-2 border-dashed border-gray-300 overflow-hidden">
                        {photo ? (
                          <>
                            <img src={photo} alt={`Full body ${index + 1}`} className="w-full h-full object-cover" />
                            <Button
                              size="icon"
                              variant="destructive"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleDeletePhoto('full-body', photo)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  ))}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleDocumentUpload(e, 'full-body')}
                      className="hidden"
                      id="full-body-upload"
                    />
                    <label
                      htmlFor="full-body-upload"
                      className="aspect-square flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <Upload className="h-8 w-8 text-gray-400" />
                      <span className="text-sm text-gray-600 mt-2">Add Photo</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Half Body Photos */}
              <div className="space-y-3">
                <Label>Half Body Photos (Up to 3)</Label>
                <div className="grid grid-cols-3 gap-4">
                  {halfBodyPhotos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-lg border-2 border-dashed border-gray-300 overflow-hidden">
                        {photo ? (
                          <>
                            <img src={photo} alt={`Half body ${index + 1}`} className="w-full h-full object-cover" />
                            <Button
                              size="icon"
                              variant="destructive"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleDeletePhoto('half-body', index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleDocumentUpload(e, 'half-body', index)}
                              className="hidden"
                              id={`half-body-upload-${index}`}
                            />
                            <label
                              htmlFor={`half-body-upload-${index}`}
                              className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"
                            >
                              <Upload className="h-6 w-6 text-gray-400" />
                              <span className="text-xs text-gray-600 mt-1">Upload</span>
                            </label>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Photos are stored securely and help employers get a better understanding of your profile.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-end gap-4"
          >
            <Button
              size="lg"
              onClick={handleSaveProfile}
              disabled={saving}
              className="gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Save Changes
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </div>

      {/* QR Code Modal */}
      <QRCodeModalWeb
        open={showQRModal}
        onOpenChange={setShowQRModal}
        profileData={{
          id: candidateId!,
          fullName: formData.full_name || '',
          phone: formData.phone || '',
          email: formData.email || '',
          icNumber: formData.ic_number || '',
        }}
      />
    </PublicPageWrapper>
  );
}
