import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import Constants from 'expo-constants';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
}

class NotificationService {
  private expoPushToken: string | null = null;

  /**
   * Register for push notifications and store token
   */
  async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

      this.expoPushToken = token;

      // Store token in database
      await this.storePushToken(token);

      // Configure channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return token;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Store push token in database
   */
  private async storePushToken(token: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('No authenticated user');
      }

      const deviceType = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

      // Upsert push token
      const { error } = await supabase
        .from('push_tokens')
        .upsert({
          user_id: user.id,
          token,
          device_type: deviceType,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'token'
        });

      if (error) {
        console.error('Error storing push token:', error);
      }
    } catch (error) {
      console.error('Error in storePushToken:', error);
    }
  }

  /**
   * Send a push notification (server-side function)
   */
  async sendNotification(
    userId: string,
    notification: NotificationData
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('send_notification', {
        p_user_id: userId,
        p_title: notification.title,
        p_body: notification.body,
        p_type: notification.data?.type || 'general',
        p_data: notification.data || {},
      });

      if (error) {
        console.error('Error sending notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in sendNotification:', error);
      return false;
    }
  }

  /**
   * Broadcast announcement to all users (admin only)
   */
  async broadcastAnnouncement(
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<number> {
    try {
      const { data: result, error } = await supabase.rpc('broadcast_announcement', {
        p_title: title,
        p_body: body,
        p_data: data || {},
      });

      if (error) {
        console.error('Error broadcasting announcement:', error);
        return 0;
      }

      return result as number;
    } catch (error) {
      console.error('Error in broadcastAnnouncement:', error);
      return 0;
    }
  }

  /**
   * Schedule shift reminder notification
   */
  async scheduleShiftReminder(
    projectId: string,
    candidateId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('schedule_shift_reminders', {
        p_project_id: projectId,
        p_candidate_id: candidateId,
      });

      if (error) {
        console.error('Error scheduling shift reminder:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in scheduleShiftReminder:', error);
      return false;
    }
  }

  /**
   * Get notifications for current user
   */
  async getNotifications(limit: number = 20): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getNotifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in markAsRead:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return false;
      }

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      return false;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return 0;
      }

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        console.error('Error getting unread count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getUnreadCount:', error);
      return 0;
    }
  }

  /**
   * Setup notification listeners
   */
  setupNotificationListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationTapped?: (response: Notifications.NotificationResponse) => void
  ) {
    // Listen for notifications received while app is in foreground
    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
      onNotificationReceived?.(notification);
    });

    // Listen for notification taps
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response);
      onNotificationTapped?.(response);
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }

  /**
   * Send local notification (for testing or immediate alerts)
   */
  async sendLocalNotification(notification: NotificationData): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
        },
        trigger: null, // Send immediately
      });

      return notificationId;
    } catch (error) {
      console.error('Error sending local notification:', error);
      throw error;
    }
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Get Expo push token
   */
  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }
}

export const notificationService = new NotificationService();
