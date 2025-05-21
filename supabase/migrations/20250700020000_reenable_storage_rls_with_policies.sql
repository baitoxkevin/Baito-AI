-- Re-enable storage RLS with correct policies

-- Re-enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create a simple, permissive policy for expense-receipts bucket
CREATE POLICY "expense_receipts_authenticated_access" ON storage.objects
FOR ALL
TO authenticated
USING (
    bucket_id = 'expense-receipts'
)
WITH CHECK (
    bucket_id = 'expense-receipts'
);

-- Alternative approach: Create separate policies for each operation
-- CREATE POLICY "expense_receipts_select" ON storage.objects
-- FOR SELECT
-- TO authenticated
-- USING (bucket_id = 'expense-receipts');

-- CREATE POLICY "expense_receipts_insert" ON storage.objects
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'expense-receipts');

-- CREATE POLICY "expense_receipts_update" ON storage.objects
-- FOR UPDATE
-- TO authenticated
-- USING (bucket_id = 'expense-receipts')
-- WITH CHECK (bucket_id = 'expense-receipts');

-- CREATE POLICY "expense_receipts_delete" ON storage.objects
-- FOR DELETE
-- TO authenticated
-- USING (bucket_id = 'expense-receipts');