/*
  # Add RLS policies for candidates table

  1. Security Changes
    - Enable RLS on candidates table
    - Add policies for:
      - Reading candidates
      - Creating candidates
      - Updating candidates
      - Deleting candidates
    - All operations require authentication
*/

-- Enable RLS
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON candidates;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON candidates;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON candidates;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON candidates;

-- Create new policies
CREATE POLICY "Enable read access for authenticated users"
  ON candidates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users"
  ON candidates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
  ON candidates
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users"
  ON candidates
  FOR DELETE
  TO authenticated
  USING (true);