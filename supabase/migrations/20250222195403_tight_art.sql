/*
  # Fix Database Relationships

  1. Changes
    - Drop existing foreign key constraints
    - Recreate foreign key constraints with proper references
    - Update RLS policies to reflect the correct relationships

  2. Security
    - Maintain existing RLS policies
    - Ensure proper access control
*/

-- Drop existing foreign key constraints if they exist
DO $$ BEGIN
  ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_client_id_fkey;
  ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_manager_id_fkey;
  ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_deleted_by_fkey;
EXCEPTION
  WHEN undefined_object THEN null;
END $$;

-- Recreate foreign key constraints with proper references
ALTER TABLE projects
  ADD CONSTRAINT projects_client_id_fkey 
  FOREIGN KEY (client_id) 
  REFERENCES users(id)
  ON DELETE SET NULL;

ALTER TABLE projects
  ADD CONSTRAINT projects_manager_id_fkey 
  FOREIGN KEY (manager_id) 
  REFERENCES users(id)
  ON DELETE SET NULL;

ALTER TABLE projects
  ADD CONSTRAINT projects_deleted_by_fkey 
  FOREIGN KEY (deleted_by) 
  REFERENCES users(id)
  ON DELETE SET NULL;

-- Update RLS policies to ensure proper access
DROP POLICY IF EXISTS "Users can read all projects" ON projects;
CREATE POLICY "Users can read all projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL OR
    auth.uid() = client_id OR
    auth.uid() = manager_id OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_super_admin = true
    )
  );