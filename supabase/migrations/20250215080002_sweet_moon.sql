-- First, drop the existing check constraint if it exists
ALTER TABLE projects DROP CONSTRAINT IF EXISTS check_filled_positions;

-- Add filled_positions column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'filled_positions'
  ) THEN
    ALTER TABLE projects ADD COLUMN filled_positions integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Add proper check constraint
ALTER TABLE projects
  ADD CONSTRAINT check_filled_positions 
  CHECK (filled_positions >= 0 AND filled_positions <= crew_count);

-- Create or replace function to update filled positions
CREATE OR REPLACE FUNCTION update_project_filled_positions()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the filled_positions count in projects table
  UPDATE projects
  SET filled_positions = (
    SELECT COUNT(*)
    FROM crew_assignments
    WHERE project_id = NEW.project_id
    AND status = 'assigned'
  )
  WHERE id = NEW.project_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for crew assignments
DROP TRIGGER IF EXISTS update_project_filled_positions_trigger ON crew_assignments;
CREATE TRIGGER update_project_filled_positions_trigger
  AFTER INSERT OR UPDATE OR DELETE ON crew_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_project_filled_positions();
