-- Create a new table for project documents
CREATE TABLE IF NOT EXISTS project_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT,
  file_url TEXT,
  file_type VARCHAR(50) NOT NULL,
  file_size INTEGER,
  is_link BOOLEAN DEFAULT FALSE,
  is_video BOOLEAN DEFAULT FALSE,
  description TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Create indexes for faster queries
CREATE INDEX idx_project_documents_project_id ON project_documents(project_id);
CREATE INDEX idx_project_documents_file_type ON project_documents(file_type);
CREATE INDEX idx_project_documents_uploaded_by ON project_documents(uploaded_by);

-- Add RLS policies for project documents
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;

-- Policy for select - users associated with the project can view its documents
CREATE POLICY "Users can view project documents" 
  ON project_documents
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT manager_id FROM projects WHERE id = project_id
      UNION
      SELECT client_id FROM projects WHERE id = project_id
      UNION
      -- Include candidates assigned to the project
      SELECT user_id FROM project_candidates WHERE project_id = project_id
    )
    OR
    -- Super admins can see all documents
    auth.uid() IN (SELECT id FROM users WHERE is_super_admin = true)
  );

-- Policy for insert - project managers and admins can add documents
CREATE POLICY "Project managers and admins can add documents" 
  ON project_documents
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT manager_id FROM projects WHERE id = project_id
      UNION
      -- Super admins can add documents
      SELECT id FROM users WHERE is_super_admin = true
    )
  );

-- Policy for update - only document uploader, project manager, or admins can update
CREATE POLICY "Only uploader, manager, or admins can update documents" 
  ON project_documents
  FOR UPDATE
  USING (
    auth.uid() = uploaded_by
    OR
    auth.uid() IN (
      SELECT manager_id FROM projects WHERE id = project_id
      UNION
      -- Super admins can update documents
      SELECT id FROM users WHERE is_super_admin = true
    )
  );

-- Policy for delete - only uploader, project manager, or admins can delete (soft delete)
CREATE POLICY "Only uploader, manager, or admins can delete documents" 
  ON project_documents
  FOR DELETE
  USING (
    auth.uid() = uploaded_by
    OR
    auth.uid() IN (
      SELECT manager_id FROM projects WHERE id = project_id
      UNION
      -- Super admins can delete documents
      SELECT id FROM users WHERE is_super_admin = true
    )
  );

-- Create a function to update the updated_at field
CREATE OR REPLACE FUNCTION update_project_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the updated_at field
CREATE TRIGGER update_project_documents_updated_at
BEFORE UPDATE ON project_documents
FOR EACH ROW
EXECUTE FUNCTION update_project_documents_updated_at();

-- Create a bucket for project documents if it doesn't exist
DO $$
BEGIN
  PERFORM storage.create_bucket('project_documents', '{"public":"true"}');
EXCEPTION WHEN OTHERS THEN
  -- Bucket might already exist
END $$;