import { useState, useEffect } from 'react';
import { Camera, Sparkles, QrCode, MapPin, Mail, Phone, User, Briefcase, GraduationCap, Building2, CreditCard, Trash2, Upload, CheckCircle } from 'lucide-react';
import QRCodeModal from './components/QRCodeModal';
import { useToast } from './hooks/use-toast';
import {
  formatICNumber,
  formatPhoneNumber,
  validateICNumber,
  validateEmail,
  validatePhone,
  calculateProfileCompletion,
  getCompletionColor
} from './lib/validation';

// Mock data for testing
const mockCandidateData = {
  id: 'test-candidate-123',
  full_name: 'Sarah Chen',
  nationality: 'Malaysian',
  ic_number: '950815-10-5678',
  gender: 'Female',
  race: 'Chinese',
  passport_number: '',
  phone: '6012-345-6789',
  email: 'sarah.chen@example.com',
  date_of_birth: '1995-08-15',
  address: '123 Jalan Bukit Bintang',
  city: 'Kuala Lumpur',
  state: 'WP Kuala Lumpur',
  postcode: '50200',
  country: 'Malaysia',
  business_address: '456 Jalan Sultan Ismail, KL',
  transport_modes: ['Own Transport'],
  vehicle_types: ['Car'],
  emergency_contact_name: 'John Chen',
  emergency_contact_number: '6019-876-5432',
  emergency_contact_relationship: 'Father',
  full_body_photos: [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400'
  ],
  half_body_photos: [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400'
  ],
  education_level: "Bachelor's Degree",
  field_of_study: 'Business Administration',
  years_of_experience: '5',
  previous_roles: 'Event Coordinator, Marketing Assistant',
  skills: 'Project Management, Customer Service, Microsoft Office',
  languages: 'English, Malay, Mandarin',
  shirt_size: 'M',
  bank_name: 'Maybank',
  bank_account_number: '1234567890123',
  bank_account_holder_name: 'Sarah Chen',
  not_own_account: false,
  bank_account_relationship: '',
  profile_photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200'
};

