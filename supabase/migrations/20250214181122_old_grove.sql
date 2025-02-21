/*
  # Fix Authentication and Database Setup

  1. Changes
    - Drop existing policies to avoid conflicts
    - Create proper auth schema and tables
    - Set up RLS policies
    - Create indexes for performance
    - Add sample data

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "public_read_candidates" ON candidates;
DROP POLICY IF EXISTS "authenticated_insert_candidates" ON candidates;
DROP POLICY IF EXISTS "authenticated_update_candidates" ON candidates;

-- Drop and recreate candidates table
DROP TABLE IF EXISTS candidates CASCADE;

-- Create candidates table
CREATE TABLE candidates (
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
CREATE INDEX idx_candidates_status ON candidates(status);
CREATE INDEX idx_candidates_rating ON candidates(rating);
CREATE INDEX idx_candidates_experience_years ON candidates(experience_years);
CREATE INDEX idx_candidates_last_active ON candidates(last_active);

-- Enable RLS
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies with public access
CREATE POLICY "allow_public_read"
  ON candidates
  FOR SELECT
  USING (true);

CREATE POLICY "allow_authenticated_insert"
  ON candidates
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "allow_authenticated_update"
  ON candidates
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_candidates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_candidates_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION update_candidates_updated_at();

-- Insert sample data
INSERT INTO candidates (
  full_name,
  email,
  contact_phone,
  status,
  rating,
  skills,
  experience_years,
  preferred_locations
) VALUES
  (
    'John Smith',
    'john.smith@example.com',
    '+14155552671',
    'available',
    4.5,
    ARRAY['Photography', 'Videography', 'Editing'],
    5,
    ARRAY['New York', 'Los Angeles']
  ),
  (
    'Sarah Johnson',
    'sarah.j@example.com',
    '+14155552672',
    'available',
    4.8,
    ARRAY['Event Planning', 'Customer Service', 'Team Leadership'],
    8,
    ARRAY['Chicago', 'Miami']
  ),
  (
    'Michael Chen',
    'michael.c@example.com',
    '+14155552673',
    'unavailable',
    4.2,
    ARRAY['Sound Engineering', 'Live Production', 'Equipment Setup'],
    3,
    ARRAY['San Francisco', 'Seattle']
  ),
  (
    'Emily Brown',
    'emily.b@example.com',
    '+14155552674',
    'pending',
    0,
    ARRAY['Stage Management', 'Lighting Design'],
    2,
    ARRAY['Boston', 'Philadelphia']
  ),
  (
    'David Wilson',
    'david.w@example.com',
    '+14155552675',
    'available',
    4.7,
    ARRAY['Security', 'Crowd Management', 'First Aid'],
    6,
    ARRAY['Las Vegas', 'Phoenix']
  )
ON CONFLICT (email) DO NOTHING;
