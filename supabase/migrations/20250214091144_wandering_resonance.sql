/*
  # Fix Tasks Table Structure and Policies

  1. Changes
    - Drop and recreate tasks table with proper structure
    - Set up correct RLS policies
    - Add necessary indexes
    - Create trigger for updated_at

  2. Security
    - Allow public access for all operations
    - Simplified policy structure
*/

-- First drop the tasks table and its dependencies
DROP TABLE IF EXISTS verification_checkpoints;
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

-- Create indexes for better performance
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create maximally permissive policies
CREATE POLICY "allow_all_operations"
  ON tasks
  USING (true)
  WITH CHECK (true);

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
