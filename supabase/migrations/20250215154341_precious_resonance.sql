CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone_number TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'unavailable', 'pending')),
  rating DECIMAL(2,1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  skills TEXT[] DEFAULT '{}',
  experience_years INTEGER DEFAULT 0,
  preferred_locations TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  completed_projects INTEGER DEFAULT 0,
  bio TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  education TEXT[],
  certifications TEXT[],
  languages TEXT[],
  hourly_rate DECIMAL(10,2),
  availability_hours INTEGER,
  timezone TEXT,
  profile_image_url TEXT
);

-- Enable RLS
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public profiles are viewable by everyone" 
ON candidates FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON candidates FOR UPDATE 
USING (auth.uid()::text = id::text);
