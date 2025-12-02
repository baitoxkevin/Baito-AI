import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Image,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import {
  getCurrentUserProfile,
  updateUserProfile,
  calculateAgeFromIC,
  formatLanguages,
  getTransportType
} from '../../lib/profile-service';
import {
  validateProfileData,
  calculateProfileCompletion,
  getCompletionColor,
  getCompletionText,
  formatICNumber,
  formatPhoneNumber,
  getFieldHint
} from '../../lib/validation';
import {
  selectAndUploadProfilePicture,
  pickDocument,
  uploadImageToSupabase,
  updateFullBodyPhotos,
  updateHalfBodyPhotos,
  deleteFullBodyPhoto,
  deleteHalfBodyPhoto,
} from '../../lib/image-upload-service';
import QRCodeModal from '../../components/QRCodeModal';

type TabType = 'info' | 'addr' | 'pics' | 'skills' | 'bank';

interface ProfileData {
  // Personal Details
  fullName: string;
  nationality: string;
  age: string;
  icNumber: string;
  gender: string;
  race: string;
  shirtSize: string;
  phone: string;
  email: string;
  languages: string[];
  
  // Address
  currentAddress: string;
  transportType: string;
  vehicleType: string;
  
  // Emergency Contact
  emergencyContactName: string;
  emergencyRelationship: string;
  emergencyContactNumber: string;
  
  // Education & Work
  highestEducation: string;
  fieldOfStudy: string;
  workExperience: string;
  
  // Banking
  usingSomeoneElseAccount: boolean;
  accountName: string;
  accountRelationship: string;
  bankName: string;
  accountNumber: string;
  tinNumber: string;
}

