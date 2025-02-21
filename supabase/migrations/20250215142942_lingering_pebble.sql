-- Drop existing candidates table
DROP TABLE IF EXISTS candidates CASCADE;

-- Create candidates table with simplified schema
CREATE TABLE candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone_number text,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'unavailable', 'pending')),
  rating numeric(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  skills text[] DEFAULT '{}',
  experience_years integer DEFAULT 0,
  preferred_locations text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_active_at timestamptz DEFAULT now(),
  completed_projects integer DEFAULT 0
);

-- Create indexes
CREATE INDEX idx_candidates_status ON candidates(status);
CREATE INDEX idx_candidates_rating ON candidates(rating);
CREATE INDEX idx_candidates_experience_years ON candidates(experience_years);
CREATE INDEX idx_candidates_last_active ON candidates(last_active_at);

-- Enable RLS
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users"
  ON candidates FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON candidates FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON candidates FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert sample data
INSERT INTO candidates (
  full_name,
  email,
  phone_number,
  status,
  rating,
  skills,
  experience_years,
  preferred_locations,
  completed_projects
) VALUES
  (
    'John Smith',
    'john.smith@example.com',
    '+14155552671',
    'available',
    4.5,
    ARRAY['Photography', 'Videography', 'Editing'],
    5,
    ARRAY['New York', 'Los Angeles'],
    12
  ),
  (
    'Sarah Johnson',
    'sarah.j@example.com',
    '+14155552672',
    'available',
    4.8,
    ARRAY['Event Planning', 'Customer Service', 'Team Leadership'],
    8,
    ARRAY['Chicago', 'Miami'],
    24
  ),
  (
    'Michael Chen',
    'michael.c@example.com',
    '+14155552673',
    'unavailable',
    4.2,
    ARRAY['Sound Engineering', 'Live Production', 'Equipment Setup'],
    3,
    ARRAY['San Francisco', 'Seattle'],
    8
  ),
  (
    'Emily Brown',
    'emily.b@example.com',
    '+14155552674',
    'pending',
    0,
    ARRAY['Stage Management', 'Lighting Design'],
    2,
    ARRAY['Boston', 'Philadelphia'],
    0
  ),
  (
    'David Wilson',
    'david.w@example.com',
    '+14155552675',
    'available',
    4.7,
    ARRAY['Security', 'Crowd Management', 'First Aid'],
    6,
    ARRAY['Las Vegas', 'Phoenix'],
    15
  )
ON CONFLICT (email) DO NOTHING;
