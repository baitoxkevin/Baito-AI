-- Add created_by column to projects table for tracking project creators
-- Migration: Add created_by field to track who created each project

-- Add the created_by column
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);

-- Add comment for documentation
COMMENT ON COLUMN projects.created_by IS 'User ID of the person who created this project';

-- Update existing projects to set created_by from manager_id as a fallback
-- (Only for projects where created_by is NULL and manager_id exists)
UPDATE projects
SET created_by = manager_id
WHERE created_by IS NULL
  AND manager_id IS NOT NULL;

-- Grant necessary permissions
GRANT SELECT ON projects TO authenticated;
GRANT UPDATE (created_by) ON projects TO authenticated;
