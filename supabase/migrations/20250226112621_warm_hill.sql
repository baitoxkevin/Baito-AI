-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON projects;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON projects;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON projects;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON projects;

-- Create new policies with proper access control
CREATE POLICY "Enable read access for authenticated users"
  ON projects
  FOR SELECT
  TO authenticated
  USING (
    -- Allow access if:
    -- 1. User is the client
    auth.uid() = client_id OR
    -- 2. User is the manager
    auth.uid() = manager_id OR
    -- 3. User is a super admin
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_super_admin = true
    )
  );

CREATE POLICY "Enable insert access for authenticated users"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow insert if:
    -- 1. User is a super admin
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_super_admin = true
    ) OR
    -- 2. User is a manager
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'manager'
    )
  );

CREATE POLICY "Enable update access for authenticated users"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (
    -- Allow update if:
    -- 1. User is the manager of the project
    auth.uid() = manager_id OR
    -- 2. User is a super admin
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_super_admin = true
    )
  )
  WITH CHECK (
    -- Same conditions as USING clause
    auth.uid() = manager_id OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_super_admin = true
    )
  );

CREATE POLICY "Enable delete access for authenticated users"
  ON projects
  FOR DELETE
  TO authenticated
  USING (
    -- Allow delete if:
    -- 1. User is the manager of the project
    auth.uid() = manager_id OR
    -- 2. User is a super admin
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_super_admin = true
    )
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_start_date ON projects(start_date);
CREATE INDEX IF NOT EXISTS idx_projects_end_date ON projects(end_date);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_manager_id ON projects(manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_projects_updated_at();