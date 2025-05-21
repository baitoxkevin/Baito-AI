/*
  # Add trigger for candidate creation

  1. New Functionality
    - Create trigger to automatically create performance metrics and loyalty status
    - Trigger fires after a new candidate is inserted
    - Sets default values for both related tables
  
  2. Changes
    - Add trigger function
    - Add trigger on candidates table
*/

-- Create trigger function
CREATE OR REPLACE FUNCTION create_candidate_related_records()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default performance metrics
  INSERT INTO performance_metrics (
    candidate_id,
    reliability_score,
    response_rate,
    avg_rating,
    total_gigs_completed,
    no_shows,
    late_arrivals,
    early_terminations,
    category_ratings,
    last_updated
  ) VALUES (
    NEW.id,
    100.0,  -- Initial perfect score
    100.0,  -- Initial perfect score
    0.0,    -- No ratings yet
    0,      -- No gigs completed
    0,      -- No no-shows
    0,      -- No late arrivals
    0,      -- No early terminations
    '{}',   -- Empty category ratings
    NOW()
  );

  -- Create default loyalty status
  INSERT INTO loyalty_status (
    candidate_id,
    tier_level,
    total_gigs_completed,
    current_points,
    tier_achieved_date,
    points_expiry_date,
    fast_track_eligible,
    last_updated
  ) VALUES (
    NEW.id,
    'bronze',  -- Starting tier
    0,        -- No gigs completed
    0,        -- Starting points
    NOW(),    -- Tier achieved today
    NOW() + INTERVAL '1 year',  -- Points expire in 1 year
    false,    -- Not fast track eligible initially
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS create_candidate_related_records_trigger ON candidates;

CREATE TRIGGER create_candidate_related_records_trigger
  AFTER INSERT ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION create_candidate_related_records();