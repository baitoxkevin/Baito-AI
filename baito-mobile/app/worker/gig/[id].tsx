import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { ClockInButton } from '../../../components/ClockInButton';
import { MapPin, Calendar, Clock, DollarSign, Users, ArrowLeft } from 'lucide-react-native';

interface GigDetail {
  id: string;
  title: string;
  company_name?: string;
  venue_address: string;
  venue_lat?: number;
  venue_lng?: number;
  crew_count: number;
  filled_positions?: number;
  start_date: string;
  end_date?: string;
  working_hours_start?: string;
  working_hours_end?: string;
  status: string;
  project_type?: string;
  description?: string;
}

export default function GigDetailScreen() {
  const { id } = useLocalSearchParams();
  const [gig, setGig] = useState<GigDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    fetchGigDetails();
    checkApplicationStatus();
  }, [id]);

  const fetchGigDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setGig(data);
    } catch (error) {
      console.error('Error fetching gig details:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkApplicationStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('project_applications')
        .select('id')
        .eq('project_id', id)
        .eq('candidate_id', user.id)
        .single();

      setHasApplied(!!data);
    } catch (error) {
      console.error('Error checking application status:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-MY', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateRange = () => {
    if (!gig) return '';
    const start = formatDate(gig.start_date);
    if (gig.end_date) {
      const end = formatDate(gig.end_date);
      return `${start} - ${end}`;
    }
    return start;
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!gig) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-gray-600">Gig not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header with Back Button */}
      <View className="bg-blue-600 px-4 pt-12 pb-6">
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center mb-4"
        >
          <ArrowLeft size={24} color="white" />
          <Text className="text-white ml-2 text-base">Back</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-white">{gig.title}</Text>
        {gig.company_name && (
          <Text className="text-blue-100 mt-1">{gig.company_name}</Text>
        )}
      </View>

      <ScrollView className="flex-1">
        <View className="p-4 space-y-6">
          {/* Info Cards */}
          <View className="space-y-3">
            {/* Location */}
            <View className="flex-row items-start bg-gray-50 p-3 rounded-lg">
              <MapPin size={20} color="#6b7280" className="mt-0.5" />
              <View className="ml-3 flex-1">
                <Text className="text-sm font-medium text-gray-700">Location</Text>
                <Text className="text-base text-gray-900 mt-1">{gig.venue_address}</Text>
              </View>
            </View>

            {/* Date */}
            <View className="flex-row items-start bg-gray-50 p-3 rounded-lg">
              <Calendar size={20} color="#6b7280" className="mt-0.5" />
              <View className="ml-3 flex-1">
                <Text className="text-sm font-medium text-gray-700">Date</Text>
                <Text className="text-base text-gray-900 mt-1">{formatDateRange()}</Text>
              </View>
            </View>

            {/* Working Hours */}
            {gig.working_hours_start && gig.working_hours_end && (
              <View className="flex-row items-start bg-gray-50 p-3 rounded-lg">
                <Clock size={20} color="#6b7280" className="mt-0.5" />
                <View className="ml-3 flex-1">
                  <Text className="text-sm font-medium text-gray-700">Working Hours</Text>
                  <Text className="text-base text-gray-900 mt-1">
                    {gig.working_hours_start} - {gig.working_hours_end}
                  </Text>
                </View>
              </View>
            )}

            {/* Pay Rate */}
            <View className="flex-row items-start bg-gray-50 p-3 rounded-lg">
              <DollarSign size={20} color="#6b7280" className="mt-0.5" />
              <View className="ml-3 flex-1">
                <Text className="text-sm font-medium text-gray-700">Pay Rate</Text>
                <Text className="text-base text-gray-900 mt-1">RM {gig.crew_count}/day</Text>
              </View>
            </View>

            {/* Positions */}
            <View className="flex-row items-start bg-gray-50 p-3 rounded-lg">
              <Users size={20} color="#6b7280" className="mt-0.5" />
              <View className="ml-3 flex-1">
                <Text className="text-sm font-medium text-gray-700">Positions</Text>
                <Text className="text-base text-gray-900 mt-1">
                  {gig.filled_positions || 0} / {gig.crew_count} filled
                </Text>
              </View>
            </View>
          </View>

          {/* Description */}
          {gig.description && (
            <View>
              <Text className="text-lg font-semibold text-gray-900 mb-2">Description</Text>
              <Text className="text-base text-gray-700 leading-6">{gig.description}</Text>
            </View>
          )}

          {/* Clock In/Out Section (only if applied/accepted) */}
          {hasApplied && (
            <View className="mt-4">
              <Text className="text-lg font-semibold text-gray-900 mb-3">Attendance</Text>
              <ClockInButton
                projectId={gig.id}
                projectTitle={gig.title}
                onSuccess={() => {
                  // Could refresh attendance data here
                }}
              />
            </View>
          )}

          {/* Application Status */}
          <View className="mt-4 mb-8">
            {hasApplied ? (
              <View className="bg-green-50 border border-green-200 rounded-lg p-4">
                <Text className="text-green-700 font-medium text-center">
                  ✓ You have applied for this gig
                </Text>
              </View>
            ) : (
              <Text className="text-gray-500 text-center">
                Apply for this gig to access clock-in features
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
