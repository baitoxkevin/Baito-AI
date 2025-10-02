/*
  # Add username authentication support
  
  1. Changes
    - Add username column to users table
    - Add unique constraint on username
    - Add trigger to sync username with auth.users metadata
  
  2. Security
    - Maintain existing RLS policies
    - Ensure username uniqueness
*/

-- Add username column if it doesn't exist
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text;

-- Create function to sync username with auth.users
CREATE OR REPLACE FUNCTION sync_username_to_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- Update auth.users metadata to include username
  UPDATE auth.users 
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('username', NEW.username)
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync username
DROP TRIGGER IF EXISTS sync_username_trigger ON users;
CREATE TRIGGER sync_username_trigger
  AFTER INSERT OR UPDATE OF username
  ON users
  FOR EACH ROW
  EXECUTE FUNCTION sync_username_to_auth();

-- Add index for username lookups
CREATE INDEX IF NOT EXISTS users_username_idx ON users (username);

-- Update existing users to have a username if they don't have one
UPDATE users 
SET username = LOWER(
  REGEXP_REPLACE(
    SPLIT_PART(email, '@', 1) || '_' || SUBSTRING(id::text, 1, 8),
    '[^a-zA-Z0-9_]',
    ''
  )
)
WHERE username = gen_random_uuid()::text;