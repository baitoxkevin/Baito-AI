/*
  # Update Existing User to Super Admin

  This migration:
  1. Finds existing user by email
  2. Updates their role to super_admin
  3. Sets all required fields
  4. Handles the case where user doesn't exist
*/

DO $$
DECLARE
  existing_auth_id uuid;
BEGIN
  -- First check if user exists in auth.users
  SELECT id INTO existing_auth_id
  FROM auth.users
  WHERE email = 'admin@baitoai.com';

  IF existing_auth_id IS NOT NULL THEN
    -- Update existing auth user
    UPDATE auth.users
    SET
      raw_user_meta_data = jsonb_build_object('username', 'admin'),
      raw_app_meta_data = '{"provider":"email","providers":["email"]}',
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at = now()
    WHERE id = existing_auth_id;

    -- Update or insert user profile
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
      existing_auth_id,
      'admin@baitoai.com',
      'admin',
      'System Administrator',
      'super_admin',
      true,
      'BaitoAI Labs',
      '+60123456789',
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE
    SET
      role = 'super_admin',
      is_super_admin = true,
      full_name = EXCLUDED.full_name,
      company_name = EXCLUDED.company_name,
      contact_phone = EXCLUDED.contact_phone,
      updated_at = now();

    RAISE NOTICE 'Updated existing user to super admin with ID: %', existing_auth_id;
  ELSE
    RAISE EXCEPTION 'User with email admin@baitoai.com not found. Please create the user first.';
  END IF;
END $$;