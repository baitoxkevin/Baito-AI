-- Fix for user winnie@baito.events who has auth user but no profile
-- Run this in Supabase SQL Editor

-- First, check if the user profile already exists
DO $$
DECLARE
    user_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM public.users 
        WHERE id = '94544b15-f72a-4f17-8ef3-72025a7df190'
    ) INTO user_exists;
    
    IF NOT user_exists THEN
        -- Create the user profile with basic required fields
        INSERT INTO public.users (
            id,
            email,
            full_name,
            role,
            is_super_admin,
            created_at,
            updated_at
        ) VALUES (
            '94544b15-f72a-4f17-8ef3-72025a7df190',
            'winnie@baito.events',
            'Winnie',
            'manager', -- You mentioned she should be a manager
            false,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'User profile created successfully for winnie@baito.events';
    ELSE
        RAISE NOTICE 'User profile already exists for winnie@baito.events';
    END IF;
END $$;

-- Try to update optional fields if columns exist
DO $$
BEGIN
    -- Check if username column exists and update it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'username'
    ) THEN
        UPDATE public.users 
        SET username = 'winnie' 
        WHERE id = '94544b15-f72a-4f17-8ef3-72025a7df190' 
        AND username IS NULL;
    END IF;
    
    -- Check if avatar_seed column exists and update it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'avatar_seed'
    ) THEN
        UPDATE public.users 
        SET avatar_seed = SUBSTRING(MD5(RANDOM()::TEXT), 1, 10)
        WHERE id = '94544b15-f72a-4f17-8ef3-72025a7df190' 
        AND avatar_seed IS NULL;
    END IF;
END $$;

-- Verify the fix
SELECT id, email, full_name, role, is_super_admin 
FROM public.users 
WHERE id = '94544b15-f72a-4f17-8ef3-72025a7df190';