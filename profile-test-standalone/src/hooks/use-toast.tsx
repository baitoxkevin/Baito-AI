import { useState, useCallback } from 'react';

type Toast = {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
};

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((options: Toast) => {
    setToasts((prev) => [...prev, options]);

    // Auto dismiss after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 3000);
  }, []);

  return { toast, toasts };
}

// Simple Toast Display Component
export function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast, index) => (
        <div
          key={index}
          className={`min-w-[300px] rounded-lg p-4 shadow-lg animate-in slide-in-from-top-5 ${
            toast.variant === 'destructive'
              ? 'bg-red-500 text-white'
              : 'bg-white border border-gray-200'
          }`}
          style={{
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}
        >
          <div className="font-semibold">{toast.title}</div>
          {toast.description && (
            <div className={`text-sm mt-1 ${toast.variant === 'destructive' ? 'text-red-100' : 'text-gray-600'}`}>
              {toast.description}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
