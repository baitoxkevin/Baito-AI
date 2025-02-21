/*
  # Fix Tasks Table Migration

  1. Changes
    - Drop and recreate tables with proper constraints
    - Set up RLS policies
    - Add indexes for performance
    - Add triggers for updated_at

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- First drop the dependent verification_checkpoints table
DROP TABLE IF EXISTS verification_checkpoints;

-- Now we can safely drop and recreate the tasks table
DROP TABLE IF EXISTS tasks CASCADE;

-- Create tasks table with correct structure
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status task_status NOT NULL DEFAULT 'backlog',
  priority priority_level NOT NULL DEFAULT 'medium',
  assigned_to uuid REFERENCES users(id),
  assigned_by uuid REFERENCES users(id),
  project_id uuid REFERENCES projects(id),
  assignee_role user_role,
  due_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Recreate verification_checkpoints table
CREATE TABLE verification_checkpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id),
  title text NOT NULL,
  completed boolean DEFAULT false,
  completed_by uuid REFERENCES users(id),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_verification_checkpoints_task_id ON verification_checkpoints(task_id);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_checkpoints ENABLE ROW LEVEL SECURITY;

-- Create simplified RLS policies for tasks
CREATE POLICY "tasks_select"
  ON tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "tasks_insert"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "tasks_update"
  ON tasks FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "tasks_delete"
  ON tasks FOR DELETE
  TO authenticated
  USING (true);

-- Create RLS policies for verification_checkpoints
CREATE POLICY "verification_checkpoints_select"
  ON verification_checkpoints FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "verification_checkpoints_insert"
  ON verification_checkpoints FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "verification_checkpoints_update"
  ON verification_checkpoints FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "verification_checkpoints_delete"
  ON verification_checkpoints FOR DELETE
  TO authenticated
  USING (true);

-- Create trigger for updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
