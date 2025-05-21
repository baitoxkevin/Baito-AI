import React from 'react';
import { cn } from '@/lib/utils';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

interface FieldWrapperProps {
  children: React.ReactNode;
  label: string;
  htmlFor?: string;
  required?: boolean;
  description?: string;
  tooltip?: string;
  error?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function FieldWrapper({ 
  children, 
  label, 
  htmlFor, 
  required = false,
  description,
  tooltip,
  error,
  icon,
  disabled = false,
  className
}: FieldWrapperProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center gap-1.5">
        <label
          htmlFor={htmlFor}
          className={cn(
            "text-sm font-medium text-gray-700",
            disabled && "opacity-60 cursor-not-allowed"
          )}
        >
          {icon && <span className="inline-flex mr-1.5 text-gray-500">{icon}</span>}
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoCircledIcon className="h-3.5 w-3.5 text-gray-400 hover:text-gray-500 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-[260px] text-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}

      <div className={cn(disabled && "opacity-70")}>{children}</div>

      {error && (
        <p className="text-xs font-medium text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}