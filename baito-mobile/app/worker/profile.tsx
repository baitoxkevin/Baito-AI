import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function WorkerProfile() {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/auth/login');
  };

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <View className="bg-white rounded-lg p-6 mb-4">
        <Text className="text-2xl font-bold mb-2">Profile</Text>
        <Text className="text-gray-600">Worker Dashboard</Text>
      </View>

      <TouchableOpacity
        className="bg-red-500 rounded-lg py-3"
        onPress={handleLogout}
      >
        <Text className="text-white text-center font-semibold">Logout</Text>
      </TouchableOpacity>
    </View>
  );
}
