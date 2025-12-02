-- Migration: Create error_reports table for frontend error reporting feature
-- Date: 2024-12-02
-- Description: Stores error reports submitted by users including screenshots and context

-- Create the error_reports table
CREATE TABLE IF NOT EXISTS error_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  error_id TEXT NOT NULL UNIQUE, -- Unique error identifier (e.g., ERR-1234567890-abc123)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Optional: logged-in user who reported

  -- Error details
  error_message TEXT NOT NULL,
  error_stack TEXT, -- Full stack trace
  component_stack TEXT, -- React component stack

  -- User context
  user_description TEXT, -- User's description of what they were doing
  screenshot_url TEXT, -- Base64 or URL to screenshot

  -- Page context
  page_url TEXT NOT NULL,
  page_context TEXT, -- Page title or route name
  user_agent TEXT,

  -- Metadata
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'ignored', 'duplicate')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_error_reports_user_id ON error_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_error_reports_status ON error_reports(status);
CREATE INDEX IF NOT EXISTS idx_error_reports_created_at ON error_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_reports_error_id ON error_reports(error_id);
CREATE INDEX IF NOT EXISTS idx_error_reports_priority ON error_reports(priority);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_error_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_error_reports_updated_at ON error_reports;
CREATE TRIGGER trigger_error_reports_updated_at
  BEFORE UPDATE ON error_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_error_reports_updated_at();

-- Row Level Security (RLS) Policies
ALTER TABLE error_reports ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert error reports
CREATE POLICY "Users can insert error reports"
  ON error_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to read their own error reports
CREATE POLICY "Users can read own error reports"
  ON error_reports
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

-- Allow admins (with admin role) to read all error reports
-- Note: You may need to adjust this based on your role system
CREATE POLICY "Admins can read all error reports"
  ON error_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Allow admins to update error reports (status, assignment, etc.)
CREATE POLICY "Admins can update error reports"
  ON error_reports
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Allow anonymous users to submit error reports (if needed)
-- Uncomment if you want unauthenticated users to report errors
-- CREATE POLICY "Anonymous users can insert error reports"
--   ON error_reports
--   FOR INSERT
--   TO anon
--   WITH CHECK (user_id IS NULL);

-- Add comment to table
COMMENT ON TABLE error_reports IS 'Stores frontend error reports submitted by users, including screenshots and context for debugging';

-- Add comments to columns
COMMENT ON COLUMN error_reports.error_id IS 'Unique error identifier generated on frontend (format: ERR-timestamp-random)';
COMMENT ON COLUMN error_reports.screenshot_url IS 'Base64 encoded screenshot or URL to uploaded screenshot';
COMMENT ON COLUMN error_reports.component_stack IS 'React component stack trace from error boundary';
COMMENT ON COLUMN error_reports.status IS 'Current status of the error report: new, in_progress, resolved, ignored, duplicate';
COMMENT ON COLUMN error_reports.priority IS 'Priority level: low, medium, high, critical';
