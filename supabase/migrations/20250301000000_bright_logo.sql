/*
  Add logo_url to projects table
  
  This migration adds:
  1. A logo_url column to the projects table to store the URL to project logos
*/

-- Add logo_url column to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN projects.logo_url IS 'URL pointing to the project logo image';