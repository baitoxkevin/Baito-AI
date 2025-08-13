-- Add missing fields to projects table to match the form requirements
-- This migration adds all the fields that the NewProjectDialog expects

-- First, add the basic fields
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS client_id UUID,
ADD COLUMN IF NOT EXISTS manager_id UUID,
ADD COLUMN IF NOT EXISTS brand_name TEXT,
ADD COLUMN IF NOT EXISTS brand_logo TEXT,
ADD COLUMN IF NOT EXISTS event_type TEXT,
ADD COLUMN IF NOT EXISTS venue_address TEXT,
ADD COLUMN IF NOT EXISTS venue_details TEXT,
ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS working_hours_start TEXT,
ADD COLUMN IF NOT EXISTS working_hours_end TEXT,
ADD COLUMN IF NOT EXISTS schedule_type TEXT,
ADD COLUMN IF NOT EXISTS crew_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS supervisors_required INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'planning',
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS budget DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS invoice_number TEXT,
ADD COLUMN IF NOT EXISTS cc_client_ids UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS cc_user_ids UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS project_type TEXT,
ADD COLUMN IF NOT EXISTS filled_positions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID,
ADD COLUMN IF NOT EXISTS color TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_manager_id ON projects(manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_start_date ON projects(start_date);
CREATE INDEX IF NOT EXISTS idx_projects_cc_client_ids ON projects USING GIN (cc_client_ids);
CREATE INDEX IF NOT EXISTS idx_projects_cc_user_ids ON projects USING GIN (cc_user_ids);

-- Add comments for documentation
COMMENT ON COLUMN projects.title IS 'Project title/name';
COMMENT ON COLUMN projects.client_id IS 'Main client/company for the project';
COMMENT ON COLUMN projects.manager_id IS 'Main person in charge/manager for the project';
COMMENT ON COLUMN projects.brand_name IS 'Brand name associated with the project';
COMMENT ON COLUMN projects.brand_logo IS 'URL of the brand logo';
COMMENT ON COLUMN projects.event_type IS 'Type of event (e.g., Conference, Wedding, etc.)';
COMMENT ON COLUMN projects.venue_address IS 'Primary venue address';
COMMENT ON COLUMN projects.venue_details IS 'Additional venue information';
COMMENT ON COLUMN projects.start_date IS 'Project start date';
COMMENT ON COLUMN projects.end_date IS 'Project end date (optional for single-day events)';
COMMENT ON COLUMN projects.working_hours_start IS 'Daily working hours start time';
COMMENT ON COLUMN projects.working_hours_end IS 'Daily working hours end time';
COMMENT ON COLUMN projects.schedule_type IS 'Type of schedule (single, recurring, multiple)';
COMMENT ON COLUMN projects.crew_count IS 'Number of crew members needed';
COMMENT ON COLUMN projects.supervisors_required IS 'Number of supervisors needed';
COMMENT ON COLUMN projects.status IS 'Project status (planning, confirmed, in_progress, completed, cancelled)';
COMMENT ON COLUMN projects.priority IS 'Project priority (low, medium, high)';
COMMENT ON COLUMN projects.budget IS 'Project budget in RM';
COMMENT ON COLUMN projects.invoice_number IS 'Invoice reference number';
COMMENT ON COLUMN projects.cc_client_ids IS 'Additional client contacts (CC) involved in the project';
COMMENT ON COLUMN projects.cc_user_ids IS 'Additional users (CC) involved in the project';
COMMENT ON COLUMN projects.project_type IS 'Project category (recruitment, internal_event, custom)';
COMMENT ON COLUMN projects.filled_positions IS 'Number of positions already filled';
COMMENT ON COLUMN projects.deleted_at IS 'Soft delete timestamp';
COMMENT ON COLUMN projects.deleted_by IS 'User who deleted the project';
COMMENT ON COLUMN projects.color IS 'Color for visual representation';

-- Update RLS policies if needed
DROP POLICY IF EXISTS "Users can view projects they are involved in" ON projects;

CREATE POLICY "Users can view projects they are involved in" ON projects
  FOR SELECT
  USING (
    auth.uid() = manager_id OR
    auth.uid() = client_id OR
    auth.uid() = ANY(cc_user_ids) OR
    auth.uid() = ANY(cc_client_ids) OR
    is_public = true OR
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'manager')
    )
  );

-- Allow authenticated users to create projects
DROP POLICY IF EXISTS "Users can create projects" ON projects;
CREATE POLICY "Users can create projects" ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to update their own projects
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = manager_id OR
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'manager')
    )
  );