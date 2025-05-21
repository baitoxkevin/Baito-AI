import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { 
  X, 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  BellRing,
  ArrowRight,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed bottom-0 right-0 z-[300] flex max-h-screen flex-col-reverse gap-2 p-4 sm:bottom-4 sm:right-4 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between overflow-hidden rounded-md border-0 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full backdrop-blur-sm",
  {
    variants: {
      variant: {
        default: "bg-white/95 dark:bg-gray-800/95 text-gray-900 dark:text-gray-100 shadow-md dark:shadow-lg pl-4 pr-8 py-4 border-l-4 border-blue-500",
        success: "bg-white/95 dark:bg-gray-800/95 text-gray-900 dark:text-gray-100 shadow-md dark:shadow-lg pl-4 pr-8 py-4 border-l-4 border-green-500",
        destructive: "bg-white/95 dark:bg-gray-800/95 text-gray-900 dark:text-gray-100 shadow-md dark:shadow-lg pl-4 pr-8 py-4 border-l-4 border-red-500",
        warning: "bg-white/95 dark:bg-gray-800/95 text-gray-900 dark:text-gray-100 shadow-md dark:shadow-lg pl-4 pr-8 py-4 border-l-4 border-amber-500",
        info: "bg-white/95 dark:bg-gray-800/95 text-gray-900 dark:text-gray-100 shadow-md dark:shadow-lg pl-4 pr-8 py-4 border-l-4 border-blue-500",
        loading: "bg-white/95 dark:bg-gray-800/95 text-gray-900 dark:text-gray-100 shadow-md dark:shadow-lg pl-4 pr-8 py-4 border-l-4 border-purple-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

type ToastProps = React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & 
  VariantProps<typeof toastVariants> & {
    duration?: number;
    pauseOnHover?: boolean;
  };

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  ToastProps
>(({ className, variant, duration = 5000, pauseOnHover = true, ...props }, ref) => {
  const [progress, setProgress] = React.useState(100);
  const [isPaused, setIsPaused] = React.useState(false);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = React.useRef<number>(0);
  const remainingTimeRef = React.useRef<number>(duration);
  
  // Add progress animation for auto-dismiss countdown
  React.useEffect(() => {
    if (props.open) {
      setProgress(100);
      startTimeRef.current = Date.now();
      remainingTimeRef.current = duration;
      
      const startTimer = () => {
        intervalRef.current = setInterval(() => {
          const elapsed = Date.now() - startTimeRef.current;
          const remaining = Math.max(0, 100 - (elapsed / remainingTimeRef.current) * 100);
          
          setProgress(remaining);
          
          if (remaining <= 0) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            // Let Radix Toast handle the actual closing
            if (props.onOpenChange) props.onOpenChange(false);
          }
        }, 10);
      };
      
      startTimer();
      
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [props.open, duration, props.onOpenChange]);
  
  // Handle pause on hover
  const handleMouseEnter = React.useCallback(() => {
    if (pauseOnHover && intervalRef.current) {
      clearInterval(intervalRef.current);
      remainingTimeRef.current = remainingTimeRef.current * (progress / 100);
      setIsPaused(true);
    }
  }, [pauseOnHover, progress]);
  
  const handleMouseLeave = React.useCallback(() => {
    if (pauseOnHover && isPaused) {
      startTimeRef.current = Date.now();
      
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = Math.max(0, 100 - (elapsed / remainingTimeRef.current) * 100);
        
        setProgress(remaining);
        
        if (remaining <= 0) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          // Let Radix Toast handle the actual closing
          if (props.onOpenChange) props.onOpenChange(false);
        }
      }, 10);
      setIsPaused(false);
    }
  }, [pauseOnHover, isPaused, props.onOpenChange]);
  
  const progressBarColor = React.useMemo(() => {
    switch (variant) {
      case 'success': return 'bg-green-500';
      case 'destructive': return 'bg-red-500';
      case 'warning': return 'bg-amber-500';
      case 'info': return 'bg-blue-500';
      case 'loading': return 'bg-purple-500';
      default: return 'bg-blue-500';
    }
  }, [variant]);
  
  const variantGlow = React.useMemo(() => {
    switch (variant) {
      case 'success': return 'shadow-[0_0_10px_rgba(34,197,94,0.2)]';
      case 'destructive': return 'shadow-[0_0_10px_rgba(239,68,68,0.2)]';
      case 'warning': return 'shadow-[0_0_10px_rgba(245,158,11,0.2)]';
      case 'info': return 'shadow-[0_0_10px_rgba(59,130,246,0.2)]';
      case 'loading': return 'shadow-[0_0_10px_rgba(147,51,234,0.2)]';
      default: return 'shadow-[0_0_10px_rgba(59,130,246,0.2)]';
    }
  }, [variant]);
  
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(
        toastVariants({ variant }), 
        className, 
        "relative overflow-hidden transition-all duration-300 ease-in-out",
        variantGlow
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {props.children}
      
      {/* Progress bar for auto-dismiss countdown */}
      <div className="absolute bottom-0 left-0 h-[3px] w-full bg-gray-200/50 dark:bg-gray-700/50">
        <div 
          className={cn(
            "h-full transition-all", 
            progressBarColor,
            isPaused ? "animate-pulse" : "ease-linear"
          )} 
          style={{ width: `${progress}%` }}
        />
      </div>
    </ToastPrimitives.Root>
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-full p-1 text-gray-500 opacity-70 transition-opacity hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-50 dark:hover:bg-gray-800 focus:opacity-100 focus:outline-none group-hover:opacity-100",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-3.5 w-3.5" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm mt-1 text-gray-700 dark:text-gray-300", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

// Get toast icon based on variant
export function getToastIcon(variant?: string) {
  const iconClasses = "h-5 w-5 transition-transform duration-200 ease-out";
  
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
    case 'loading':
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 mr-3">
          <Loader2 className={`${iconClasses} text-purple-500 dark:text-purple-400 animate-spin`} />
        </div>
      );
    default:
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 mr-3">
          <BellRing className={`${iconClasses} text-blue-500 dark:text-blue-400`} />
        </div>
      );
  }
}

// Create styled link button for toast actions
export const ToastLink = ({ className, children, ...props }: React.ComponentPropsWithoutRef<"button">) => (
  <button
    className={cn(
      "inline-flex items-center justify-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors focus:outline-none focus:underline gap-1 mt-2",
      className
    )}
    {...props}
  >
    {children}
    <ArrowRight className="h-3.5 w-3.5" />
  </button>
);

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}