-- Migration to add candidate public links functionality

-- Create table for storing public form links
CREATE TABLE IF NOT EXISTS candidate_public_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  token UUID NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  
  -- Track usage
  last_accessed TIMESTAMP WITH TIME ZONE,
  access_count INTEGER DEFAULT 0
);

-- Add index for faster token lookup
CREATE INDEX IF NOT EXISTS idx_candidate_public_links_token ON candidate_public_links(token);

-- Add index for candidate lookup
CREATE INDEX IF NOT EXISTS idx_candidate_public_links_candidate_id ON candidate_public_links(candidate_id);

-- Add RLS policies to secure the table
ALTER TABLE candidate_public_links ENABLE ROW LEVEL SECURITY;

-- Allow any authenticated user to view public links they created
CREATE POLICY "Users can view their own public links" ON candidate_public_links
  FOR SELECT USING (
    auth.uid() IN (
      SELECT created_by FROM candidates WHERE id = candidate_id
    )
  );

-- Allow any authenticated user to create public links for candidates they own
CREATE POLICY "Users can create public links for their candidates" ON candidate_public_links
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT created_by FROM candidates WHERE id = candidate_id
    )
  );

-- Allow any authenticated user to update public links they created
CREATE POLICY "Users can update their own public links" ON candidate_public_links
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT created_by FROM candidates WHERE id = candidate_id
    )
  );

-- Allow any authenticated user to delete public links they created
CREATE POLICY "Users can delete their own public links" ON candidate_public_links
  FOR DELETE USING (
    auth.uid() IN (
      SELECT created_by FROM candidates WHERE id = candidate_id
    )
  );

-- Create function to check if a public form link is valid
CREATE OR REPLACE FUNCTION check_candidate_public_link(link_token UUID)
RETURNS TABLE (
  candidate_id UUID,
  is_valid BOOLEAN,
  message TEXT
) AS $$
DECLARE
  link_record RECORD;
BEGIN
  -- Check if the link exists
  SELECT * FROM candidate_public_links
  WHERE token = link_token
  INTO link_record;
  
  -- Link not found
  IF link_record.id IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, FALSE, 'Link not found'::TEXT;
    RETURN;
  END IF;
  
  -- Link is not active
  IF NOT link_record.active THEN
    RETURN QUERY SELECT link_record.candidate_id, FALSE, 'Link is inactive'::TEXT;
    RETURN;
  END IF;
  
  -- Link is expired
  IF link_record.expires_at < NOW() THEN
    RETURN QUERY SELECT link_record.candidate_id, FALSE, 'Link has expired'::TEXT;
    RETURN;
  END IF;
  
  -- Update access count and last accessed time
  UPDATE candidate_public_links
  SET 
    access_count = access_count + 1,
    last_accessed = NOW()
  WHERE token = link_token;
  
  -- Link is valid
  RETURN QUERY SELECT link_record.candidate_id, TRUE, 'Valid link'::TEXT;
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create API function to validate a public link token without authentication
CREATE OR REPLACE FUNCTION public_validate_token(link_token UUID)
RETURNS TABLE (
  candidate_id UUID,
  is_valid BOOLEAN,
  message TEXT
) AS $$
BEGIN
  RETURN QUERY SELECT * FROM check_candidate_public_link(link_token);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add bypass RLS policy for the public_validate_token function
ALTER FUNCTION public_validate_token(UUID) SET search_path = public, pg_temp;
ALTER FUNCTION public_validate_token(UUID) SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE candidate_public_links IS 'Stores shareable public form links for candidates to update their own information';
COMMENT ON COLUMN candidate_public_links.token IS 'Unique token used in the public URL';
COMMENT ON COLUMN candidate_public_links.expires_at IS 'Timestamp when this link becomes invalid';
COMMENT ON COLUMN candidate_public_links.active IS 'Whether this link is currently active';
COMMENT ON FUNCTION check_candidate_public_link IS 'Checks if a candidate public link is valid and updates access statistics';
COMMENT ON FUNCTION public_validate_token IS 'Public API to validate a token without authentication';