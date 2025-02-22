-- Drop existing check constraint
ALTER TABLE projects DROP CONSTRAINT IF EXISTS check_filled_positions;

-- Add proper check constraint that allows filled_positions to be NULL
ALTER TABLE projects
  ADD CONSTRAINT check_filled_positions 
  CHECK (filled_positions IS NULL OR (filled_positions >= 0 AND filled_positions <= crew_count));

-- Update filled_positions to be nullable with default 0
ALTER TABLE projects 
  ALTER COLUMN filled_positions DROP NOT NULL,
  ALTER COLUMN filled_positions SET DEFAULT 0;

-- Create or replace function to update filled positions
CREATE OR REPLACE FUNCTION update_project_filled_positions()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the filled_positions count in projects table
  WITH assignment_count AS (
    SELECT COUNT(*) as count
    FROM crew_assignments
    WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
    AND status = 'assigned'
  )
  UPDATE projects
  SET filled_positions = assignment_count.count
  FROM assignment_count
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger to handle all cases
DROP TRIGGER IF EXISTS update_project_filled_positions_trigger ON crew_assignments;
CREATE TRIGGER update_project_filled_positions_trigger
  AFTER INSERT OR UPDATE OR DELETE ON crew_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_project_filled_positions();

-- Update all projects to have correct filled_positions count
WITH project_counts AS (
  SELECT 
    project_id,
    COUNT(*) as filled_count
  FROM crew_assignments
  WHERE status = 'assigned'
  GROUP BY project_id
)
UPDATE projects p
SET filled_positions = COALESCE(pc.filled_count, 0)
FROM project_counts pc
WHERE p.id = pc.project_id;
