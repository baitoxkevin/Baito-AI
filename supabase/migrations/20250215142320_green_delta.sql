-- Create or update enums
DO $$ 
BEGIN
  -- Create gender enum if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_type') THEN
    CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');
  END IF;

  -- Create language proficiency enum if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'proficiency_level') THEN
    CREATE TYPE proficiency_level AS ENUM ('basic', 'intermediate', 'fluent', 'native');
  END IF;

  -- Create availability status enum if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'availability_status') THEN
    CREATE TYPE availability_status AS ENUM ('available', 'unavailable', 'limited');
  END IF;
END $$;

-- Drop existing candidates table
DROP TABLE IF EXISTS candidates CASCADE;

-- Create candidates table with comprehensive profile fields
CREATE TABLE candidates (
  -- Basic Information
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  short_name text,
  ic_number text UNIQUE,
  gender gender_type,
  date_of_birth date,
  nationality text,
  citizenship_status text,
  
  -- Contact Information
  email text UNIQUE NOT NULL,
  phone_number text,
  current_address text,
  preferred_locations text[],
  
  -- Emergency Contact
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relationship text,
  
  -- Education & Background
  field_of_studies text,
  highest_education text,
  professional_certifications text[],
  
  -- Physical Attributes
  height_cm numeric(5,2),
  weight_kg numeric(5,2),
  dress_size text,
  
  -- Language Skills (JSONB for flexibility)
  language_proficiencies jsonb DEFAULT '[]'::jsonb,
  
  -- Work-Related
  availability_status availability_status DEFAULT 'available',
  availability_schedule jsonb DEFAULT '{}'::jsonb,
  preferred_working_days text[],
  preferred_working_hours jsonb DEFAULT '{
    "weekday": {"start": "09:00", "end": "18:00"},
    "weekend": {"start": "10:00", "end": "19:00"}
  }'::jsonb,
  notice_period_days integer DEFAULT 7,
  
  -- Professional Details
  hourly_rate numeric(10,2),
  bank_name text,
  bank_account_number text,
  tax_id text,
  insurance_provider text,
  insurance_policy_number text,
  
  -- Vehicle & Transport
  has_driving_license boolean DEFAULT false,
  vehicle_type text[],
  license_types text[],
  
  -- Performance Metrics
  rating numeric(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  completion_rate numeric(5,2) DEFAULT 0,
  attendance_rate numeric(5,2) DEFAULT 0,
  punctuality_score numeric(5,2) DEFAULT 0,
  completed_projects integer DEFAULT 0,
  experience_years integer DEFAULT 0,
  
  -- Skills Assessment (1-5 scale)
  sales_experience integer CHECK (sales_experience BETWEEN 0 AND 5),
  customer_service_level integer CHECK (customer_service_level BETWEEN 0 AND 5),
  product_knowledge integer CHECK (product_knowledge BETWEEN 0 AND 5),
  tech_savviness integer CHECK (tech_savviness BETWEEN 0 AND 5),
  public_speaking integer CHECK (public_speaking BETWEEN 0 AND 5),
  
  -- Physical Capabilities
  standing_hours_capability integer,
  lifting_capability_kg numeric(5,2),
  physical_limitations text[],
  
  -- Equipment & Assets
  equipment_owned text[],
  uniform_sizes jsonb DEFAULT '{}'::jsonb,
  
  -- Social Media & Portfolio
  social_media_links jsonb DEFAULT '{}'::jsonb,
  portfolio_urls text[],
  
  -- Preferences
  preferred_event_types text[],
  preferred_brands text[],
  preferred_roles text[],
  
  -- System & Verification
  account_status text DEFAULT 'pending' CHECK (account_status IN ('pending', 'active', 'suspended', 'blacklisted')),
  verification_status jsonb DEFAULT '{
    "identity": false,
    "address": false,
    "phone": false,
    "email": false,
    "background_check": false
  }'::jsonb,
  last_active_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- File Attachments (stored as URLs)
  profile_photo_url text,
  resume_url text,
  documents jsonb DEFAULT '[]'::jsonb
);

-- Create indexes for frequently queried fields
CREATE INDEX idx_candidates_availability_status ON candidates(availability_status);
CREATE INDEX idx_candidates_rating ON candidates(rating);
CREATE INDEX idx_candidates_completion_rate ON candidates(completion_rate);
CREATE INDEX idx_candidates_preferred_locations ON candidates USING GIN (preferred_locations);
CREATE INDEX idx_candidates_preferred_event_types ON candidates USING GIN (preferred_event_types);
CREATE INDEX idx_candidates_account_status ON candidates(account_status);
CREATE INDEX idx_candidates_last_active ON candidates(last_active_at);
CREATE INDEX idx_candidates_experience_years ON candidates(experience_years);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_candidates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_candidates_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION update_candidates_updated_at();

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

-- Comments for documentation
COMMENT ON TABLE candidates IS 'Comprehensive profile information for event staff and talent';
COMMENT ON COLUMN candidates.language_proficiencies IS 'Array of language proficiencies: [{"language": "English", "level": "fluent"}]';
COMMENT ON COLUMN candidates.availability_schedule IS 'Detailed availability schedule by date';
COMMENT ON COLUMN candidates.preferred_working_hours IS 'Preferred working hours for weekdays and weekends';
COMMENT ON COLUMN candidates.uniform_sizes IS 'Various uniform measurements and sizes';
COMMENT ON COLUMN candidates.social_media_links IS 'Links to social media profiles';
COMMENT ON COLUMN candidates.verification_status IS 'Status of various verification checks';
COMMENT ON COLUMN candidates.documents IS 'Array of document URLs and metadata';
