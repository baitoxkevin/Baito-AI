-- Add budget column to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS budget DECIMAL(10, 2) DEFAULT 0;

-- Add comment
COMMENT ON COLUMN projects.budget IS 'Project budget in MYR';