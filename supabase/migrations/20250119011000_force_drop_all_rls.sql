-- Force drop RLS on ALL document tables
ALTER TABLE IF EXISTS project_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS project_documents_simple DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS project_docs_new DISABLE ROW LEVEL SECURITY;

-- Drop ALL policies
DROP POLICY IF EXISTS "Allow anon select" ON project_documents;
DROP POLICY IF EXISTS "Allow authenticated delete" ON project_documents;
DROP POLICY IF EXISTS "Allow authenticated select" ON project_documents;
DROP POLICY IF EXISTS "Allow authenticated update" ON project_documents;
DROP POLICY IF EXISTS "Allow inserts with optional auth" ON project_documents;
DROP POLICY IF EXISTS "Relaxed insert for testing" ON project_documents;
DROP POLICY IF EXISTS "Allow authenticated users all actions" ON project_documents;

-- Drop policies on simple table
DROP POLICY IF EXISTS "Allow authenticated users all actions" ON project_documents_simple;

-- Make sure no policies exist on new table
DROP POLICY IF EXISTS ALL ON project_docs_new;

-- Grant all permissions
GRANT ALL ON project_documents TO anon, authenticated, service_role;
GRANT ALL ON project_documents_simple TO anon, authenticated, service_role;
GRANT ALL ON project_docs_new TO anon, authenticated, service_role;

-- Force disable RLS one more time
DO $$
BEGIN
    EXECUTE 'ALTER TABLE project_documents DISABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE project_documents_simple DISABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE project_docs_new DISABLE ROW LEVEL SECURITY';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error disabling RLS: %', SQLERRM;
END $$;