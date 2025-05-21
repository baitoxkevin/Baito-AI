/*
  # Fix foreign key references for candidates tables

  This migration adds explicit foreign key constraints with proper names
  to ensure consistent querying across the application.

  1. Changes
    - Add explicit foreign key constraints for performance_metrics and loyalty_status tables
    - Drop existing constraints if they exist to avoid conflicts
*/

-- Drop existing foreign key constraints if they exist
DO $$ BEGIN
  ALTER TABLE performance_metrics DROP CONSTRAINT IF EXISTS performance_metrics_candidate_id_fkey;
  ALTER TABLE loyalty_status DROP CONSTRAINT IF EXISTS loyalty_status_candidate_id_fkey;
EXCEPTION
  WHEN undefined_object THEN null;
END $$;

-- Add explicit foreign key constraints
ALTER TABLE performance_metrics
  ADD CONSTRAINT performance_metrics_candidate_id_fkey
  FOREIGN KEY (candidate_id)
  REFERENCES candidates(id)
  ON DELETE CASCADE;

ALTER TABLE loyalty_status
  ADD CONSTRAINT loyalty_status_candidate_id_fkey
  FOREIGN KEY (candidate_id)
  REFERENCES candidates(id)
  ON DELETE CASCADE;