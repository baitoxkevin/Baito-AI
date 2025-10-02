import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullscreen?: boolean;
  className?: string;
}

// Global component to inject keyframes into the document
const SpinnerStyles = () => {
  useEffect(() => {
    // Check if the style already exists to avoid duplication
    if (!document.getElementById('spinner-keyframes')) {
      const style = document.createElement('style');
      style.id = 'spinner-keyframes';
      style.innerHTML = `
        @keyframes spinner-clockwise {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
      
      // Cleanup on unmount
      return () => {
        const existingStyle = document.getElementById('spinner-keyframes');
        if (existingStyle) {
          existingStyle.remove();
        }
      };
    }
  }, []);
  
  return null;
};

/**
 * Loading spinner component with consistent styling and clockwise rotation
 * 
 * @param size - Size of the spinner: sm (24px), md (32px), lg (48px)
 * @param fullscreen - Whether to center the spinner in a full screen/parent container
 * @param className - Additional classes for customization
 */
export function LoadingSpinner({ 
  size = 'md', 
  fullscreen = false,
  className 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };
  
  // Use explicit CSS for the spinner to ensure clockwise rotation
  const spinner = (
    <>
      <SpinnerStyles />
      <div 
        className={cn(
          "rounded-full transition-all", 
          sizeClasses[size],
          className
        )}
        style={{
          border: size === 'sm' ? '2px solid rgba(226, 232, 240, 0.3)' : 
                 size === 'md' ? '3px solid rgba(226, 232, 240, 0.3)' : 
                                '4px solid rgba(226, 232, 240, 0.3)',
          borderTopColor: 'var(--primary, #3b82f6)',
          animation: 'spinner-clockwise 0.75s linear infinite',
          boxShadow: '0 0 10px rgba(0, 0, 0, 0.05)'
        }}
        aria-label="Loading"
        role="status"
      />
    </>
  );
  
  if (fullscreen) {
    return (
      <div className="flex items-center justify-center w-full h-full min-h-[200px]">
        {spinner}
      </div>
    );
  }
  
  return spinner;
}

/**
 * Fullscreen loading spinner with fixed positioning
 */
export function FullscreenLoadingSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50" style={{ left: 0, right: 0 }}>
      <LoadingSpinner size="lg" />
    </div>
  );
}

export default LoadingSpinner;