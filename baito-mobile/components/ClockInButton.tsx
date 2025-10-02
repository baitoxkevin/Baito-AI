import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import { MapPin, Clock } from 'lucide-react-native';
import { SelfieCamera } from './SelfieCamera';

interface ClockInButtonProps {
  projectId: string;
  projectTitle: string;
  onSuccess?: () => void;
}

export function ClockInButton({ projectId, projectTitle, onSuccess }: ClockInButtonProps) {
  const [loading, setLoading] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [currentAttendanceId, setCurrentAttendanceId] = useState<string | null>(null);

  const handleClockIn = async () => {
    setLoading(true);
    try {
      // 1. Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to clock in');
        setLoading(false);
        return;
      }

      // 2. Get current location with high accuracy (±10m)
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const userLat = location.coords.latitude;
      const userLng = location.coords.longitude;

      // 3. Validate geofence (100m radius)
      const { data: isValid, error: geofenceError } = await supabase.rpc('validate_geofence', {
        user_lat: userLat,
        user_lng: userLng,
        p_project_id: projectId,
        radius_meters: 100,
      });

      if (geofenceError) {
        console.error('Geofence validation error:', geofenceError);
        // If geofence function doesn't exist, allow check-in (dev mode)
        if (geofenceError.code === '42883') {
          console.warn('Geofence function not found - allowing check-in in dev mode');
        } else {
          throw geofenceError;
        }
      }

      if (isValid === false) {
        Alert.alert(
          'Too Far from Job Site',
          'You must be within 100 meters of the job site to clock in.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }

      // 4. Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please login to clock in');
        setLoading(false);
        return;
      }

      // 5. Record check-in
      const { data: attendanceData, error: insertError } = await supabase.from('attendance').insert({
        project_id: projectId,
        candidate_id: user.id,
        check_in_time: new Date().toISOString(),
        check_in_lat: userLat,
        check_in_lng: userLng,
        status: 'checked_in',
      }).select().single();

      if (insertError) throw insertError;

      setIsCheckedIn(true);
      setCurrentAttendanceId(attendanceData.id);
      Alert.alert('Success', `Checked in to ${projectTitle}! Now take your selfie.`);
      onSuccess?.();
    } catch (error: any) {
      console.error('Clock in error:', error);
      Alert.alert('Error', error.message || 'Failed to clock in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    setLoading(true);
    try {
      // 1. Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to clock out');
        setLoading(false);
        return;
      }

      // 2. Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const userLat = location.coords.latitude;
      const userLng = location.coords.longitude;

      // 3. Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please login to clock out');
        setLoading(false);
        return;
      }

      // 4. Find active check-in record
      const { data: activeAttendance, error: findError } = await supabase
        .from('attendance')
        .select('id')
        .eq('project_id', projectId)
        .eq('candidate_id', user.id)
        .eq('status', 'checked_in')
        .order('check_in_time', { ascending: false })
        .limit(1)
        .single();

      if (findError) throw findError;

      if (!activeAttendance) {
        Alert.alert('Error', 'No active check-in found');
        setLoading(false);
        return;
      }

      // 5. Update with check-out info (trigger will calculate hours)
      const { error: updateError } = await supabase
        .from('attendance')
        .update({
          check_out_time: new Date().toISOString(),
          check_out_lat: userLat,
          check_out_lng: userLng,
          status: 'checked_out',
        })
        .eq('id', activeAttendance.id);

      if (updateError) throw updateError;

      setIsCheckedIn(false);
      Alert.alert('Success', `Checked out from ${projectTitle}!`);
      onSuccess?.();
    } catch (error: any) {
      console.error('Clock out error:', error);
      Alert.alert('Error', error.message || 'Failed to clock out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="space-y-3">
      {!isCheckedIn ? (
        <>
          <TouchableOpacity
            className="bg-green-600 rounded-lg py-4 px-6 items-center flex-row justify-center"
            onPress={handleClockIn}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <MapPin size={20} color="white" />
                <Text className="text-white font-semibold text-lg ml-2">Clock In</Text>
              </>
            )}
          </TouchableOpacity>
          <Text className="text-xs text-gray-500 text-center">
            You must be within 100m of the job site to clock in
          </Text>
        </>
      ) : (
        <>
          {/* Selfie Camera for Check-In */}
          {currentAttendanceId && (
            <View className="mb-2">
              <SelfieCamera
                attendanceId={currentAttendanceId}
                isCheckIn={true}
                onPhotoTaken={() => {
                  console.log('Check-in selfie captured');
                }}
              />
            </View>
          )}

          {/* Clock Out Button */}
          <TouchableOpacity
            className="bg-red-600 rounded-lg py-4 px-6 items-center flex-row justify-center"
            onPress={handleClockOut}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Clock size={20} color="white" />
                <Text className="text-white font-semibold text-lg ml-2">Clock Out</Text>
              </>
            )}
          </TouchableOpacity>

          <Text className="text-xs text-gray-500 text-center">
            Take your check-in selfie, then clock out when done
          </Text>
        </>
      )}
    </View>
  );
}
