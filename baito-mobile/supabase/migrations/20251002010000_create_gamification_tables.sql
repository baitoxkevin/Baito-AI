-- Create points_log table for tracking worker points
CREATE TABLE IF NOT EXISTS points_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  attendance_id UUID REFERENCES attendance(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_points_log_candidate_id ON points_log(candidate_id);
CREATE INDEX IF NOT EXISTS idx_points_log_created_at ON points_log(created_at);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  achievement_description TEXT,
  points_awarded INTEGER DEFAULT 0,
  unlocked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_achievements_candidate_id ON achievements(candidate_id);
CREATE INDEX IF NOT EXISTS idx_achievements_type ON achievements(achievement_type);

-- Add points column to candidates table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidates' AND column_name = 'total_points'
  ) THEN
    ALTER TABLE candidates ADD COLUMN total_points INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create function to award points
CREATE OR REPLACE FUNCTION award_points(
  p_candidate_id UUID,
  p_points INTEGER,
  p_reason TEXT,
  p_attendance_id UUID DEFAULT NULL
) RETURNS void AS $$
BEGIN
  -- Insert into points log
  INSERT INTO points_log (candidate_id, points, reason, attendance_id)
  VALUES (p_candidate_id, p_points, p_reason, p_attendance_id);

  -- Update total points
  UPDATE candidates
  SET total_points = COALESCE(total_points, 0) + p_points
  WHERE id = p_candidate_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to check and unlock achievements
CREATE OR REPLACE FUNCTION check_achievements(p_candidate_id UUID) RETURNS void AS $$
DECLARE
  shift_count INTEGER;
  on_time_count INTEGER;
BEGIN
  -- Count total shifts
  SELECT COUNT(*) INTO shift_count
  FROM attendance
  WHERE candidate_id = p_candidate_id AND status = 'checked_out';

  -- Count on-time shifts (checked in within 15 mins of start)
  SELECT COUNT(*) INTO on_time_count
  FROM attendance a
  JOIN projects p ON a.project_id = p.id
  WHERE a.candidate_id = p_candidate_id
    AND a.status = 'checked_out'
    AND a.check_in_time <= (p.start_date::date + p.working_hours_start::time + interval '15 minutes');

  -- First Shift Achievement
  IF shift_count = 1 AND NOT EXISTS (
    SELECT 1 FROM achievements
    WHERE candidate_id = p_candidate_id AND achievement_type = 'first_shift'
  ) THEN
    INSERT INTO achievements (candidate_id, achievement_type, achievement_name, achievement_description, points_awarded)
    VALUES (p_candidate_id, 'first_shift', 'First Shift', 'Completed your first shift!', 50);

    PERFORM award_points(p_candidate_id, 50, 'Achievement: First Shift');
  END IF;

  -- Week Warrior Achievement (7 shifts)
  IF shift_count >= 7 AND NOT EXISTS (
    SELECT 1 FROM achievements
    WHERE candidate_id = p_candidate_id AND achievement_type = 'week_warrior'
  ) THEN
    INSERT INTO achievements (candidate_id, achievement_type, achievement_name, achievement_description, points_awarded)
    VALUES (p_candidate_id, 'week_warrior', 'Week Warrior', 'Completed 7 shifts!', 100);

    PERFORM award_points(p_candidate_id, 100, 'Achievement: Week Warrior');
  END IF;

  -- Month Master Achievement (30 shifts)
  IF shift_count >= 30 AND NOT EXISTS (
    SELECT 1 FROM achievements
    WHERE candidate_id = p_candidate_id AND achievement_type = 'month_master'
  ) THEN
    INSERT INTO achievements (candidate_id, achievement_type, achievement_name, achievement_description, points_awarded)
    VALUES (p_candidate_id, 'month_master', 'Month Master', 'Completed 30 shifts!', 500);

    PERFORM award_points(p_candidate_id, 500, 'Achievement: Month Master');
  END IF;

  -- Punctual Pro Achievement (10 on-time shifts)
  IF on_time_count >= 10 AND NOT EXISTS (
    SELECT 1 FROM achievements
    WHERE candidate_id = p_candidate_id AND achievement_type = 'punctual_pro'
  ) THEN
    INSERT INTO achievements (candidate_id, achievement_type, achievement_name, achievement_description, points_awarded)
    VALUES (p_candidate_id, 'punctual_pro', 'Punctual Pro', 'On-time for 10 shifts!', 200);

    PERFORM award_points(p_candidate_id, 200, 'Achievement: Punctual Pro');
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to award points on check-out
CREATE OR REPLACE FUNCTION award_attendance_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Award points when checking out
  IF NEW.status = 'checked_out' AND OLD.status = 'checked_in' THEN
    -- Base points for completing shift
    PERFORM award_points(NEW.candidate_id, 20, 'Shift completed', NEW.id);

    -- Bonus points for long shifts (8+ hours)
    IF NEW.total_hours >= 8 THEN
      PERFORM award_points(NEW.candidate_id, 10, 'Long shift bonus (8+ hours)', NEW.id);
    END IF;

    -- Check for achievements
    PERFORM check_achievements(NEW.candidate_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_award_attendance_points ON attendance;
CREATE TRIGGER trigger_award_attendance_points
  AFTER UPDATE ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION award_attendance_points();

-- Create leaderboard view
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  c.id,
  c.full_name as name,
  c.email,
  c.total_points,
  COUNT(DISTINCT a.id) as total_shifts,
  COUNT(DISTINCT ach.id) as total_achievements,
  RANK() OVER (ORDER BY c.total_points DESC) as rank
FROM candidates c
LEFT JOIN attendance a ON c.id = a.candidate_id AND a.status = 'checked_out'
LEFT JOIN achievements ach ON c.id = ach.candidate_id
GROUP BY c.id, c.full_name, c.email, c.total_points
ORDER BY c.total_points DESC;

-- Create function to get candidate stats (for PointsDisplay component)
CREATE OR REPLACE FUNCTION get_candidate_stats(p_candidate_id UUID)
RETURNS TABLE (
  total_points INTEGER,
  rank BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.total_points,
    (SELECT COUNT(*) + 1 FROM candidates WHERE total_points > c.total_points)::BIGINT as rank
  FROM candidates c
  WHERE c.id = p_candidate_id;
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies
ALTER TABLE points_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Users can view their own points
CREATE POLICY "Users can view own points"
  ON points_log FOR SELECT
  USING (auth.uid() = candidate_id);

-- Users can view their own achievements
CREATE POLICY "Users can view own achievements"
  ON achievements FOR SELECT
  USING (auth.uid() = candidate_id);

-- Admins can view all points
CREATE POLICY "Admins can view all points"
  ON points_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Admins can view all achievements
CREATE POLICY "Admins can view all achievements"
  ON achievements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );
