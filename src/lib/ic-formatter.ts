/**
 * Utility functions for IC number formatting and validation
 */

/**
 * Formats an IC number with dashes (XXXXXX-XX-XXXX)
 * @param value - The IC number to format
 * @returns Formatted IC number
 */
export function formatIcNumber(value: string): string {
  // Remove all non-digits
  const digitsOnly = value.replace(/\D/g, '');
  
  // Apply the XXXXXX-XX-XXXX format
  let formattedValue = '';
  if (digitsOnly.length <= 6) {
    formattedValue = digitsOnly;
  } else if (digitsOnly.length <= 8) {
    formattedValue = `${digitsOnly.slice(0, 6)}-${digitsOnly.slice(6)}`;
  } else {
    formattedValue = `${digitsOnly.slice(0, 6)}-${digitsOnly.slice(6, 8)}-${digitsOnly.slice(8, 12)}`;
  }
  
  return formattedValue;
}

/**
 * Validates if an IC number has the correct Malaysian format
 * @param value - The IC number to validate
 * @returns Boolean indicating if the IC number is valid
 */
export function isValidMalaysianIc(value: string): boolean {
  // Remove all non-digits and dashes for checking
  const cleanedValue = value.replace(/[^0-9-]/g, '');
  
  // Check if the format matches XXXXXX-XX-XXXX (with or without dashes)
  // Malaysian IC should be 12 digits with 2 dashes or 12 digits without dashes
  return (
    (cleanedValue.length === 12 && !cleanedValue.includes('-')) ||
    (cleanedValue.length === 14 && 
     cleanedValue.charAt(6) === '-' && 
     cleanedValue.charAt(9) === '-')
  );
}

/**
 * Standardizes IC number formats in database
 * 
 * This function can be used when saving to the database to ensure consistent format
 * @param value - The IC number to standardize 
 * @returns Standardized IC number with dashes
 */
export function standardizeIcNumberForDatabase(value: string): string {
  // Always store with dashes for consistency
  return formatIcNumber(value);
}

/**
 * Creates a masked version of the IC number for display
 * @param value - The IC number to mask
 * @returns Masked IC number
 */
export function createMaskedIc(value: string): string {
  if (!value) return '';
  
  // Split by dashes if they exist
  const parts = value.split('-');
  
  if (parts.length === 1) {
    // No dashes yet, just mask all digits
    return '*'.repeat(value.length);
  } else if (parts.length === 2) {
    // First dash present: ******-**
    return '*'.repeat(parts[0].length) + '-' + '*'.repeat(parts[1].length);
  } else {
    // Both dashes present: ******-**-****
    return '*'.repeat(parts[0].length) + '-' + '*'.repeat(parts[1].length) + '-' + '*'.repeat(parts[2].length);
  }
}

/**
 * Formats IC number on input change, handling cursor position
 * @param e - Input change event
 * @param currentValue - Current IC number value
 * @param updateFn - Callback to update the IC value
 * @param inputRef - Reference to the input element
 */
export function handleIcInputChange(
  e: React.ChangeEvent<HTMLInputElement>,
  currentValue: string,
  updateFn: (value: string) => void,
  inputRef: React.RefObject<HTMLInputElement>
): void {
  // Remember cursor position before we make changes
  const input = e.target;
  const selectionStart = input.selectionStart || 0;
  
  // Detect if this is a paste operation (much longer input suddenly)
  const isPaste = e.target.value.length > (currentValue?.length || 0) + 2;
  
  let newValue = '';
  if (isPaste) {
    // For paste operations, take all digits
    newValue = e.target.value.replace(/[^\d]/g, '');
  } else {
    // For normal typing, get the raw input value
    const rawValue = e.target.value;
    const digitsOnly = currentValue?.replace(/[^\d]/g, '') || '';
    
    if (rawValue.length < currentValue.length) {
      // Handling deletion
      newValue = digitsOnly.slice(0, -1);
    } else {
      // Handling addition
      const newDigit = rawValue.replace(/[^0-9]/g, '').slice(-1);
      if (newDigit) {
        newValue = digitsOnly + newDigit;
      } else {
        newValue = digitsOnly;
      }
    }
  }
  
  // Format the new value with dashes
  const formattedValue = formatIcNumber(newValue);
  
  // Update the value through the provided callback
  updateFn(formattedValue);
  
  // Calculate new cursor position based on if dashes were added
  setTimeout(() => {
    if (inputRef.current) {
      let newPosition = selectionStart;
      
      // If we're at a position after a dash is added, move cursor forward
      if (isPaste) {
        // For paste, put the cursor at the end
        newPosition = inputRef.current.value.length;
      } else if (newPosition === 7 || newPosition === 10) {
        // If at a dash position, move past it
        newPosition++;
      }
      
      inputRef.current.setSelectionRange(newPosition, newPosition);
    }
  }, 0);
}