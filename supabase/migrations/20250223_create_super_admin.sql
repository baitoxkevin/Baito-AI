-- Create super admin user with specified credentials
DO $$
BEGIN
  -- Create user if not exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'kevin@baito.events') THEN
    INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
    VALUES ('kevin@baito.events', crypt('BaitoTest111~~', gen_salt('bf')), now());
  END IF;

  -- Set up super admin role and metadata
  INSERT INTO public.users (id, email, role, raw_user_meta_data)
  SELECT 
    id,
    email,
    'admin',
    jsonb_build_object(
      'is_super_admin', true,
      'email_verified', true,
      'full_name', 'Kevin'
    )
  FROM auth.users
  WHERE email = 'kevin@baito.events'
  ON CONFLICT (id) DO UPDATE
  SET 
    role = 'admin',
    raw_user_meta_data = jsonb_build_object(
      'is_super_admin', true,
      'email_verified', true,
      'full_name', 'Kevin'
    );
END $$;
