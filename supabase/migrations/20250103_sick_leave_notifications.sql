-- Sick Leave Notification System
-- Migration: 20250103_sick_leave_notifications
-- Creates notification infrastructure for PICs when crew reports sick

-- Create notifications table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Function to notify PIC when sick leave is submitted
CREATE OR REPLACE FUNCTION notify_pic_on_sick_leave()
RETURNS TRIGGER AS $$
DECLARE
  v_project RECORD;
  v_crew RECORD;
  v_pic_id UUID;
  v_notification_title TEXT;
  v_notification_message TEXT;
BEGIN
  -- Get project details
  SELECT id, title, person_in_charge_id
  INTO v_project
  FROM projects
  WHERE id = NEW.project_id;

  -- Get crew details
  SELECT id, full_name, phone_number
  INTO v_crew
  FROM crew_members
  WHERE id = NEW.crew_id;

  -- Get PIC user ID (assuming person_in_charge_id references users table)
  v_pic_id := v_project.person_in_charge_id;

  -- Skip if no PIC assigned
  IF v_pic_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Create notification title and message
  v_notification_title := format('Sick Leave: %s', v_crew.full_name);
  v_notification_message := format(
    '%s has reported sick for %s on %s. Please review and approve/reject this request.',
    v_crew.full_name,
    v_project.title,
    TO_CHAR(NEW.sick_date, 'Mon DD, YYYY')
  );

  -- Insert notification for PIC
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data,
    read,
    action_url
  ) VALUES (
    v_pic_id,
    'sick_leave_submitted',
    v_notification_title,
    v_notification_message,
    jsonb_build_object(
      'sick_leave_id', NEW.id,
      'crew_id', NEW.crew_id,
      'crew_name', v_crew.full_name,
      'project_id', NEW.project_id,
      'project_title', v_project.title,
      'sick_date', NEW.sick_date,
      'sick_date_end', NEW.sick_date_end,
      'verification_status', NEW.verification_status
    ),
    FALSE,
    '/sick-leave/pending'
  );

  -- TODO: Send SMS notification (integrate with SMS service)
  -- TODO: Send email notification (integrate with email service)
  -- TODO: Send push notification (integrate with push service)

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to send notification when sick leave is created
DROP TRIGGER IF EXISTS trigger_notify_pic_on_sick_leave ON sick_leaves;
CREATE TRIGGER trigger_notify_pic_on_sick_leave
  AFTER INSERT ON sick_leaves
  FOR EACH ROW
  EXECUTE FUNCTION notify_pic_on_sick_leave();

-- Function to notify PIC when sick leave is approved/rejected
CREATE OR REPLACE FUNCTION notify_crew_on_sick_leave_update()
RETURNS TRIGGER AS $$
DECLARE
  v_crew RECORD;
  v_project RECORD;
  v_notification_title TEXT;
  v_notification_message TEXT;
  v_crew_user_id UUID;
BEGIN
  -- Only notify on status change
  IF OLD.verification_status = NEW.verification_status THEN
    RETURN NEW;
  END IF;

  -- Get crew details
  SELECT id, full_name, user_id
  INTO v_crew
  FROM crew_members
  WHERE id = NEW.crew_id;

  -- Get project details
  SELECT title
  INTO v_project
  FROM projects
  WHERE id = NEW.project_id;

  -- Get crew's user ID
  v_crew_user_id := v_crew.user_id;

  -- Skip if crew has no user account
  IF v_crew_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Create notification based on status
  IF NEW.verification_status = 'approved' THEN
    v_notification_title := 'Sick Leave Approved';
    v_notification_message := format(
      'Your sick leave request for %s on %s has been approved.',
      v_project.title,
      TO_CHAR(NEW.sick_date, 'Mon DD, YYYY')
    );
  ELSIF NEW.verification_status = 'rejected' THEN
    v_notification_title := 'Sick Leave Rejected';
    v_notification_message := format(
      'Your sick leave request for %s on %s has been rejected. Please contact your manager.',
      v_project.title,
      TO_CHAR(NEW.sick_date, 'Mon DD, YYYY')
    );
  ELSE
    -- Other status changes, no notification needed
    RETURN NEW;
  END IF;

  -- Insert notification for crew member
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data,
    read,
    action_url
  ) VALUES (
    v_crew_user_id,
    'sick_leave_' || NEW.verification_status,
    v_notification_title,
    v_notification_message,
    jsonb_build_object(
      'sick_leave_id', NEW.id,
      'project_id', NEW.project_id,
      'project_title', v_project.title,
      'sick_date', NEW.sick_date,
      'verification_status', NEW.verification_status
    ),
    FALSE,
    '/staff-dashboard'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to notify crew when their sick leave is approved/rejected
DROP TRIGGER IF EXISTS trigger_notify_crew_on_sick_leave_update ON sick_leaves;
CREATE TRIGGER trigger_notify_crew_on_sick_leave_update
  AFTER UPDATE OF verification_status ON sick_leaves
  FOR EACH ROW
  EXECUTE FUNCTION notify_crew_on_sick_leave_update();

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET read = TRUE,
      read_at = NOW()
  WHERE id = notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET read = TRUE,
      read_at = NOW()
  WHERE user_id = p_user_id
    AND read = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO count
  FROM notifications
  WHERE user_id = p_user_id
    AND read = FALSE
    AND (expires_at IS NULL OR expires_at > NOW());

  RETURN count;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY notifications_select_own
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only update their own notifications (mark as read)
CREATE POLICY notifications_update_own
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- System can insert notifications for any user
CREATE POLICY notifications_insert_system
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE notifications IS 'Stores in-app notifications for users';
COMMENT ON FUNCTION notify_pic_on_sick_leave IS 'Automatically creates notification for PIC when crew reports sick';
COMMENT ON FUNCTION notify_crew_on_sick_leave_update IS 'Notifies crew when their sick leave is approved/rejected';
COMMENT ON FUNCTION mark_notification_read IS 'Marks a single notification as read';
COMMENT ON FUNCTION mark_all_notifications_read IS 'Marks all notifications as read for a user';
COMMENT ON FUNCTION get_unread_notification_count IS 'Returns count of unread notifications for a user';
