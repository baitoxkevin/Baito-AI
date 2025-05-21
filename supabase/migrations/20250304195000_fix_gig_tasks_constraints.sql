-- Fix start_time and end_time in gig_tasks table

-- Make the columns nullable first
ALTER TABLE gig_tasks ALTER COLUMN start_time DROP NOT NULL;
ALTER TABLE gig_tasks ALTER COLUMN end_time DROP NOT NULL;

-- Change the column types from time to timestamptz
ALTER TABLE gig_tasks 
  ALTER COLUMN start_time TYPE timestamptz USING NULL,
  ALTER COLUMN end_time TYPE timestamptz USING NULL;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';