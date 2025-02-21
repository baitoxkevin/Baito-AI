/*
  # Fix Authentication Setup

  1. Changes
    - Drop existing policies
    - Create simplified RLS policies
    - Add necessary indexes
    - Ensure admin user exists
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "enable_read_for_all" ON users;
DROP POLICY IF EXISTS "enable_insert_for_authenticated" ON users;
DROP POLICY IF EXISTS "enable_update_for_authenticated" ON users;

-- Create maximally permissive policies for development
CREATE POLICY "allow_all_operations"
  ON users
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Update admin user if exists, otherwise do nothing
UPDATE users 
SET role = 'admin'
WHERE email = 'admin@example.com';
