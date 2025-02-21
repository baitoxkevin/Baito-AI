/*
  # Fix Tasks Table RLS Policies

  1. Changes
    - Drop existing policies
    - Create new permissive policies for authenticated users
    - Enable public access for tasks table

  2. Security
    - Enable RLS
    - Add policies for all CRUD operations
*/

-- First ensure RLS is enabled
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "tasks_select" ON tasks;
DROP POLICY IF EXISTS "tasks_insert" ON tasks;
DROP POLICY IF EXISTS "tasks_update" ON tasks;
DROP POLICY IF EXISTS "tasks_delete" ON tasks;

-- Create new, more permissive policies
CREATE POLICY "enable_public_select"
  ON tasks FOR SELECT
  TO public
  USING (true);

CREATE POLICY "enable_authenticated_insert"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "enable_authenticated_update"
  ON tasks FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "enable_authenticated_delete"
  ON tasks FOR DELETE
  TO authenticated
  USING (true);
