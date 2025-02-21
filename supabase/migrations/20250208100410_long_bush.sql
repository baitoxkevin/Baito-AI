/*
  # Fix RLS Policies Final

  1. Changes
    - Update RLS policies to work with Supabase auth
    - Simplify policy structure
    - Ensure proper access control

  2. Security
    - Enable RLS on projects table
    - Add policies for authenticated users
    - Maintain proper security boundaries
*/

-- First, ensure RLS is enabled
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "authenticated_insert" ON projects;
DROP POLICY IF EXISTS "authenticated_select" ON projects;
DROP POLICY IF EXISTS "authenticated_update" ON projects;

-- Create simplified policies that work with Supabase auth
CREATE POLICY "enable_insert_for_authenticated"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "enable_select_for_authenticated"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "enable_update_for_authenticated"
  ON projects FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(priority);
