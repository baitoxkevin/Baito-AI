-- Drop foreign key constraint temporarily to allow uploads with non-existent project IDs
ALTER TABLE project_documents 
  DROP CONSTRAINT IF EXISTS project_documents_project_id_fkey;

-- Add a more relaxed RLS policy for INSERT operations
DROP POLICY IF EXISTS "Allow inserts with optional auth" ON project_documents;

CREATE POLICY "Relaxed insert for testing" ON project_documents
  FOR INSERT 
  WITH CHECK (TRUE);