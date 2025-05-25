import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file'
  );
}

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  { 
    db: { schema: 'public' },
    auth: {
      persistSession: true,
      detectSessionInUrl: false,
      autoRefreshToken: true,
      storageKey: 'baito-auth',
      storage: window.localStorage
    },
    global: {
      headers: {
        'x-client-info': 'baito-app/1.0.0'
      }
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

// Helper type for RPC calls
export type SupabaseRPC<T = any> = { data: T | null; error: any };

// Function to execute a SQL migration directly
export const applyMigration = async (sql: string) => {
  try {
    // Execute the SQL directly using the REST API
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      return { success: false, error };
    }
    
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error };
  }
};