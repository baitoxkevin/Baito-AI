/**
 * Parse Malaysian IC number to extract date of birth and calculate age
 * Malaysian IC format: YYMMDD-PB-####
 * Where:
 * - YYMMDD: Date of birth
 * - PB: Place of birth code
 * - ####: Unique number
 */

import { differenceInYears, parse, isValid } from 'date-fns';

export interface ICParseResult {
  dateOfBirth: string | null; // Format: YYYY-MM-DD
  age: number | null;
  isValid: boolean;
}

/**
 * Parse IC number to extract date of birth and age
 * @param icNumber - Malaysian IC number (with or without dashes)
 * @returns Object containing dateOfBirth, age, and validity status
 */
export function parseICNumber(icNumber: string | undefined | null): ICParseResult {
  if (!icNumber) {
    return { dateOfBirth: null, age: null, isValid: false };
  }

  // Remove all non-numeric characters for parsing
  const cleanIC = icNumber.replace(/\D/g, '');
  
  // Malaysian IC should have 12 digits
  if (cleanIC.length !== 12) {
    return { dateOfBirth: null, age: null, isValid: false };
  }

  // Extract birth date components (first 6 digits)
  const yearPart = cleanIC.substring(0, 2);
  const monthPart = cleanIC.substring(2, 4);
  const dayPart = cleanIC.substring(4, 6);

  // Convert 2-digit year to 4-digit year
  // Assume: 00-30 = 2000-2030, 31-99 = 1931-1999
  const yearNum = parseInt(yearPart, 10);
  const currentYear = new Date().getFullYear();
  const century = yearNum <= (currentYear % 100) + 10 ? 2000 : 1900;
  const fullYear = century + yearNum;

  // Validate month and day
  const month = parseInt(monthPart, 10);
  const day = parseInt(dayPart, 10);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return { dateOfBirth: null, age: null, isValid: false };
  }

  // Create date string in YYYY-MM-DD format
  const dateOfBirth = `${fullYear}-${monthPart}-${dayPart}`;
  
  // Parse and validate the date
  const birthDate = parse(dateOfBirth, 'yyyy-MM-dd', new Date());
  
  if (!isValid(birthDate)) {
    return { dateOfBirth: null, age: null, isValid: false };
  }

  // Check if the date is in the future
  if (birthDate > new Date()) {
    return { dateOfBirth: null, age: null, isValid: false };
  }

  // Calculate age
  const age = differenceInYears(new Date(), birthDate);

  // Additional validation: age should be reasonable (0-120 years)
  if (age < 0 || age > 120) {
    return { dateOfBirth: null, age: null, isValid: false };
  }

  return {
    dateOfBirth,
    age,
    isValid: true
  };
}

/**
 * Format IC number with dashes
 * @param icNumber - IC number without formatting
 * @returns Formatted IC number (######-##-####)
 */
export function formatICNumber(icNumber: string): string {
  const clean = icNumber.replace(/\D/g, '');
  if (clean.length !== 12) return icNumber;
  
  return `${clean.substring(0, 6)}-${clean.substring(6, 8)}-${clean.substring(8, 12)}`;
}

/**
 * Calculate age from date of birth
 * @param dateOfBirth - Date of birth in YYYY-MM-DD format
 * @returns Age in years, or null if invalid
 */
export function calculateAge(dateOfBirth: string | null | undefined): number | null {
  if (!dateOfBirth) return null;
  
  const birthDate = parse(dateOfBirth, 'yyyy-MM-dd', new Date());
  
  if (!isValid(birthDate)) return null;
  
  const age = differenceInYears(new Date(), birthDate);
  
  // Validate reasonable age
  if (age < 0 || age > 120) return null;
  
  return age;
}