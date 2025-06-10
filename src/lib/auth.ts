import { supabase } from './supabase';
import { getAvatarUrl } from './avatar-service';
import type { UserProfile } from './types';

import { logger } from './logger';
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

  // Create a timeout promise (reduced to 10 seconds)
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Login timeout. Please check your connection and try again.')), 10000);
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
      logger.error('Auth error details:', error);
      
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
        logger.error('Profile creation error (non-blocking):', err);
      });
    }

    return data;
  } catch (error) {
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
    logger.error('Error in profile check/creation:', error);
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
      logger.error('Error creating user profile:', profileError);
      throw profileError;
    }
  }

  return data;
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
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
        logger.debug('No active session found - returning null session');
        return null;
      }
      throw error;
    }
    return session;
  } catch (error) {
    // Additional error handling for any unexpected errors
    logger.error('Error in getSession:', error);
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
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      // Handle auth session missing error gracefully
      if (error.message?.includes('Auth session missing') ||
          error.name === 'AuthSessionMissingError') {
        logger.debug('No active session found - returning null user');
        return null;
      }
      throw error;
    }
    return user;
  } catch (error) {
    // Additional error handling for any unexpected errors
    logger.error('Error in getUser:', error);
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
    let currentUserId = userId;
    let currentUser = null;
    
    if (!currentUserId) {
      currentUser = await getUser();
      if (!currentUser) throw new Error('Not authenticated');
      currentUserId = currentUser.id;
    }
    
    // Fetch user profile
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', currentUserId)
      .single();
      
    if (error || !data) {
      // If profile doesn't exist but we have an auth user, create a basic profile
      if (error?.code === 'PGRST116' && currentUser) {
        logger.debug('User profile not found, { data: creating basic profile...' });
        
        // Get current user data if we don't have it
        if (!currentUser && currentUserId) {
          const { data: { user } } = await supabase.auth.getUser();
          currentUser = user;
        }
        
        if (currentUser) {
          // Create a basic profile
          const basicProfile = {
            id: currentUser.id,
            email: currentUser.email || '',
            full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User',
            role: 'staff' as UserRole,
            is_super_admin: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // Try to insert the profile
          const { data: newProfile, error: insertError } = await supabase
            .from('users')
            .insert(basicProfile)
            .select()
            .single();
            
          if (insertError) {
            logger.error('Failed to create user profile:', insertError);
            throw new Error('User profile not found and could not be created');
          }
          
          return newProfile as UserProfile;
        }
      }
      
      throw error || new Error('User profile not found');
    }
    
    // Ensure avatar URL is set
    const profile = data as UserProfile;
    if (!profile.avatar_url && profile.avatar_seed) {
      profile.avatar_url = getAvatarUrl(profile);
    }
    
    return profile;
  } catch (error) {
    logger.error('Error getting user profile:', error);
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
    logger.error('Error updating user profile:', error);
    throw error;
  }
}