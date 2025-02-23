-- Create super admin user
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES ('kevin@baito.events', crypt('BaitoTest111~~', gen_salt('bf')), now());

-- Set up super admin role and metadata
INSERT INTO public.users (id, email, role, is_super_admin, raw_user_meta_data)
SELECT 
  id,
  email,
  'admin',
  true,
  jsonb_build_object(
    'is_super_admin', true,
    'email_verified', true,
    'full_name', 'Kevin'
  )
FROM auth.users
WHERE email = 'kevin@baito.events';
