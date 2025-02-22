-- Create or replace view for crew assignments with supervisor info
CREATE OR REPLACE VIEW crew_assignments_with_supervisors AS
SELECT 
  ca.id,
  ca.project_id,
  ca.position_number,
  ca.assigned_to,
  ca.supervisor_id,
  ca.is_supervisor,
  ca.assigned_at,
  ca.status,
  ca.created_at,
  ca.updated_at,
  c.full_name as crew_member_name,
  c.email as crew_member_email,
  s.full_name as supervisor_name,
  s.email as supervisor_email
FROM crew_assignments ca
LEFT JOIN candidates c ON ca.assigned_to = c.id
LEFT JOIN candidates s ON ca.supervisor_id = s.id;

-- Grant necessary permissions
GRANT SELECT ON crew_assignments_with_supervisors TO public;

-- Create function to validate supervisor assignments
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

-- Create trigger for supervisor validation
DROP TRIGGER IF EXISTS validate_supervisor_assignment_trigger ON crew_assignments;
CREATE TRIGGER validate_supervisor_assignment_trigger
  BEFORE INSERT OR UPDATE ON crew_assignments
  FOR EACH ROW
  EXECUTE FUNCTION validate_supervisor_assignment();

-- Create function to handle supervisor removal
CREATE OR REPLACE FUNCTION handle_supervisor_removal()
RETURNS TRIGGER AS $$
BEGIN
  -- If a supervisor is being unassigned, remove their supervisor_id from crew members
  IF OLD.is_supervisor = true AND (NEW.is_supervisor = false OR NEW.assigned_to IS NULL) THEN
    UPDATE crew_assignments
    SET supervisor_id = NULL
    WHERE project_id = OLD.project_id
    AND supervisor_id = OLD.assigned_to;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for supervisor removal
DROP TRIGGER IF EXISTS handle_supervisor_removal_trigger ON crew_assignments;
CREATE TRIGGER handle_supervisor_removal_trigger
  BEFORE UPDATE ON crew_assignments
  FOR EACH ROW
  EXECUTE FUNCTION handle_supervisor_removal();
