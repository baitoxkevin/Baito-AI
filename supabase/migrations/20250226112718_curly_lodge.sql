-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON projects;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON projects;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON projects;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON projects;

-- Create new policies with public read access
CREATE POLICY "Allow public read access to projects"
  ON projects
  FOR SELECT
  TO public
  USING (true);

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