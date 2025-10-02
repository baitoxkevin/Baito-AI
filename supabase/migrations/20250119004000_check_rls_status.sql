-- Check if RLS is actually disabled on the table
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    forcerowsecurity
FROM pg_tables 
WHERE tablename = 'project_documents';

-- Check all policies on the table (should be none now)
SELECT * FROM pg_policies 
WHERE tablename = 'project_documents';

-- Check all constraints on the table
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'project_documents'::regclass;

-- Check triggers on the table
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'project_documents';

-- Create a function to bypass all checks and insert a test record
CREATE OR REPLACE FUNCTION test_document_insert()
RETURNS void AS $$
BEGIN
    INSERT INTO project_documents (
        project_id,
        file_name,
        file_type,
        uploaded_by
    ) VALUES (
        '0df389cc-e9a7-4b1e-a314-fc1b57706826',
        'test_document.txt',
        'text/plain',
        NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;