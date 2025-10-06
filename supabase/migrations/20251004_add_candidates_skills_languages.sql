-- Migration: Add skills and languages columns to candidates table
-- Date: October 4, 2025
-- Purpose: Fix Bug #2 and Bug #4 from testing

-- Add skills column (TEXT[] for array of strings)
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS skills TEXT[];

-- Add languages column (TEXT[] for array of strings)
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS languages TEXT[];

-- Create GIN indexes for efficient array searching
CREATE INDEX IF NOT EXISTS idx_candidates_skills
ON candidates USING GIN(skills);

CREATE INDEX IF NOT EXISTS idx_candidates_languages
ON candidates USING GIN(languages);

-- Set default empty arrays for existing rows
UPDATE candidates
SET skills = '{}'
WHERE skills IS NULL;

UPDATE candidates
SET languages = '{}'
WHERE languages IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN candidates.skills IS 'Array of candidate skills (e.g., ["forklift", "warehouse", "customer service"])';
COMMENT ON COLUMN candidates.languages IS 'Array of languages spoken (e.g., ["English", "Mandarin", "Malay"])';