export default function ProfessionalProfileTestPage() {
  const [formData, setFormData] = useState(mockCandidateData);
  const [activeTab, setActiveTab] = useState('info');
  const [showQRModal, setShowQRModal] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{show: boolean; type?: 'full-body' | 'half-body'; url?: string}>({show: false});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // Calculate profile completion on data change
  useEffect(() => {
    const completion = calculateProfileCompletion(formData);
    setProfileCompletion(completion);
  }, [formData]);

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [formData]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Keyboard navigation for tabs
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.altKey) {
        const tabIds = ['info', 'address', 'photos', 'skills', 'bank'];
        const currentIndex = tabIds.indexOf(activeTab);

        if (e.key === 'ArrowRight' && currentIndex < tabIds.length - 1) {
          e.preventDefault();
          setActiveTab(tabIds[currentIndex + 1]);
        } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
          e.preventDefault();
          setActiveTab(tabIds[currentIndex - 1]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [activeTab]);

  // Handle field changes with auto-formatting
  const handleFieldChange = (field: string, value: any) => {
    let formattedValue = value;

    // Auto-format IC numbers (YYMMDD-XX-XXXX)
    if (field === 'ic_number') {
      formattedValue = formatICNumber(value);
    }
    // Auto-format phone numbers (60X-XXXX-XXXX)
    else if (field === 'phone' || field === 'emergency_contact_number') {
      formattedValue = formatPhoneNumber(value);
    }

    setFormData({ ...formData, [field]: formattedValue });
  };

  // Handle checkbox array changes (for multiple selections)
  const handleArrayFieldToggle = (field: string, value: string) => {
    const currentArray = formData[field] || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter((item: string) => item !== value)
      : [...currentArray, value];
    setFormData({ ...formData, [field]: newArray });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Required field validation
    if (!formData.full_name) errors.full_name = 'Full name is required';
    if (!formData.nationality) errors.nationality = 'Nationality is required';
    if (!formData.ic_number) errors.ic_number = 'IC number is required';
    if (!validateICNumber(formData.ic_number)) errors.ic_number = 'Invalid IC number format';
    if (!formData.gender) errors.gender = 'Gender is required';
    if (!formData.date_of_birth) errors.date_of_birth = 'Date of birth is required';
    if (!formData.phone) errors.phone = 'Phone number is required';
    if (!validatePhone(formData.phone)) errors.phone = 'Invalid phone number format';
    if (!formData.email) errors.email = 'Email is required';
    if (!validateEmail(formData.email)) errors.email = 'Invalid email format';
    if (!formData.emergency_contact_relationship) errors.emergency_contact_relationship = 'Emergency contact relationship is required';
    if (!formData.address) errors.address = 'Street address is required';
    if (!formData.city) errors.city = 'City is required';
    if (!formData.state) errors.state = 'State is required';
    if (!formData.postcode) errors.postcode = 'Postcode is required';
    if (!formData.country) errors.country = 'Country is required';
    if (!formData.bank_name) errors.bank_name = 'Bank name is required';
    if (!formData.bank_account_number) errors.bank_account_number = 'Account number is required';
    if (!formData.bank_account_holder_name) errors.bank_account_holder_name = 'Account holder name is required';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields correctly',
        variant: 'destructive',
      });
      // Navigate to first tab with error
      if (validationErrors.full_name || validationErrors.nationality || validationErrors.ic_number || validationErrors.gender || validationErrors.date_of_birth || validationErrors.phone || validationErrors.email || validationErrors.emergency_contact_relationship) {
        setActiveTab('info');
      } else if (validationErrors.address || validationErrors.city || validationErrors.state || validationErrors.postcode || validationErrors.country) {
        setActiveTab('address');
      } else if (validationErrors.bank_name || validationErrors.bank_account_number || validationErrors.bank_account_holder_name) {
        setActiveTab('bank');
      }
      return;
    }

    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    setHasUnsavedChanges(false);

    toast({
      title: 'Success',
      description: 'Profile updated successfully (Test Mode)',
    });
  };

  const handlePhotoUpload = (type: 'full-body' | 'half-body') => {
    toast({
      title: 'Test Mode',
      description: 'Photo upload disabled in test mode',
    });
  };

  const handleDeletePhotoConfirm = () => {
    if (!showDeleteConfirm.type || !showDeleteConfirm.url) return;

    if (showDeleteConfirm.type === 'full-body') {
      const newPhotos = formData.full_body_photos.filter((p: string) => p !== showDeleteConfirm.url);
      setFormData({ ...formData, full_body_photos: newPhotos });
    } else {
      const newPhotos = formData.half_body_photos.filter((p: string) => p !== showDeleteConfirm.url);
      setFormData({ ...formData, half_body_photos: newPhotos });
    }

    setShowDeleteConfirm({show: false});
    toast({
      title: 'Success',
      description: 'Photo removed',
    });
  };

  const handleDeletePhoto = (type: 'full-body' | 'half-body', photoUrl: string) => {
    setShowDeleteConfirm({show: true, type, url: photoUrl});
  };

  const tabs = [
    { id: 'info', label: 'Personal Info', icon: User },
    { id: 'address', label: 'Address', icon: MapPin },
    { id: 'photos', label: 'Photos', icon: Camera },
    { id: 'skills', label: 'Skills & Edu', icon: GraduationCap },
    { id: 'bank', label: 'Bank Details', icon: CreditCard },
  ];

  return (
    <div
      className="min-h-screen w-full"
      style={{
        backgroundColor: '#e5e7eb',
        backgroundImage: `
          radial-gradient(circle at 25% 25%, #d1d5db 0%, transparent 50%),
          radial-gradient(circle at 75% 75%, #d1d5db 0%, transparent 50%)
        `
      }}
    >
      {/* Container: Full width on mobile, max-width with auto margins on desktop for visible gray sides */}
      <div className="w-full lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl mx-auto lg:px-8 xl:px-12 2xl:px-16">
        {/* Content wrapper with vertical spacing */}
        <div className="lg:py-8">
          {/* Professional Header with Two-Layer Shadow */}
          <div
            className="bg-black lg:rounded-t-2xl pt-8 pb-6 px-4 sm:px-6 lg:px-8"
            style={{
              boxShadow: '0 10px 25px rgba(0,0,0,0.3), 0 6px 12px rgba(0,0,0,0.2)'
            }}
          >
          <div className="max-w-2xl mx-auto">
            {/* Test Mode Banner */}
            <div className="mb-4 bg-yellow-500 text-black px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <Sparkles size={16} />
              TEST MODE - No Authentication Required
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Profile Photo with Professional Shadow */}
                <div
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gray-100 overflow-hidden flex-shrink-0"
                  style={{
                    boxShadow: '0 10px 25px rgba(0,0,0,0.3), 0 6px 12px rgba(0,0,0,0.2)'
                  }}
                >
                  {formData.profile_photo ? (
                    <img src={formData.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <Camera size={32} className="text-gray-400" />
                    </div>
                  )}
                </div>

                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                    {formData.full_name}
                  </h1>
                  <div className="flex items-center gap-3">
                    <div
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: getCompletionColor(profileCompletion),
                        color: 'white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                      }}
                    >
                      {profileCompletion}% Complete
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Code Button */}
              <button
                onClick={() => setShowQRModal(true)}
                className="p-3 bg-white rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
                style={{
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}
              >
                <QrCode size={24} className="text-black" />
              </button>
            </div>
          </div>
        </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-gray-700">
            <div
              className="h-full transition-all duration-700 ease-out"
              style={{
                width: `${profileCompletion}%`,
                backgroundColor: getCompletionColor(profileCompletion),
                boxShadow: `0 0 10px ${getCompletionColor(profileCompletion)}40`
              }}
            />
          </div>

          {/* Tab Navigation with Color Layering */}
          <div
            className="bg-gray-50 lg:border-x border-t lg:border-t-0 border-gray-200"
            style={{
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
          <div className="max-w-2xl mx-auto px-4 sm:px-6 overflow-x-auto">
            <div className="flex justify-center gap-1 min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'text-black border-b-2 border-black bg-white'
                      : 'text-gray-600 hover:text-black'
                  }`}
                  style={activeTab === tab.id ? {
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  } : {}}
                >
                  <tab.icon size={16} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

          {/* Content Area - Scrollable with white background */}
          <div className="bg-white lg:rounded-b-2xl px-4 sm:px-6 lg:px-8 py-6 pb-32 lg:border-x border-b border-gray-200">
          <div className="max-w-2xl mx-auto">
          {activeTab === 'info' && <InfoTab formData={formData} handleFieldChange={handleFieldChange} />}
          {activeTab === 'address' && <AddressTab formData={formData} handleFieldChange={handleFieldChange} handleArrayFieldToggle={handleArrayFieldToggle} />}
          {activeTab === 'photos' && (
            <PhotosTab
              fullBodyPhotos={formData.full_body_photos}
              halfBodyPhotos={formData.half_body_photos}
              uploadingPhoto={uploadingPhoto}
              handlePhotoUpload={handlePhotoUpload}
              handleDeletePhoto={handleDeletePhoto}
            />
          )}
          {activeTab === 'skills' && <SkillsTab formData={formData} handleFieldChange={handleFieldChange} />}
          {activeTab === 'bank' && <BankTab formData={formData} handleFieldChange={handleFieldChange} />}
          </div>
          </div>
        </div>
      </div>

      {/* Save Button - Fixed at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-4 px-4 sm:px-6 lg:px-8 z-20" style={{ boxShadow: '0 -4px 12px rgba(0,0,0,0.1)' }}>
          <div className="w-full lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl mx-auto lg:px-8 xl:px-12 2xl:px-16">
            <div className="max-w-2xl mx-auto flex flex-col gap-2">
            {hasUnsavedChanges && (
              <p className="text-xs text-orange-600 text-center">You have unsaved changes</p>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-black text-white rounded-full py-4 font-semibold hover:scale-105 transition-transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 16px rgba(0,0,0,0.2)'
              }}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Save Changes (Test Mode)
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 text-center">Alt + Arrow keys to navigate tabs</p>
            </div>
          </div>
        </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 className="text-xl font-bold mb-2">Delete Photo?</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this photo? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm({show: false})}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePhotoConfirm}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      <QRCodeModal
        open={showQRModal}
        onOpenChange={setShowQRModal}
        profileData={{
          id: formData.id,
          fullName: formData.full_name,
          phone: formData.phone,
          email: formData.email,
          icNumber: formData.ic_number,
        }}
      />
    </div>
  );
}

function InfoTab({ formData, handleFieldChange }: any) {
  return (
    <div className="space-y-6">
      {/* Personal Details Card */}
      <div
        className="bg-white rounded-2xl p-6 border border-gray-200"
        style={{
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <User size={20} />
          Personal Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">Full Name <span className="text-red-500">*</span></label>
            <input
              id="full_name"
              type="text"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
              value={formData.full_name || ''}
              onChange={(e) => handleFieldChange('full_name', e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="nationality" className="block text-sm font-medium text-gray-700 mb-2">Nationality <span className="text-red-500">*</span></label>
            <select id="nationality"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
              value={formData.nationality || ''}
              onChange={(e) => handleFieldChange('nationality', e.target.value)}
            >
              <option value="">Select Nationality</option>
              <option value="Malaysian">Malaysian</option>
              <option disabled>─────────────</option>
              <option value="Singaporean">Singaporean</option>
              <option value="Indonesian">Indonesian</option>
              <option value="Thai">Thai</option>
              <option value="Filipino">Filipino</option>
              <option value="Vietnamese">Vietnamese</option>
              <option value="Bruneian">Bruneian</option>
              <option value="Myanmar">Myanmar</option>
              <option value="Cambodian">Cambodian</option>
              <option value="Laotian">Laotian</option>
              <option disabled>─────────────</option>
              <option value="Chinese">Chinese</option>
              <option value="Indian">Indian</option>
              <option value="Bangladeshi">Bangladeshi</option>
              <option value="Pakistani">Pakistani</option>
              <option value="Sri Lankan">Sri Lankan</option>
              <option value="Nepalese">Nepalese</option>
              <option disabled>─────────────</option>
              <option value="Australian">Australian</option>
              <option value="British">British</option>
              <option value="American">American</option>
              <option value="Canadian">Canadian</option>
              <option value="Japanese">Japanese</option>
              <option value="Korean">Korean</option>
              <option value="French">French</option>
              <option value="German">German</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="ic_number" className="block text-sm font-medium text-gray-700 mb-2">IC Number <span className="text-red-500">*</span></label>
            <div className="relative">
              <input id="ic_number"
                type="text"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
                placeholder="YYMMDD-XX-XXXX"
                value={formData.ic_number || ''}
                onChange={(e) => handleFieldChange('ic_number', e.target.value)}
              />
              {validateICNumber(formData.ic_number) && (
                <CheckCircle className="absolute right-3 top-3 h-5 w-5 text-green-500" />
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Auto-formats as you type</p>
          </div>
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">Gender <span className="text-red-500">*</span></label>
            <select id="gender"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
              value={formData.gender || ''}
              onChange={(e) => handleFieldChange('gender', e.target.value)}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div>
            <label htmlFor="race" className="block text-sm font-medium text-gray-700 mb-2">Race</label>
            <select id="race"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
              value={formData.race || ''}
              onChange={(e) => handleFieldChange('race', e.target.value)}
            >
              <option value="">Select Race</option>
              <option value="Malay">Malay</option>
              <option value="Chinese">Chinese</option>
              <option value="Indian">Indian</option>
              <option value="Bumiputera">Bumiputera</option>
              <option value="Others">Others</option>
            </select>
          </div>
          <div>
            <label htmlFor="passport_number" className="block text-sm font-medium text-gray-700 mb-2">Passport Number (Optional)</label>
            <input id="passport_number"
              type="text"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
              placeholder="For non-Malaysians"
              value={formData.passport_number || ''}
              onChange={(e) => handleFieldChange('passport_number', e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-2">Date of Birth <span className="text-red-500">*</span></label>
            <input id="date_of_birth"
              type="date"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
              value={formData.date_of_birth || ''}
              onChange={(e) => handleFieldChange('date_of_birth', e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="shirt_size" className="block text-sm font-medium text-gray-700 mb-2">Shirt Size</label>
            <select id="shirt_size"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
              value={formData.shirt_size || ''}
              onChange={(e) => handleFieldChange('shirt_size', e.target.value)}
            >
              <option value="">Select Size</option>
              <option value="XS">XS</option>
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
              <option value="XXL">XXL</option>
              <option value="XXXL">XXXL</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contact Card */}
      <div
        className="bg-white rounded-2xl p-6 border border-gray-200"
        style={{
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Phone size={20} />
          Contact Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">Phone Number <span className="text-red-500">*</span></label>
            <div className="relative">
              <input id="phone"
                type="tel"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
                placeholder="60X-XXXX-XXXX"
                value={formData.phone || ''}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
              />
              {validatePhone(formData.phone) && (
                <CheckCircle className="absolute right-3 top-3 h-5 w-5 text-green-500" />
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Auto-formats as you type</p>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email <span className="text-red-500">*</span></label>
            <div className="relative">
              <input id="email"
                type="email"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
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
          <div>
            <label htmlFor="emergency_contact_name" className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Name</label>
            <input id="emergency_contact_name"
              type="text"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
              value={formData.emergency_contact_name || ''}
              onChange={(e) => handleFieldChange('emergency_contact_name', e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="emergency_contact_number" className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Number</label>
            <div className="relative">
              <input id="emergency_contact_number"
                type="tel"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
                placeholder="60X-XXXX-XXXX"
                value={formData.emergency_contact_number || ''}
                onChange={(e) => handleFieldChange('emergency_contact_number', e.target.value)}
              />
              {validatePhone(formData.emergency_contact_number) && (
                <CheckCircle className="absolute right-3 top-3 h-5 w-5 text-green-500" />
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Auto-formats as you type</p>
          </div>
          <div>
            <label htmlFor="emergency_contact_relationship" className="block text-sm font-medium text-gray-700 mb-2">Relationship <span className="text-red-500">*</span></label>
            <select id="emergency_contact_relationship"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
              value={formData.emergency_contact_relationship || ''}
              onChange={(e) => handleFieldChange('emergency_contact_relationship', e.target.value)}
            >
              <option value="">Select Relationship</option>
              <option value="Father">Father</option>
              <option value="Mother">Mother</option>
              <option value="Spouse">Spouse</option>
              <option value="Sibling">Sibling</option>
              <option value="Child">Child</option>
              <option value="Friend">Friend</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddressTab({ formData, handleFieldChange, handleArrayFieldToggle }: any) {
  const transportModes = formData.transport_modes || [];
  const vehicleTypes = formData.vehicle_types || [];
  const hasOwnTransport = transportModes.includes('Own Transport');

  return (
    <div
      className="bg-white rounded-2xl p-6 border border-gray-200"
      style={{
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 8px rgba(0,0,0,0.1)'
      }}
    >
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <MapPin size={20} />
        Address & Transport
      </h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">Street Address <span className="text-red-500">*</span></label>
          <input id="address"
            type="text"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
            value={formData.address || ''}
            onChange={(e) => handleFieldChange('address', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <input id="city"
              type="text"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
              value={formData.city || ''}
              onChange={(e) => handleFieldChange('city', e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">State</label>
            <input id="state"
              type="text"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
              value={formData.state || ''}
              onChange={(e) => handleFieldChange('state', e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="postcode" className="block text-sm font-medium text-gray-700 mb-2">Postcode</label>
            <input id="postcode"
              type="text"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
              value={formData.postcode || ''}
              onChange={(e) => handleFieldChange('postcode', e.target.value)}
            />
          </div>
        </div>
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">Country <span className="text-red-500">*</span></label>
          <input id="country"
            type="text"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
            value={formData.country || ''}
            onChange={(e) => handleFieldChange('country', e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="business_address" className="block text-sm font-medium text-gray-700 mb-2">Business Address (Optional)</label>
          <input id="business_address"
            type="text"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
            placeholder="Alternative address for work correspondence"
            value={formData.business_address || ''}
            onChange={(e) => handleFieldChange('business_address', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Transport Mode (Select all that apply)</label>
          <div className="space-y-2">
            {['Own Transport', 'Public Transport', 'Others'].map((mode) => (
              <label key={mode} className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}>
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-gray-300 text-black focus:ring-2 focus:ring-black"
                  checked={transportModes.includes(mode)}
                  onChange={() => handleArrayFieldToggle('transport_modes', mode)}
                />
                <span className="text-sm font-medium text-gray-700">{mode}</span>
              </label>
            ))}
          </div>
        </div>
        {hasOwnTransport && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Vehicle Type (Select all that apply)</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { name: 'Car', emoji: '🚗' },
                { name: 'Motorcycle', emoji: '🏍️' },
                { name: 'Van', emoji: '🚐' },
                { name: '4x4', emoji: '🚙' }
              ].map((vehicle) => (
                <label
                  key={vehicle.name}
                  className={`flex flex-col items-center justify-center gap-2 cursor-pointer p-4 rounded-lg border-2 transition-all ${
                    vehicleTypes.includes(vehicle.name)
                      ? 'bg-black text-white border-black'
                      : 'bg-gray-50 border-gray-200 hover:border-gray-400'
                  }`}
                  style={!vehicleTypes.includes(vehicle.name) ? { boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' } : {}}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={vehicleTypes.includes(vehicle.name)}
                    onChange={() => handleArrayFieldToggle('vehicle_types', vehicle.name)}
                  />
                  <span className="text-3xl">{vehicle.emoji}</span>
                  <span className={`text-sm font-medium ${vehicleTypes.includes(vehicle.name) ? 'text-white' : 'text-gray-700'}`}>
                    {vehicle.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PhotosTab({ fullBodyPhotos, halfBodyPhotos, uploadingPhoto, handlePhotoUpload, handleDeletePhoto }: any) {
  return (
    <div className="space-y-6">
      {/* Full Body Photos */}
      <div
        className="bg-white rounded-2xl p-6 border border-gray-200"
        style={{
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Camera size={20} />
          Full Body Photos
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {fullBodyPhotos.map((photo: string, index: number) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-50">
                <img src={photo} alt={`Full body ${index + 1}`} className="w-full h-full object-cover" />
              </div>
              <button
                onClick={() => handleDeletePhoto('full-body', photo)}
                className="absolute top-2 right-2 p-2 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
              >
                <Trash2 size={16} className="text-white" />
              </button>
            </div>
          ))}
          <button
            onClick={() => handlePhotoUpload('full-body')}
            disabled={uploadingPhoto}
            className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-black transition-colors flex flex-col items-center justify-center gap-2 bg-gray-50"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
          >
            <Upload size={24} className="text-gray-400" />
            <span className="text-sm text-gray-600">Add Photo</span>
          </button>
        </div>
      </div>

      {/* Half Body Photos */}
      <div
        className="bg-white rounded-2xl p-6 border border-gray-200"
        style={{
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Camera size={20} />
          Half Body Photos (Max 4)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {halfBodyPhotos.map((photo: string, index: number) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-50">
                <img src={photo} alt={`Half body ${index + 1}`} className="w-full h-full object-cover" />
              </div>
              <button
                onClick={() => handleDeletePhoto('half-body', photo)}
                className="absolute top-2 right-2 p-2 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
              >
                <Trash2 size={16} className="text-white" />
              </button>
            </div>
          ))}
          {halfBodyPhotos.length < 4 && (
            <button
              onClick={() => handlePhotoUpload('half-body')}
              disabled={uploadingPhoto}
              className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-black transition-colors flex flex-col items-center justify-center gap-2 bg-gray-50"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
            >
              <Upload size={24} className="text-gray-400" />
              <span className="text-sm text-gray-600">Add Photo</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SkillsTab({ formData, handleFieldChange }: any) {
  return (
    <div
      className="bg-white rounded-2xl p-6 border border-gray-200"
      style={{
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 8px rgba(0,0,0,0.1)'
      }}
    >
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <GraduationCap size={20} />
        Education & Experience
      </h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="education_level" className="block text-sm font-medium text-gray-700 mb-2">Education Level</label>
          <select id="education_level"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
            value={formData.education_level || ''}
            onChange={(e) => handleFieldChange('education_level', e.target.value)}
          >
            <option value="">Select Education Level</option>
            <option value="High School">High School</option>
            <option value="Diploma">Diploma</option>
            <option value="Bachelor's Degree">Bachelor's Degree</option>
            <option value="Master's Degree">Master's Degree</option>
          </select>
        </div>
        <div>
          <label htmlFor="field_of_study" className="block text-sm font-medium text-gray-700 mb-2">Field of Study</label>
          <input id="field_of_study"
            type="text"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
            value={formData.field_of_study || ''}
            onChange={(e) => handleFieldChange('field_of_study', e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="years_of_experience" className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
          <input id="years_of_experience"
            type="text"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
            value={formData.years_of_experience || ''}
            onChange={(e) => handleFieldChange('years_of_experience', e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="previous_roles" className="block text-sm font-medium text-gray-700 mb-2">Previous Roles</label>
          <textarea id="previous_roles"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
            rows={3}
            value={formData.previous_roles || ''}
            onChange={(e) => handleFieldChange('previous_roles', e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
          <textarea id="skills"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
            rows={3}
            value={formData.skills || ''}
            onChange={(e) => handleFieldChange('skills', e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="languages" className="block text-sm font-medium text-gray-700 mb-2">Languages</label>
          <input id="languages"
            type="text"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
            value={formData.languages || ''}
            onChange={(e) => handleFieldChange('languages', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

function BankTab({ formData, handleFieldChange }: any) {
  return (
    <div
      className="bg-white rounded-2xl p-6 border border-gray-200"
      style={{
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 8px rgba(0,0,0,0.1)'
      }}
    >
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <CreditCard size={20} />
        Bank Details
      </h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="bank_name" className="block text-sm font-medium text-gray-700 mb-2">Bank Name <span className="text-red-500">*</span></label>
          <select id="bank_name"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
            value={formData.bank_name || ''}
            onChange={(e) => handleFieldChange('bank_name', e.target.value)}
          >
            <option value="">Select Bank</option>
            <option value="Affin Bank">Affin Bank</option>
            <option value="Al Rajhi Bank">Al Rajhi Bank</option>
            <option value="Alliance Bank">Alliance Bank</option>
            <option value="AmBank">AmBank</option>
            <option value="Bank Islam">Bank Islam</option>
            <option value="Bank Muamalat">Bank Muamalat</option>
            <option value="Bank of China Malaysia">Bank of China Malaysia</option>
            <option value="Bank Rakyat">Bank Rakyat</option>
            <option value="BSN">BSN (Bank Simpanan Nasional)</option>
            <option value="CIMB Bank">CIMB Bank</option>
            <option value="Citibank Malaysia">Citibank Malaysia</option>
            <option value="Hong Leong Bank">Hong Leong Bank</option>
            <option value="HSBC Bank Malaysia">HSBC Bank Malaysia</option>
            <option value="Kuwait Finance House">Kuwait Finance House</option>
            <option value="Maybank">Maybank</option>
            <option value="MBSB Bank">MBSB Bank</option>
            <option value="OCBC Bank">OCBC Bank</option>
            <option value="Public Bank">Public Bank</option>
            <option value="RHB Bank">RHB Bank</option>
            <option value="Standard Chartered Bank">Standard Chartered Bank</option>
            <option value="UOB">UOB (United Overseas Bank)</option>
          </select>
        </div>
        <div>
          <label htmlFor="bank_account_number" className="block text-sm font-medium text-gray-700 mb-2">Account Number <span className="text-red-500">*</span></label>
          <input id="bank_account_number"
            type="text"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
            value={formData.bank_account_number || ''}
            onChange={(e) => handleFieldChange('bank_account_number', e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="bank_account_holder_name" className="block text-sm font-medium text-gray-700 mb-2">Account Holder Name <span className="text-red-500">*</span></label>
          <input id="bank_account_holder_name"
            type="text"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
            value={formData.bank_account_holder_name || ''}
            onChange={(e) => handleFieldChange('bank_account_holder_name', e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-5 h-5 rounded border-gray-300 text-black focus:ring-2 focus:ring-black"
              checked={formData.not_own_account || false}
              onChange={(e) => handleFieldChange('not_own_account', e.target.checked)}
            />
            <span className="text-sm font-medium text-gray-700">This account does not belong to me</span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-8">Check this if the bank account belongs to someone else (e.g., family member)</p>
        </div>
        {formData.not_own_account && (
          <div className="md:col-span-2">
            <label htmlFor="bank_account_relationship" className="block text-sm font-medium text-gray-700 mb-2">Relationship to Account Holder</label>
            <input id="bank_account_relationship"
              type="text"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
              placeholder="e.g., Father, Mother, Spouse, Sibling"
              value={formData.bank_account_relationship || ''}
              onChange={(e) => handleFieldChange('bank_account_relationship', e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
