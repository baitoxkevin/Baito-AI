import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import AdminAnnouncementBroadcast from '../../components/AdminAnnouncementBroadcast';

export default function AdminNotificationsPage() {
  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 p-4">
        <View className="mb-4">
          <Text className="text-2xl font-bold mb-2">Notifications</Text>
          <Text className="text-gray-600">Send announcements and view notification history</Text>
        </View>

        <AdminAnnouncementBroadcast />

        <View className="mt-6 bg-white rounded-lg p-6 shadow-sm">
          <Text className="text-lg font-bold mb-4">Notification Types</Text>

          <View className="space-y-3">
            <View className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Text className="font-semibold text-blue-900 mb-1">📅 Shift Reminders</Text>
              <Text className="text-blue-700 text-sm">
                Automatically sent 1 hour before shift starts when worker applies to a gig
              </Text>
            </View>

            <View className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mt-3">
              <Text className="font-semibold text-yellow-900 mb-1">🏆 Achievement Unlocks</Text>
              <Text className="text-yellow-700 text-sm">
                Automatically sent when workers earn achievements (First Shift, Week Warrior, etc.)
              </Text>
            </View>

            <View className="p-4 bg-purple-50 border border-purple-200 rounded-lg mt-3">
              <Text className="font-semibold text-purple-900 mb-1">📢 Admin Announcements</Text>
              <Text className="text-purple-700 text-sm">
                Manually broadcast important messages to all users using the form above
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-6 bg-white rounded-lg p-6 shadow-sm">
          <Text className="text-lg font-bold mb-4">How It Works</Text>

          <View className="space-y-3">
            <View className="flex-row">
              <Text className="text-blue-500 font-bold mr-2">1.</Text>
              <Text className="flex-1 text-gray-700">
                Workers receive notifications on their devices when registered
              </Text>
            </View>

            <View className="flex-row mt-2">
              <Text className="text-blue-500 font-bold mr-2">2.</Text>
              <Text className="flex-1 text-gray-700">
                Notifications are stored in the database for viewing later
              </Text>
            </View>

            <View className="flex-row mt-2">
              <Text className="text-blue-500 font-bold mr-2">3.</Text>
              <Text className="flex-1 text-gray-700">
                Real-time delivery ensures instant communication with your team
              </Text>
            </View>
          </View>
        </View>

        {/* Spacer for bottom padding */}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
