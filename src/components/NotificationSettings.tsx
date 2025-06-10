import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Bell, BellOff } from 'lucide-react';
import { notificationService } from '@/lib/notification-service';
import { getUser } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export function NotificationSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [ccOnAllProjects, setCcOnAllProjects] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setIsLoading(true);
    try {
      const user = await getUser();
      if (!user) throw new Error('User not found');

      const preferences = await notificationService.getUserPreferences(user.id);
      setEmailNotifications(preferences.emailNotifications);
      setCcOnAllProjects(preferences.ccOnAllProjects);
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notification preferences',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async () => {
    setIsSaving(true);
    try {
      const user = await getUser();
      if (!user) throw new Error('User not found');

      await notificationService.updateUserPreferences(user.id, {
        emailNotifications,
        ccOnAllProjects
      });

      toast({
        title: 'Success',
        description: 'Notification preferences saved successfully'
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to save notification preferences',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Notification Settings
        </CardTitle>
        <CardDescription>
          Configure how you receive notifications about project updates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between space-x-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor="email-notifications" className="flex items-center gap-2">
                {emailNotifications ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                Email Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive email notifications for project updates
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor="cc-all-projects" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                CC on All Projects
              </Label>
              <p className="text-sm text-muted-foreground">
                Always receive a copy of notifications for projects where you're the person in charge
              </p>
            </div>
            <Switch
              id="cc-all-projects"
              checked={ccOnAllProjects}
              onCheckedChange={setCcOnAllProjects}
              disabled={!emailNotifications}
            />
          </div>
        </div>

        <div className="pt-4 border-t">
          <Button 
            onClick={savePreferences} 
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Preferences'
            )}
          </Button>
        </div>

        <div className="pt-4 border-t">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
              How Email Notifications Work
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
              <li>• Clients receive notifications when projects are created or updated</li>
              <li>• People in charge are CC'd on all project-related emails</li>
              <li>• Notifications include details about what changed</li>
              <li>• Email delivery may take a few minutes</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}