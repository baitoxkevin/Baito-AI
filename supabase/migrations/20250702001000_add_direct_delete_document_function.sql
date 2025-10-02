-- Create a direct delete document function that bypasses RLS
CREATE OR REPLACE FUNCTION direct_delete_document(
    p_document_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_success BOOLEAN;
    v_file_path TEXT;
BEGIN
    -- Get the file path before deletion for potential storage removal
    SELECT file_path INTO v_file_path 
    FROM project_docs_new 
    WHERE id = p_document_id;
    
    -- Delete the document record
    DELETE FROM project_docs_new
    WHERE id = p_document_id;
    
    -- Check if the deletion was successful
    GET DIAGNOSTICS v_success = ROW_COUNT;
    
    RETURN json_build_object(
        'success', v_success > 0,
        'file_path', v_file_path
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
GRANT EXECUTE ON FUNCTION direct_delete_document TO anon;
GRANT EXECUTE ON FUNCTION direct_delete_document TO authenticated;
GRANT EXECUTE ON FUNCTION direct_delete_document TO service_role;