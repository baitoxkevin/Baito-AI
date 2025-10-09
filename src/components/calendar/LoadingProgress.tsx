import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LoadingProgressProps {
  progress: number; // 0-100
  message?: string;
  className?: string;
  showPercentage?: boolean;
}

/**
 * Loading progress indicator for calendar operations
 * Shows a progress bar with optional message and percentage
 */
export function LoadingProgress({
  progress,
  message,
  className,
  showPercentage = true,
}: LoadingProgressProps) {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={cn('space-y-2', className)}>
      {/* Message or percentage */}
      {(message || showPercentage) && (
        <div className="flex items-center justify-between text-sm">
          {message && (
            <span className="text-muted-foreground">{message}</span>
          )}
          {showPercentage && (
            <span className="font-medium text-primary">
              {Math.round(clampedProgress)}%
            </span>
          )}
        </div>
      )}

      {/* Progress bar container */}
      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{
            duration: 0.3,
            ease: 'easeOut',
          }}
        />
      </div>
    </div>
  );
}

interface LoadingPhaseIndicatorProps {
  phases: string[];
  currentPhase: number;
  className?: string;
}

/**
 * Multi-phase loading indicator showing current step
 * Useful for showing progress through multiple loading stages
 */
export function LoadingPhaseIndicator({
  phases,
  currentPhase,
  className,
}: LoadingPhaseIndicatorProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {phases.map((phase, index) => {
        const isActive = index === currentPhase;
        const isCompleted = index < currentPhase;

        return (
          <motion.div
            key={index}
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {/* Phase indicator */}
            <div
              className={cn(
                'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
                isCompleted &&
                  'bg-primary text-primary-foreground',
                isActive &&
                  'bg-primary/20 text-primary ring-2 ring-primary',
                !isCompleted &&
                  !isActive &&
                  'bg-secondary text-muted-foreground'
              )}
            >
              {isCompleted ? (
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <span>{index + 1}</span>
              )}
            </div>

            {/* Phase label */}
            <span
              className={cn(
                'text-sm transition-colors',
                isActive && 'font-medium text-foreground',
                isCompleted && 'text-muted-foreground line-through',
                !isActive && !isCompleted && 'text-muted-foreground'
              )}
            >
              {phase}
            </span>

            {/* Loading spinner for active phase */}
            {isActive && (
              <motion.div
                className="ml-auto"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              >
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Simple spinner component
 */
export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div
      className={cn(
        'rounded-full border-primary border-t-transparent animate-spin',
        sizeClasses[size],
        className
      )}
    />
  );
}

/**
 * Inline loading indicator for small spaces
 */
export function InlineLoader({ text }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Spinner size="sm" />
      {text && <span>{text}</span>}
    </div>
  );
}
