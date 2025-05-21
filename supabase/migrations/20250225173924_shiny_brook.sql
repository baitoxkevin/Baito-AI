/*
  # Create Super Admin User

  1. Creates a new super admin user in auth.users
  2. Creates corresponding user profile in users table
  3. Sets up proper role and permissions
  4. Ensures all required fields are non-null
*/

DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
BEGIN
  -- First, create the auth user with explicit ID
  INSERT INTO auth.users (
    id,
    email,
    raw_user_meta_data,
    raw_app_meta_data,
    aud,
    role,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) VALUES (
    new_user_id,
    'admin@baitoai.com',
    '{"username":"admin"}',
    '{"provider":"email","providers":["email"]}',
    'authenticated',
    'authenticated',
    crypt('Admin123!@#', gen_salt('bf')),
    now(),
    now(),
    now(),
    '',
    ''
  );

  -- Then create the user profile
  INSERT INTO users (
    id,
    email,
    username,
    full_name,
    role,
    is_super_admin,
    company_name,
    contact_phone,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    'admin@baitoai.com',
    'admin',
    'System Administrator',
    'super_admin',
    true,
    'BaitoAI Labs',
    '+60123456789',
    now(),
    now()
  );

  -- Log the creation
  RAISE NOTICE 'Created super admin user with ID: %', new_user_id;
END $$;