/*
  # Update users table for customer fields

  1. Changes
    - Add missing columns for user profiles
    - Update RLS policies for better access control
    - Add validation constraints

  2. Security
    - Maintain existing RLS
    - Add specific policies for customer creation
*/

-- Add email validation check
ALTER TABLE users
ADD CONSTRAINT email_format_check
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add phone number format check
ALTER TABLE users
ADD CONSTRAINT phone_format_check
CHECK (
  contact_phone IS NULL OR
  contact_phone ~ '^\+[1-9]\d{1,14}$'
);

-- Create policy for customer creation
CREATE POLICY "Allow customer creation"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    role = 'client'
  );

-- Create policy for customer updates
CREATE POLICY "Allow customer updates"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    role = 'client'
  )
  WITH CHECK (
    role = 'client'
  );
