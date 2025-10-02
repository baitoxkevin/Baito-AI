/*
  # Fix RLS policies for users table

  1. Changes
    - Drop existing RLS policies
    - Create new policies that allow:
      - Super admins to manage all users
      - Users to read their own profile
      - Authenticated users to read basic user info
      - System to create initial user profiles
  
  2. Security
    - Enable RLS on users table
    - Ensure proper access control
    - Prevent unauthorized modifications
*/

-- Temporarily disable RLS to avoid conflicts
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Super admins can do everything on users" ON users;
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON users;

-- Create new policies
CREATE POLICY "Super admins can manage all users"
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

CREATE POLICY "Users can read their own profile"
  ON users
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON users
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Allow system to create initial user profiles"
  ON users
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow creating own profile
    id = auth.uid() OR
    -- Or if super admin
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.is_super_admin = true
    )
  );

CREATE POLICY "Allow reading basic user info"
  ON users
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (true);

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;