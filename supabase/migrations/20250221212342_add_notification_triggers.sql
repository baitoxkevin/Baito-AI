-- Create function to handle notification creation
CREATE OR REPLACE FUNCTION handle_notification()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'notifications',
    json_build_object(
      'type', NEW.type,
      'user_id', NEW.user_id,
      'title', NEW.title,
      'message', NEW.message,
      'task_id', NEW.task_id,
      'project_id', NEW.project_id
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for notifications
CREATE TRIGGER notification_trigger
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION handle_notification();
