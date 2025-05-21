-- Safe storage policies that maintain security

-- 1. First ensure RLS is enabled
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('expense-receipts', 'expense-receipts', false, 10485760)
ON CONFLICT (id) DO NOTHING;

-- 3. Drop existing policies to start fresh
DROP POLICY IF EXISTS "Authenticated users can view own buckets" ON storage.buckets;
DROP POLICY IF EXISTS "Authenticated users can create buckets" ON storage.buckets;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view own files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete own files" ON storage.objects;

-- 4. Bucket policies - allow authenticated users to see the expense-receipts bucket
CREATE POLICY "Authenticated can see expense-receipts bucket" ON storage.buckets
FOR SELECT TO authenticated
USING (id = 'expense-receipts');

-- 5. Object policies - organize files by user ID
-- Files should be uploaded to paths like: {user_id}/filename.pdf

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload to own folder" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'expense-receipts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own files
CREATE POLICY "Users can view own files" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'expense-receipts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own files
CREATE POLICY "Users can update own files" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'expense-receipts' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'expense-receipts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'expense-receipts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. Alternative: More permissive policy for MVP/testing
-- Uncomment these and comment out the above if you need simpler policies
/*
CREATE POLICY "Authenticated users full access to expense-receipts" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'expense-receipts')
WITH CHECK (bucket_id = 'expense-receipts');
*/