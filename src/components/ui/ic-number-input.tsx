import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { formatIcNumber, isValidMalaysianIc } from '@/lib/ic-formatter';

interface IcNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
}

/**
 * Specialized input component for Malaysian IC numbers
 * Automatically formats input with dashes as the user types
 */
export function IcNumberInput({
  value,
  onChange,
  placeholder = 'XXXXXX-XX-XXXX',
  className = '',
  required = false,
  disabled = false,
  error = false
}: IcNumberInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Apply formatting on first render if value exists
  useEffect(() => {
    if (value && !value.includes('-') && value.length > 6) {
      onChange(formatIcNumber(value));
    }
  }, []);
  
  // Function to handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remember cursor position before we make changes
    const input = e.target;
    const selectionStart = input.selectionStart || 0;
    
    // Detect if this is a paste operation (much longer input suddenly)
    const isPaste = e.target.value.length > (value?.length || 0) + 2;
    
    let newValue = '';
    if (isPaste) {
      // For paste operations, take all digits
      newValue = e.target.value.replace(/[^\d]/g, '');
    } else {
      // For normal typing, get the raw input value
      const rawValue = e.target.value;
      const digitsOnly = value?.replace(/[^\d]/g, '') || '';
      
      if (rawValue.length < value.length) {
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
    
    // Update parent component
    onChange(formattedValue);
    
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
  };

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className={`${className} ${error ? 'border-red-500 focus:ring-red-200' : ''}`}
      required={required}
      disabled={disabled}
      maxLength={14} // XXXXXX-XX-XXXX = 14 chars
    />
  );
}

export default IcNumberInput;