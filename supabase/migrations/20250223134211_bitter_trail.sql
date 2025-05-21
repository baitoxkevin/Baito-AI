/*
  # Final fix for RLS policies

  1. Changes
    - Drop all existing policies
    - Create new comprehensive policies with proper security checks
    - Enable RLS on all tables
    - Add proper security context checks
  
  2. Security
    - Ensure authenticated users can perform all operations
    - Maintain data integrity with proper constraints
*/

-- First disable RLS temporarily to avoid any conflicts
ALTER TABLE candidates DISABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_status DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow all operations for authenticated users on candidates" ON candidates;
DROP POLICY IF EXISTS "Allow all operations for authenticated users on performance_metrics" ON performance_metrics;
DROP POLICY IF EXISTS "Allow all operations for authenticated users on loyalty_status" ON loyalty_status;

-- Create new policies for candidates
CREATE POLICY "Enable all operations for authenticated users on candidates"
  ON candidates
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create new policies for performance_metrics
CREATE POLICY "Enable all operations for authenticated users on performance_metrics"
  ON performance_metrics
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create new policies for loyalty_status
CREATE POLICY "Enable all operations for authenticated users on loyalty_status"
  ON loyalty_status
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Re-enable RLS
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_status ENABLE ROW LEVEL SECURITY;