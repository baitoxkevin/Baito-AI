-- Add working_hours_start and working_hours_end columns to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS working_hours_start TIME DEFAULT '09:00:00',
ADD COLUMN IF NOT EXISTS working_hours_end TIME DEFAULT '18:00:00';
