import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      // For web, check URL hash for auth tokens
      if (typeof window !== 'undefined') {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          // Set the session from the tokens
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Session error:', error);
            router.replace('/auth/login');
            return;
          }

          if (data.session) {
            console.log('Session created:', data.session.user.email);
            router.replace('/worker');
            return;
          }
        }
      }

      // Fallback: check for existing session
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        router.replace('/worker');
      } else {
        router.replace('/auth/login');
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      router.replace('/auth/login');
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#2563eb" />
      <Text className="mt-4 text-gray-600">Logging you in...</Text>
    </View>
  );
}
