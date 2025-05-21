import { useToast } from '@/hooks/use-toast';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';
import { CheckCircle, AlertCircle, AlertTriangle, Info, BellRing } from 'lucide-react';
import { useEffect, useState } from 'react';

export function Toaster() {
  const { toasts, dismissToast } = useToast();
  const [visibleToasts, setVisibleToasts] = useState<Record<string, boolean>>({});

  // Auto-dismiss toasts after 3 seconds
  useEffect(() => {
    const newVisibleToasts: Record<string, boolean> = {};
    const timers: NodeJS.Timeout[] = [];
    
    toasts.forEach(toast => {
      // Only add timers for newly added toasts
      if (!visibleToasts[toast.id]) {
        newVisibleToasts[toast.id] = true;
        
        // Set a timer to dismiss the toast after 3 seconds
        const timer = setTimeout(() => {
          dismissToast(toast.id);
        }, 3000);
        
        timers.push(timer);
      } else {
        // Keep already visible toasts
        newVisibleToasts[toast.id] = true;
      }
    });
    
    // Update visible toasts
    if (Object.keys(newVisibleToasts).length > 0) {
      setVisibleToasts(prev => ({...prev, ...newVisibleToasts}));
    }
    
    // Clear all timers when the component unmounts
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [toasts, dismissToast, visibleToasts]);

  // Render variant-specific icons with enhanced styling
  const getToastIcon = (variant?: string) => {
    const iconClasses = "h-5 w-5 mr-3 flex-shrink-0 transition-transform duration-200 ease-out";
    
    switch (variant) {
      case 'success':
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 mr-3">
            <CheckCircle className={`${iconClasses} text-green-500 dark:text-green-400`} />
          </div>
        );
      case 'destructive':
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 mr-3">
            <AlertCircle className={`${iconClasses} text-red-500 dark:text-red-400`} />
          </div>
        );
      case 'warning':
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 mr-3">
            <AlertTriangle className={`${iconClasses} text-amber-500 dark:text-amber-400`} />
          </div>
        );
      case 'info':
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 mr-3">
            <Info className={`${iconClasses} text-blue-500 dark:text-blue-400`} />
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 mr-3">
            <BellRing className={`${iconClasses} text-blue-500 dark:text-blue-400`} />
          </div>
        );
    }
  };

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} {...props} variant={variant}>
            <div className="flex items-center">
              {getToastIcon(variant)}
              <div className="flex-1">
                {title && <ToastTitle className="font-medium">{title}</ToastTitle>}
                {description && (
                  <ToastDescription className="opacity-90">{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose className="hover:bg-gray-200/70 dark:hover:bg-gray-700/70 transition-colors" />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
