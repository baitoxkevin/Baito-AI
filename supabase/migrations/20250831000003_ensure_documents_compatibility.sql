-- Create a view to make project_documents compatible with the UI expectations
CREATE OR REPLACE VIEW project_documents_view AS
SELECT 
  id,
  project_id,
  name as file_name,
  file_path,
  size,
  type,
  type as content_type,
  category,
  uploaded_by,
  created_at as upload_date,
  description,
  metadata
FROM project_documents
ORDER BY created_at DESC;

-- Grant permissions
GRANT SELECT ON project_documents_view TO authenticated;
GRANT SELECT ON project_documents_view TO anon;

-- Also ensure the table structure is correct
ALTER TABLE project_documents 
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS size BIGINT,
ADD COLUMN IF NOT EXISTS file_path TEXT;

-- Update name column from existing data if needed
UPDATE project_documents 
SET name = COALESCE(name, file_name, 'Unnamed Document')
WHERE name IS NULL;

-- Enable RLS
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;