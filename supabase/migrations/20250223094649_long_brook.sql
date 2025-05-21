/*
  # Create companies and invites tables

  1. New Tables
    - `companies`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `contact_email` (text, not null)
      - `contact_phone` (text)
      - `address` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `deleted_at` (timestamptz)
      - `deleted_by` (uuid, references users)

    - `invites`
      - `id` (uuid, primary key)
      - `email` (text, not null)
      - `role` (UserRole, not null)
      - `company_id` (uuid, references companies)
      - `expires_at` (timestamptz, not null)
      - `created_at` (timestamptz)
      - `created_by` (uuid, references users)
      - `status` (text, not null)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
    - Add special policies for super admins
*/

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text,
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  deleted_by uuid REFERENCES auth.users(id)
);

-- Create invites table
CREATE TABLE IF NOT EXISTS invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role text NOT NULL,
  company_id uuid REFERENCES companies(id),
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'expired'))
);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Companies policies
CREATE POLICY "Super admins can do everything on companies"
  ON companies FOR ALL TO authenticated
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

CREATE POLICY "Regular users can view non-deleted companies"
  ON companies FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

-- Invites policies
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

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS companies_name_idx ON companies (name);
CREATE INDEX IF NOT EXISTS invites_email_idx ON invites (email);
CREATE INDEX IF NOT EXISTS invites_status_idx ON invites (status);
CREATE INDEX IF NOT EXISTS invites_expires_at_idx ON invites (expires_at);