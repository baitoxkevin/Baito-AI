/*
  # Fix Companies Table Permissions
  
  1. Changes
    - Add policy for authenticated users to create companies
    - Fix permissions so regular users can add new companies
    - Enable RLS on companies table
  
  2. Security
    - Maintain existing super admin policies
    - Add additional policy for insert operations
*/

-- Enable Row Level Security on companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Add policy for authenticated users to create companies
CREATE POLICY "Authenticated users can create companies"
  ON companies FOR INSERT TO authenticated
  WITH CHECK (true);
  
-- Add policy for viewing companies
CREATE POLICY "All users can view companies"
  ON companies FOR SELECT TO authenticated
  USING (true);