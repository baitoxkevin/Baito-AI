-- Add is_supervisor column to crew_assignments table
ALTER TABLE crew_assignments
  ADD COLUMN IF NOT EXISTS is_supervisor boolean NOT NULL DEFAULT false;

-- Create index for is_supervisor column
CREATE INDEX IF NOT EXISTS idx_crew_assignments_is_supervisor 
  ON crew_assignments(is_supervisor);

-- Create function to validate supervisor assignments
CREATE OR REPLACE FUNCTION validate_supervisor_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a supervisor assignment
  IF NEW.is_supervisor THEN
    -- Check if the candidate has enough experience (2+ years)
    IF EXISTS (
      SELECT 1 FROM candidates
      WHERE id = NEW.assigned_to
      AND experience_years < 2
    ) THEN
      RAISE EXCEPTION 'Supervisors must have at least 2 years of experience';
    END IF;

    -- Check if we're not exceeding the required number of supervisors
    IF (
      SELECT COUNT(*) 
      FROM crew_assignments 
      WHERE project_id = NEW.project_id 
      AND is_supervisor = true
      AND id != NEW.id
    ) >= (
      SELECT supervisors_required 
      FROM projects 
      WHERE id = NEW.project_id
    ) THEN
      RAISE EXCEPTION 'Maximum number of supervisors already assigned';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for supervisor validation
DROP TRIGGER IF EXISTS validate_supervisor_assignment_trigger ON crew_assignments;
CREATE TRIGGER validate_supervisor_assignment_trigger
  BEFORE INSERT OR UPDATE ON crew_assignments
  FOR EACH ROW
  WHEN (NEW.is_supervisor = true)
  EXECUTE FUNCTION validate_supervisor_assignment();

-- Update existing crew assignments to ensure is_supervisor is set
UPDATE crew_assignments
SET is_supervisor = false
WHERE is_supervisor IS NULL;
