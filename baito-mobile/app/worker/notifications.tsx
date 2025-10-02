import React, { useEffect } from 'react';
import { View } from 'react-native';
import NotificationsList from '../../components/NotificationsList';
import { notificationService } from '../../lib/notification-service';
import { useRouter } from 'expo-router';

export default function NotificationsPage() {
  const router = useRouter();

  useEffect(() => {
    // Register for push notifications when component mounts
    registerPushNotifications();

    // Setup notification listeners
    const cleanup = notificationService.setupNotificationListeners(
      (notification) => {
        console.log('Notification received in foreground:', notification);
      },
      (response) => {
        console.log('Notification tapped:', response);

        // Handle navigation based on notification type
        const { type, project_id, achievement_id } = response.notification.request.content.data;

        if (type === 'shift_reminder' && project_id) {
          router.push(`/worker/gig/${project_id}`);
        } else if (type === 'achievement' && achievement_id) {
          router.push('/worker/profile');
        }
      }
    );

    return cleanup;
  }, []);

  const registerPushNotifications = async () => {
    try {
      const token = await notificationService.registerForPushNotifications();
      if (token) {
        console.log('Push token registered:', token);
      }
    } catch (error) {
      console.error('Error registering push notifications:', error);
    }
  };

  return (
    <View className="flex-1">
      <NotificationsList />
    </View>
  );
}
