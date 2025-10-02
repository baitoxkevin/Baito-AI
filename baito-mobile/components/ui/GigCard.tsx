import React from 'react';
import { View, Text, TouchableOpacity, Pressable } from 'react-native';
import { MapPin, DollarSign, Calendar, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';

interface GigCardProps {
  id: string;
  title: string;
  company?: string;
  location: string;
  payRate: string;
  date: string;
  jobType?: string;
  tags?: string[];
  onApply: (id: string) => void;
}

export function GigCard({
  id,
  title,
  company,
  location,
  payRate,
  date,
  jobType = 'Full-time',
  tags = [],
  onApply,
}: GigCardProps) {
  return (
    <Pressable
      className="bg-white rounded-lg border border-gray-200 p-4 mb-3 shadow-sm active:bg-gray-50"
      onPress={() => router.push(`/worker/gig/${id}`)}
    >
      {/* Header */}
      <View className="mb-3 flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900 mb-1">{title}</Text>
          {company && <Text className="text-sm text-gray-600">{company}</Text>}
        </View>
        <ChevronRight size={20} color="#9ca3af" />
      </View>

      {/* Info Grid */}
      <View className="space-y-2 mb-3">
        {/* Location */}
        <View className="flex-row items-center">
          <MapPin size={16} color="#6b7280" />
          <Text className="text-sm text-gray-600 ml-2">{location}</Text>
        </View>

        {/* Pay Rate */}
        <View className="flex-row items-center">
          <DollarSign size={16} color="#6b7280" />
          <Text className="text-sm text-gray-600 ml-2">{payRate}</Text>
        </View>

        {/* Date */}
        <View className="flex-row items-center">
          <Calendar size={16} color="#6b7280" />
          <Text className="text-sm text-gray-600 ml-2">{date}</Text>
        </View>
      </View>

      {/* Job Type Badge */}
      <View className="mb-3">
        <View className="bg-blue-100 px-3 py-1 rounded-full self-start">
          <Text className="text-xs font-medium text-blue-700">{jobType}</Text>
        </View>
      </View>

      {/* Tags */}
      {tags.length > 0 && (
        <View className="flex-row flex-wrap mb-3">
          {tags.slice(0, 3).map((tag, index) => (
            <View key={index} className="bg-gray-100 px-2 py-1 rounded mr-2 mb-1">
              <Text className="text-xs text-gray-600">{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Apply Button */}
      <TouchableOpacity
        className="bg-blue-600 rounded-lg py-3 items-center"
        onPress={(e) => {
          e.stopPropagation();
          onApply(id);
        }}
        activeOpacity={0.8}
      >
        <Text className="text-white font-semibold">Apply Now</Text>
      </TouchableOpacity>
    </Pressable>
  );
}
