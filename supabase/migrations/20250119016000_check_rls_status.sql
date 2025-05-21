-- Check RLS status on all tables
CREATE OR REPLACE FUNCTION check_rls_status()
RETURNS TABLE (
    schemaname text,
    tablename text,
    rowsecurity boolean,
    forcerowsecurity boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.schemaname::text,
        t.tablename::text,
        t.rowsecurity,
        t.forcerowsecurity
    FROM pg_tables t
    WHERE t.schemaname IN ('public', 'storage', 'auth')
    ORDER BY t.rowsecurity DESC, t.schemaname, t.tablename;
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT * FROM check_rls_status();