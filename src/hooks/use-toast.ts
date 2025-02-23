import * as React from 'react';
import { Toast, ToastTitle, ToastDescription } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface ToastOptions {
  variant?: 'default' | 'destructive';
  title: string;
  description: string;
  duration?: number;
}

interface ToastState extends ToastOptions {
  id: string;
  visible: boolean;
}

export function useToast() {
  const [toasts, setToasts] = React.useState<ToastState[]>([]);

  const toast = React.useCallback(({ duration = 5000, ...options }: ToastOptions) => {
    const id = Math.random().toString(36).slice(2);
    
    setToasts((prev) => [...prev, { ...options, id, visible: true }]);

    setTimeout(() => {
      setToasts((prev) => 
        prev.map((t) => (t.id === id ? { ...t, visible: false } : t))
      );
      
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 300);
    }, duration);
  }, []);

  const ToastContainer = React.memo(function ToastContainer() {
    if (toasts.length === 0) return null;
    
    return (
      <div className="fixed top-0 right-0 z-50 flex flex-col gap-2 p-4 max-w-md">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            variant={t.variant}
            className={cn(
              "transform transition-all duration-300",
              t.visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
            )}
          >
            <div className="grid gap-1">
              <ToastTitle>{t.title}</ToastTitle>
              <ToastDescription>{t.description}</ToastDescription>
            </div>
          </Toast>
        ))}
      </div>
    );
  });

  return { toast, ToastContainer };
}
