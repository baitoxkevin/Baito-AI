-- Fix Analytics Function - Ambiguous Column Reference
-- Issue: get_analytics_summary has ambiguous "start_date" reference

-- =============================================
-- 1. FIX: get_analytics_summary function
-- =============================================

CREATE OR REPLACE FUNCTION get_analytics_summary(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  summary JSON;
  v_start_date DATE;  -- Changed variable name to avoid ambiguity
  v_end_date DATE;    -- Changed variable name to avoid ambiguity
BEGIN
  -- Default to last 30 days if not provided
  v_start_date := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '30 days');
  v_end_date := COALESCE(p_end_date, CURRENT_DATE);

  SELECT json_build_object(
    'total_workers', (SELECT COUNT(*) FROM candidates),
    'total_projects', (SELECT COUNT(*) FROM projects WHERE start_date BETWEEN v_start_date AND v_end_date),
    'total_shifts_completed', (SELECT COUNT(*) FROM attendance WHERE status = 'checked_in' AND DATE(check_in_time) BETWEEN v_start_date AND v_end_date),
    'total_hours_worked', (
      SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (check_out_time - check_in_time)) / 3600), 0)
      FROM attendance
      WHERE status = 'checked_in'
      AND DATE(check_in_time) BETWEEN v_start_date AND v_end_date
    ),
    'total_revenue', (SELECT COALESCE(SUM(budget), 0) FROM projects WHERE start_date BETWEEN v_start_date AND v_end_date),
    'total_expenses', (SELECT COALESCE(SUM(amount), 0) FROM expense_claims WHERE status = 'approved' AND DATE(created_at) BETWEEN v_start_date AND v_end_date),
    'avg_shift_completion_rate', (
      SELECT COALESCE(AVG(completion_percentage), 0)
      FROM shift_completion_analytics
      WHERE start_date BETWEEN v_start_date AND v_end_date
    )
  ) INTO summary;

  RETURN summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 2. FIX: Add SECURITY DEFINER to other functions
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
    TO_CHAR(DATE_TRUNC('month', a.check_in_time), 'Mon YYYY') as month,
    COUNT(CASE WHEN a.status = 'checked_in' THEN a.id END)::INTEGER as shifts_completed,
    COALESCE(SUM(CASE
      WHEN a.status = 'checked_in'
      THEN EXTRACT(EPOCH FROM (a.check_out_time - a.check_in_time)) / 3600
      ELSE 0
    END), 0)::NUMERIC as hours_worked,
    COALESCE((
      SELECT SUM(points_awarded)::INTEGER
      FROM achievements
      WHERE candidate_id = p_candidate_id
      AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', a.check_in_time)
    ), 0) as points_earned
  FROM attendance a
  WHERE a.candidate_id = p_candidate_id
    AND a.check_in_time >= CURRENT_DATE - (p_months || ' months')::INTERVAL
  GROUP BY DATE_TRUNC('month', a.check_in_time)
  ORDER BY DATE_TRUNC('month', a.check_in_time) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
  LEFT JOIN expense_claims ec ON ec.project_id = p.id AND ec.status = 'approved'
  WHERE p.start_date >= CURRENT_DATE - (p_months || ' months')::INTERVAL
  GROUP BY DATE_TRUNC('month', p.start_date)
  ORDER BY DATE_TRUNC('month', p.start_date) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 3. GRANT permissions again
-- =============================================

GRANT EXECUTE ON FUNCTION get_analytics_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_worker_performance_history TO authenticated;
GRANT EXECUTE ON FUNCTION get_revenue_trend TO authenticated;
GRANT EXECUTE ON FUNCTION get_shift_completion_rate TO authenticated;
