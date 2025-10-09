import { supabase } from './supabase';
import { getAvatarUrl } from './avatar-service';
import type { UserProfile } from './types';
import { setSentryUser, clearSentryUser, captureException } from './sentry';
import { logActivity } from './activity-logger';

// Connection health check
let isConnectionHealthy = true;
let lastHealthCheck = 0;

async function checkConnectionHealth() {
  const now = Date.now();
  // Only check every 30 seconds
  if (now - lastHealthCheck < 30000) {
    return isConnectionHealthy;
  }

  lastHealthCheck = now;
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    isConnectionHealthy = !error;
  } catch {
    isConnectionHealthy = false;
  }

  return isConnectionHealthy;
}

/**
 * Check if current session is valid
 * @returns true if session exists and is not expired
 */
export async function isSessionValid(): Promise<boolean> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.warn('[AUTH] Session validation error:', error);
      return false;
    }

    if (!session) {
      console.log('[AUTH] No active session');
      return false;
    }

    // Check if token is expired
    const expiresAt = session.expires_at;
    if (expiresAt && expiresAt * 1000 < Date.now()) {
      console.warn('[AUTH] Session token expired');
      return false;
    }

    return true;
  } catch (error) {
    console.error('[AUTH] Error checking session validity:', error);
    return false;
  }
}

/**
 * Attempt to refresh the current session
 * @returns true if refresh successful
 */
export async function refreshSession(): Promise<boolean> {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession();

    if (error) {
      console.error('[AUTH] Session refresh failed:', error);
      return false;
    }

    if (session) {
      console.log('[AUTH] Session refreshed successfully');
      return true;
    }

    return false;
  } catch (error) {
    console.error('[AUTH] Error refreshing session:', error);
    return false;
  }
}

/**
 * Sign in a user with email and password
 * @param email User's email
 * @param password User's password
 * @returns Authentication data including user and session
 */
export async function signIn(email: string, password: string) {
  // Validate input
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  // Normalize email
  email = email.toLowerCase().trim();

  // Create a timeout promise (30 seconds for slow connections)
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Login timeout. Please check your connection and try again.')), 30000);
  });

  try {
    // Race the auth request against the timeout
    const { data, error } = await Promise.race([
      supabase.auth.signInWithPassword({
        email,
        password,
      }),
      timeoutPromise
    ]) as Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>;

    if (error) {
      console.error('Auth error details:', error);

      // Log failed login attempt (fire and forget)
      try {
        logActivity({
          action: 'login_failed',
          activity_type: 'action',
          project_id: 'system', // Use system as project ID for auth events
          details: {
            email,
            error: error.message,
            timestamp: new Date().toISOString()
          }
        }).catch(err => console.warn('Failed to log login failure:', err));
      } catch (err) {
        console.warn('Failed to log login failure:', err);
      }

      if (error.message?.includes('Email not confirmed')) {
        throw new Error('Please verify your email before signing in');
      } else if (error.message?.includes('Invalid login credentials')) {
        throw new Error('The email or password you entered is incorrect');
      } else if (error.status === 400) {
        throw new Error('Invalid login attempt. Please check your credentials and try again.');
      } else if (error.status === 429) {
        throw new Error('Too many login attempts. Please try again later.');
      }
      throw error;
    }

    // Profile check with timeout - but don't block login
    if (data.user) {
      // Fire and forget profile check/creation
      checkOrCreateProfile(data.user.id, email).catch(err => {
        console.error('Profile creation error (non-blocking):', err);
      });

      // Set Sentry user context for error tracking
      setSentryUser({
        id: data.user.id,
        email: data.user.email,
      });

      // Log successful login (fire and forget - don't await)
      try {
        logActivity({
          action: 'login_success',
          activity_type: 'action',
          project_id: 'system', // Use system as project ID for auth events
          details: {
            user_id: data.user.id,
            email: data.user.email,
            timestamp: new Date().toISOString()
          }
        }).catch(err => console.warn('Failed to log login success:', err));
      } catch (err) {
        console.warn('Failed to log login success:', err);
      }
    }

    return data;
  } catch (error) {
    // Log error to Sentry
    if (error instanceof Error) {
      captureException(error, { context: { action: 'signIn', email } });
    }

    if (error instanceof Error && error.message.includes('timeout')) {
      throw error;
    }
    throw error;
  }
}

// Helper function to check/create profile asynchronously
async function checkOrCreateProfile(userId: string, email: string) {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      // Create profile if it doesn't exist
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
        }]);
    }
  } catch (error) {
    console.error('Error in profile check/creation:', error);
  }
}

/**
 * Sign up a new user
 * @param email User's email
 * @param password User's password
 * @param fullName User's full name (optional)
 * @returns Authentication data
 */
