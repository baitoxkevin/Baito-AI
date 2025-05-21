/*
  # Fix Database Relationships

  1. Changes
    - Add proper foreign key relationships between tables
    - Enable RLS on all tables
    - Add appropriate policies

  2. Tables Modified
    - projects: Add proper foreign key relationships to users table
    - users: Add proper role enum and structure

  3. Security
    - Enable RLS
    - Add policies for data access
*/

-- Create Enums if they don't exist
DO $$ BEGIN
  CREATE TYPE UserRole AS ENUM (
    'super_admin',
    'admin',
    'manager',
    'client',
    'staff'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE TaskStatus AS ENUM (
    'backlog',
    'todo',
    'doing',
    'done'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create Users Table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role UserRole NOT NULL,
  is_super_admin BOOLEAN DEFAULT FALSE,
  company_name TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  raw_user_meta_data JSONB,
  raw_app_meta_data JSONB
);

-- Add new columns to projects table if they don't exist
DO $$ BEGIN
  ALTER TABLE projects 
    ADD COLUMN IF NOT EXISTS color TEXT,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
EXCEPTION
  WHEN undefined_column THEN null;
END $$;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "Super admins can do everything on users" ON users;
  DROP POLICY IF EXISTS "Users can read their own data" ON users;
  DROP POLICY IF EXISTS "Super admins can manage all projects" ON projects;
  DROP POLICY IF EXISTS "Regular users can only see non-deleted projects" ON projects;
END $$;

-- Create new policies
CREATE POLICY "Super admins can do everything on users"
  ON users FOR ALL TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE is_super_admin = TRUE
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users WHERE is_super_admin = TRUE
    )
  );

CREATE POLICY "Users can read their own data"
  ON users FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Super admins can manage all projects"
  ON projects FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_super_admin = true
    )
  );

CREATE POLICY "Regular users can only see non-deleted projects"
  ON projects FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_super_admin = true
    )
  );