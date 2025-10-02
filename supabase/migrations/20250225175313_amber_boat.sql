/*
  # Fix RLS policies for user creation

  1. Changes
    - Drop and recreate RLS policies with proper handling for:
      - Initial user profile creation
      - Super admin management
      - User self-management
      - Basic user info access
  
  2. Security
    - Maintain proper access control
    - Allow initial profile creation
    - Preserve super admin privileges
*/

-- Temporarily disable RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Super admins can manage all users" ON users;
DROP POLICY IF EXISTS "Users can read their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Allow system to create initial user profiles" ON users;
DROP POLICY IF EXISTS "Allow reading basic user info" ON users;

-- Create new policies with proper handling
CREATE POLICY "Enable full access for super admins"
  ON users
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.is_super_admin = true
    )
  );

CREATE POLICY "Enable user profile creation"
  ON users
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow users to create their own profile
    id = auth.uid() OR
    -- Or if no profile exists yet for this auth user
    NOT EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
    )
  );

CREATE POLICY "Enable self profile management"
  ON users
  AS PERMISSIVE
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Enable self profile updates"
  ON users
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Enable basic user info access"
  ON users
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (true);

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;