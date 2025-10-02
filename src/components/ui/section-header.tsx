import React from 'react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  className?: string;
}

export function SectionHeader({ icon, title, description, className }: SectionHeaderProps) {
  return (
    <div className={cn("mb-4", className)}>
      <div className="flex items-center space-x-3 mb-1.5">
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shadow-sm">
          <div className="text-blue-700">
            {icon}
          </div>
        </div>
        <h3 className="text-base font-semibold text-blue-700 tracking-wide">
          {title}
        </h3>
      </div>
      {description && (
        <p className="text-sm text-gray-600 ml-11">
          {description}
        </p>
      )}
    </div>
  );
}

interface SectionContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionContainer({ children, className }: SectionContainerProps) {
  return (
    <div 
      className={cn(
        "border border-gray-200 rounded-xl p-5 bg-white shadow-sm",
        "hover:shadow-md transition-all duration-200",
        "space-y-5",
        className
      )}
    >
      {children}
    </div>
  );
}