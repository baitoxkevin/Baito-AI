import { supabase } from '@/lib/supabase';

import { logger } from './logger';
/**
 * Check if a candidate is blacklisted by the current user
 * @param candidateId The ID of the candidate to check
 * @returns A promise that resolves to true if the candidate is blacklisted
 */
export async function isBlacklisted(candidateId: string): Promise<boolean> {
  try {
    // Get current user
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      return false;
    }

    // Check if the table exists by attempting a simple query
    const { error: tableCheckError } = await supabase
      .from('candidate_blacklist')
      .select('id')
      .limit(1);
    
    // Table doesn't exist
    if (tableCheckError && (tableCheckError.code === '42P01' || tableCheckError.message.includes('does not exist'))) {
      logger.warn('Candidate blacklist table does not exist or cannot be accessed');
      return false;
    }

    // Check blacklist
    const { data, error } = await supabase
      .from('candidate_blacklist')
      .select('id')
      .eq('candidate_id', candidateId)
      .eq('user_id', authData.user.id)
      .single();

    if (error) {
      // If no matching record was found, it's not an error for our purposes
      if (error.code === 'PGRST116') {
        return false;
      }
      // Handle table doesn't exist error
      if (error.code === '42P01') {
        logger.error('Candidate blacklist table does not exist in database');
        return false;
      }
      logger.error('Error checking blacklist:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    logger.error('Error in isBlacklisted:', error);
    return false;
  }
}

/**
 * Get all blacklisted candidates for the current user
 * @returns A promise that resolves to an array of blacklisted candidate IDs
 */
export async function getBlacklistedCandidates(): Promise<string[]> {
  try {
    // Get current user
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      return [];
    }

    // Check if the table exists by attempting a simple query
    const { error: tableCheckError } = await supabase
      .from('candidate_blacklist')
      .select('id')
      .limit(1);
    
    // Table doesn't exist
    if (tableCheckError && (tableCheckError.code === '42P01' || tableCheckError.message.includes('does not exist'))) {
      logger.warn('Candidate blacklist table does not exist or cannot be accessed');
      return [];
    }

    // Get blacklisted candidates
    const { data, error } = await supabase
      .from('candidate_blacklist')
      .select('candidate_id')
      .eq('user_id', authData.user.id);

    if (error) {
      // Handle table doesn't exist error
      if (error.code === '42P01') {
        logger.error('Candidate blacklist table does not exist in database');
        return [];
      }
      logger.error('Error getting blacklisted candidates:', error);
      return [];
    }

    return data.map(item => item.candidate_id);
  } catch (error) {
    logger.error('Error in getBlacklistedCandidates:', error);
    return [];
  }
}

/**
 * Add a candidate to the current user's blacklist
 * @param candidateId The ID of the candidate to blacklist
 * @param reason The reason for blacklisting
 * @param proofFiles Optional array of file URLs as evidence
 * @returns A promise that resolves to true if successful
 */
export async function blacklistCandidate(
  candidateId: string,
  reason: string,
  proofFiles: string[] = []
): Promise<boolean> {
  try {
    // Get current user
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      throw new Error('User not authenticated');
    }

    // Check if already blacklisted
    const isAlreadyBlacklisted = await isBlacklisted(candidateId);
    if (isAlreadyBlacklisted) {
      return true; // Already blacklisted, consider it a success
    }

    // Check if the table exists by attempting a simple query
    const { error: tableCheckError } = await supabase
      .from('candidate_blacklist')
      .select('id')
      .limit(1);
    
    // Table doesn't exist
    if (tableCheckError && (tableCheckError.code === '42P01' || tableCheckError.message.includes('does not exist'))) {
      logger.error('Cannot blacklist candidate: table does not exist');
      return false;
    }

    // Add to blacklist
    const { error } = await supabase
      .from('candidate_blacklist')
      .insert([{
        candidate_id: candidateId,
        user_id: authData.user.id,
        reason: reason.trim(),
        proof_files: proofFiles,
        is_global: false // User-specific blacklist
      }]);

    if (error) {
      // Handle table doesn't exist error
      if (error.code === '42P01') {
        logger.error('Candidate blacklist table does not exist in database');
        return false;
      }
      logger.error('Error blacklisting candidate:', error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error in blacklistCandidate:', error);
    return false;
  }
}

/**
 * Remove a candidate from the current user's blacklist
 * @param candidateId The ID of the candidate to remove
 * @returns A promise that resolves to true if successful
 */
export async function removeFromBlacklist(candidateId: string): Promise<boolean> {
  try {
    // Get current user
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      throw new Error('User not authenticated');
    }

    // Check if the table exists by attempting a simple query
    const { error: tableCheckError } = await supabase
      .from('candidate_blacklist')
      .select('id')
      .limit(1);
    
    // Table doesn't exist
    if (tableCheckError && (tableCheckError.code === '42P01' || tableCheckError.message.includes('does not exist'))) {
      logger.warn('Cannot remove from blacklist: table does not exist');
      return false;
    }

    // Remove from blacklist
    const { error } = await supabase
      .from('candidate_blacklist')
      .delete()
      .eq('candidate_id', candidateId)
      .eq('user_id', authData.user.id);

    if (error) {
      // Handle table doesn't exist error
      if (error.code === '42P01') {
        logger.error('Candidate blacklist table does not exist in database');
        return false;
      }
      logger.error('Error removing from blacklist:', error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error in removeFromBlacklist:', error);
    return false;
  }
}

/**
 * Upload proof files for blacklisting a candidate
 * @param candidateId The ID of the candidate being blacklisted
 * @param files Array of File objects to upload
 * @returns A promise that resolves to an array of file URLs
 */
export async function uploadBlacklistProof(
  candidateId: string, 
  files: File[]
): Promise<string[]> {
  try {
    // Get current user
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      throw new Error('User not authenticated');
    }
    
    // Check if blacklist-evidence bucket exists
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      logger.error('Error checking storage buckets:', bucketError);
      return [];
    }
    
    const blacklistBucketExists = buckets.some(bucket => bucket.name === 'blacklist-evidence');
    
    if (!blacklistBucketExists) {
      logger.error('Blacklist evidence storage bucket does not exist');
      
      // Try to create the bucket
      try {
        await supabase.storage.createBucket('blacklist-evidence', {
          public: true
        });
        logger.debug('Created blacklist-evidence bucket');
      } catch (createError) {
        logger.error('Failed to create blacklist-evidence bucket:', createError);
        return [];
      }
    }
    
    const uploadedUrls: string[] = [];
    
    // Upload each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = `blacklist/${candidateId}/${authData.user.id}/${Date.now()}_${i}_${file.name}`;
      
      const { error } = await supabase.storage
        .from('blacklist-evidence')
        .upload(filePath, file);
        
      if (error) {
        logger.error('Error uploading file:', error);
        continue;
      }
      
      // Get the public URL from Supabase
      const { data } = supabase.storage
        .from('blacklist-evidence')
        .getPublicUrl(filePath);
        
      uploadedUrls.push(data.publicUrl);
    }
    
    return uploadedUrls;
  } catch (error) {
    logger.error('Error in uploadBlacklistProof:', error);
    return [];
  }
}