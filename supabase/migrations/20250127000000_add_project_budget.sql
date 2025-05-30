-- Add budget field to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget DECIMAL(10, 2) DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN projects.budget IS 'Project budget amount in RM';