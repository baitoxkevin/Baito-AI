import { View, Text } from 'react-native';

export default function AdminProjects() {
  return (
    <View className="flex-1 bg-gray-50 p-4">
      <Text className="text-2xl font-bold mb-4">Projects</Text>
      <View className="bg-white rounded-lg p-6 items-center">
        <Text className="text-gray-500">No projects yet</Text>
        <Text className="text-sm text-gray-400 mt-2">Create your first project to get started</Text>
      </View>
    </View>
  );
}
