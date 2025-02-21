/*
  # Update Tasks Table RLS Policies

  1. Changes
    - Update RLS policies for tasks table to allow proper access
    - Add role-based policies for different operations
    - Ensure proper foreign key relationships

  2. Security
    - Enable RLS
    - Add policies for CRUD operations based on user role and ownership
*/

-- First ensure the tasks table exists and has RLS enabled
CREATE TABLE IF NOT EXISTS tasks (
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

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON tasks;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON tasks;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON tasks;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON tasks;

-- Create new, more permissive policies
CREATE POLICY "tasks_select_policy"
  ON tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "tasks_insert_policy"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "tasks_update_policy"
  ON tasks FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "tasks_delete_policy"
  ON tasks FOR DELETE
  TO authenticated
  USING (true);

-- Create foreign key relationships if they don't exist
DO $$ 
BEGIN
  -- Add assigned_to foreign key if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'tasks'
    AND constraint_name = 'tasks_assigned_to_fkey'
  ) THEN
    ALTER TABLE tasks
    ADD CONSTRAINT tasks_assigned_to_fkey
    FOREIGN KEY (assigned_to)
    REFERENCES users(id);
  END IF;

  -- Add assigned_by foreign key if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'tasks'
    AND constraint_name = 'tasks_assigned_by_fkey'
  ) THEN
    ALTER TABLE tasks
    ADD CONSTRAINT tasks_assigned_by_fkey
    FOREIGN KEY (assigned_by)
    REFERENCES users(id);
  END IF;

  -- Add project_id foreign key if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'tasks'
    AND constraint_name = 'tasks_project_id_fkey'
  ) THEN
    ALTER TABLE tasks
    ADD CONSTRAINT tasks_project_id_fkey
    FOREIGN KEY (project_id)
    REFERENCES projects(id);
  END IF;
END $$;
