/*
  # Fix RLS Policies

  1. Changes
    - Drop and recreate RLS policies with proper authentication checks
    - Ensure policies work with Supabase auth system
    - Add proper security checks

  2. Security
    - Enable RLS on projects table
    - Add policies for authenticated users
*/

-- First, ensure RLS is enabled
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow project creation" ON projects;
DROP POLICY IF EXISTS "Allow viewing projects" ON projects;
DROP POLICY IF EXISTS "Allow updating projects" ON projects;

-- Create new policies with proper auth checks
CREATE POLICY "authenticated_insert"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "authenticated_select"
  ON projects FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_update"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(priority);
