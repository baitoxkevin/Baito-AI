-- Add brand_logo column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS brand_logo TEXT;

-- Add comment for documentation
COMMENT ON COLUMN projects.brand_logo IS 'URL of the brand logo image for the project';