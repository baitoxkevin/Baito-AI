-- Comprehensive fix for all storage RLS issues

-- 1. Temporarily disable RLS on storage.buckets
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;

-- 2. Temporarily disable RLS on storage.objects  
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 3. Create the expense-receipts bucket if it doesn't exist
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

-- 4. Drop all existing policies on storage tables
DROP POLICY IF EXISTS "Authenticated users can view own buckets" ON storage.buckets;
DROP POLICY IF EXISTS "Authenticated users can create buckets" ON storage.buckets;
DROP POLICY IF EXISTS "expense-receipts bucket access" ON storage.buckets;

DROP POLICY IF EXISTS "Authenticated users can read expense receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can write expense receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete expense receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can do everything in expense-receipts" ON storage.objects;
DROP POLICY IF EXISTS "expense-receipts authenticated access" ON storage.objects;

-- 5. Re-enable RLS with proper policies
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 6. Create simple policies for buckets
CREATE POLICY "authenticated_bucket_access" ON storage.buckets
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- 7. Create simple policies for objects in expense-receipts bucket
CREATE POLICY "expense_receipts_access" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'expense-receipts')
WITH CHECK (bucket_id = 'expense-receipts');

-- 8. Grant necessary permissions
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.objects TO authenticated;