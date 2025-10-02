import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import { MapPin, Clock, Coins } from 'lucide-react-native';
import { SelfieCamera } from './SelfieCamera';
import { PointsDisplay } from './PointsDisplay';
import { AchievementBadge } from './AchievementBadge';

interface ClockInButtonWithPointsProps {
  projectId: string;
  projectTitle: string;
  onSuccess?: () => void;
}

export function ClockInButtonWithPoints({ projectId, projectTitle, onSuccess }: ClockInButtonWithPointsProps) {
  const [loading, setLoading] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [currentAttendanceId, setCurrentAttendanceId] = useState<string | null>(null);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);

  useEffect(() => {
    // Get current user ID
    getCurrentUser();
    // Check if already checked in
    checkExistingCheckIn();
  }, [projectId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCandidateId(user.id);
    }
  };

  const checkExistingCheckIn = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('project_id', projectId)
        .eq('candidate_id', user.id)
        .eq('status', 'checked_in')
        .order('check_in_time', { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        setIsCheckedIn(true);
        setCurrentAttendanceId(data.id);
        setCheckInTime(new Date(data.check_in_time));
      }
    } catch (error) {
      // No active check-in found
      console.log('No active check-in found');
    }
  };

  const awardPoints = async (candidateId: string, points: number, reason: string, attendanceId?: string) => {
    try {
      const { data, error } = await supabase.rpc('award_points', {
        p_candidate_id: candidateId,
        p_points: points,
        p_reason: reason,
        p_project_id: projectId,
        p_attendance_id: attendanceId,
      });

      if (error) {
        console.error('Error awarding points:', error);
      } else {
        console.log(`Awarded ${points} points for ${reason}`);
      }
    } catch (error) {
      console.error('Failed to award points:', error);
    }
  };

  const checkShiftAchievements = async (candidateId: string) => {
    try {
      await supabase.rpc('check_shift_achievements', {
        p_candidate_id: candidateId,
      });
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  const calculateOnTimeBonus = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // Award on-time bonus if checking in within first 15 minutes of the hour
    if (minutes <= 15) {
      return 5; // On-time bonus
    }
    return 0;
  };

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
      const checkInDate = new Date();
      const { data: attendanceData, error: insertError } = await supabase.from('attendance').insert({
        project_id: projectId,
        candidate_id: user.id,
        check_in_time: checkInDate.toISOString(),
        check_in_lat: userLat,
        check_in_lng: userLng,
        status: 'checked_in',
      }).select().single();

      if (insertError) throw insertError;

      setIsCheckedIn(true);
      setCurrentAttendanceId(attendanceData.id);
      setCheckInTime(checkInDate);
      setCandidateId(user.id);

      // 6. Award points for check-in
      await awardPoints(user.id, 10, 'Check-in completed', attendanceData.id);

      // Award on-time bonus if applicable
      const onTimeBonus = calculateOnTimeBonus();
      if (onTimeBonus > 0) {
        await awardPoints(user.id, onTimeBonus, 'On-time bonus', attendanceData.id);
      }

      // Show success with points earned
      const totalPoints = 10 + onTimeBonus;
      Alert.alert(
        '✅ Checked In Successfully!',
        `You earned ${totalPoints} points!\n${onTimeBonus > 0 ? '⏰ Including on-time bonus!' : ''}\n\n📸 Now take your selfie.`,
        [{ text: 'Great!' }]
      );

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
        .select('*')
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
      const checkOutDate = new Date();
      const { data: updatedAttendance, error: updateError } = await supabase
        .from('attendance')
        .update({
          check_out_time: checkOutDate.toISOString(),
          check_out_lat: userLat,
          check_out_lng: userLng,
          status: 'checked_out',
        })
        .eq('id', activeAttendance.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // 6. Award points for check-out
      await awardPoints(user.id, 20, 'Check-out completed', activeAttendance.id);

      // Calculate total hours worked
      const hoursWorked = updatedAttendance.total_hours || 0;
      let bonusPoints = 0;

      // Award bonus for full shift (8+ hours)
      if (hoursWorked >= 8) {
        bonusPoints = 15;
        await awardPoints(user.id, bonusPoints, 'Full shift bonus', activeAttendance.id);
      }

      // 7. Check for new achievements
      await checkShiftAchievements(user.id);

      setIsCheckedIn(false);
      setCurrentAttendanceId(null);
      setCheckInTime(null);

      // Show success with points summary
      const totalPoints = 20 + bonusPoints;
      Alert.alert(
        '✅ Checked Out Successfully!',
        `Great work! You earned ${totalPoints} points!\n⏱️ Total hours: ${hoursWorked.toFixed(2)}${bonusPoints > 0 ? '\n🎯 Full shift bonus earned!' : ''}`,
        [{ text: 'Awesome!' }]
      );

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
      {/* Points & Achievements Display */}
      {candidateId && (
        <View className="mb-3">
          <PointsDisplay candidateId={candidateId} showRank={true} size="small" />
          <View className="mt-2">
            <AchievementBadge candidateId={candidateId} maxDisplay={3} />
          </View>
        </View>
      )}

      {!isCheckedIn ? (
        <>
          <TouchableOpacity
            className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl py-4 px-6 items-center flex-row justify-center shadow-lg"
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
                <View className="ml-auto flex-row items-center bg-white/20 rounded-full px-2 py-1">
                  <Coins size={14} color="white" />
                  <Text className="text-white text-sm font-bold ml-1">+10</Text>
                </View>
              </>
            )}
          </TouchableOpacity>
          <Text className="text-xs text-gray-500 text-center">
            📍 You must be within 100m of the job site • 🎯 Earn points for each shift!
          </Text>
        </>
      ) : (
        <>
          {/* Show time elapsed */}
          {checkInTime && (
            <View className="bg-blue-50 rounded-lg p-3 mb-2">
              <TimeElapsed startTime={checkInTime} />
            </View>
          )}

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
            className="bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl py-4 px-6 items-center flex-row justify-center shadow-lg"
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
                <View className="ml-auto flex-row items-center bg-white/20 rounded-full px-2 py-1">
                  <Coins size={14} color="white" />
                  <Text className="text-white text-sm font-bold ml-1">+20</Text>
                </View>
              </>
            )}
          </TouchableOpacity>

          <Text className="text-xs text-gray-500 text-center">
            📸 Take your check-in selfie • 🏁 Clock out when done to earn more points!
          </Text>
        </>
      )}
    </View>
  );
}

// Time Elapsed Component
function TimeElapsed({ startTime }: { startTime: Date }) {
  const [elapsed, setElapsed] = useState('00:00:00');

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - startTime.getTime();
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      setElapsed(
        `${hours.toString().padStart(2, '0')}:${minutes
          .toString()
          .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <View className="flex-row items-center justify-center">
      <Clock size={16} color="#3B82F6" />
      <Text className="ml-2 text-blue-600 font-mono font-bold text-lg">{elapsed}</Text>
      <Text className="ml-2 text-blue-600 text-sm">elapsed</Text>
    </View>
  );
}