-- Replacement Matching Algorithm
-- Migration: 20250103_replacement_matching_algorithm
-- This implements the 5-factor scoring system for finding optimal crew replacements

-- Function to calculate distance between two lat/lng points (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DOUBLE PRECISION,
  lng1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lng2 DOUBLE PRECISION
) RETURNS DOUBLE PRECISION AS $$
DECLARE
  earth_radius CONSTANT DOUBLE PRECISION := 6371; -- km
  dlat DOUBLE PRECISION;
  dlng DOUBLE PRECISION;
  a DOUBLE PRECISION;
  c DOUBLE PRECISION;
BEGIN
  dlat := radians(lat2 - lat1);
  dlng := radians(lng2 - lng1);

  a := sin(dlat/2) * sin(dlat/2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dlng/2) * sin(dlng/2);

  c := 2 * atan2(sqrt(a), sqrt(1-a));

  RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate availability score (0-100)
CREATE OR REPLACE FUNCTION calculate_availability_score(
  crew_id UUID,
  target_date DATE
) RETURNS DECIMAL(5,2) AS $$
DECLARE
  assignment_count INTEGER;
  score DECIMAL(5,2);
BEGIN
  -- Count how many assignments the crew has on the target date
  SELECT COUNT(*)
  INTO assignment_count
  FROM project_crew_assignments pca
  JOIN projects p ON pca.project_id = p.id
  WHERE pca.crew_member_id = crew_id
    AND pca.status = 'confirmed'
    AND target_date BETWEEN p.start_date AND COALESCE(p.end_date, p.start_date);

  -- Scoring:
  -- 0 assignments = 100 (completely free)
  -- 1 assignment = 70 (can manage)
  -- 2+ assignments = 40 (busy)
  IF assignment_count = 0 THEN
    score := 100;
  ELSIF assignment_count = 1 THEN
    score := 70;
  ELSE
    score := 40;
  END IF;

  RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate skill match score (0-100)
CREATE OR REPLACE FUNCTION calculate_skill_match_score(
  crew_role VARCHAR(50),
  required_role VARCHAR(50),
  crew_skills TEXT[],
  required_skills TEXT[]
) RETURNS DECIMAL(5,2) AS $$
DECLARE
  score DECIMAL(5,2) := 50; -- Base score
  matching_skills INTEGER := 0;
BEGIN
  -- Role match scoring
  IF crew_role = required_role THEN
    score := 100; -- Exact role match
  ELSIF crew_role IN ('Event Staff', 'General Worker') OR required_role IN ('Event Staff', 'General Worker') THEN
    score := 75; -- Similar/flexible roles
  ELSE
    score := 50; -- Capable but different role
  END IF;

  -- Bonus for matching special skills (if provided)
  IF required_skills IS NOT NULL AND array_length(required_skills, 1) > 0 THEN
    -- Count matching skills
    SELECT COUNT(*)
    INTO matching_skills
    FROM unnest(crew_skills) cs
    WHERE cs = ANY(required_skills);

    -- Add bonus: +5 points per matching skill (max +25)
    score := LEAST(score + (matching_skills * 5), 100);
  END IF;

  RETURN score;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate distance score (0-100)
CREATE OR REPLACE FUNCTION calculate_distance_score(
  distance_km DOUBLE PRECISION
) RETURNS DECIMAL(5,2) AS $$
BEGIN
  IF distance_km < 5 THEN
    RETURN 100;
  ELSIF distance_km < 10 THEN
    RETURN 80;
  ELSIF distance_km < 20 THEN
    RETURN 60;
  ELSE
    RETURN 30;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate past performance score (0-100)
CREATE OR REPLACE FUNCTION calculate_performance_score(
  crew_id UUID
) RETURNS DECIMAL(5,2) AS $$
DECLARE
  avg_rating DECIMAL(3,2);
  score DECIMAL(5,2);
