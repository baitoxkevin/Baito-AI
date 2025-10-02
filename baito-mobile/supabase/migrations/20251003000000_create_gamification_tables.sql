-- Create points_log table for tracking worker points
CREATE TABLE IF NOT EXISTS points_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE NOT NULL,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  attendance_id UUID REFERENCES attendance(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create achievements table for tracking unlocked achievements
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE NOT NULL,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  achievement_description TEXT,
  icon_name TEXT,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(candidate_id, achievement_type)
);

-- Create leaderboard view for efficient ranking
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  c.id,
  c.name,
  c.avatar_url,
  COALESCE(SUM(pl.points), 0) AS total_points,
  COUNT(DISTINCT a.id) AS achievement_count,
  RANK() OVER (ORDER BY COALESCE(SUM(pl.points), 0) DESC) AS rank
FROM candidates c
LEFT JOIN points_log pl ON pl.candidate_id = c.id
LEFT JOIN achievements a ON a.candidate_id = c.id
GROUP BY c.id, c.name, c.avatar_url;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_points_log_candidate_id ON points_log(candidate_id);
CREATE INDEX IF NOT EXISTS idx_points_log_created_at ON points_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_achievements_candidate_id ON achievements(candidate_id);

-- Function to award points
CREATE OR REPLACE FUNCTION award_points(
  p_candidate_id UUID,
  p_points INTEGER,
  p_reason TEXT,
  p_project_id UUID DEFAULT NULL,
  p_attendance_id UUID DEFAULT NULL
) RETURNS points_log AS $$
DECLARE
  new_points_entry points_log;
  total_points INTEGER;
BEGIN
  -- Insert points entry
  INSERT INTO points_log (candidate_id, points, reason, project_id, attendance_id)
  VALUES (p_candidate_id, p_points, p_reason, p_project_id, p_attendance_id)
  RETURNING * INTO new_points_entry;

  -- Check for achievements after awarding points
  SELECT COALESCE(SUM(points), 0) INTO total_points
  FROM points_log
  WHERE candidate_id = p_candidate_id;

  -- Check and award achievements based on total points
  IF total_points >= 100 AND NOT EXISTS (
    SELECT 1 FROM achievements
    WHERE candidate_id = p_candidate_id
    AND achievement_type = 'points_100'
  ) THEN
    INSERT INTO achievements (candidate_id, achievement_type, achievement_name, achievement_description, icon_name)
    VALUES (p_candidate_id, 'points_100', 'Century Club', 'Earned 100 points', 'trophy');
  END IF;

  IF total_points >= 500 AND NOT EXISTS (
    SELECT 1 FROM achievements
    WHERE candidate_id = p_candidate_id
    AND achievement_type = 'points_500'
  ) THEN
    INSERT INTO achievements (candidate_id, achievement_type, achievement_name, achievement_description, icon_name)
    VALUES (p_candidate_id, 'points_500', 'High Achiever', 'Earned 500 points', 'star');
  END IF;

  IF total_points >= 1000 AND NOT EXISTS (
    SELECT 1 FROM achievements
    WHERE candidate_id = p_candidate_id
    AND achievement_type = 'points_1000'
  ) THEN
    INSERT INTO achievements (candidate_id, achievement_type, achievement_name, achievement_description, icon_name)
    VALUES (p_candidate_id, 'points_1000', 'Elite Worker', 'Earned 1000 points', 'crown');
  END IF;

  RETURN new_points_entry;
END;
$$ LANGUAGE plpgsql;

-- Function to check and award shift-based achievements
CREATE OR REPLACE FUNCTION check_shift_achievements(p_candidate_id UUID)
RETURNS VOID AS $$
DECLARE
  shift_count INTEGER;
  week_shift_count INTEGER;
  month_shift_count INTEGER;
  perfect_week_count INTEGER;
