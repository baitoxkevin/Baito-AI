-- Create a completely fresh table
CREATE TABLE IF NOT EXISTS project_docs_new (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT,
    file_path TEXT,
    file_url TEXT,
    file_size BIGINT,
    description TEXT,
    uploaded_by TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Disable RLS
ALTER TABLE project_docs_new DISABLE ROW LEVEL SECURITY;

-- Grant all permissions
GRANT ALL ON project_docs_new TO anon;
GRANT ALL ON project_docs_new TO authenticated;
GRANT ALL ON project_docs_new TO postgres;
GRANT ALL ON project_docs_new TO service_role;