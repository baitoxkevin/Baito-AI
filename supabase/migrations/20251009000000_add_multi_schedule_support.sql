-- Migration: Add Multi-Schedule Support to Baito
-- Date: 2025-10-09
-- Story: 1.1 Database Schema for Multi-Schedule Projects
-- Author: Kevin

-- ============================================
-- STEP 1: Add multi-schedule flag to gigs table
-- ============================================

-- Add flag to indicate if gig uses multi-schedule (default: false for backward compatibility)
ALTER TABLE gigs
ADD COLUMN IF NOT EXISTS is_multi_schedule BOOLEAN DEFAULT FALSE;

-- Add index for filtering multi-schedule gigs
CREATE INDEX IF NOT EXISTS idx_gigs_multi_schedule
ON gigs(is_multi_schedule)
WHERE is_multi_schedule = TRUE;

-- ============================================
-- STEP 2: Create gig_schedules table
-- ============================================

CREATE TABLE IF NOT EXISTS gig_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to parent gig
  gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,

  -- Date range
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Location reference (will link to gig_locations)
  location_id UUID, -- References gig_locations(id), added after gig_locations is created

  -- Schedule details
  shift_start_time TIME NOT NULL,
  shift_end_time TIME NOT NULL,
  call_time TIME, -- Earlier arrival time (e.g., 8am when shift starts at 9am)

  -- Break configuration
  break_duration_minutes INTEGER DEFAULT 0,
  break_type VARCHAR(20) DEFAULT 'unpaid', -- paid, unpaid

  -- Pay can vary per schedule
  hourly_rate DECIMAL(10,2),
  daily_rate DECIMAL(10,2),

  -- Calculated fields
  estimated_hours DECIMAL(4,2) GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (shift_end_time - shift_start_time)) / 3600.0
  ) STORED,

  total_days INTEGER GENERATED ALWAYS AS (
    (end_date - start_date) + 1
  ) STORED,

  -- Status tracking
  is_active BOOLEAN DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT valid_time_range CHECK (shift_end_time > shift_start_time),
  CONSTRAINT valid_call_time CHECK (call_time IS NULL OR call_time <= shift_start_time)
);

-- Indexes for gig_schedules
CREATE INDEX idx_gig_schedules_gig ON gig_schedules(gig_id);
CREATE INDEX idx_gig_schedules_dates ON gig_schedules(start_date, end_date);
CREATE INDEX idx_gig_schedules_active ON gig_schedules(gig_id, is_active) WHERE is_active = TRUE;

-- ============================================
-- STEP 3: Create gig_locations table
-- ============================================

CREATE TABLE IF NOT EXISTS gig_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to parent gig
  gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,

  -- Location details (extend existing gigs location fields)
  location GEOGRAPHY(POINT, 4326) NOT NULL, -- PostGIS geospatial
  venue_name VARCHAR(255) NOT NULL,
  venue_address TEXT NOT NULL,
  city VARCHAR(100),
  state VARCHAR(50),
  postal_code VARCHAR(10),

  -- Additional location info
  parking_info TEXT,
  access_instructions TEXT,
  contact_person VARCHAR(255),
  contact_phone VARCHAR(20),

  -- Geofence settings (for timemark check-in/out)
  geofence_radius_meters INTEGER DEFAULT 100,

  -- Display order (for UI sorting)
  display_order INTEGER DEFAULT 1,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for gig_locations
CREATE INDEX idx_gig_locations_gig ON gig_locations(gig_id);
CREATE INDEX idx_gig_locations_location ON gig_locations USING GIST(location); -- PostGIS spatial index
CREATE INDEX idx_gig_locations_active ON gig_locations(gig_id, is_active) WHERE is_active = TRUE;

-- ============================================
-- STEP 4: Add foreign key constraint after both tables exist
-- ============================================

ALTER TABLE gig_schedules
ADD CONSTRAINT fk_gig_schedules_location
FOREIGN KEY (location_id)
REFERENCES gig_locations(id)
ON DELETE SET NULL;

CREATE INDEX idx_gig_schedules_location ON gig_schedules(location_id);

-- ============================================
-- STEP 5: Create helper function to validate no overlapping schedules
-- ============================================

CREATE OR REPLACE FUNCTION validate_no_overlapping_schedules()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if any existing schedule for this gig overlaps with the new/updated schedule
  IF EXISTS (
    SELECT 1
    FROM gig_schedules
    WHERE gig_id = NEW.gig_id
      AND id != NEW.id
      AND is_active = TRUE
      AND (
        -- New schedule overlaps existing schedule
        (NEW.start_date BETWEEN start_date AND end_date) OR
        (NEW.end_date BETWEEN start_date AND end_date) OR
        -- New schedule completely contains existing schedule
        (NEW.start_date <= start_date AND NEW.end_date >= end_date)
      )
  ) THEN
    RAISE EXCEPTION 'Schedule dates overlap with existing schedule for this gig';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_validate_no_overlapping_schedules
  BEFORE INSERT OR UPDATE ON gig_schedules
  FOR EACH ROW
  EXECUTE FUNCTION validate_no_overlapping_schedules();

