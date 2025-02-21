-- Drop existing view if it exists
DROP VIEW IF EXISTS crew_assignments_with_supervisors;

-- Create view for crew assignments with supervisor info
CREATE OR REPLACE VIEW crew_assignments_with_supervisors AS
SELECT 
  ca.id,
  ca.project_id,
  ca.position_number,
  ca.assigned_to,
  ca.supervisor_id,
  ca.is_supervisor,
  ca.assigned_at,
  ca.status,
  ca.created_at,
  ca.updated_at,
  c.full_name as crew_member_name,
  c.email as crew_member_email,
  c.experience_years as crew_member_experience,
  s.full_name as supervisor_name,
  s.email as supervisor_email,
  s.experience_years as supervisor_experience
FROM crew_assignments ca
LEFT JOIN candidates c ON ca.assigned_to = c.id
LEFT JOIN candidates s ON ca.supervisor_id = s.id;

-- Grant necessary permissions
GRANT SELECT ON crew_assignments_with_supervisors TO public;

-- Insert sample candidates if none exist
INSERT INTO candidates (
  full_name,
  email,
  phone_number,
  status,
  rating,
  experience_years,
  preferred_locations
) VALUES
  (
    'John Smith',
    'john.smith@example.com',
    '+14155552671',
    'available',
    4.5,
    5,
    ARRAY['New York', 'Los Angeles']
  ),
  (
    'Sarah Johnson',
    'sarah.j@example.com',
    '+14155552672',
    'available',
    4.8,
    8,
    ARRAY['Chicago', 'Miami']
  ),
  (
    'Michael Chen',
    'michael.c@example.com',
    '+14155552673',
    'unavailable',
    4.2,
    3,
    ARRAY['San Francisco', 'Seattle']
  ),
  (
    'Emily Brown',
    'emily.b@example.com',
    '+14155552674',
    'available',
    4.0,
    2,
    ARRAY['Boston', 'Philadelphia']
  ),
  (
    'David Wilson',
    'david.w@example.com',
    '+14155552675',
    'available',
    4.7,
    6,
    ARRAY['Las Vegas', 'Phoenix']
  )
ON CONFLICT (email) DO NOTHING;
