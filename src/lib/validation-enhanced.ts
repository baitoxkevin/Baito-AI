/**
 * Enhanced validation utilities for candidate profile with auto-formatting
 * Web version ported from mobile
 */

export interface ValidationResult {
  isValid: boolean;
  errors: { [key: string]: string };
}

export interface RequiredField {
  field: string;
  label: string;
}

export const REQUIRED_FIELDS: RequiredField[] = [
  { field: 'full_name', label: 'Full Name' },
  { field: 'nationality', label: 'Nationality' },
  { field: 'ic_number', label: 'IC Number' },
  { field: 'gender', label: 'Gender' },
  { field: 'phone', label: 'Phone Number' },
  { field: 'email', label: 'Email' },
];

/**
 * Auto-format IC number (Malaysian: YYMMDD-XX-XXXX)
 */
export function formatICNumber(icNumber: string): string {
  if (!icNumber) return '';

  // Remove all non-digit characters
  const cleaned = icNumber.replace(/\D/g, '');

  // Format as YYMMDD-XX-XXXX
  if (cleaned.length <= 6) {
    return cleaned;
  } else if (cleaned.length <= 8) {
    return `${cleaned.substring(0, 6)}-${cleaned.substring(6)}`;
  } else {
    return `${cleaned.substring(0, 6)}-${cleaned.substring(6, 8)}-${cleaned.substring(8, 12)}`;
  }
}

/**
 * Validate IC number format (Malaysian: YYMMDD-XX-XXXX)
 */
