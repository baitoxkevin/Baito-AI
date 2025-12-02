import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const [status, setStatus] = useState('Logging you in...');
  const params = useLocalSearchParams();

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      setStatus('Processing authentication...');

      // Method 1: Check URL search params (from Expo Router)
      let accessToken = params.access_token as string;
      let refreshToken = params.refresh_token as string;

      // Method 2: Get the full URL and parse it (for deep links)
      if (!accessToken || !refreshToken) {
        const url = await Linking.getInitialURL();
        console.log('Initial URL:', url);

        if (url) {
          // Parse URL hash or query params
          const parsedUrl = Linking.parse(url);
          console.log('Parsed URL:', parsedUrl);

          // Try hash params first (Supabase default)
          if (url.includes('#')) {
            const hashPart = url.split('#')[1];
            const hashParams = new URLSearchParams(hashPart);
            accessToken = accessToken || hashParams.get('access_token') || '';
            refreshToken = refreshToken || hashParams.get('refresh_token') || '';
          }

          // Try query params
          if (!accessToken && parsedUrl.queryParams) {
            accessToken = accessToken || (parsedUrl.queryParams.access_token as string);
            refreshToken = refreshToken || (parsedUrl.queryParams.refresh_token as string);
          }
        }
      }

      // Method 3: For web environment
      if (!accessToken && typeof window !== 'undefined' && window.location?.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        accessToken = hashParams.get('access_token') || '';
        refreshToken = hashParams.get('refresh_token') || '';
      }

      // If we have tokens, set the session
      if (accessToken && refreshToken) {
        setStatus('Setting up your session...');

        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error('Session error:', error);
          setStatus('Authentication failed');
          Alert.alert('Login Failed', error.message, [
            { text: 'Try Again', onPress: () => router.replace('/auth/login') }
          ]);
          return;
        }

        if (data.session) {
          console.log('Session created successfully:', data.session.user.email);
          setStatus('Login successful! Redirecting...');

          // Fetch user role to determine redirect
          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', data.session.user.id)
            .single();

          // Redirect based on role
          if (userData?.role === 'admin') {
            router.replace('/admin');
          } else {
            router.replace('/worker');
          }
          return;
        }
      }

      // Fallback: Check for existing session
      setStatus('Checking existing session...');
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        console.log('Existing session found:', session.user.email);
        setStatus('Session found! Redirecting...');

        // Fetch user role
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (userData?.role === 'admin') {
          router.replace('/admin');
        } else {
          router.replace('/worker');
        }
      } else {
        console.log('No session found, redirecting to login');
        setStatus('No session found');
        router.replace('/auth/login');
      }
    } catch (error: any) {
      console.error('Auth callback error:', error);
      setStatus('Error occurred');
      Alert.alert('Authentication Error', error.message || 'Something went wrong', [
        { text: 'Try Again', onPress: () => router.replace('/auth/login') }
      ]);
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#2563eb" />
      <Text className="mt-4 text-gray-600 text-center px-4">{status}</Text>
    </View>
  );
}
