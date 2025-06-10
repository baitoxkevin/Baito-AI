import React, { useState, useEffect, useRef } from 'react';
import { logger } from '../lib/logger';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Camera, 
  User, 
  Mail, 
  Phone, 
  AtSign,
  Save, 
  Loader2, 
  Trash2,
  Upload,
  Check
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getUserProfile, updateUserProfile } from '@/lib/auth';
import { uploadAvatar, removeAvatar, getAvatarUrl } from '@/lib/avatar-service';
import type { UserProfile } from '@/lib/types';
import { cn } from '@/lib/utils';

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UserProfileDialog({ open, onOpenChange }: UserProfileDialogProps) {
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // User data state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [originalData, setOriginalData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    avatarUrl: '',
  });
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    avatarUrl: '',
  });
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Toast notifications
  const { toast } = useToast();
  
  // Load user profile data when dialog opens and handle closing
  useEffect(() => {
    // When dialog closes, trigger any listeners waiting for changes
    if (!open && userProfile) {
      // Publish a change event by updating a timestamp in localStorage
      try {
        localStorage.setItem('avatar_updated_at', Date.now().toString());
      } catch (e) {
        logger.warn('Could not update avatar timestamp:', e);
      }
      return;
    }
    
    if (!open) return;
    
    const loadUserProfile = async () => {
      try {
        setIsLoading(true);
        
        const profile = await getUserProfile();
        setUserProfile(profile);
        
        // Load form data with user profile data
        const data = {
          fullName: profile.full_name || '',
          username: profile.username || '',
          email: profile.email || '',
          phone: profile.contact_phone || '',
          avatarUrl: profile.avatar_url || getAvatarUrl(profile),
        };
        
        setFormData(data);
        setOriginalData(data);
        setHasChanges(false);
        
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserProfile();
  }, [open, toast]);
  
  // Check for changes
  useEffect(() => {
    const changed = 
      formData.fullName !== originalData.fullName ||
      formData.username !== originalData.username ||
      formData.phone !== originalData.phone ||
      formData.avatarUrl !== originalData.avatarUrl;
    
    setHasChanges(changed);
  }, [formData, originalData]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  // Save profile changes
  const handleSaveProfile = async () => {
    if (!userProfile || !hasChanges) return;
    
    try {
      setIsSaving(true);
      
      await updateUserProfile({
        full_name: formData.fullName,
        username: formData.username,
        contact_phone: formData.phone,
      });
      
      // Update local user profile state
      setUserProfile((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          full_name: formData.fullName,
          username: formData.username,
          contact_phone: formData.phone,
        };
      });
      
      // Update original data to reflect saved changes
      setOriginalData(formData);
      setHasChanges(false);
      
      toast({
        title: 'Profile Updated',
        description: 'Your changes have been saved successfully',
      });
      
      // Close dialog after successful save
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
      
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  // Handle file selection for avatar upload
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleAvatarUpload(file);
    }
  };
  
  // Upload avatar
  const handleAvatarUpload = async (file: File) => {
    if (!userProfile) return;
    
    try {
      setIsUploading(true);
      
      // Create a FileReader to read the file
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        // Store the avatar in localStorage using user ID as key
        try {
          localStorage.setItem(`user_avatar_${userProfile.id}`, base64String);
          
          // Update form data
          setFormData((prev) => ({ ...prev, avatarUrl: base64String }));
          
          // Update user profile with the avatar URL
          setUserProfile((prev) => {
            if (!prev) return null;
            return { ...prev, avatar_url: base64String };
          });
          
          toast({
            title: 'Avatar Updated',
            description: 'Your profile picture has been updated',
            variant: 'default',
          });
        } catch (e) {
          logger.error('Failed to store avatar in localStorage:', e);
          toast({
            title: 'Storage Error', 
            description: 'Failed to save profile picture. Local storage may be full.',
            variant: 'destructive',
          });
        }
      };
      
      reader.onerror = () => {
        throw new Error('Failed to read image file');
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      logger.error('Failed to upload avatar:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to process profile picture',
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
  
  // Remove avatar
  const handleRemoveAvatar = async () => {
    if (!userProfile) return;
    
    try {
      setIsUploading(true);
      
      // Try to remove the stored avatars from localStorage
      try {
        localStorage.removeItem(`user_avatar_${userProfile.id}`);
        localStorage.removeItem(`avatar_seed_${userProfile.id}`);
      } catch (e) {
        logger.warn('Could not update avatar in localStorage:', e);
      }
      
      // Reset form data avatar URL
      setFormData((prev) => ({ ...prev, avatarUrl: null }));
      
      // Update user profile to remove avatar URL
      setUserProfile((prev) => {
        if (!prev) return null;
        return { ...prev, avatar_url: null };
      });
      
      toast({
        title: 'Avatar Removed',
        description: 'Your profile picture has been removed',
      });
    } catch (error) {
      logger.error('Failed to remove avatar:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove profile picture',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle dialog open change
  const handleOpenChange = (newOpen: boolean) => {
    // If closing and profile has been updated, refresh avatar globally
    if (!newOpen && open) {
      // Force refresh cached avatars
      try {
        const event = new CustomEvent('avatarUpdated', { detail: { userId: userProfile?.id } });
        window.dispatchEvent(event);
      } catch (e) {
        logger.warn('Could not dispatch avatar update event:', e);
      }
    }
    
    // Call the original handler
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background p-6 pb-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Profile Settings</DialogTitle>
          </DialogHeader>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="p-6 pt-2 space-y-6">
            {/* Avatar Section */}
            <div className="flex items-start gap-4">
              <div className="relative group">
                <Avatar className="w-24 h-24 border-2 border-border">
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center z-10">
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    </div>
                  )}
                  <AvatarImage 
                    src={formData.avatarUrl} 
                    alt={formData.fullName || 'User'} 
                    className="object-cover"
                  />
                  <AvatarFallback className="text-lg">
                    {getInitials(formData.fullName || formData.email || 'User')}
                  </AvatarFallback>
                </Avatar>
                
                {/* Online indicator */}
                <div className="absolute bottom-0 right-0 h-5 w-5 bg-green-500 rounded-full border-3 border-background shadow-sm" />
                
                {/* Upload overlay on hover */}
                <div 
                  className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-full transition-all cursor-pointer flex items-center justify-center"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="font-medium text-base">
                    {formData.fullName || formData.username || 'User'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    @{formData.username || formData.email.split('@')[0]}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {userProfile?.role || 'User'}
                  </Badge>
                  <Badge variant="outline" className="text-xs px-2 py-0.5 text-green-600 border-green-200 bg-green-50">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5" />
                    Online
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="text-xs"
                  >
                    <Upload className="h-3 w-3 mr-1.5" />
                    Change Photo
                  </Button>
                  {formData.avatarUrl && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleRemoveAvatar}
                      disabled={isUploading}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Profile Form */}
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="fullName" 
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Enter your name"
                      disabled={isSaving}
                      className="pl-9"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">
                    Username
                  </Label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="username" 
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="username"
                      disabled={isSaving}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    name="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="pl-9 bg-muted/50"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="phone" 
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 000-0000"
                    disabled={isSaving}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                {hasChanges ? 'You have unsaved changes' : 'All changes saved'}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveProfile}
                  disabled={isSaving || !hasChanges}
                  className="min-w-[100px]"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {hasChanges ? (
                        <Save className="h-4 w-4 mr-2" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      {hasChanges ? 'Save Changes' : 'Saved'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  );
}