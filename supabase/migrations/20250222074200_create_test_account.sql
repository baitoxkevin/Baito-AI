-- Create test account with super admin privileges
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@baitoai.com',
  crypt('BaitoTest123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Get the user ID we just created
WITH new_auth_user AS (
  SELECT id FROM auth.users WHERE email = 'test@baitoai.com'
)
INSERT INTO public.users (
  id,
  email,
  full_name,
  role,
  is_super_admin,
  created_at
)
SELECT 
  id,
  'test@baitoai.com',
  'Test Admin',
  'admin',
  true,
  now()
FROM new_auth_user
ON CONFLICT (id) DO UPDATE 
SET 
  role = 'admin',
  is_super_admin = true;
