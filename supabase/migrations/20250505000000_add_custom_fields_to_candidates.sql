-- Add custom_fields JSONB column to candidates table
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS custom_fields JSONB;

-- Add unique_id column to candidates table
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS unique_id TEXT;

-- Create index on unique_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_candidates_unique_id ON candidates(unique_id);

-- Comment explaining the purpose of these columns
COMMENT ON COLUMN candidates.custom_fields IS 'Stores additional candidate data like skills, experience, and other custom attributes';
COMMENT ON COLUMN candidates.unique_id IS 'Unique identifier for the candidate, used for reference and tracking';