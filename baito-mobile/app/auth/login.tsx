import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [useMagicLink, setUseMagicLink] = useState(true);

  const sendMagicLink = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: 'http://localhost:8087/auth/callback',
        },
      });

      if (error) throw error;

      Alert.alert('Check your email!', 'We sent you a magic link. Click it to login instantly.');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const loginWithPassword = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;

      // Navigate to worker or admin based on user role
      router.replace('/worker');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center px-6 bg-white">
      <Text className="text-3xl font-bold mb-8 text-center">Baito</Text>
      <Text className="text-lg mb-4 text-center text-gray-600">
        {useMagicLink ? 'Enter your email for magic link login' : 'Login with your password'}
      </Text>

      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-3 mb-4"
        placeholder="email@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      {!useMagicLink && (
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 mb-4"
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      )}

      <TouchableOpacity
        className="bg-blue-600 rounded-lg py-3 mb-4"
        onPress={useMagicLink ? sendMagicLink : loginWithPassword}
        disabled={loading}
      >
        <Text className="text-white text-center font-semibold">
          {loading ? 'Loading...' : (useMagicLink ? 'Send Magic Link' : 'Login')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setUseMagicLink(!useMagicLink)}>
        <Text className="text-blue-600 text-center">
          {useMagicLink ? 'Login with password instead' : 'Use magic link instead'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
