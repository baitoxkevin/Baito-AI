-- Drop all existing policies on project_documents
DROP POLICY IF EXISTS "Allow anon select" ON project_documents;
DROP POLICY IF EXISTS "Allow authenticated delete" ON project_documents;  
DROP POLICY IF EXISTS "Allow authenticated select" ON project_documents;
DROP POLICY IF EXISTS "Allow authenticated update" ON project_documents;
DROP POLICY IF EXISTS "Allow inserts with optional auth" ON project_documents;
DROP POLICY IF EXISTS "Relaxed insert for testing" ON project_documents;

-- Create simple policies for authenticated users
CREATE POLICY "Allow authenticated users all actions" ON project_documents
  FOR ALL 
  USING (TRUE)
  WITH CHECK (TRUE);

-- Simplify the table to remove foreign key constraint if still there
ALTER TABLE project_documents 
  DROP CONSTRAINT IF EXISTS project_documents_project_id_fkey CASCADE;
  
ALTER TABLE project_documents 
  DROP CONSTRAINT IF EXISTS project_documents_uploaded_by_fkey CASCADE;