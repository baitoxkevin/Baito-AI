import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ShimmerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
  shimmerColor?: string;
  shimmerSize?: string;
  shimmerDuration?: string;
}

export function ShimmerButton({
  children,
  className,
  shimmerColor = "rgba(255,255,255,0.3)",
  shimmerSize = "100%",
  shimmerDuration = "3s",
  ...props
}: ShimmerButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        "relative overflow-hidden group inline-flex items-center justify-center rounded-md px-4 py-2 font-medium text-white transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed",
        "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700",
        className
      )}
    >
      <span className="absolute inset-0 overflow-hidden rounded-md">
        <span
          className="absolute inset-0 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform"
          style={{
            background: `linear-gradient(105deg, transparent 40%, ${shimmerColor} 50%, transparent 60%)`,
            width: shimmerSize,
            animation: `shimmer ${shimmerDuration} linear infinite`,
          }}
        />
      </span>
      <span className="relative z-10 flex items-center">{children}</span>
      
      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
      `}</style>
    </button>
  );
}