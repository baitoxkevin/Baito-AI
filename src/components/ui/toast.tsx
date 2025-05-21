import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

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
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

type ToastProps = React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & 
  VariantProps<typeof toastVariants>;

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  ToastProps
>(({ className, variant, ...props }, ref) => {
  const [progress, setProgress] = React.useState(100);
  
  // Add progress animation for auto-dismiss countdown
  React.useEffect(() => {
    if (props.open) {
      setProgress(100);
      
      const startTime = Date.now();
      const duration = 3000; // 3 seconds to match auto-dismiss timing
      
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
        
        setProgress(remaining);
        
        if (remaining <= 0) {
          clearInterval(interval);
        }
      }, 10);
      
      return () => clearInterval(interval);
    }
  }, [props.open]);
  
  const progressBarColor = React.useMemo(() => {
    switch (variant) {
      case 'success': return 'bg-green-500';
      case 'destructive': return 'bg-red-500';
      case 'warning': return 'bg-amber-500';
      case 'info': return 'bg-blue-500';
      default: return 'bg-blue-500';
    }
  }, [variant]);
  
  const variantGlow = React.useMemo(() => {
    switch (variant) {
      case 'success': return 'shadow-[0_0_10px_rgba(34,197,94,0.2)]';
      case 'destructive': return 'shadow-[0_0_10px_rgba(239,68,68,0.2)]';
      case 'warning': return 'shadow-[0_0_10px_rgba(245,158,11,0.2)]';
      case 'info': return 'shadow-[0_0_10px_rgba(59,130,246,0.2)]';
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
      {...props}
    >
      {props.children}
      
      {/* Progress bar for auto-dismiss countdown */}
      <div className="absolute bottom-0 left-0 h-[3px] w-full bg-gray-200/50 dark:bg-gray-700/50">
        <div 
          className={cn("h-full transition-all ease-linear", progressBarColor)} 
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