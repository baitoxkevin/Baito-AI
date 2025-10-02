-- Analytics Views and Functions for Admin Dashboard

-- =============================================
-- 1. WORKER PERFORMANCE ANALYTICS VIEW
-- =============================================

CREATE OR REPLACE VIEW worker_performance_stats AS
SELECT
  c.id as candidate_id,
  c.full_name,
  c.email,
  c.phone,
  COUNT(DISTINCT ps.project_id) as total_shifts,
  COUNT(DISTINCT CASE WHEN a.status = 'checked_in' THEN a.id END) as completed_shifts,
  COALESCE(SUM(CASE
    WHEN a.status = 'checked_in'
    THEN EXTRACT(EPOCH FROM (a.checkout_time - a.checkin_time)) / 3600
    ELSE 0
  END), 0) as total_hours_worked,
  COALESCE(AVG(CASE
    WHEN a.status = 'checked_in'
    THEN EXTRACT(EPOCH FROM (a.checkout_time - a.checkin_time)) / 3600
    ELSE NULL
  END), 0) as avg_hours_per_shift,
  COALESCE((SELECT SUM(points) FROM achievements WHERE candidate_id = c.id), 0) as total_points,
  CASE
    WHEN COUNT(DISTINCT ps.project_id) > 0
    THEN ROUND((COUNT(DISTINCT CASE WHEN a.status = 'checked_in' THEN a.id END)::numeric / COUNT(DISTINCT ps.project_id)::numeric) * 100, 2)
    ELSE 0
  END as completion_rate
FROM candidates c
LEFT JOIN project_staff ps ON c.id = ps.candidate_id
LEFT JOIN attendance a ON a.candidate_id = c.id
GROUP BY c.id, c.full_name, c.email, c.phone;

-- =============================================
-- 2. REVENUE ANALYTICS VIEW
-- =============================================

CREATE OR REPLACE VIEW revenue_analytics AS
SELECT
  DATE_TRUNC('month', p.start_date) as month,
  COUNT(DISTINCT p.id) as total_projects,
  COUNT(DISTINCT ps.candidate_id) as total_workers,
  COALESCE(SUM(p.budget), 0) as total_budget,
  COALESCE(SUM(ec.amount), 0) as total_expenses,
  COALESCE(SUM(p.budget) - SUM(ec.amount), 0) as net_revenue
FROM projects p
LEFT JOIN project_staff ps ON p.id = ps.project_id
LEFT JOIN expense_claims ec ON ec.project_id = p.id AND ec.approval_status = 'approved'
GROUP BY DATE_TRUNC('month', p.start_date)
ORDER BY month DESC;

-- =============================================
-- 3. SHIFT COMPLETION ANALYTICS VIEW
-- =============================================

CREATE OR REPLACE VIEW shift_completion_analytics AS
SELECT
  p.id as project_id,
  p.title as project_title,
  p.start_date,
  p.end_date,
  p.crew_count as required_workers,
  p.filled_positions as assigned_workers,
  COUNT(DISTINCT a.id) as actual_attendees,
  COUNT(DISTINCT CASE WHEN a.status = 'checked_in' THEN a.id END) as completed_attendances,
  CASE
    WHEN p.crew_count > 0
    THEN ROUND((p.filled_positions::numeric / p.crew_count::numeric) * 100, 2)
    ELSE 0
  END as staffing_percentage,
  CASE
    WHEN COUNT(DISTINCT a.id) > 0
    THEN ROUND((COUNT(DISTINCT CASE WHEN a.status = 'checked_in' THEN a.id END)::numeric / COUNT(DISTINCT a.id)::numeric) * 100, 2)
    ELSE 0
  END as completion_percentage
FROM projects p
LEFT JOIN attendance a ON a.project_id = p.id
GROUP BY p.id, p.title, p.start_date, p.end_date, p.crew_count, p.filled_positions
ORDER BY p.start_date DESC;

-- =============================================
-- 4. DAILY ATTENDANCE ANALYTICS VIEW
-- =============================================

CREATE OR REPLACE VIEW daily_attendance_stats AS
SELECT
  DATE(a.checkin_time) as attendance_date,
  COUNT(DISTINCT a.candidate_id) as unique_workers,
  COUNT(a.id) as total_check_ins,
  COUNT(CASE WHEN a.status = 'checked_in' THEN a.id END) as completed_shifts,
  COALESCE(AVG(CASE
    WHEN a.status = 'checked_in'
    THEN EXTRACT(EPOCH FROM (a.checkout_time - a.checkin_time)) / 3600
    ELSE NULL
  END), 0) as avg_shift_duration_hours
