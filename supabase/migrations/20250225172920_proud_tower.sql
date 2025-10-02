/*
  # Configure username validation

  1. Changes
    - Add username validation with proper error handling
    - Set up triggers and functions for username management
    - Add indexes for performance
*/

-- Function to validate username format
CREATE OR REPLACE FUNCTION validate_username(username text)
RETURNS boolean AS $$
BEGIN
  RETURN username ~ '^[a-zA-Z0-9_]{3,30}$';
END;
$$ LANGUAGE plpgsql;

-- Function to handle username validation in metadata
CREATE OR REPLACE FUNCTION validate_username_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Only validate if username is being set/updated
  IF NEW.raw_user_meta_data ? 'username' THEN
    IF NOT validate_username(NEW.raw_user_meta_data->>'username') THEN
      RAISE EXCEPTION 'Username must be 3-30 characters long and contain only letters, numbers, and underscores';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for username validation
DROP TRIGGER IF EXISTS validate_username_trigger ON auth.users;
CREATE TRIGGER validate_username_trigger
  BEFORE INSERT OR UPDATE OF raw_user_meta_data
  ON auth.users
  FOR EACH ROW
  WHEN (NEW.raw_user_meta_data ? 'username')
  EXECUTE FUNCTION validate_username_metadata();

-- Add index for username lookups in metadata
CREATE INDEX IF NOT EXISTS users_auth_username_meta_idx 
  ON auth.users USING gin ((raw_user_meta_data->'username'));

-- Function to ensure username uniqueness
CREATE OR REPLACE FUNCTION ensure_username_unique()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.raw_user_meta_data ? 'username' THEN
    IF EXISTS (
      SELECT 1 FROM auth.users
      WHERE raw_user_meta_data->>'username' = NEW.raw_user_meta_data->>'username'
      AND id != NEW.id
    ) THEN
      RAISE EXCEPTION 'Username already exists';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for username uniqueness
DROP TRIGGER IF EXISTS ensure_username_unique_trigger ON auth.users;
CREATE TRIGGER ensure_username_unique_trigger
  BEFORE INSERT OR UPDATE OF raw_user_meta_data
  ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION ensure_username_unique();

-- Sync valid usernames from users table to auth.users metadata
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT u.id, u.username 
    FROM users u 
    WHERE u.username IS NOT NULL 
    AND validate_username(u.username)
  ) LOOP
    UPDATE auth.users
    SET raw_user_meta_data = 
      COALESCE(raw_user_meta_data, '{}'::jsonb) || 
      jsonb_build_object('username', r.username)
    WHERE id = r.id;
  END LOOP;
END $$;