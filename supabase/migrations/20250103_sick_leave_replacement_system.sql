-- Sick Leave & Replacement System
-- Migration: 20250103_sick_leave_replacement_system

-- =====================================================
-- 1. CREATE SICK LEAVES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS sick_leaves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Who & What
  crew_id UUID REFERENCES crew_members(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES project_crew_assignments(id),

  -- When
  sick_date DATE NOT NULL,
  sick_date_end DATE, -- For multi-day sick leaves
  shift_start_time TIME,
  shift_end_time TIME,

  -- Why
  reason TEXT,
  sick_note_url TEXT, -- Uploaded medical certificate

  -- Verification
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verification_otp VARCHAR(6),
  otp_sent_at TIMESTAMPTZ,
  otp_verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id), -- Manager who approved

  -- Replacement Status
  replacement_status VARCHAR(20) DEFAULT 'pending' CHECK (replacement_status IN ('pending', 'finding', 'assigned', 'failed', 'not_needed')),
  replacement_crew_id UUID REFERENCES crew_members(id),
  replacement_assigned_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Indexes for sick_leaves
CREATE INDEX idx_sick_leaves_crew ON sick_leaves(crew_id);
CREATE INDEX idx_sick_leaves_project ON sick_leaves(project_id);
CREATE INDEX idx_sick_leaves_date ON sick_leaves(sick_date);
CREATE INDEX idx_sick_leaves_verification_status ON sick_leaves(verification_status);
CREATE INDEX idx_sick_leaves_replacement_status ON sick_leaves(replacement_status);
CREATE INDEX idx_sick_leaves_created_at ON sick_leaves(created_at DESC);

-- Enable RLS
ALTER TABLE sick_leaves ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Crew can view their own sick leaves"
  ON sick_leaves FOR SELECT
  USING (crew_id = auth.uid());

CREATE POLICY "Crew can insert their own sick leaves"
  ON sick_leaves FOR INSERT
  WITH CHECK (crew_id = auth.uid());

CREATE POLICY "Managers can view all sick leaves"
  ON sick_leaves FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Managers can update sick leaves"
  ON sick_leaves FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

-- =====================================================
-- 2. CREATE REPLACEMENT REQUESTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS replacement_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- References
  sick_leave_id UUID REFERENCES sick_leaves(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  original_crew_id UUID REFERENCES crew_members(id),
  target_crew_id UUID REFERENCES crew_members(id),

  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),

  -- Matching Algorithm Scores
  match_score DECIMAL(5,2), -- Overall score 0-100
  availability_score INTEGER,
  skill_match_score INTEGER,
  distance_score INTEGER,
  performance_score INTEGER,
  familiarity_score INTEGER,
  distance_km DECIMAL(6,2),

  -- Timeline
  offered_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- 30 minutes from offered_at

  -- Notes
  pic_notes TEXT,
  crew_decline_reason TEXT,
  selected_by UUID REFERENCES users(id), -- PIC who selected this candidate

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for replacement_requests
CREATE INDEX idx_replacement_requests_sick_leave ON replacement_requests(sick_leave_id);
CREATE INDEX idx_replacement_requests_target_crew ON replacement_requests(target_crew_id);
CREATE INDEX idx_replacement_requests_status ON replacement_requests(status);
CREATE INDEX idx_replacement_requests_match_score ON replacement_requests(match_score DESC);
CREATE INDEX idx_replacement_requests_offered_at ON replacement_requests(offered_at DESC);

-- Enable RLS
ALTER TABLE replacement_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Crew can view replacement offers made to them"
  ON replacement_requests FOR SELECT
  USING (target_crew_id = auth.uid());

CREATE POLICY "Crew can update their replacement offers"
  ON replacement_requests FOR UPDATE
  USING (target_crew_id = auth.uid());

CREATE POLICY "Managers can view all replacement requests"
  ON replacement_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Managers can manage replacement requests"
  ON replacement_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

-- =====================================================
-- 3. UPDATE PROJECT_CREW_ASSIGNMENTS TABLE
-- =====================================================

