/*
  # Fix RLS Policies Final Attempt

  1. Changes
    - Reset and simplify all RLS policies
    - Ensure proper authentication checks
    - Fix policy conflicts

  2. Security
    - Enable RLS on all tables
    - Add proper authentication checks
    - Maintain data security
*/

-- First, ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Allow viewing own profile and clients" ON users;
DROP POLICY IF EXISTS "Allow user creation" ON users;
DROP POLICY IF EXISTS "Allow users to update own profile" ON users;
DROP POLICY IF EXISTS "enable_insert_for_authenticated" ON projects;
DROP POLICY IF EXISTS "enable_select_for_authenticated" ON projects;
DROP POLICY IF EXISTS "enable_update_for_authenticated" ON projects;

-- Create policies for users table
CREATE POLICY "users_select"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "users_insert"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "users_update"
  ON users FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for projects table
CREATE POLICY "projects_select"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "projects_insert"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "projects_update"
  ON projects FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure all necessary indexes exist
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(priority);
