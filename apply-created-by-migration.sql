-- MANUAL MIGRATION: Add created_by to projects table
-- Run this in your Supabase SQL Editor

-- Step 1: Add the column
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- Step 2: Create index
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);

-- Step 3: Add comment
COMMENT ON COLUMN projects.created_by IS 'User ID of the person who created this project';

-- Step 4: Backfill existing projects (use manager as creator)
UPDATE projects
SET created_by = manager_id
WHERE created_by IS NULL
  AND manager_id IS NOT NULL;

-- Step 5: Verify the migration
SELECT
  COUNT(*) as total_projects,
  COUNT(created_by) as with_creator,
  COUNT(*) - COUNT(created_by) as without_creator
FROM projects;
