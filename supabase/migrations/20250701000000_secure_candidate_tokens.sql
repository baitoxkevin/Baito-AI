-- Create a more secure token system for candidate verification
-- Migration: 20250701000000_secure_candidate_tokens.sql

-- Create a new table to store tokens with expiration
CREATE TABLE IF NOT EXISTS candidate_verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID REFERENCES candidates(id) NOT NULL,
  token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  client_ip TEXT,
  user_agent TEXT
);

-- Create index for faster lookup
CREATE INDEX IF NOT EXISTS idx_candidate_verification_tokens_token ON candidate_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_candidate_verification_tokens_candidate_id ON candidate_verification_tokens(candidate_id);

-- Function to generate a secure token with 1-hour expiration
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
  
  -- Generate a secure token using UUID, timestamp, and a random component
  -- Base64 encode to make it URL-friendly
  v_token := encode(
    digest(
      uuid_generate_v4()::text || 
      p_candidate_id::text || 
      extract(epoch from now())::text ||
      gen_random_uuid()::text,
      'sha256'
    ),
    'base64'
  );
  
  -- Remove any non-alphanumeric characters to make URL-friendly
  v_token := regexp_replace(v_token, '[^a-zA-Z0-9]', '', 'g');
  
  -- Trim to a reasonable length (48 chars)
  v_token := substring(v_token, 1, 48);
  
  -- Set expiration
  v_expires_at := now() + (p_expiration_hours * interval '1 hour');
  
  -- Insert the token into the database
  INSERT INTO candidate_verification_tokens (
    candidate_id,
    token,
    created_by,
    expires_at
  ) VALUES (
    p_candidate_id,
    v_token,
    p_created_by,
    v_expires_at
  );
  
  -- Return the generated token
  RETURN v_token;
END;
$$;

-- Function to validate a token and get candidate data
CREATE OR REPLACE FUNCTION validate_candidate_verification_token(
  p_token TEXT,
  p_client_ip TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE (
  candidate_id UUID,
  full_name TEXT,
  email TEXT,
  phone_number TEXT,
  gender TEXT,
  ic_number TEXT,
  nationality TEXT,
  date_of_birth TEXT,
  emergency_contact_name TEXT,
  emergency_contact_number TEXT,
  custom_fields JSONB,
  profile_photo TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token_record RECORD;
BEGIN
  -- Find the token
  SELECT * INTO v_token_record
  FROM candidate_verification_tokens
  WHERE 
    token = p_token
    AND expires_at > now()
    AND used_at IS NULL;
    
  -- Check if token was found and is valid
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Update token with usage information
  UPDATE candidate_verification_tokens
  SET 
    used_at = now(),
    client_ip = p_client_ip,
    user_agent = p_user_agent
  WHERE id = v_token_record.id;
  
  -- Return candidate data
  RETURN QUERY
  SELECT 
    c.id AS candidate_id,
    c.full_name,
    c.email,
    c.phone_number,
    c.gender,
    c.ic_number,
    c.nationality,
    c.date_of_birth,
    c.emergency_contact_name,
    c.emergency_contact_number,
    c.custom_fields,
    c.profile_photo
  FROM candidates c
  WHERE c.id = v_token_record.candidate_id;
END;
$$;

-- Allow the authenticated users to generate tokens
GRANT EXECUTE ON FUNCTION generate_candidate_verification_token(UUID, UUID, INTEGER) TO authenticated;

-- Allow public access to validate tokens (needed for public forms)
GRANT EXECUTE ON FUNCTION validate_candidate_verification_token(TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION validate_candidate_verification_token(TEXT, TEXT, TEXT) TO authenticated;

-- Storage procedure to generate and return a token
CREATE OR REPLACE FUNCTION generate_candidate_update_link(
  p_candidate_id UUID,
  p_base_url TEXT DEFAULT 'http://localhost:5173/candidate-update/'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token TEXT;
BEGIN
  -- Generate token (defaults to 1 hour)
  v_token := generate_candidate_verification_token(p_candidate_id, auth.uid());
  
  -- Return full URL
  RETURN p_base_url || p_candidate_id || '?secure_token=' || v_token;
END;
$$;

-- Grant execute on the URL generation function
GRANT EXECUTE ON FUNCTION generate_candidate_update_link(UUID, TEXT) TO authenticated;