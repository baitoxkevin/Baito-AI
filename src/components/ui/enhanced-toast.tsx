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
  "group pointer-events-auto relative flex w-full items-center justify-between overflow-hidden rounded-xl border-0 shadow-2xl transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full backdrop-blur-xl",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-white/90 to-white/80 dark:from-gray-900/90 dark:to-gray-800/80 text-gray-900 dark:text-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)] pl-5 pr-10 py-5 border-l-4 border-blue-500 before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-500/10 before:to-transparent before:rounded-xl",
        success: "bg-gradient-to-r from-white/90 to-white/80 dark:from-gray-900/90 dark:to-gray-800/80 text-gray-900 dark:text-gray-100 shadow-[0_10px_40px_rgba(34,197,94,0.2)] dark:shadow-[0_10px_40px_rgba(34,197,94,0.3)] pl-5 pr-10 py-5 border-l-4 border-green-500 before:absolute before:inset-0 before:bg-gradient-to-r before:from-green-500/10 before:to-transparent before:rounded-xl",
        destructive: "bg-gradient-to-r from-white/90 to-white/80 dark:from-gray-900/90 dark:to-gray-800/80 text-gray-900 dark:text-gray-100 shadow-[0_10px_40px_rgba(239,68,68,0.2)] dark:shadow-[0_10px_40px_rgba(239,68,68,0.3)] pl-5 pr-10 py-5 border-l-4 border-red-500 before:absolute before:inset-0 before:bg-gradient-to-r before:from-red-500/10 before:to-transparent before:rounded-xl",
        warning: "bg-gradient-to-r from-white/90 to-white/80 dark:from-gray-900/90 dark:to-gray-800/80 text-gray-900 dark:text-gray-100 shadow-[0_10px_40px_rgba(245,158,11,0.2)] dark:shadow-[0_10px_40px_rgba(245,158,11,0.3)] pl-5 pr-10 py-5 border-l-4 border-amber-500 before:absolute before:inset-0 before:bg-gradient-to-r before:from-amber-500/10 before:to-transparent before:rounded-xl",
        info: "bg-gradient-to-r from-white/90 to-white/80 dark:from-gray-900/90 dark:to-gray-800/80 text-gray-900 dark:text-gray-100 shadow-[0_10px_40px_rgba(59,130,246,0.2)] dark:shadow-[0_10px_40px_rgba(59,130,246,0.3)] pl-5 pr-10 py-5 border-l-4 border-blue-500 before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-500/10 before:to-transparent before:rounded-xl",
        loading: "bg-gradient-to-r from-white/90 to-white/80 dark:from-gray-900/90 dark:to-gray-800/80 text-gray-900 dark:text-gray-100 shadow-[0_10px_40px_rgba(147,51,234,0.2)] dark:shadow-[0_10px_40px_rgba(147,51,234,0.3)] pl-5 pr-10 py-5 border-l-4 border-purple-500 before:absolute before:inset-0 before:bg-gradient-to-r before:from-purple-500/10 before:to-transparent before:rounded-xl",
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
      case 'success': return 'shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.4)]';
      case 'destructive': return 'shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.4)]';
      case 'warning': return 'shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]';
      case 'info': return 'shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]';
      case 'loading': return 'shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.4)]';
      default: return 'shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]';
    }
  }, [variant]);
  
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(
        toastVariants({ variant }), 
        className, 
        "relative overflow-hidden transition-all duration-300 ease-in-out hover:scale-[1.02] hover:-translate-y-0.5",
        variantGlow
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {props.children}
      
      {/* Progress bar for auto-dismiss countdown */}
      <div className="absolute bottom-0 left-0 h-[3px] w-full bg-gradient-to-r from-transparent via-gray-200/30 to-transparent dark:via-gray-700/30">
        <div 
          className={cn(
            "h-full transition-all relative overflow-hidden", 
            progressBarColor,
            isPaused ? "animate-pulse" : "ease-linear"
          )}
          style={{ width: `${progress}%` }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent dark:via-white/20 animate-shimmer" />
        </div>
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
      "inline-flex h-8 shrink-0 items-center justify-center rounded-lg border-0 bg-white/20 dark:bg-white/10 backdrop-blur-sm px-3 text-sm font-medium transition-all hover:bg-white/30 dark:hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-0 disabled:pointer-events-none disabled:opacity-50 hover:scale-105 shadow-sm",
      "group-[.destructive]:bg-red-500/20 group-[.destructive]:hover:bg-red-500/30 group-[.destructive]:text-red-700 dark:group-[.destructive]:text-red-300",
      "group-[.success]:bg-green-500/20 group-[.success]:hover:bg-green-500/30 group-[.success]:text-green-700 dark:group-[.success]:text-green-300",
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
      "absolute right-3 top-3 rounded-lg p-1.5 text-gray-500 opacity-70 transition-all hover:text-gray-900 hover:bg-gray-100/80 dark:text-gray-400 dark:hover:text-gray-50 dark:hover:bg-gray-800/80 focus:opacity-100 focus:outline-none group-hover:opacity-100 hover:scale-110 hover:rotate-90",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-base font-semibold leading-none tracking-tight", className)}
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
    className={cn("text-sm mt-1.5 text-gray-600 dark:text-gray-400 leading-relaxed", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

// Get toast icon based on variant
export function getToastIcon(variant?: string) {
  const iconClasses = "h-5 w-5 transition-all duration-300 ease-out";
  
  switch (variant) {
    case 'success':
      return (
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/30 mr-3 shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform">
          <CheckCircle className={`${iconClasses} text-green-600 dark:text-green-400 drop-shadow-md`} />
          <div className="absolute inset-0 rounded-xl bg-green-400/20 blur-xl" />
        </div>
      );
    case 'destructive':
      return (
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/30 mr-3 shadow-lg shadow-red-500/20 group-hover:scale-110 transition-transform">
          <AlertCircle className={`${iconClasses} text-red-600 dark:text-red-400 drop-shadow-md`} />
          <div className="absolute inset-0 rounded-xl bg-red-400/20 blur-xl" />
        </div>
      );
    case 'warning':
      return (
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/30 mr-3 shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
          <AlertTriangle className={`${iconClasses} text-amber-600 dark:text-amber-400 drop-shadow-md`} />
          <div className="absolute inset-0 rounded-xl bg-amber-400/20 blur-xl" />
        </div>
      );
    case 'info':
      return (
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/30 mr-3 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
          <Info className={`${iconClasses} text-blue-600 dark:text-blue-400 drop-shadow-md`} />
          <div className="absolute inset-0 rounded-xl bg-blue-400/20 blur-xl" />
        </div>
      );
    case 'loading':
      return (
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/40 dark:to-purple-800/30 mr-3 shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform">
          <Loader2 className={`${iconClasses} text-purple-600 dark:text-purple-400 animate-spin drop-shadow-md`} />
          <div className="absolute inset-0 rounded-xl bg-purple-400/20 blur-xl animate-pulse" />
        </div>
      );
    default:
      return (
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/30 mr-3 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
          <BellRing className={`${iconClasses} text-blue-600 dark:text-blue-400 drop-shadow-md`} />
          <div className="absolute inset-0 rounded-xl bg-blue-400/20 blur-xl" />
        </div>
      );
  }
}

// Create styled link button for toast actions
export const ToastLink = ({ className, children, ...props }: React.ComponentPropsWithoutRef<"button">) => (
  <button
    className={cn(
      "inline-flex items-center justify-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-all focus:outline-none focus:underline gap-1.5 mt-2 group",
      className
    )}
    {...props}
  >
    {children}
    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
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