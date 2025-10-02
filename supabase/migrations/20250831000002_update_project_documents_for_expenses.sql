-- Ensure project_documents table has all necessary columns for expense receipts
ALTER TABLE project_documents 
ADD COLUMN IF NOT EXISTS category VARCHAR(50),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add index for category to improve query performance
CREATE INDEX IF NOT EXISTS idx_project_documents_category 
ON project_documents(category);

-- Add index for project_id if not exists
CREATE INDEX IF NOT EXISTS idx_project_documents_project 
ON project_documents(project_id);

-- Update RLS policies to ensure users can view project documents
CREATE POLICY IF NOT EXISTS "Users can view project documents" ON project_documents
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      auth.uid() = uploaded_by OR
      auth.uid() IN (
        SELECT user_id FROM project_staff WHERE project_id = project_documents.project_id
      )
    )
  );

-- Policy for inserting documents
CREATE POLICY IF NOT EXISTS "Users can upload project documents" ON project_documents
  FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

-- Policy for updating own documents
CREATE POLICY IF NOT EXISTS "Users can update own documents" ON project_documents
  FOR UPDATE
  USING (auth.uid() = uploaded_by)
  WITH CHECK (auth.uid() = uploaded_by);

-- Policy for deleting own documents
CREATE POLICY IF NOT EXISTS "Users can delete own documents" ON project_documents
  FOR DELETE
  USING (auth.uid() = uploaded_by);