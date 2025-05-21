-- Create candidates table if it doesn't exist
CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  ic_number TEXT NOT NULL,
  date_of_birth DATE,
  phone_number TEXT NOT NULL,
  gender TEXT NOT NULL,
  email TEXT NOT NULL,
  nationality TEXT,
  emergency_contact_name TEXT,
  emergency_contact_number TEXT,
  bank_name TEXT,
  bank_account_number TEXT,
  highest_education TEXT,
  has_vehicle BOOLEAN DEFAULT FALSE,
  vehicle_type TEXT,
  is_banned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Additional fields
  entity_type TEXT,
  registration_type TEXT,
  old_registration_id TEXT,
  tin TEXT,
  sst_registration_no TEXT,
  is_customer BOOLEAN DEFAULT FALSE,
  is_supplier BOOLEAN DEFAULT FALSE,
  receivable_ac_code TEXT,
  payable_ac_code TEXT,
  income_ac_code TEXT,
  expense_ac_code TEXT,
  address_business JSONB,
  address_mailing JSONB
);

-- Create performance_metrics table if it doesn't exist
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  reliability_score NUMERIC DEFAULT 0,
  response_rate NUMERIC DEFAULT 0,
  avg_rating NUMERIC DEFAULT 0,
  total_gigs_completed INTEGER DEFAULT 0,
  no_shows INTEGER DEFAULT 0,
  late_arrivals INTEGER DEFAULT 0,
  early_terminations INTEGER DEFAULT 0,
  category_ratings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create loyalty_status table if it doesn't exist
CREATE TABLE IF NOT EXISTS loyalty_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  tier_level TEXT NOT NULL,
  total_gigs_completed INTEGER DEFAULT 0,
  current_points INTEGER DEFAULT 0,
  tier_achieved_date DATE,
  points_expiry_date DATE,
  fast_track_eligible BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create language_proficiency table if it doesn't exist
CREATE TABLE IF NOT EXISTS language_proficiency (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  proficiency_level TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for candidates
CREATE POLICY IF NOT EXISTS "Public users can read candidates"
  ON candidates FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can create candidates"
  ON candidates FOR INSERT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "Users can update candidates"
  ON candidates FOR UPDATE TO authenticated USING (true);

-- Create RLS policies for performance_metrics
CREATE POLICY IF NOT EXISTS "Public users can read performance_metrics"
  ON performance_metrics FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can create performance_metrics"
  ON performance_metrics FOR INSERT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "Users can update performance_metrics"
  ON performance_metrics FOR UPDATE TO authenticated USING (true);

-- Create RLS policies for loyalty_status
CREATE POLICY IF NOT EXISTS "Public users can read loyalty_status"
  ON loyalty_status FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can create loyalty_status"
  ON loyalty_status FOR INSERT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "Users can update loyalty_status"
  ON loyalty_status FOR UPDATE TO authenticated USING (true);

-- Create RLS policies for language_proficiency
CREATE POLICY IF NOT EXISTS "Public users can read language_proficiency"
  ON language_proficiency FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can create language_proficiency"
  ON language_proficiency FOR INSERT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "Users can update language_proficiency"
  ON language_proficiency FOR UPDATE TO authenticated USING (true);

-- Enable RLS on all tables
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE language_proficiency ENABLE ROW LEVEL SECURITY;