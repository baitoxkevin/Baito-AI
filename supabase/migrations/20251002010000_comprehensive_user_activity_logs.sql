-- Comprehensive User Activity Logging System
-- Tracks all user actions including payment operations

-- Create or update activity_logs table with all necessary fields
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_name TEXT,
  action TEXT NOT NULL,
  action_type TEXT NOT NULL,
  entity_type TEXT,  -- 'project', 'payment', 'staff', 'document', etc.
  entity_id UUID,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_action ON user_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_entity ON user_activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_project ON user_activity_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_action_type ON user_activity_logs(action_type);

-- Enable RLS
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own logs
CREATE POLICY "Users can view their own activity logs"
  ON user_activity_logs FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Users can view logs for projects they have access to
CREATE POLICY "Users can view project activity logs"
  ON user_activity_logs FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE deleted_at IS NULL
    )
  );

-- Policy: Authenticated users can insert activity logs
CREATE POLICY "Authenticated users can insert activity logs"
  ON user_activity_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create payment_logs table for detailed payment tracking
CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_batch_id UUID,
  project_id UUID REFERENCES projects(id),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,  -- 'create', 'approve', 'push', 'export', 'cancel'
  status TEXT NOT NULL,  -- 'pending', 'approved', 'pushed', 'exported', 'failed'
  amount DECIMAL(15,2),
  staff_count INTEGER,
  export_format TEXT,  -- 'excel', 'csv', 'duitnow'
  file_path TEXT,
  details JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create indexes for payment logs
CREATE INDEX IF NOT EXISTS idx_payment_logs_batch ON payment_logs(payment_batch_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_project ON payment_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_user ON payment_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_action ON payment_logs(action);
CREATE INDEX IF NOT EXISTS idx_payment_logs_status ON payment_logs(status);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON payment_logs(created_at DESC);

-- Enable RLS for payment logs
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view payment logs for their projects
CREATE POLICY "Users can view payment logs for accessible projects"
  ON payment_logs FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE deleted_at IS NULL
    )
  );

-- Policy: Authenticated users can insert payment logs
CREATE POLICY "Authenticated users can insert payment logs"
  ON payment_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id UUID,
  p_action TEXT,
  p_action_type TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_project_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}',
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_user_email TEXT;
  v_user_name TEXT;
BEGIN
  -- Get user details
  SELECT email, full_name INTO v_user_email, v_user_name
  FROM users WHERE id = p_user_id;

  -- Insert activity log
  INSERT INTO user_activity_logs (
    user_id,
    user_email,
    user_name,
    action,
    action_type,
    entity_type,
    entity_id,
    project_id,
    details,
    success,
    error_message
  ) VALUES (
    p_user_id,
    v_user_email,
    v_user_name,
    p_action,
    p_action_type,
    p_entity_type,
    p_entity_id,
    p_project_id,
    p_details,
    p_success,
    p_error_message
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log payment activity
CREATE OR REPLACE FUNCTION log_payment_activity(
  p_payment_batch_id UUID,
  p_project_id UUID,
  p_user_id UUID,
  p_action TEXT,
  p_status TEXT,
  p_amount DECIMAL DEFAULT NULL,
  p_staff_count INTEGER DEFAULT NULL,
  p_export_format TEXT DEFAULT NULL,
  p_file_path TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}',
  p_error_message TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO payment_logs (
    payment_batch_id,
    project_id,
    user_id,
    action,
    status,
    amount,
    staff_count,
    export_format,
    file_path,
    details,
    error_message,
    completed_at
  ) VALUES (
    p_payment_batch_id,
    p_project_id,
    p_user_id,
    p_action,
    p_status,
    p_amount,
    p_staff_count,
    p_export_format,
    p_file_path,
    p_details,
    p_error_message,
    CASE WHEN p_status IN ('exported', 'failed', 'cancelled') THEN NOW() ELSE NULL END
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for payment activity summary
CREATE OR REPLACE VIEW payment_activity_summary AS
SELECT
  pl.payment_batch_id,
  p.title as project_title,
  u.full_name as user_name,
  pl.action,
  pl.status,
  pl.amount,
  pl.staff_count,
  pl.export_format,
  pl.created_at,
  pl.completed_at,
  pl.error_message,
  EXTRACT(EPOCH FROM (pl.completed_at - pl.created_at)) as duration_seconds
FROM payment_logs pl
LEFT JOIN projects p ON p.id = pl.project_id
LEFT JOIN users u ON u.id = pl.user_id
ORDER BY pl.created_at DESC;

-- Grant permissions
GRANT SELECT ON user_activity_logs TO authenticated;
GRANT INSERT ON user_activity_logs TO authenticated;
GRANT SELECT ON payment_logs TO authenticated;
GRANT INSERT ON payment_logs TO authenticated;
GRANT SELECT ON payment_activity_summary TO authenticated;
GRANT EXECUTE ON FUNCTION log_user_activity TO authenticated;
GRANT EXECUTE ON FUNCTION log_payment_activity TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE user_activity_logs IS 'Comprehensive log of all user activities in the system';
COMMENT ON TABLE payment_logs IS 'Detailed log of all payment-related activities';
COMMENT ON FUNCTION log_user_activity IS 'Helper function to log user activity with automatic user details';
COMMENT ON FUNCTION log_payment_activity IS 'Helper function to log payment operations';