export async function signUp(email: string, password: string, fullName?: string) {
  // Validate input
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  // Normalize email
  email = email.toLowerCase().trim();

  // Validate password strength
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      data: {
        full_name: fullName || '',
      }
    }
  });

  if (error) throw error;

  // Create user profile in users table
  if (data.user) {
    const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Check if username exists
    const { data: existingUsername } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    // If username exists, append a random string
    const finalUsername = existingUsername 
      ? `${username}_${Math.random().toString(36).substring(2, 7)}`
      : username;
      
    // Generate random avatar seed
    const avatarSeed = Math.random().toString(36).substring(2, 12);

    const { error: profileError } = await supabase
      .from('users')
      .insert([
        {
          id: data.user.id,
          email: data.user.email,
          username: finalUsername,
          full_name: fullName || '',
          role: 'staff',
          is_super_admin: false,
          avatar_seed: avatarSeed,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      throw profileError;
    }
  }

  return data;
}

/**
 * Sign out the current user
 */
export async function signOut() {
  try {
    // Get current user before signing out for logging
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    // Log logout (fire and forget)
    if (user) {
      try {
        logActivity({
          action: 'logout',
          activity_type: 'action',
          project_id: 'system', // Use system as project ID for auth events
          details: {
            user_id: user.id,
            email: user.email,
            timestamp: new Date().toISOString()
          }
        }).catch(err => console.warn('Failed to log logout:', err));
      } catch (err) {
        console.warn('Failed to log logout:', err);
      }
    }

    // Clear Sentry user context on sign out
    clearSentryUser();
  } catch (error) {
    if (error instanceof Error) {
      captureException(error, { context: { action: 'signOut' } });
    }
    throw error;
  }
}

/**
 * Get the current session
 * @returns The current session or null if not authenticated
 */
export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      // Handle auth session missing error gracefully
      if (error.message?.includes('Auth session missing') ||
          error.name === 'AuthSessionMissingError') {
        console.log('No active session found - returning null session');
        return null;
      }
      throw error;
    }
    return session;
  } catch (error) {
    // Additional error handling for any unexpected errors
    console.error('Error in getSession:', error);
    if (String(error).includes('Auth session missing')) {
      return null;
    }
    throw error;
  }
}

/**
 * Get the current authenticated user
 * @returns The current user or null if not authenticated
 */
export async function getUser() {
  try {
    // Just get the user directly - Supabase handles session validation
    // Don't pre-validate to avoid blocking
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      // Handle auth session missing error gracefully
      if (error.message?.includes('Auth session missing') ||
          error.name === 'AuthSessionMissingError') {
        console.log('No active session found - returning null user');
        return null;
      }
      throw error;
    }
    return user;
  } catch (error) {
    // Additional error handling for any unexpected errors
    console.error('Error in getUser:', error);
    if (String(error).includes('Auth session missing')) {
      return null;
    }
    throw error;
  }
}

/**
 * Send a password reset email
 * @param email User's email
 * @returns Success status
 */
export async function resetPassword(email: string) {
  // Validate input
  if (!email) {
    throw new Error('Email is required');
  }

  // Normalize email
  email = email.toLowerCase().trim();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });

  if (error) throw error;
  
  return { success: true };
}

/**
 * Update a user's password
 * @param newPassword The new password
 * @returns Success status
 */
export async function updatePassword(newPassword: string) {
  // Validate password
  if (!newPassword || newPassword.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) throw error;
  
  return { success: true };
}

/**
 * Get the user's profile from the database
 * @param userId The user ID (optional, uses current user if not provided)
 * @returns The user profile
 */
export async function getUserProfile(userId?: string): Promise<UserProfile> {
  try {
    // If userId not provided, get current user
    if (!userId) {
      const user = await getUser();
      if (!user) throw new Error('Not authenticated');
      userId = user.id;
    }
    
    // Fetch user profile
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) throw error;
    if (!data) throw new Error('User profile not found');
    
    // Ensure avatar URL is set
    const profile = data as UserProfile;
    if (!profile.avatar_url && profile.avatar_seed) {
      profile.avatar_url = getAvatarUrl(profile);
    }
    
    return profile;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
}

/**
 * Update a user's profile
 * @param userId The user ID
 * @param updates Profile updates
 * @returns The updated profile
 */
export async function updateUserProfile(
  userId: string, 
  updates: Partial<Omit<UserProfile, 'id' | 'email' | 'created_at'>>
): Promise<UserProfile> {
  try {
    // Prepare update data with timestamp
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    // Update the profile
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();
      
    if (error) throw error;
    if (!data) throw new Error('User profile not found');
    
    return data as UserProfile;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}