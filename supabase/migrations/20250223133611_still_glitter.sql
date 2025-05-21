/*
  # Add dummy candidate data

  1. New Data
    - Adds 5 sample candidates with varied profiles
    - Includes performance metrics and loyalty status for each
    - Provides a good mix of different statuses and metrics

  2. Data Variety
    - Different loyalty tiers
    - Various performance levels
    - Mix of active and banned status
    - Diverse demographic information
*/

DO $$
DECLARE
  candidate_id uuid;
BEGIN
  -- Candidate 1: High performer
  INSERT INTO candidates (
    id, full_name, ic_number, date_of_birth, phone_number, gender, email,
    nationality, emergency_contact_name, emergency_contact_number, has_vehicle,
    is_banned, created_at
  ) VALUES (
    gen_random_uuid(), 'Sarah Chen', 'A1234567B', '1995-03-15', '+6591234567',
    'female', 'sarah.chen@example.com', 'Singaporean', 'Michael Chen', '+6591234568',
    true, false, current_timestamp - interval '2 years'
  ) RETURNING id INTO candidate_id;

  INSERT INTO performance_metrics (candidate_id, reliability_score, response_rate, avg_rating, total_gigs_completed)
  VALUES (candidate_id, 98.5, 99.0, 4.9, 150);

  INSERT INTO loyalty_status (
    candidate_id, tier_level, current_points, total_gigs_completed, 
    tier_achieved_date, points_expiry_date, fast_track_eligible
  )
  VALUES (
    candidate_id, 'diamond', 5000, 150, 
    current_date - interval '6 months', current_date + interval '6 months', true
  );

  -- Candidate 2: New joiner
  INSERT INTO candidates (
    id, full_name, ic_number, date_of_birth, phone_number, gender, email,
    nationality, emergency_contact_name, emergency_contact_number, has_vehicle,
    is_banned, created_at
  ) VALUES (
    gen_random_uuid(), 'John Smith', 'B2345678C', '1998-07-22', '+6592345678',
    'male', 'john.smith@example.com', 'British', 'Jane Smith', '+6592345679',
    false, false, current_timestamp - interval '2 months'
  ) RETURNING id INTO candidate_id;

  INSERT INTO performance_metrics (candidate_id, reliability_score, response_rate, avg_rating, total_gigs_completed)
  VALUES (candidate_id, 85.0, 90.0, 4.2, 5);

  INSERT INTO loyalty_status (
    candidate_id, tier_level, current_points, total_gigs_completed, 
    tier_achieved_date, points_expiry_date, fast_track_eligible
  )
  VALUES (
    candidate_id, 'bronze', 100, 5, 
    current_date - interval '2 months', current_date + interval '10 months', false
  );

  -- Candidate 3: Banned user
  INSERT INTO candidates (
    id, full_name, ic_number, date_of_birth, phone_number, gender, email,
    nationality, emergency_contact_name, emergency_contact_number, has_vehicle,
    is_banned, created_at
  ) VALUES (
    gen_random_uuid(), 'David Lee', 'C3456789D', '1992-11-30', '+6593456789',
    'male', 'david.lee@example.com', 'Malaysian', 'Mary Lee', '+6593456780',
    true, true, current_timestamp - interval '1 year'
  ) RETURNING id INTO candidate_id;

  INSERT INTO performance_metrics (candidate_id, reliability_score, response_rate, avg_rating, total_gigs_completed)
  VALUES (candidate_id, 60.0, 65.0, 2.5, 20);

  INSERT INTO loyalty_status (
    candidate_id, tier_level, current_points, total_gigs_completed, 
    tier_achieved_date, points_expiry_date, fast_track_eligible
  )
  VALUES (
    candidate_id, 'silver', 750, 20, 
    current_date - interval '9 months', current_date + interval '3 months', false
  );

  -- Candidate 4: Solid performer
  INSERT INTO candidates (
    id, full_name, ic_number, date_of_birth, phone_number, gender, email,
    nationality, emergency_contact_name, emergency_contact_number, has_vehicle,
    is_banned, created_at
  ) VALUES (
    gen_random_uuid(), 'Emily Wong', 'D4567890E', '1994-04-18', '+6594567890',
    'female', 'emily.wong@example.com', 'Singaporean', 'Peter Wong', '+6594567891',
    true, false, current_timestamp - interval '1.5 years'
  ) RETURNING id INTO candidate_id;

  INSERT INTO performance_metrics (candidate_id, reliability_score, response_rate, avg_rating, total_gigs_completed)
  VALUES (candidate_id, 92.0, 95.0, 4.7, 80);

  INSERT INTO loyalty_status (
    candidate_id, tier_level, current_points, total_gigs_completed, 
    tier_achieved_date, points_expiry_date, fast_track_eligible
  )
  VALUES (
    candidate_id, 'platinum', 3500, 80, 
    current_date - interval '3 months', current_date + interval '9 months', true
  );

  -- Candidate 5: Average performer
  INSERT INTO candidates (
    id, full_name, ic_number, date_of_birth, phone_number, gender, email,
    nationality, emergency_contact_name, emergency_contact_number, has_vehicle,
    is_banned, created_at
  ) VALUES (
    gen_random_uuid(), 'Raj Patel', 'E5678901F', '1997-09-25', '+6595678901',
    'male', 'raj.patel@example.com', 'Indian', 'Priya Patel', '+6595678902',
    false, false, current_timestamp - interval '8 months'
  ) RETURNING id INTO candidate_id;

  INSERT INTO performance_metrics (candidate_id, reliability_score, response_rate, avg_rating, total_gigs_completed)
  VALUES (candidate_id, 88.0, 87.0, 4.0, 35);

  INSERT INTO loyalty_status (
    candidate_id, tier_level, current_points, total_gigs_completed, 
    tier_achieved_date, points_expiry_date, fast_track_eligible
  )
  VALUES (
    candidate_id, 'gold', 1500, 35, 
    current_date - interval '4 months', current_date + interval '8 months', false
  );
END $$;