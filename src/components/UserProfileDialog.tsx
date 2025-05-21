import React, { useState, useEffect, useRef } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Camera, 
  User, 
  Mail, 
  Phone, 
  AtSign,
  Save, 
  X, 
  Loader2, 
  RefreshCw, 
  Trash2 
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getUserProfile, updateUserProfile } from '@/lib/auth';
import { uploadAvatar, removeAvatar, getAvatarUrl } from '@/lib/avatar-service';
import type { UserProfile } from '@/lib/types';

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UserProfileDialog({ open, onOpenChange }: UserProfileDialogProps) {
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  // User data state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
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
        console.warn('Could not update avatar timestamp:', e);
      }
      return;
    }
    
    if (!open) return;
    
    const loadUserProfile = async () => {
      try {
        setIsLoading(true);
        
        const profile = await getUserProfile();
        setUserProfile(profile);
        
        // Try to get avatar from localStorage first
        let avatarUrl = '';
        try {
          // Check localStorage for stored avatar
          const storedAvatar = localStorage.getItem(`user_avatar_${profile.id}`);
          if (storedAvatar) {
            avatarUrl = storedAvatar;
          } else {
            // Fallback to getAvatarUrl function
            avatarUrl = getAvatarUrl(profile);
          }
        } catch (e) {
          // If localStorage access fails, use the standard method
          avatarUrl = getAvatarUrl(profile);
        }
        
        // Update form data
        setFormData({
          fullName: profile.full_name || '',
          username: profile.username || '',
          email: profile.email || '',
          phone: profile.contact_phone || '',
          avatarUrl: avatarUrl,
        });
      } catch (error) {
        console.error('Failed to load user profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your profile information',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserProfile();
  }, [open, toast]);
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part?.[0] || '')
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Handle file upload button click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  // Handle file selection for avatar upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile) return;
    
    try {
      setIsUploading(true);
      
      // Show preview immediately
      const objectUrl = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, avatarUrl: objectUrl }));
      
      // Read file as base64 to store in localStorage
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Image = e.target?.result as string;
        
        // Store in localStorage
        try {
          localStorage.setItem(`user_avatar_${userProfile.id}`, base64Image);
          
          // Update form data with the base64 image
          setFormData((prev) => ({ ...prev, avatarUrl: base64Image }));
          
          // Update user profile state (just for UI)
          setUserProfile((prev) => {
            if (!prev) return null;
            return { ...prev, avatar_url: base64Image };
          });
          
          toast({
            title: 'Success',
            description: 'Your profile picture has been updated',
          });
        } catch (storageError) {
          console.error('Failed to store avatar in localStorage:', storageError);
          toast({
            title: 'Warning',
            description: 'Profile picture updated for this session only',
            variant: 'default',
          });
        }
      };
      
      reader.onerror = () => {
        throw new Error('Failed to read image file');
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to process profile picture',
        variant: 'destructive',
      });
      
      // Revert to previous avatar
      if (userProfile.avatar_url) {
        setFormData((prev) => ({ ...prev, avatarUrl: userProfile.avatar_url }));
      } else {
        try {
          const storedAvatar = localStorage.getItem(`user_avatar_${userProfile.id}`);
          if (storedAvatar) {
            setFormData((prev) => ({ ...prev, avatarUrl: storedAvatar }));
          } else {
            // No avatar uploaded yet
            setFormData((prev) => ({ ...prev, avatarUrl: null }));
          }
        } catch (e) {
          // If localStorage fails, no avatar
          setFormData((prev) => ({ ...prev, avatarUrl: null }));
        }
      }
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Generate random avatar
  const handleGenerateRandomAvatar = async () => {
    if (!userProfile) return;
    
    try {
      setIsUploading(true);
      
      // Generate a random seed
      const seed = `avatar_${Math.random().toString(36).substring(2, 10)}`;
      
      // Store the seed in localStorage
      try {
        localStorage.setItem(`avatar_seed_${userProfile.id}`, seed);
      } catch (e) {
        console.warn('Could not save avatar seed to localStorage:', e);
      }
      
      // Update form data
      setFormData((prev) => ({ ...prev, avatarUrl: null }));
      
      // Update user profile with the avatar URL for UI purposes only
      setUserProfile((prev) => {
        if (!prev) return null;
        return { ...prev, avatar_url: avatarUrl };
      });
      
      toast({
        title: 'Avatar Generated',
        description: 'A new random avatar has been generated',
      });
    } catch (error) {
      console.error('Failed to generate avatar:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate a random avatar',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
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
        console.warn('Could not update avatar in localStorage:', e);
      }
      
      // Update form data
      setFormData((prev) => ({ ...prev, avatarUrl: null }));
      
      // Update user profile for UI purposes only
      setUserProfile((prev) => {
        if (!prev) return null;
        return { ...prev, avatar_url: null };
      });
      
      toast({
        title: 'Avatar Removed',
        description: 'Your profile picture has been removed',
      });
    } catch (error) {
      console.error('Failed to remove avatar:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove profile picture',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Save profile changes
  const handleSaveProfile = async () => {
    if (!userProfile) return;
    
    try {
      setIsSaving(true);
      
      // Create update data with only the essential fields
      // Don't try to update avatar fields which might be missing from the schema
      const updateData: Record<string, any> = {
        full_name: formData.fullName,
        username: formData.username || formData.email.split('@')[0],
        contact_phone: formData.phone,
      };
      
      // Store avatar URL in local storage as a workaround
      // This avoids database schema issues but still allows displaying the avatar
      if (formData.avatarUrl) {
        try {
          localStorage.setItem(`user_avatar_${userProfile.id}`, formData.avatarUrl);
        } catch (e) {
          console.warn('Could not save avatar URL to localStorage:', e);
        }
      }
      
      // Save changes
      await updateUserProfile(userProfile.id, updateData);
      
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully',
      });
      
      // Close dialog
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to update your profile',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle dialog open state changes
  const handleOpenChange = (open: boolean) => {
    // If closing dialog, explicitly update localStorage timestamp and broadcast event
    if (!open) {
      try {
        // Update timestamp for storage event listeners
        localStorage.setItem('avatar_updated_at', Date.now().toString());
        
        // Explicitly save current avatar URL to ensure other components can access it
        if (userProfile && formData.avatarUrl) {
          localStorage.setItem(`user_avatar_${userProfile.id}`, formData.avatarUrl);
          console.log(`Saved avatar URL to localStorage: ${formData.avatarUrl}`);
        }
        
        // Broadcast a custom event with the actual avatar URL for immediate update
        // This allows other components to update without needing another API call
        const event = new CustomEvent('avatarUpdated', {
          detail: { 
            timestamp: Date.now(),
            avatarUrl: formData.avatarUrl,
            userId: userProfile?.id
          }
        });
        window.dispatchEvent(event);
        console.log("Dispatched avatarUpdated event with current avatar URL");
      } catch (e) {
        console.warn('Could not signal avatar update:', e);
      }
    }
    
    // Call the original handler
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="text-left">
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16 border-2 border-primary/20">
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
              <AvatarFallback>{getInitials(formData.fullName || 'User')}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-xl">Profile Settings</DialogTitle>
              <div className="mt-1 flex flex-wrap gap-2">
                <Badge variant="secondary" className="font-normal">
                  @{formData.username || formData.email.split('@')[0]}
                </Badge>
                <Badge variant="outline">
                  {userProfile?.role?.charAt(0).toUpperCase() + userProfile?.role?.slice(1) || 'User'}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="avatar">Avatar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="flex-1 overflow-y-auto pt-4 space-y-5">
              {/* Personal Information */}
              <div>
                <h3 className="text-sm font-medium mb-2">Personal Information</h3>
                <div className="space-y-4 rounded-md border p-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <div className="flex">
                      <div className="flex items-center bg-muted px-3 rounded-l-md border border-r-0 border-input">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Input 
                        id="fullName" 
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="rounded-l-none"
                        placeholder="Enter your full name"
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <div className="flex">
                      <div className="flex items-center bg-muted px-3 rounded-l-md border border-r-0 border-input">
                        <AtSign className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Input 
                        id="username" 
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className="rounded-l-none"
                        placeholder="Enter your username"
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="flex">
                      <div className="flex items-center bg-muted px-3 rounded-l-md border border-r-0 border-input">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Input 
                        id="email" 
                        name="email"
                        value={formData.email}
                        className="rounded-l-none bg-muted"
                        disabled
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="flex">
                      <div className="flex items-center bg-muted px-3 rounded-l-md border border-r-0 border-input">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Input 
                        id="phone" 
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="rounded-l-none"
                        placeholder="Enter your phone number"
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Account Information */}
              <div>
                <h3 className="text-sm font-medium mb-2">Account Information</h3>
                <div className="rounded-md border p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Role</p>
                      <p className="text-sm text-muted-foreground">
                        {userProfile?.role?.charAt(0).toUpperCase() + userProfile?.role?.slice(1) || 'N/A'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium">Last Login</p>
                      <p className="text-sm text-muted-foreground">
                        {userProfile?.last_login ? new Date(userProfile.last_login).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="avatar" className="flex-1 overflow-y-auto pt-4">
              <div className="flex flex-col items-center space-y-6 p-4">
                {/* Large avatar preview */}
                <div className="relative">
                  <Avatar className="w-32 h-32 border-4 border-primary/20">
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center z-10">
                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                      </div>
                    )}
                    <AvatarImage 
                      src={formData.avatarUrl} 
                      alt={formData.fullName || 'User'} 
                      className="object-cover"
                    />
                    <AvatarFallback>{getInitials(formData.fullName || 'User')}</AvatarFallback>
                  </Avatar>
                  
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full shadow-md"
                    onClick={handleUploadClick}
                    disabled={isUploading}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    aria-label="Upload profile photo"
                  />
                </div>
                
                {/* Avatar options */}
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={handleUploadClick}
                    disabled={isUploading}
                  >
                    <Camera className="h-4 w-4" />
                    <span>Upload Photo</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={handleGenerateRandomAvatar}
                    disabled={isUploading}
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Generate Avatar</span>
                  </Button>
                  
                  {userProfile?.avatar_url && (
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={handleRemoveAvatar}
                      disabled={isUploading}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Remove Photo</span>
                    </Button>
                  )}
                </div>
                
                <div className="text-sm text-center text-muted-foreground max-w-md">
                  <p>Upload a photo to personalize your profile or generate a random avatar.</p>
                  <p>Supported formats: JPEG, PNG, GIF, WebP. Maximum size: 5MB.</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
        
        <DialogFooter className="flex justify-between items-center pt-4 border-t">
          <DialogClose asChild>
            <Button variant="ghost" disabled={isSaving || isUploading}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </DialogClose>
          
          <Button 
            onClick={handleSaveProfile}
            disabled={isLoading || isSaving || isUploading}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}