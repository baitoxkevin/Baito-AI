-- Add candidate project history tracking, ratings, and blacklist functionality

-- Create candidate_project_history table to track completed projects
CREATE TABLE IF NOT EXISTS candidate_project_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(candidate_id, project_id)
);

-- Add indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_candidate_history_candidate_id ON candidate_project_history(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_history_project_id ON candidate_project_history(project_id);
CREATE INDEX IF NOT EXISTS idx_candidate_history_user_id ON candidate_project_history(user_id);
CREATE INDEX IF NOT EXISTS idx_candidate_history_rating ON candidate_project_history(rating);

-- Create candidate_blacklist table to track blacklisted candidates
CREATE TABLE IF NOT EXISTS candidate_blacklist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  proof_files JSONB DEFAULT '[]'::jsonb,
  is_global BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(candidate_id, user_id)
);

-- Add indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_candidate_blacklist_candidate_id ON candidate_blacklist(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_blacklist_user_id ON candidate_blacklist(user_id);
CREATE INDEX IF NOT EXISTS idx_candidate_blacklist_is_global ON candidate_blacklist(is_global);

-- Add RLS policies for candidate_project_history
ALTER TABLE candidate_project_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public users can read candidate_project_history"
  ON candidate_project_history FOR SELECT
  USING (true);
  
CREATE POLICY "Authenticated users can insert candidate_project_history"
  ON candidate_project_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update their own candidate_project_history"
  ON candidate_project_history FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add RLS policies for candidate_blacklist
ALTER TABLE candidate_blacklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public users can read candidate_blacklist"
  ON candidate_blacklist FOR SELECT
  USING (true);
  
CREATE POLICY "Authenticated users can insert to candidate_blacklist"
  ON candidate_blacklist FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update their own candidate_blacklist entries"
  ON candidate_blacklist FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Stored function to automatically update candidates performance_metrics when a new history entry is added
CREATE OR REPLACE FUNCTION update_candidate_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if candidate has performance_metrics
  IF EXISTS (SELECT 1 FROM performance_metrics WHERE candidate_id = NEW.candidate_id) THEN
    -- Update existing metrics
    UPDATE performance_metrics
    SET 
      total_gigs_completed = total_gigs_completed + 1,
      avg_rating = (
        SELECT AVG(rating) 
        FROM candidate_project_history 
        WHERE candidate_id = NEW.candidate_id AND rating IS NOT NULL
      ),
      updated_at = NOW()
    WHERE candidate_id = NEW.candidate_id;
  ELSE
    -- Create new metrics
    INSERT INTO performance_metrics (
      candidate_id, 
      avg_rating, 
      total_gigs_completed,
      reliability_score, 
      response_rate
    ) VALUES (
      NEW.candidate_id,
      NEW.rating,
      1,
      100, -- Default reliability score
      100  -- Default response rate
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for the function
CREATE TRIGGER update_candidate_metrics_trigger
AFTER INSERT ON candidate_project_history
FOR EACH ROW
EXECUTE FUNCTION update_candidate_metrics();

-- Comments to explain the tables
COMMENT ON TABLE candidate_project_history IS 'Tracks a candidate''s completed projects with ratings and comments';
COMMENT ON TABLE candidate_blacklist IS 'Tracks candidates blacklisted by users with reasons and proof';
COMMENT ON COLUMN candidate_project_history.rating IS 'Rating from 1-5 given by the user/event manager';
COMMENT ON COLUMN candidate_blacklist.proof_files IS 'Array of file URLs showing proof for blacklisting';
COMMENT ON COLUMN candidate_blacklist.is_global IS 'If true, the candidate is blacklisted for all users';