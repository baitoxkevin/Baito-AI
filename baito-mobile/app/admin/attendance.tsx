import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';
import { UserCheck, UserX, Clock, MapPin } from 'lucide-react-native';
import { router } from 'expo-router';

interface AttendanceRecord {
  id: string;
  candidate_id: string;
  project_id: string;
  check_in_time: string;
  check_out_time?: string;
  total_hours?: number;
  status: 'checked_in' | 'checked_out' | 'pending_approval';
  check_in_lat?: number;
  check_in_lng?: number;
  check_out_lat?: number;
  check_out_lng?: number;
  candidates?: {
    name: string;
    email: string;
  };
  projects?: {
    title: string;
  };
}

export default function AttendanceDashboard() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'checked_in' | 'checked_out'>('all');

  const fetchAttendance = async () => {
    try {
      let query = supabase
        .from('attendance')
        .select(`
          *,
          candidates (name, email),
          projects (title)
        `)
        .order('check_in_time', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setAttendance(data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAttendance();

    // Set up real-time subscription
    const channel = supabase
      .channel('attendance-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'attendance',
      }, (payload) => {
        setAttendance(prev => [payload.new as AttendanceRecord, ...prev]);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'attendance',
      }, (payload) => {
        setAttendance(prev => prev.map(record =>
          record.id === payload.new.id ? payload.new as AttendanceRecord : record
        ));
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [filter]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAttendance();
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-MY', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-MY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'checked_in':
        return 'bg-green-100 text-green-700';
      case 'checked_out':
        return 'bg-gray-100 text-gray-700';
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'checked_in':
        return <UserCheck size={16} color="#15803d" />;
      case 'checked_out':
        return <UserX size={16} color="#6b7280" />;
      default:
        return <Clock size={16} color="#a16207" />;
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-600">Loading attendance...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-blue-600 px-4 pt-12 pb-4">
        <Text className="text-2xl font-bold text-white">Live Attendance</Text>
        <Text className="text-blue-100 mt-1">Real-time tracking</Text>
      </View>

      {/* Filter Tabs */}
      <View className="bg-white border-b border-gray-200 px-4 py-3 flex-row space-x-2">
        <TouchableOpacity
          onPress={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-600' : 'bg-gray-100'}`}
        >
          <Text className={`font-medium ${filter === 'all' ? 'text-white' : 'text-gray-600'}`}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFilter('checked_in')}
          className={`px-4 py-2 rounded-lg ${filter === 'checked_in' ? 'bg-green-600' : 'bg-gray-100'}`}
        >
          <Text className={`font-medium ${filter === 'checked_in' ? 'text-white' : 'text-gray-600'}`}>
            Checked In
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFilter('checked_out')}
          className={`px-4 py-2 rounded-lg ${filter === 'checked_out' ? 'bg-gray-600' : 'bg-gray-100'}`}
        >
          <Text className={`font-medium ${filter === 'checked_out' ? 'text-white' : 'text-gray-600'}`}>
            Checked Out
          </Text>
        </TouchableOpacity>
      </View>

      {/* Attendance List */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {attendance.length === 0 ? (
          <View className="bg-white rounded-lg p-6 items-center">
            <Text className="text-lg text-gray-500">No attendance records</Text>
            <Text className="text-sm text-gray-400 mt-2">
              Records will appear here in real-time
            </Text>
          </View>
        ) : (
          attendance.map((record) => (
            <View key={record.id} className="bg-white rounded-lg p-4 mb-3 shadow-sm">
              {/* Header */}
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-900">
                    {record.candidates?.name || 'Unknown'}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    {record.projects?.title || 'Unknown Project'}
                  </Text>
                </View>
                <View className={`px-3 py-1 rounded-full flex-row items-center ${getStatusColor(record.status)}`}>
                  {getStatusIcon(record.status)}
                  <Text className="text-xs font-medium ml-1">
                    {record.status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Check In Info */}
              <View className="space-y-2">
                <View className="flex-row items-center">
                  <Clock size={14} color="#6b7280" />
                  <Text className="text-sm text-gray-700 ml-2">
                    In: {formatTime(record.check_in_time)} • {formatDate(record.check_in_time)}
                  </Text>
                </View>

                {record.check_out_time && (
                  <View className="flex-row items-center">
                    <Clock size={14} color="#6b7280" />
                    <Text className="text-sm text-gray-700 ml-2">
                      Out: {formatTime(record.check_out_time)} • {formatDate(record.check_out_time)}
                    </Text>
                  </View>
                )}

                {record.total_hours && (
                  <View className="bg-blue-50 px-3 py-2 rounded-lg">
                    <Text className="text-sm font-semibold text-blue-700">
                      Total Hours: {record.total_hours.toFixed(2)} hrs
                    </Text>
                  </View>
                )}

                {/* Location Info */}
                {(record.check_in_lat && record.check_in_lng) && (
                  <View className="flex-row items-center">
                    <MapPin size={14} color="#6b7280" />
                    <Text className="text-xs text-gray-500 ml-2">
                      Location verified: {record.check_in_lat.toFixed(4)}, {record.check_in_lng.toFixed(4)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
