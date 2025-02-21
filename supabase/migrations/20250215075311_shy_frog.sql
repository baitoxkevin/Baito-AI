-- Create crew_assignments table
CREATE TABLE IF NOT EXISTS crew_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  position_number integer NOT NULL,
  assigned_to uuid REFERENCES candidates(id),
  assigned_at timestamptz,
  status text NOT NULL DEFAULT 'vacant' CHECK (status IN ('vacant', 'assigned')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(project_id, position_number)
);

-- Create indexes
CREATE INDEX idx_crew_assignments_project ON crew_assignments(project_id);
CREATE INDEX idx_crew_assignments_assigned_to ON crew_assignments(assigned_to);

-- Enable RLS
ALTER TABLE crew_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "enable_all_crew_assignments"
  ON crew_assignments
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create trigger for updating crew assignments
CREATE OR REPLACE FUNCTION create_crew_assignments()
RETURNS TRIGGER AS $$
BEGIN
  -- Create crew assignment slots when crew_count is set or updated
  IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND OLD.crew_count != NEW.crew_count) THEN
    -- Delete existing assignments if crew count is reduced
    IF TG_OP = 'UPDATE' AND OLD.crew_count > NEW.crew_count THEN
      DELETE FROM crew_assignments
      WHERE project_id = NEW.id AND position_number > NEW.crew_count;
    END IF;
    
    -- Insert new assignments
    FOR i IN 1..NEW.crew_count LOOP
      INSERT INTO crew_assignments (project_id, position_number)
      VALUES (NEW.id, i)
      ON CONFLICT (project_id, position_number) DO NOTHING;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS create_crew_assignments_trigger ON projects;
CREATE TRIGGER create_crew_assignments_trigger
  AFTER INSERT OR UPDATE OF crew_count ON projects
  FOR EACH ROW
  EXECUTE FUNCTION create_crew_assignments();
