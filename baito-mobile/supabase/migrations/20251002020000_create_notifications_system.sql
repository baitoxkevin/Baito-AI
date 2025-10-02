-- Create push_tokens table to store device tokens
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  device_type TEXT NOT NULL CHECK (device_type IN ('ios', 'android', 'web')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_token ON push_tokens(token);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  type TEXT NOT NULL CHECK (type IN ('shift_reminder', 'achievement', 'announcement', 'general')),
  read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Create scheduled_notifications table for shift reminders
CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('shift_start', 'shift_end', 'custom')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_candidate ON scheduled_notifications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled_for ON scheduled_notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_sent ON scheduled_notifications(sent);

-- Function to send notification (this will be called from app or database trigger)
CREATE OR REPLACE FUNCTION send_notification(
  p_user_id UUID,
  p_title TEXT,
  p_body TEXT,
  p_type TEXT DEFAULT 'general',
  p_data JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, title, body, type, data)
  VALUES (p_user_id, p_title, p_body, p_type, p_data)
  RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to broadcast announcement to all users
CREATE OR REPLACE FUNCTION broadcast_announcement(
  p_title TEXT,
  p_body TEXT,
  p_data JSONB DEFAULT '{}'::jsonb
) RETURNS INTEGER AS $$
DECLARE
  notification_count INTEGER := 0;
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM auth.users
  LOOP
    INSERT INTO notifications (user_id, title, body, type, data)
    VALUES (user_record.id, p_title, p_body, 'announcement', p_data);
    notification_count := notification_count + 1;
  END LOOP;

  RETURN notification_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger to send achievement notification
CREATE OR REPLACE FUNCTION notify_achievement_unlock()
RETURNS TRIGGER AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Use candidate_id directly as user_id
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

-- Create trigger for achievement notifications
DROP TRIGGER IF EXISTS trigger_achievement_notification ON achievements;
CREATE TRIGGER trigger_achievement_notification
  AFTER INSERT ON achievements
  FOR EACH ROW
  EXECUTE FUNCTION notify_achievement_unlock();

-- Function to schedule shift reminder notifications
CREATE OR REPLACE FUNCTION schedule_shift_reminders(
  p_project_id UUID,
  p_candidate_id UUID
) RETURNS void AS $$
DECLARE
  project_record RECORD;
  shift_start TIMESTAMPTZ;
  reminder_time TIMESTAMPTZ;
BEGIN
  -- Get project details
  SELECT * INTO project_record
  FROM projects
  WHERE id = p_project_id;

  -- Calculate shift start time
  shift_start := project_record.start_date::date + project_record.working_hours_start::time;

  -- Schedule reminder 1 hour before shift
  reminder_time := shift_start - interval '1 hour';

  -- Only schedule if reminder is in the future
  IF reminder_time > NOW() THEN
    INSERT INTO scheduled_notifications (
      project_id,
      candidate_id,
      scheduled_for,
      type,
      title,
      body
    ) VALUES (
      p_project_id,
      p_candidate_id,
      reminder_time,
      'shift_start',
      'Shift Reminder',
      'Your shift "' || project_record.title || '" starts in 1 hour at ' || project_record.venue_address
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- Push Tokens Policies
DROP POLICY IF EXISTS "Users can manage own push tokens" ON push_tokens;
CREATE POLICY "Users can manage own push tokens"
  ON push_tokens FOR ALL
  USING (auth.uid() = user_id);

-- Notifications Policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can send notifications
DROP POLICY IF EXISTS "Admins can send notifications" ON notifications;
CREATE POLICY "Admins can send notifications"
  ON notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Scheduled Notifications Policies
DROP POLICY IF EXISTS "Users can view own scheduled notifications" ON scheduled_notifications;
CREATE POLICY "Users can view own scheduled notifications"
  ON scheduled_notifications FOR SELECT
  USING (
    candidate_id IN (
      SELECT id FROM candidates WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage scheduled notifications" ON scheduled_notifications;
CREATE POLICY "Admins can manage scheduled notifications"
  ON scheduled_notifications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );
