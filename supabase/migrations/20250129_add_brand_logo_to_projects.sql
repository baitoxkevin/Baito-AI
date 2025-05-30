-- Add brand_logo column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS brand_logo TEXT;

-- Add a comment to describe the column
COMMENT ON COLUMN projects.brand_logo IS 'URL of the brand logo image for the project';