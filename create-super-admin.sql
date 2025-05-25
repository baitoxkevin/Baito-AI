-- Create Super Admin User
-- 
-- Instructions:
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to SQL Editor
-- 3. Replace the email and user_id below with your desired values
-- 4. Run this SQL script
-- 5. Go to Authentication > Users and create a user with the same email
-- 6. The user will automatically have super admin privileges

-- Replace these values:
DO $$
DECLARE
  v_user_id UUID := 'YOUR_USER_ID_HERE'; -- Get this from Authentication > Users after creating the user
  v_email TEXT := 'admin@example.com'; -- Your super admin email
  v_username TEXT := 'admin'; -- Your preferred username
BEGIN
  -- Insert or update the user profile with super admin privileges
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
    v_email,
    v_username,
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
    updated_at = NOW();
  
  RAISE NOTICE 'Super admin user created/updated successfully!';
END $$;