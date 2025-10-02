-- External Gigs Self-Service Tracking System
-- Allows workers to record income from non-Baito gig work

-- =============================================
-- 1. GIG CATEGORIES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS gig_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50),
  color VARCHAR(7),
  is_baito BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. EXTERNAL GIGS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS external_gigs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE NOT NULL,

  -- Basic Info
  gig_name VARCHAR(255) NOT NULL,
  client_name VARCHAR(255),
  category_id UUID REFERENCES gig_categories(id),
  gig_type VARCHAR(50) DEFAULT 'other', -- 'delivery', 'freelance', 'rideshare', 'tutoring', 'other'
  status VARCHAR(20) DEFAULT 'completed', -- 'pending', 'completed', 'verified', 'disputed'

  -- Flexible Wage Calculation
  calculation_method VARCHAR(20) DEFAULT 'fixed', -- 'fixed', 'hourly', 'project'
  hours_worked DECIMAL(5,2),
  hourly_rate DECIMAL(10,2),
  fixed_amount DECIMAL(10,2),

  -- Calculated total (computed on save)
  total_earned DECIMAL(10,2) NOT NULL,

  -- Work Details
  work_date DATE NOT NULL,
  notes TEXT,

  -- Verification (MVP: optional)
  requires_verification BOOLEAN DEFAULT FALSE,
  verification_status VARCHAR(20) DEFAULT 'self_reported', -- 'self_reported', 'pending', 'verified', 'rejected'
  receipt_url VARCHAR(500),

  -- Timestamps
  date_submitted TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. UNIFIED EARNINGS VIEW
-- =============================================

CREATE OR REPLACE VIEW unified_earnings AS
-- Baito earnings (verified)
SELECT
  'baito' as source,
  we.candidate_id,
  we.project_id::TEXT as gig_id,
  p.title as gig_name,
  'verified' as gig_type,
  we.total_earnings as amount,
  ps.scheduled_date::DATE as work_date,
  'verified' as verification_status,
  we.created_at,
  'Baito Platform' as client_name,
  NULL as hours_worked,
  NULL as hourly_rate
FROM worker_earnings we
JOIN projects p ON we.project_id = p.id
JOIN project_staff ps ON we.candidate_id = ps.candidate_id AND we.project_id = ps.project_id

UNION ALL

-- External earnings (self-reported)
SELECT
  'external' as source,
  eg.candidate_id,
  eg.id::TEXT as gig_id,
  eg.gig_name,
  eg.gig_type,
  eg.total_earned as amount,
  eg.work_date,
  eg.verification_status,
  eg.created_at,
  eg.client_name,
  eg.hours_worked,
  eg.hourly_rate
FROM external_gigs eg;

-- =============================================
-- 4. EARNINGS SUMMARY VIEW (Worker Dashboard)
-- =============================================

CREATE OR REPLACE VIEW worker_earnings_dashboard AS
SELECT
  c.id as candidate_id,
  c.full_name,
  c.email,

  -- Baito earnings
  COALESCE(SUM(CASE WHEN ue.source = 'baito' THEN ue.amount ELSE 0 END), 0) as baito_total,
  COUNT(CASE WHEN ue.source = 'baito' THEN 1 END) as baito_gigs_count,

  -- External earnings
  COALESCE(SUM(CASE WHEN ue.source = 'external' THEN ue.amount ELSE 0 END), 0) as external_total,
  COUNT(CASE WHEN ue.source = 'external' THEN 1 END) as external_gigs_count,

  -- Combined totals
  COALESCE(SUM(ue.amount), 0) as total_earnings,
  COUNT(*) as total_gigs_count,

  -- This month only
  COALESCE(SUM(CASE
    WHEN ue.source = 'baito'
    AND DATE_TRUNC('month', ue.work_date) = DATE_TRUNC('month', CURRENT_DATE)
    THEN ue.amount ELSE 0 END), 0) as baito_this_month,
  COALESCE(SUM(CASE
    WHEN ue.source = 'external'
    AND DATE_TRUNC('month', ue.work_date) = DATE_TRUNC('month', CURRENT_DATE)
    THEN ue.amount ELSE 0 END), 0) as external_this_month,
  COALESCE(SUM(CASE
    WHEN DATE_TRUNC('month', ue.work_date) = DATE_TRUNC('month', CURRENT_DATE)
    THEN ue.amount ELSE 0 END), 0) as total_this_month

FROM candidates c
LEFT JOIN unified_earnings ue ON c.id = ue.candidate_id
GROUP BY c.id, c.full_name, c.email;

-- =============================================
-- 5. INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_external_gigs_candidate ON external_gigs(candidate_id);
CREATE INDEX IF NOT EXISTS idx_external_gigs_work_date ON external_gigs(work_date);
CREATE INDEX IF NOT EXISTS idx_external_gigs_status ON external_gigs(status);
CREATE INDEX IF NOT EXISTS idx_external_gigs_category ON external_gigs(category_id);

-- =============================================
-- 6. RLS POLICIES
-- =============================================

ALTER TABLE external_gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gig_categories ENABLE ROW LEVEL SECURITY;

-- Workers can view/manage their own external gigs
DROP POLICY IF EXISTS "Workers can manage own external gigs" ON external_gigs;
CREATE POLICY "Workers can manage own external gigs"
  ON external_gigs FOR ALL
  USING (auth.uid() = candidate_id);

-- Everyone can view categories
DROP POLICY IF EXISTS "Anyone can view gig categories" ON gig_categories;
CREATE POLICY "Anyone can view gig categories"
  ON gig_categories FOR SELECT
  USING (true);

-- Admins can manage categories
DROP POLICY IF EXISTS "Admins can manage categories" ON gig_categories;
CREATE POLICY "Admins can manage categories"
  ON gig_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Grant permissions
GRANT SELECT ON unified_earnings TO authenticated;
GRANT SELECT ON worker_earnings_dashboard TO authenticated;

-- =============================================
-- 7. INSERT DEFAULT CATEGORIES
-- =============================================

INSERT INTO gig_categories (name, icon, color, is_baito) VALUES
  ('Baito Gigs', '💼', '#3B82F6', true),
  ('Food Delivery', '🍔', '#EF4444', false),
  ('Rideshare', '🚗', '#10B981', false),
  ('Freelance', '💻', '#8B5CF6', false),
  ('Tutoring', '📚', '#F59E0B', false),
  ('Event Staff', '🎪', '#EC4899', false),
  ('Other', '📋', '#6B7280', false)
ON CONFLICT DO NOTHING;

-- =============================================
-- 8. TRIGGER: Auto-calculate total_earned
-- =============================================

CREATE OR REPLACE FUNCTION calculate_external_gig_total()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate based on method
  IF NEW.calculation_method = 'fixed' THEN
    NEW.total_earned := COALESCE(NEW.fixed_amount, 0);
  ELSIF NEW.calculation_method = 'hourly' THEN
    NEW.total_earned := COALESCE(NEW.hours_worked * NEW.hourly_rate, 0);
  ELSE
    NEW.total_earned := COALESCE(NEW.fixed_amount, 0);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_calculate_external_gig_total ON external_gigs;
CREATE TRIGGER auto_calculate_external_gig_total
  BEFORE INSERT OR UPDATE ON external_gigs
  FOR EACH ROW
  EXECUTE FUNCTION calculate_external_gig_total();