export default function BaitoProfileImproved() {
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [candidateId, setCandidateId] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [originalData, setOriginalData] = useState<ProfileData | null>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>('');
  const [fullBodyPhoto, setFullBodyPhoto] = useState<string>('');
  const [halfBodyPhotos, setHalfBodyPhotos] = useState<string[]>(['', '', '']);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: '',
    nationality: '',
    age: '',
    icNumber: '',
    gender: '',
    race: '',
    shirtSize: '',
    phone: '',
    email: '',
    languages: [],
    currentAddress: '',
    transportType: '',
    vehicleType: '',
    emergencyContactName: '',
    emergencyRelationship: '',
    emergencyContactNumber: '',
    highestEducation: '',
    fieldOfStudy: '',
    workExperience: '',
    usingSomeoneElseAccount: false,
    accountName: '',
    accountRelationship: '',
    bankName: '',
    accountNumber: '',
    tinNumber: '',
  });

  // Load profile data on mount
  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      const candidate = await getCurrentUserProfile();

      if (!candidate) {
        Alert.alert('Error', 'Could not load profile data');
        return;
      }

      setCandidateId(candidate.id);

      // Set profile photo URL
      if (candidate.profile_photo) {
        setProfilePhotoUrl(candidate.profile_photo);
      }

      // Load document photos from JSONB arrays
      if (candidate.full_body_photos && Array.isArray(candidate.full_body_photos) && candidate.full_body_photos.length > 0) {
        setFullBodyPhoto(candidate.full_body_photos[0] || '');
      }

      if (candidate.half_body_photos && Array.isArray(candidate.half_body_photos)) {
        const halfPhotos = candidate.half_body_photos.slice(0, 3);
        while (halfPhotos.length < 3) {
          halfPhotos.push('');
        }
        setHalfBodyPhotos(halfPhotos);
      }

      // Map candidate data to profile form
      const mappedData = {
        fullName: candidate.full_name || '',
        nationality: candidate.nationality || '',
        age: calculateAgeFromIC(candidate.ic_number) || '',
        icNumber: candidate.ic_number || '',
        gender: candidate.gender || '',
        race: candidate.race || '',
        shirtSize: candidate.shirt_size || '',
        phone: candidate.phone_number || '',
        email: candidate.email || '',
        languages: formatLanguages(candidate.languages || candidate.languages_spoken),
        currentAddress: candidate.current_address || '',
        transportType: getTransportType(candidate.has_vehicle, candidate.vehicle_type),
        vehicleType: candidate.vehicle_type || '',
        emergencyContactName: candidate.emergency_contact_name || '',
        emergencyRelationship: candidate.emergency_contact_relationship || '',
        emergencyContactNumber: candidate.emergency_contact_number || '',
        highestEducation: candidate.highest_education || '',
        fieldOfStudy: candidate.field_of_study || '',
        workExperience: candidate.work_experience || '',
        usingSomeoneElseAccount: candidate.not_own_account || false,
        accountName: candidate.bank_account_name || '',
        accountRelationship: candidate.bank_account_relationship || '',
        bankName: candidate.bank_name || '',
        accountNumber: candidate.bank_account_number || '',
        tinNumber: candidate.tin || '',
      };

      setProfileData(mappedData);
      setOriginalData(mappedData);

      // Calculate initial completion percentage
      const completion = calculateProfileCompletion(mappedData);
      setCompletionPercentage(completion);
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  // Track changes and update completion percentage
  useEffect(() => {
    if (!originalData) return;

    // Check if data has changed
    const changed = JSON.stringify(profileData) !== JSON.stringify(originalData);
    setHasUnsavedChanges(changed);

    // Update completion percentage
    const completion = calculateProfileCompletion(profileData);
    setCompletionPercentage(completion);
  }, [profileData, originalData]);

  const handleSaveProfile = async () => {
    if (!candidateId) {
      Alert.alert('Error', 'No user profile found');
      return;
    }

    // Validate data
    const validation = validateProfileData(profileData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      const errorMessages = Object.values(validation.errors).join('\n');
      Alert.alert('Validation Error', errorMessages);
      return;
    }

    // Clear validation errors
    setValidationErrors({});

    try {
      setIsSaving(true);

      // Map form data to candidate format
      const updates = {
        full_name: profileData.fullName,
        nationality: profileData.nationality,
        ic_number: profileData.icNumber,
        gender: profileData.gender,
        race: profileData.race,
        shirt_size: profileData.shirtSize,
        phone_number: profileData.phone,
        languages: profileData.languages,
        current_address: profileData.currentAddress,
        has_vehicle: profileData.transportType === 'I have own vehicle',
        vehicle_type: profileData.vehicleType,
        emergency_contact_name: profileData.emergencyContactName,
        emergency_contact_relationship: profileData.emergencyRelationship,
        emergency_contact_number: profileData.emergencyContactNumber,
        highest_education: profileData.highestEducation,
        field_of_study: profileData.fieldOfStudy,
        work_experience: profileData.workExperience,
        not_own_account: profileData.usingSomeoneElseAccount,
        bank_account_name: profileData.accountName,
        bank_account_relationship: profileData.accountRelationship,
        bank_name: profileData.bankName,
        bank_account_number: profileData.accountNumber,
        tin: profileData.tinNumber,
      };

      const result = await updateUserProfile(candidateId, updates);

      if (result.success) {
        // Update original data to match saved data
        setOriginalData(profileData);
        setHasUnsavedChanges(false);

        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        Alert.alert('Error', result.error || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle unsaved changes warning
  const handleBackPress = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Do you want to save before leaving?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Discard', onPress: () => {/* Navigate back */}, style: 'destructive' },
          { text: 'Save', onPress: handleSaveProfile },
        ]
      );
    } else {
      // Navigate back
    }
  };

  // Handle profile picture upload
  const handleProfilePicturePress = () => {
    if (!candidateId) {
      Alert.alert('Error', 'Please save your profile first');
      return;
    }

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            // Take Photo
            await uploadProfilePicture('camera');
          } else if (buttonIndex === 2) {
            // Choose from Library
            await uploadProfilePicture('gallery');
          }
        }
      );
    } else {
      // For Android, show Alert with options
      Alert.alert(
        'Profile Picture',
        'Choose an option',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: () => uploadProfilePicture('camera') },
          { text: 'Choose from Library', onPress: () => uploadProfilePicture('gallery') },
        ]
      );
    }
  };

  const uploadProfilePicture = async (source: 'camera' | 'gallery') => {
    try {
      setIsSaving(true);
      const result = await selectAndUploadProfilePicture(candidateId, source);

      if (result.success && result.url) {
        setProfilePhotoUrl(result.url);
        Alert.alert('Success', 'Profile picture updated successfully!');
      } else {
        Alert.alert('Error', result.error || 'Failed to upload profile picture');
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      Alert.alert('Error', 'Failed to upload profile picture');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle document uploads
  const handleDocumentUpload = async (documentType: 'full-body' | 'half-body', index?: number) => {
    if (!candidateId) {
      Alert.alert('Error', 'Please save your profile first');
      return;
    }

    try {
      setIsUploadingDocument(true);
      const imageAsset = await pickDocument();

      if (!imageAsset) {
        return; // User cancelled
      }

      const uploadResult = await uploadImageToSupabase(
        imageAsset,
        candidateId,
        'documents'
      );

      if (uploadResult.success && uploadResult.url) {
        if (documentType === 'full-body') {
          // Update full body photos in database
          const dbResult = await updateFullBodyPhotos(candidateId, uploadResult.url);
          if (dbResult.success) {
            setFullBodyPhoto(uploadResult.url);
            Alert.alert('Success', 'Full body photo uploaded successfully!');
          } else {
            Alert.alert('Error', dbResult.error || 'Failed to save photo');
          }
        } else if (documentType === 'half-body' && index !== undefined) {
          // Update half body photos in database
          const dbResult = await updateHalfBodyPhotos(candidateId, uploadResult.url, index);
          if (dbResult.success) {
            const newHalfBodyPhotos = [...halfBodyPhotos];
            newHalfBodyPhotos[index] = uploadResult.url;
            setHalfBodyPhotos(newHalfBodyPhotos);
            Alert.alert('Success', 'Half body photo uploaded successfully!');
          } else {
            Alert.alert('Error', dbResult.error || 'Failed to save photo');
          }
        }
      } else {
        Alert.alert('Error', uploadResult.error || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      Alert.alert('Error', 'Failed to upload photo');
    } finally {
      setIsUploadingDocument(false);
    }
  };

  // Handle photo deletion
  const handlePhotoDelete = async (documentType: 'full-body' | 'half-body', index?: number) => {
    if (!candidateId) {
      return;
    }

    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsUploadingDocument(true);

              if (documentType === 'full-body' && fullBodyPhoto) {
                const result = await deleteFullBodyPhoto(candidateId, fullBodyPhoto);
                if (result.success) {
                  setFullBodyPhoto('');
                  Alert.alert('Success', 'Photo deleted successfully!');
                } else {
                  Alert.alert('Error', result.error || 'Failed to delete photo');
                }
              } else if (documentType === 'half-body' && index !== undefined) {
                const result = await deleteHalfBodyPhoto(candidateId, index);
                if (result.success) {
                  const newHalfBodyPhotos = [...halfBodyPhotos];
                  newHalfBodyPhotos[index] = '';
                  setHalfBodyPhotos(newHalfBodyPhotos);
                  Alert.alert('Success', 'Photo deleted successfully!');
                } else {
                  Alert.alert('Error', result.error || 'Failed to delete photo');
                }
              }
            } catch (error) {
              console.error('Error deleting photo:', error);
              Alert.alert('Error', 'Failed to delete photo');
            } finally {
              setIsUploadingDocument(false);
            }
          },
        },
      ]
    );
  };

  const tabs = [
    { id: 'info', label: 'Info', icon: 'person-outline' },
    { id: 'addr', label: 'Address', icon: 'location-outline' },
    { id: 'pics', label: 'Photos', icon: 'camera-outline' },
    { id: 'skills', label: 'Skills', icon: 'briefcase-outline' },
    { id: 'bank', label: 'Bank', icon: 'card-outline' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return <InfoTab profileData={profileData} setProfileData={setProfileData} />;
      case 'addr':
        return <AddressTab profileData={profileData} setProfileData={setProfileData} />;
      case 'pics':
        return (
          <PicsTab
            fullBodyPhoto={fullBodyPhoto}
            halfBodyPhotos={halfBodyPhotos}
            onUploadDocument={handleDocumentUpload}
            onDeletePhoto={handlePhotoDelete}
            isUploading={isUploadingDocument}
          />
        );
      case 'skills':
        return <SkillsTab profileData={profileData} setProfileData={setProfileData} />;
      case 'bank':
        return <BankTab profileData={profileData} setProfileData={setProfileData} />;
      default:
        return null;
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header - Enhanced with gradient and shadow */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Profile</Text>
            {hasUnsavedChanges && (
              <View style={styles.unsavedDot} />
            )}
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => setShowQRModal(true)}
              style={styles.qrButton}
            >
              <Ionicons name="qr-code-outline" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSaveProfile}
              style={styles.saveButton}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Picture with enhanced shadow */}
        <View style={styles.profileSection}>
          <View style={styles.profilePictureWrapper}>
            <View style={styles.profilePicture}>
              {profilePhotoUrl ? (
                <Image
                  source={{ uri: profilePhotoUrl }}
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.profileEmoji}>
                  {profileData.fullName?.charAt(0) || '👤'}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={handleProfilePicturePress}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Ionicons name="camera" size={20} color="#000" />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>{profileData.fullName || 'User'}</Text>

          {/* Profile Completion Indicator */}
          <View style={styles.completionContainer}>
            <View style={styles.completionBar}>
              <View
                style={[
                  styles.completionFill,
                  {
                    width: `${completionPercentage}%`,
                    backgroundColor: getCompletionColor(completionPercentage),
                  },
                ]}
              />
            </View>
            <Text style={styles.completionText}>
              {completionPercentage}% Complete · {getCompletionText(completionPercentage)}
            </Text>
          </View>
        </View>
      </View>

      {/* Tab Navigation - Enhanced with color layering */}
      <View style={styles.tabNavigationWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.tabScrollView}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id as TabType)}
              style={[
                styles.tab,
                activeTab === tab.id && styles.tabActive
              ]}
            >
              <View style={styles.tabContent}>
                <Ionicons
                  name={tab.icon as any}
                  size={20}
                  color={activeTab === tab.id ? '#000' : '#6b7280'}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    activeTab === tab.id && styles.tabLabelActive
                  ]}
                >
                  {tab.label}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.contentContainer}>
        {renderTabContent()}
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Created by <Text style={styles.footerBrand}>Baito Events</Text>
          </Text>
        </View>
      </ScrollView>

      {/* Save Button - Enhanced with gradient and shadow */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.saveBottomButton, isSaving && styles.buttonDisabled]}
          onPress={handleSaveProfile}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <ActivityIndicator size="small" color="white" />
              <Text style={styles.saveBottomButtonText}>Saving...</Text>
            </>
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={24} color="white" />
              <Text style={styles.saveBottomButtonText}>Save All Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* QR Code Modal */}
      <QRCodeModal
        visible={showQRModal}
        onClose={() => setShowQRModal(false)}
        profileData={{
          id: candidateId,
          fullName: profileData.fullName,
          phone: profileData.phone,
          email: profileData.email,
          icNumber: profileData.icNumber,
        }}
      />
    </View>
  );
}

