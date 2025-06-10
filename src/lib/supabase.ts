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
export type SupabaseRPC<T = any> = { data: T | null; error: unknown };

// REMOVED: applyMigration function that used dangerous exec_sql RPC
// This function was a security vulnerability and has been removed
// Use Supabase migrations through the dashboard or CLI instead