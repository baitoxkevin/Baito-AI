/*
  # Add crew count and filled positions columns

  1. Changes
    - Add crew_count column to projects table
    - Add filled_positions column if not exists
    - Add index for crew_count for better query performance
*/

DO $$ 
BEGIN
  -- Add crew_count column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'crew_count'
  ) THEN
    ALTER TABLE projects ADD COLUMN crew_count integer NOT NULL DEFAULT 1;
  END IF;

  -- Add filled_positions column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'filled_positions'
  ) THEN
    ALTER TABLE projects ADD COLUMN filled_positions integer NOT NULL DEFAULT 0;
  END IF;

  -- Add index for crew_count
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'projects' AND indexname = 'idx_projects_crew_count'
  ) THEN
    CREATE INDEX idx_projects_crew_count ON projects(crew_count);
  END IF;
END $$;

-- Add constraint to ensure filled_positions doesn't exceed crew_count
ALTER TABLE projects DROP CONSTRAINT IF EXISTS check_filled_positions;
ALTER TABLE projects ADD CONSTRAINT check_filled_positions 
  CHECK (filled_positions <= crew_count);

-- Add constraint to ensure crew_count is positive
ALTER TABLE projects DROP CONSTRAINT IF EXISTS check_crew_count_positive;
ALTER TABLE projects ADD CONSTRAINT check_crew_count_positive 
  CHECK (crew_count > 0);
