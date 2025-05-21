-- Create a public storage bucket with no RLS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('public-docs', 'public-docs', true, 52428800, null)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Update our bucket to be public
UPDATE storage.buckets 
SET public = true 
WHERE name = 'project-documents';