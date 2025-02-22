import { supabase } from './supabase';

export async function applyMigration() {
  const sql = `
    -- Create policy for super admin access
    CREATE POLICY "Super admins can do everything"
    ON public.users
    USING (
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid() AND users.is_super_admin = true
      )
    );

    -- Update existing admin policy to check for non-super admins
    DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
    CREATE POLICY "Admins can update all users"
    ON public.users
    USING (
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid() 
        AND users.role = 'admin' 
        AND (users.is_super_admin IS NULL OR users.is_super_admin = false)
      )
    );
  `;

  const { error } = await supabase.rpc('exec_sql', { sql });
  if (error) throw error;
}
