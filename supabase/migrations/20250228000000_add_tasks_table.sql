/*
  Add tasks and task templates tables
  
  This migration adds:
  1. A tasks table to store project tasks
  2. A task_templates table to store reusable task templates
  3. Related indexes and relationships
*/

-- Create tasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  due_date DATE,
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create task_templates table if it doesn't exist  
CREATE TABLE IF NOT EXISTS task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL, -- 'recruitment', 'internal_event', 'custom'
  category TEXT NOT NULL, -- 'crew', 'supervisor', 'roadshow', 'corporate', etc.
  status TEXT NOT NULL DEFAULT 'backlog',
  priority TEXT NOT NULL DEFAULT 'medium',
  days_from_start INTEGER NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add project_type to projects if it doesn't exist
DO $$ 
BEGIN
  ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_type TEXT;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_task_templates_type ON task_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_task_templates_category ON task_templates(category);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view tasks for projects they have access to"
  ON tasks FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE deleted_at IS NULL
    )
  );

CREATE POLICY "Users can insert tasks for projects they have access to"
  ON tasks FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects
      WHERE deleted_at IS NULL
    )
  );

CREATE POLICY "Users can update tasks for projects they have access to"
  ON tasks FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE deleted_at IS NULL
    )
  );

CREATE POLICY "Super admins can manage task templates"
  ON task_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_super_admin = true
    )
  );

CREATE POLICY "All users can view task templates"
  ON task_templates FOR SELECT
  USING (true);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_templates_updated_at
  BEFORE UPDATE ON task_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default task templates for recruitment projects
INSERT INTO task_templates (title, description, template_type, category, status, priority, days_from_start, order_index)
VALUES
  ('Define recruitment requirements', 'Create detailed requirements for crew members including skills and experience', 'recruitment', 'crew', 'todo', 'high', 0, 10),
  ('Create job listings', 'Post job listings on relevant platforms and social media', 'recruitment', 'crew', 'todo', 'high', 1, 20),
  ('Screen initial applications', 'Review resumes and applications to select candidates for interviews', 'recruitment', 'crew', 'backlog', 'medium', 3, 30),
  ('Schedule interviews', 'Set up interview schedule for selected candidates', 'recruitment', 'crew', 'backlog', 'medium', 5, 40),
  ('Conduct interviews', 'Interview candidates and evaluate their skills and fit', 'recruitment', 'crew', 'backlog', 'medium', 7, 50),
  ('Select final candidates', 'Choose the best candidates based on interviews and qualifications', 'recruitment', 'crew', 'backlog', 'medium', 9, 60),
  ('Send offer letters', 'Prepare and send offer letters to selected candidates', 'recruitment', 'crew', 'backlog', 'medium', 10, 70),
  ('Verify candidate documentation', 'Collect and verify required documents from hired candidates', 'recruitment', 'crew', 'backlog', 'low', 12, 80),
  ('Conduct orientation session', 'Prepare and deliver orientation for new staff', 'recruitment', 'crew', 'backlog', 'low', 14, 90),
  ('Recruit supervisors', 'Find and hire supervisors for the project', 'recruitment', 'supervisor', 'todo', 'high', 0, 100),
  ('Brief supervisors on project details', 'Provide comprehensive briefing to supervisors about project requirements', 'recruitment', 'supervisor', 'backlog', 'high', 7, 110),
  ('Assign crew members to supervisors', 'Create supervisor-crew assignments and communication channels', 'recruitment', 'supervisor', 'backlog', 'medium', 13, 120);

-- Insert default task templates for internal event projects  
INSERT INTO task_templates (title, description, template_type, category, status, priority, days_from_start, order_index)
VALUES
  ('Confirm venue booking', 'Verify booking details and requirements with venue management', 'internal_event', 'logistics', 'todo', 'high', 0, 10),
  ('Create event budget', 'Prepare detailed budget including venue, staff, and materials', 'internal_event', 'planning', 'todo', 'high', 1, 20),
  ('Prepare equipment list', 'Create list of all required equipment and supplies', 'internal_event', 'logistics', 'todo', 'medium', 2, 30),
  ('Design marketing materials', 'Create promotional materials for the event', 'internal_event', 'marketing', 'backlog', 'medium', 3, 40),
  ('Schedule staff shifts', 'Assign staff members to specific roles and shifts', 'internal_event', 'staffing', 'backlog', 'medium', 5, 50),
  ('Arrange transportation', 'Organize transportation for equipment and materials', 'internal_event', 'logistics', 'backlog', 'medium', 7, 60),
  ('Conduct pre-event briefing', 'Brief all staff on their roles and responsibilities', 'internal_event', 'management', 'backlog', 'high', 14, 70),
  ('Setup venue', 'Set up all equipment and materials at the venue', 'internal_event', 'execution', 'backlog', 'high', 14, 80),
  ('Event execution', 'Manage the event and ensure smooth operation', 'internal_event', 'execution', 'backlog', 'high', 15, 90),
  ('Post-event cleanup', 'Clean up the venue and pack up equipment', 'internal_event', 'execution', 'backlog', 'medium', 16, 100),
  ('Collect feedback', 'Gather feedback from staff and attendees', 'internal_event', 'reporting', 'backlog', 'low', 17, 110),
  ('Generate post-event report', 'Create comprehensive report on event outcomes', 'internal_event', 'reporting', 'backlog', 'medium', 19, 120);