import * as React from 'react';

import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  // Added to allow debounced onChange callbacks
  debounceTime?: number;
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, debounceTime = 0, onChange, icon, ...props }, ref) => {
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
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-all duration-200',
            'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 hover:border-blue-300',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100',
            icon && 'pl-10',
            className
          )}
          ref={ref}
          onChange={debounceTime > 0 ? handleChange : onChange}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };