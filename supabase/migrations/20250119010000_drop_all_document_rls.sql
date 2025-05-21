-- Find and disable RLS on ALL tables with 'document' in the name
DO $$
DECLARE
    tbl record;
BEGIN
    FOR tbl IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE tablename LIKE '%document%' 
        OR tablename LIKE '%doc%'
    LOOP
        EXECUTE format('ALTER TABLE %I.%I DISABLE ROW LEVEL SECURITY', 
                      tbl.schemaname, tbl.tablename);
        RAISE NOTICE 'Disabled RLS on %.%', tbl.schemaname, tbl.tablename;
    END LOOP;
END $$;

-- Drop ALL policies on any document-related tables
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE tablename LIKE '%document%' 
        OR tablename LIKE '%doc%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      pol.policyname, pol.schemaname, pol.tablename);
        RAISE NOTICE 'Dropped policy % on %.%', pol.policyname, pol.schemaname, pol.tablename;
    END LOOP;
END $$;

-- Ensure RLS is disabled on our specific tables
ALTER TABLE IF EXISTS project_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS project_documents_simple DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS project_docs_new DISABLE ROW LEVEL SECURITY;

-- Grant ALL privileges to ALL users on these tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Check final status
SELECT tablename, rowsecurity, forcerowsecurity
FROM pg_tables
WHERE tablename LIKE '%document%' OR tablename LIKE '%doc%'
ORDER BY tablename;