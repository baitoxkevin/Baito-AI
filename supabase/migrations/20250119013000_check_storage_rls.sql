-- Check if there are policies on the storage schema
SELECT * FROM pg_policies 
WHERE schemaname = 'storage';

-- Check storage.buckets table
SELECT * FROM storage.buckets 
WHERE name = 'project-documents';