import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface AvatarData {
  id: string;
  name: string;
  image?: string;
}

export interface AvatarGroupProps {
  avatars: AvatarData[];
  max?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  overlap?: number;
  showTooltip?: boolean;
}

export function AvatarGroup({
  avatars,
  max = 5,
  size = 'md',
  className,
  overlap = 0.4,
  showTooltip = true,
}: AvatarGroupProps) {
  // Constants and calculations
  const sizeInPx = {
    sm: 32, // h-8
    md: 40, // h-10
    lg: 48, // h-12
    xl: 64, // h-16
  };
  
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };
  
  const overlapValue = sizeInPx[size] * overlap;
  const containerWidth = avatars.length 
    ? sizeInPx[size] + ((Math.min(avatars.length, max) - 1) * (sizeInPx[size] - overlapValue))
    : 0;
  
  // Get initials from name
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Visible avatars and remaining count
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length > max ? avatars.length - max : 0;
  
  // Avatar component with optional tooltip
  const AvatarWithTooltip = ({ avatar, index }: { avatar: AvatarData, index: number }) => {
    const avatarComponent = (
      <Avatar 
        className={cn(
          sizeClasses[size],
          'border-2 border-background',
          'relative inline-block',
          className
        )}
        style={{ 
          marginLeft: index === 0 ? 0 : `-${overlapValue}px`,
          zIndex: visibleAvatars.length - index 
        }}
      >
        {avatar.image ? (
          <AvatarImage src={avatar.image} alt={avatar.name} />
        ) : (
          <AvatarFallback>{getInitials(avatar.name)}</AvatarFallback>
        )}
      </Avatar>
    );
    
    if (showTooltip) {
      return (
        <TooltipProvider key={avatar.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              {avatarComponent}
            </TooltipTrigger>
            <TooltipContent>
              <p>{avatar.name}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    return <React.Fragment key={avatar.id}>{avatarComponent}</React.Fragment>;
  };
  
  // Remaining count component
  const RemainingCount = () => {
    if (remainingCount <= 0) return null;
    
    const countComponent = (
      <Avatar 
        className={cn(
          sizeClasses[size],
          'border-2 border-background bg-muted',
          'relative inline-block',
          className
        )}
        style={{ 
          marginLeft: `-${overlapValue}px`,
          zIndex: 0
        }}
      >
        <AvatarFallback className="bg-secondary text-secondary-foreground">
          +{remainingCount}
        </AvatarFallback>
      </Avatar>
    );
    
    if (showTooltip) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {countComponent}
            </TooltipTrigger>
            <TooltipContent>
              <p>{remainingCount} more</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    return countComponent;
  };

  return (
    <div 
      className="flex items-center" 
      style={{ width: containerWidth > 0 ? `${containerWidth}px` : 'auto' }}
    >
      {visibleAvatars.map((avatar, index) => (
        <AvatarWithTooltip key={avatar.id} avatar={avatar} index={index} />
      ))}
      <RemainingCount />
    </div>
  );
}