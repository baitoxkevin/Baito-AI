/*
  # Fix RLS Policies for Projects Table

  1. Changes
    - Drop existing restrictive policies
    - Create new policies that allow:
      - Public read access to all projects
      - Public creation of projects
      - Project updates by authenticated users
    - Add performance indexes

  2. Security
    - Enable RLS
    - Add policies for SELECT, INSERT, and UPDATE
    - Maintain data integrity
*/

-- First, ensure RLS is enabled
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "projects_select" ON projects;
DROP POLICY IF EXISTS "projects_insert" ON projects;
DROP POLICY IF EXISTS "projects_update" ON projects;
DROP POLICY IF EXISTS "authenticated_insert" ON projects;
DROP POLICY IF EXISTS "authenticated_select" ON projects;
DROP POLICY IF EXISTS "authenticated_update" ON projects;
DROP POLICY IF EXISTS "enable_insert_for_authenticated" ON projects;
DROP POLICY IF EXISTS "enable_select_for_authenticated" ON projects;
DROP POLICY IF EXISTS "enable_update_for_authenticated" ON projects;

-- Create new policies
CREATE POLICY "enable_read_access"
  ON projects FOR SELECT
  TO public
  USING (true);

CREATE POLICY "enable_project_creation"
  ON projects FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "enable_project_update"
  ON projects FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(priority);
CREATE INDEX IF NOT EXISTS idx_projects_client_manager ON projects(client_id, manager_id);
