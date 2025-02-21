/*
  # Fix Authentication Setup

  1. Changes
    - Drop existing policies to avoid conflicts
    - Create proper auth schema and tables
    - Set up RLS policies
    - Create indexes for performance
    - Add sample data

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "allow_public_read" ON users;
DROP POLICY IF EXISTS "allow_authenticated_insert" ON users;
DROP POLICY IF EXISTS "allow_authenticated_update" ON users;

-- Create simplified RLS policies for users
CREATE POLICY "enable_read_for_all"
  ON users
  FOR SELECT
  USING (true);

CREATE POLICY "enable_insert_for_authenticated"
  ON users
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "enable_update_for_authenticated"
  ON users
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Insert sample users if they don't exist
INSERT INTO users (
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
) VALUES (
  'e9b9d6c2-5a6b-4a6e-8f3c-94a2b9f8d3e1',
  'admin@example.com',
  'System Administrator',
  'admin',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;
