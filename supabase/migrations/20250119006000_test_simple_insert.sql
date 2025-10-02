-- Test direct insert into the simple table
INSERT INTO project_documents_simple (
    project_id,
    file_name,
    file_type,
    uploaded_by
) VALUES (
    '0df389cc-e9a7-4b1e-a314-fc1b57706826',
    'test_file.pdf',
    'application/pdf',
    '6ca2517b-b2dc-464d-92f8-902ae62e6ed8'
);

-- Check if RLS is still somehow enabled
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname = 'project_documents_simple';

-- Check all policies on the table (should be none)
SELECT * FROM pg_policies 
WHERE tablename = 'project_documents_simple';