FROM attendance a
WHERE a.checkin_time IS NOT NULL
GROUP BY DATE(a.checkin_time)
ORDER BY attendance_date DESC;

-- =============================================
-- 5. TOP PERFORMERS VIEW (Leaderboard)
-- =============================================

CREATE OR REPLACE VIEW top_performers AS
SELECT
  c.id as candidate_id,
  c.full_name,
  c.avatar_url,
  COALESCE((SELECT SUM(points) FROM achievements WHERE candidate_id = c.id), 0) as total_points,
  COUNT(DISTINCT ps.project_id) as total_shifts,
  COUNT(DISTINCT CASE WHEN a.status = 'checked_in' THEN a.id END) as completed_shifts,
  COALESCE(SUM(CASE
    WHEN a.status = 'checked_in'
    THEN EXTRACT(EPOCH FROM (a.checkout_time - a.checkin_time)) / 3600
    ELSE 0
  END), 0) as total_hours_worked,
  (SELECT COUNT(*) FROM achievements WHERE candidate_id = c.id) as total_achievements
FROM candidates c
LEFT JOIN project_staff ps ON c.id = ps.candidate_id
LEFT JOIN attendance a ON a.candidate_id = c.id
GROUP BY c.id, c.full_name, c.avatar_url
ORDER BY total_points DESC, completed_shifts DESC
LIMIT 10;

-- =============================================
-- 6. FUNCTION: Get Analytics Summary
-- =============================================

CREATE OR REPLACE FUNCTION get_analytics_summary(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  summary JSON;
  start_date DATE;
  end_date DATE;
BEGIN
  -- Default to last 30 days if not provided
  start_date := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '30 days');
  end_date := COALESCE(p_end_date, CURRENT_DATE);

  SELECT json_build_object(
    'total_workers', (SELECT COUNT(*) FROM candidates),
    'total_projects', (SELECT COUNT(*) FROM projects WHERE start_date BETWEEN start_date AND end_date),
    'total_shifts_completed', (SELECT COUNT(*) FROM attendance WHERE status = 'checked_in' AND DATE(checkin_time) BETWEEN start_date AND end_date),
    'total_hours_worked', (
      SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (checkout_time - checkin_time)) / 3600), 0)
      FROM attendance
      WHERE status = 'checked_in'
      AND DATE(checkin_time) BETWEEN start_date AND end_date
    ),
    'total_revenue', (SELECT COALESCE(SUM(budget), 0) FROM projects WHERE start_date BETWEEN start_date AND end_date),
    'total_expenses', (SELECT COALESCE(SUM(amount), 0) FROM expense_claims WHERE approval_status = 'approved' AND DATE(created_at) BETWEEN start_date AND end_date),
    'avg_shift_completion_rate', (
      SELECT COALESCE(AVG(completion_percentage), 0)
      FROM shift_completion_analytics
      WHERE start_date BETWEEN start_date AND end_date
    )
  ) INTO summary;

  RETURN summary;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 7. FUNCTION: Get Worker Performance History
-- =============================================

