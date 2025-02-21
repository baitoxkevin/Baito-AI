/*
  # Fix RLS policies for user creation

  1. Changes
    - Drop existing restrictive policies
    - Create new policies that allow proper user creation
    - Maintain security while allowing necessary operations

  2. Security
    - Allow authenticated users to create clients
    - Allow viewing of client and manager records
    - Restrict updates appropriately
*/

-- First, drop existing restrictive policies
DROP POLICY IF EXISTS "users_select" ON users;
DROP POLICY IF EXISTS "users_insert" ON users;
DROP POLICY IF EXISTS "users_update" ON users;
DROP POLICY IF EXISTS "Allow customer creation" ON users;
DROP POLICY IF EXISTS "Allow customer updates" ON users;
DROP POLICY IF EXISTS "Allow viewing own profile and clients" ON users;

-- Create new, more permissive policies
CREATE POLICY "allow_read_clients_and_managers"
  ON users FOR SELECT
  TO authenticated
  USING (
    -- Anyone can read client and manager records
    role IN ('client', 'manager')
  );

CREATE POLICY "allow_create_clients"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Only allow creating client records
    role = 'client'
  );

CREATE POLICY "allow_update_own_record"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role, id);
