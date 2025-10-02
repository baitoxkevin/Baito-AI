import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Bell, Check, CheckCheck, Trophy, Calendar, Megaphone } from 'lucide-react-native';
import { notificationService } from '../lib/notification-service';
import { supabase } from '../lib/supabase';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'shift_reminder' | 'achievement' | 'announcement' | 'general';
  read: boolean;
  data: any;
  created_at: string;
}

export default function NotificationsList() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    setupRealtimeSubscription();
  }, []);

  const fetchNotifications = async () => {
    const data = await notificationService.getNotifications(50);
    setNotifications(data);
  };

  const fetchUnreadCount = async () => {
    const count = await notificationService.getUnreadCount();
    setUnreadCount(count);
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('notifications-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
      }, () => {
        fetchNotifications();
        fetchUnreadCount();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    await fetchUnreadCount();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await notificationService.markAsRead(notificationId);
    fetchNotifications();
    fetchUnreadCount();
  };

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead();
    fetchNotifications();
    fetchUnreadCount();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'achievement':
        return <Trophy size={20} color="#FFD700" />;
      case 'shift_reminder':
        return <Calendar size={20} color="#3B82F6" />;
      case 'announcement':
        return <Megaphone size={20} color="#F59E0B" />;
      default:
        return <Bell size={20} color="#6B7280" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Bell size={24} color="#1F2937" />
            <Text className="text-xl font-bold ml-2">Notifications</Text>
            {unreadCount > 0 && (
              <View className="bg-red-500 rounded-full px-2 py-0.5 ml-2">
                <Text className="text-white text-xs font-bold">{unreadCount}</Text>
              </View>
            )}
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={handleMarkAllAsRead}
              className="flex-row items-center px-3 py-1.5 bg-blue-500 rounded-lg"
            >
              <CheckCheck size={16} color="white" />
              <Text className="text-white text-sm font-medium ml-1">Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Notifications List */}
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        className="flex-1"
      >
        {notifications.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Bell size={48} color="#D1D5DB" />
            <Text className="text-gray-400 text-lg mt-4">No notifications yet</Text>
            <Text className="text-gray-400 text-sm mt-1">We'll notify you when something happens</Text>
          </View>
        ) : (
          <View className="px-4 py-2">
            {notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                onPress={() => !notification.read && handleMarkAsRead(notification.id)}
                className={`bg-white rounded-lg p-4 mb-2 border ${
                  notification.read ? 'border-gray-200' : 'border-blue-300 bg-blue-50'
                }`}
              >
                <View className="flex-row items-start">
                  <View className="mr-3 mt-0.5">
                    {getIcon(notification.type)}
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className={`text-sm font-semibold ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                        {notification.title}
                      </Text>
                      {!notification.read && (
                        <View className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </View>
                    <Text className={`text-sm ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
                      {notification.body}
                    </Text>
                    <Text className="text-xs text-gray-400 mt-2">
                      {formatTime(notification.created_at)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