BEGIN
  -- Get average rating from past projects
  -- Note: Assuming there's a ratings/reviews table - adjust if different
  SELECT AVG(rating)
  INTO avg_rating
  FROM project_crew_assignments
  WHERE crew_member_id = crew_id
    AND rating IS NOT NULL;

  -- If no ratings, give neutral score
  IF avg_rating IS NULL THEN
    RETURN 70;
  END IF;

  -- Convert 5-star rating to 0-100 score
  -- 5 stars = 100, 4 stars = 80, 3 stars = 60, etc.
  score := (avg_rating / 5.0) * 100;

  RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate project familiarity score (0-100)
CREATE OR REPLACE FUNCTION calculate_familiarity_score(
  crew_id UUID,
  project_id UUID,
  client_id UUID
) RETURNS DECIMAL(5,2) AS $$
DECLARE
  worked_on_project BOOLEAN;
  worked_with_client BOOLEAN;
BEGIN
  -- Check if worked on this exact project before
  SELECT EXISTS(
    SELECT 1
    FROM project_crew_assignments
    WHERE crew_member_id = crew_id
      AND project_id = project_id
      AND status = 'confirmed'
  ) INTO worked_on_project;

  IF worked_on_project THEN
    RETURN 100;
  END IF;

  -- Check if worked with same client before
  SELECT EXISTS(
    SELECT 1
    FROM project_crew_assignments pca
    JOIN projects p ON pca.project_id = p.id
    WHERE pca.crew_member_id = crew_id
      AND p.client_id = client_id
      AND pca.status = 'confirmed'
  ) INTO worked_with_client;

  IF worked_with_client THEN
    RETURN 70;
  END IF;

  -- New to both project and client
  RETURN 50;
END;
$$ LANGUAGE plpgsql;

-- Main function to find and rank replacement candidates
CREATE OR REPLACE FUNCTION find_replacement_candidates(
  p_sick_leave_id UUID,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  crew_member_id UUID,
  crew_name TEXT,
  crew_role VARCHAR(50),
  total_score DECIMAL(6,2),
  availability_score DECIMAL(5,2),
  skill_match_score DECIMAL(5,2),
  distance_score DECIMAL(5,2),
  performance_score DECIMAL(5,2),
  familiarity_score DECIMAL(5,2),
  distance_km DOUBLE PRECISION,
  current_assignments INTEGER
) AS $$
DECLARE
  v_project_id UUID;
  v_sick_date DATE;
  v_required_role VARCHAR(50);
  v_required_skills TEXT[];
  v_project_lat DOUBLE PRECISION;
  v_project_lng DOUBLE PRECISION;
  v_client_id UUID;
