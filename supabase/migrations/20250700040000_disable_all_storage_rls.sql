-- Simple migration to completely disable storage RLS for testing

-- Disable RLS on all storage tables
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Create the expense-receipts bucket if needed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'expense-receipts') THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'expense-receipts', 
            'expense-receipts', 
            false, 
            10485760, -- 10MB
            ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'image/webp']
        );
    END IF;
END $$;

-- Grant all permissions (since RLS is disabled, this ensures access)
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO anon;
GRANT ALL ON storage.objects TO anon;