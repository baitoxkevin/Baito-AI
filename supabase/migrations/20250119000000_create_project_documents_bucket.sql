-- Create the project-documents storage bucket
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'project-documents',
  'project-documents', 
  true, -- Make it public so we can access files via URL
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/jpeg', 'image/png', 'image/gif', 'application/zip']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create RLS policies for the bucket
CREATE POLICY "Allow authenticated users to upload documents" ON storage.objects
  FOR INSERT TO authenticated
  USING (bucket_id = 'project-documents');

CREATE POLICY "Allow authenticated users to update their documents" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'project-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow authenticated users to delete their documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'project-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow public to view documents" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'project-documents');