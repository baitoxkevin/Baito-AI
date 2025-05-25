-- Fix candidate token validation system
-- This migration ensures the token validation system works correctly

-- First, ensure the candidate_verification_tokens table exists
CREATE TABLE IF NOT EXISTS candidate_verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID REFERENCES candidates(id) NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  client_ip TEXT,
  user_agent TEXT
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_candidate_verification_tokens_token ON candidate_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_candidate_verification_tokens_candidate_id ON candidate_verification_tokens(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_verification_tokens_expires_at ON candidate_verification_tokens(expires_at);

-- Enable RLS
ALTER TABLE candidate_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Service role can manage tokens" ON candidate_verification_tokens;
DROP POLICY IF EXISTS "Authenticated users can create tokens" ON candidate_verification_tokens;

-- Create policies
CREATE POLICY "Service role can manage tokens" ON candidate_verification_tokens
  FOR ALL TO service_role USING (true);

CREATE POLICY "Authenticated users can create tokens" ON candidate_verification_tokens
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- Recreate the token generation function
CREATE OR REPLACE FUNCTION generate_candidate_verification_token(
  p_candidate_id UUID,
  p_created_by UUID DEFAULT NULL,
  p_expiration_hours INTEGER DEFAULT 1
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token TEXT;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Basic validation
  IF p_candidate_id IS NULL THEN
    RAISE EXCEPTION 'Candidate ID cannot be null';
  END IF;
  
  -- Verify candidate exists
  IF NOT EXISTS (SELECT 1 FROM candidates WHERE id = p_candidate_id) THEN
    RAISE EXCEPTION 'Candidate not found with ID %', p_candidate_id;
  END IF;
  
  -- Generate a secure token
  v_token := encode(
    digest(
      uuid_generate_v4()::text || 
      p_candidate_id::text || 
      extract(epoch from now())::text ||
      gen_random_uuid()::text,
      'sha256'
    ),
    'hex'
  );
  
  -- Calculate expiration
  v_expires_at := now() + (p_expiration_hours || ' hours')::INTERVAL;
  
  -- Delete any existing unused tokens for this candidate
  DELETE FROM candidate_verification_tokens 
  WHERE candidate_id = p_candidate_id 
  AND used_at IS NULL;
  
  -- Insert new token
  INSERT INTO candidate_verification_tokens (
    candidate_id,
    token,
    expires_at,
    created_by
  ) VALUES (
    p_candidate_id,
    v_token,
    v_expires_at,
    COALESCE(p_created_by, auth.uid())
  );
  
  RETURN v_token;
END;
$$;

-- Update the link generation function to use correct base URL
CREATE OR REPLACE FUNCTION generate_candidate_update_link(
  p_candidate_id UUID,
  p_base_url TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token TEXT;
  v_base_url TEXT;
BEGIN
  -- Use provided base URL or default
  v_base_url := COALESCE(p_base_url, 'http://localhost:5173/candidate-update/');
  
  -- Generate token
  v_token := generate_candidate_verification_token(p_candidate_id, auth.uid());
  
  -- Return full URL
  RETURN v_base_url || p_candidate_id || '?secure_token=' || v_token;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION generate_candidate_verification_token(UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_candidate_update_link(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_candidate_token_secure TO anon;
GRANT EXECUTE ON FUNCTION validate_candidate_token_secure TO authenticated;

-- Add simple token validation for initial checks (without IC)
CREATE OR REPLACE FUNCTION validate_token_exists(
  p_token TEXT,
  p_candidate_id UUID
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
BEGIN
  -- Check if token exists and is valid
  SELECT * INTO v_token_record
  FROM candidate_verification_tokens
  WHERE token = p_token
  AND candidate_id = p_candidate_id
  AND expires_at > NOW()
  AND used_at IS NULL;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      false::BOOLEAN,
      'Token is invalid, expired, or already used'::TEXT,
      NULL::JSONB;
    RETURN;
  END IF;
  
  -- Get candidate data
  SELECT * INTO v_candidate
  FROM candidates
  WHERE id = p_candidate_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      false::BOOLEAN,
      'Candidate not found'::TEXT,
      NULL::JSONB;
    RETURN;
  END IF;
  
  -- Return success with candidate data
  RETURN QUERY SELECT 
    true::BOOLEAN,
    'Token is valid'::TEXT,
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

GRANT EXECUTE ON FUNCTION validate_token_exists TO anon;
GRANT EXECUTE ON FUNCTION validate_token_exists TO authenticated;