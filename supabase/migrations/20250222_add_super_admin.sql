-- Add is_super_admin column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;

-- Update existing admin user to be super admin
UPDATE users 
SET is_super_admin = TRUE, role = 'admin'
WHERE email = 'superadmin@baitoai.com';

-- Add RLS policies for super admin
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can do everything"
ON users
FOR ALL
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE is_super_admin = TRUE
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM users WHERE is_super_admin = TRUE
  )
);

CREATE POLICY "Users can read their own data"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);
