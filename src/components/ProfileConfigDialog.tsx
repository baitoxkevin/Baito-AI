import { useState, useEffect, useRef, useCallback } from 'react';
import { DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PersistentDialog, PersistentDialogContent } from '@/components/ui/persistent-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { logger } from '../lib/logger';
import { 
  Loader2, Camera, X, Check, RefreshCcw, Upload, Trash2, User, 
  Mail, AtSign, Calendar, Settings, Languages, Save, BellRing 
} from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { cn } from '@/lib/utils';
import { getUserProfile, updateUserProfile } from '@/lib/auth';
import { uploadAvatar, removeAvatar, getAvatarUrl } from '@/lib/avatar-service';
import type { UserProfile, User } from '@/lib/types';

// Props interface
interface ProfileConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// User preferences interface
interface UserPreferences {
  darkMode: boolean;
  notifications: {
    email: boolean;
    push: boolean;
    projectReminders: boolean;
  };
  calendar: {
    defaultView: 'month' | 'week' | 'day';
    weekStartsOn: 0 | 1; // 0 = Sunday, 1 = Monday
  };
  appearance: {
    baitoianStyle: 'default' | 'crew' | 'supervisor' | 'recruiter' | 'manager';
  };
}

// Form data interface
interface ProfileFormData {
  fullName: string;
  username: string;
  phoneNumber: string;
  avatarUrl: string;
}

// Default preferences value
const defaultPreferences: UserPreferences = {
  darkMode: false,
  notifications: {
    email: true,
    push: true,
    projectReminders: true,
  },
  calendar: {
    defaultView: 'month',
    weekStartsOn: 1,
  },
  appearance: {
    baitoianStyle: 'default'
  }
};

