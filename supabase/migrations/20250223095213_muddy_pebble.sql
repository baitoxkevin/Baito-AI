/*
  # Fix invites foreign key relationship

  1. Changes
    - Drop and recreate invites table with proper foreign key references
    - Add explicit foreign key constraint for created_by column
    - Update RLS policies to maintain security

  2. Security
    - Maintain existing RLS policies
    - Ensure data integrity with proper constraints
*/

-- Temporarily disable RLS to allow table recreation
ALTER TABLE invites DISABLE ROW LEVEL SECURITY;

-- Drop existing invites table
DROP TABLE IF EXISTS invites;

-- Recreate invites table with proper foreign key reference
CREATE TABLE invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role text NOT NULL,
  company_id uuid REFERENCES companies(id),
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id) NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'expired'))
);

-- Re-enable RLS
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Recreate policies
CREATE POLICY "Super admins can do everything on invites"
  ON invites FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_super_admin = true
    )
  );

CREATE POLICY "Users can view invites they created"
  ON invites FOR SELECT TO authenticated
  USING (created_by = auth.uid());

-- Recreate indexes
CREATE INDEX IF NOT EXISTS invites_email_idx ON invites (email);
CREATE INDEX IF NOT EXISTS invites_status_idx ON invites (status);
CREATE INDEX IF NOT EXISTS invites_expires_at_idx ON invites (expires_at);
CREATE INDEX IF NOT EXISTS invites_created_by_idx ON invites (created_by);