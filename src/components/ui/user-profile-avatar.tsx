import React, { useState, useRef, useEffect } from 'react';
import { Camera, User, Loader2, Settings, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from '@/hooks/use-toast';
import { getUserProfile, updateUserProfile } from '@/lib/auth';
import { uploadAvatar, removeAvatar, getAvatarUrl } from '@/lib/avatar-service';
import ProfileConfigDialog from '@/components/ProfileConfigDialog';

interface UserProfileAvatarProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showProfileDialog?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function UserProfileAvatar({
  className = '',
  size = 'md',
  showProfileDialog = true,
  onOpenChange,
}: UserProfileAvatarProps) {
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [userData, setUserData] = useState({
    id: '',
    fullName: 'User',
    email: '',
    avatarUrl: '',
  });
  
  // Size mappings
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };
  
  // Toast notifications
  const { toast } = useToast();
  
  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const profile = await getUserProfile();
        if (!profile) return;
        
        setUserData({
          id: profile.id,
          fullName: profile.full_name || profile.email?.split('@')[0] || 'User',
          email: profile.email || '',
          avatarUrl: getAvatarUrl(profile),
        });
      } catch (error) {
        console.error('Error loading user profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your profile. Please try again.',
          variant: 'destructive',
        });
      }
    };
    
    loadUserData();
  }, [toast, profileDialogOpen]);  // Reload when profile dialog closes
  
  // Get initials from name
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part?.[0] || '')
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Handle profile dialog open/close
  const handleProfileDialogChange = (open: boolean) => {
    setProfileDialogOpen(open);
    if (onOpenChange) {
      onOpenChange(open);
    }
  };
  
  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userData.id) return;
    
    try {
      setIsUploading(true);
      
      // Immediate local preview for better UX
      const objectUrl = URL.createObjectURL(file);
      setUserData(prev => ({ ...prev, avatarUrl: objectUrl }));
      
      // Upload to server
      const avatarUrl = await uploadAvatar(userData.id, file);
      
      // Update state with server URL
      setUserData(prev => ({ ...prev, avatarUrl }));
      
      toast({
        title: 'Avatar Updated',
        description: 'Your profile picture has been updated successfully.',
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      
      // Revert to original avatar
      const profile = await getUserProfile();
      if (profile) {
        setUserData(prev => ({ 
          ...prev, 
          avatarUrl: getAvatarUrl(profile)
        }));
      }
      
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload your profile picture. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  return (
    <>
      {/* Simple button with avatar */}
      <div className="relative">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={`p-0 h-auto relative group ${className}`}
                aria-label={`${userData.fullName}'s profile`}
                onClick={() => handleProfileDialogChange(true)}
              >
                <Avatar 
                  className={`${sizeClasses[size]} border-2 border-primary/10 group-hover:border-primary/30 transition-all`}
                >
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center z-10">
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    </div>
                  )}
                  <AvatarImage 
                    src={userData.avatarUrl} 
                    alt={`${userData.fullName}'s avatar`} 
                  />
                  <AvatarFallback>{getInitials(userData.fullName)}</AvatarFallback>
                </Avatar>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{userData.fullName}'s profile</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {/* Quick upload button overlay */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full shadow-md hover:bg-primary hover:text-white"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          aria-label="Upload profile photo"
        >
          <Camera className="h-3 w-3" />
        </Button>
      </div>
      
      {/* Hidden file input for avatar upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        aria-label="Upload profile photo"
      />
      
      {/* Profile dialog */}
      {showProfileDialog && (
        <ProfileConfigDialog
          open={profileDialogOpen}
          onOpenChange={handleProfileDialogChange}
        />
      )}
    </>
  );
}