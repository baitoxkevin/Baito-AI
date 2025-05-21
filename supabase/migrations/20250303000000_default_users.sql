-- Add default users for testing authentication
-- Note: These are dummy users for testing purposes
-- Password for all test accounts: password123

-- Add default user profiles in the users table
INSERT INTO users (id, email, full_name, role, is_super_admin, created_at, updated_at)
VALUES
  -- These IDs should match those created through Supabase Auth
  ('00000000-0000-0000-0000-000000000001', 'admin@example.com', 'Admin User', 'super_admin', TRUE, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', 'manager@example.com', 'Manager User', 'manager', FALSE, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000003', 'staff@example.com', 'Staff User', 'staff', FALSE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Important: This migration won't create the actual auth users in Supabase Auth
-- You'll need to manually create these users in the Supabase dashboard or via the API
-- After creating in Auth, then their profiles will be automatically created in the users table
-- through the signUp function in auth.ts
