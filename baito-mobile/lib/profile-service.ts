import { supabase } from './supabase';

export interface CandidateProfile {
  id: string;
  full_name: string;
  ic_number: string;
  date_of_birth?: string;
  phone_number: string;
  gender: string;
  email: string;
  nationality?: string;
  race?: string;
  shirt_size?: string;
  languages?: string[];
  languages_spoken?: string; // Legacy field

  // Address
  address_business?: any;
  address_mailing?: any;
  current_address?: string;
  has_vehicle: boolean;
  vehicle_type?: string;

  // Emergency Contact
  emergency_contact_name?: string;
  emergency_contact_number?: string;
  emergency_contact_relationship?: string;

  // Education & Work
  highest_education?: string;
  field_of_study?: string;
  work_experience?: string;

  // Banking
  not_own_account: boolean;
  bank_account_name?: string;
  bank_account_relationship?: string;
  bank_name?: string;
  bank_account_number?: string;
  tin?: string;

  created_at?: string;
  updated_at?: string;
}

/**
 * Get the current authenticated user's profile
 */
export async function getCurrentUserProfile(): Promise<CandidateProfile | null> {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return null;
    }

    // Fetch candidate profile using user email
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('email', user.email)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data as CandidateProfile;
  } catch (error) {
    console.error('Error in getCurrentUserProfile:', error);
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  candidateId: string,
  updates: Partial<CandidateProfile>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('candidates')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', candidateId);

    if (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in updateUserProfile:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Calculate age from IC number (Malaysian format: YYMMDD-XX-XXXX)
 */
export function calculateAgeFromIC(icNumber: string): string {
  if (!icNumber || icNumber.length < 6) return '';

  try {
    const yearPart = icNumber.substring(0, 2);
    const monthPart = icNumber.substring(2, 4);
    const dayPart = icNumber.substring(4, 6);

    // Determine century (00-25 = 2000s, 26-99 = 1900s)
    const year = parseInt(yearPart) <= 25 ? 2000 + parseInt(yearPart) : 1900 + parseInt(yearPart);
    const month = parseInt(monthPart);
    const day = parseInt(dayPart);

    const birthDate = new Date(year, month - 1, day);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return `${age} years`;
  } catch (error) {
    console.error('Error calculating age:', error);
    return '';
  }
}

/**
 * Format languages array for display
 */
export function formatLanguages(languages?: string[] | string): string[] {
  if (!languages) return [];

  if (Array.isArray(languages)) {
    return languages;
  }

  // Handle comma-separated string (legacy format)
  if (typeof languages === 'string') {
    return languages.split(',').map(lang => lang.trim()).filter(Boolean);
  }

  return [];
}

/**
 * Get transport type from has_vehicle boolean
 */
export function getTransportType(hasVehicle: boolean, vehicleType?: string): string {
  if (!hasVehicle) {
    return 'Public transport';
  }
  return 'I have own vehicle';
}
