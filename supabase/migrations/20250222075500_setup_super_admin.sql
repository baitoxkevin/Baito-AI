-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add is_super_admin column if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Super admins have full access" ON public.users;
DROP POLICY IF EXISTS "Admins can update non-super users" ON public.users;

-- Create policy for super admin access
CREATE POLICY "Super admins have full access" ON public.users
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND is_super_admin = true
  )
);

-- Create policy for regular admin access
CREATE POLICY "Admins can update non-super users" ON public.users
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() 
    AND role = 'admin'
    AND (is_super_admin IS NULL OR is_super_admin = false)
  )
  AND NOT (SELECT is_super_admin FROM public.users WHERE id = users.id)
);

-- Reset test account password and grant super admin privileges
UPDATE auth.users
SET encrypted_password = crypt('BaitoTest123!', gen_salt('bf'))
WHERE email = 'test@baitoai.com';

UPDATE public.users 
SET is_super_admin = true,
    role = 'admin'
WHERE email = 'test@baitoai.com';