// Info Tab Component
function InfoTab({ profileData, setProfileData }: any) {
  const languages = ['English', 'Malay', 'Mandarin', 'Other'];

  return (
    <View style={styles.tabContentPadding}>
      {/* Personal Details Section Card */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Personal Details</Text>

        {/* Full Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            Full Name <Text style={styles.requiredStar}>*</Text>
          </Text>
          <TextInput
            style={styles.inputField}
            value={profileData.fullName}
            onChangeText={(text) => setProfileData({ ...profileData, fullName: text })}
          />
        </View>

        {/* Nationality and Age */}
        <View style={styles.inputRow}>
          <View style={styles.inputHalf}>
            <Text style={styles.inputLabel}>
              Nationality <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={profileData.nationality}
                onValueChange={(value) => setProfileData({ ...profileData, nationality: value })}
                style={styles.picker}
              >
                <Picker.Item label="Select country" value="" />
                <Picker.Item label="Malaysian" value="Malaysian" />
                <Picker.Item label="Other" value="Other" />
              </Picker>
            </View>
          </View>
          <View style={[styles.inputHalf, styles.inputHalfRight]}>
            <Text style={styles.inputLabel}>
              Age <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={styles.inputField}
              placeholder="21 years"
              value={profileData.age}
              onChangeText={(text) => setProfileData({ ...profileData, age: text })}
            />
          </View>
        </View>

        {/* IC Number */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            IC Number <Text style={styles.requiredStar}>*</Text>
          </Text>
          <TextInput
            style={styles.inputField}
            placeholder="XXXXXX-XX-XXXX"
            value={profileData.icNumber}
            onChangeText={(text) => setProfileData({ ...profileData, icNumber: text })}
          />
        </View>

        {/* Gender and Race */}
        <View style={styles.inputRow}>
          <View style={styles.inputHalf}>
            <Text style={styles.inputLabel}>
              Gender <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={profileData.gender}
                onValueChange={(value) => setProfileData({ ...profileData, gender: value })}
                style={styles.picker}
              >
                <Picker.Item label="Select gender" value="" />
                <Picker.Item label="Male" value="Male" />
                <Picker.Item label="Female" value="Female" />
                <Picker.Item label="Other" value="Other" />
              </Picker>
            </View>
          </View>
          <View style={[styles.inputHalf, styles.inputHalfRight]}>
            <Text style={styles.inputLabel}>Race</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={profileData.race}
                onValueChange={(value) => setProfileData({ ...profileData, race: value })}
                style={styles.picker}
              >
                <Picker.Item label="Select race" value="" />
                <Picker.Item label="Malay" value="Malay" />
                <Picker.Item label="Chinese" value="Chinese" />
                <Picker.Item label="Indian" value="Indian" />
                <Picker.Item label="Other" value="Other" />
              </Picker>
            </View>
          </View>
        </View>

        {/* Shirt Size */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Shirt Size</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={profileData.shirtSize}
              onValueChange={(value) => setProfileData({ ...profileData, shirtSize: value })}
              style={styles.picker}
            >
              <Picker.Item label="Select size" value="" />
              <Picker.Item label="XS" value="XS" />
              <Picker.Item label="S" value="S" />
              <Picker.Item label="M" value="M" />
              <Picker.Item label="L" value="L" />
              <Picker.Item label="XL" value="XL" />
              <Picker.Item label="XXL" value="XXL" />
            </Picker>
          </View>
        </View>
      </View>

      {/* Contact Section Card */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Contact</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            Phone Number <Text style={styles.requiredStar}>*</Text>
          </Text>
          <TextInput
            style={styles.inputField}
            placeholder="60XXXXXXXXX"
            value={profileData.phone}
            onChangeText={(text) => setProfileData({ ...profileData, phone: text })}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            Email <Text style={styles.requiredStar}>*</Text>
          </Text>
          <TextInput
            style={styles.inputField}
            placeholder="example@email.com"
            value={profileData.email}
            onChangeText={(text) => setProfileData({ ...profileData, email: text })}
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Languages</Text>
          <View style={styles.languageContainer}>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.languageChip,
                  profileData.languages.includes(lang) && styles.languageChipActive
                ]}
                onPress={() => {
                  const newLanguages = profileData.languages.includes(lang)
                    ? profileData.languages.filter((l: string) => l !== lang)
                    : [...profileData.languages, lang];
                  setProfileData({ ...profileData, languages: newLanguages });
                }}
              >
                <Text
                  style={[
                    styles.languageChipText,
                    profileData.languages.includes(lang) && styles.languageChipTextActive
                  ]}
                >
                  {lang}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Emergency Contact Card */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Emergency Contact</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Contact Name</Text>
          <TextInput
            style={styles.inputField}
            placeholder="Full name"
            value={profileData.emergencyContactName}
            onChangeText={(text) =>
              setProfileData({ ...profileData, emergencyContactName: text })
            }
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Relationship</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={profileData.emergencyRelationship}
              onValueChange={(value) =>
                setProfileData({ ...profileData, emergencyRelationship: value })
              }
              style={styles.picker}
            >
              <Picker.Item label="Select relationship" value="" />
              <Picker.Item label="Parent" value="Parent" />
              <Picker.Item label="Sibling" value="Sibling" />
              <Picker.Item label="Spouse" value="Spouse" />
              <Picker.Item label="Friend" value="Friend" />
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Contact Number</Text>
          <TextInput
            style={styles.inputField}
            placeholder="60XXXXXXXXX"
            value={profileData.emergencyContactNumber}
            onChangeText={(text) =>
              setProfileData({ ...profileData, emergencyContactNumber: text })
            }
            keyboardType="phone-pad"
          />
        </View>
      </View>
    </View>
  );
}

// Address Tab Component
function AddressTab({ profileData, setProfileData }: any) {
  return (
    <View style={styles.tabContentPadding}>
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Current Address</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Full Address</Text>
          <TextInput
            style={[styles.inputField, styles.textAreaInput]}
            placeholder="Enter your complete address"
            value={profileData.currentAddress}
            onChangeText={(text) => setProfileData({ ...profileData, currentAddress: text })}
            multiline
            numberOfLines={4}
          />
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Transportation</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Transport Type</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={profileData.transportType}
              onValueChange={(value) => setProfileData({ ...profileData, transportType: value })}
              style={styles.picker}
            >
              <Picker.Item label="Select transport" value="" />
              <Picker.Item label="I have own vehicle" value="I have own vehicle" />
              <Picker.Item label="Public transport" value="Public transport" />
              <Picker.Item label="Ride-hailing" value="Ride-hailing" />
            </Picker>
          </View>
        </View>

        {profileData.transportType === 'I have own vehicle' && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Vehicle Type</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={profileData.vehicleType}
                onValueChange={(value) => setProfileData({ ...profileData, vehicleType: value })}
                style={styles.picker}
              >
                <Picker.Item label="Select vehicle" value="" />
                <Picker.Item label="Car" value="Car" />
                <Picker.Item label="Motorcycle" value="Motorcycle" />
                <Picker.Item label="Bicycle" value="Bicycle" />
              </Picker>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

// Pics Tab Component
interface PicsTabProps {
  fullBodyPhoto: string;
  halfBodyPhotos: string[];
  onUploadDocument: (documentType: 'full-body' | 'half-body', index?: number) => Promise<void>;
  onDeletePhoto: (documentType: 'full-body' | 'half-body', index?: number) => Promise<void>;
  isUploading: boolean;
}

function PicsTab({ fullBodyPhoto, halfBodyPhotos, onUploadDocument, onDeletePhoto, isUploading }: PicsTabProps) {
  return (
    <View style={styles.tabContentPadding}>
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Photos</Text>

        {/* Full Body Photo */}
        <Text style={styles.inputLabel}>Full Body Photo</Text>
        <View style={styles.photoContainer}>
          <TouchableOpacity
            style={styles.uploadBox}
            onPress={() => onUploadDocument('full-body')}
            disabled={isUploading}
          >
            {fullBodyPhoto ? (
              <>
                <Image
                  source={{ uri: fullBodyPhoto }}
                  style={styles.uploadedImage}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.deletePhotoButton}
                  onPress={() => onDeletePhoto('full-body')}
                  disabled={isUploading}
                >
                  <Ionicons name="trash-outline" size={20} color="white" />
                </TouchableOpacity>
              </>
            ) : isUploading ? (
              <>
                <ActivityIndicator size="large" color="#000" />
                <Text style={styles.uploadText}>Uploading...</Text>
              </>
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={48} color="#9ca3af" />
                <Text style={styles.uploadText}>Upload full body photo</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Half Body Photos */}
        <Text style={[styles.inputLabel, styles.mt4]}>Half Body Photos</Text>
        <View style={styles.uploadRow}>
          {halfBodyPhotos.map((photo, index) => (
            <View key={index} style={styles.photoContainerSmall}>
              <TouchableOpacity
                style={styles.uploadBoxSmall}
                onPress={() => onUploadDocument('half-body', index)}
                disabled={isUploading}
              >
                {photo ? (
                  <>
                    <Image
                      source={{ uri: photo }}
                      style={styles.uploadedImageSmall}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.deletePhotoButtonSmall}
                      onPress={() => onDeletePhoto('half-body', index)}
                      disabled={isUploading}
                    >
                      <Ionicons name="trash-outline" size={16} color="white" />
                    </TouchableOpacity>
                  </>
                ) : isUploading ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={32} color="#9ca3af" />
                    <Text style={styles.uploadTextSmall}>Half Body {index + 1}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#6b7280" />
          <Text style={styles.infoText}>Only JPEG/PNG files, max 5MB each. Tap photo to delete.</Text>
        </View>
      </View>
    </View>
  );
}

// Skills Tab Component
function SkillsTab({ profileData, setProfileData }: any) {
  return (
    <View style={styles.tabContentPadding}>
      {/* Education Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Education</Text>

        <View style={styles.inputRow}>
          <View style={styles.inputHalf}>
            <Text style={styles.inputLabel}>Highest Education</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={profileData.highestEducation}
                onValueChange={(value) =>
                  setProfileData({ ...profileData, highestEducation: value })
                }
                style={styles.picker}
              >
                <Picker.Item label="Select level" value="" />
                <Picker.Item label="High School" value="High School" />
                <Picker.Item label="Diploma" value="Diploma" />
                <Picker.Item label="Bachelor's Degree" value="Bachelor's Degree" />
                <Picker.Item label="Master's Degree" value="Master's Degree" />
              </Picker>
            </View>
          </View>
          <View style={[styles.inputHalf, styles.inputHalfRight]}>
            <Text style={styles.inputLabel}>Field of Study</Text>
            <TextInput
              style={styles.inputField}
              placeholder="e.g. Engineering"
              value={profileData.fieldOfStudy}
              onChangeText={(text) => setProfileData({ ...profileData, fieldOfStudy: text })}
            />
          </View>
        </View>
      </View>

      {/* Work Experience Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Work Experience</Text>

        <View style={styles.inputGroup}>
          <TextInput
            style={[styles.inputField, styles.textAreaInput]}
            placeholder={`Example format:
Working Experiences (list ALL):
- Photobooth Crew PopBox
- Event Crew 2 tahun Madani
- Promoter Nuuna
- Event Crew Keluarga Malaysia Pahang

Or include:
Brand: [Company Name]
Position: [Job Title]
Days Committed: [Number]`}
            value={profileData.workExperience}
            onChangeText={(text) => setProfileData({ ...profileData, workExperience: text })}
            multiline
            numberOfLines={8}
          />

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color="#6b7280" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Quick Paste Format</Text>
              <Text style={styles.infoSubtext}>
                Copy and paste your work experience list - we'll save it as formatted.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

// Bank Tab Component
function BankTab({ profileData, setProfileData }: any) {
  return (
    <View style={styles.tabContentPadding}>
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Banking Information</Text>

        {/* Toggle for someone else's account */}
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Using someone else's bank account?</Text>
          <TouchableOpacity
            style={[
              styles.toggle,
              profileData.usingSomeoneElseAccount && styles.toggleActive
            ]}
            onPress={() =>
              setProfileData({
                ...profileData,
                usingSomeoneElseAccount: !profileData.usingSomeoneElseAccount,
              })
            }
          >
            <View
              style={[
                styles.toggleThumb,
                profileData.usingSomeoneElseAccount && styles.toggleThumbActive
              ]}
            />
          </TouchableOpacity>
        </View>

        {/* Account Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Account Name</Text>
          <TextInput
            style={styles.inputField}
            value={profileData.accountName}
            onChangeText={(text) => setProfileData({ ...profileData, accountName: text })}
          />
        </View>

        {/* Relationship */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Relationship</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={profileData.accountRelationship}
              onValueChange={(value) =>
                setProfileData({ ...profileData, accountRelationship: value })
              }
              style={styles.picker}
            >
              <Picker.Item label="Select relationship" value="" />
              <Picker.Item label="Self" value="Self" />
              <Picker.Item label="Parent" value="Parent" />
              <Picker.Item label="Sibling" value="Sibling" />
              <Picker.Item label="Spouse" value="Spouse" />
            </Picker>
          </View>
        </View>

        {/* Bank Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Bank Name</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={profileData.bankName}
              onValueChange={(value) => setProfileData({ ...profileData, bankName: value })}
              style={styles.picker}
            >
              <Picker.Item label="Select your bank" value="" />
              <Picker.Item label="Maybank" value="Maybank" />
              <Picker.Item label="CIMB Bank" value="CIMB Bank" />
              <Picker.Item label="Public Bank" value="Public Bank" />
              <Picker.Item label="RHB Bank" value="RHB Bank" />
              <Picker.Item label="Hong Leong Bank" value="Hong Leong Bank" />
            </Picker>
          </View>
        </View>

        {/* Account Number */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Account Number</Text>
          <TextInput
            style={styles.inputField}
            placeholder="Enter account number"
            value={profileData.accountNumber}
            onChangeText={(text) => setProfileData({ ...profileData, accountNumber: text })}
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Tax Information Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Tax Information</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>TIN Number (Optional)</Text>
          <TextInput
            style={styles.inputField}
            placeholder="Tax Identification Number"
            value={profileData.tinNumber}
            onChangeText={(text) => setProfileData({ ...profileData, tinNumber: text })}
          />
          <Text style={styles.helperText}>
            Required if you have income tax obligations
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Container & Layout
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6', // Shade 1 (darkest background)
  },
  
  // Header Styles with gradient effect
  header: {
    backgroundColor: '#000',
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 24,
    // Shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  unsavedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f59e0b',
    marginLeft: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qrButton: {
    padding: 4,
  },
  saveButton: {
    paddingHorizontal: 4,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '500',
  },
  
  // Profile Section
  profileSection: {
    alignItems: 'center',
  },
  profilePictureWrapper: {
    position: 'relative',
  },
  profilePicture: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    // Two-layer shadow for premium feel
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },
  profileEmoji: {
    fontSize: 64,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    backgroundColor: 'white',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    // Enhanced shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  profileName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  profileStats: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 4,
  },

  // Profile Completion Indicator
  completionContainer: {
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 24,
  },
  completionBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  completionFill: {
    height: '100%',
    borderRadius: 4,
  },
  completionText: {
    color: 'white',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.9,
  },
  
  // Tab Navigation with color layering
  tabNavigationWrapper: {
    backgroundColor: '#fafafa', // Shade 2 (medium)
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    // Subtle inner shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabScrollView: {
    paddingHorizontal: 8,
  },
  tab: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    backgroundColor: '#ffffff', // Shade 3 (lighter) - selected state
    borderBottomColor: '#000',
    // Elevated with shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabLabel: {
    marginLeft: 8,
    fontSize: 16,
    color: '#6b7280',
  },
  tabLabelActive: {
    color: '#000',
    fontWeight: '600',
  },
  
  // Content Container
  contentContainer: {
    flex: 1,
  },
  tabContentPadding: {
    padding: 24,
  },
  
  // Section Card with color layering and shadows
  sectionCard: {
    backgroundColor: '#ffffff', // Shade 3 (card background)
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    // Two-layer shadow for elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
  },
  
  // Input Styles
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  requiredStar: {
    color: '#ef4444',
  },
  inputField: {
    backgroundColor: '#f9fafb', // Shade 4 (lightest) for inputs
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    // Inner highlight for premium feel
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 0,
  },
  textAreaInput: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  
  // Input Row (for side-by-side inputs)
  inputRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  inputHalf: {
    flex: 1,
  },
  inputHalfRight: {
    marginLeft: 16,
  },
  
  // Picker Wrapper
  pickerWrapper: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  
  // Language Chips
  languageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  languageChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  languageChipActive: {
    backgroundColor: '#000',
    borderColor: '#000',
    // Shadow for selected state
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  languageChipText: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
  },
  languageChipTextActive: {
    color: 'white',
  },
  
  // Upload Box with enhanced styling
  uploadBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    borderRadius: 12,
    height: 192,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
    marginBottom: 16,
  },
  uploadText: {
    color: '#6b7280',
    marginTop: 8,
    fontSize: 14,
  },
  uploadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  uploadBoxSmall: {
    flex: 1,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    borderRadius: 12,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
    marginHorizontal: 4,
  },
  uploadTextSmall: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 4,
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  uploadedImageSmall: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  photoContainer: {
    position: 'relative',
  },
  photoContainerSmall: {
    flex: 1,
    marginHorizontal: 4,
    position: 'relative',
  },
  deletePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  deletePhotoButtonSmall: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },

  // Info Box with enhanced styling
  infoBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 12,
  },
  infoText: {
    color: '#6b7280',
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  infoTitle: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoSubtext: {
    color: '#6b7280',
    fontSize: 12,
  },
  
  // Toggle Switch with enhanced styling
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 20,
  },
  toggleLabel: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  toggle: {
    width: 56,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#d1d5db',
    justifyContent: 'center',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#000',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
    alignSelf: 'flex-start',
    // Shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  
  // Helper Text
  helperText: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 4,
  },
  
  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  footerText: {
    color: '#6b7280',
    fontSize: 14,
  },
  footerBrand: {
    color: '#000',
    fontWeight: '600',
  },
  
  // Bottom Bar with gradient and shadow
  bottomBar: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    // Shadow for elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  saveBottomButton: {
    backgroundColor: '#000',
    borderRadius: 28,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // Two-layer shadow for premium feel
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  saveBottomButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Utility
  mt4: {
    marginTop: 16,
  },

  // Loading state
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },

  // Button disabled state
  buttonDisabled: {
    opacity: 0.6,
  },
});
