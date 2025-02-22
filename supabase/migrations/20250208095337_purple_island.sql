/*
  # Project Management Enhancements

  1. New Columns
    - `created_at` (timestamp with timezone)
    - `filled_positions` (integer)
    - `priority_auto_set` (boolean)
  
  2. Changes
    - Add trigger to automatically update priority for near-term events
    - Add trigger to maintain filled_positions count
*/

-- Add new columns to projects table
ALTER TABLE projects 
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS filled_positions integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS priority_auto_set boolean DEFAULT false;

-- Create function to check and update project priority
CREATE OR REPLACE FUNCTION check_project_priority()
RETURNS TRIGGER AS $$
BEGIN
  -- If event is within 3 days and positions aren't filled
  IF (NEW.start_date - now() <= interval '3 days' AND 
      NEW.filled_positions < NEW.crew_count AND 
      NEW.priority_auto_set = false) THEN
    NEW.priority := 'high';
    NEW.priority_auto_set := true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for priority check
DROP TRIGGER IF EXISTS check_project_priority_trigger ON projects;
CREATE TRIGGER check_project_priority_trigger
  BEFORE INSERT OR UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION check_project_priority();

-- Create function to calculate progress percentage
CREATE OR REPLACE FUNCTION calculate_project_progress(p_filled integer, p_total integer)
RETURNS integer AS $$
BEGIN
  IF p_total = 0 THEN
    RETURN 0;
  END IF;
  RETURN (p_filled::float / p_total::float * 100)::integer;
END;
$$ LANGUAGE plpgsql;
