-- Check all tables with 'document' in the name and their RLS status
SELECT 
    tablename,
    schemaname,
    rowsecurity,
    forcerowsecurity
FROM pg_tables 
WHERE tablename LIKE '%document%'
ORDER BY tablename;

-- Check if there are any policies on any document tables
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename LIKE '%document%';

-- Check the actual table being used
SHOW search_path;