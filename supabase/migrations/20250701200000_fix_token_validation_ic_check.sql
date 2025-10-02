-- Fix the validate_candidate_token_secure function to handle empty IC numbers
-- This allows initial token validation without IC, then requires IC for actual access

CREATE OR REPLACE FUNCTION validate_candidate_token_secure(
  p_token TEXT,
  p_candidate_id UUID,
  p_ic_number TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE (
  valid BOOLEAN,
  reason TEXT,
  candidate_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token_record RECORD;
  v_candidate RECORD;
  v_attempt_count INTEGER;
BEGIN
  -- Check IP blacklist first
  IF p_ip_address IS NOT NULL AND EXISTS (
    SELECT 1 FROM ip_blacklist 
    WHERE ip_address = p_ip_address 
    AND (expires_at IS NULL OR expires_at > NOW())
  ) THEN
    -- Log blocked attempt
    INSERT INTO security_audit_logs (
      event_type, severity, details, candidate_id, ip_address, user_agent
    ) VALUES (
      'blocked_ip_attempt', 'high', 
      jsonb_build_object('reason', 'IP blacklisted'),
      p_candidate_id, p_ip_address, p_user_agent
    );
    
    RETURN QUERY SELECT FALSE, 'Access denied'::TEXT, NULL::JSONB;
    RETURN;
  END IF;
  
  -- Check rate limiting for this token
  SELECT COUNT(*) INTO v_attempt_count
  FROM security_rate_limits
  WHERE identifier = 'token:' || p_token
  AND action = 'token_validation'
  AND created_at > NOW() - INTERVAL '5 minutes';
  
  IF v_attempt_count >= 10 THEN
    -- Log rate limit exceeded
    INSERT INTO security_audit_logs (
      event_type, severity, details, candidate_id, ip_address, user_agent
    ) VALUES (
      'rate_limit_exceeded', 'high',
      jsonb_build_object('action', 'token_validation'),
      p_candidate_id, p_ip_address, p_user_agent
    );
    
    RETURN QUERY SELECT FALSE, 'Too many attempts'::TEXT, NULL::JSONB;
    RETURN;
  END IF;
  
  -- Record this attempt
  INSERT INTO security_rate_limits (identifier, action)
  VALUES ('token:' || p_token, 'token_validation');
  
  -- Find and validate token
  SELECT * INTO v_token_record
  FROM candidate_verification_tokens
  WHERE token = p_token
  AND candidate_id = p_candidate_id
  AND expires_at > NOW()
  AND used_at IS NULL;
  
  IF NOT FOUND THEN
    -- Log invalid token attempt
    INSERT INTO security_audit_logs (
      event_type, severity, details, candidate_id, ip_address, user_agent
    ) VALUES (
      'invalid_token_attempt', 'medium',
      jsonb_build_object('token_exists', FALSE),
      p_candidate_id, p_ip_address, p_user_agent
    );
    
    RETURN QUERY SELECT FALSE, 'Invalid or expired token'::TEXT, NULL::JSONB;
    RETURN;
  END IF;
  
  -- Get candidate
  SELECT * INTO v_candidate
  FROM candidates
  WHERE id = p_candidate_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Candidate not found'::TEXT, NULL::JSONB;
    RETURN;
  END IF;
  
  -- Only verify IC if it's provided (not empty)
  IF p_ic_number IS NOT NULL AND p_ic_number != '' THEN
    -- Compare IC numbers (remove dashes for comparison)
    IF REPLACE(v_candidate.ic_number, '-', '') != REPLACE(p_ic_number, '-', '') THEN
      -- Log failed IC verification
      INSERT INTO security_audit_logs (
        event_type, severity, details, candidate_id, ip_address, user_agent
      ) VALUES (
        'ic_verification_failed', 'high',
        jsonb_build_object('attempt_count', v_attempt_count + 1),
        p_candidate_id, p_ip_address, p_user_agent
      );
      
      -- Check if we need to lock the candidate
      SELECT COUNT(*) INTO v_attempt_count
      FROM security_audit_logs
      WHERE event_type = 'ic_verification_failed'
      AND candidate_id = p_candidate_id
      AND timestamp > NOW() - INTERVAL '15 minutes';
      
      IF v_attempt_count >= 3 THEN
        -- Lock the candidate for 1 hour
        INSERT INTO security_rate_limits (
          identifier, action, locked_until
        ) VALUES (
          'ic:' || p_candidate_id, 'ic_verification',
          NOW() + INTERVAL '1 hour'
        );
      END IF;
      
      RETURN QUERY SELECT FALSE, 'IC verification failed'::TEXT, NULL::JSONB;
      RETURN;
    END IF;
    
    -- IC verification successful - mark token as used
    UPDATE candidate_verification_tokens
    SET 
      used_at = NOW(),
      client_ip = p_ip_address,
      user_agent = p_user_agent
    WHERE id = v_token_record.id;
    
    -- Log successful access
    INSERT INTO security_audit_logs (
      event_type, severity, details, candidate_id, ip_address, user_agent
    ) VALUES (
      'candidate_update_access_granted', 'low',
      jsonb_build_object('token_id', v_token_record.id),
      p_candidate_id, p_ip_address, p_user_agent
    );
  END IF;
  
  -- Return success with candidate data
  RETURN QUERY SELECT 
    TRUE, 
    'Validation successful'::TEXT,
    jsonb_build_object(
      'id', v_candidate.id,
      'full_name', v_candidate.full_name,
      'email', v_candidate.email,
      'phone_number', v_candidate.phone_number,
      'ic_number', v_candidate.ic_number,
      'gender', v_candidate.gender,
      'nationality', v_candidate.nationality,
      'date_of_birth', v_candidate.date_of_birth,
      'emergency_contact_name', v_candidate.emergency_contact_name,
      'emergency_contact_number', v_candidate.emergency_contact_number,
      'custom_fields', v_candidate.custom_fields,
      'profile_photo', v_candidate.profile_photo
    );
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION validate_candidate_token_secure TO anon;