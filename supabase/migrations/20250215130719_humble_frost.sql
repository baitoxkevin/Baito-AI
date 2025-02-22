-- First, ensure the crew_assignments table exists
CREATE TABLE IF NOT EXISTS crew_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  position_number integer NOT NULL,
  assigned_to uuid REFERENCES candidates(id),
  is_supervisor boolean NOT NULL DEFAULT false,
  assigned_at timestamptz,
  status text NOT NULL DEFAULT 'vacant' CHECK (status IN ('vacant', 'assigned')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(project_id, position_number)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_crew_assignments_project ON crew_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_crew_assignments_assigned_to ON crew_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crew_assignments_is_supervisor ON crew_assignments(is_supervisor);

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

-- Create function to update project filled positions
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

-- Create trigger for updating filled positions
DROP TRIGGER IF EXISTS update_project_filled_positions_trigger ON crew_assignments;
CREATE TRIGGER update_project_filled_positions_trigger
  AFTER INSERT OR UPDATE OR DELETE ON crew_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_project_filled_positions();

-- Enable RLS
ALTER TABLE crew_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "enable_all_access"
  ON crew_assignments
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);
