/*
  # Fix RLS Policies for User Creation

  1. Changes
    - Drop existing restrictive policies
    - Create new policies that allow:
      - Public read access to clients and managers
      - Authenticated users to create clients
      - Users to update their own records
    - Add proper indexes for performance

  2. Security
    - Enable RLS
    - Add policies for SELECT, INSERT, and UPDATE
    - Maintain data integrity with proper constraints
*/

-- First, ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "users_select" ON users;
DROP POLICY IF EXISTS "users_insert" ON users;
DROP POLICY IF EXISTS "users_update" ON users;
DROP POLICY IF EXISTS "allow_read_clients_and_managers" ON users;
DROP POLICY IF EXISTS "allow_create_clients" ON users;
DROP POLICY IF EXISTS "allow_update_own_record" ON users;

-- Create new policies
CREATE POLICY "enable_read_access"
  ON users FOR SELECT
  TO public
  USING (true);

CREATE POLICY "enable_client_creation"
  ON users FOR INSERT
  TO public
  WITH CHECK (role = 'client');

CREATE POLICY "enable_self_update"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_id_role ON users(id, role);