-- Add replacement-related columns
ALTER TABLE project_crew_assignments
ADD COLUMN IF NOT EXISTS is_replacement BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS replacing_crew_id UUID REFERENCES crew_members(id),
ADD COLUMN IF NOT EXISTS replacement_reason VARCHAR(50) CHECK (replacement_reason IN ('sick', 'emergency', 'no-show', 'other')),
ADD COLUMN IF NOT EXISTS original_assignment_id UUID REFERENCES project_crew_assignments(id),
ADD COLUMN IF NOT EXISTS replacement_confirmed_at TIMESTAMPTZ;

-- Indexes for replacements
CREATE INDEX IF NOT EXISTS idx_assignments_is_replacement ON project_crew_assignments(is_replacement);
CREATE INDEX IF NOT EXISTS idx_assignments_replacing_crew ON project_crew_assignments(replacing_crew_id);

-- Comment on columns
COMMENT ON COLUMN project_crew_assignments.is_replacement IS 'True if this crew member is a replacement for another crew member';
COMMENT ON COLUMN project_crew_assignments.replacing_crew_id IS 'ID of the original crew member being replaced';
COMMENT ON COLUMN project_crew_assignments.replacement_reason IS 'Reason for replacement: sick, emergency, no-show, other';
COMMENT ON COLUMN project_crew_assignments.original_assignment_id IS 'Reference to the original assignment being replaced';

-- =====================================================
-- 4. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to auto-expire replacement requests after 30 minutes
CREATE OR REPLACE FUNCTION expire_replacement_requests()
RETURNS TRIGGER AS $$
BEGIN
  NEW.expires_at := NEW.offered_at + INTERVAL '30 minutes';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_replacement_request_expiry
  BEFORE INSERT ON replacement_requests
  FOR EACH ROW
  EXECUTE FUNCTION expire_replacement_requests();

-- Function to auto-update sick_leaves.updated_at
CREATE OR REPLACE FUNCTION update_sick_leaves_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sick_leaves_timestamp_trigger
  BEFORE UPDATE ON sick_leaves
  FOR EACH ROW
  EXECUTE FUNCTION update_sick_leaves_timestamp();

-- =====================================================
-- 5. CREATE VIEWS FOR COMMON QUERIES
-- =====================================================

-- View: Active sick leaves pending replacement
CREATE OR REPLACE VIEW active_sick_leaves AS
SELECT
  sl.*,
  cm.name AS crew_name,
  cm.phone_number AS crew_phone,
  p.title AS project_title,
  p.venue_address AS project_venue,
  u.name AS verified_by_name
FROM sick_leaves sl
JOIN crew_members cm ON sl.crew_id = cm.id
JOIN projects p ON sl.project_id = p.id
LEFT JOIN users u ON sl.verified_by = u.id
WHERE
  sl.verification_status = 'verified'
  AND sl.replacement_status IN ('pending', 'finding')
  AND sl.sick_date >= CURRENT_DATE
ORDER BY sl.sick_date ASC, sl.created_at ASC;

-- View: Replacement candidates with scores
CREATE OR REPLACE VIEW replacement_candidates_ranked AS
SELECT
  rr.*,
  cm.name AS candidate_name,
  cm.phone_number AS candidate_phone,
  cm.address AS candidate_address,
  ocm.name AS original_crew_name,
  p.title AS project_title,
  p.start_date AS project_start_date
FROM replacement_requests rr
JOIN crew_members cm ON rr.target_crew_id = cm.id
JOIN crew_members ocm ON rr.original_crew_id = ocm.id
JOIN projects p ON rr.project_id = p.id
WHERE rr.status = 'pending'
ORDER BY rr.sick_leave_id, rr.match_score DESC;

-- =====================================================
-- 6. GRANT PERMISSIONS
-- =====================================================

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE ON sick_leaves TO authenticated;
GRANT SELECT, INSERT, UPDATE ON replacement_requests TO authenticated;
GRANT SELECT ON active_sick_leaves TO authenticated;
GRANT SELECT ON replacement_candidates_ranked TO authenticated;

-- =====================================================
-- 7. ADD SAMPLE COMMENTS
-- =====================================================

COMMENT ON TABLE sick_leaves IS 'Tracks crew sick leave reports and replacement status';
COMMENT ON TABLE replacement_requests IS 'Tracks replacement offers and responses for sick leaves';
COMMENT ON VIEW active_sick_leaves IS 'Shows active sick leaves that need replacement';
COMMENT ON VIEW replacement_candidates_ranked IS 'Shows replacement candidates ranked by match score';
