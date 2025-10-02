-- Fix the achievement notification trigger
-- The candidates table doesn't have auth_user_id column
-- We need to get the user_id differently

DROP FUNCTION IF EXISTS notify_achievement_unlock() CASCADE;

-- Recreate the function with correct logic
CREATE OR REPLACE FUNCTION notify_achievement_unlock()
RETURNS TRIGGER AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Get user_id from auth.users by matching candidate email
  -- Or use the candidate_id directly if candidates are auth users
  -- For now, we'll send notifications using candidate_id as user_id
  -- This assumes candidates.id matches auth.users.id

  user_id := NEW.candidate_id;

  IF user_id IS NOT NULL THEN
    PERFORM send_notification(
      user_id,
      '🏆 ' || NEW.achievement_name,
      NEW.achievement_description || ' You earned ' || NEW.points_awarded || ' points!',
      'achievement',
      jsonb_build_object(
        'achievement_id', NEW.id,
        'achievement_type', NEW.achievement_type,
        'points_awarded', NEW.points_awarded
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trigger_achievement_notification
  AFTER INSERT ON achievements
  FOR EACH ROW
  EXECUTE FUNCTION notify_achievement_unlock();
