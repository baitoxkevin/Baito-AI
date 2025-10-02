-- Payment System for Gig Workers

-- =============================================
-- 1. WORKER EARNINGS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS worker_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  base_salary DECIMAL(10, 2) NOT NULL DEFAULT 0,
  overtime_hours DECIMAL(5, 2) DEFAULT 0,
  overtime_rate DECIMAL(10, 2) DEFAULT 0,
  overtime_pay DECIMAL(10, 2) DEFAULT 0,
  bonus DECIMAL(10, 2) DEFAULT 0,
  deductions DECIMAL(10, 2) DEFAULT 0,
  total_earnings DECIMAL(10, 2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'processing', 'paid', 'failed')) DEFAULT 'pending',
  payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'cash', 'e_wallet', 'check')),
  payment_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. PAYMENT BATCHES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS payment_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number TEXT UNIQUE NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_workers INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending', 'processing', 'completed', 'failed')) DEFAULT 'draft',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('bank_transfer', 'cash', 'e_wallet', 'check')),
  scheduled_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. PAYMENT BATCH ITEMS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS payment_batch_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES payment_batches(id) ON DELETE CASCADE,
  earning_id UUID REFERENCES worker_earnings(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'paid', 'failed')) DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. PAYMENT HISTORY TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  earning_id UUID REFERENCES worker_earnings(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES payment_batches(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'processing', 'paid', 'failed')),
  transaction_id TEXT,
  payment_date TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. SALARY CONFIGURATIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS salary_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL UNIQUE,
  base_hourly_rate DECIMAL(10, 2) NOT NULL,
  overtime_multiplier DECIMAL(3, 2) NOT NULL DEFAULT 1.5,
  night_shift_bonus DECIMAL(10, 2) DEFAULT 0,
  weekend_bonus DECIMAL(10, 2) DEFAULT 0,
  minimum_hours DECIMAL(5, 2) DEFAULT 0,
  maximum_hours DECIMAL(5, 2) DEFAULT 12,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 6. INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_worker_earnings_candidate ON worker_earnings(candidate_id);
CREATE INDEX IF NOT EXISTS idx_worker_earnings_project ON worker_earnings(project_id);
CREATE INDEX IF NOT EXISTS idx_worker_earnings_status ON worker_earnings(payment_status);
CREATE INDEX IF NOT EXISTS idx_worker_earnings_date ON worker_earnings(payment_date);

CREATE INDEX IF NOT EXISTS idx_payment_batches_status ON payment_batches(status);
CREATE INDEX IF NOT EXISTS idx_payment_batches_scheduled ON payment_batches(scheduled_date);

CREATE INDEX IF NOT EXISTS idx_payment_batch_items_batch ON payment_batch_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_payment_batch_items_candidate ON payment_batch_items(candidate_id);