BEGIN
  -- Get sick leave details
  SELECT
    sl.project_id,
    sl.sick_date,
    pca.position_type,
    p.venue_lat,
    p.venue_lng,
    p.client_id
  INTO
    v_project_id,
    v_sick_date,
    v_required_role,
    v_project_lat,
    v_project_lng,
    v_client_id
  FROM sick_leaves sl
  JOIN project_crew_assignments pca ON sl.crew_id = pca.crew_member_id AND sl.project_id = pca.project_id
  JOIN projects p ON sl.project_id = p.id
  WHERE sl.id = p_sick_leave_id;

  -- Extract required skills from project special_requirements if exists
  SELECT
    COALESCE(
      ARRAY(
        SELECT jsonb_array_elements_text(special_requirements->'skills')
        FROM projects
        WHERE id = v_project_id
      ),
      ARRAY[]::TEXT[]
    )
  INTO v_required_skills;

  -- Find and score all potential replacement candidates
  RETURN QUERY
  SELECT
    cm.id AS crew_member_id,
    cm.full_name AS crew_name,
    cm.role AS crew_role,
    -- Total weighted score
    (
      (avail.score * 0.30) +
      (skill.score * 0.25) +
      (dist.score * 0.20) +
      (perf.score * 0.15) +
      (fam.score * 0.10)
    )::DECIMAL(6,2) AS total_score,
    avail.score AS availability_score,
    skill.score AS skill_match_score,
    dist.score AS distance_score,
    perf.score AS performance_score,
    fam.score AS familiarity_score,
    dist.distance_km,
    avail.assignment_count AS current_assignments
  FROM crew_members cm
  -- Calculate each score component
  CROSS JOIN LATERAL (
    SELECT
      calculate_availability_score(cm.id, v_sick_date) AS score,
      (
        SELECT COUNT(*)
        FROM project_crew_assignments pca
        JOIN projects p ON pca.project_id = p.id
        WHERE pca.crew_member_id = cm.id
          AND pca.status = 'confirmed'
          AND v_sick_date BETWEEN p.start_date AND COALESCE(p.end_date, p.start_date)
      )::INTEGER AS assignment_count
  ) avail
  CROSS JOIN LATERAL (
    SELECT calculate_skill_match_score(
      cm.role,
      v_required_role,
      COALESCE(cm.skills, ARRAY[]::TEXT[]),
      v_required_skills
    ) AS score
  ) skill
  CROSS JOIN LATERAL (
    SELECT
      calculate_distance(v_project_lat, v_project_lng, cm.location_lat, cm.location_lng) AS distance_km,
      calculate_distance_score(
        calculate_distance(v_project_lat, v_project_lng, cm.location_lat, cm.location_lng)
      ) AS score
  ) dist
  CROSS JOIN LATERAL (
    SELECT calculate_performance_score(cm.id) AS score
  ) perf
  CROSS JOIN LATERAL (
    SELECT calculate_familiarity_score(cm.id, v_project_id, v_client_id) AS score
  ) fam
  WHERE
    cm.status = 'active'
    AND cm.id != (SELECT crew_id FROM sick_leaves WHERE id = p_sick_leave_id)
    -- Only include crew with location data
    AND cm.location_lat IS NOT NULL
    AND cm.location_lng IS NOT NULL
  ORDER BY total_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to create replacement request with calculated scores
CREATE OR REPLACE FUNCTION create_replacement_request(
  p_sick_leave_id UUID,
  p_target_crew_id UUID,
  p_match_score DECIMAL(5,2),
  p_availability_score DECIMAL(5,2),
  p_skill_score DECIMAL(5,2),
  p_distance_score DECIMAL(5,2),
  p_performance_score DECIMAL(5,2),
  p_familiarity_score DECIMAL(5,2),
  p_distance_km DOUBLE PRECISION
) RETURNS UUID AS $$
DECLARE
  v_request_id UUID;
  v_original_crew_id UUID;
  v_expires_at TIMESTAMP;
BEGIN
  -- Get original crew ID
  SELECT crew_id INTO v_original_crew_id
  FROM sick_leaves
  WHERE id = p_sick_leave_id;

  -- Set expiry to 30 minutes from now
  v_expires_at := NOW() + INTERVAL '30 minutes';

  -- Insert replacement request
  INSERT INTO replacement_requests (
    sick_leave_id,
    original_crew_id,
    target_crew_id,
    match_score,
    availability_score,
    skill_match_score,
    distance_score,
    performance_score,
    familiarity_score,
    distance_km,
    status,
    expires_at
  ) VALUES (
    p_sick_leave_id,
    v_original_crew_id,
    p_target_crew_id,
    p_match_score,
    p_availability_score,
    p_skill_score,
    p_distance_score,
    p_performance_score,
    p_familiarity_score,
    p_distance_km,
    'pending',
    v_expires_at
  )
  RETURNING id INTO v_request_id;

  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION find_replacement_candidates IS 'Finds and ranks the best replacement candidates for a sick leave using 5-factor scoring algorithm';
COMMENT ON FUNCTION calculate_availability_score IS 'Scores crew availability: 0 assignments=100, 1=70, 2+=40';
COMMENT ON FUNCTION calculate_skill_match_score IS 'Scores skill match: exact role=100, similar=75, capable=50';
COMMENT ON FUNCTION calculate_distance_score IS 'Scores distance: <5km=100, 5-10km=80, 10-20km=60, 20+km=30';
COMMENT ON FUNCTION calculate_performance_score IS 'Scores past performance based on average ratings';
COMMENT ON FUNCTION calculate_familiarity_score IS 'Scores project familiarity: same project=100, same client=70, new=50';
