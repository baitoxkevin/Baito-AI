-- Standardize project status values and add constraints
-- This migration ensures consistency in status values across the application

-- 1. Update any existing status values with underscores to use hyphens
UPDATE projects 
SET status = REPLACE(status, '_', '-')
WHERE status LIKE '%_%';

-- 2. Create a function to validate status format (no underscores allowed)
CREATE OR REPLACE FUNCTION validate_status_format(status_value TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Ensure status doesn't contain underscores
    RETURN status_value NOT LIKE '%_%';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Add check constraint to projects table
ALTER TABLE projects
DROP CONSTRAINT IF EXISTS chk_project_status_format;

ALTER TABLE projects
ADD CONSTRAINT chk_project_status_format 
CHECK (validate_status_format(status));

-- 4. Add comment explaining the constraint
COMMENT ON CONSTRAINT chk_project_status_format ON projects IS 
'Ensures project status values use hyphens instead of underscores for consistency';

-- 5. Log the completion
DO $$
BEGIN
    RAISE NOTICE 'Status standardization migration completed successfully';
END $$;