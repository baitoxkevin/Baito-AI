-- Add soft delete columns to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Update RLS policies for projects table
DROP POLICY IF EXISTS "Super admins can manage all projects" ON projects;
CREATE POLICY "Super admins can manage all projects"
ON projects
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.is_super_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.is_super_admin = true
  )
);

-- Regular users can only see non-deleted projects
DROP POLICY IF EXISTS "Regular users can only see non-deleted projects" ON projects;
CREATE POLICY "Regular users can only see non-deleted projects"
ON projects
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  deleted_at IS NULL OR
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.is_super_admin = true
  )
);
