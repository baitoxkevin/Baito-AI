/*
  # Add RLS policies for related tables

  1. Security Changes
    - Enable RLS on performance_metrics and loyalty_status tables
    - Add policies for:
      - Reading performance metrics
      - Creating performance metrics
      - Updating performance metrics
      - Reading loyalty status
      - Creating loyalty status
      - Updating loyalty status
    - All operations require authentication
*/

-- Enable RLS
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_status ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON performance_metrics;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON performance_metrics;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON performance_metrics;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON loyalty_status;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON loyalty_status;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON loyalty_status;

-- Create policies for performance_metrics
CREATE POLICY "Enable read access for authenticated users"
  ON performance_metrics
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users"
  ON performance_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
  ON performance_metrics
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for loyalty_status
CREATE POLICY "Enable read access for authenticated users"
  ON loyalty_status
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users"
  ON loyalty_status
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
  ON loyalty_status
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);