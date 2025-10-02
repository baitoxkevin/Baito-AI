import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & {
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    status?: "online" | "offline" | "away" | "busy" | "none";
    border?: boolean;
    borderColor?: string;
    hoverEffect?: "scale" | "pulse" | "rotate" | "glow" | "none";
  }
>(({ 
  className, 
  size = "md", 
  status = "none", 
  border = false,
  borderColor,
  hoverEffect = "none",
  ...props 
}, ref) => {
  const sizeClasses = {
    xs: "h-6 w-6",
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16"
  }

  const statusClasses = {
    online: "bg-green-500",
    offline: "bg-gray-400",
    away: "bg-yellow-500",
    busy: "bg-red-500",
    none: "hidden"
  }

  const statusSizes = {
    xs: "h-1.5 w-1.5",
    sm: "h-2 w-2",
    md: "h-2.5 w-2.5",
    lg: "h-3 w-3",
    xl: "h-3.5 w-3.5"
  }

  const borderSizes = {
    xs: "border-[1.5px]",
    sm: "border-2",
    md: "border-2",
    lg: "border-3",
    xl: "border-4"
  }

  const hoverVariants = {
    scale: "group-hover:scale-110 transition-transform duration-300",
    pulse: "group-hover:animate-pulse",
    rotate: "group-hover:rotate-12 transition-transform duration-300",
    glow: "group-hover:shadow-glow transition-shadow duration-300",
    none: ""
  }

  const borderColorClass = borderColor ? `border-${borderColor}` : "border-white dark:border-slate-900"

  return (
    <div className="group relative inline-block">
      <AvatarPrimitive.Root
        ref={ref}
        className={cn(
          "relative flex shrink-0 overflow-hidden rounded-full",
          sizeClasses[size],
          border && `${borderSizes[size]} ${borderColorClass}`,
          hoverVariants[hoverEffect],
          className
        )}
        {...props}
      />
      {status !== "none" && (
        <span 
          className={cn(
            "absolute bottom-0 right-0 rounded-full ring-2 ring-white dark:ring-slate-900",
            statusClasses[status],
            statusSizes[size]
          )}
        />
      )}
    </div>
  )
})
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> & {
    fade?: boolean;
  }
>(({ className, fade = true, ...props }, ref) => {
  const [isLoaded, setIsLoaded] = React.useState(false)

  return (
    <AvatarPrimitive.Image
      ref={ref}
      onLoad={() => setIsLoaded(true)}
      className={cn(
        fade ? "transition-opacity duration-500" : "",
        fade && !isLoaded ? "opacity-0" : "opacity-100",
        className
      )}
      {...props}
    />
  )
})
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> & {
    delayMs?: number;
    gradient?: boolean;
  }
>(({ className, delayMs, gradient = false, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800",
      gradient && "bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

// Enhanced avatar with motion effects
const MotionAvatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & {
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    status?: "online" | "offline" | "away" | "busy" | "none";
    border?: boolean;
    borderColor?: string;
    animate?: boolean;
    delay?: number;
  }
>(({ 
  className, 
  size = "md", 
  status = "none", 
  border = false,
  borderColor,
  animate = true,
  delay = 0,
  ...props 
}, ref) => {
  const MotionAvatarRoot = motion(AvatarPrimitive.Root)
  
  const sizeClasses = {
    xs: "h-6 w-6",
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16"
  }

  const statusClasses = {
    online: "bg-green-500",
    offline: "bg-gray-400",
    away: "bg-yellow-500",
    busy: "bg-red-500",
    none: "hidden"
  }

  const statusSizes = {
    xs: "h-1.5 w-1.5",
    sm: "h-2 w-2",
    md: "h-2.5 w-2.5",
    lg: "h-3 w-3",
    xl: "h-3.5 w-3.5"
  }

  const borderSizes = {
    xs: "border-[1.5px]",
    sm: "border-2",
    md: "border-2",
    lg: "border-3",
    xl: "border-4"
  }

  const borderColorClass = borderColor ? `border-${borderColor}` : "border-white dark:border-slate-900"

  return (
    <div className="relative inline-block">
      <MotionAvatarRoot
        ref={ref}
        className={cn(
          "relative flex shrink-0 overflow-hidden rounded-full",
          sizeClasses[size],
          border && `${borderSizes[size]} ${borderColorClass}`,
          className
        )}
        initial={animate ? { scale: 0.8, opacity: 0 } : undefined}
        animate={animate ? { scale: 1, opacity: 1 } : undefined}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: delay }}
        {...props}
      />
      {status !== "none" && (
        <motion.span 
          className={cn(
            "absolute bottom-0 right-0 rounded-full ring-2 ring-white dark:ring-slate-900",
            statusClasses[status],
            statusSizes[size]
          )}
          initial={animate ? { scale: 0, opacity: 0 } : undefined}
          animate={animate ? { scale: 1, opacity: 1 } : undefined}
          transition={{ delay: delay + 0.2 }}
        />
      )}
    </div>
  )
})
MotionAvatar.displayName = "MotionAvatar"

export { Avatar, AvatarImage, AvatarFallback, MotionAvatar }