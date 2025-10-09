-- Add experience_tags field to candidates table
-- This allows filtering candidates by their job experience types
-- e.g., "Promoter", "Mystery Shopper", "Supervisor", "Runner", etc.

ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS experience_tags TEXT[] DEFAULT '{}';

-- Create GIN index for fast tag-based queries
CREATE INDEX IF NOT EXISTS idx_candidates_experience_tags
ON candidates USING GIN(experience_tags);

-- Update existing candidates to extract tags from profile/skills if available
-- This is a best-effort migration for existing data
UPDATE candidates
SET experience_tags = ARRAY(
  SELECT DISTINCT LOWER(tag)
  FROM unnest(COALESCE(skills, ARRAY[]::TEXT[])) AS tag
  WHERE tag IS NOT NULL AND tag != ''
)
WHERE experience_tags = '{}' AND skills IS NOT NULL;

COMMENT ON COLUMN candidates.experience_tags IS
'Array of job role tags extracted from work experience (e.g., Promoter, Mystery Shopper, Supervisor) for filtering and matching';
