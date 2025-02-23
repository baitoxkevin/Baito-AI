import * as React from 'react';
import { type ReactNode } from 'react';
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

  const ToastContainer: React.FC = React.memo(() => {
    if (toasts.length === 0) return null;

    return React.createElement(
      'div',
      {
        className: 'fixed top-0 right-0 z-50 flex flex-col gap-2 p-4 max-w-md'
      },
      toasts.map((t) => 
        React.createElement(
          Toast,
          {
            key: t.id,
            variant: t.variant,
            className: cn(
              'transform transition-all duration-300',
              t.visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
            )
          },
          React.createElement(
            'div',
            { className: 'grid gap-1' },
            [
              React.createElement(ToastTitle, { key: 'title' }, t.title),
              React.createElement(ToastDescription, { key: 'desc' }, t.description)
            ]
          )
        )
      )
    );
  });

  return { toast, ToastContainer };
}
