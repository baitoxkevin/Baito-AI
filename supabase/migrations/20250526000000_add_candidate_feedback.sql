-- Create table for candidate feedback and complaints
CREATE TABLE IF NOT EXISTS candidate_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID REFERENCES candidates(id),
  project_id UUID REFERENCES projects(id),
  feedback_type VARCHAR(50) NOT NULL CHECK (feedback_type IN ('complaint', 'suggestion', 'feedback', 'report')),
  feedback_text TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'in_progress', 'resolved', 'rejected')),
  is_anonymous BOOLEAN DEFAULT FALSE,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  response_text TEXT,
  custom_fields JSONB
);

-- Enable RLS for the feedback table
ALTER TABLE candidate_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for candidate_feedback
-- Anyone can create feedback
CREATE POLICY "Anyone can create feedback" ON candidate_feedback
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Candidates can view their own feedback
CREATE POLICY "Candidates can view their own feedback" ON candidate_feedback
  FOR SELECT TO authenticated
  USING (candidate_id IN (
    SELECT c.id FROM candidates c
    WHERE c.user_id = auth.uid()
  ));

-- Staff can view all feedback
CREATE POLICY "Staff can view all feedback" ON candidate_feedback
  FOR SELECT TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM staff
      WHERE role IN ('admin', 'manager', 'coordinator')
    )
  );

-- Staff can update feedback status
CREATE POLICY "Staff can update feedback" ON candidate_feedback
  FOR UPDATE TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM staff
      WHERE role IN ('admin', 'manager', 'coordinator')
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM staff
      WHERE role IN ('admin', 'manager', 'coordinator')
    )
  );

-- Add index for performance
CREATE INDEX IF NOT EXISTS candidate_feedback_candidate_id_idx ON candidate_feedback(candidate_id);
CREATE INDEX IF NOT EXISTS candidate_feedback_project_id_idx ON candidate_feedback(project_id);
CREATE INDEX IF NOT EXISTS candidate_feedback_status_idx ON candidate_feedback(status);

-- Add function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_candidate_feedback_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to update timestamp
CREATE TRIGGER update_candidate_feedback_timestamp
BEFORE UPDATE ON candidate_feedback
FOR EACH ROW EXECUTE FUNCTION update_candidate_feedback_modified_column();