-- Create a new function to validate candidate authentication by ID and auth code
CREATE OR REPLACE FUNCTION public.public_validate_candidate_auth(
  candidate_id UUID,
  auth_code TEXT
)
RETURNS TABLE (
  is_valid BOOLEAN,
  message TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  candidate_record RECORD;
  ic_number TEXT;
BEGIN
  -- Check if the candidate exists
  SELECT * INTO candidate_record
  FROM public.candidates
  WHERE id = candidate_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Candidate not found';
    RETURN;
  END IF;

  -- Extract IC number from candidate data
  ic_number := candidate_record.ic_number;
  
  -- Check if the candidate has an IC number
  IF ic_number IS NULL OR ic_number = '' THEN
    RETURN QUERY SELECT false, 'Candidate has no IC number';
    RETURN;
  END IF;
  
  -- Try different authentication methods in order of security preference:
  -- 1. Base64 encoded token (first 4 + last 4 digits) - more secure for sharing
  -- 2. Numeric-only IC - less secure, used in admin interfaces
  -- 3. Raw IC - least secure, only for fallback
  
  -- Method 1: Check if auth_code is a Base64 encoded token
  DECLARE
    -- Get first 4 and last 4 characters of IC
    first_four TEXT := substring(ic_number, 1, 4);
    last_four TEXT := substring(ic_number, length(ic_number) - 3);
    -- Create expected Base64 token
    expected_token TEXT := encode(convert_to(first_four || '-' || last_four, 'UTF8'), 'base64');
  BEGIN
    -- Check if the auth_code matches the expected token
    IF auth_code = expected_token THEN
      RETURN QUERY SELECT true, 'Authentication successful (secure token)';
      RETURN;
    END IF;
  END;
  
  -- Method 2: Check if auth_code matches the numeric-only IC
  DECLARE
    -- Remove all non-numeric characters
    numeric_ic TEXT := regexp_replace(ic_number, '[^0-9]', '', 'g');
  BEGIN
    -- Check if the auth_code matches the numeric IC
    IF auth_code = numeric_ic THEN
      RETURN QUERY SELECT true, 'Authentication successful (numeric IC)';
      RETURN;
    END IF;
  END;
  
  -- Method 3: Check if auth_code matches the raw IC (least secure)
  IF auth_code = ic_number THEN
    RETURN QUERY SELECT true, 'Authentication successful (raw IC)';
    RETURN;
  END IF;
  
  -- If we get here, none of the methods matched
  RETURN QUERY SELECT false, 'Invalid authentication code';
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.public_validate_candidate_auth TO anon;
GRANT EXECUTE ON FUNCTION public.public_validate_candidate_auth TO authenticated;
GRANT EXECUTE ON FUNCTION public.public_validate_candidate_auth TO service_role;

COMMENT ON FUNCTION public.public_validate_candidate_auth IS 'Validates a candidate using their ID and an authentication code derived from their identification number.';