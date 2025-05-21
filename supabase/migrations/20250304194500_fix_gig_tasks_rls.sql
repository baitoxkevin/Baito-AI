-- Add Row Level Security policies for gig_tasks table

-- First, enable Row Level Security on the table
ALTER TABLE gig_tasks ENABLE ROW LEVEL SECURITY;

-- Allow public read access to gig_tasks
CREATE POLICY "Allow public read access to gig_tasks"
  ON gig_tasks FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to modify gig_tasks
CREATE POLICY "Allow authenticated users to modify gig_tasks"
  ON gig_tasks
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);