export function validateICNumber(icNumber: string): boolean {
  if (!icNumber) return false;

  // Remove spaces and dashes
  const cleaned = icNumber.replace(/[\s-]/g, '');

  // Should be 12 digits
  if (cleaned.length !== 12) return false;

  // Should be all digits
  if (!/^\d+$/.test(cleaned)) return false;

  // Validate date part (YYMMDD)
  const year = parseInt(cleaned.substring(0, 2));
  const month = parseInt(cleaned.substring(2, 4));
  const day = parseInt(cleaned.substring(4, 6));

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  return true;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Auto-format phone number (Malaysian format)
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';

  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');

  // Ensure it starts with 60 (Malaysian country code)
  if (cleaned.length > 0 && !cleaned.startsWith('60')) {
    // If starts with 0, replace with 60
    if (cleaned.startsWith('0')) {
      cleaned = '60' + cleaned.substring(1);
    } else if (cleaned.length >= 9) {
      // Assume it's missing country code
      cleaned = '60' + cleaned;
    }
  }

  // Format as 60X-XXXX-XXXX or 60XX-XXX-XXXX
  if (cleaned.length <= 3) {
    return cleaned;
  } else if (cleaned.length <= 6) {
    return `${cleaned.substring(0, 3)}-${cleaned.substring(3)}`;
  } else if (cleaned.length <= 10) {
    return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
  } else {
    return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 7)}-${cleaned.substring(7, 11)}`;
  }
}

/**
 * Validate phone number (Malaysian: starts with 60)
 */
export function validatePhone(phone: string): boolean {
  if (!phone) return false;

  // Remove spaces and dashes
  const cleaned = phone.replace(/[\s-]/g, '');

  // Should be at least 10 digits
  if (cleaned.length < 10) return false;

  // Should be all digits
  if (!/^\d+$/.test(cleaned)) return false;

  return true;
}

/**
 * Validate profile data
 */
export function validateProfileData(data: any): ValidationResult {
  const errors: { [key: string]: string } = {};

  // Check required fields
  REQUIRED_FIELDS.forEach(({ field, label }) => {
    if (!data[field] || data[field].toString().trim() === '') {
      errors[field] = `${label} is required`;
    }
  });

  // Validate IC number format
  if (data.ic_number && !validateICNumber(data.ic_number)) {
    errors.ic_number = 'Invalid IC number format (YYMMDD-XX-XXXX)';
  }

  // Validate email format
  if (data.email && !validateEmail(data.email)) {
    errors.email = 'Invalid email format';
  }

  // Validate phone number
  if (data.phone && !validatePhone(data.phone)) {
    errors.phone = 'Invalid phone number (minimum 10 digits)';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Calculate profile completion percentage
 */
export function calculateProfileCompletion(data: any): number {
  const allFields = [
    // Required fields (weighted higher)
    'full_name', 'nationality', 'ic_number', 'gender', 'phone', 'email',

    // Optional but important fields
    'race', 'shirt_size', 'languages',
    'current_address', 'transport_type', 'vehicle_type',
    'emergency_contact_name', 'emergency_relationship', 'emergency_contact_number',
    'highest_education', 'field_of_study', 'work_experience',
    'account_name', 'bank_name', 'account_number',
  ];

  let filledCount = 0;

  allFields.forEach((field) => {
    const value = data[field];

    if (field === 'languages') {
      // Languages is an array
      if (Array.isArray(value) && value.length > 0) {
        filledCount++;
      }
    } else if (value && value.toString().trim() !== '') {
      filledCount++;
    }
  });

  return Math.round((filledCount / allFields.length) * 100);
}

/**
 * Get completion status color
 */
export function getCompletionColor(percentage: number): string {
  if (percentage < 40) return '#ef4444'; // Red
  if (percentage < 70) return '#f59e0b'; // Orange
  if (percentage < 90) return '#3b82f6'; // Blue
  return '#10b981'; // Green
}

/**
 * Get completion status text
 */
export function getCompletionText(percentage: number): string {
  if (percentage < 40) return 'Incomplete';
  if (percentage < 70) return 'In Progress';
  if (percentage < 90) return 'Almost Done';
  return 'Complete';
}

/**
 * Get field-specific hints and suggestions
 */
export function getFieldHint(fieldName: string): string {
  const hints: { [key: string]: string } = {
    ic_number: 'Format: YYMMDD-XX-XXXX (e.g., 990315-14-1234)',
    phone: 'Format: 60X-XXXX-XXXX (starts with 60 for Malaysia)',
    email: 'Enter a valid email address',
    full_name: 'Enter your full name as per IC',
    emergency_contact_number: "Enter emergency contact's phone number",
    account_number: 'Enter your bank account number',
    work_experience: 'List your previous work experiences, one per line',
  };

  return hints[fieldName] || '';
}

/**
 * Get incomplete fields for suggestions
 */
export function getIncompleteFields(data: any): string[] {
  const incomplete: string[] = [];

  REQUIRED_FIELDS.forEach(({ field, label }) => {
    if (!data[field] || data[field].toString().trim() === '') {
      incomplete.push(label);
    }
  });

  // Check optional but important fields
  const optionalFields = [
    { field: 'race', label: 'Race' },
    { field: 'shirt_size', label: 'Shirt Size' },
    { field: 'emergency_contact_name', label: 'Emergency Contact Name' },
    { field: 'bank_name', label: 'Bank Name' },
    { field: 'account_number', label: 'Account Number' },
  ];

  optionalFields.forEach(({ field, label }) => {
    if (!data[field] || data[field].toString().trim() === '') {
      incomplete.push(label);
    }
  });

  return incomplete;
}

/**
 * Get next suggested field to complete
 */
export function getNextSuggestedField(data: any): string | null {
  const incomplete = getIncompleteFields(data);
  return incomplete.length > 0 ? incomplete[0] : null;
}

/**
 * Get field completion priority (returns fields sorted by importance)
 */
export function getFieldCompletionPriority(data: any): Array<{ field: string; label: string; priority: 'high' | 'medium' | 'low' }> {
  const priorities: Array<{ field: string; label: string; priority: 'high' | 'medium' | 'low' }> = [];

  // High priority - Required fields
  REQUIRED_FIELDS.forEach(({ field, label }) => {
    if (!data[field] || data[field].toString().trim() === '') {
      priorities.push({ field, label, priority: 'high' });
    }
  });

  // Medium priority - Important optional fields
  const mediumPriority = [
    { field: 'emergency_contact_name', label: 'Emergency Contact Name' },
    { field: 'emergency_contact_number', label: 'Emergency Contact Number' },
    { field: 'bank_name', label: 'Bank Name' },
    { field: 'account_number', label: 'Account Number' },
  ];

  mediumPriority.forEach(({ field, label }) => {
    if (!data[field] || data[field].toString().trim() === '') {
      priorities.push({ field, label, priority: 'medium' });
    }
  });

  // Low priority - Nice to have fields
  const lowPriority = [
    { field: 'race', label: 'Race' },
    { field: 'shirt_size', label: 'Shirt Size' },
    { field: 'highest_education', label: 'Highest Education' },
    { field: 'work_experience', label: 'Work Experience' },
  ];

  lowPriority.forEach(({ field, label }) => {
    if (!data[field] || data[field].toString().trim() === '') {
      priorities.push({ field, label, priority: 'low' });
    }
  });

  return priorities;
}
