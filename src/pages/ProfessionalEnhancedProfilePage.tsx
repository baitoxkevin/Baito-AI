/**
 * Professional Enhanced Candidate Profile Page
 *
 * Design System Applied:
 * - Color Layering: gray-100 → gray-50 → white → gray-50 (4 shades)
 * - Two-Layer Shadows: inset highlights + outer shadows
 * - 60-30-10 Color Rule: 60% neutrals, 30% supporting, 10% accent
 * - Responsive Breathing Layout
 *
 * Features:
 * - Secure token authentication
 * - Smart validation with auto-formatting
 * - Profile completion tracking
 * - QR code profile sharing
 * - JSONB array photo management
 * - Activity logging
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { PublicPageWrapper } from '@/components/PublicPageWrapper';
import QRCodeModalWeb from '@/components/QRCodeModalWeb';
import {
  User, MapPin, Camera, Briefcase, CreditCard, ArrowLeft, CheckCircle,
  QrCode, Sparkles, Loader2, AlertCircle, Upload, Trash2, Info, X
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
  validateProfileData
} from '@/lib/validation-enhanced';
import {
  selectAndUploadProfilePicture,
  uploadDocument,
  deleteFullBodyPhoto,
  deleteHalfBodyPhoto
} from '@/lib/image-upload-service-enhanced';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function ProfessionalEnhancedProfilePage() {
  const { candidateId } = useParams();
  const [searchParams] = useSearchParams();
  const secureToken = searchParams.get('secure_token');

  // State management
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  // Form data
  const [formData, setFormData] = useState<any>({
    full_name: '',
    ic_number: '',
    phone: '',
    email: '',
    nationality: '',
    gender: '',
    race: '',
    shirt_size: '',
    current_address: '',
    transport_type: '',
    vehicle_type: '',
    emergency_contact_name: '',
    emergency_relationship: '',
    emergency_contact_number: '',
    highest_education: '',
    field_of_study: '',
    work_experience: '',
    account_name: '',
    bank_name: '',
    account_number: '',
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

  // Tab configuration
  const tabs = [
    { id: 'info', label: 'Info', icon: User },
    { id: 'addr', label: 'Address', icon: MapPin },
    { id: 'pics', label: 'Photos', icon: Camera },
    { id: 'skills', label: 'Skills', icon: Briefcase },
    { id: 'bank', label: 'Bank', icon: CreditCard },
  ];

  // Load candidate data
  useEffect(() => {
    if (candidateId && secureToken) {
      validateTokenAndLoadData();
    } else {
      setError('Missing required parameters');
      setLoading(false);
    }
  }, [candidateId, secureToken]);

  // Calculate completion
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

      if (tokenError || !tokenData || new Date(tokenData.expires_at) < new Date()) {
        setError('Invalid or expired link');
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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle field changes with auto-formatting
  const handleFieldChange = (field: string, value: string) => {
    let formattedValue = value;

    if (field === 'ic_number') {
      formattedValue = formatICNumber(value);
    } else if (field === 'phone' || field === 'emergency_contact_number') {
      formattedValue = formatPhoneNumber(value);
    }

    setFormData({ ...formData, [field]: formattedValue });

    if (validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: '' });
    }
  };

  // Photo upload handlers
  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto('profile');
    try {
      const result = await selectAndUploadProfilePicture(candidateId!, file);
      if (result.success && result.url) {
        setProfilePhoto(result.url);
        toast({ title: 'Success', description: 'Profile photo updated' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setUploadingPhoto(null);
    }
  };

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
        toast({ title: 'Success', description: 'Document uploaded' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setUploadingPhoto(null);
    }
  };

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
        toast({ title: 'Success', description: 'Photo deleted' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // Save profile
  const handleSaveProfile = async () => {
    const validation = validateProfileData(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      toast({ title: 'Validation Error', description: 'Please fix errors', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const { error: updateError } = await supabase
        .from('candidates')
        .update({ ...formData, updated_at: new Date().toISOString() })
        .eq('id', candidateId);

      if (updateError) throw updateError;
      toast({ title: 'Success', description: 'Profile updated successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <PublicPageWrapper>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="flex flex-col items-center space-y-4">
              <LoadingSpinner size="lg" />
              <p className="text-gray-600">Loading profile...</p>
            </div>
          </div>
        </div>
      </PublicPageWrapper>
    );
  }

  // Render error state
  if (error || !isAuthenticated) {
    return (
      <PublicPageWrapper>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="flex flex-col items-center space-y-4">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <h2 className="text-xl font-bold">Access Denied</h2>
              <p className="text-center text-gray-600">{error || 'Unauthorized access'}</p>
            </div>
          </div>
        </div>
      </PublicPageWrapper>
    );
  }

  return (
    <PublicPageWrapper>
      <div className="max-w-2xl mx-auto min-h-screen bg-gray-100">
        {/* Professional Header with Two-Layer Shadow */}
        <div
          className="bg-black pt-8 pb-6 px-6"
          style={{
            boxShadow: '0 10px 25px rgba(0,0,0,0.3), 0 6px 12px rgba(0,0,0,0.2)'
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => window.history.back()}
              className="text-white hover:opacity-80 transition-opacity"
            >
              <ArrowLeft size={28} />
            </button>
            <h1 className="text-white text-xl font-semibold">Enhanced Profile</h1>
            <button
              onClick={() => setShowQRModal(true)}
              className="text-white hover:opacity-80 transition-opacity relative"
            >
              <QrCode size={28} />
              <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-400" />
            </button>
          </div>

          {/* Profile Picture with Professional Shadow */}
          <div className="text-center">
            <div className="relative inline-block">
              <div
                className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden"
                style={{
                  boxShadow: '0 10px 25px rgba(0,0,0,0.3), 0 6px 12px rgba(0,0,0,0.2)'
                }}
              >
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={64} className="text-gray-400" />
                )}
              </div>
              <input
                ref={profilePhotoInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePhotoUpload}
                className="hidden"
              />
              <button
                onClick={() => profilePhotoInputRef.current?.click()}
                disabled={uploadingPhoto === 'profile'}
                className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50"
                style={{
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 12px rgba(0,0,0,0.15)'
                }}
              >
                {uploadingPhoto === 'profile' ? (
                  <Loader2 size={20} className="text-black animate-spin" />
                ) : (
                  <Camera size={20} className="text-black" />
                )}
              </button>
            </div>
            <h2 className="text-white text-2xl font-bold mt-4">
              {formData.full_name || 'Guest User'}
            </h2>
            <div className="flex items-center justify-center gap-2 mt-2">
              <div
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: getCompletionColor(profileCompletion),
                  color: 'white'
                }}
              >
                {profileCompletion}% Complete
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation with Color Layering */}
        <div
          className="bg-gray-50 border-b border-gray-200 overflow-x-auto"
          style={{
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <div className="flex min-w-max px-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 border-b-2 transition-all ${
                    activeTab === tab.id
                      ? 'border-black bg-white'
                      : 'border-transparent hover:bg-gray-100'
                  }`}
                  style={activeTab === tab.id ? {
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  } : {}}
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      size={20}
                      className={activeTab === tab.id ? 'text-black' : 'text-gray-500'}
                    />
                    <span
                      className={`text-base ${
                        activeTab === tab.id ? 'text-black font-semibold' : 'text-gray-500'
                      }`}
                    >
                      {tab.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="pb-6">
          {activeTab === 'info' && (
            <InfoTab
              formData={formData}
              handleFieldChange={handleFieldChange}
              validationErrors={validationErrors}
            />
          )}
          {activeTab === 'addr' && (
            <AddressTab
              formData={formData}
              handleFieldChange={handleFieldChange}
            />
          )}
          {activeTab === 'pics' && (
            <PhotosTab
              fullBodyPhotos={fullBodyPhotos}
              halfBodyPhotos={halfBodyPhotos}
              uploadingPhoto={uploadingPhoto}
              handleDocumentUpload={handleDocumentUpload}
              handleDeletePhoto={handleDeletePhoto}
            />
          )}
          {activeTab === 'skills' && (
            <SkillsTab
              formData={formData}
              handleFieldChange={handleFieldChange}
            />
          )}
          {activeTab === 'bank' && (
            <BankTab
              formData={formData}
              handleFieldChange={handleFieldChange}
            />
          )}
        </div>

        {/* Professional Save Button */}
        <div
          className="sticky bottom-0 px-6 pb-8 pt-4 bg-white border-t border-gray-200"
          style={{
            boxShadow: '0 -4px 12px rgba(0,0,0,0.1)'
          }}
        >
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="w-full bg-black rounded-full py-4 flex items-center justify-center gap-2 hover:scale-105 transition-transform disabled:opacity-50"
            style={{
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 16px rgba(0,0,0,0.2)'
            }}
          >
            {saving ? (
              <>
                <Loader2 size={24} className="text-white animate-spin" />
                <span className="text-white text-lg font-semibold">Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle size={24} className="text-white" />
                <span className="text-white text-lg font-semibold">Save All Changes</span>
              </>
            )}
          </button>
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

// Info Tab Component
function InfoTab({ formData, handleFieldChange, validationErrors }: any) {
  return (
    <div className="p-6 space-y-5">
      {/* Personal Details Card */}
      <div
        className="bg-white rounded-2xl p-6"
        style={{
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <h3 className="text-lg font-bold text-gray-900 mb-5">Personal Details</h3>

        {/* Full Name */}
        <div className="mb-5">
          <label className="block text-sm text-gray-600 mb-2 font-medium">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
            value={formData.full_name || ''}
            onChange={(e) => handleFieldChange('full_name', e.target.value)}
          />
          {validationErrors.full_name && (
            <p className="text-sm text-red-500 mt-1">{validationErrors.full_name}</p>
          )}
        </div>

        {/* IC Number with Auto-Formatting */}
        <div className="mb-5">
          <label className="block text-sm text-gray-600 mb-2 font-medium">
            IC Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
              placeholder="YYMMDD-XX-XXXX"
              value={formData.ic_number || ''}
              onChange={(e) => handleFieldChange('ic_number', e.target.value)}
            />
            {validateICNumber(formData.ic_number) && (
              <CheckCircle className="absolute right-3 top-3 h-5 w-5 text-green-500" />
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">Format: YYMMDD-XX-XXXX</p>
          {validationErrors.ic_number && (
            <p className="text-sm text-red-500 mt-1">{validationErrors.ic_number}</p>
          )}
        </div>

        {/* Gender and Race */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-sm text-gray-600 mb-2 font-medium">
              Gender <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
              value={formData.gender || ''}
              onChange={(e) => handleFieldChange('gender', e.target.value)}
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2 font-medium">Race</label>
            <select
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
              value={formData.race || ''}
              onChange={(e) => handleFieldChange('race', e.target.value)}
            >
              <option value="">Select race</option>
              <option value="Malay">Malay</option>
              <option value="Chinese">Chinese</option>
              <option value="Indian">Indian</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contact Card */}
      <div
        className="bg-white rounded-2xl p-6"
        style={{
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <h3 className="text-lg font-bold text-gray-900 mb-5">Contact</h3>

        {/* Phone with Auto-Formatting */}
        <div className="mb-5">
          <label className="block text-sm text-gray-600 mb-2 font-medium">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="tel"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
              placeholder="60X-XXXX-XXXX"
              value={formData.phone || ''}
              onChange={(e) => handleFieldChange('phone', e.target.value)}
            />
            {validatePhone(formData.phone) && (
              <CheckCircle className="absolute right-3 top-3 h-5 w-5 text-green-500" />
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">Format: 60X-XXXX-XXXX</p>
        </div>

        {/* Email */}
        <div className="mb-0">
          <label className="block text-sm text-gray-600 mb-2 font-medium">
            Email <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="email"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
              placeholder="your.email@example.com"
              value={formData.email || ''}
              onChange={(e) => handleFieldChange('email', e.target.value)}
            />
            {validateEmail(formData.email) && (
              <CheckCircle className="absolute right-3 top-3 h-5 w-5 text-green-500" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Address Tab Component
function AddressTab({ formData, handleFieldChange }: any) {
  return (
    <div className="p-6 space-y-5">
      <div
        className="bg-white rounded-2xl p-6"
        style={{
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <h3 className="text-lg font-bold text-gray-900 mb-5">Address & Transport</h3>

        {/* Current Address */}
        <div className="mb-5">
          <label className="block text-sm text-gray-600 mb-2 font-medium">
            Current Address
          </label>
          <textarea
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
            rows={3}
            value={formData.current_address || ''}
            onChange={(e) => handleFieldChange('current_address', e.target.value)}
          />
        </div>

        {/* Transport Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-2 font-medium">
              Transport Type
            </label>
            <select
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
              value={formData.transport_type || ''}
              onChange={(e) => handleFieldChange('transport_type', e.target.value)}
            >
              <option value="">Select</option>
              <option value="I have own vehicle">Own Vehicle</option>
              <option value="Public Transport">Public Transport</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2 font-medium">
              Vehicle Type
            </label>
            <select
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
              value={formData.vehicle_type || ''}
              onChange={(e) => handleFieldChange('vehicle_type', e.target.value)}
            >
              <option value="">Select</option>
              <option value="Car">Car</option>
              <option value="Motorcycle">Motorcycle</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// Photos Tab Component
function PhotosTab({ fullBodyPhotos, halfBodyPhotos, uploadingPhoto, handleDocumentUpload, handleDeletePhoto }: any) {
  return (
    <div className="p-6 space-y-5">
      {/* Full Body Photos */}
      <div
        className="bg-white rounded-2xl p-6"
        style={{
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <h3 className="text-lg font-bold text-gray-900 mb-5">Full Body Photos</h3>
        <div className="grid grid-cols-2 gap-4">
          {fullBodyPhotos.map((photo: string | null, index: number) => (
            photo && (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-50">
                  <img src={photo} alt={`Full body ${index + 1}`} className="w-full h-full object-cover" />
                </div>
                <button
                  onClick={() => handleDeletePhoto('full-body', photo)}
                  className="absolute top-2 right-2 p-2 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}
                >
                  <Trash2 size={16} className="text-white" />
                </button>
              </div>
            )
          ))}
          <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-black hover:bg-gray-50 transition-all">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleDocumentUpload(e, 'full-body')}
              className="hidden"
            />
            <Upload size={32} className="text-gray-400" />
            <span className="text-sm text-gray-600 mt-2">Add Photo</span>
          </label>
        </div>
      </div>

      {/* Half Body Photos */}
      <div
        className="bg-white rounded-2xl p-6"
        style={{
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <h3 className="text-lg font-bold text-gray-900 mb-5">Half Body Photos (Up to 3)</h3>
        <div className="grid grid-cols-3 gap-4">
          {halfBodyPhotos.map((photo: string | null, index: number) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-50 border border-gray-200">
                {photo ? (
                  <>
                    <img src={photo} alt={`Half body ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleDeletePhoto('half-body', index)}
                      className="absolute top-2 right-2 p-2 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                      }}
                    >
                      <Trash2 size={14} className="text-white" />
                    </button>
                  </>
                ) : (
                  <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleDocumentUpload(e, 'half-body', index)}
                      className="hidden"
                    />
                    <Upload size={24} className="text-gray-400" />
                    <span className="text-xs text-gray-600 mt-1">Upload</span>
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Skills Tab Component
function SkillsTab({ formData, handleFieldChange }: any) {
  return (
    <div className="p-6 space-y-5">
      <div
        className="bg-white rounded-2xl p-6"
        style={{
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <h3 className="text-lg font-bold text-gray-900 mb-5">Education & Experience</h3>

        {/* Education */}
        <div className="mb-5">
          <label className="block text-sm text-gray-600 mb-2 font-medium">
            Highest Education
          </label>
          <select
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
            value={formData.highest_education || ''}
            onChange={(e) => handleFieldChange('highest_education', e.target.value)}
          >
            <option value="">Select</option>
            <option value="Primary">Primary</option>
            <option value="Secondary">Secondary</option>
            <option value="Diploma">Diploma</option>
            <option value="Degree">Degree</option>
            <option value="Master">Master</option>
          </select>
        </div>

        {/* Work Experience */}
        <div className="mb-0">
          <label className="block text-sm text-gray-600 mb-2 font-medium">
            Work Experience
          </label>
          <textarea
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
            rows={4}
            value={formData.work_experience || ''}
            onChange={(e) => handleFieldChange('work_experience', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

// Bank Tab Component
function BankTab({ formData, handleFieldChange }: any) {
  return (
    <div className="p-6 space-y-5">
      <div
        className="bg-white rounded-2xl p-6"
        style={{
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <h3 className="text-lg font-bold text-gray-900 mb-5">Bank Details</h3>

        {/* Account Name */}
        <div className="mb-5">
          <label className="block text-sm text-gray-600 mb-2 font-medium">
            Account Name
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
            value={formData.account_name || ''}
            onChange={(e) => handleFieldChange('account_name', e.target.value)}
          />
        </div>

        {/* Bank Name */}
        <div className="mb-5">
          <label className="block text-sm text-gray-600 mb-2 font-medium">
            Bank Name
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
            value={formData.bank_name || ''}
            onChange={(e) => handleFieldChange('bank_name', e.target.value)}
          />
        </div>

        {/* Account Number */}
        <div className="mb-0">
          <label className="block text-sm text-gray-600 mb-2 font-medium">
            Account Number
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
            value={formData.account_number || ''}
            onChange={(e) => handleFieldChange('account_number', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
