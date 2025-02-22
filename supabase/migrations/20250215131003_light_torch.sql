-- Drop existing view if it exists
DROP VIEW IF EXISTS crew_assignments_with_supervisors;

-- Create view for crew assignments with supervisor info
CREATE OR REPLACE VIEW crew_assignments_with_supervisors AS
SELECT 
  ca.id,
  ca.project_id,
  ca.position_number,
  ca.assigned_to,
  ca.is_supervisor,
  ca.assigned_at,
  ca.status,
  ca.created_at,
  ca.updated_at,
  c.full_name as crew_member_name,
  c.email as crew_member_email,
  c.experience_years as crew_member_experience
FROM crew_assignments ca
LEFT JOIN candidates c ON ca.assigned_to = c.id;

-- Grant necessary permissions
GRANT SELECT ON crew_assignments_with_supervisors TO authenticated;
GRANT SELECT ON crew_assignments_with_supervisors TO anon;
