import * as React from 'react';
import { useState, useEffect } from 'react';

import type { ToastActionElement, ToastProps } from '@/components/ui/enhanced-toast';

const TOAST_LIMIT = 5; // Allow up to 5 toast notifications at once
const TOAST_REMOVE_DELAY = 1000; // Extra delay after toast is closed

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  duration?: number; // Custom duration per toast
  pauseOnHover?: boolean; // Control pause on hover per toast
  createdAt?: Date; // Track when the toast was created
};

const actionTypes = {
  ADD_TOAST: 'ADD_TOAST',
  UPDATE_TOAST: 'UPDATE_TOAST',
  DISMISS_TOAST: 'DISMISS_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
  DISMISS_ALL: 'DISMISS_ALL',
} as const;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ActionType = typeof actionTypes;

type Action =
  | {
      type: ActionType['ADD_TOAST'];
      toast: ToasterToast;
    }
  | {
      type: ActionType['UPDATE_TOAST'];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType['DISMISS_TOAST'];
      toastId?: ToasterToast['id'];
    }
  | {
      type: ActionType['REMOVE_TOAST'];
      toastId?: ToasterToast['id'];
    }
  | {
      type: ActionType['DISMISS_ALL'];
    };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: 'REMOVE_TOAST',
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case 'DISMISS_TOAST': {
      const { toastId } = action;

      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    }
    
    case 'DISMISS_ALL': {
      state.toasts.forEach((toast) => {
        addToRemoveQueue(toast.id);
      });

      return {
        ...state,
        toasts: state.toasts.map((t) => ({
          ...t,
          open: false,
        })),
      };
    }

    case 'REMOVE_TOAST':
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

interface ToastOptions extends Omit<ToasterToast, 'id'> {
  loading?: boolean; // Show a loading toast that can be updated later
}

interface ToastReturnType {
  id: string;
  dismiss: () => void;
  update: (props: Partial<ToasterToast>) => void;
}

function toast(options: ToastOptions): ToastReturnType {
  const id = genId();
  
  const variant = options.loading ? 'loading' : options.variant;
  const duration = options.loading ? 60000 : options.duration || 5000; // Loading toasts last longer by default
  
  const update = (props: Partial<ToastOptions>) => {
    const variant = props.loading ? 'loading' : props.variant;
    const updatedProps = { ...props, variant };
    
    dispatch({
      type: 'UPDATE_TOAST',
      toast: { ...updatedProps, id },
    });
    
    return {
      id,
      dismiss: () => dismiss(),
      update: (props: Partial<ToasterToast>) => update(props),
    };
  };
  
  const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id });

  dispatch({
    type: 'ADD_TOAST',
    toast: {
      ...options,
      variant,
      duration,
      id,
      open: true,
      createdAt: new Date(),
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id,
    dismiss,
    update,
  };
}

// Helper functions for common toast types
const commonToast = (variant: ToastProps['variant'], options: Omit<ToastOptions, 'variant'>) => {
  return toast({ ...options, variant });
};

// Pre-styled toast variants
function useEnhancedToast() {
  const [state, setState] = useState<State>(memoryState);

  useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    success: (options: Omit<ToastOptions, 'variant'>) => 
      commonToast('success', options),
    error: (options: Omit<ToastOptions, 'variant'>) => 
      commonToast('destructive', options),
    warning: (options: Omit<ToastOptions, 'variant'>) => 
      commonToast('warning', options),
    info: (options: Omit<ToastOptions, 'variant'>) => 
      commonToast('info', options),
    loading: (options: Omit<ToastOptions, 'variant' | 'loading'>) => 
      toast({ ...options, loading: true }),
    dismissAll: () => dispatch({ type: 'DISMISS_ALL' }),
    dismiss: (toastId?: string) => dispatch({ type: 'DISMISS_TOAST', toastId }),
    
    // Promise toast - for handling async operations with loading, success, and error states
    promise: async <T>(
      promise: Promise<T>,
      {
        loading,
        success,
        error,
      }: {
        loading: Omit<ToastOptions, 'variant' | 'loading'>;
        success: (data: T) => Omit<ToastOptions, 'variant'>;
        error: (err: any) => Omit<ToastOptions, 'variant'>;
      }
    ): Promise<T> => {
      const toastId = toast({ ...loading, loading: true }).id;
      
      try {
        const data = await promise;
        
        dispatch({
          type: 'UPDATE_TOAST',
          toast: {
            id: toastId,
            ...success(data),
            variant: 'success',
            open: true,
          },
        });
        
        return data;
      } catch (err) {
        dispatch({
          type: 'UPDATE_TOAST',
          toast: {
            id: toastId,
            ...error(err),
            variant: 'destructive',
            open: true,
          },
        });
        
        throw err;
      }
    },
  };
}

export { useEnhancedToast, toast };