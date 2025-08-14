/**
 * Form validation utilities for better error handling
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validate email format
 */
export function validateEmail(email: string): string | null {
  if (!email || email.trim() === '') {
    return 'Email is required';
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.toLowerCase())) {
    return 'Please enter a valid email address';
  }
  
  return null;
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): string | null {
  if (!password || password.trim() === '') {
    return 'Password is required';
  }
  
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  
  // Check for at least one uppercase, one lowercase, and one number
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }
  
  return null;
}

/**
 * Validate required field
 */
export function validateRequired(value: any, fieldName: string): string | null {
  if (value === null || value === undefined || value === '') {
    return `${fieldName} is required`;
  }
  return null;
}

/**
 * Validate phone number
 */
export function validatePhone(phone: string): string | null {
  if (!phone || phone.trim() === '') {
    return null; // Phone might be optional
  }
  
  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  
  // Check if it's a valid phone number (basic check)
  if (cleaned.length < 10 || cleaned.length > 15) {
    return 'Please enter a valid phone number';
  }
  
  if (!/^\+?\d+$/.test(cleaned)) {
    return 'Phone number can only contain digits';
  }
  
  return null;
}

/**
 * Validate date range
 */
export function validateDateRange(
  startDate: string | Date,
  endDate: string | Date
): string | null {
  if (!startDate || !endDate) {
    return 'Both start and end dates are required';
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 'Invalid date format';
  }
  
  if (end < start) {
    return 'End date must be after start date';
  }
  
  return null;
}

/**
 * Validate numeric input
 */
export function validateNumber(
  value: string | number,
  min?: number,
  max?: number
): string | null {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) {
    return 'Please enter a valid number';
  }
  
  if (min !== undefined && num < min) {
    return `Value must be at least ${min}`;
  }
  
  if (max !== undefined && num > max) {
    return `Value must be at most ${max}`;
  }
  
  return null;
}

/**
 * Generic form validation
 */
export function validateForm<T extends Record<string, any>>(
  data: T,
  validators: Partial<Record<keyof T, (value: any) => string | null>>
): ValidationResult {
  const errors: ValidationError[] = [];
  
  for (const [field, validator] of Object.entries(validators)) {
    if (validator) {
      const error = validator(data[field as keyof T]);
      if (error) {
        errors.push({ field, message: error });
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Display validation errors in a user-friendly format
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return '';
  
  if (errors.length === 1) {
    return errors[0].message;
  }
  
  return 'Please fix the following errors:\n' + 
    errors.map(e => `• ${e.message}`).join('\n');
}

/**
 * Clear validation errors for a specific field
 */
export function clearFieldError(
  errors: ValidationError[],
  field: string
): ValidationError[] {
  return errors.filter(e => e.field !== field);
}

/**
 * Add or update a field error
 */
export function setFieldError(
  errors: ValidationError[],
  field: string,
  message: string | null
): ValidationError[] {
  const filtered = clearFieldError(errors, field);
  
  if (message) {
    filtered.push({ field, message });
  }
  
  return filtered;
}