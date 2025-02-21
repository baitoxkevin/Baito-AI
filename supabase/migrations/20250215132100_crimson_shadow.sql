-- Drop existing function and triggers
DROP TRIGGER IF EXISTS validate_supervisor_assignment_trigger ON crew_assignments;
DROP FUNCTION IF EXISTS validate_supervisor_assignment();

-- Create updated function without experience requirement
CREATE OR REPLACE FUNCTION validate_supervisor_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a supervisor assignment
  IF NEW.is_supervisor THEN
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

  -- If this is a crew member being assigned to a supervisor
  IF NEW.supervisor_id IS NOT NULL THEN
    -- Verify the supervisor exists and is actually a supervisor
    IF NOT EXISTS (
      SELECT 1 
      FROM crew_assignments
      WHERE project_id = NEW.project_id
      AND assigned_to = NEW.supervisor_id
      AND is_supervisor = true
    ) THEN
      RAISE EXCEPTION 'Invalid supervisor assignment';
    END IF;

    -- Check if supervisor has reached their maximum crew members (default max: 5)
    IF (
      SELECT COUNT(*)
      FROM crew_assignments
      WHERE project_id = NEW.project_id
      AND supervisor_id = NEW.supervisor_id
    ) >= 5 THEN
      RAISE EXCEPTION 'Supervisor has reached maximum number of crew members';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger for supervisor validation
CREATE TRIGGER validate_supervisor_assignment_trigger
  BEFORE INSERT OR UPDATE ON crew_assignments
  FOR EACH ROW
  EXECUTE FUNCTION validate_supervisor_assignment();
