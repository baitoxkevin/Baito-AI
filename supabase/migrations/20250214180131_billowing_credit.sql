-- First, ensure the users table exists and has the necessary columns
DO $$ 
BEGIN
  -- Add role column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE users ADD COLUMN role text NOT NULL DEFAULT 'client';
  END IF;
END $$;

-- Insert superadmin user if it doesn't exist
INSERT INTO users (
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
)
VALUES (
  'e9b9d6c2-5a6b-4a6e-8f3c-94a2b9f8d3e1',
  'admin@example.com',
  'System Administrator',
  'admin',
  now(),
  now()
)
ON CONFLICT (email) DO UPDATE
SET role = 'admin'
WHERE users.email = 'admin@example.com';
