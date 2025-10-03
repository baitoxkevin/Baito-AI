-- Create Baito Team User Accounts
-- Run this in Supabase SQL Editor or via API
-- Note: This requires admin/service role privileges

-- Method 1: Using Supabase Auth Admin API (Recommended)
-- You need to use the Supabase Dashboard -> Authentication -> Users -> "Invite user" or "Add user"
-- Or use the script: node create-team-users.js

-- Method 2: Create user profiles (if auth users already exist)
-- This prepares the user records in the public.users table

-- Ensure users table exists with proper structure
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can view their own profile') THEN
    CREATE POLICY "Users can view their own profile" ON public.users
      FOR SELECT USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can update their own profile') THEN
    CREATE POLICY "Users can update their own profile" ON public.users
      FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- Insert user profiles (will fail if auth users don't exist yet)
-- These are placeholders - actual auth users must be created via Supabase Auth
INSERT INTO public.users (id, email, full_name, role, created_at)
VALUES
  -- These UUIDs are placeholders - replace with actual auth.users IDs after creating auth accounts
  (gen_random_uuid(), 'jesley@baito.events', 'Jesley', 'user', NOW()),
  (gen_random_uuid(), 'winnie@baito.events', 'Winnie', 'user', NOW()),
  (gen_random_uuid(), 'ava@baito.events', 'Ava', 'user', NOW()),
  (gen_random_uuid(), 'jamilatulaili@baito.events', 'Jamila Tulaili', 'user', NOW()),
  (gen_random_uuid(), 'crystal@baito.events', 'Crystal', 'user', NOW())
ON CONFLICT (email) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = NOW();

-- Display instructions
DO $$
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'USER ACCOUNTS TO CREATE';
  RAISE NOTICE '===================================';
  RAISE NOTICE '';
  RAISE NOTICE '1. jesley@baito.events';
  RAISE NOTICE '   Password: jiyu3299';
  RAISE NOTICE '   Name: Jesley';
  RAISE NOTICE '   Role: user';
  RAISE NOTICE '';
  RAISE NOTICE '2. winnie@baito.events';
  RAISE NOTICE '   Password: winnie1106';
  RAISE NOTICE '   Name: Winnie';
  RAISE NOTICE '   Role: user';
  RAISE NOTICE '';
  RAISE NOTICE '3. ava@baito.events';
  RAISE NOTICE '   Password: yoketing0811';
  RAISE NOTICE '   Name: Ava';
  RAISE NOTICE '   Role: user';
  RAISE NOTICE '';
  RAISE NOTICE '4. jamilatulaili@baito.events';
  RAISE NOTICE '   Password: laili1994!';
  RAISE NOTICE '   Name: Jamila Tulaili';
  RAISE NOTICE '   Role: user';
  RAISE NOTICE '';
  RAISE NOTICE '5. crystal@baito.events';
  RAISE NOTICE '   Password: Crys-8711';
  RAISE NOTICE '   Name: Crystal';
  RAISE NOTICE '   Role: user';
  RAISE NOTICE '';
  RAISE NOTICE '===================================';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '===================================';
  RAISE NOTICE '1. Go to Supabase Dashboard -> Authentication -> Users';
  RAISE NOTICE '2. Click "Add user" for each account';
  RAISE NOTICE '3. Enter email and password from above';
  RAISE NOTICE '4. Set "Auto Confirm User" to ON';
  RAISE NOTICE '5. Click "Create user"';
  RAISE NOTICE '';
  RAISE NOTICE 'OR use the Node.js script:';
  RAISE NOTICE '  node create-team-users.js';
  RAISE NOTICE '  (Requires SUPABASE_SERVICE_ROLE_KEY in .env)';
  RAISE NOTICE '';
END $$;
