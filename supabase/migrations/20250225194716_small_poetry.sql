/*
  # Add Crew Assignments System

  1. New Tables
    - `crew_assignments`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `position_number` (integer)
      - `assigned_to` (uuid, references candidates)
      - `supervisor_id` (uuid, references candidates)
      - `is_supervisor` (boolean)
      - `assigned_at` (timestamptz)
      - `status` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Views
    - `crew_assignments_with_supervisors`
      - Combines crew assignments with candidate information
      - Includes supervisor details when applicable

  3. Security
    - Enable RLS on crew_assignments table
    - Add policies for authenticated users
*/

-- Create crew_assignments table
CREATE TABLE crew_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  position_number integer NOT NULL,
  assigned_to uuid REFERENCES candidates(id),
  supervisor_id uuid REFERENCES candidates(id),
  is_supervisor boolean DEFAULT false,
  assigned_at timestamptz,
  status text NOT NULL DEFAULT 'vacant' CHECK (status IN ('vacant', 'assigned')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(project_id, position_number)
);

-- Create view for crew assignments with candidate details
CREATE OR REPLACE VIEW crew_assignments_with_supervisors AS
SELECT 
  ca.*,
  c.full_name as crew_member_name,
  c.email as crew_member_email,
  COALESCE(
    (SELECT EXTRACT(YEAR FROM age(now(), date_of_birth))::integer 
     FROM candidates 
     WHERE id = c.id),
    0
  ) as crew_member_experience,
  s.full_name as supervisor_name,
  s.email as supervisor_email,
  COALESCE(
    (SELECT EXTRACT(YEAR FROM age(now(), date_of_birth))::integer 
     FROM candidates 
     WHERE id = s.id),
    0
  ) as supervisor_experience
FROM crew_assignments ca
LEFT JOIN candidates c ON ca.assigned_to = c.id
LEFT JOIN candidates s ON ca.supervisor_id = s.id;

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_crew_assignment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating timestamps
CREATE TRIGGER update_crew_assignment_timestamp
  BEFORE UPDATE ON crew_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_crew_assignment_timestamp();

-- Enable RLS
ALTER TABLE crew_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users"
  ON crew_assignments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users"
  ON crew_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
  ON crew_assignments
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create function to initialize crew assignments when a project is created
CREATE OR REPLACE FUNCTION initialize_crew_assignments()
RETURNS TRIGGER AS $$
BEGIN
  -- Create crew assignments for each position
  FOR i IN 1..NEW.crew_count LOOP
    INSERT INTO crew_assignments (
      project_id,
      position_number,
      status
    ) VALUES (
      NEW.id,
      i,
      'vacant'
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to initialize crew assignments
CREATE TRIGGER initialize_crew_assignments_trigger
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION initialize_crew_assignments();

-- Create function to update crew assignments when project crew count changes
CREATE OR REPLACE FUNCTION update_crew_assignments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.crew_count > OLD.crew_count THEN
    -- Add new positions
    FOR i IN OLD.crew_count + 1..NEW.crew_count LOOP
      INSERT INTO crew_assignments (
        project_id,
        position_number,
        status
      ) VALUES (
        NEW.id,
        i,
        'vacant'
      );
    END LOOP;
  ELSIF NEW.crew_count < OLD.crew_count THEN
    -- Remove excess positions if they're vacant
    DELETE FROM crew_assignments
    WHERE project_id = NEW.id
      AND position_number > NEW.crew_count
      AND status = 'vacant';
      
    -- If any positions to be removed are assigned, raise an error
    IF EXISTS (
      SELECT 1 FROM crew_assignments
      WHERE project_id = NEW.id
        AND position_number > NEW.crew_count
        AND status = 'assigned'
    ) THEN
      RAISE EXCEPTION 'Cannot reduce crew count: Some positions are still assigned';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update crew assignments count
CREATE TRIGGER update_crew_assignments_count_trigger
  AFTER UPDATE OF crew_count ON projects
  FOR EACH ROW
  WHEN (NEW.crew_count != OLD.crew_count)
  EXECUTE FUNCTION update_crew_assignments_count();

-- Create indexes for better performance
CREATE INDEX idx_crew_assignments_project ON crew_assignments(project_id);
CREATE INDEX idx_crew_assignments_assigned_to ON crew_assignments(assigned_to);
CREATE INDEX idx_crew_assignments_supervisor ON crew_assignments(supervisor_id);
CREATE INDEX idx_crew_assignments_status ON crew_assignments(status);