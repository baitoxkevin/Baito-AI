import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file'
  );
}

// Singleton guard - prevent multiple client instances
// Check if client already exists in window object
if ((window as any).__supabase_client__) {
  console.warn('[SUPABASE] Multiple client creation attempts detected - using existing instance');
}

export const supabase = (window as any).__supabase_client__ || (() => {
  const client = createClient<Database>(
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

  // Store in window to prevent duplicate instances
  (window as any).__supabase_client__ = client;
  console.log('[SUPABASE] Main client initialized');

  return client;
})();

// Track auth initialization state
let authInitialized = false;
let authInitPromise: Promise<void> | null = null;

// Initialize auth and wait for session restore
export async function ensureAuthReady(): Promise<void> {
  if (authInitialized) {
    console.log('[AUTH] Already initialized, skipping');
    return;
  }

  // Prevent multiple simultaneous initialization attempts
  if (authInitPromise) {
    console.log('[AUTH] Initialization already in progress, waiting...');
    return authInitPromise;
  }

  authInitPromise = (async () => {
    try {
      console.log('[AUTH] Initializing Supabase auth...');
      const start = performance.now();

      // Add timeout to prevent hanging forever
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Auth initialization timeout')), 3000);
      });

      try {
        // Race getSession() against timeout
        const result = await Promise.race([
          supabase.auth.getSession(),
          timeoutPromise
        ]) as Awaited<ReturnType<typeof supabase.auth.getSession>>;

        const { data: { session }, error } = result;
        const duration = Math.round(performance.now() - start);

        if (error) {
          console.warn(`[AUTH] Session restore error after ${duration}ms:`, error.message);
        } else if (session) {
          console.log(`[AUTH] Session restored in ${duration}ms`);
        } else {
          console.log(`[AUTH] No session found (${duration}ms)`);
        }
      } catch (err) {
        const duration = Math.round(performance.now() - start);
        if (String(err).includes('timeout')) {
          console.error(`[AUTH] Session restore TIMEOUT after ${duration}ms - proceeding without waiting`);
        } else {
          console.error(`[AUTH] Session restore exception after ${duration}ms:`, err);
        }
      }

      authInitialized = true;
      authInitPromise = null;
    } catch (error) {
      console.error('[AUTH] Init error:', error);
      authInitialized = true;
      authInitPromise = null;
    }
  })();

  return authInitPromise;
}

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