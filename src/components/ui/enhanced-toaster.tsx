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
        {sortedToasts.map(function ({ id, title, description, action, variant, duration, pauseOnHover, createdAt, ...props }) {
          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 50, scale: 0.9, x: 100 }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: 1, 
                x: 0,
                transition: {
                  type: 'spring',
                  damping: 20,
                  stiffness: 300,
                  mass: 0.8
                }
              }}
              exit={{ 
                opacity: 0, 
                scale: 0.85, 
                x: 100,
                transition: { 
                  duration: 0.2,
                  ease: 'easeInOut'
                } 
              }}
              whileHover={{ x: -5 }}
            >
              <Toast 
                key={id} 
                {...props} 
                variant={variant}
                duration={duration}
                pauseOnHover={pauseOnHover}
              >
                <div className="flex items-center relative z-10">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      type: 'spring',
                      damping: 15,
                      stiffness: 300,
                      delay: 0.1
                    }}
                  >
                    {getToastIcon(variant)}
                  </motion.div>
                  <div className="flex-1">
                    {title && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <ToastTitle className="font-semibold">{title}</ToastTitle>
                      </motion.div>
                    )}
                    {description && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <ToastDescription className="opacity-90">{description}</ToastDescription>
                      </motion.div>
                    )}
                    {action && (
                      <motion.div 
                        className="mt-2"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        {action}
                      </motion.div>
                    )}
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