import { cn } from '@/lib/utils';
import React from 'react';

interface ShineBorderProps {
  children: React.ReactNode;
  className?: string;
  borderWidth?: number;
  borderRadius?: number;
  duration?: string;
  colors?: string[];
}

export function ShineBorder({
  children,
  className,
  borderWidth = 2,
  borderRadius = 8,
  duration = "4s",
  colors = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"],
}: ShineBorderProps) {
  const gradientColors = colors.join(", ");
  
  return (
    <div
      className={cn("relative", className)}
      style={{
        padding: borderWidth,
        borderRadius: borderRadius,
        background: `conic-gradient(from var(--border-angle), ${gradientColors})`,
        animation: `rotate-border ${duration} linear infinite`,
      }}
    >
      <div
        className="relative z-10 h-full w-full bg-white dark:bg-slate-900"
        style={{
          borderRadius: borderRadius - borderWidth,
        }}
      >
        {children}
      </div>
      
      <style>{`
        @property --border-angle {
          syntax: '<angle>';
          inherits: true;
          initial-value: 0deg;
        }
        
        @keyframes rotate-border {
          to {
            --border-angle: 360deg;
          }
        }
      `}</style>
    </div>
  );
}