-- Create project_job_posts table
CREATE TABLE IF NOT EXISTS project_job_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  contact_info text,
  is_published boolean DEFAULT false,
  published_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes
CREATE INDEX idx_project_job_posts_project_id ON project_job_posts(project_id);
CREATE INDEX idx_project_job_posts_created_at ON project_job_posts(created_at DESC);

-- Enable RLS
ALTER TABLE project_job_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Everyone can view published job posts
CREATE POLICY "Public can view published job posts" ON project_job_posts
  FOR SELECT
  USING (is_published = true);

-- Authenticated users can view all job posts
CREATE POLICY "Authenticated users can view all job posts" ON project_job_posts
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can create job posts
CREATE POLICY "Users can create job posts" ON project_job_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Users can update their own job posts
CREATE POLICY "Users can update own job posts" ON project_job_posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Admin and super admin can manage all job posts
CREATE POLICY "Admin can manage all job posts" ON project_job_posts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND (users.role = 'admin' OR users.is_super_admin = true)
    )
  );

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_project_job_posts_updated_at 
  BEFORE UPDATE ON project_job_posts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE project_job_posts IS 'Stores job post advertisements for projects';