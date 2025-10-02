import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow",
        outline: "text-foreground",
        success:
          "border-transparent bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/15",
        warning:
          "border-transparent bg-amber-500/10 text-amber-500 dark:bg-amber-500/15",
        info:
          "border-transparent bg-blue-500/10 text-blue-500 dark:bg-blue-500/15",
        pulse:
          "border-transparent bg-primary/10 text-primary-foreground animate-pulse-ring",
        glow:
          "border-transparent bg-blue-500/10 text-blue-500 shadow-glow",
      },
      size: {
        default: "h-6 px-2.5 py-0.5 text-xs",
        sm: "h-5 px-2 py-0 text-xs",
        lg: "h-7 px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  clickable?: boolean;
  dot?: boolean;
  dotColor?: string;
  icon?: React.ReactNode;
}

function Badge({
  className,
  variant,
  size,
  clickable = false,
  dot = false,
  dotColor = "bg-emerald-500",
  icon,
  ...props
}: BadgeProps) {
  const Comp = clickable ? motion.button : motion.div
  
  // Add motion variants
  const motionProps = clickable ? {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
  } : {}

  return (
    <Comp
      className={cn(
        badgeVariants({ variant, size }),
        clickable && "cursor-pointer hover:opacity-80 active:opacity-70",
        className
      )}
      {...motionProps}
      {...props}
    >
      {dot && (
        <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${dotColor}`} />
      )}
      {icon && (
        <span className="mr-1">{icon}</span>
      )}
      {props.children}
    </Comp>
  )
}

export { Badge, badgeVariants }