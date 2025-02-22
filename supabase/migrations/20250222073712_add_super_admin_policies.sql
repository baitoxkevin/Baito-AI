-- Enable RLS on users table if not already enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy for super admin access
CREATE POLICY "Super admins have full access"
ON public.users
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid() 
    AND (
      auth.users.raw_user_meta_data->>'is_super_admin' = 'true'
      OR EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid() 
        AND users.is_super_admin = true
      )
    )
  )
);

-- Update existing admin policy to check for non-super admins
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
CREATE POLICY "Admins can update non-super users"
ON public.users
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() 
    AND users.role = 'admin' 
    AND (users.is_super_admin IS NULL OR users.is_super_admin = false)
  )
  AND (SELECT is_super_admin FROM public.users WHERE id = auth.uid()) IS NOT TRUE
);
