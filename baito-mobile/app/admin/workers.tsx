import { View, Text } from 'react-native';

export default function AdminWorkers() {
  return (
    <View className="flex-1 bg-gray-50 p-4">
      <Text className="text-2xl font-bold mb-4">Workers</Text>
      <View className="bg-white rounded-lg p-6 items-center">
        <Text className="text-gray-500">No workers yet</Text>
        <Text className="text-sm text-gray-400 mt-2">Workers will appear here once they register</Text>
      </View>
    </View>
  );
}
