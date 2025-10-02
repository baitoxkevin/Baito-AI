-- Create a new documents table without any constraints
CREATE TABLE IF NOT EXISTS project_documents_simple (
    id SERIAL PRIMARY KEY,
    project_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT,
    file_path TEXT,
    file_url TEXT,
    file_size BIGINT,
    is_link BOOLEAN DEFAULT false,
    is_video BOOLEAN DEFAULT false,
    description TEXT,
    uploaded_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Disable RLS on the new table
ALTER TABLE project_documents_simple DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON project_documents_simple TO anon;
GRANT ALL ON project_documents_simple TO authenticated;
GRANT ALL ON SEQUENCE project_documents_simple_id_seq TO anon;
GRANT ALL ON SEQUENCE project_documents_simple_id_seq TO authenticated;