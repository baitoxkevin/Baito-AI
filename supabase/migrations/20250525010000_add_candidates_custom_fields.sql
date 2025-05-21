-- Add custom_fields JSONB column to candidates table
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS custom_fields JSONB;

-- Comment explaining the purpose of this column
COMMENT ON COLUMN candidates.custom_fields IS 'Stores additional candidate data like skills, experience, and other custom attributes';