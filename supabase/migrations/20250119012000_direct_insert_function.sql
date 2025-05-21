-- Create a direct insert function that bypasses everything
CREATE OR REPLACE FUNCTION direct_insert_document(
    p_project_id TEXT,
    p_file_name TEXT,
    p_file_type TEXT,
    p_file_path TEXT,
    p_file_url TEXT,
    p_file_size BIGINT,
    p_description TEXT,
    p_uploaded_by TEXT
)
RETURNS JSON AS $$
DECLARE
    v_id UUID;
BEGIN
    -- Direct insert without any checks
    INSERT INTO project_docs_new (
        project_id,
        file_name,
        file_type,
        file_path,
        file_url,
        file_size,
        description,
        uploaded_by
    ) VALUES (
        p_project_id,
        p_file_name,
        p_file_type,
        p_file_path,
        p_file_url,
        p_file_size,
        p_description,
        p_uploaded_by
    ) RETURNING id INTO v_id;
    
    RETURN json_build_object(
        'success', true,
        'id', v_id
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION direct_insert_document TO anon;
GRANT EXECUTE ON FUNCTION direct_insert_document TO authenticated;
GRANT EXECUTE ON FUNCTION direct_insert_document TO service_role;