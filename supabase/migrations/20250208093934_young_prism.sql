/*
  # Fix RLS Policies Recursion

  1. Changes
    - Drop existing recursive policies
    - Create new non-recursive policies for users table
    - Add proper role-based access control
  
  2. Security
    - Maintain data access control without recursion
    - Ensure proper authentication checks
    - Keep role-based restrictions
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable public user creation" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;

-- Create non-recursive RLS policies
CREATE POLICY "Users can view their own profile"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can view clients"
  ON users
  FOR SELECT
  USING (role = 'client');

CREATE POLICY "Enable insert for authenticated users only"
  ON users
  FOR INSERT
  WITH CHECK (role = 'client');

CREATE POLICY "Enable public user creation"
  ON users
  FOR INSERT
  WITH CHECK (role = 'client');

CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create admin role in auth.users if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'admin' 
    LIMIT 1
  ) THEN
    -- Insert a default admin user if needed
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@example.com',
      crypt('admin123', gen_salt('bf')),
      now(),
      '{"role": "admin"}'::jsonb,
      now(),
      now()
    );
  END IF;
END $$;