export default function ProfileConfigDialog({ open, onOpenChange }: ProfileConfigDialogProps) {
  // Refs
  const dialogRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Toast notification hook
  const { toast } = useToast();
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  // User data state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userEmail, setUserEmail] = useState('');
  
  // Form data state
  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: '',
    username: '',
    phoneNumber: '',
    avatarUrl: '',
  });
  
  // Preferences state
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  
  // UI state
  const [activeTab, setActiveTab] = useState('profile');
  const [isDialogMounted, setIsDialogMounted] = useState(false);
  
  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setActiveTab('profile');
      setIsDialogMounted(false);
    } else {
      // Set a small delay to ensure dialog is fully mounted before rendering content
      const timer = setTimeout(() => {
        setIsDialogMounted(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [open]);
  
  // Load user profile when dialog opens
  useEffect(() => {
    async function loadUserProfile() {
      if (!open) return;
      
      try {
        setIsLoading(true);
        // logger.debug("Loading user profile...");
        
        // Get user profile
        const profile = await getUserProfile();
        // logger.debug("User profile loaded:", { data: profile });
        
        // Store profile data
        setUserProfile(profile);
        setUserEmail(profile.email || '');
        
        // Set form values
        setFormData({
          fullName: profile.full_name || '',
          username: profile.username || '',
          phoneNumber: profile.contact_phone || '',
          avatarUrl: getAvatarUrl(profile),
        });
        
        // Set preferences from profile or default
        setPreferences({
          darkMode: profile.preferences?.darkMode || defaultPreferences.darkMode,
          notifications: {
            email: profile.preferences?.notifications?.email ?? defaultPreferences.notifications.email,
            push: profile.preferences?.notifications?.push ?? defaultPreferences.notifications.push,
            projectReminders: profile.preferences?.notifications?.projectReminders ?? defaultPreferences.notifications.projectReminders,
          },
          calendar: {
            defaultView: profile.preferences?.calendar?.defaultView || defaultPreferences.calendar.defaultView,
            weekStartsOn: profile.preferences?.calendar?.weekStartsOn || defaultPreferences.calendar.weekStartsOn,
          },
          appearance: {
            baitoianStyle: profile.preferences?.appearance?.baitoianStyle || defaultPreferences.appearance.baitoianStyle
          }
        });
      } catch (error) {
        logger.error('Error loading user profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your profile. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    loadUserProfile();
  }, [open, toast]);
  
  // Force a redraw when the dialog is visible to fix potential rendering issues
  useEffect(() => {
    if (open && isDialogMounted && dialogRef.current) {
      // Force a reflow/repaint to ensure content is visible
      const forceReflow = dialogRef.current.offsetHeight;
      
      // Force focus into the dialog to ensure keyboard navigation works
      const focusableElement = dialogRef.current.querySelector('button, input, [tabindex]') as HTMLElement;
      if (focusableElement) {
        setTimeout(() => focusableElement.focus(), 100);
      }
      
      // Add class to body to prevent background scrolling
      document.body.classList.add('overflow-hidden');
      
      return () => {
        document.body.classList.remove('overflow-hidden');
      };
    }
  }, [open, isDialogMounted]);
  
  // Handle form changes
  const handleInputChange = useCallback((field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);
  
  // Handle preference changes
  const handlePreferenceChange = useCallback((path: string[], value: unknown) => {
    setPreferences(prev => {
      const newPreferences = { ...prev };
      let current: Record<string, unknown> = newPreferences as Record<string, unknown>;
      
      // Navigate through the path to the right property
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]] as Record<string, unknown>;
      }
      
      // Set the value
      current[path[path.length - 1]] = value;
      
      return newPreferences;
    });
  }, []);
  
  // Handle file upload click
  const handleUploadClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);
  
  // Handle file selection
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile) return;
    
    try {
      setIsUploadingAvatar(true);
      
      // Immediately preview the selected image
      const objectUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, avatarUrl: objectUrl }));
      
      // Simultaneously update localStorage for immediate access by other components
      try {
        localStorage.setItem(`user_avatar_${userProfile.id}`, objectUrl);
        
        // Notify sidebar and other components of the avatar change
        const previewEvent = new CustomEvent('avatarUpdated', {
          detail: { 
            timestamp: Date.now(),
            avatarUrl: objectUrl,
            userId: userProfile.id,
            status: 'preview'
          }
        });
        window.dispatchEvent(previewEvent);
      } catch (e) {
        // logger.warn('Could not update localStorage with preview avatar:', e);
      }
      
      // Upload the avatar to permanent storage
      const avatarUrl = await uploadAvatar(userProfile.id, file);
      
      // Update preview URL with the permanent URL
      setFormData(prev => ({ ...prev, avatarUrl }));
      
      // Update the user profile in state
      setUserProfile(prev => {
        if (!prev) return null;
        return { ...prev, avatar_url: avatarUrl, avatar_seed: undefined };
      });
      
      // Update localStorage with permanent URL and notify components
      try {
        localStorage.setItem(`user_avatar_${userProfile.id}`, avatarUrl);
        localStorage.setItem('avatar_updated_at', Date.now().toString());
        
        // Notify sidebar and other components of the final avatar
        const finalEvent = new CustomEvent('avatarUpdated', {
          detail: { 
            timestamp: Date.now(),
            avatarUrl: avatarUrl,
            userId: userProfile.id,
            status: 'final'
          }
        });
        window.dispatchEvent(finalEvent);
      } catch (e) {
        // logger.warn('Could not update localStorage with final avatar:', e);
      }
      
      toast({
        title: 'Avatar Updated',
        description: 'Your avatar has been updated successfully.',
      });
    } catch (error) {
      logger.error('Error uploading avatar:', error);
      
      // Show error and revert to previous avatar
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload avatar. Please try again.',
        variant: 'destructive',
      });
      
      // Revert preview to previous avatar
      if (userProfile.avatar_url) {
        setFormData(prev => ({ ...prev, avatarUrl: userProfile.avatar_url }));
        
        // Update localStorage with the reverted URL
        try {
          localStorage.setItem(`user_avatar_${userProfile.id}`, userProfile.avatar_url);
          localStorage.setItem('avatar_updated_at', Date.now().toString());
          
          // Notify components of reversion
          const revertEvent = new CustomEvent('avatarUpdated', {
            detail: { 
              timestamp: Date.now(),
              avatarUrl: userProfile.avatar_url,
              userId: userProfile.id,
              status: 'revert'
            }
          });
          window.dispatchEvent(revertEvent);
        } catch (e) {
          // logger.warn('Could not update localStorage with reverted avatar:', e);
        }
      } else {
        // Clear avatar to use initials
        setFormData(prev => ({ ...prev, avatarUrl: '' }));
        
        // Clear localStorage
        try {
          localStorage.removeItem(`user_avatar_${userProfile.id}`);
          localStorage.setItem('avatar_updated_at', Date.now().toString());
          
          // Notify components
          const clearEvent = new CustomEvent('avatarUpdated', {
            detail: { 
              timestamp: Date.now(),
              avatarUrl: '',
              userId: userProfile.id,
              status: 'revert'
            }
          });
          window.dispatchEvent(clearEvent);
        } catch (e) {
          // logger.warn('Could not update localStorage:', e);
        }
      }
    } finally {
      setIsUploadingAvatar(false);
      // Clear the file input to allow uploading the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [userProfile, toast]);
  
  // Generate random avatar - now just clears the custom avatar
  const handleGenerateRandomAvatar = useCallback(async () => {
    if (!userProfile) return;
    
    try {
      setIsUploadingAvatar(true);
      
      // Clear avatar to use initials
      setFormData(prev => ({ ...prev, avatarUrl: '' }));
      
      // Update user profile locally
      setUserProfile(prev => {
        if (!prev) return null;
        return { ...prev, avatar_seed: null, avatar_url: null };
      });
      
      toast({
        title: 'Avatar Reset',
        description: 'Your avatar has been reset. You will now use initials.',
      });
    } catch (error) {
      logger.error('Error resetting avatar:', error);
      toast({
        title: 'Error',
        description: 'Failed to reset avatar. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  }, [userProfile, toast]);
  
  // Remove custom avatar
  const handleRemoveAvatar = useCallback(async () => {
    if (!userProfile) return;
    
    try {
      setIsUploadingAvatar(true);
      
      // Clear avatar to use initials
      setFormData(prev => ({ ...prev, avatarUrl: '' }));
      
      // Update user profile locally
      setUserProfile(prev => {
        if (!prev) return null;
        return { ...prev, avatar_seed: null, avatar_url: null };
      });
      
      // If there's a custom avatar, remove it from storage
      if (userProfile.avatar_url) {
        await removeAvatar(userProfile.id);
      }
      
      toast({
        title: 'Avatar Removed',
        description: 'Your custom avatar has been removed. You will now use initials.',
      });
    } catch (error) {
      logger.error('Error removing avatar:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove your avatar. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  }, [userProfile, toast]);
  
  // Save profile changes
  const handleSaveProfile = useCallback(async () => {
    if (!userProfile) return;
    
    try {
      setIsSaving(true);
      
      // Prepare data for update
      const updateData: Partial<User> & {
        avatar_seed?: string | null;
        raw_app_meta_data?: Record<string, unknown>;
      } = {
        full_name: formData.fullName,
        contact_phone: formData.phoneNumber,
        username: formData.username || userEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_'),
      };
      
      // Handle avatar - only custom URLs
      if (formData.avatarUrl) {
        updateData.avatar_url = formData.avatarUrl;
        updateData.avatar_seed = null;
      } else {
        updateData.avatar_url = null;
        updateData.avatar_seed = null;
      }
      
      // Add preferences
      updateData.preferences = preferences;
      
      // Update user profile
      const updatedProfile = await updateUserProfile(userProfile.id, updateData);
      
      // Update local state
      setUserProfile(updatedProfile);
      
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
      });
      
      // Close dialog
      onOpenChange(false);
    } catch (error) {
      logger.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update your profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [userProfile, formData, preferences, userEmail, onOpenChange, toast]);
  
  // Handle dialog close
  const handleCloseDialog = useCallback(() => {
    if (!isSaving && !isUploadingAvatar) {
      // Before closing, update localStorage and dispatch event with updated avatar
      try {
        // Update timestamp for storage event listeners
        localStorage.setItem('avatar_updated_at', Date.now().toString());
        
        // Save current avatar URL to localStorage for immediate access
        if (userProfile && formData.avatarUrl) {
          localStorage.setItem(`user_avatar_${userProfile.id}`, formData.avatarUrl);
          // logger.debug(`ProfileConfigDialog: Saved avatar URL to localStorage: ${formData.avatarUrl}`);
        }
        
        // Broadcast event with actual avatar URL for immediate update in other components
        const event = new CustomEvent('avatarUpdated', {
          detail: { 
            timestamp: Date.now(),
            avatarUrl: formData.avatarUrl,
            userId: userProfile?.id
          }
        });
        window.dispatchEvent(event);
        // logger.debug("ProfileConfigDialog: Dispatched avatarUpdated event with current avatar URL");
      } catch (e) {
        // logger.warn('Could not signal avatar update:', e);
      }
      
      // Now close the dialog
      onOpenChange(false);
    }
  }, [isSaving, isUploadingAvatar, onOpenChange, userProfile, formData.avatarUrl]);
  
  return (
    <PersistentDialog
      open={open}
      onOpenChange={open => {
        // Only allow closing when not in the middle of an operation
        if (!open && !isSaving && !isUploadingAvatar) {
          onOpenChange(false);
        }
      }}
      onExternalClick={handleCloseDialog}
    >
      <PersistentDialogContent 
        ref={dialogRef} 
        className="sm:max-w-md md:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        aria-labelledby="profile-dialog-title"
      >
        <DialogHeader>
          <div className="flex items-start gap-4">
            <Avatar className="w-18 h-18 border-2 border-primary/20">
              {isUploadingAvatar && (
                <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center z-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              <AvatarImage src={formData.avatarUrl} alt={formData.fullName || "User"} />
              <AvatarFallback>{formData.fullName ? formData.fullName.substring(0, 2).toUpperCase() : "U"}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle id="profile-dialog-title" className="text-xl">Profile Settings</DialogTitle>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="secondary" className="font-normal">
                  @{formData.username || userEmail.split('@')[0]}
                </Badge>
                <Badge variant="outline">
                  {userProfile?.role?.charAt(0).toUpperCase() + userProfile?.role?.slice(1) || 'User'}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>
        
        {!isDialogMounted || isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>
            
            {/* Profile Information Tab */}
            <TabsContent value="profile" className="flex-1 overflow-y-auto py-4 space-y-4">
              <div className="space-y-6">
                {/* Profile Photo Section */}
                <div className="space-y-2">
                  <h3 className="font-medium">Profile Photo</h3>
                  <div className="rounded-md border p-6 flex flex-col items-center gap-6">
                    <div className="relative group">
                      <Avatar className="w-36 h-36 border-4 border-primary/20 group-hover:border-primary/40 transition-all">
                        {isUploadingAvatar && (
                          <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center z-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        )}
                        <AvatarImage src={formData.avatarUrl} alt={formData.fullName || "User"} />
                        <AvatarFallback>{formData.fullName ? formData.fullName.substring(0, 2).toUpperCase() : "U"}</AvatarFallback>
                      </Avatar>
                      <button 
                        type="button" 
                        onClick={handleUploadClick}
                        className="absolute inset-0 rounded-full flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-all cursor-pointer"
                        disabled={isUploadingAvatar}
                        aria-label="Upload profile photo"
                        data-file-input-trigger="true"
                      >
                        <Camera className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                      <input 
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="hidden"
                        aria-label="Upload profile photo"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-sm">
                      <Button 
                        variant="secondary" 
                        className="w-full flex items-center justify-center"
                        onClick={handleUploadClick}
                        disabled={isUploadingAvatar}
                        data-file-input-trigger="true"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Photo
                      </Button>
                      <Button 
                        variant="secondary" 
                        className="w-full flex items-center justify-center"
                        onClick={handleGenerateRandomAvatar}
                        disabled={isUploadingAvatar}
                      >
                        <RefreshCcw className="h-4 w-4 mr-2" />
                        Reset to Initials
                      </Button>
                    </div>
                    
                    {userProfile?.avatar_url && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleRemoveAvatar}
                        className="flex items-center text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={isUploadingAvatar}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove Photo
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Personal Information Section */}
                <div className="space-y-2">
                  <h3 className="font-medium">Personal Information</h3>
                  <div className="rounded-md border p-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <div className="flex">
                          <div className="flex items-center bg-muted px-3 rounded-l-md border border-r-0 border-input">
                            <AtSign className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <Input 
                            id="username" 
                            value={formData.username}
                            onChange={(e) => handleInputChange('username', e.target.value)}
                            className="rounded-l-none"
                            placeholder="Enter username"
                            disabled={isSaving}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <div className="flex">
                          <div className="flex items-center bg-muted px-3 rounded-l-md border border-r-0 border-input">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <Input 
                            id="fullName" 
                            value={formData.fullName}
                            onChange={(e) => handleInputChange('fullName', e.target.value)}
                            className="rounded-l-none"
                            placeholder="Enter full name"
                            disabled={isSaving}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="flex">
                          <div className="flex items-center bg-muted px-3 rounded-l-md border border-r-0 border-input">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <Input 
                            id="email" 
                            value={userEmail}
                            disabled
                            className="rounded-l-none bg-muted"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">Contact Phone</Label>
                        <Input 
                          id="phone" 
                          value={formData.phoneNumber}
                          onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                          placeholder="Enter phone number"
                          disabled={isSaving}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium">Account Information</h3>
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
              </div>
            </TabsContent>
            
            {/* Preferences Tab */}
            <TabsContent value="preferences" className="flex-1 overflow-y-auto py-4 space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">Display Settings</h3>
                    <div className="rounded-md border p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Dark Mode</p>
                          <p className="text-sm text-muted-foreground">Use dark theme throughout the application</p>
                        </div>
                        <Switch 
                          checked={preferences.darkMode}
                          onCheckedChange={(checked) => handlePreferenceChange(['darkMode'], checked)}
                          disabled={isSaving}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <p className="font-medium mb-2">Calendar Default View</p>
                        <div className="flex flex-wrap gap-2">
                          {['month', 'week', 'day'].map((view) => (
                            <Button 
                              key={view}
                              variant={preferences.calendar.defaultView === view ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handlePreferenceChange(['calendar', 'defaultView'], view)}
                              disabled={isSaving}
                            >
                              {view.charAt(0).toUpperCase() + view.slice(1)}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <p className="font-medium mb-2">Week Starts On</p>
                        <div className="flex flex-wrap gap-2">
                          <Button 
                            variant={preferences.calendar.weekStartsOn === 0 ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handlePreferenceChange(['calendar', 'weekStartsOn'], 0)}
                            disabled={isSaving}
                          >
                            Sunday
                          </Button>
                          <Button 
                            variant={preferences.calendar.weekStartsOn === 1 ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handlePreferenceChange(['calendar', 'weekStartsOn'], 1)}
                            disabled={isSaving}
                          >
                            Monday
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Language & Region</h3>
                    <div className="rounded-md border p-4 space-y-4">
                      <div className="flex items-center gap-4">
                        <Languages className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium">Language</p>
                          <p className="text-sm text-muted-foreground">English (US)</p>
                        </div>
                        <Badge variant="outline">Default</Badge>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center gap-4">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium">Date Format</p>
                          <p className="text-sm text-muted-foreground">MM/DD/YYYY</p>
                        </div>
                        <Badge variant="outline">Default</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Notifications Tab */}
            <TabsContent value="notifications" className="flex-1 overflow-y-auto py-4 space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">Notification Settings</h3>
                    <div className="rounded-md border p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Email Notifications</p>
                          <p className="text-sm text-muted-foreground">Receive updates and alerts via email</p>
                        </div>
                        <Switch 
                          checked={preferences.notifications.email}
                          onCheckedChange={(checked) => handlePreferenceChange(['notifications', 'email'], checked)}
                          disabled={isSaving}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Push Notifications</p>
                          <p className="text-sm text-muted-foreground">Receive in-app and browser notifications</p>
                        </div>
                        <Switch 
                          checked={preferences.notifications.push}
                          onCheckedChange={(checked) => handlePreferenceChange(['notifications', 'push'], checked)}
                          disabled={isSaving}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Project Reminders</p>
                          <p className="text-sm text-muted-foreground">Receive reminders about upcoming projects</p>
                        </div>
                        <Switch 
                          checked={preferences.notifications.projectReminders}
                          onCheckedChange={(checked) => handlePreferenceChange(['notifications', 'projectReminders'], checked)}
                          disabled={isSaving}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Notification Channels</h3>
                    <div className="rounded-md border p-4 space-y-4">
                      <div className="flex items-center gap-4">
                        <BellRing className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium">WhatsApp</p>
                          <p className="text-sm text-muted-foreground">Connect WhatsApp for instant notifications</p>
                        </div>
                        <Button variant="outline" size="sm" disabled>Coming Soon</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleCloseDialog}
            disabled={isSaving || isUploadingAvatar}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button 
            onClick={handleSaveProfile}
            disabled={isSaving || isLoading || isUploadingAvatar}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </PersistentDialogContent>
    </PersistentDialog>
  );
}