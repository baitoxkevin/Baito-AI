/*
  # Add Customer Information Fields

  1. Changes
    - Add company_name and contact_phone columns to users table
    - Add indexes for improved query performance
    - Update RLS policies for the new fields

  2. Security
    - Maintain existing RLS policies
    - Ensure new fields are protected
*/

-- Add new columns to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS contact_phone text;

-- Add indexes for commonly searched fields
CREATE INDEX IF NOT EXISTS idx_users_company_name ON users(company_name);
CREATE INDEX IF NOT EXISTS idx_users_contact_phone ON users(contact_phone);

-- Update RLS policies to include new fields
CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update all users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );
