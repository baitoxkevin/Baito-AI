import React, { CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface NeonGradientCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  borderSize?: number;
  borderRadius?: number;
  neonColors?: {
    firstColor: string;
    secondColor: string;
  };
}

export function NeonGradientCard({
  children,
  className,
  borderSize = 2,
  borderRadius = 16,
  neonColors = {
    firstColor: "#9333ea",
    secondColor: "#3b82f6",
  },
  ...props
}: NeonGradientCardProps) {
  return (
    <div
      style={{
        "--border-size": `${borderSize}px`,
        "--border-radius": `${borderRadius}px`,
        "--first-color": neonColors.firstColor,
        "--second-color": neonColors.secondColor,
      } as CSSProperties}
      className={cn(
        "relative z-10 h-full w-full overflow-hidden rounded-[var(--border-radius)]",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-0 h-full w-full",
          "before:absolute before:inset-0 before:z-0",
          "before:h-full before:w-full before:opacity-30 before:blur-[100px]",
          "before:bg-gradient-to-br before:from-[var(--first-color)] before:to-[var(--second-color)]",
          "after:absolute after:inset-0 after:z-10",
          "after:bg-gradient-to-br after:from-[var(--first-color)] after:to-[var(--second-color)]"
        )}
      />
      <div
        className={cn(
          "relative z-20 h-full w-full overflow-hidden rounded-[calc(var(--border-radius)-var(--border-size))]",
          "bg-white dark:bg-gray-950"
        )}
        style={{
          margin: `var(--border-size)`,
          width: `calc(100% - calc(var(--border-size) * 2))`,
          height: `calc(100% - calc(var(--border-size) * 2))`,
        }}
      >
        {children}
      </div>
    </div>
  );
}