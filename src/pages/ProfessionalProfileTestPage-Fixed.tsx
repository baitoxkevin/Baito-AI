import { useState, useEffect } from 'react';
import { Camera, Sparkles, QrCode, MapPin, Mail, Phone, User, Calendar, Briefcase, GraduationCap, Building2, CreditCard, Trash2, Upload, CheckCircle } from 'lucide-react';
import QRCodeModalWeb from '@/components/QRCodeModalWeb';
import { useToast } from '@/hooks/use-toast';
import {
  formatICNumber,
  formatPhoneNumber,
  validateICNumber,
  validateEmail,
  validatePhone,
  calculateProfileCompletion,
  getCompletionColor
} from '@/lib/validation-enhanced';

// Comprehensive Malaysian bank list
const MALAYSIAN_BANKS = [
  "Maybank",
  "CIMB Bank",
  "Public Bank",
  "RHB Bank",
  "Hong Leong Bank",
  "AmBank",
  "Bank Islam Malaysia",
  "Bank Rakyat",
  "Bank Muamalat",
  "OCBC Bank",
  "HSBC Bank",
  "Standard Chartered",
  "UOB Bank",
  "Affin Bank",
  "Alliance Bank",
  "Bank Simpanan Nasional (BSN)",
  "MBSB Bank",
  "Agro Bank",
  "Al Rajhi Bank",
  "Kuwait Finance House",
  "Other"
];

// Mock data for testing
const mockCandidateData = {
  id: 'test-candidate-123',
  full_name: 'Sarah Chen',
  nationality: 'Malaysian',
  ic_number: '950815-10-5678',
  gender: 'Female',
  phone: '6012-345-6789',
  email: 'sarah.chen@example.com',
  date_of_birth: '1995-08-15',
  address: '123 Jalan Bukit Bintang',
  city: 'Kuala Lumpur',
  state: 'WP Kuala Lumpur',
  postcode: '50200',
  country: 'Malaysia',
  transport_mode: 'Own Transport',
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
  bank_name: 'Maybank',
  bank_account_number: '1234567890123',
  bank_account_holder_name: 'Sarah Chen',
  profile_photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200'
};

