import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

// Vite environment type declarations
/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_ANON_KEY: string;
  }
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  }
});

// Add connection state monitoring
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

const checkConnection = async () => {
  try {
    const { error } = await supabase.from('users').select('count', { count: 'exact' });
    if (error) throw error;
    reconnectAttempts = 0;
    return true;
  } catch (error) {
    console.error('Supabase connection error:', error);
    return false;
  }
};

// Add reconnection logic
const reconnect = async () => {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error('Max reconnection attempts reached');
    return false;
  }

  reconnectAttempts++;
  return await checkConnection();
};

// Export connection check function
export const testConnection = async () => {
  const connected = await checkConnection();
  if (!connected) {
    return await reconnect();
  }
  return connected;
};

// Add error handling for database connection
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    checkConnection();
  }
});

// Add helper function to handle Supabase errors
export const handleSupabaseError = (error: any): Error => {
  if (error?.code === 'PGRST200') {
    return new Error('Database schema error. Please check your table relationships.');
  }
  if (error?.code === '23514') {
    return new Error('Data validation failed. Please check your input values.');
  }
  if (error?.message?.includes('Failed to fetch')) {
    return new Error('Connection failed. Please check your internet connection.');
  }
  return new Error(error?.message || 'An unexpected error occurred');
};

export type Notification = {
  id: string;
  user_id: string;
  type: 'mention' | 'assignment' | 'update';
  task_id?: string;
  project_id?: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
};

export const subscribeToNotifications = (userId: string, callback: (payload: { new: Notification }) => void) => {
  return supabase
    .channel(`notifications:${userId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`,
    }, callback)
    .subscribe();
};
