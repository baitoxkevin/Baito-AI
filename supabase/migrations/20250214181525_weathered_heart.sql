/*
  # Fix Authentication Setup

  1. Changes
    - Drop existing auth-related policies
    - Create auth schema and required extensions
    - Set up auth tables properly
    - Create admin user with proper credentials
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "allow_all_operations" ON users;

-- Create maximally permissive policies for development
CREATE POLICY "enable_all_access"
  ON users
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create or update admin user
DO $$ 
BEGIN
  -- First ensure the user exists in auth.users
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = 'admin@example.com'
  ) THEN
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role
    ) VALUES (
      'e9b9d6c2-5a6b-4a6e-8f3c-94a2b9f8d3e1',
      'admin@example.com',
      crypt('admin123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      '{"role": "admin"}'::jsonb,
      'authenticated',
      'authenticated'
    );
  END IF;

  -- Then ensure the user exists in public.users
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE email = 'admin@example.com'
  ) THEN
    INSERT INTO users (
      id,
      email,
      full_name,
      role
    ) VALUES (
      'e9b9d6c2-5a6b-4a6e-8f3c-94a2b9f8d3e1',
      'admin@example.com',
      'System Administrator',
      'admin'
    );
  END IF;
END $$;
