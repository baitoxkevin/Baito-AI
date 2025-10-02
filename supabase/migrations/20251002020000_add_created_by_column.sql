-- ========================================
-- MIGRATION 1: Add created_by column
-- ========================================

-- Add the column
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);

-- Add comment
COMMENT ON COLUMN projects.created_by IS 'User ID of the person who created this project';

-- Backfill existing projects
UPDATE projects
SET created_by = manager_id
WHERE created_by IS NULL
  AND manager_id IS NOT NULL;

-- Verify
SELECT
  COUNT(*) as total_projects,
  COUNT(created_by) as with_creator
FROM projects;
