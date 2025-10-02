-- Update the gig_tasks table to make it suitable for kanban tasks

-- First, drop the foreign key constraint that's limiting our usage
ALTER TABLE gig_tasks DROP CONSTRAINT IF EXISTS gig_tasks_gig_history_id_fkey;

-- Add necessary columns for kanban functionality
ALTER TABLE gig_tasks 
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'backlog',
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS due_date timestamptz,
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS assigned_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz,
  ADD COLUMN IF NOT EXISTS column_id text,
  ADD COLUMN IF NOT EXISTS board_id text,
  ADD COLUMN IF NOT EXISTS position integer,
  ADD COLUMN IF NOT EXISTS labels jsonb,
  ADD COLUMN IF NOT EXISTS estimated_hours float,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Update the primary columns with defaults for existing records
UPDATE gig_tasks 
SET 
  title = COALESCE(title, task_name),
  status = COALESCE(status, 'backlog'),
  priority = COALESCE(priority, 'medium'),
  updated_at = now()
WHERE title IS NULL;

-- Add trigger for updating updated_at
CREATE TRIGGER update_gig_tasks_updated_at
  BEFORE UPDATE ON gig_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add sample kanban tasks for testing
INSERT INTO gig_tasks (
  id, 
  title, 
  description, 
  status, 
  priority, 
  due_date, 
  created_at, 
  updated_at,
  position
)
VALUES
  (
    gen_random_uuid(), 
    'Create project dashboard layout', 
    'Design and implement the main dashboard layout with responsive grid', 
    'backlog', 
    'high', 
    now() + interval '7 days', 
    now(), 
    now(),
    1
  ),
  (
    gen_random_uuid(), 
    'Implement authentication flow', 
    'Set up login, registration and password reset functionality', 
    'todo', 
    'high', 
    now() + interval '5 days', 
    now(), 
    now(),
    1
  ),
  (
    gen_random_uuid(), 
    'Create database schema', 
    'Design and implement initial database schema with core tables', 
    'doing', 
    'medium', 
    now() + interval '3 days', 
    now(), 
    now(),
    1
  ),
  (
    gen_random_uuid(), 
    'Write unit tests for API endpoints', 
    'Create comprehensive test suite for all API endpoints', 
    'doing', 
    'medium', 
    now() + interval '6 days', 
    now(), 
    now(),
    2
  ),
  (
    gen_random_uuid(), 
    'Set up CI/CD pipeline', 
    'Configure GitHub Actions workflow for automated testing and deployment', 
    'done', 
    'low', 
    now() - interval '2 days', 
    now() - interval '7 days', 
    now(),
    1
  ),
  (
    gen_random_uuid(), 
    'Create user documentation', 
    'Write comprehensive user guide with screenshots and examples', 
    'done', 
    'low', 
    now() - interval '1 day', 
    now() - interval '5 days', 
    now(),
    2
  );
