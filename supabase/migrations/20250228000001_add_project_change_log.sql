/*
  Project Change Log System
  
  This migration adds:
  1. A project_changes table to track changes to projects
  2. A projects_ai_context table to store AI analysis of changes
  3. Trigger function to automatically detect meaningful changes
*/

-- Create project_changes table
CREATE TABLE IF NOT EXISTS project_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  change_reason TEXT,
  changed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create projects_ai_context table to store AI analysis
CREATE TABLE IF NOT EXISTS projects_ai_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  context_type TEXT NOT NULL, -- 'change_analysis', 'recommendation', 'insight'
  content TEXT NOT NULL,
  source TEXT, -- 'user_input', 'ai_generated'
  related_change_id UUID REFERENCES project_changes(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_project_changes_project_id ON project_changes(project_id);
CREATE INDEX IF NOT EXISTS idx_project_changes_field ON project_changes(field_name);
CREATE INDEX IF NOT EXISTS idx_projects_ai_context_project_id ON projects_ai_context(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_ai_context_type ON projects_ai_context(context_type);

-- Enable RLS
ALTER TABLE project_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects_ai_context ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view project changes for projects they have access to"
  ON project_changes FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE deleted_at IS NULL
    )
  );

CREATE POLICY "Users can insert project changes for projects they have access to"
  ON project_changes FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects
      WHERE deleted_at IS NULL
    )
  );

CREATE POLICY "Users can view AI context for projects they have access to"
  ON projects_ai_context FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE deleted_at IS NULL
    )
  );

CREATE POLICY "Users can insert AI context for projects they have access to"
  ON projects_ai_context FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects
      WHERE deleted_at IS NULL
    )
  );

-- Insert helpful labels for field changes
CREATE TABLE IF NOT EXISTS project_field_labels (
  field_name TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  description TEXT,
  importance TEXT DEFAULT 'medium'
);

INSERT INTO project_field_labels (field_name, display_name, description, importance)
VALUES 
  ('title', 'Project Title', 'Name of the project', 'high'),
  ('crew_count', 'Crew Size', 'Number of crew members needed', 'high'),
  ('supervisors_required', 'Supervisors Count', 'Number of supervisors needed', 'high'),
  ('start_date', 'Start Date', 'When the project starts', 'high'),
  ('end_date', 'End Date', 'When the project ends', 'high'),
  ('status', 'Project Status', 'Current status of the project', 'high'),
  ('priority', 'Priority', 'Importance level of the project', 'high'),
  ('venue_address', 'Venue', 'Location where the project takes place', 'medium'),
  ('working_hours_start', 'Working Hours Start', 'When work begins each day', 'medium'),
  ('working_hours_end', 'Working Hours End', 'When work ends each day', 'medium'),
  ('event_type', 'Event Type', 'Category of event', 'medium'),
  ('client_id', 'Client', 'Customer for the project', 'high'),
  ('manager_id', 'Manager', 'Person in charge of the project', 'high')
ON CONFLICT (field_name) DO UPDATE 
SET 
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  importance = EXCLUDED.importance;