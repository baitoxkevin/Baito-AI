-- Create default super admin user
-- Email: admin@baitoevents.com
-- Password: Set this in Supabase Dashboard > Authentication > Users

-- First, ensure the users table exists and has the necessary columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- Create a function to set up the super admin after auth user creation
CREATE OR REPLACE FUNCTION setup_super_admin(user_email TEXT)
RETURNS void AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get the user ID from auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = user_email
  LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found. Please create the user in Authentication first.', user_email;
  END IF;
  
  -- Insert or update the user profile
  INSERT INTO public.users (
    id,
    email,
    username,
    full_name,
    role,
    is_super_admin,
    avatar_seed,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    user_email,
    split_part(user_email, '@', 1),
    'Super Administrator',
    'admin',
    true,
    substr(md5(random()::text), 1, 10),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    is_super_admin = true,
    role = 'admin',
    full_name = 'Super Administrator',
    updated_at = NOW();
    
  RAISE NOTICE 'Super admin privileges granted to %', user_email;
END;
$$ LANGUAGE plpgsql;

-- Instructions:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add user" > "Create new user"
-- 3. Enter email: admin@baitoevents.com (or your preferred email)
-- 4. Set a secure password
-- 5. Make sure "Auto Confirm User" is checked
-- 6. Click "Create user"
-- 7. Then run: SELECT setup_super_admin('admin@baitoevents.com');
-- 8. The user now has super admin privileges!

-- Example (uncomment and run after creating auth user):
-- SELECT setup_super_admin('admin@baitoevents.com');