-- Create attendance table for GPS clock-in/out tracking
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  check_in_time TIMESTAMPTZ NOT NULL,
  check_in_lat DECIMAL(10, 8),
  check_in_lng DECIMAL(11, 8),
  check_in_photo_url TEXT,
  check_out_time TIMESTAMPTZ,
  check_out_lat DECIMAL(10, 8),
  check_out_lng DECIMAL(11, 8),
  check_out_photo_url TEXT,
  total_hours DECIMAL(5, 2),
  status TEXT CHECK (status IN ('checked_in', 'checked_out', 'pending_approval')) DEFAULT 'checked_in',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_attendance_project_id ON attendance(project_id);
CREATE INDEX IF NOT EXISTS idx_attendance_candidate_id ON attendance(candidate_id);
CREATE INDEX IF NOT EXISTS idx_attendance_check_in_time ON attendance(check_in_time);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);

-- Enable PostGIS if not already enabled (for geospatial queries)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create geofence validation function
CREATE OR REPLACE FUNCTION validate_geofence(
  user_lat DECIMAL,
  user_lng DECIMAL,
  p_project_id UUID,
  radius_meters INTEGER DEFAULT 100
) RETURNS BOOLEAN AS $$
DECLARE
  project_lat DECIMAL;
  project_lng DECIMAL;
  distance DECIMAL;
BEGIN
  -- Get project location
  SELECT venue_lat, venue_lng INTO project_lat, project_lng
  FROM projects
  WHERE id = p_project_id;

  -- If project doesn't have coordinates, allow check-in
  IF project_lat IS NULL OR project_lng IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Calculate distance using PostGIS
  SELECT ST_Distance(
    ST_MakePoint(user_lng, user_lat)::geography,
    ST_MakePoint(project_lng, project_lat)::geography
  ) INTO distance;

  -- Return true if within radius
  RETURN distance <= radius_meters;
END;
$$ LANGUAGE plpgsql;

-- Create function to automatically calculate total hours on check-out
CREATE OR REPLACE FUNCTION calculate_attendance_hours()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.check_out_time IS NOT NULL AND OLD.check_out_time IS NULL THEN
    NEW.total_hours := EXTRACT(EPOCH FROM (NEW.check_out_time - NEW.check_in_time)) / 3600;
    NEW.status := 'checked_out';
    NEW.updated_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic hours calculation
DROP TRIGGER IF EXISTS trigger_calculate_hours ON attendance;
CREATE TRIGGER trigger_calculate_hours
  BEFORE UPDATE ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION calculate_attendance_hours();

-- Create RLS policies for attendance table
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own attendance
CREATE POLICY "Users can view own attendance"
  ON attendance FOR SELECT
  USING (auth.uid() = candidate_id);

-- Policy: Users can insert their own attendance (check-in)
CREATE POLICY "Users can create own attendance"
  ON attendance FOR INSERT
  WITH CHECK (auth.uid() = candidate_id);

-- Policy: Users can update their own attendance (check-out)
CREATE POLICY "Users can update own attendance"
  ON attendance FOR UPDATE
  USING (auth.uid() = candidate_id);

-- Policy: Admins can view all attendance
CREATE POLICY "Admins can view all attendance"
  ON attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Add venue_lat and venue_lng to projects table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'venue_lat'
  ) THEN
    ALTER TABLE projects ADD COLUMN venue_lat DECIMAL(10, 8);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'venue_lng'
  ) THEN
    ALTER TABLE projects ADD COLUMN venue_lng DECIMAL(11, 8);
  END IF;
END $$;

-- Create storage bucket for attendance photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('attendance-photos', 'attendance-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for attendance photos
CREATE POLICY "Users can upload own attendance photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'attendance-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own attendance photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'attendance-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all attendance photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'attendance-photos'
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );
