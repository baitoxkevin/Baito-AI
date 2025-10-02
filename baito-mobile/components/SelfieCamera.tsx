import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Modal } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Camera, X, RotateCcw } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

interface SelfieCameraProps {
  attendanceId?: string;
  onPhotoTaken?: (photoUrl: string) => void;
  isCheckIn?: boolean;
}

export function SelfieCamera({ attendanceId, onPhotoTaken, isCheckIn = true }: SelfieCameraProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const cameraRef = useRef<CameraView>(null);

  const openCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Denied', 'Camera permission is required to take selfies');
        return;
      }
    }
    setIsOpen(true);
  };

  const takeSelfie = async () => {
    if (!cameraRef.current) return;

    setLoading(true);
    try {
      // 1. Capture photo
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: false,
      });

      if (!photo?.uri) {
        throw new Error('Failed to capture photo');
      }

      // 2. Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // 3. Upload to Supabase Storage
      const fileName = `${user.id}-${Date.now()}.jpg`;
      const formData = new FormData();
      formData.append('file', {
        uri: photo.uri,
        type: 'image/jpeg',
        name: fileName,
      } as any);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('attendance-photos')
        .upload(fileName, formData, {
          contentType: 'image/jpeg',
        });

      if (uploadError) throw uploadError;

      const photoUrl = uploadData.path;

      // 4. Update attendance record if provided
      if (attendanceId) {
        const updateField = isCheckIn ? 'check_in_photo_url' : 'check_out_photo_url';
        const { error: updateError } = await supabase
          .from('attendance')
          .update({ [updateField]: photoUrl })
          .eq('id', attendanceId);

        if (updateError) throw updateError;
      }

      Alert.alert('Success', 'Selfie captured successfully!');
      onPhotoTaken?.(photoUrl);
      setIsOpen(false);
    } catch (error: any) {
      console.error('Selfie capture error:', error);
      Alert.alert('Error', error.message || 'Failed to capture selfie. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  return (
    <>
      {/* Trigger Button */}
      <TouchableOpacity
        className="bg-purple-600 rounded-lg py-3 px-4 flex-row items-center justify-center"
        onPress={openCamera}
        activeOpacity={0.8}
      >
        <Camera size={20} color="white" />
        <Text className="text-white font-semibold ml-2">
          {isCheckIn ? 'Take Check-In Selfie' : 'Take Check-Out Selfie'}
        </Text>
      </TouchableOpacity>

      {/* Camera Modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <View className="flex-1 bg-black">
          {permission?.granted ? (
            <>
              <CameraView
                ref={cameraRef}
                style={{ flex: 1 }}
                facing={facing}
              >
                {/* Camera Overlay */}
                <View className="flex-1 justify-between">
                  {/* Top Bar */}
                  <View className="bg-black/50 p-4 flex-row justify-between items-center">
                    <TouchableOpacity
                      onPress={() => setIsOpen(false)}
                      className="p-2"
                    >
                      <X size={28} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white font-semibold text-lg">
                      {isCheckIn ? 'Check-In Selfie' : 'Check-Out Selfie'}
                    </Text>
                    <TouchableOpacity
                      onPress={toggleCameraFacing}
                      className="p-2"
                    >
                      <RotateCcw size={24} color="white" />
                    </TouchableOpacity>
                  </View>

                  {/* Face Guide Oval */}
                  <View className="items-center justify-center flex-1">
                    <View className="w-64 h-80 border-4 border-white/70 rounded-full" />
                    <Text className="text-white text-center mt-4 px-8">
                      Position your face within the oval
                    </Text>
                  </View>

                  {/* Bottom Bar */}
                  <View className="bg-black/50 p-6 items-center">
                    <TouchableOpacity
                      onPress={takeSelfie}
                      disabled={loading}
                      className="w-20 h-20 rounded-full bg-white items-center justify-center"
                      activeOpacity={0.8}
                    >
                      {loading ? (
                        <ActivityIndicator size="large" color="#2563eb" />
                      ) : (
                        <View className="w-16 h-16 rounded-full bg-blue-600" />
                      )}
                    </TouchableOpacity>
                    <Text className="text-white/70 text-sm mt-3">
                      {loading ? 'Uploading...' : 'Tap to capture'}
                    </Text>
                  </View>
                </View>
              </CameraView>
            </>
          ) : (
            <View className="flex-1 justify-center items-center p-6">
              <Camera size={64} color="white" />
              <Text className="text-white text-xl font-semibold mt-4 text-center">
                Camera Permission Required
              </Text>
              <Text className="text-white/70 text-center mt-2 mb-6">
                We need access to your camera to take attendance selfies
              </Text>
              <TouchableOpacity
                onPress={requestPermission}
                className="bg-blue-600 rounded-lg py-3 px-6"
              >
                <Text className="text-white font-semibold">Grant Permission</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}
