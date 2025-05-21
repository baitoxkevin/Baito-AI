import { useEnhancedToast } from '@/hooks/use-enhanced-toast';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  getToastIcon
} from '@/components/ui/enhanced-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function EnhancedToaster() {
  const { toasts, dismiss } = useEnhancedToast();
  
  // Sort toasts by creation time (newest first)
  const sortedToasts = [...toasts].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });

  return (
    <ToastProvider>
      <AnimatePresence mode="sync">
        {sortedToasts.map(function ({ id, title, description, action, variant, duration, pauseOnHover, ...props }) {
          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -10, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', damping: 15, stiffness: 300 }}
            >
              <Toast 
                key={id} 
                {...props} 
                variant={variant}
                duration={duration}
                pauseOnHover={pauseOnHover}
              >
                <div className="flex items-center">
                  {getToastIcon(variant)}
                  <div className="flex-1">
                    {title && <ToastTitle className="font-medium">{title}</ToastTitle>}
                    {description && (
                      <ToastDescription className="opacity-90">{description}</ToastDescription>
                    )}
                    {action && <div className="mt-2">{action}</div>}
                  </div>
                </div>
                <ToastClose 
                  onClick={() => dismiss(id)}
                  className="hover:bg-gray-200/70 dark:hover:bg-gray-700/70 transition-colors" 
                />
              </Toast>
            </motion.div>
          );
        })}
      </AnimatePresence>
      <ToastViewport />
    </ToastProvider>
  );
}

// Create a global toast manager component for demonstration
export function ToastManager() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return null;
  
  return <EnhancedToaster />;
}