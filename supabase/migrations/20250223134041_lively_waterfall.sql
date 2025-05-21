/*
  # Fix RLS policies for candidates and related tables

  1. Changes
    - Update RLS policies to properly handle authenticated users
    - Add policies for all CRUD operations
    - Ensure consistent access across related tables
  
  2. Security
    - Enable RLS on all tables
    - Grant appropriate access to authenticated users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON candidates;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON candidates;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON candidates;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON candidates;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON performance_metrics;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON performance_metrics;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON performance_metrics;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON loyalty_status;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON loyalty_status;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON loyalty_status;

-- Create policies for candidates table
CREATE POLICY "Authenticated users can read candidates"
  ON candidates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create candidates"
  ON candidates FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update candidates"
  ON candidates FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete candidates"
  ON candidates FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for performance_metrics table
CREATE POLICY "Authenticated users can read performance metrics"
  ON performance_metrics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create performance metrics"
  ON performance_metrics FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update performance metrics"
  ON performance_metrics FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete performance metrics"
  ON performance_metrics FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for loyalty_status table
CREATE POLICY "Authenticated users can read loyalty status"
  ON loyalty_status FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create loyalty status"
  ON loyalty_status FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update loyalty status"
  ON loyalty_status FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete loyalty status"
  ON loyalty_status FOR DELETE
  TO authenticated
  USING (true);

-- Ensure RLS is enabled
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_status ENABLE ROW LEVEL SECURITY;