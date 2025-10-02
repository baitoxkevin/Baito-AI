import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Megaphone, Send } from 'lucide-react-native';
import { notificationService } from '../lib/notification-service';

export default function AdminAnnouncementBroadcast() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBroadcast = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Error', 'Please enter both title and message');
      return;
    }

    Alert.alert(
      'Confirm Broadcast',
      'This will send a notification to ALL users. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Send',
          style: 'default',
          onPress: async () => {
            setLoading(true);
            try {
              const count = await notificationService.broadcastAnnouncement(
                title,
                body,
                { timestamp: new Date().toISOString() }
              );

              Alert.alert(
                'Success',
                `Announcement sent to ${count} user${count !== 1 ? 's' : ''}`,
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      setTitle('');
                      setBody('');
                    },
                  },
                ]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to send announcement');
              console.error(error);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View className="bg-white rounded-lg p-6 shadow-sm">
      <View className="flex-row items-center mb-6">
        <Megaphone size={24} color="#F59E0B" />
        <Text className="text-xl font-bold ml-2">Broadcast Announcement</Text>
      </View>

      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g., Important Update"
          className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
          editable={!loading}
        />
      </View>

      <View className="mb-6">
        <Text className="text-sm font-medium text-gray-700 mb-2">Message</Text>
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="Enter your announcement message..."
          multiline
          numberOfLines={4}
          className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
          style={{ minHeight: 100, textAlignVertical: 'top' }}
          editable={!loading}
        />
      </View>

      <TouchableOpacity
        onPress={handleBroadcast}
        disabled={loading || !title.trim() || !body.trim()}
        className={`flex-row items-center justify-center py-4 rounded-lg ${
          loading || !title.trim() || !body.trim() ? 'bg-gray-300' : 'bg-blue-500'
        }`}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <Send size={20} color="white" />
            <Text className="text-white font-semibold text-base ml-2">
              Send to All Users
            </Text>
          </>
        )}
      </TouchableOpacity>

      <View className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <Text className="text-yellow-800 text-sm">
          <Text className="font-semibold">Note:</Text> This will send a push notification to all registered users immediately.
        </Text>
      </View>
    </View>
  );
}
