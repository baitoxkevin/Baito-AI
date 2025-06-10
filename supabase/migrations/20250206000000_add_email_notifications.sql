-- Create email notifications table for CC functionality
CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  to_emails TEXT[] NOT NULL,
  cc_emails TEXT[],
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('project_update', 'project_creation', 'status_change', 'assignment')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_email_notifications_project_id ON email_notifications(project_id);
CREATE INDEX idx_email_notifications_status ON email_notifications(status);
CREATE INDEX idx_email_notifications_created_at ON email_notifications(created_at);

-- Create user preferences table for notification settings
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  email_notifications BOOLEAN DEFAULT true,
  cc_on_all_projects BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Email notifications policies
CREATE POLICY "Users can view notifications for their projects" ON email_notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = email_notifications.project_id
      AND (p.client_id = auth.uid() OR p.manager_id = auth.uid())
    )
  );

CREATE POLICY "Admins can view all notifications" ON email_notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- User preferences policies
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_email_notifications_updated_at BEFORE UPDATE ON email_notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();