-- ============================================
-- STEP 6: Create helper views for backward compatibility
-- ============================================

-- View to get primary schedule for single-schedule gigs (for backward compatibility)
CREATE OR REPLACE VIEW gigs_with_schedule AS
SELECT
  g.*,
  COALESCE(gs.start_date, g.shift_date) as effective_start_date,
  COALESCE(gs.end_date, g.shift_date) as effective_end_date,
  COALESCE(gs.shift_start_time, g.shift_start_time) as effective_start_time,
  COALESCE(gs.shift_end_time, g.shift_end_time) as effective_end_time,
  COALESCE(gl.venue_name, g.venue_name) as effective_venue_name,
  COALESCE(gl.venue_address, g.venue_address) as effective_venue_address,
  gl.id as location_id,
  gs.id as schedule_id
FROM gigs g
LEFT JOIN gig_schedules gs ON g.id = gs.gig_id AND gs.is_active = TRUE
LEFT JOIN gig_locations gl ON gs.location_id = gl.id
WHERE g.is_multi_schedule = FALSE OR gs.id IS NOT NULL;

-- ============================================
-- STEP 7: Add updated_at trigger for new tables
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for gig_schedules
CREATE TRIGGER trigger_gig_schedules_updated_at
  BEFORE UPDATE ON gig_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Triggers for gig_locations
CREATE TRIGGER trigger_gig_locations_updated_at
  BEFORE UPDATE ON gig_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 8: Add RLS policies for new tables
-- ============================================

-- Enable RLS on new tables
ALTER TABLE gig_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE gig_locations ENABLE ROW LEVEL SECURITY;

-- gig_schedules policies (inherit from gigs table)
CREATE POLICY "gig_schedules_select_public" ON gig_schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM gigs
      WHERE gigs.id = gig_schedules.gig_id
        AND gigs.status = 'open'
        AND gigs.published_at IS NOT NULL
    )
  );

CREATE POLICY "gig_schedules_select_own" ON gig_schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM gigs
      WHERE gigs.id = gig_schedules.gig_id
        AND gigs.employer_id = auth.uid()
    )
  );

CREATE POLICY "gig_schedules_insert_employer" ON gig_schedules
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM gigs
      WHERE gigs.id = gig_schedules.gig_id
        AND gigs.employer_id = auth.uid()
    )
  );

CREATE POLICY "gig_schedules_update_employer" ON gig_schedules
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM gigs
      WHERE gigs.id = gig_schedules.gig_id
        AND gigs.employer_id = auth.uid()
    )
  );

CREATE POLICY "gig_schedules_delete_employer" ON gig_schedules
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM gigs
      WHERE gigs.id = gig_schedules.gig_id
        AND gigs.employer_id = auth.uid()
    )
  );

-- gig_locations policies (same as gig_schedules)
CREATE POLICY "gig_locations_select_public" ON gig_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM gigs
      WHERE gigs.id = gig_locations.gig_id
        AND gigs.status = 'open'
        AND gigs.published_at IS NOT NULL
    )
  );

CREATE POLICY "gig_locations_select_own" ON gig_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM gigs
      WHERE gigs.id = gig_locations.gig_id
        AND gigs.employer_id = auth.uid()
    )
  );

CREATE POLICY "gig_locations_insert_employer" ON gig_locations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM gigs
      WHERE gigs.id = gig_locations.gig_id
        AND gigs.employer_id = auth.uid()
    )
  );

CREATE POLICY "gig_locations_update_employer" ON gig_locations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM gigs
      WHERE gigs.id = gig_locations.gig_id
        AND gigs.employer_id = auth.uid()
    )
  );

CREATE POLICY "gig_locations_delete_employer" ON gig_locations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM gigs
      WHERE gigs.id = gig_locations.gig_id
        AND gigs.employer_id = auth.uid()
    )
  );

-- ============================================
-- STEP 9: Add comment documentation
-- ============================================

COMMENT ON COLUMN gigs.is_multi_schedule IS 'Flag indicating if gig uses multi-schedule system (new) vs single schedule (legacy)';
COMMENT ON TABLE gig_schedules IS 'Stores multiple date ranges and schedules for multi-schedule gigs';
COMMENT ON TABLE gig_locations IS 'Stores multiple locations for multi-schedule gigs';
COMMENT ON FUNCTION validate_no_overlapping_schedules IS 'Prevents overlapping date ranges within same gig';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Summary:
-- ✓ Added is_multi_schedule flag to gigs table (default: false)
-- ✓ Created gig_schedules table for multiple date ranges
-- ✓ Created gig_locations table for multiple venues
-- ✓ Added validation to prevent overlapping schedules
-- ✓ Created backward compatibility view
-- ✓ Added updated_at triggers
-- ✓ Configured RLS policies
-- ✓ All existing single-schedule gigs continue working unchanged
