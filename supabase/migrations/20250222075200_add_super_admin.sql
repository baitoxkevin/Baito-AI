-- Add is_super_admin column if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;

-- Update RLS policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy for super admin access
CREATE POLICY "Super admins have full access" ON public.users
FOR ALL USING (
  auth.uid() IN (
    SELECT id FROM public.users WHERE is_super_admin = true
  )
);

-- Update existing admin policy
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
CREATE POLICY "Admins can update non-super users" ON public.users
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() 
    AND role = 'admin'
    AND (is_super_admin IS NULL OR is_super_admin = false)
  )
);

-- Grant super admin privileges to existing admin
UPDATE public.users 
SET is_super_admin = true 
WHERE email = 'noobxkevin@gmail.com';
