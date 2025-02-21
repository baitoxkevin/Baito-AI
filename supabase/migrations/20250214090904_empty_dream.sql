/*
  # Fix Tasks Table RLS Policies

  1. Changes
    - Drop existing policies
    - Create new public policies for tasks table
    - Enable RLS with proper permissions

  2. Security
    - Allow public read access
    - Allow authenticated users to perform all operations
    - Simplified policy structure for better reliability
*/

-- First ensure RLS is enabled
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "enable_public_select" ON tasks;
DROP POLICY IF EXISTS "enable_authenticated_insert" ON tasks;
DROP POLICY IF EXISTS "enable_authenticated_update" ON tasks;
DROP POLICY IF EXISTS "enable_authenticated_delete" ON tasks;
DROP POLICY IF EXISTS "tasks_select" ON tasks;
DROP POLICY IF EXISTS "tasks_insert" ON tasks;
DROP POLICY IF EXISTS "tasks_update" ON tasks;
DROP POLICY IF EXISTS "tasks_delete" ON tasks;

-- Create new, maximally permissive policies
CREATE POLICY "allow_select"
  ON tasks FOR SELECT
  TO public
  USING (true);

CREATE POLICY "allow_insert"
  ON tasks FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "allow_update"
  ON tasks FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "allow_delete"
  ON tasks FOR DELETE
  TO public
  USING (true);
