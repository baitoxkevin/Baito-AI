/*
  # Add Event Types and Reference IDs

  1. Changes
    - Create event_types enum
    - Add event_type column to projects table
    - Add reference_id columns and auto-generation
  
  2. Security
    - Maintain existing RLS policies
*/

-- Create event_types enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_types') THEN
    CREATE TYPE event_types AS ENUM (
      'roving',
      'roadshow',
      'in-store',
      'ad-hoc',
      'corporate',
      'wedding',
      'concert',
      'conference',
      'other'
    );
  END IF;
END $$;

-- Add event_type column to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'event_type'
  ) THEN
    ALTER TABLE projects ADD COLUMN event_type event_types;
  END IF;
END $$;

-- Add unique ID generation functions
CREATE OR REPLACE FUNCTION generate_unique_id(prefix text)
RETURNS text AS $$
DECLARE
  new_id text;
  current_year text;
  sequence_number integer;
BEGIN
  current_year := to_char(current_timestamp, 'YY');
  
  -- Get the next sequence number for this prefix and year
  sequence_number := nextval(prefix || '_seq_' || current_year);
  
  -- Format: PREFIX-YY-XXXXX (e.g., CUST-23-00001)
  new_id := prefix || '-' || current_year || '-' || lpad(sequence_number::text, 5, '0');
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Create year-specific sequences if they don't exist
DO $$ 
DECLARE
  current_year text;
BEGIN
  current_year := to_char(current_timestamp, 'YY');
  
  -- Customer sequence
  EXECUTE format(
    'CREATE SEQUENCE IF NOT EXISTS cust_seq_%s START 1', 
    current_year
  );
  
  -- Project sequence
  EXECUTE format(
    'CREATE SEQUENCE IF NOT EXISTS proj_seq_%s START 1', 
    current_year
  );
  
  -- Manager sequence
  EXECUTE format(
    'CREATE SEQUENCE IF NOT EXISTS mgr_seq_%s START 1', 
    current_year
  );
END $$;

-- Add reference_id columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'reference_id'
  ) THEN
    ALTER TABLE users ADD COLUMN reference_id text UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'reference_id'
  ) THEN
    ALTER TABLE projects ADD COLUMN reference_id text UNIQUE;
  END IF;
END $$;

-- Create triggers for automatic ID generation
CREATE OR REPLACE FUNCTION set_reference_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'client' AND NEW.reference_id IS NULL THEN
    NEW.reference_id := generate_unique_id('CUST');
  ELSIF NEW.role = 'manager' AND NEW.reference_id IS NULL THEN
    NEW.reference_id := generate_unique_id('MGR');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_project_reference_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reference_id IS NULL THEN
    NEW.reference_id := generate_unique_id('PROJ');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_user_reference_id ON users;
CREATE TRIGGER set_user_reference_id
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_reference_id();

DROP TRIGGER IF EXISTS set_project_reference_id ON projects;
CREATE TRIGGER set_project_reference_id
  BEFORE INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION set_project_reference_id();

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_users_reference_id ON users(reference_id);
CREATE INDEX IF NOT EXISTS idx_projects_reference_id ON projects(reference_id);
CREATE INDEX IF NOT EXISTS idx_projects_event_type ON projects(event_type);
