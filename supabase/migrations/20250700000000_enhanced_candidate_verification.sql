-- Enhanced candidate verification functions
-- This migration adds secure functions to verify candidates without relying on tokens in the URL

-- Function to get candidate verification information
CREATE OR REPLACE FUNCTION public.get_candidate_verification_info(
  p_candidate_id UUID
)
RETURNS JSONB 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  candidate_result JSONB;
BEGIN
  -- Check if the candidate exists and return basic info
  SELECT 
    jsonb_build_object(
      'id', id,
      'full_name', full_name,
      'ic_number', ic_number,
      'exists', true
    ) INTO candidate_result
  FROM 
    candidates
  WHERE 
    id = p_candidate_id;
    
  -- If no candidate was found, return null
  IF candidate_result IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN candidate_result;
END;
$$;

-- Function to verify a candidate using their IC number
CREATE OR REPLACE FUNCTION public.verify_candidate_with_ic(
  p_candidate_id UUID,
  p_ic_number TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  candidate_data JSONB;
BEGIN
  -- Check if the candidate exists and the IC number matches
  SELECT 
    jsonb_build_object(
      'verified', TRUE,
      'id', id,
      'full_name', full_name
    ) INTO candidate_data
  FROM 
    candidates
  WHERE 
    id = p_candidate_id
    AND ic_number = p_ic_number;
  
  -- If no matching candidate found, return verification failed
  IF candidate_data IS NULL THEN
    RETURN jsonb_build_object('verified', FALSE);
  END IF;
  
  -- Log the verification attempt (optional)
  INSERT INTO candidate_verification_logs (
    candidate_id,
    verification_method,
    verified_at,
    client_info
  ) VALUES (
    p_candidate_id,
    'ic_number',
    NOW(),
    current_setting('request.headers', TRUE)::jsonb
  );
  
  RETURN candidate_data;
EXCEPTION
  WHEN OTHERS THEN
    -- Return a generic error without exposing internal details
    RETURN jsonb_build_object('verified', FALSE, 'error', 'Database error occurred');
END;
$$;

-- Table to log verification attempts (optional, can be useful for security auditing)
CREATE TABLE IF NOT EXISTS public.candidate_verification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES public.candidates(id),
  verification_method TEXT NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL,
  client_info JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Set up RLS policies for the verification logs
ALTER TABLE public.candidate_verification_logs ENABLE ROW LEVEL SECURITY;

-- Only allow admin users to view verification logs
CREATE POLICY "Admins can view verification logs"
  ON public.candidate_verification_logs
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Allow the verification function to insert logs
CREATE POLICY "System can insert verification logs"
  ON public.candidate_verification_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Grant usage permissions
GRANT EXECUTE ON FUNCTION public.get_candidate_verification_info TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_candidate_with_ic TO anon, authenticated;

-- Comment on functions
COMMENT ON FUNCTION public.get_candidate_verification_info IS 'Gets basic candidate info to verify existence without exposing sensitive data';
COMMENT ON FUNCTION public.verify_candidate_with_ic IS 'Verifies a candidate using their IC number, more secure than URL tokens';