CREATE INDEX IF NOT EXISTS idx_payment_history_candidate ON payment_history(candidate_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_date ON payment_history(payment_date);

-- =============================================
-- 7. FUNCTION: Calculate Worker Earnings
-- =============================================

CREATE OR REPLACE FUNCTION calculate_worker_earnings(
  p_candidate_id UUID,
  p_project_id UUID
) RETURNS UUID AS $$
DECLARE
  v_earning_id UUID;
  v_hours_worked DECIMAL(5, 2);
  v_base_salary DECIMAL(10, 2);
  v_overtime_hours DECIMAL(5, 2);
  v_overtime_pay DECIMAL(10, 2);
  v_total_earnings DECIMAL(10, 2);
  v_hourly_rate DECIMAL(10, 2);
  v_overtime_multiplier DECIMAL(3, 2);
BEGIN
  -- Get hours worked from attendance
  SELECT
    COALESCE(SUM(EXTRACT(EPOCH FROM (checkout_time - checkin_time)) / 3600), 0)
  INTO v_hours_worked
  FROM attendance
  WHERE candidate_id = p_candidate_id
    AND project_id = p_project_id
    AND status = 'checked_in';

  -- Get hourly rate from salary configuration (default to project staff rate if not found)
  SELECT
    COALESCE(sc.base_hourly_rate, ps.hourly_rate, 0),
    COALESCE(sc.overtime_multiplier, 1.5)
  INTO v_hourly_rate, v_overtime_multiplier
  FROM project_staff ps
  LEFT JOIN salary_configurations sc ON sc.role = ps.role
  WHERE ps.candidate_id = p_candidate_id
    AND ps.project_id = p_project_id
  LIMIT 1;

  -- Calculate base salary (up to 8 hours)
  v_base_salary := LEAST(v_hours_worked, 8) * v_hourly_rate;

  -- Calculate overtime (hours beyond 8)
  v_overtime_hours := GREATEST(v_hours_worked - 8, 0);
  v_overtime_pay := v_overtime_hours * v_hourly_rate * v_overtime_multiplier;

  -- Total earnings
  v_total_earnings := v_base_salary + v_overtime_pay;

  -- Insert or update worker earnings
  INSERT INTO worker_earnings (
    candidate_id,
    project_id,
    base_salary,
    overtime_hours,
    overtime_rate,
    overtime_pay,
    total_earnings
  ) VALUES (
    p_candidate_id,
    p_project_id,
    v_base_salary,
    v_overtime_hours,
    v_hourly_rate * v_overtime_multiplier,
    v_overtime_pay,
    v_total_earnings
  )
  ON CONFLICT (candidate_id, project_id)
  DO UPDATE SET
    base_salary = EXCLUDED.base_salary,
    overtime_hours = EXCLUDED.overtime_hours,
    overtime_rate = EXCLUDED.overtime_rate,
    overtime_pay = EXCLUDED.overtime_pay,
    total_earnings = EXCLUDED.total_earnings,
    updated_at = NOW()
  RETURNING id INTO v_earning_id;

  RETURN v_earning_id;
END;
$$ LANGUAGE plpgsql;

-- Add unique constraint to prevent duplicate earnings
ALTER TABLE worker_earnings
ADD CONSTRAINT unique_candidate_project UNIQUE (candidate_id, project_id);

-- =============================================
-- 8. FUNCTION: Create Payment Batch
-- =============================================

CREATE OR REPLACE FUNCTION create_payment_batch(
  p_earning_ids UUID[],
  p_payment_method TEXT,
  p_scheduled_date TIMESTAMPTZ,
  p_created_by UUID,
  p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_batch_id UUID;
  v_batch_number TEXT;
  v_total_amount DECIMAL(12, 2);
  v_total_workers INTEGER;
  v_earning_id UUID;
BEGIN
  -- Generate batch number
  v_batch_number := 'BATCH-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

  -- Calculate totals
  SELECT
    COALESCE(SUM(total_earnings), 0),
    COUNT(DISTINCT candidate_id)
  INTO v_total_amount, v_total_workers
  FROM worker_earnings
  WHERE id = ANY(p_earning_ids);

  -- Create payment batch
  INSERT INTO payment_batches (
    batch_number,
    total_amount,
    total_workers,
    payment_method,
    scheduled_date,
    created_by,
    notes,
    status
  ) VALUES (
    v_batch_number,
    v_total_amount,
    v_total_workers,
    p_payment_method,
    p_scheduled_date,
    p_created_by,
    p_notes,
    'pending'
  ) RETURNING id INTO v_batch_id;

  -- Add earnings to batch
  FOREACH v_earning_id IN ARRAY p_earning_ids
  LOOP
    INSERT INTO payment_batch_items (batch_id, earning_id, candidate_id, amount)
    SELECT
      v_batch_id,
      we.id,
      we.candidate_id,
      we.total_earnings
    FROM worker_earnings we
    WHERE we.id = v_earning_id;
  END LOOP;

  RETURN v_batch_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 9. FUNCTION: Process Payment Batch
-- =============================================

CREATE OR REPLACE FUNCTION process_payment_batch(
  p_batch_id UUID,
  p_approved_by UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_item RECORD;
BEGIN
  -- Update batch status
  UPDATE payment_batches
  SET
    status = 'processing',
    approved_by = p_approved_by,
    updated_at = NOW()
  WHERE id = p_batch_id;

  -- Process each payment
  FOR v_item IN
    SELECT * FROM payment_batch_items WHERE batch_id = p_batch_id
  LOOP
    -- Update batch item status
    UPDATE payment_batch_items
    SET status = 'paid', updated_at = NOW()
    WHERE id = v_item.id;

    -- Update worker earnings status
    UPDATE worker_earnings
    SET
      payment_status = 'paid',
      payment_date = NOW(),
      updated_at = NOW()
    WHERE id = v_item.earning_id;

    -- Create payment history record
    INSERT INTO payment_history (
      candidate_id,
      earning_id,
      batch_id,
      amount,
      payment_method,
      payment_status,
      payment_date
    )
    SELECT
      we.candidate_id,
      we.id,
      p_batch_id,
      we.total_earnings,
      pb.payment_method,
      'paid',
      NOW()
    FROM worker_earnings we
    JOIN payment_batches pb ON pb.id = p_batch_id
    WHERE we.id = v_item.earning_id;
  END LOOP;

  -- Mark batch as completed
  UPDATE payment_batches
  SET
    status = 'completed',
    completed_date = NOW(),
    updated_at = NOW()
  WHERE id = p_batch_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 10. EARNINGS SUMMARY VIEW
-- =============================================

CREATE OR REPLACE VIEW worker_earnings_summary AS
SELECT
  c.id as candidate_id,
  c.full_name,
  c.email,
  c.phone,
  COUNT(DISTINCT we.id) as total_projects_paid,
  COALESCE(SUM(we.total_earnings), 0) as total_earnings,
  COALESCE(SUM(CASE WHEN we.payment_status = 'paid' THEN we.total_earnings ELSE 0 END), 0) as total_paid,
  COALESCE(SUM(CASE WHEN we.payment_status = 'pending' THEN we.total_earnings ELSE 0 END), 0) as total_pending,
  COALESCE(AVG(we.total_earnings), 0) as avg_earnings_per_project
FROM candidates c
LEFT JOIN worker_earnings we ON c.id = we.candidate_id
GROUP BY c.id, c.full_name, c.email, c.phone;

-- =============================================
-- 11. RLS POLICIES
-- =============================================

ALTER TABLE worker_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_batch_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_configurations ENABLE ROW LEVEL SECURITY;

-- Workers can view their own earnings
DROP POLICY IF EXISTS "Workers can view own earnings" ON worker_earnings;
CREATE POLICY "Workers can view own earnings"
  ON worker_earnings FOR SELECT
  USING (auth.uid() = candidate_id);

-- Workers can view their own payment history
DROP POLICY IF EXISTS "Workers can view own payment history" ON payment_history;
CREATE POLICY "Workers can view own payment history"
  ON payment_history FOR SELECT
  USING (auth.uid() = candidate_id);

-- Admins can manage all earnings
DROP POLICY IF EXISTS "Admins can manage all earnings" ON worker_earnings;
CREATE POLICY "Admins can manage all earnings"
  ON worker_earnings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Admins can manage payment batches
DROP POLICY IF EXISTS "Admins can manage payment batches" ON payment_batches;
CREATE POLICY "Admins can manage payment batches"
  ON payment_batches FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Admins can manage payment batch items
DROP POLICY IF EXISTS "Admins can manage batch items" ON payment_batch_items;
CREATE POLICY "Admins can manage batch items"
  ON payment_batch_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Admins can view all payment history
DROP POLICY IF EXISTS "Admins can view all payment history" ON payment_history;
CREATE POLICY "Admins can view all payment history"
  ON payment_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Admins can manage salary configurations
DROP POLICY IF EXISTS "Admins can manage salary configs" ON salary_configurations;
CREATE POLICY "Admins can manage salary configs"
  ON salary_configurations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Grant permissions
GRANT SELECT ON worker_earnings_summary TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_worker_earnings TO authenticated;
GRANT EXECUTE ON FUNCTION create_payment_batch TO authenticated;
GRANT EXECUTE ON FUNCTION process_payment_batch TO authenticated;

-- =============================================
-- 12. INSERT DEFAULT SALARY CONFIGURATIONS
-- =============================================

INSERT INTO salary_configurations (role, base_hourly_rate, overtime_multiplier, night_shift_bonus, weekend_bonus, minimum_hours, maximum_hours)
VALUES
  ('General Worker', 15.00, 1.5, 5.00, 10.00, 4, 12),
  ('Event Staff', 20.00, 1.5, 5.00, 15.00, 4, 12),
  ('Warehouse Staff', 18.00, 1.5, 5.00, 12.00, 6, 12),
  ('F&B Service', 16.00, 1.5, 5.00, 10.00, 4, 12),
  ('Promoter', 25.00, 1.5, 8.00, 20.00, 4, 10)
ON CONFLICT (role) DO NOTHING;
