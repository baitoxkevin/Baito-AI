-- Check ALL tables across ALL schemas that have RLS disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    forcerowsecurity
FROM pg_tables
WHERE rowsecurity = false
ORDER BY schemaname, tablename;

-- Count tables by schema
SELECT 
    schemaname,
    COUNT(*) as tables_with_rls_disabled
FROM pg_tables
WHERE rowsecurity = false
GROUP BY schemaname
ORDER BY schemaname;