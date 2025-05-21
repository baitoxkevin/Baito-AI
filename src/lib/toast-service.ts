import { toast } from '@/hooks/use-enhanced-toast';
import { ToastLink } from '@/components/ui/enhanced-toast';
import React from 'react';

// Toast service for easy access throughout the application
export const toastService = {
  /**
   * Shows a default toast notification
   */
  show: (title: string, description?: string, duration?: number) => {
    return toast({
      title,
      description,
      duration,
    });
  },

  /**
   * Shows a success toast notification
   */
  success: (title: string, description?: string, duration?: number) => {
    return toast({
      title,
      description,
      variant: 'success',
      duration,
    });
  },

  /**
   * Shows an error toast notification
   */
  error: (title: string, description?: string, duration?: number) => {
    return toast({
      title,
      description,
      variant: 'destructive',
      duration,
    });
  },

  /**
   * Shows a warning toast notification
   */
  warning: (title: string, description?: string, duration?: number) => {
    return toast({
      title,
      description,
      variant: 'warning',
      duration,
    });
  },

  /**
   * Shows an info toast notification
   */
  info: (title: string, description?: string, duration?: number) => {
    return toast({
      title,
      description,
      variant: 'info',
      duration,
    });
  },

  /**
   * Shows a loading toast notification
   */
  loading: (title: string, description?: string, duration?: number) => {
    return toast({
      title,
      description,
      variant: 'loading',
      duration: duration || 60000, // Default to 60 seconds for loading toasts
    });
  },

  /**
   * Shows a toast with a link/action button
   */
  withAction: (
    title: string,
    description: string, 
    actionText: string, 
    onClick: () => void, 
    variant: 'default' | 'success' | 'destructive' | 'warning' | 'info' = 'default'
  ) => {
    return toast({
      title,
      description,
      variant,
      // action: <ToastLink onClick={onClick}>{actionText}</ToastLink>, // Temporarily disabled - needs fixing
    });
  },

  /**
   * Handles async operations with loading, success, and error states
   */
  promise: <T,>(
    promise: Promise<T>,
    {
      loading = 'Loading...',
      success = 'Operation completed successfully',
      error = 'Operation failed',
    }: {
      loading?: string;
      success?: string | ((data: T) => string);
      error?: string | ((error: any) => string);
    } = {}
  ) => {
    const toastId = toast({
      title: 'Please wait',
      description: loading,
      variant: 'loading',
      duration: 60000,
    }).id;

    promise
      .then((data) => {
        const successMessage = typeof success === 'function' 
          ? success(data) 
          : success;
        
        toast({
          id: toastId,
          title: 'Success',
          description: successMessage,
          variant: 'success',
          duration: 5000,
        });
        
        return data;
      })
      .catch((err) => {
        const errorMessage = typeof error === 'function' 
          ? error(err) 
          : error;
        
        toast({
          id: toastId,
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
          duration: 5000,
        });
        
        throw err;
      });

    return promise;
  },
};