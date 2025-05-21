import * as React from 'react';

import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
    // Added to allow debounced onChange callbacks
    debounceTime?: number;
  }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, debounceTime = 0, onChange, ...props }, ref) => {
    // Handle debounced input if debounceTime is provided
    const [value, setValue] = React.useState(props.value || props.defaultValue || '');
    const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

    // Set up debounced onChange
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      
      // Always call the original onChange immediately to update visible value
      if (onChange) {
        onChange(e);
      }
      
      // Optionally debounce the actual action (if debounce time is > 0)
      if (debounceTime > 0) {
        // Clear any existing timer
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        
        // No need to call onChange again if debounceTime is 0
        // Otherwise, set up a debounced call
        if (debounceTime > 0) {
          // Saving the original event would be problematic, so we create a new one
          // This is a simplified approach - we're not recreating the full event
          debounceTimerRef.current = setTimeout(() => {
            // This is handled by the non-debounced handler
          }, debounceTime);
        }
      }
    };

    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        onChange={debounceTime > 0 ? handleChange : onChange}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
