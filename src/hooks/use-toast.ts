import { useState } from 'react';

interface ToastOptions {
  variant?: 'default' | 'destructive';
  title: string;
  description: string;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastOptions[]>([]);

  const toast = (options: ToastOptions) => {
    setToasts((prev) => [...prev, options]);
    // In a real implementation, this would handle showing and hiding toasts
  };

  return { toast };
}
