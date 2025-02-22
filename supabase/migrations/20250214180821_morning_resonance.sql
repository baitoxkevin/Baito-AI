-- Create candidates table if it doesn't exist
CREATE TABLE IF NOT EXISTS candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  contact_phone text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('available', 'unavailable', 'pending')),
  rating numeric(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  skills text[] DEFAULT '{}',
  experience_years integer DEFAULT 0,
  preferred_locations text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_active timestamptz DEFAULT now(),
  completed_projects integer DEFAULT 0,
  availability_start timestamptz,
  availability_end timestamptz,
  notes text,
  resume_url text,
  profile_image_url text
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_rating ON candidates(rating);
CREATE INDEX IF NOT EXISTS idx_candidates_experience_years ON candidates(experience_years);
CREATE INDEX IF NOT EXISTS idx_candidates_last_active ON candidates(last_active);

-- Enable RLS
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON candidates;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON candidates;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON candidates;

-- Create RLS policies
CREATE POLICY "candidates_read_policy"
  ON candidates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "candidates_insert_policy"
  ON candidates FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "candidates_update_policy"
  ON candidates FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_candidates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_candidates_updated_at ON candidates;
CREATE TRIGGER update_candidates_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION update_candidates_updated_at();

-- Insert sample data if table is empty
INSERT INTO candidates (
  full_name,
  email,
  contact_phone,
  status,
  rating,
  skills,
  experience_years,
  preferred_locations
) 
SELECT
  'John Smith',
  'john.smith@example.com',
  '+14155552671',
  'available',
  4.5,
  ARRAY['Photography', 'Videography', 'Editing'],
  5,
  ARRAY['New York', 'Los Angeles']
WHERE NOT EXISTS (SELECT 1 FROM candidates LIMIT 1);

INSERT INTO candidates (
  full_name,
  email,
  contact_phone,
  status,
  rating,
  skills,
  experience_years,
  preferred_locations
)
SELECT
  'Sarah Johnson',
  'sarah.j@example.com',
  '+14155552672',
  'available',
  4.8,
  ARRAY['Event Planning', 'Customer Service', 'Team Leadership'],
  8,
  ARRAY['Chicago', 'Miami']
WHERE NOT EXISTS (SELECT 1 FROM candidates LIMIT 1);

INSERT INTO candidates (
  full_name,
  email,
  contact_phone,
  status,
  rating,
  skills,
  experience_years,
  preferred_locations
)
SELECT
  'Michael Chen',
  'michael.c@example.com',
  '+14155552673',
  'unavailable',
  4.2,
  ARRAY['Sound Engineering', 'Live Production', 'Equipment Setup'],
  3,
  ARRAY['San Francisco', 'Seattle']
WHERE NOT EXISTS (SELECT 1 FROM candidates LIMIT 1);

INSERT INTO candidates (
  full_name,
  email,
  contact_phone,
  status,
  rating,
  skills,
  experience_years,
  preferred_locations
)
SELECT
  'Emily Brown',
  'emily.b@example.com',
  '+14155552674',
  'pending',
  0,
  ARRAY['Stage Management', 'Lighting Design'],
  2,
  ARRAY['Boston', 'Philadelphia']
WHERE NOT EXISTS (SELECT 1 FROM candidates LIMIT 1);

INSERT INTO candidates (
  full_name,
  email,
  contact_phone,
  status,
  rating,
  skills,
  experience_years,
  preferred_locations
)
SELECT
  'David Wilson',
  'david.w@example.com',
  '+14155552675',
  'available',
  4.7,
  ARRAY['Security', 'Crowd Management', 'First Aid'],
  6,
  ARRAY['Las Vegas', 'Phoenix']
WHERE NOT EXISTS (SELECT 1 FROM candidates LIMIT 1);
