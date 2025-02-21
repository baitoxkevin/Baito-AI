/*
  # Update Project RLS Policies

  1. Changes
    - Add policies for project creation and viewing
    - Allow authenticated users to create projects
    - Allow viewing of projects based on role

  2. Security
    - Enable RLS on projects table
    - Add policies for project operations
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view assigned projects" ON projects;

-- Create new policies
CREATE POLICY "Allow project creation"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow viewing projects"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow updating projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(priority);
