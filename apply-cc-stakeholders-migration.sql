-- Add CC fields to projects table for multiple stakeholders
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS cc_client_ids UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS cc_user_ids UUID[] DEFAULT '{}';

-- Add comments for clarity
COMMENT ON COLUMN projects.client_id IS 'Main client/company for the project';
COMMENT ON COLUMN projects.manager_id IS 'Main person in charge/manager for the project';
COMMENT ON COLUMN projects.cc_client_ids IS 'Additional client companies (CC) involved in the project';
COMMENT ON COLUMN projects.cc_user_ids IS 'Additional users (CC) involved in the project';

-- Create indexes for better query performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_projects_cc_client_ids ON projects USING GIN (cc_client_ids);
CREATE INDEX IF NOT EXISTS idx_projects_cc_user_ids ON projects USING GIN (cc_user_ids);

-- Update RLS policies to include CC stakeholders
DROP POLICY IF EXISTS "Users can view projects they are involved in" ON projects;

CREATE POLICY "Users can view projects they are involved in" ON projects
  FOR SELECT
  USING (
    auth.uid() = manager_id OR
    auth.uid() = client_id OR
    auth.uid() = ANY(cc_user_ids) OR
    auth.uid() = ANY(cc_client_ids) OR
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- Function to get all project stakeholders
CREATE OR REPLACE FUNCTION get_project_stakeholders(project_id UUID)
RETURNS TABLE (
  stakeholder_id UUID,
  stakeholder_type TEXT,
  stakeholder_role TEXT,
  full_name TEXT,
  email TEXT,
  company_name TEXT
) AS $$
BEGIN
  -- Main client
  RETURN QUERY
  SELECT 
    c.id,
    'client'::TEXT,
    'main'::TEXT,
    c.company_name,
    c.company_email,
    c.company_name
  FROM projects p
  JOIN companies c ON c.id = p.client_id
  WHERE p.id = project_id;

  -- Main manager
  RETURN QUERY
  SELECT 
    u.id,
    'user'::TEXT,
    'main'::TEXT,
    u.full_name,
    u.email,
    u.company_name
  FROM projects p
  JOIN users u ON u.id = p.manager_id
  WHERE p.id = project_id;

  -- CC clients
  RETURN QUERY
  SELECT 
    c.id,
    'client'::TEXT,
    'cc'::TEXT,
    c.company_name,
    c.company_email,
    c.company_name
  FROM projects p
  CROSS JOIN LATERAL unnest(p.cc_client_ids) AS cc_id
  JOIN companies c ON c.id = cc_id
  WHERE p.id = project_id;

  -- CC users
  RETURN QUERY
  SELECT 
    u.id,
    'user'::TEXT,
    'cc'::TEXT,
    u.full_name,
    u.email,
    u.company_name
  FROM projects p
  CROSS JOIN LATERAL unnest(p.cc_user_ids) AS cc_id
  JOIN users u ON u.id = cc_id
  WHERE p.id = project_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions on the function
GRANT EXECUTE ON FUNCTION get_project_stakeholders(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_project_stakeholders(UUID) TO anon;