BEGIN
  -- Count total shifts
  SELECT COUNT(*) INTO shift_count
  FROM attendance
  WHERE candidate_id = p_candidate_id
  AND status = 'checked_out';

  -- First Shift Achievement
  IF shift_count >= 1 AND NOT EXISTS (
    SELECT 1 FROM achievements
    WHERE candidate_id = p_candidate_id
    AND achievement_type = 'first_shift'
  ) THEN
    INSERT INTO achievements (candidate_id, achievement_type, achievement_name, achievement_description, icon_name)
    VALUES (p_candidate_id, 'first_shift', 'First Timer', 'Completed your first shift', 'flag');
  END IF;

  -- Week Warrior Achievement (7 shifts in 7 days)
  SELECT COUNT(*) INTO week_shift_count
  FROM attendance
  WHERE candidate_id = p_candidate_id
  AND status = 'checked_out'
  AND check_in_time >= NOW() - INTERVAL '7 days';

  IF week_shift_count >= 7 AND NOT EXISTS (
    SELECT 1 FROM achievements
    WHERE candidate_id = p_candidate_id
    AND achievement_type = 'week_warrior'
  ) THEN
    INSERT INTO achievements (candidate_id, achievement_type, achievement_name, achievement_description, icon_name)
    VALUES (p_candidate_id, 'week_warrior', 'Week Warrior', 'Worked 7 shifts in a week', 'zap');
  END IF;

  -- Month Master Achievement (30 shifts total)
  IF shift_count >= 30 AND NOT EXISTS (
    SELECT 1 FROM achievements
    WHERE candidate_id = p_candidate_id
    AND achievement_type = 'month_master'
  ) THEN
    INSERT INTO achievements (candidate_id, achievement_type, achievement_name, achievement_description, icon_name)
    VALUES (p_candidate_id, 'month_master', 'Month Master', 'Completed 30 shifts', 'calendar');
  END IF;

  -- Perfect Attendance (5 consecutive days)
  WITH consecutive_days AS (
    SELECT
      DATE(check_in_time) as work_date,
      DATE(check_in_time) - (ROW_NUMBER() OVER (ORDER BY DATE(check_in_time))) * INTERVAL '1 day' as grp
    FROM attendance
    WHERE candidate_id = p_candidate_id
    AND status = 'checked_out'
  ),
  streak_lengths AS (
    SELECT COUNT(*) as streak_length
    FROM consecutive_days
    GROUP BY grp
  )
  SELECT MAX(streak_length) INTO perfect_week_count
  FROM streak_lengths;

  IF perfect_week_count >= 5 AND NOT EXISTS (
    SELECT 1 FROM achievements
    WHERE candidate_id = p_candidate_id
    AND achievement_type = 'perfect_attendance'
  ) THEN
    INSERT INTO achievements (candidate_id, achievement_type, achievement_name, achievement_description, icon_name)
    VALUES (p_candidate_id, 'perfect_attendance', 'Perfect Attendance', 'Worked 5 consecutive days', 'check-circle');

    -- Award bonus points for perfect attendance
    PERFORM award_points(p_candidate_id, 50, 'Perfect attendance bonus');
  END IF;
END;
$$ LANGUAGE plpgsql;

-- RPC function to get leaderboard with pagination
CREATE OR REPLACE FUNCTION get_leaderboard(
  limit_count INTEGER DEFAULT 100,
  offset_count INTEGER DEFAULT 0
) RETURNS TABLE (
  candidate_id UUID,
  name TEXT,
  avatar_url TEXT,
  total_points BIGINT,
  achievement_count BIGINT,
  rank BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.name,
    l.avatar_url,
    l.total_points::BIGINT,
    l.achievement_count::BIGINT,
    l.rank::BIGINT
  FROM leaderboard l
  ORDER BY l.rank
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- RPC function to get candidate stats
CREATE OR REPLACE FUNCTION get_candidate_stats(p_candidate_id UUID)
RETURNS TABLE (
  total_points BIGINT,
  rank BIGINT,
  achievement_count BIGINT,
  shifts_completed INTEGER,
  current_streak INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      COALESCE(SUM(pl.points), 0)::BIGINT AS total_points,
      COUNT(DISTINCT a.id)::BIGINT AS achievement_count
    FROM candidates c
    LEFT JOIN points_log pl ON pl.candidate_id = c.id
    LEFT JOIN achievements a ON a.candidate_id = c.id
    WHERE c.id = p_candidate_id
    GROUP BY c.id
  ),
  ranking AS (
    SELECT rank FROM leaderboard WHERE id = p_candidate_id
  ),
  shifts AS (
    SELECT COUNT(*)::INTEGER AS shifts_completed
    FROM attendance
    WHERE candidate_id = p_candidate_id
    AND status = 'checked_out'
  ),
  streak AS (
    WITH consecutive_days AS (
      SELECT
        DATE(check_in_time) as work_date
      FROM attendance
      WHERE candidate_id = p_candidate_id
      AND status = 'checked_out'
      AND DATE(check_in_time) >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY work_date DESC
    ),
    numbered_days AS (
      SELECT
        work_date,
        work_date - (ROW_NUMBER() OVER (ORDER BY work_date DESC) - 1) * INTERVAL '1 day' as expected_date
      FROM consecutive_days
    )
    SELECT COUNT(*)::INTEGER AS current_streak
    FROM numbered_days
    WHERE work_date = expected_date
    AND work_date >= CURRENT_DATE - (
      SELECT COUNT(*) - 1 FROM numbered_days WHERE work_date = expected_date
    ) * INTERVAL '1 day'
  )
  SELECT
    stats.total_points,
    ranking.rank,
    stats.achievement_count,
    shifts.shifts_completed,
    COALESCE(streak.current_streak, 0)
  FROM stats, ranking, shifts, streak;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS for new tables
ALTER TABLE points_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for points_log
CREATE POLICY "Users can view own points"
  ON points_log FOR SELECT
  USING (auth.uid() = candidate_id);

CREATE POLICY "Public can view all points for leaderboard"
  ON points_log FOR SELECT
  USING (true);

-- RLS Policies for achievements
CREATE POLICY "Users can view own achievements"
  ON achievements FOR SELECT
  USING (auth.uid() = candidate_id);

CREATE POLICY "Public can view all achievements"
  ON achievements FOR SELECT
  USING (true);

-- Sample achievements to seed
INSERT INTO achievements (candidate_id, achievement_type, achievement_name, achievement_description, icon_name)
SELECT
  id,
  'welcome',
  'Welcome Aboard',
  'Joined the Baito platform',
  'user-check'
FROM candidates
WHERE NOT EXISTS (
  SELECT 1 FROM achievements
  WHERE achievements.candidate_id = candidates.id
  AND achievement_type = 'welcome'
);