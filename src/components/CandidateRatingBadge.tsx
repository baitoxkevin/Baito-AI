import { cn } from "@/lib/utils";
import { StarIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface CandidateRatingBadgeProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

export function CandidateRatingBadge({
  rating,
  size = 'md',
  showTooltip = true,
  className
}: CandidateRatingBadgeProps) {
  const sizeClasses = {
    sm: "h-4",
    md: "h-5",
    lg: "h-6"
  };

  const colorClasses = {
    1: "text-red-500",
    2: "text-orange-500",
    3: "text-yellow-500",
    4: "text-lime-500",
    5: "text-green-500"
  };

  const tooltipText = {
    1: "Poor - Significant issues",
    2: "Fair - Below expectations",
    3: "Good - Met expectations",
    4: "Very Good - Exceeded expectations",
    5: "Excellent - Outstanding performance"
  };

  const stars = (
    <div className="flex items-center space-x-0.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <StarIcon
          key={index}
          className={cn(
            sizeClasses[size],
            index < rating ? colorClasses[rating as keyof typeof colorClasses] : "text-gray-300"
          )}
          fill={index < rating ? "currentColor" : "none"}
        />
      ))}
    </div>
  );

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <div className={cn("inline-flex", className)}>
              {stars}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">{tooltipText[rating as keyof typeof tooltipText]}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return <div className={cn("inline-flex", className)}>{stars}</div>;
}

interface CandidateBlacklistBadgeProps {
  reason: string;
  date: Date | string;
  className?: string;
}

export function CandidateBlacklistBadge({
  reason,
  date,
  className
}: CandidateBlacklistBadgeProps) {
  const formattedDate = typeof date === 'string' 
    ? new Date(date).toLocaleDateString() 
    : date.toLocaleDateString();

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              "inline-flex items-center px-2 py-1 rounded-full bg-red-100 text-red-800 text-xs font-medium",
              className
            )}
          >
            <span className="mr-1">⚠️</span> Blacklisted
          </div>
        </TooltipTrigger>
        <TooltipContent className="w-64 p-3">
          <div className="space-y-2">
            <p className="font-semibold text-red-600">Blacklisted on {formattedDate}</p>
            <p className="text-sm">{reason}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface CandidateHistoryStatProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  className?: string;
}

export function CandidateHistoryStat({
  label,
  value,
  icon,
  className
}: CandidateHistoryStatProps) {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      {icon && <div className="text-gray-500">{icon}</div>}
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}