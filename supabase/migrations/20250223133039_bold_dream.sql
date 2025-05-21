/*
  # Fix candidates table relationships

  This migration ensures proper foreign key relationships between candidates
  and their related tables, and adds indexes for better query performance.

  1. Changes
    - Add explicit foreign key constraints with CASCADE
    - Add indexes for better join performance
*/

-- Ensure proper foreign key constraints
ALTER TABLE performance_metrics
  DROP CONSTRAINT IF EXISTS performance_metrics_candidate_id_fkey,
  ADD CONSTRAINT performance_metrics_candidate_id_fkey
  FOREIGN KEY (candidate_id)
  REFERENCES candidates(id)
  ON DELETE CASCADE;

ALTER TABLE loyalty_status
  DROP CONSTRAINT IF EXISTS loyalty_status_candidate_id_fkey,
  ADD CONSTRAINT loyalty_status_candidate_id_fkey
  FOREIGN KEY (candidate_id)
  REFERENCES candidates(id)
  ON DELETE CASCADE;

-- Add indexes for better join performance
CREATE INDEX IF NOT EXISTS idx_performance_metrics_candidate_id 
  ON performance_metrics(candidate_id);

CREATE INDEX IF NOT EXISTS idx_loyalty_status_candidate_id 
  ON loyalty_status(candidate_id);