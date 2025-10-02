import { supabase } from './supabase';
import type { UserProfile } from './types';

// Global cache for candidate profile photos to avoid redundant fetches
const candidatePhotoCache = new Map<string, string>();

/**
 * Check if a string is a valid UUID
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Get candidate avatar URL
 * Since we're using initials, this now returns null by default
 */
export async function getCandidateAvatarUrl(candidateId: string): Promise<string | null> {
  // Return null - we're using initials instead of avatars
  return null;
}

/**
 * Prefetch and cache a list of candidate avatars
 * Since we're using initials, this is now a no-op
 */
export async function prefetchCandidateAvatars(candidateIds: string[]): Promise<void> {
  // No longer needed - we're using initials instead of avatars
  return;
}

/**
 * Clear the candidate avatar cache
 */
export function clearCandidateAvatarCache(): void {
  candidatePhotoCache.clear();
}

// The bucket name where user avatars are stored
const AVATAR_BUCKET = 'avatars';

/**
 * Generates a unique file name for an avatar upload
 * @param userId The ID of the user
 * @param fileExtension The file extension (e.g., 'jpg', 'png')
 */
function generateAvatarFileName(userId: string, fileExtension: string): string {
  const timestamp = Date.now();
  return `${userId}_${timestamp}.${fileExtension}`;
}

/**
 * Extracts the file extension from a file
 * @param file The file object
 */
function getFileExtension(file: File): string {
  const parts = file.name.split('.');
  return parts.length > 1 ? parts.pop()?.toLowerCase() || 'jpg' : 'jpg';
}

/**
 * Upload an avatar image for a user
 * @param userId The ID of the user
 * @param file The avatar image file
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  try {
    // Validate file size
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      throw new Error('Avatar image must be less than 5MB');
    }

    // Validate file type
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!acceptedTypes.includes(file.type)) {
      throw new Error('Avatar must be a JPEG, PNG, GIF, or WebP image');
    }

    // Create a unique file name
    const fileExtension = getFileExtension(file);
    const fileName = generateAvatarFileName(userId, fileExtension);
    const filePath = `${userId}/${fileName}`;

    // Check if bucket exists and create it if it doesn't
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find(b => b.name === AVATAR_BUCKET)) {
      const { error: bucketError } = await supabase.storage.createBucket(AVATAR_BUCKET, {
        public: true,
      });
      if (bucketError) throw bucketError;
    }

    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(filePath);

    // Update the user's avatar URL in the database
    const { error: updateError } = await supabase
      .from('users')
      .update({
        avatar_url: urlData.publicUrl,
        avatar_seed: null, // Clear the avatar seed since we're using a custom image
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
}

/**
 * Remove a user's custom avatar and revert to generated avatar
 * @param userId The ID of the user
 * @param seed Optional seed to use for the generated avatar
 */
export async function removeAvatar(userId: string, seed?: string): Promise<void> {
  try {
    // Generate a seed if not provided
    const avatarSeed = seed || Math.random().toString(36).substring(2, 12);
    
    // Update the user profile
    const { error: updateError } = await supabase
      .from('users')
      .update({
        avatar_url: null,
        avatar_seed: avatarSeed,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Try to clean up storage - list all user's avatar files
    const { data: files, error: listError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .list(userId);

    if (listError) {
      console.warn('Could not list user avatar files:', listError);
      return; // Continue even if we can't list files
    }

    // If there are files, delete them
    if (files && files.length > 0) {
      const filePaths = files.map(file => `${userId}/${file.name}`);
      const { error: deleteError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .remove(filePaths);

      if (deleteError) {
        console.warn('Error deleting avatar files:', deleteError);
      }
    }
  } catch (error) {
    console.error('Error removing avatar:', error);
    throw error;
  }
}

// Removed generateRandomAvatar function - no longer needed

/**
 * Get a user's avatar URL with improved cross-component consistency
 * @param user The user profile or ID
 */
export function getAvatarUrl(user: UserProfile | string): string {
  // If just an ID is provided, try multiple sources
  if (typeof user === 'string') {
    // Try localStorage for the most recent avatar
    try {
      const storedAvatar = localStorage.getItem(`user_avatar_${user}`);
      if (storedAvatar) {
        return storedAvatar;
      }
    } catch (e) {
      // Ignore localStorage errors and continue with fallbacks
    }
    
    // Don't generate an avatar - we'll just use initials in the fallback
    return "";
  }
  
  // For user profile objects, use a priority-ordered approach:
  
  // Priority 1: Check localStorage for the most recent avatar
  // This ensures we have the most up-to-date avatar even if profile data is cached
  try {
    const storedAvatar = localStorage.getItem(`user_avatar_${user.id}`);
    if (storedAvatar) {
      console.log(`[avatar-service] Using avatar from localStorage for user ${user.id}`);
      return storedAvatar;
    }
  } catch (e) {
    // Ignore localStorage errors and continue with fallbacks
  }
  
  // Priority 2: Use the avatar_url field from the profile if available
  if (user.avatar_url) {
    // Also store in localStorage for consistency with other components
    try {
      localStorage.setItem(`user_avatar_${user.id}`, user.avatar_url);
    } catch (e) {
      // Ignore localStorage errors
    }
    
    return user.avatar_url;
  }
  
  // Return empty string - initials will be used as fallback
  return "";
}