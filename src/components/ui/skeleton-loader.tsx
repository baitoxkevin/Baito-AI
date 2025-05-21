import { cn } from "@/lib/utils"

type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "text" | "circular" | "rectangular" | "rounded" | "card" | "avatar" | "button" | "badge";
  width?: string | number;
  height?: string | number;
  animation?: "pulse" | "wave" | "none";
}

export function Skeleton({
  className,
  variant = "text",
  width,
  height,
  animation = "pulse",
  ...props
}: SkeletonProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case "text":
        return "h-4 w-full rounded"
      case "circular":
        return "rounded-full"
      case "rectangular":
        return ""
      case "rounded":
        return "rounded-md"
      case "card":
        return "h-[140px] w-full rounded-xl"
      case "avatar":
        return "h-10 w-10 rounded-full"
      case "button":
        return "h-9 w-20 rounded-md"
      case "badge":
        return "h-5 w-12 rounded-full"
      default:
        return ""
    }
  }

  const getAnimationClasses = () => {
    switch (animation) {
      case "pulse":
        return "animate-pulse"
      case "wave":
        return "animate-shimmer"
      case "none":
        return ""
      default:
        return "animate-pulse"
    }
  }

  const styles: React.CSSProperties = {}
  if (width) {
    styles.width = typeof width === "number" ? `${width}px` : width
  }
  if (height) {
    styles.height = typeof height === "number" ? `${height}px` : height
  }

  return (
    <div
      className={cn(
        "bg-slate-200 dark:bg-slate-800",
        getVariantClasses(),
        getAnimationClasses(),
        className
      )}
      style={styles}
      {...props}
    />
  )
}

export function SkeletonText({ 
  className, 
  lines = 3,
  width = "100%"
}: {
  className?: string;
  lines?: number;
  width?: string | number | string[] | number[];
}) {
  const getWidth = (index: number): string | number => {
    if (Array.isArray(width)) {
      return width[index % width.length] || "100%";
    }
    // Last line has 70% width if single width provided
    if (index === lines - 1) {
      return typeof width === "number" ? width * 0.7 : "70%";
    }
    return width;
  };

  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          variant="text" 
          className="h-4" 
          width={getWidth(i)} 
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      <Skeleton variant="avatar" />
      <SkeletonText lines={2} width={["80%", "55%"]} />
      <Skeleton variant="rectangular" className="h-28 rounded-md" />
      <div className="flex items-center justify-between">
        <Skeleton variant="button" className="h-8 w-16" />
        <Skeleton variant="button" className="h-8 w-24" />
      </div>
    </div>
  )
}

export function SkeletonProfile({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-4">
        <Skeleton variant="avatar" className="h-16 w-16" />
        <div className="space-y-2 flex-1">
          <Skeleton variant="text" className="h-6 w-1/2" />
          <Skeleton variant="text" className="h-4 w-1/4" />
        </div>
      </div>
      <SkeletonText lines={4} />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton variant="rectangular" className="h-16 rounded-lg" />
        <Skeleton variant="rectangular" className="h-16 rounded-lg" />
        <Skeleton variant="rectangular" className="h-16 rounded-lg" />
        <Skeleton variant="rectangular" className="h-16 rounded-lg" />
      </div>
    </div>
  )
}

export function SkeletonBadges({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant="badge" />
      ))}
    </div>
  )
}

// Add to tailwind.config.js:
// animation: {
//   shimmer: "shimmer 2s infinite linear",
// },
// keyframes: {
//   shimmer: {
//     from: { backgroundPosition: "0 0" },
//     to: { backgroundPosition: "200% 0" },
//   },
// },