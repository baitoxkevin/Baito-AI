-- Create project documents table
CREATE TABLE IF NOT EXISTS project_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT,
    category TEXT NOT NULL DEFAULT 'other',
    description TEXT,
    url TEXT NOT NULL,
    size BIGINT DEFAULT 0,
    uploaded_by UUID REFERENCES auth.users(id),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'active',
    folder TEXT,
    metadata JSONB,
    CONSTRAINT status_check CHECK (status IN ('active', 'archived'))
);

-- Add indexes
CREATE INDEX idx_project_documents_project_id ON project_documents(project_id);
CREATE INDEX idx_project_documents_uploaded_by ON project_documents(uploaded_by);
CREATE INDEX idx_project_documents_category ON project_documents(category);
CREATE INDEX idx_project_documents_status ON project_documents(status);

-- Enable RLS
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy: Users can view documents for projects they have access to
CREATE POLICY "Users can view project documents"
    ON project_documents
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_documents.project_id
            AND (
                p.created_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM project_staff ps
                    WHERE ps.project_id = p.id
                    AND ps.staff_member_id = auth.uid()
                )
            )
        )
    );

-- Policy: Authenticated users can insert documents to projects they have access to
CREATE POLICY "Users can upload documents to their projects"
    ON project_documents
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_documents.project_id
            AND (
                p.created_by = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM project_staff ps
                    WHERE ps.project_id = p.id
                    AND ps.staff_member_id = auth.uid()
                )
            )
        )
    );

-- Policy: Users can update their own documents
CREATE POLICY "Users can update their own documents"
    ON project_documents
    FOR UPDATE
    USING (uploaded_by = auth.uid())
    WITH CHECK (uploaded_by = auth.uid());

-- Policy: Users can delete their own documents
CREATE POLICY "Users can delete their own documents"
    ON project_documents
    FOR DELETE
    USING (uploaded_by = auth.uid());

-- Create storage bucket for project documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-documents', 'project-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Anyone can view project documents"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'project-documents');

CREATE POLICY "Authenticated users can upload project documents"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'project-documents' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can update their own uploaded documents"
    ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'project-documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    )
    WITH CHECK (
        bucket_id = 'project-documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own uploaded documents"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'project-documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at
CREATE TRIGGER update_project_documents_updated_at
    BEFORE UPDATE ON project_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();