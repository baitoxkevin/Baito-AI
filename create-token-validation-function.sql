-- Create function to validate candidate tokens
CREATE OR REPLACE FUNCTION validate_candidate_token_secure(
  p_token TEXT,
  p_candidate_id UUID,
  p_ic_number TEXT DEFAULT '',
  p_ip_address TEXT DEFAULT NULL
)
RETURNS TABLE (
  valid BOOLEAN,
  candidate_data JSONB,
  error_message TEXT
) AS $$
DECLARE
  v_candidate RECORD;
  v_token_data JSONB;
  v_token_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get candidate data
  SELECT * INTO v_candidate
  FROM candidates
  WHERE id = p_candidate_id;

  -- Check if candidate exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::JSONB, 'Candidate not found';
    RETURN;
  END IF;

  -- Get token from custom_fields
  v_token_data := v_candidate.custom_fields;

  -- Check if token exists in custom_fields
  IF v_token_data IS NULL OR NOT (v_token_data ? 'secure_token') THEN
    RETURN QUERY SELECT FALSE, NULL::JSONB, 'Token not found';
    RETURN;
  END IF;

  -- Validate token matches
  IF (v_token_data->>'secure_token') != p_token THEN
    RETURN QUERY SELECT FALSE, NULL::JSONB, 'Token is invalid, expired, or already used';
    RETURN;
  END IF;

  -- Check token expiration
  v_token_expires_at := (v_token_data->>'token_expires_at')::TIMESTAMP WITH TIME ZONE;
  IF v_token_expires_at IS NOT NULL AND v_token_expires_at < NOW() THEN
    RETURN QUERY SELECT FALSE, NULL::JSONB, 'Token has expired';
    RETURN;
  END IF;

  -- If IC number is provided, validate it
  IF p_ic_number != '' AND v_candidate.ic_number != p_ic_number THEN
    RETURN QUERY SELECT FALSE, NULL::JSONB, 'IC number does not match';
    RETURN;
  END IF;

  -- Return success with candidate data
  RETURN QUERY SELECT
    TRUE,
    row_to_json(v_candidate.*)::JSONB,
    NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