CREATE OR REPLACE FUNCTION get_worker_performance_history(
  p_candidate_id UUID,
  p_months INTEGER DEFAULT 6
) RETURNS TABLE(
  month TEXT,
  shifts_completed INTEGER,
  hours_worked NUMERIC,
  points_earned INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(DATE_TRUNC('month', a.checkin_time), 'Mon YYYY') as month,
    COUNT(CASE WHEN a.status = 'checked_in' THEN a.id END)::INTEGER as shifts_completed,
    COALESCE(SUM(CASE
      WHEN a.status = 'checked_in'
      THEN EXTRACT(EPOCH FROM (a.checkout_time - a.checkin_time)) / 3600
      ELSE 0
    END), 0)::NUMERIC as hours_worked,
    COALESCE((
      SELECT SUM(points_awarded)::INTEGER
      FROM achievements
      WHERE candidate_id = p_candidate_id
      AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', a.checkin_time)
    ), 0) as points_earned
  FROM attendance a
  WHERE a.candidate_id = p_candidate_id
    AND a.checkin_time >= CURRENT_DATE - (p_months || ' months')::INTERVAL
  GROUP BY DATE_TRUNC('month', a.checkin_time)
  ORDER BY DATE_TRUNC('month', a.checkin_time) DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 8. FUNCTION: Get Revenue Trend
-- =============================================

CREATE OR REPLACE FUNCTION get_revenue_trend(
  p_months INTEGER DEFAULT 12
) RETURNS TABLE(
  month TEXT,
  total_revenue NUMERIC,
  total_expenses NUMERIC,
  net_profit NUMERIC,
  project_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(DATE_TRUNC('month', p.start_date), 'Mon YYYY') as month,
    COALESCE(SUM(p.budget), 0)::NUMERIC as total_revenue,
    COALESCE(SUM(ec.amount), 0)::NUMERIC as total_expenses,
    COALESCE(SUM(p.budget) - SUM(ec.amount), 0)::NUMERIC as net_profit,
    COUNT(DISTINCT p.id)::INTEGER as project_count
  FROM projects p
  LEFT JOIN expense_claims ec ON ec.project_id = p.id AND ec.approval_status = 'approved'
  WHERE p.start_date >= CURRENT_DATE - (p_months || ' months')::INTERVAL
  GROUP BY DATE_TRUNC('month', p.start_date)
  ORDER BY DATE_TRUNC('month', p.start_date) DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 9. FUNCTION: Get Shift Completion Rate Over Time
-- =============================================

CREATE OR REPLACE FUNCTION get_shift_completion_rate(
  p_months INTEGER DEFAULT 6
) RETURNS TABLE(
  month TEXT,
  total_shifts INTEGER,
  completed_shifts INTEGER,
  completion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(DATE_TRUNC('month', p.start_date), 'Mon YYYY') as month,
    COUNT(DISTINCT ps.id)::INTEGER as total_shifts,
    COUNT(DISTINCT CASE WHEN a.status = 'checked_in' THEN a.id END)::INTEGER as completed_shifts,
    CASE
      WHEN COUNT(DISTINCT ps.id) > 0
      THEN ROUND((COUNT(DISTINCT CASE WHEN a.status = 'checked_in' THEN a.id END)::numeric / COUNT(DISTINCT ps.id)::numeric) * 100, 2)
      ELSE 0
    END as completion_rate
  FROM projects p
  LEFT JOIN project_staff ps ON p.id = ps.project_id
  LEFT JOIN attendance a ON a.candidate_id = ps.candidate_id AND a.project_id = p.id
  WHERE p.start_date >= CURRENT_DATE - (p_months || ' months')::INTERVAL
  GROUP BY DATE_TRUNC('month', p.start_date)
  ORDER BY DATE_TRUNC('month', p.start_date) DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 10. RLS POLICIES FOR ANALYTICS VIEWS
-- =============================================

-- Grant SELECT on all views to authenticated users with admin role
GRANT SELECT ON worker_performance_stats TO authenticated;
GRANT SELECT ON revenue_analytics TO authenticated;
GRANT SELECT ON shift_completion_analytics TO authenticated;
GRANT SELECT ON daily_attendance_stats TO authenticated;
GRANT SELECT ON top_performers TO authenticated;

-- Grant EXECUTE on analytics functions to authenticated users
GRANT EXECUTE ON FUNCTION get_analytics_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_worker_performance_history TO authenticated;
GRANT EXECUTE ON FUNCTION get_revenue_trend TO authenticated;
GRANT EXECUTE ON FUNCTION get_shift_completion_rate TO authenticated;

-- =============================================
-- 11. INDEXES FOR PERFORMANCE
-- =============================================

-- Indexes for attendance queries
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(DATE(checkin_time));
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);

-- Indexes for project queries
CREATE INDEX IF NOT EXISTS idx_projects_start_date ON projects(start_date);
CREATE INDEX IF NOT EXISTS idx_projects_budget ON projects(budget);

-- Indexes for expense claims
CREATE INDEX IF NOT EXISTS idx_expense_claims_approval ON expense_claims(approval_status);
CREATE INDEX IF NOT EXISTS idx_expense_claims_amount ON expense_claims(amount);

-- Indexes for achievements
CREATE INDEX IF NOT EXISTS idx_achievements_candidate ON achievements(candidate_id);
CREATE INDEX IF NOT EXISTS idx_achievements_points ON achievements(points_awarded);
