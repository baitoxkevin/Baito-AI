-- This migration adds optional columns to the users table that may be missing
-- Run this in Supabase SQL Editor if you encounter errors about missing columns

-- Add avatar_url column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE public.users ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

-- Add avatar_seed column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'avatar_seed'
    ) THEN
        ALTER TABLE public.users ADD COLUMN avatar_seed TEXT;
    END IF;
END $$;

-- Add username column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'username'
    ) THEN
        ALTER TABLE public.users ADD COLUMN username TEXT;
    END IF;
END $$;

-- Update existing users to have default values if needed
UPDATE public.users 
SET avatar_seed = id::text 
WHERE avatar_seed IS NULL;

UPDATE public.users 
SET username = LOWER(SPLIT_PART(email, '@', 1)) 
WHERE username IS NULL AND email IS NOT NULL;

-- Add is_active column if it doesn't exist (often used for user management)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.users ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Missing user columns have been added successfully!';
END $$;