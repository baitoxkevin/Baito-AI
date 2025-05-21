-- Add JSONB columns for confirmed_staff and applicants to the projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS confirmed_staff JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS applicants JSONB DEFAULT '[]'::jsonb;

-- Add comment explaining the structure
COMMENT ON COLUMN projects.confirmed_staff IS 'Array of confirmed staff members: [{id, name, designation, photo, status, appliedDate, workingDates}]';
COMMENT ON COLUMN projects.applicants IS 'Array of applicant staff members: [{id, name, designation, photo, status, appliedDate, workingDates}]';

-- Create an index on confirmed_staff and applicants for faster lookup if needed
CREATE INDEX IF NOT EXISTS idx_projects_confirmed_staff ON projects USING GIN (confirmed_staff);
CREATE INDEX IF NOT EXISTS idx_projects_applicants ON projects USING GIN (applicants);