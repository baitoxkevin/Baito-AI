/**
 * NewCandidateDialog - Component to add or update candidate profiles
 * 
 * Key features:
 * - Allows empty email fields (stored as NULL in database)
 * - Detects and offers to update existing candidates (by IC or email)
 * - Supports multiple photo uploads with preview
 * - Comprehensive form with business, personal, and contact details
 */
import { useState, useEffect } from 'react';
import { logger } from '../lib/logger';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { CheckCircle, Building, FileText, Home, CreditCard, User, UserCheck, Car, Languages, Camera, Upload, X, Trash2 } from 'lucide-react';
import { ProfileUpload } from '@/components/ui/profile-upload';

interface NewCandidateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCandidateAdded: () => void;
  initialData?: unknown; // Data from the import tool
}

export default function NewCandidateDialog({
  open,
  onOpenChange,
  onCandidateAdded,
  initialData,
}: NewCandidateDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("basic");
  const [currentUser, setCurrentUser] = useState<{ name: string; id: string } | null>(null);
  const { toast } = useToast();
  
  // Get current user info on component mount
  useEffect(() => {
    const getCurrentUserInfo = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Try to get user's full name from users table
          const { data: userData } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', user.id)
            .single();
          
          const userName = userData?.full_name || user.email?.split('@')[0] || 'Unknown User';
          setCurrentUser({ name: userName, id: user.id });
        }
      } catch (error) {
        logger.error('Error getting current user:', error);
      }
    };
    
    getCurrentUserInfo();
  }, []);
  
  // Generate a unique short ID using a-z prefix followed by 5 digits
  const generateUniqueId = () => {
    const prefix = String.fromCharCode(97 + Math.floor(Math.random() * 26)); // a-z
    const number = Math.floor(Math.random() * 100000).toString().padStart(5, '0'); // 00000-99999
    return `${prefix}${number}`;
  };
  
  // Use initial data if provided
  const defaultFormData = {
    // Basic Information
    legal_name: '',
    entity_type: 'individual',
    registration_type: 'nric',
    registration_id: '',
    old_registration_id: '',
    unique_id: '', // Will be set in useEffect
    tin: '',
    sst_registration_no: '',
    is_customer: false,
    is_supplier: false,
    
    // Contact Information
    phone_number: '',
    email: '',
    
    // Business Address
    street_business: '',
    city_business: '',
    state_business: '',
    postcode_business: '',
    country_code_business: 'MY',
    
    // Mailing Address (copy of business by default)
    street_mailing: '',
    city_mailing: '',
    state_mailing: '',
    postcode_mailing: '',
    country_code_mailing: 'MY',
    use_business_address: true,
    
    // Financial Information
    receivable_ac_code: '',
    payable_ac_code: '',
    income_ac_code: '',
    expense_ac_code: '',
    
    // Additional information (from original form)
    gender: 'male',
    date_of_birth: '',
    nationality: 'Malaysian',
    emergency_contact_name: '',
    emergency_contact_number: '',
    
    // Additional candidate fields from text import
    age: '',
    race: '',
    tshirt_size: '',
    transportation: '',
    spoken_languages: '',
    height: '',
    typhoid: 'no',
    work_experience: '',
    profile_photo: '',
    full_body_photo: '',
  };
  
  // If initialData is provided, use it to override default values
  // Additional state for photo uploads
  const [fullBodyPhotos, setFullBodyPhotos] = useState<string[]>([]);
  const [halfBodyPhotos, setHalfBodyPhotos] = useState<string[]>([]);
  const [photoValidation, setPhotoValidation] = useState({
    profilePhoto: true,
    fullBodyPhotos: true,
    halfBodyPhotos: true
  });
  
  const [formData, setFormData] = useState({
    ...defaultFormData,
    ...(initialData || {})
  });
  
  // Effect to update form when initialData changes
  useEffect(() => {
    if (initialData) {
      // Normalize spoken languages (convert "Chinese" to "Mandarin")
      const normalizedData = {
        ...initialData,
        spoken_languages: normalizeLanguages(initialData.spoken_languages)
      };
      
      setFormData(prevData => ({
        ...prevData,
        ...normalizedData,
        // Ensure unique_id is maintained if provided in initialData, otherwise generate a new one
        unique_id: initialData.unique_id || generateUniqueId()
      }));
      
      // If we have initial data, switch to the basic tab where all the data is shown
      setActiveTab("basic");
    } else {
      // Reset form and generate a new unique ID when dialog is opened without initial data
      setFormData({
        ...defaultFormData,
        unique_id: generateUniqueId()
      });
      
      // Reset photo states
      setFullBodyPhotos([]);
      setHalfBodyPhotos([]);
      setPhotoValidation({
        profilePhoto: true,
        fullBodyPhotos: true,
        halfBodyPhotos: true
      });
    }
  }, [initialData, open]);

  // Common class for all input fields to ensure white background
  const inputClass = "bg-white dark:bg-slate-900";
  
  // Photo validation before submitting form - now optional
  const validatePhotos = (): boolean => {
    // Photos are now optional, but we'll still track if they're present
    const validations = {
      profilePhoto: true, // Always valid since it's optional
      fullBodyPhotos: true, // Always valid since it's optional
      halfBodyPhotos: true  // Always valid since it's optional
    };
    
    setPhotoValidation(validations);
    
    // Form is always valid since all photos are optional
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Validate photos before proceeding
    if (!validatePhotos()) {
      setIsLoading(false);
      setActiveTab("photos");
      
      toast({
        title: "Photo validation failed",
        description: "Please upload all required photos: profile, at least one full body, and at least one half body",
        variant: "destructive"
      });
      
      return;
    }
    
    // If using business address for mailing, copy over the values
    const submissionData = { ...formData };
    if (formData.use_business_address) {
      submissionData.street_mailing = formData.street_business;
      submissionData.city_mailing = formData.city_business;
      submissionData.state_mailing = formData.state_business;
      submissionData.postcode_mailing = formData.postcode_business;
      submissionData.country_code_mailing = formData.country_code_business;
    }

    try {
      logger.debug('Submitting candidate data:', { data: submissionData });
      
      // For empty email, set to null instead of using a placeholder
      if (!submissionData.email || submissionData.email.trim() === '') {
        submissionData.email = null;
        logger.debug('Empty email detected, setting to null');
      }

      // Check if we're editing an existing candidate (ID provided in initialData)
      let existingCandidate = null;
      const isEditMode = submissionData.id ? true : false;
      
      if (isEditMode) {
        // We're editing, fetch the candidate by ID
        const { data: candidateById, error: fetchError } = await supabase
          .from('candidates')
          .select('*')
          .eq('id', submissionData.id)
          .single();
          
        if (!fetchError && candidateById) {
          existingCandidate = candidateById;
        }
      } else {
        // We're creating new, check if the candidate already exists - first by IC number
        if (submissionData.registration_id) {
          const { data: existingByIC, error: checkError } = await supabase
            .from('candidates')
            .select('*')
            .eq('ic_number', submissionData.registration_id)
            .single();
            
          if (!checkError && existingByIC) {
            existingCandidate = existingByIC;
          }
        }
        
        // Then check by email if we have a valid email and didn't find by IC
        if (!existingCandidate && submissionData.email) {
          const { data: existingByEmail, error: emailError } = await supabase
            .from('candidates')
            .select('*')
            .eq('email', submissionData.email)
            .single();
            
          if (!emailError && existingByEmail) {
            existingCandidate = existingByEmail;
          }
        }
      }
      
      // If candidate exists, offer to update (unless we're already in edit mode)
      if (existingCandidate && !isEditMode) {
        // Show confirmation via toast
        const confirmMessage = `A candidate with this ${
          submissionData.registration_id === existingCandidate.ic_number ? 'IC number' : 'email'
        } already exists.`;
        
        // Ask user if they want to update
        const shouldUpdate = window.confirm(confirmMessage + '\n\nDo you want to update their details?');
        
        if (!shouldUpdate) {
          setIsLoading(false);
          return;
        }
      }
      
      // If we have an existing candidate (either from edit mode or user confirmed update)
      if (existingCandidate) {
        // User wants to update, proceed with update logic
        try {
          // Prepare photo data for storage
                    const photoData = {
                      profile_photo: formData.profile_photo,
                      full_body_photos: fullBodyPhotos.length > 0 ? fullBodyPhotos : (formData.full_body_photo ? [formData.full_body_photo] : []),
                      half_body_photos: halfBodyPhotos
                    };
                    
                    // Prepare the custom fields data
                    const customFields = {
                      // Basic candidate custom fields
                      age: submissionData.age || '',
                      race: submissionData.race || '',
                      tshirt_size: submissionData.tshirt_size || '',
                      transportation: submissionData.transportation || '',
                      spoken_languages: submissionData.spoken_languages || '',
                      height: submissionData.height || '',
                      typhoid: submissionData.typhoid || 'no',
                      work_experience: submissionData.work_experience || '',
                      
                      // Photo information
                      profile_photo: photoData.profile_photo || '',
                      full_body_photos: photoData.full_body_photos || [],
                      half_body_photos: photoData.half_body_photos || [],
                      
                      // Entity and registration fields not in the schema
                      entity_type: submissionData.entity_type || 'individual',
                      registration_type: submissionData.registration_type || 'nric',
                      old_registration_id: submissionData.old_registration_id || '',
                      tin: submissionData.tin || '',
                      sst_registration_no: submissionData.sst_registration_no || '',
                      
                      // Business/finance fields not in the schema
                      is_customer: submissionData.is_customer || false,
                      is_supplier: submissionData.is_supplier || false,
                      receivable_ac_code: submissionData.receivable_ac_code || '',
                      payable_ac_code: submissionData.payable_ac_code || '',
                      income_ac_code: submissionData.income_ac_code || '',
                      expense_ac_code: submissionData.expense_ac_code || '',
                    };
                
                    // Update the existing candidate
                    const { error: updateError } = await supabase
                      .from('candidates')
                      .update({
                        full_name: submissionData.legal_name,
                        ic_number: submissionData.registration_id?.trim() || null, // Allow null IC numbers, convert empty strings to null
                        date_of_birth: submissionData.date_of_birth || null,
                        phone_number: submissionData.phone_number,
                        gender: submissionData.gender,
                        email: submissionData.email?.trim() || null, // Allow email updates, convert empty strings to null
                        nationality: submissionData.nationality,
                        emergency_contact_name: submissionData.emergency_contact_name,
                        emergency_contact_number: submissionData.emergency_contact_number,
                        // Keep the original unique_id
                        
                        // Merge custom fields to keep any existing values not in the form
                        custom_fields: {
                          ...(existingCandidate.custom_fields || {}), 
                          ...customFields
                        },
                        
                        // Photo field that's in the schema
                        profile_photo: photoData.profile_photo || existingCandidate.profile_photo,
                        
                        // Address information
                        address_business: {
                          street: submissionData.street_business,
                          city: submissionData.city_business,
                          state: submissionData.state_business,
                          postcode: submissionData.postcode_business,
                          country_code: submissionData.country_code_business,
                        },
                        address_mailing: {
                          street: submissionData.street_mailing,
                          city: submissionData.city_mailing,
                          state: submissionData.state_mailing,
                          postcode: submissionData.postcode_mailing,
                          country_code: submissionData.country_code_mailing,
                        },
                        
                        // Default values
                        has_vehicle: submissionData.transportation === 'Car' || submissionData.transportation === 'Motorcycle',
                        vehicle_type: submissionData.transportation === 'Car' ? 'Car' : 
                                      submissionData.transportation === 'Motorcycle' ? 'Motorcycle' : null,
                      })
                      .eq('id', existingCandidate.id);
                    
                    if (updateError) throw updateError;
                    
                    toast({
                      title: 'Candidate Updated',
                      description: 'The candidate has been successfully updated.',
                    });
                    
          // Call the callback and close the dialog
          await Promise.resolve(onCandidateAdded());
          onOpenChange(false);
        } catch (updateError) {
          logger.error('Error updating candidate:', updateError);
          toast({
            title: 'Error',
            description: 'Failed to update candidate. Please try again.',
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }
        return;
      }
      
      // Check if we're updating an existing candidate (from edit mode)
      if (formData.id) {
        // We're in edit mode, perform an update
        try {
          // Prepare photo data for storage
          const photoData = {
            profile_photo: formData.profile_photo,
            full_body_photos: fullBodyPhotos.length > 0 ? fullBodyPhotos : (formData.full_body_photo ? [formData.full_body_photo] : []),
            half_body_photos: halfBodyPhotos
          };
          
          // Prepare the custom fields data
          const customFields = {
            // Basic candidate custom fields
            age: submissionData.age || '',
            race: submissionData.race || '',
            tshirt_size: submissionData.tshirt_size || '',
            transportation: submissionData.transportation || '',
            spoken_languages: submissionData.spoken_languages || '',
            height: submissionData.height || '',
            typhoid: submissionData.typhoid || 'no',
            work_experience: submissionData.work_experience || '',
            
            // Photo information
            profile_photo: photoData.profile_photo || '',
            full_body_photos: photoData.full_body_photos || [],
            half_body_photos: photoData.half_body_photos || [],
            
            // Entity and registration fields not in the schema
            entity_type: submissionData.entity_type || 'individual',
            registration_type: submissionData.registration_type || 'nric',
            old_registration_id: submissionData.old_registration_id || '',
            tin: submissionData.tin || '',
            sst_registration_no: submissionData.sst_registration_no || '',
            
            // Business/finance fields not in the schema
            is_customer: submissionData.is_customer || false,
            is_supplier: submissionData.is_supplier || false,
            receivable_ac_code: submissionData.receivable_ac_code || '',
            payable_ac_code: submissionData.payable_ac_code || '',
            income_ac_code: submissionData.income_ac_code || '',
            expense_ac_code: submissionData.expense_ac_code || '',
          };
      
          // Update the existing candidate
          const { error: updateError } = await supabase
            .from('candidates')
            .update({
              full_name: submissionData.legal_name,
              ic_number: submissionData.registration_id?.trim() || null, // Allow null IC numbers, convert empty strings to null
              date_of_birth: submissionData.date_of_birth || null,
              phone_number: submissionData.phone_number,
              gender: submissionData.gender,
              email: submissionData.email,
              nationality: submissionData.nationality,
              emergency_contact_name: submissionData.emergency_contact_name,
              emergency_contact_number: submissionData.emergency_contact_number,
              
              // All custom fields in the JSONB column
              custom_fields: customFields,
              
              // Photo field that's in the schema
              profile_photo: photoData.profile_photo,
              
              // Address information
              address_business: {
                street: submissionData.street_business,
                city: submissionData.city_business,
                state: submissionData.state_business,
                postcode: submissionData.postcode_business,
                country_code: submissionData.country_code_business,
              },
              address_mailing: {
                street: submissionData.street_mailing,
                city: submissionData.city_mailing,
                state: submissionData.state_mailing,
                postcode: submissionData.postcode_mailing,
                country_code: submissionData.country_code_mailing,
              },
              
              // Vehicle information
              has_vehicle: submissionData.transportation === 'Car' || submissionData.transportation === 'Motorcycle',
              vehicle_type: submissionData.transportation === 'Car' ? 'Car' : 
                            submissionData.transportation === 'Motorcycle' ? 'Motorcycle' : null,
              
              // Update timestamp
              updated_at: new Date().toISOString(),
            })
            .eq('id', formData.id);
          
          if (updateError) throw updateError;
          
          toast({
            title: 'Candidate Updated',
            description: 'The candidate has been successfully updated.',
          });
          
          await Promise.resolve(onCandidateAdded());
          onOpenChange(false);
        } catch (updateError) {
          logger.error('Error updating candidate:', updateError);
          toast({
            title: 'Error',
            description: 'Failed to update candidate. Please try again.',
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }
        return; // Exit early after update
      }

      // If not updating, continue with insert logic
      // Prepare photo data for storage
      const photoData = {
        profile_photo: formData.profile_photo,
        full_body_photos: fullBodyPhotos.length > 0 ? fullBodyPhotos : (formData.full_body_photo ? [formData.full_body_photo] : []),
        half_body_photos: halfBodyPhotos
      };
      
      // Prepare the custom fields data - include ALL non-standard fields
      const customFields = {
        // Basic candidate custom fields
        age: submissionData.age || '',
        race: submissionData.race || '',
        tshirt_size: submissionData.tshirt_size || '',
        transportation: submissionData.transportation || '',
        spoken_languages: submissionData.spoken_languages || '',
        height: submissionData.height || '',
        typhoid: submissionData.typhoid || 'no',
        work_experience: submissionData.work_experience || '',
        
        // Photo information
        profile_photo: photoData.profile_photo || '',
        full_body_photos: photoData.full_body_photos || [],
        half_body_photos: photoData.half_body_photos || [],
        
        // Entity and registration fields not in the schema
        entity_type: submissionData.entity_type || 'individual',
        registration_type: submissionData.registration_type || 'nric',
        old_registration_id: submissionData.old_registration_id || '',
        tin: submissionData.tin || '',
        sst_registration_no: submissionData.sst_registration_no || '',
        
        // Business/finance fields not in the schema
        is_customer: submissionData.is_customer || false,
        is_supplier: submissionData.is_supplier || false,
        receivable_ac_code: submissionData.receivable_ac_code || '',
        payable_ac_code: submissionData.payable_ac_code || '',
        income_ac_code: submissionData.income_ac_code || '',
        expense_ac_code: submissionData.expense_ac_code || '',
      };
      
      const { data, error } = await supabase.from('candidates').insert([
        {
          // Core fields that exist in the table schema
          full_name: submissionData.legal_name,
          ic_number: submissionData.registration_id || null, // Allow null IC numbers
          date_of_birth: submissionData.date_of_birth || null,
          phone_number: submissionData.phone_number,
          gender: submissionData.gender,
          email: submissionData.email, // Can be null now
          nationality: submissionData.nationality,
          emergency_contact_name: submissionData.emergency_contact_name,
          emergency_contact_number: submissionData.emergency_contact_number,
          unique_id: submissionData.unique_id,
          
          // All custom fields in the JSONB column
          custom_fields: customFields,
          
          // Photo field that's in the schema
          profile_photo: photoData.profile_photo,
          
          // Address information
          address_business: {
            street: submissionData.street_business,
            city: submissionData.city_business,
            state: submissionData.state_business,
            postcode: submissionData.postcode_business,
            country_code: submissionData.country_code_business,
          },
          address_mailing: {
            street: submissionData.street_mailing,
            city: submissionData.city_mailing,
            state: submissionData.state_mailing,
            postcode: submissionData.postcode_mailing,
            country_code: submissionData.country_code_mailing,
          },
          
          // Default values
          has_vehicle: submissionData.transportation === 'Car' || submissionData.transportation === 'Motorcycle',
          vehicle_type: submissionData.transportation === 'Car' ? 'Car' : 
                        submissionData.transportation === 'Motorcycle' ? 'Motorcycle' : null,
          is_banned: false,
          
          // Track who created this profile
          created_by: currentUser?.name || 'Unknown',
          created_by_user_id: currentUser?.id || null,
        },
      ]).select();

      if (error) {
        // If there was an error despite our duplicate checking
        if (error.code === '23505') { // Unique constraint violation
          logger.error('Duplicate key error despite our checks:', error);
          
          // Try one more approach - use upsert instead
          const { data: upsertData, error: upsertError } = await supabase
            .from('candidates')
            .upsert(
              {
                // Core fields that exist in the table schema
                full_name: submissionData.legal_name,
                ic_number: submissionData.registration_id?.trim() || null, // Allow null IC numbers, convert empty strings to null
                date_of_birth: submissionData.date_of_birth || null,
                phone_number: submissionData.phone_number,
                gender: submissionData.gender,
                email: submissionData.email?.trim() || null, // Can be null now, convert empty strings to null
                nationality: submissionData.nationality,
                emergency_contact_name: submissionData.emergency_contact_name,
                emergency_contact_number: submissionData.emergency_contact_number,
                unique_id: submissionData.unique_id,
                
                // All custom fields in the JSONB column
                custom_fields: customFields,
                
                // Photo field that's in the schema
                profile_photo: photoData.profile_photo,
                
                // Address information
                address_business: {
                  street: submissionData.street_business,
                  city: submissionData.city_business,
                  state: submissionData.state_business,
                  postcode: submissionData.postcode_business,
                  country_code: submissionData.country_code_business,
                },
                address_mailing: {
                  street: submissionData.street_mailing,
                  city: submissionData.city_mailing,
                  state: submissionData.state_mailing,
                  postcode: submissionData.postcode_mailing,
                  country_code: submissionData.country_code_mailing,
                },
                
                // Default values
                has_vehicle: submissionData.transportation === 'Car' || submissionData.transportation === 'Motorcycle',
                vehicle_type: submissionData.transportation === 'Car' ? 'Car' : 
                              submissionData.transportation === 'Motorcycle' ? 'Motorcycle' : null,
                is_banned: false,
                
                // Track who created this profile
                created_by: currentUser?.name || 'Unknown',
                created_by_user_id: currentUser?.id || null,
              },
              {
                // Use registration_id (IC number) as conflict target instead of email
                // since email can now be NULL
                onConflict: 'ic_number',
                ignoreDuplicates: false
              }
            )
            .select();
            
          if (upsertError) throw upsertError;
          
          logger.debug('Candidate upserted successfully:', { data: upsertData });
          
          toast({
            title: 'Candidate updated',
            description: 'An existing candidate was updated with this information.',
          });
          
        } else {
          throw error;
        }
      } else {
        logger.debug('Candidate added successfully:', { data: data });
        
        toast({
          title: 'Candidate added',
          description: 'The candidate has been successfully added.',
        });
      }

      logger.debug('Calling onCandidateAdded callback');
      // Ensure the callback is awaited if it's async
      await Promise.resolve(onCandidateAdded());
      onOpenChange(false);
    } catch (error) {
      logger.error('Error adding candidate:', error);
      // Handle different error types
      let errorMessage = 'Failed to add candidate. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = String(error.message);
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Function to handle language checkbox changes
  const handleLanguageChange = (language: string, checked: boolean) => {
    const currentLanguages = formData.spoken_languages ? formData.spoken_languages.split(',').map(l => l.trim()) : [];
    
    let newLanguages;
    if (checked) {
      // Add language if it's not already included
      if (!currentLanguages.includes(language)) {
        newLanguages = [...currentLanguages, language];
      } else {
        newLanguages = currentLanguages;
      }
    } else {
      // Remove language
      newLanguages = currentLanguages.filter(l => l !== language);
    }
    
    // Update the form data
    setFormData(prev => ({ 
      ...prev, 
      spoken_languages: newLanguages.join(', ') 
    }));
  };
  
  // Special handler to normalize languages when initializing form
  const normalizeLanguages = (languages: string | undefined) => {
    if (!languages) return '';
    
    return languages
      .split(',')
      .map(l => {
        const trimmed = l.trim();
        // Handle special case: map "Chinese" to "Mandarin"
        return trimmed.toLowerCase() === 'chinese' ? 'Mandarin' : trimmed;
      })
      .join(', ');
  };
  
  const handleProfilePhotoChange = (photo: string, type: string) => {
    if (type === 'face') {
      setFormData(prev => ({ ...prev, profile_photo: photo }));
      setPhotoValidation(prev => ({ ...prev, profilePhoto: true }));
    } else {
      setFormData(prev => ({ ...prev, full_body_photo: photo }));
      
      // Add to full body photos array if it doesn't exist already
      if (!fullBodyPhotos.includes(photo)) {
        setFullBodyPhotos(prev => {
          const newPhotos = [...prev, photo];
          setPhotoValidation(validation => ({ 
            ...validation, 
            fullBodyPhotos: newPhotos.length > 0 
          }));
          return newPhotos;
        });
      }
    }
  };
  
  const handleFullBodyPhotoChange = (photo: string) => {
    setFormData(prev => ({ ...prev, full_body_photo: photo }));
    
    // Add to full body photos array if it doesn't exist already
    if (!fullBodyPhotos.includes(photo)) {
      setFullBodyPhotos(prev => {
        const newPhotos = [...prev, photo];
        setPhotoValidation(validation => ({ 
          ...validation, 
          fullBodyPhotos: newPhotos.length > 0 
        }));
        return newPhotos;
      });
    }
  };
  
  const handleHalfBodyPhotoChange = (photo: string, index?: number) => {
    // Add to half body photos array
    setHalfBodyPhotos(prev => {
      let newPhotos = [...prev];
      // If index is provided, update that specific slot
      if (index !== undefined && index >= 0 && index < 3) {
        newPhotos[index] = photo;
      } else {
        // Otherwise add it to the array
        newPhotos.push(photo);
      }
      // Limit to 3 photos
      newPhotos = newPhotos.slice(0, 3);
      
      setPhotoValidation(validation => ({ 
        ...validation, 
        halfBodyPhotos: newPhotos.length > 0 
      }));
      
      return newPhotos;
    });
  };
  
  const removeFullBodyPhoto = (index: number) => {
    setFullBodyPhotos(prev => {
      const newPhotos = [...prev];
      newPhotos.splice(index, 1);
      setPhotoValidation(validation => ({ 
        ...validation, 
        fullBodyPhotos: newPhotos.length > 0 
      }));
      return newPhotos;
    });
    
    // If removing the main full body photo
    if (index === 0 && fullBodyPhotos.length > 1) {
      setFormData(prev => ({ ...prev, full_body_photo: fullBodyPhotos[1] }));
    } else if (index === 0) {
      setFormData(prev => ({ ...prev, full_body_photo: '' }));
    }
  };
  
  const removeHalfBodyPhoto = (index: number) => {
    setHalfBodyPhotos(prev => {
      const newPhotos = [...prev];
      newPhotos.splice(index, 1);
      setPhotoValidation(validation => ({ 
        ...validation, 
        halfBodyPhotos: newPhotos.length > 0 
      }));
      return newPhotos;
    });
  };

  const countryCodes = [
    { code: 'MY', name: 'Malaysia' },
    { code: 'SG', name: 'Singapore' },
    { code: 'TH', name: 'Thailand' },
    { code: 'ID', name: 'Indonesia' },
    { code: 'PH', name: 'Philippines' },
    { code: 'VN', name: 'Vietnam' },
    { code: 'MM', name: 'Myanmar' },
    { code: 'BN', name: 'Brunei' },
    { code: 'LA', name: 'Laos' },
    { code: 'KH', name: 'Cambodia' },
    { code: 'CN', name: 'China' },
    { code: 'JP', name: 'Japan' },
    { code: 'KR', name: 'South Korea' },
  ];
  
  const commonLanguages = [
    { id: 'malay', name: 'Malay' },
    { id: 'english', name: 'English' },
    { id: 'mandarin', name: 'Mandarin' },
    { id: 'cantonese', name: 'Cantonese' },
  ];

  const entityTypes = [
    { value: 'individual', label: 'Individual' },
    { value: 'sole_proprietor', label: 'Sole Proprietor' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'private_company', label: 'Private Limited Company' },
    { value: 'public_company', label: 'Public Limited Company' },
    { value: 'government', label: 'Government' },
    { value: 'non_profit', label: 'Non-Profit' },
  ];

  const registrationTypes = [
    { value: 'nric', label: 'National Registration ID Card (NRIC)' },
    { value: 'passport', label: 'Passport' },
    { value: 'business_registration', label: 'Business Registration' },
    { value: 'company_registration', label: 'Company Registration' },
    { value: 'professional_license', label: 'Professional License' },
    { value: 'tax_number', label: 'Tax Number' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{formData.id ? 'Edit Candidate' : 'Add New Candidate'}</DialogTitle>
          <DialogDescription>
            {formData.id ? 'Update the candidate\'s information below.' : 'Enter candidate information across all required tabs.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="basic" className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                <span>Candidate Details</span>
              </TabsTrigger>
              <TabsTrigger value="photos" className="flex items-center gap-1.5">
                <Camera className="h-4 w-4" />
                <span>Photos</span>
              </TabsTrigger>
              <TabsTrigger value="address" className="flex items-center gap-1.5">
                <Home className="h-4 w-4" />
                <span>Address</span>
              </TabsTrigger>
              <TabsTrigger value="financial" className="flex items-center gap-1.5">
                <CreditCard className="h-4 w-4" />
                <span>Financial</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Photos Tab */}
            <TabsContent value="photos" className="space-y-4">
              <div className="py-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold mb-2">Candidate Photos</h3>
                  <p className="text-sm text-muted-foreground">
                    All photos are optional but recommended for better candidate profiles
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                  {/* Profile Photo Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-medium">Profile Photo</h4>
                      <span className="bg-slate-500 text-white text-xs px-1.5 py-0.5 rounded-full">Optional</span>
                    </div>
                    <div 
                      className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 flex flex-col items-center justify-center"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.currentTarget.classList.add('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
                        
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          const file = e.dataTransfer.files[0];
                          if (file.type.startsWith('image/')) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) {
                                handleProfilePhotoChange(event.target.result as string, 'face');
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }
                      }}
                    >
                      <div className="mb-2 relative">
                        <ProfileUpload 
                          seedValue={formData.legal_name || 'candidate'}
                          value={formData.profile_photo}
                          onChange={(photo) => handleProfilePhotoChange(photo, 'face')}
                          showFullBody={false}
                        />
                        {formData.profile_photo && (
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, profile_photo: '' }))}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                            aria-label="Remove profile photo"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-center text-muted-foreground mt-1">
                        Passport-sized photo (click or drag to upload)
                      </p>
                    </div>
                  </div>
                  
                  {/* Full Body Photos Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-medium">Full Body Photos</h4>
                      <span className="bg-slate-500 text-white text-xs px-1.5 py-0.5 rounded-full">Optional</span>
                    </div>
                    
                    {/* Full Body Photo Upload */}
                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                      {/* First Full Body Photo with Drag & Drop */}
                      <div 
                        className="relative w-full h-[160px] mb-2 border border-dashed border-slate-300 dark:border-slate-600 rounded-md overflow-hidden"
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          e.currentTarget.classList.add('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
                          
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            const file = e.dataTransfer.files[0];
                            if (file.type.startsWith('image/')) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  handleFullBodyPhotoChange(event.target.result as string);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }
                        }}
                      >
                        {formData.full_body_photo ? (
                          <img 
                            src={formData.full_body_photo}
                            alt="Full body"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center" 
                              onClick={() => document.getElementById('full-body-upload')?.click()}>
                            <Upload className="h-10 w-10 text-slate-400 mb-2" />
                            <p className="text-sm font-medium">Full Body Photo</p>
                            <p className="text-xs text-muted-foreground mt-1">Click or drag image here</p>
                            <input 
                              type="file" 
                              id="full-body-upload" 
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  const file = e.target.files[0];
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    if (event.target?.result) {
                                      handleFullBodyPhotoChange(event.target.result as string);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </div>
                        )}
                        {formData.full_body_photo && (
                          <>
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                                onClick={() => document.getElementById('full-body-upload')?.click()}>
                              <Camera className="h-8 w-8 text-white" />
                              <input 
                                type="file" 
                                id="full-body-upload" 
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    const file = e.target.files[0];
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      if (event.target?.result) {
                                        handleFullBodyPhotoChange(event.target.result as string);
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFormData(prev => ({ ...prev, full_body_photo: '' }));
                              }}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 z-10"
                              aria-label="Remove full body photo"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                      
                      {/* Additional Full Body Photo Placeholders */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative w-full h-[80px] border border-dashed border-slate-300 dark:border-slate-600 rounded-md overflow-hidden opacity-60 hover:opacity-100 transition-opacity">
                          <div className="w-full h-full flex flex-col items-center justify-center cursor-pointer"
                               onClick={() => document.getElementById('full-body-upload-2')?.click()}>
                            <Upload className="h-6 w-6 text-slate-400 mb-1" />
                            <p className="text-xs">Optional</p>
                            <input 
                              type="file" 
                              id="full-body-upload-2" 
                              className="hidden"
                              accept="image/*"
                            />
                          </div>
                        </div>
                        
                        <div className="relative w-full h-[80px] border border-dashed border-slate-300 dark:border-slate-600 rounded-md overflow-hidden opacity-60 hover:opacity-100 transition-opacity">
                          <div className="w-full h-full flex flex-col items-center justify-center cursor-pointer"
                               onClick={() => document.getElementById('full-body-upload-3')?.click()}>
                            <Upload className="h-6 w-6 text-slate-400 mb-1" />
                            <p className="text-xs">Optional</p>
                            <input 
                              type="file" 
                              id="full-body-upload-3" 
                              className="hidden"
                              accept="image/*"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-xs text-center text-muted-foreground mt-2">
                        Full length standing photos (at least 1)
                      </p>
                    </div>
                  </div>
                  
                  {/* Half Body Photos Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-medium">Half Body Photos</h4>
                      <span className="bg-slate-500 text-white text-xs px-1.5 py-0.5 rounded-full">Optional</span>
                    </div>
                    
                    {/* Half Body Photo Upload */}
                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                      {/* First Half Body Photo */}
                      <div 
                        className="relative w-full h-[160px] mb-2 border border-dashed border-slate-300 dark:border-slate-600 rounded-md overflow-hidden"
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          e.currentTarget.classList.add('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
                          
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            const file = e.dataTransfer.files[0];
                            if (file.type.startsWith('image/')) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  handleHalfBodyPhotoChange(event.target.result as string, 0);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }
                        }}
                      >
                        {halfBodyPhotos[0] ? (
                          <img 
                            src={halfBodyPhotos[0]}
                            alt="Half body"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center cursor-pointer"
                               onClick={() => document.getElementById('half-body-upload')?.click()}>
                            <Upload className="h-10 w-10 text-slate-400 mb-2" />
                            <p className="text-sm font-medium">Half Body Photo</p>
                            <p className="text-xs text-muted-foreground mt-1">Click or drag image here</p>
                            <input 
                              type="file" 
                              id="half-body-upload" 
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  const file = e.target.files[0];
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    if (event.target?.result) {
                                      handleHalfBodyPhotoChange(event.target.result as string, 0);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </div>
                        )}
                        {halfBodyPhotos[0] && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => removeHalfBodyPhoto(0)}
                              className="p-1.5 bg-red-500 text-white rounded-full mr-2"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => document.getElementById('half-body-upload')?.click()}
                              className="p-1.5 bg-blue-500 text-white rounded-full"
                            >
                              <Camera className="h-4 w-4" />
                            </button>
                            <input 
                              type="file" 
                              id="half-body-upload" 
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  const file = e.target.files[0];
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    if (event.target?.result) {
                                      handleHalfBodyPhotoChange(event.target.result as string, 0);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* Additional Half Body Photo Placeholders */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* Second Half Body Photo */}
                        <div 
                          className="relative w-full h-[80px] border border-dashed border-slate-300 dark:border-slate-600 rounded-md overflow-hidden opacity-60 hover:opacity-100 transition-opacity"
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.currentTarget.classList.add('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
                            
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              const file = e.dataTransfer.files[0];
                              if (file.type.startsWith('image/')) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  if (event.target?.result) {
                                    handleHalfBodyPhotoChange(event.target.result as string, 1);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }
                          }}
                        >
                          {halfBodyPhotos[1] ? (
                            <>
                              <img 
                                src={halfBodyPhotos[1]}
                                alt="Half body 2"
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeHalfBodyPhoto(1)}
                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 z-10"
                                aria-label="Remove half body photo"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center cursor-pointer"
                                 onClick={() => document.getElementById('half-body-upload-2')?.click()}>
                              <Upload className="h-6 w-6 text-slate-400 mb-1" />
                              <p className="text-xs">Optional</p>
                              <input 
                                type="file" 
                                id="half-body-upload-2" 
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    const file = e.target.files[0];
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      if (event.target?.result) {
                                        handleHalfBodyPhotoChange(event.target.result as string, 1);
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </div>
                          )}
                          {halfBodyPhotos[1] && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => removeHalfBodyPhoto(1)}
                                className="p-1 bg-red-500 text-white rounded-full mr-1"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => document.getElementById('half-body-upload-2')?.click()}
                                className="p-1 bg-blue-500 text-white rounded-full"
                              >
                                <Camera className="h-3 w-3" />
                              </button>
                              <input 
                                type="file" 
                                id="half-body-upload-2" 
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    const file = e.target.files[0];
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      if (event.target?.result) {
                                        handleHalfBodyPhotoChange(event.target.result as string, 1);
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </div>
                          )}
                        </div>
                        
                        {/* Third Half Body Photo */}
                        <div 
                          className="relative w-full h-[80px] border border-dashed border-slate-300 dark:border-slate-600 rounded-md overflow-hidden opacity-60 hover:opacity-100 transition-opacity"
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.currentTarget.classList.add('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
                            
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              const file = e.dataTransfer.files[0];
                              if (file.type.startsWith('image/')) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  if (event.target?.result) {
                                    handleHalfBodyPhotoChange(event.target.result as string, 2);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }
                          }}
                        >
                          {halfBodyPhotos[2] ? (
                            <>
                              <img 
                                src={halfBodyPhotos[2]}
                                alt="Half body 3"
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeHalfBodyPhoto(2)}
                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 z-10"
                                aria-label="Remove half body photo"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center cursor-pointer"
                                 onClick={() => document.getElementById('half-body-upload-3')?.click()}>
                              <Upload className="h-6 w-6 text-slate-400 mb-1" />
                              <p className="text-xs">Optional</p>
                              <input 
                                type="file" 
                                id="half-body-upload-3" 
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    const file = e.target.files[0];
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      if (event.target?.result) {
                                        handleHalfBodyPhotoChange(event.target.result as string, 2);
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </div>
                          )}
                          {halfBodyPhotos[2] && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => removeHalfBodyPhoto(2)}
                                className="p-1 bg-red-500 text-white rounded-full mr-1"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => document.getElementById('half-body-upload-3')?.click()}
                                className="p-1 bg-blue-500 text-white rounded-full"
                              >
                                <Camera className="h-3 w-3" />
                              </button>
                              <input 
                                type="file" 
                                id="half-body-upload-3" 
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    const file = e.target.files[0];
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      if (event.target?.result) {
                                        handleHalfBodyPhotoChange(event.target.result as string, 2);
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-xs text-center text-muted-foreground mt-2">
                        Waist-up photos (at least 1)
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="rounded-md bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-3 text-center text-sm text-slate-500 dark:text-slate-400 mt-2">
                  <p className="flex items-center justify-center gap-1.5">
                    <Camera className="h-4 w-4" />
                    All photos must be less than 5MB in size and in JPG, JPEG, or PNG format
                  </p>
                </div>
                
                <div className="flex justify-between pt-6">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("basic")}>
                    Previous: Basic
                  </Button>
                  <Button type="button" onClick={() => setActiveTab("address")}>
                    Next: Address
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            {/* Candidate Details Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid gap-4 py-4">
                {/* Hidden field for unique_id */}
                <input 
                  type="hidden" 
                  name="unique_id" 
                  value={formData.unique_id} 
                />
                
                {/* Business Type */}
                <div className="mb-6">
                  <div className="mb-2">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Business Type</h3>
                  </div>
                  
                  <div className="flex items-center gap-6 mb-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_customer"
                        name="is_customer"
                        checked={formData.is_customer}
                        onChange={handleCheckboxChange}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <Label htmlFor="is_customer" className="font-medium">Is Customer</Label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_supplier"
                        name="is_supplier"
                        checked={formData.is_supplier}
                        onChange={handleCheckboxChange}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <Label htmlFor="is_supplier" className="font-medium">Is Supplier</Label>
                    </div>
                  </div>
                  
                  {(formData.is_customer || formData.is_supplier) && (
                    <div className="border border-slate-200 dark:border-slate-700 rounded-md p-4 bg-white dark:bg-slate-900/50 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="entity_type">Entity Type</Label>
                          <Select
                            value={formData.entity_type}
                            onValueChange={(value) => handleSelectChange('entity_type', value)}
                          >
                            <SelectTrigger className={inputClass}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {entityTypes.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="registration_type">Registration Type</Label>
                          <Select
                            value={formData.registration_type}
                            onValueChange={(value) => handleSelectChange('registration_type', value)}
                          >
                            <SelectTrigger className={inputClass}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {registrationTypes.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="tin">Tax Identification Number (TIN)</Label>
                          <Input
                            id="tin"
                            name="tin"
                            value={formData.tin}
                            onChange={handleInputChange}
                            className={inputClass}
                          />
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="sst_registration_no">SST Registration No.</Label>
                          <Input
                            id="sst_registration_no"
                            name="sst_registration_no"
                            value={formData.sst_registration_no}
                            onChange={handleInputChange}
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Identity Information */}
                <div className="mb-6">
                  <div className="mb-2">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Identity Information</h3>
                  </div>
                  
                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/30 space-y-4">
                    <div className="grid gap-3">
                      <Label htmlFor="legal_name">Legal Name / Full Name *</Label>
                      <Input
                        id="legal_name"
                        name="legal_name"
                        value={formData.legal_name}
                        onChange={handleInputChange}
                        className={inputClass}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-3">
                        <Label htmlFor="registration_id">
                          Registration / ID No.
                        </Label>
                        <div className="relative">
                          <Input
                            id="registration_id"
                            name="registration_id"
                            value={formData.registration_id}
                            onChange={(e) => {
                              // Remove any dashes from input
                              const formattedValue = e.target.value.replace(/-/g, '');
                              setFormData(prev => ({ ...prev, registration_id: formattedValue }));
                            }}
                            className={inputClass}
                            required
                            placeholder="e.g: 951101125155"
                            style={{ color: 'var(--text-primary)', opacity: 0.7 }}
                          />
                          <div className="absolute right-0 top-0 h-full flex items-center pr-3 pointer-events-none">
                            <span className="text-xs text-slate-400">Not editable</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid gap-3">
                        <Label htmlFor="old_registration_id">Old Registration No.</Label>
                        <Input
                          id="old_registration_id"
                          name="old_registration_id"
                          value={formData.old_registration_id}
                          onChange={handleInputChange}
                          disabled={!(formData.is_customer || formData.is_supplier)}
                          className={`${inputClass} ${!(formData.is_customer || formData.is_supplier) ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : ''}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Contact Information */}
                <div className="mb-6">
                  <div className="mb-2">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Contact Information</h3>
                  </div>
                  
                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/30 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-3">
                        <Label htmlFor="phone_number">Contact No.</Label>
                        <Input
                          id="phone_number"
                          name="phone_number"
                          value={formData.phone_number}
                          onChange={handleInputChange}
                          className={inputClass}
                          required
                        />
                      </div>
                      
                      <div className="grid gap-3">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email || ''}
                          onChange={handleInputChange}
                          className={inputClass}
                          // Email is now optional
                        />
                      </div>
                    </div>
                    
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-3">
                          <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                          <Input
                            id="emergency_contact_name"
                            name="emergency_contact_name"
                            value={formData.emergency_contact_name}
                            onChange={handleInputChange}
                            className={inputClass}
                          />
                        </div>
                        
                        <div className="grid gap-3">
                          <Label htmlFor="emergency_contact_number">Emergency Contact Number</Label>
                          <Input
                            id="emergency_contact_number"
                            name="emergency_contact_number"
                            value={formData.emergency_contact_number}
                            onChange={handleInputChange}
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Personal Details */}
                <div className="mb-6">
                  <div className="mb-2">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Personal Details</h3>
                  </div>
                  
                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/30 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="grid gap-3">
                        <Label htmlFor="gender">Gender</Label>
                        <Select
                          defaultValue="male"
                          value={formData.gender}
                          onValueChange={(value) => handleSelectChange('gender', value)}
                        >
                          <SelectTrigger className={inputClass}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid gap-3">
                        <Label htmlFor="date_of_birth">Date of Birth</Label>
                        <Input
                          id="date_of_birth"
                          name="date_of_birth"
                          type="date"
                          value={formData.date_of_birth}
                          onChange={handleInputChange}
                          className={inputClass}
                        />
                      </div>
                      
                      <div className="grid gap-3">
                        <Label htmlFor="nationality">Nationality</Label>
                        <Input
                          id="nationality"
                          name="nationality"
                          value={formData.nationality}
                          onChange={handleInputChange}
                          className={inputClass}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="grid gap-3">
                        <Label htmlFor="age">Age</Label>
                        <Input
                          id="age"
                          name="age"
                          value={formData.age}
                          onChange={handleInputChange}
                          className={inputClass}
                        />
                      </div>
                      
                      <div className="grid gap-3">
                        <Label htmlFor="race">Race</Label>
                        <Input
                          id="race"
                          name="race"
                          value={formData.race}
                          onChange={handleInputChange}
                          className={inputClass}
                        />
                      </div>
                      
                      <div className="grid gap-3">
                        <Label htmlFor="height">Height (cm)</Label>
                        <Input
                          id="height"
                          name="height"
                          value={formData.height}
                          onChange={handleInputChange}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Crew Information */}
                <div className="mb-6">
                  <div className="mb-2">
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Crew Information</h3>
                  </div>
                  
                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/30 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="grid gap-3">
                        <Label htmlFor="tshirt_size">T-Shirt Size</Label>
                        <Select
                          value={formData.tshirt_size}
                          onValueChange={(value) => handleSelectChange('tshirt_size', value)}
                        >
                          <SelectTrigger className={inputClass}>
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="XS">XS</SelectItem>
                            <SelectItem value="S">S</SelectItem>
                            <SelectItem value="M">M</SelectItem>
                            <SelectItem value="L">L</SelectItem>
                            <SelectItem value="XL">XL</SelectItem>
                            <SelectItem value="XXL">XXL</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid gap-3">
                        <Label htmlFor="transportation">Transportation</Label>
                        <Select
                          value={formData.transportation}
                          onValueChange={(value) => handleSelectChange('transportation', value)}
                        >
                          <SelectTrigger className={inputClass}>
                            <SelectValue placeholder="Select transportation" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Car">Car</SelectItem>
                            <SelectItem value="Motorcycle">Motorcycle</SelectItem>
                            <SelectItem value="Public">Public Transportation</SelectItem>
                            <SelectItem value="Rideshare">Rideshare</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid gap-3">
                        <Label htmlFor="typhoid">Typhoid</Label>
                        <Select
                          value={formData.typhoid}
                          onValueChange={(value) => handleSelectChange('typhoid', value)}
                        >
                          <SelectTrigger className={inputClass}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <Label htmlFor="spoken_languages" className="mb-3 block">Spoken Languages</Label>
                      <div className="space-y-4">
                        <div className="p-3 border rounded-md bg-slate-100 dark:bg-slate-800/70">
                          <Label className="text-sm font-medium mb-2 block">Common Languages</Label>
                          <div className="grid grid-cols-2 gap-4">
                            {commonLanguages.map(language => {
                              // Check if this language is selected
                              // Also consider "Chinese" as "Mandarin" for backward compatibility
                              const isSelected = formData.spoken_languages ? 
                                formData.spoken_languages.split(',').map(l => l.trim()).some(l => 
                                  l === language.name || (language.name === 'Mandarin' && l === 'Chinese')
                                ) : 
                                false;
                                
                              return (
                                <div key={language.id} className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id={`lang-${language.id}`}
                                    checked={isSelected}
                                    onChange={(e) => handleLanguageChange(language.name, e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <Label htmlFor={`lang-${language.id}`} className="text-sm font-normal cursor-pointer">
                                    {language.name}{language.name === 'Mandarin' && <span className="text-xs text-slate-400 ml-1">(Chinese)</span>}
                                  </Label>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        <div className="p-3 border rounded-md bg-slate-100 dark:bg-slate-800/70">
                          <Label htmlFor="others-language" className="text-sm font-medium mb-2 block">Other Languages</Label>
                          <Input
                            id="others-language"
                            placeholder="Enter other languages (Chinese will automatically select Mandarin)"
                            value={
                              // Get languages that are not in the common list
                              formData.spoken_languages ? 
                                formData.spoken_languages
                                  .split(',')
                                  .map(l => l.trim())
                                  .filter(l => !commonLanguages.some(cl => cl.name === l))
                                  .join(', ') : 
                                ''
                            }
                            onChange={(e) => {
                              const inputValue = e.target.value;
                              
                              // Check if "Chinese" is mentioned in the input
                              const hasChinese = inputValue.toLowerCase().includes('chinese');
                              
                              // Current common languages that are selected
                              const commonSelected = formData.spoken_languages ? 
                                formData.spoken_languages
                                  .split(',')
                                  .map(l => l.trim())
                                  .filter(l => commonLanguages.some(cl => cl.name === l)) : 
                                [];
                              
                              // If Chinese is detected, ensure Mandarin is in the selected list
                              const updatedCommonSelected = [...commonSelected];
                              if (hasChinese && !updatedCommonSelected.includes('Mandarin')) {
                                updatedCommonSelected.push('Mandarin');
                                
                                // Remove "Chinese" from the input text since we're handling it specially
                                const chineseRegex = /\b(?:chinese|mandarin)\b/gi;
                                const cleanedInput = inputValue.replace(chineseRegex, '').replace(/,\s*,/g, ',').replace(/^,|,$/g, '');
                                e.target.value = cleanedInput;
                              }
                              
                              // Process other languages
                              const otherLanguages = e.target.value
                                .split(',')
                                .map(l => l.trim())
                                .filter(l => l !== '');
                                
                              setFormData(prev => ({
                                ...prev,
                                spoken_languages: [...updatedCommonSelected, ...otherLanguages].join(', ')
                              }));
                            }}
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid gap-3 pt-2">
                      <Label htmlFor="work_experience">Work Experience</Label>
                      <Textarea
                        id="work_experience"
                        name="work_experience"
                        value={formData.work_experience}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="List recent work experience"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="button" onClick={() => setActiveTab("photos")}>
                  Next: Photos
                </Button>
              </div>
            </TabsContent>
            
            {/* Address Tab */}
            <TabsContent value="address" className="space-y-4">
              <div className="border p-4 rounded-md mb-4">
                <h3 className="font-medium text-lg mb-3 flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Business Address
                </h3>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="street_business">Street Address</Label>
                    <Textarea
                      id="street_business"
                      name="street_business"
                      value={formData.street_business}
                      onChange={handleInputChange}
                      rows={2}
                      className={inputClass}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="city_business">City</Label>
                      <Input
                        id="city_business"
                        name="city_business"
                        value={formData.city_business}
                        onChange={handleInputChange}
                        className={inputClass}
                        required
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="state_business">State</Label>
                      <Input
                        id="state_business"
                        name="state_business"
                        value={formData.state_business}
                        onChange={handleInputChange}
                        className={inputClass}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="postcode_business">Postcode</Label>
                      <Input
                        id="postcode_business"
                        name="postcode_business"
                        value={formData.postcode_business}
                        onChange={handleInputChange}
                        className={inputClass}
                        required
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="country_code_business">Country</Label>
                      <Select
                        defaultValue="MY"
                        value={formData.country_code_business}
                        onValueChange={(value) => handleSelectChange('country_code_business', value)}
                      >
                        <SelectTrigger className={inputClass}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {countryCodes.map(country => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border p-4 rounded-md">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-lg flex items-center">
                    <Home className="h-5 w-5 mr-2" />
                    Mailing Address
                  </h3>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="use_business_address"
                      name="use_business_address"
                      checked={formData.use_business_address}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2"
                    />
                    <Label htmlFor="use_business_address" className="text-sm font-normal">
                      Same as Business Address
                    </Label>
                  </div>
                </div>
                
                {!formData.use_business_address && (
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="street_mailing">Street Address</Label>
                      <Textarea
                        id="street_mailing"
                        name="street_mailing"
                        value={formData.street_mailing}
                        onChange={handleInputChange}
                        rows={2}
                        className={inputClass}
                        required={!formData.use_business_address}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="city_mailing">City</Label>
                        <Input
                          id="city_mailing"
                          name="city_mailing"
                          value={formData.city_mailing}
                          onChange={handleInputChange}
                          className={inputClass}
                          required={!formData.use_business_address}
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="state_mailing">State</Label>
                        <Input
                          id="state_mailing"
                          name="state_mailing"
                          value={formData.state_mailing}
                          onChange={handleInputChange}
                          className={inputClass}
                          required={!formData.use_business_address}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="postcode_mailing">Postcode</Label>
                        <Input
                          id="postcode_mailing"
                          name="postcode_mailing"
                          value={formData.postcode_mailing}
                          onChange={handleInputChange}
                          className={inputClass}
                          required={!formData.use_business_address}
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="country_code_mailing">Country</Label>
                        <Select
                          defaultValue="MY"
                          value={formData.country_code_mailing}
                          onValueChange={(value) => handleSelectChange('country_code_mailing', value)}
                        >
                          <SelectTrigger className={inputClass}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {countryCodes.map(country => (
                              <SelectItem key={country.code} value={country.code}>
                                {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
                
                {formData.use_business_address && (
                  <div className="border border-dashed border-gray-300 rounded-md p-3 bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Using business address for mailing
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={() => setActiveTab("photos")}>
                  Previous: Photos
                </Button>
                <Button type="button" onClick={() => setActiveTab("financial")}>
                  Next: Financial
                </Button>
              </div>
            </TabsContent>
            
            {/* Financial Tab */}
            <TabsContent value="financial" className="space-y-4">
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="receivable_ac_code">Receivable A/C Code</Label>
                    <Input
                      id="receivable_ac_code"
                      name="receivable_ac_code"
                      value={formData.receivable_ac_code}
                      onChange={handleInputChange}
                      className={inputClass}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="payable_ac_code">Payable A/C Code</Label>
                    <Input
                      id="payable_ac_code"
                      name="payable_ac_code"
                      value={formData.payable_ac_code}
                      onChange={handleInputChange}
                      className={inputClass}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="income_ac_code">Income A/C Code</Label>
                    <Input
                      id="income_ac_code"
                      name="income_ac_code"
                      value={formData.income_ac_code}
                      onChange={handleInputChange}
                      className={inputClass}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="expense_ac_code">Expense A/C Code</Label>
                    <Input
                      id="expense_ac_code"
                      name="expense_ac_code"
                      value={formData.expense_ac_code}
                      onChange={handleInputChange}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={() => setActiveTab("address")}>
                  Previous: Address
                </Button>
                <Button type="submit" disabled={isLoading} className="min-w-[100px]">
                  {isLoading ? 'Adding...' : 'Add Candidate'}
                </Button>
              </div>
            </TabsContent>
            
          </Tabs>
        </form>
      </DialogContent>
    </Dialog>
  );
}