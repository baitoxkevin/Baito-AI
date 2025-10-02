-- Migration to allow NULL values for candidate emails

-- First, drop the UNIQUE constraint (which implicitly includes NOT NULL)
ALTER TABLE candidates
DROP CONSTRAINT IF EXISTS candidates_email_key;

-- Allow NULL for the email column
ALTER TABLE candidates
ALTER COLUMN email DROP NOT NULL;

-- Add a unique constraint that ignores NULL values
CREATE UNIQUE INDEX IF NOT EXISTS idx_candidates_email_unique ON candidates (email)
WHERE email IS NOT NULL;

-- Add some explanation comments
COMMENT ON COLUMN candidates.email IS 'Candidate email address, can be NULL for candidates without email. If provided, must be unique.';