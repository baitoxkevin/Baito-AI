import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface SimpleCandidateAvatarProps {
  name: string;
  image?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Helper function to get initials from name
function getInitials(name: string) {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function SimpleCandidateAvatar({ 
  name, 
  image, 
  size = 'md',
  className 
}: SimpleCandidateAvatarProps) {
  // Size classes
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };

  const initials = getInitials(name || 'Unknown');

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {image ? (
        <AvatarImage src={image} alt={name} />
      ) : (
        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
          {initials}
        </AvatarFallback>
      )}
    </Avatar>
  );
}