export default function ProfessionalProfileTestPage() {
  const [formData, setFormData] = useState(mockCandidateData);
  const [activeTab, setActiveTab] = useState('info');
  const [showQRModal, setShowQRModal] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const { toast } = useToast();

  // Calculate profile completion on data change
  useEffect(() => {
    const completion = calculateProfileCompletion(formData);
    setProfileCompletion(completion);
  }, [formData]);

  // Handle field changes with auto-formatting
  const handleFieldChange = (field: string, value: string) => {
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

  const handleSave = () => {
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

  const handleDeletePhoto = (type: 'full-body' | 'half-body', photoUrl: string) => {
    if (type === 'full-body') {
      const newPhotos = formData.full_body_photos.filter((p: string) => p !== photoUrl);
      setFormData({ ...formData, full_body_photos: newPhotos });
    } else {
      const newPhotos = formData.half_body_photos.filter((p: string) => p !== photoUrl);
      setFormData({ ...formData, half_body_photos: newPhotos });
    }
    toast({
      title: 'Success',
      description: 'Photo removed',
    });
  };

  const tabs = [
    { id: 'info', label: 'Personal Info', icon: User },
    { id: 'address', label: 'Address', icon: MapPin },
    { id: 'photos', label: 'Photos', icon: Camera },
    { id: 'skills', label: 'Skills & Edu', icon: GraduationCap },
    { id: 'bank', label: 'Bank Details', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Professional Header with Two-Layer Shadow */}
      <div
        className="bg-black pt-8 pb-6 px-4 sm:px-6 flex-shrink-0"
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

      {/* Tab Navigation with Color Layering - Fixed */}
      <div
        className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10 flex-shrink-0"
        style={{
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
            <div className="flex gap-1 min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap ${
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
      </div>

      {/* Content Area - Scrollable with proper flex-grow */}
      <div className="flex-grow overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-32">
          {activeTab === 'info' && <InfoTab formData={formData} handleFieldChange={handleFieldChange} />}
          {activeTab === 'address' && <AddressTab formData={formData} handleFieldChange={handleFieldChange} />}
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

      {/* Save Button - Fixed at Bottom with Safe Area Support */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-4 px-4 sm:px-6"
        style={{
          boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))'
        }}
      >
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleSave}
            className="w-full bg-black text-white rounded-full py-4 font-semibold hover:scale-105 transition-transform flex items-center justify-center gap-2"
            style={{
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 16px rgba(0,0,0,0.2)'
            }}
          >
            <Sparkles size={20} />
            Save Changes (Test Mode)
          </button>
        </div>
      </div>

      {/* QR Code Modal */}
      <QRCodeModalWeb
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
        className="bg-white rounded-2xl p-6"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
              value={formData.full_name || ''}
              onChange={(e) => handleFieldChange('full_name', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nationality</label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
              value={formData.nationality || ''}
              onChange={(e) => handleFieldChange('nationality', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">IC Number</label>
            <div className="relative">
              <input
                type="text"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
                placeholder="YYMMDD-XX-XXXX"
                value={formData.ic_number || ''}
                onChange={(e) => handleFieldChange('ic_number', e.target.value)}
              />
              {validateICNumber(formData.ic_number) && (
                <CheckCircle className="absolute right-3 top-3.5 h-5 w-5 text-green-500" />
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Auto-formats as you type</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
            <select
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
              value={formData.gender || ''}
              onChange={(e) => handleFieldChange('gender', e.target.value)}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
            <input
              type="date"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
              value={formData.date_of_birth || ''}
              onChange={(e) => handleFieldChange('date_of_birth', e.target.value)}
            />
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
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Phone size={20} />
          Contact Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <div className="relative">
              <input
                type="tel"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
                placeholder="60X-XXXX-XXXX"
                value={formData.phone || ''}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
              />
              {validatePhone(formData.phone) && (
                <CheckCircle className="absolute right-3 top-3.5 h-5 w-5 text-green-500" />
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Auto-formats as you type</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <div className="relative">
              <input
                type="email"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
                placeholder="your.email@example.com"
                value={formData.email || ''}
                onChange={(e) => handleFieldChange('email', e.target.value)}
              />
              {validateEmail(formData.email) && (
                <CheckCircle className="absolute right-3 top-3.5 h-5 w-5 text-green-500" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Contact Card */}
      <div
        className="bg-white rounded-2xl p-6"
        style={{
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Phone size={20} />
          Emergency Contact
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name</label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
              value={formData.emergency_contact_name || ''}
              onChange={(e) => handleFieldChange('emergency_contact_name', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
            <select
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
              value={formData.emergency_contact_relationship || ''}
              onChange={(e) => handleFieldChange('emergency_contact_relationship', e.target.value)}
            >
              <option value="">Select Relationship</option>
              <option value="Spouse">Spouse</option>
              <option value="Parent">Parent</option>
              <option value="Sibling">Sibling</option>
              <option value="Child">Child</option>
              <option value="Friend">Friend</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
            <div className="relative">
              <input
                type="tel"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
                placeholder="60X-XXXX-XXXX"
                value={formData.emergency_contact_number || ''}
                onChange={(e) => handleFieldChange('emergency_contact_number', e.target.value)}
              />
              {validatePhone(formData.emergency_contact_number) && (
                <CheckCircle className="absolute right-3 top-3.5 h-5 w-5 text-green-500" />
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Auto-formats as you type</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddressTab({ formData, handleFieldChange }: any) {
  return (
    <div
      className="bg-white rounded-2xl p-6"
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
          <input
            type="text"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
            value={formData.address || ''}
            onChange={(e) => handleFieldChange('address', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
              value={formData.city || ''}
              onChange={(e) => handleFieldChange('city', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
              value={formData.state || ''}
              onChange={(e) => handleFieldChange('state', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Postcode</label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
              value={formData.postcode || ''}
              onChange={(e) => handleFieldChange('postcode', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
              value={formData.country || ''}
              onChange={(e) => handleFieldChange('country', e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Transport Mode</label>
          <select
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
            value={formData.transport_mode || ''}
            onChange={(e) => handleFieldChange('transport_mode', e.target.value)}
          >
            <option value="">Select Transport</option>
            <option value="Own Transport">Own Transport (Car)</option>
            <option value="Own Transport (Motorcycle)">Own Transport (Motorcycle)</option>
            <option value="Public Transport">Public Transport</option>
            <option value="Company Transport">Company Transport</option>
            <option value="Walking">Walking</option>
            <option value="Bicycle">Bicycle</option>
            <option value="E-hailing">E-hailing (Grab/Others)</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function PhotosTab({ fullBodyPhotos, halfBodyPhotos, uploadingPhoto, handlePhotoUpload, handleDeletePhoto }: any) {
  return (
    <div className="space-y-6">
      {/* Full Body Photos */}
      <div
        className="bg-white rounded-2xl p-6"
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
        className="bg-white rounded-2xl p-6"
        style={{
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Camera size={20} />
          Half Body Photos (Max 3)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
          {halfBodyPhotos.length < 3 && (
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
      className="bg-white rounded-2xl p-6"
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Education Level</label>
          <select
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
            value={formData.education_level || ''}
            onChange={(e) => handleFieldChange('education_level', e.target.value)}
          >
            <option value="">Select Education Level</option>
            <option value="Primary School">Primary School</option>
            <option value="Secondary School">Secondary School</option>
            <option value="High School">High School</option>
            <option value="Certificate">Certificate</option>
            <option value="Diploma">Diploma</option>
            <option value="Advanced Diploma">Advanced Diploma</option>
            <option value="Bachelor's Degree">Bachelor's Degree</option>
            <option value="Postgraduate Diploma">Postgraduate Diploma</option>
            <option value="Master's Degree">Master's Degree</option>
            <option value="Doctorate (PhD)">Doctorate (PhD)</option>
            <option value="Professional Certification">Professional Certification</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Field of Study</label>
          <input
            type="text"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
            placeholder="e.g., Business Administration, Computer Science, Marketing"
            value={formData.field_of_study || ''}
            onChange={(e) => handleFieldChange('field_of_study', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
          <input
            type="text"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
            placeholder="e.g., 5 years, 2-3 years, Fresh Graduate"
            value={formData.years_of_experience || ''}
            onChange={(e) => handleFieldChange('years_of_experience', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Previous Roles</label>
          <textarea
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
            rows={3}
            placeholder="List your previous job titles or roles, separated by commas"
            value={formData.previous_roles || ''}
            onChange={(e) => handleFieldChange('previous_roles', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
          <textarea
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
            rows={3}
            placeholder="List your skills, separated by commas"
            value={formData.skills || ''}
            onChange={(e) => handleFieldChange('skills', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Languages</label>
          <input
            type="text"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
            placeholder="e.g., English, Malay, Mandarin, Tamil"
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
      className="bg-white rounded-2xl p-6"
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
          <select
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
            value={formData.bank_name || ''}
            onChange={(e) => handleFieldChange('bank_name', e.target.value)}
          >
            <option value="">Select Bank</option>
            {MALAYSIAN_BANKS.map(bank => (
              <option key={bank} value={bank}>{bank}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
          <input
            type="text"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
            placeholder="Enter your bank account number"
            value={formData.bank_account_number || ''}
            onChange={(e) => handleFieldChange('bank_account_number', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Account Holder Name</label>
          <input
            type="text"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
            placeholder="Name as it appears on bank account"
            value={formData.bank_account_holder_name || ''}
            onChange={(e) => handleFieldChange('bank_account_holder_name', e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">Must match exactly with your bank account</p>
        </div>
      </div>
    </div>
  );
}