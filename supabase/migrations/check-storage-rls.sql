-- Check current RLS status on storage tables

-- Check if RLS is enabled on storage tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    forcerowsecurity as rls_forced
FROM pg_tables 
WHERE schemaname = 'storage'
AND tablename IN ('buckets', 'objects');

-- List all policies on storage.buckets
SELECT pol.polname as policy_name, 
       pol.polcmd as command,
       pol.polroles::regrole[] as roles,
       pg_get_expr(pol.polqual, pol.polrelid) as using_clause,
       pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_clause
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
JOIN pg_namespace pn ON pc.relnamespace = pn.oid
WHERE pn.nspname = 'storage' AND pc.relname = 'buckets';

-- List all policies on storage.objects
SELECT pol.polname as policy_name, 
       pol.polcmd as command,
       pol.polroles::regrole[] as roles,
       pg_get_expr(pol.polqual, pol.polrelid) as using_clause,
       pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_clause
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
JOIN pg_namespace pn ON pc.relnamespace = pn.oid
WHERE pn.nspname = 'storage' AND pc.relname = 'objects';

-- Check if expense-receipts bucket exists
SELECT * FROM storage.buckets WHERE id = 'expense-receipts';

-- Check current user permissions
SELECT has_table_privilege('authenticated', 'storage.buckets', 'SELECT');
SELECT has_table_privilege('authenticated', 'storage.buckets', 'INSERT');
SELECT has_table_privilege('authenticated', 'storage.objects', 'SELECT');
SELECT has_table_privilege('authenticated', 'storage.objects', 'INSERT');