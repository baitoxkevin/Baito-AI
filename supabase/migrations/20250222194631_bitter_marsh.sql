/*
  # Create Projects Table

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `title` (text)
      - `client_id` (uuid, foreign key)
      - `manager_id` (uuid, foreign key)
      - `status` (text)
      - `priority` (text)
      - `start_date` (timestamptz)
      - `end_date` (timestamptz)
      - `crew_count` (integer)
      - `filled_positions` (integer)
      - `working_hours_start` (text)
      - `working_hours_end` (text)
      - `event_type` (text)
      - `venue_address` (text)
      - `venue_details` (text)
      - `supervisors_required` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `projects` table
    - Add policies for authenticated users to:
      - Read all projects
      - Create new projects
      - Update their own projects
      - Delete their own projects
*/

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  client_id uuid REFERENCES auth.users(id),
  manager_id uuid REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'draft',
  priority text NOT NULL DEFAULT 'medium',
  start_date timestamptz NOT NULL,
  end_date timestamptz,
  crew_count integer NOT NULL DEFAULT 1,
  filled_positions integer NOT NULL DEFAULT 0,
  working_hours_start text NOT NULL,
  working_hours_end text NOT NULL,
  event_type text NOT NULL,
  venue_address text NOT NULL,
  venue_details text,
  supervisors_required integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to read all projects
CREATE POLICY "Users can read all projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy to allow authenticated users to create projects
CREATE POLICY "Users can create projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy to allow users to update their own projects
CREATE POLICY "Users can update own projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = manager_id);

-- Policy to allow users to delete their own projects
CREATE POLICY "Users can delete own projects"
  ON projects
  FOR DELETE
  TO authenticated
  USING (auth.uid() = manager_id);