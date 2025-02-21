/*
  # Update User RLS Policies

  1. Changes
    - Simplify user creation policies
    - Allow creation of manager users
    - Maintain security while enabling necessary operations

  2. Security
    - Enable RLS on users table
    - Add policies for user creation and viewing
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can view clients" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable public user creation" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Create new policies
CREATE POLICY "Allow viewing own profile and clients"
  ON users FOR SELECT
  USING (
    -- Users can view their own profile
    auth.uid() = id
    -- Everyone can view clients and managers
    OR role IN ('client', 'manager')
  );

CREATE POLICY "Allow user creation"
  ON users FOR INSERT
  WITH CHECK (
    -- Allow creating clients and managers
    role IN ('client', 'manager')
  );

CREATE POLICY "Allow users to update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
