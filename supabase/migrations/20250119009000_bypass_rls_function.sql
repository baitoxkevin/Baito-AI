-- Create a function that bypasses RLS to insert documents
CREATE OR REPLACE FUNCTION insert_document_bypass(doc_data JSON)
RETURNS JSON AS $$
DECLARE
  result_id UUID;
BEGIN
  -- Direct insert bypassing all policies
  INSERT INTO project_docs_new (
    project_id,
    file_name,
    file_type,
    file_path,
    file_url,
    file_size,
    description,
    uploaded_by,
    created_at
  )
  SELECT
    (doc_data->>'project_id')::TEXT,
    (doc_data->>'file_name')::TEXT,
    (doc_data->>'file_type')::TEXT,
    (doc_data->>'file_path')::TEXT,
    (doc_data->>'file_url')::TEXT,
    (doc_data->>'file_size')::BIGINT,
    (doc_data->>'description')::TEXT,
    (doc_data->>'uploaded_by')::TEXT,
    CURRENT_TIMESTAMP
  RETURNING id INTO result_id;
  
  RETURN json_build_object('id', result_id, 'success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to all roles
GRANT EXECUTE ON FUNCTION insert_document_bypass(JSON) TO anon;
GRANT EXECUTE ON FUNCTION insert_document_bypass(JSON) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_document_bypass(JSON) TO service_role;