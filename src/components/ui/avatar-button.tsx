import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import ProfileConfigDialog from '@/components/ProfileConfigDialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AvatarButtonProps {
  avatarUrl: string;
  name: string;
  className?: string;
  onClick?: () => void;
  showProfileDialog?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function AvatarButton({
  avatarUrl,
  name,
  className = '',
  onClick,
  showProfileDialog = true,
  size = 'md'
}: AvatarButtonProps) {
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  
  // Size mappings
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };
  
  // Get initials from name
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Handle avatar click
  const handleAvatarClick = () => {
    if (onClick) {
      onClick();
    } else if (showProfileDialog) {
      setProfileDialogOpen(true);
    }
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              className={`p-0 h-auto ${className}`} 
              onClick={handleAvatarClick}
              aria-label={`${name}'s profile`}
            >
              <Avatar className={`${sizeClasses[size]} border-2 border-primary/10 hover:border-primary/30 transition-all`}>
                <AvatarImage 
                  src={avatarUrl} 
                  alt={`${name}'s avatar`}
                  className="object-cover"
                />
                <AvatarFallback>{getInitials(name)}</AvatarFallback>
              </Avatar>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{name}'s profile</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {showProfileDialog && (
        <ProfileConfigDialog
          open={profileDialogOpen}
          onOpenChange={setProfileDialogOpen}
        />
      )}
    </>
  );
}