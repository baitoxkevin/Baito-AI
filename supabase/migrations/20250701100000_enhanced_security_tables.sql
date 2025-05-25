-- Enhanced security tables for candidate update system
-- Migration: 20250701100000_enhanced_security_tables.sql

-- 1. Rate limiting table
CREATE TABLE IF NOT EXISTS security_rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier TEXT NOT NULL, -- Can be IP, token, candidate_id, etc.
  action TEXT NOT NULL, -- token_generation, ic_verification, token_validation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  locked_until TIMESTAMP WITH TIME ZONE,
  attempt_metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX idx_rate_limits_identifier_action ON security_rate_limits(identifier, action);
CREATE INDEX idx_rate_limits_created_at ON security_rate_limits(created_at);
CREATE INDEX idx_rate_limits_locked_until ON security_rate_limits(locked_until);

-- Cleanup old rate limit records (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM security_rate_limits 
  WHERE created_at < NOW() - INTERVAL '24 hours'
  AND (locked_until IS NULL OR locked_until < NOW());
END;
$$ LANGUAGE plpgsql;

-- 2. Security audit logs table
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  candidate_id UUID REFERENCES candidates(id),
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id)
);

-- Indexes for security monitoring
CREATE INDEX idx_security_logs_event_type ON security_audit_logs(event_type);
CREATE INDEX idx_security_logs_severity ON security_audit_logs(severity);
CREATE INDEX idx_security_logs_timestamp ON security_audit_logs(timestamp DESC);
CREATE INDEX idx_security_logs_candidate ON security_audit_logs(candidate_id);
CREATE INDEX idx_security_logs_ip ON security_audit_logs(ip_address);

-- 3. CSRF tokens table
CREATE TABLE IF NOT EXISTS csrf_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT NOT NULL UNIQUE,
  session_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  used_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_csrf_tokens_token ON csrf_tokens(token);
CREATE INDEX idx_csrf_tokens_session ON csrf_tokens(session_id);
CREATE INDEX idx_csrf_tokens_created ON csrf_tokens(created_at);

-- Cleanup expired CSRF tokens
CREATE OR REPLACE FUNCTION cleanup_expired_csrf_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM csrf_tokens 
  WHERE created_at < NOW() - INTERVAL '1 hour'
  OR used_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. IP blacklist table
CREATE TABLE IF NOT EXISTS ip_blacklist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('temporary', 'permanent')),
  blocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  blocked_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_ip_blacklist_ip ON ip_blacklist(ip_address);
CREATE INDEX idx_ip_blacklist_expires ON ip_blacklist(expires_at);

-- 5. Enhanced token validation with security checks
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
      jsonb_build_object('attempts', v_attempt_count, 'action', 'token_validation'),
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
  
  -- Get candidate and verify IC
  SELECT * INTO v_candidate
  FROM candidates
  WHERE id = p_candidate_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Candidate not found'::TEXT, NULL::JSONB;
    RETURN;
  END IF;
  
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
    
    -- Check IC verification rate limit
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
  
  -- Success - mark token as used
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
  
  -- Return success with candidate data
  RETURN QUERY SELECT 
    TRUE, 
    'Validation successful'::TEXT,
    jsonb_build_object(
      'id', v_candidate.id,
      'full_name', v_candidate.full_name,
      'email', v_candidate.email,
      'phone_number', v_candidate.phone_number,
      'ic_number', v_candidate.ic_number
    );
END;
$$;

-- 6. Function to check suspicious activity patterns
CREATE OR REPLACE FUNCTION check_suspicious_activity(
  p_identifier TEXT,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS TABLE (
  is_suspicious BOOLEAN,
  risk_score INTEGER,
  reasons TEXT[]
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_failed_attempts INTEGER;
  v_different_ips INTEGER;
  v_rapid_requests INTEGER;
  v_risk_score INTEGER := 0;
  v_reasons TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Count failed attempts
  SELECT COUNT(*) INTO v_failed_attempts
  FROM security_audit_logs
  WHERE (
    details->>'identifier' = p_identifier
    OR candidate_id::TEXT = p_identifier
    OR ip_address = p_identifier
  )
  AND severity IN ('medium', 'high', 'critical')
  AND timestamp > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  IF v_failed_attempts > 5 THEN
    v_risk_score := v_risk_score + 30;
    v_reasons := array_append(v_reasons, 'Multiple failed attempts');
  END IF;
  
  -- Count different IPs for same identifier
  SELECT COUNT(DISTINCT ip_address) INTO v_different_ips
  FROM security_audit_logs
  WHERE (
    details->>'identifier' = p_identifier
    OR candidate_id::TEXT = p_identifier
  )
  AND timestamp > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  IF v_different_ips > 3 THEN
    v_risk_score := v_risk_score + 40;
    v_reasons := array_append(v_reasons, 'Multiple IP addresses');
  END IF;
  
  -- Count rapid requests (more than 10 in 1 minute)
  SELECT COUNT(*) INTO v_rapid_requests
  FROM security_audit_logs
  WHERE (
    details->>'identifier' = p_identifier
    OR candidate_id::TEXT = p_identifier
    OR ip_address = p_identifier
  )
  AND timestamp > NOW() - INTERVAL '1 minute';
  
  IF v_rapid_requests > 10 THEN
    v_risk_score := v_risk_score + 50;
    v_reasons := array_append(v_reasons, 'Rapid request pattern');
  END IF;
  
  RETURN QUERY SELECT 
    v_risk_score >= 50,
    v_risk_score,
    v_reasons;
END;
$$;

-- 7. Scheduled cleanup function
CREATE OR REPLACE FUNCTION cleanup_security_data()
RETURNS void AS $$
BEGIN
  -- Clean up old rate limits
  PERFORM cleanup_old_rate_limits();
  
  -- Clean up expired CSRF tokens
  PERFORM cleanup_expired_csrf_tokens();
  
  -- Archive old security logs (older than 90 days)
  INSERT INTO security_audit_logs_archive
  SELECT * FROM security_audit_logs
  WHERE timestamp < NOW() - INTERVAL '90 days';
  
  DELETE FROM security_audit_logs
  WHERE timestamp < NOW() - INTERVAL '90 days';
  
  -- Remove expired IP blacklist entries
  DELETE FROM ip_blacklist
  WHERE severity = 'temporary'
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION validate_candidate_token_secure TO anon;
GRANT EXECUTE ON FUNCTION check_suspicious_activity TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_security_data TO service_role;