-- Add created_by column to candidates table to track who created each profile
-- This will store the user's full name (not UUID) for easy reference in messages

-- Add the created_by column to store the creator's name
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS created_by TEXT;

-- Add an index for better query performance
CREATE INDEX IF NOT EXISTS idx_candidates_created_by ON candidates(created_by);

-- Update the column comment for documentation
COMMENT ON COLUMN candidates.created_by IS 'Full name of the user who created this candidate profile';

-- For existing records, we can set a default value or leave as NULL
-- NULL values will represent profiles created before this tracking was implemented

-- Optional: If you want to track the user ID as well for more robust tracking
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES auth.users(id);

-- Add index for user ID lookups
CREATE INDEX IF NOT EXISTS idx_candidates_created_by_user_id ON candidates(created_by_user_id);

-- Add comment for the user ID column
COMMENT ON COLUMN candidates.created_by_user_id IS 'User ID of the user who created this candidate profile';

-- Update RLS policies to ensure users can see the created_by information
-- (The existing SELECT policies already allow public read access, so no changes needed)

-- Create a function to get the current user's name for easy use in the application
CREATE OR REPLACE FUNCTION get_current_user_name()
RETURNS TEXT AS $$
DECLARE
  user_name TEXT;
BEGIN
  -- Try to get the user's full name from the users table
  SELECT full_name INTO user_name
  FROM users
  WHERE id = auth.uid();
  
  -- If no full name, try email
  IF user_name IS NULL THEN
    SELECT email INTO user_name
    FROM auth.users
    WHERE id = auth.uid();
  END IF;
  
  RETURN user_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_current_user_name() TO authenticated;

-- Create a trigger to automatically set created_by fields when a candidate is created
CREATE OR REPLACE FUNCTION set_candidate_created_by()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set if not already provided
  IF NEW.created_by IS NULL THEN
    NEW.created_by := get_current_user_name();
  END IF;
  
  IF NEW.created_by_user_id IS NULL THEN
    NEW.created_by_user_id := auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER set_candidate_created_by_trigger
  BEFORE INSERT ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION set_candidate_created_by();

-- Add comment for the trigger
COMMENT ON TRIGGER set_candidate_created_by_trigger ON candidates IS 'Automatically sets created_by fields when a candidate is created';