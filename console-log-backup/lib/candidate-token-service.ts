import { supabase } from './supabase';

export interface CandidateUpdateLinkResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Generate a secure update link for a candidate
 * This link allows candidates to update their own information without logging in
 * @param candidateId - The ID of the candidate
 * @param baseUrl - Optional base URL (defaults to current origin)
 * @returns The generated URL or error
 */
export async function generateCandidateUpdateLink(
  candidateId: string,
  baseUrl?: string
): Promise<CandidateUpdateLinkResult> {
  try {
    // Get the base URL from environment or use current origin
    const base = baseUrl || window.location.origin;
    
    // Call the database function to generate a secure link
    // Now using the mobile-optimized version
    const { data, error } = await supabase
      .rpc('generate_candidate_update_link', {
        p_candidate_id: candidateId,
        p_base_url: `${base}/candidate-update-mobile/`
      });
    
    if (error) {
      console.error('Error generating candidate update link:', error);
      return {
        success: false,
        error: error.message
      };
    }
    
    return {
      success: true,
      url: data
    };
  } catch (error) {
    console.error('Error in generateCandidateUpdateLink:', error);
    return {
      success: false,
      error: 'Failed to generate update link'
    };
  }
}

/**
 * Generate a secure token for a candidate (without the full URL)
 * @param candidateId - The ID of the candidate
 * @param expirationHours - How many hours the token should be valid (default 1)
 * @returns The generated token or error
 */
export async function generateCandidateToken(
  candidateId: string,
  expirationHours: number = 1
): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .rpc('generate_candidate_verification_token', {
        p_candidate_id: candidateId,
        p_expiration_hours: expirationHours
      });
    
    if (error) {
      console.error('Error generating candidate token:', error);
      return {
        success: false,
        error: error.message
      };
    }
    
    return {
      success: true,
      token: data
    };
  } catch (error) {
    console.error('Error in generateCandidateToken:', error);
    return {
      success: false,
      error: 'Failed to generate token'
    };
  }
}

/**
 * Validate a candidate verification token
 * @param token - The token to validate
 * @returns The candidate data if valid, null otherwise
 */
export async function validateCandidateToken(token: string) {
  try {
    const { data, error } = await supabase
      .rpc('validate_candidate_verification_token', {
        p_token: token,
        p_client_ip: null,
        p_user_agent: navigator.userAgent
      });
    
    if (error || !data || data.length === 0) {
      return null;
    }
    
    return data[0];
  } catch (error) {
    console.error('Error validating candidate token:', error);
    return null;
  }
}

/**
 * Check if a candidate public link is still valid
 * @param linkToken - The UUID token from the public link
 * @returns Validation result
 */
export async function checkCandidatePublicLink(linkToken: string) {
  try {
    const { data, error } = await supabase
      .rpc('check_candidate_public_link', {
        link_token: linkToken
      });
    
    if (error) {
      console.error('Error checking public link:', error);
      return {
        isValid: false,
        message: error.message
      };
    }
    
    if (data && data.length > 0) {
      return {
        candidateId: data[0].candidate_id,
        isValid: data[0].is_valid,
        message: data[0].message
      };
    }
    
    return {
      isValid: false,
      message: 'Invalid link'
    };
  } catch (error) {
    console.error('Error in checkCandidatePublicLink:', error);
    return {
      isValid: false,
      message: 'Failed to validate link'
    };
  }
}

/**
 * Log candidate update activity
 * @param candidateId - The candidate ID
 * @param action - The action performed
 * @param details - Additional details
 */
export async function logCandidateActivity(
  candidateId: string,
  action: string,
  details: Record<string, unknown>
) {
  try {
    await supabase
      .from('activity_logs')
      .insert({
        action,
        entity_type: 'candidate',
        entity_id: candidateId,
        details
      });
  } catch (error) {
    console.error('Error logging candidate activity:', error);
  }
}