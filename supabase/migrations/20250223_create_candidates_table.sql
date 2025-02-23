-- Create candidates table with required fields
CREATE TABLE IF NOT EXISTS public.candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT,
  status TEXT CHECK (status IN ('available', 'unavailable', 'pending')),
  rating DECIMAL(3,1) CHECK (rating >= 0 AND rating <= 5),
  skills TEXT[] DEFAULT '{}',
  experience_years INTEGER,
  preferred_locations TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  last_active_at TIMESTAMPTZ DEFAULT now(),
  completed_projects INTEGER DEFAULT 0
);

-- Add RLS policies
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can do everything"
ON candidates
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.is_super_admin = true
  )
);

CREATE POLICY "Regular users can view candidates"
ON candidates
FOR SELECT
TO authenticated
USING (true);
