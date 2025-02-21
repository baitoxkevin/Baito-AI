import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

const checkConnection = async () => {
  try {
    const { data, error } = await supabase.from('candidates').select('count', { count: 'exact' });
    if (error) throw error;
    isConnected = true;
    reconnectAttempts = 0;
    return true;
  } catch (error) {
    isConnected = false;
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
  if (event === 'SIGNED_OUT') {
    isConnected = false;
  } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
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
