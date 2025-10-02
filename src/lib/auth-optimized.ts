import { supabase } from './supabase';
import type { UserProfile } from './types';

// Performance optimizations
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const AUTH_TIMEOUT = 5000; // 5 seconds (reduced from 10)
const PROFILE_CHECK_TIMEOUT = 2000; // 2 seconds for profile operations

// Simple in-memory cache for session
let sessionCache: { data: any; timestamp: number } | null = null;

// Preconnect to Supabase on module load
if (typeof window !== 'undefined') {
  // Create a link element for preconnect
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = 'https://supabase.co';
  document.head.appendChild(link);
}

/**
 * Optimized sign in with reduced timeouts and better error handling
 */
export async function signIn(email: string, password: string) {
  // Input validation
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  // Normalize email
  email = email.toLowerCase().trim();

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AUTH_TIMEOUT);

  try {
    // Sign in with timeout
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    clearTimeout(timeoutId);

    if (error) {
      // Fast error handling with specific messages
      if (error.message?.includes('Email not confirmed')) {
        throw new Error('Please verify your email before signing in');
      } else if (error.message?.includes('Invalid login credentials')) {
        throw new Error('The email or password you entered is incorrect');
      } else if (error.status === 429) {
        throw new Error('Too many login attempts. Please try again later.');
      }
      throw error;
    }

    // Cache the session for faster subsequent checks
    if (data.session) {
      sessionCache = {
        data: data.session,
        timestamp: Date.now()
      };
    }

    // Non-blocking profile check (fire and forget)
    if (data.user) {
      // Use requestIdleCallback for non-critical work
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
          ensureUserProfile(data.user.id, email).catch(console.error);
        });
      } else {
        // Fallback to setTimeout for browsers without requestIdleCallback
        setTimeout(() => {
          ensureUserProfile(data.user.id, email).catch(console.error);
        }, 0);
      }
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.message.includes('abort')) {
        throw new Error('Login timeout. Please check your connection and try again.');
      }
    }
    throw error;
  }
}

/**
 * Lightweight profile check/creation
 */
async function ensureUserProfile(userId: string, email: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROFILE_CHECK_TIMEOUT);

  try {
    // Quick existence check
    const { data: profile } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    clearTimeout(timeoutId);

    if (!profile) {
      // Create minimal profile
      const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_');
      const avatarSeed = Math.random().toString(36).substring(2, 12);
      
      await supabase
        .from('users')
        .insert([{
          id: userId,
          email: email,
          username,
          full_name: '',
          role: 'staff',
          is_super_admin: false,
          avatar_seed: avatarSeed,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select(); // Don't wait for response
    }
  } catch (error) {
    clearTimeout(timeoutId);
    // Silently fail - profile creation is not critical for login
    console.error('Profile check failed (non-critical):', error);
  }
}

/**
 * Get cached session for instant checks
 */
export async function getSession() {
  // Check cache first
  if (sessionCache && (Date.now() - sessionCache.timestamp) < CACHE_DURATION) {
    return sessionCache.data;
  }

  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      if (error.message?.includes('Auth session missing') ||
          error.name === 'AuthSessionMissingError') {
        return null;
      }
      throw error;
    }

    // Update cache
    if (session) {
      sessionCache = {
        data: session,
        timestamp: Date.now()
      };
    }

    return session;
  } catch (error) {
    console.error('Error in getSession:', error);
    return null;
  }
}

/**
 * Optimized user retrieval
 */
export async function getUser() {
  // Try to get from cached session first
  if (sessionCache && (Date.now() - sessionCache.timestamp) < CACHE_DURATION) {
    return sessionCache.data?.user || null;
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      if (error.message?.includes('Auth session missing') ||
          error.name === 'AuthSessionMissingError') {
        return null;
      }
      throw error;
    }
    
    return user;
  } catch (error) {
    console.error('Error in getUser:', error);
    return null;
  }
}

/**
 * Sign out and clear cache
 */
export async function signOut() {
  sessionCache = null; // Clear cache immediately
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Prefetch auth state (call this early in app initialization)
 */
export async function prefetchAuthState() {
  // Warm up the connection and cache
  try {
    await getSession();
  } catch (error) {
    console.error('Failed to prefetch auth state:', error);
  }
}

// Auto-prefetch on module load in browser
if (typeof window !== 'undefined') {
  // Use requestIdleCallback to avoid blocking initial render
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => prefetchAuthState());
  } else {
    setTimeout(() => prefetchAuthState(), 1000);
  }
}