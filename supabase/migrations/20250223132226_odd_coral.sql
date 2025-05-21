/*
  # Add Sample Candidate Data

  1. New Data
    - Creates a sample candidate "Muhammad Ainul Zafri"
    - Adds performance metrics and loyalty status
    - Includes extensive work experience
    - Sets up language proficiencies
    - Adds physical measurements
    - Creates certification records
    - Adds emergency contact information

  2. Notes
    - Uses DO block for variable management
    - All relationships are properly maintained
    - Includes comprehensive work history
*/

DO $$
DECLARE
  candidate_id uuid;
BEGIN
  -- Insert main candidate record
  INSERT INTO candidates (
    id,
    full_name,
    ic_number,
    date_of_birth,
    phone_number,
    gender,
    email,
    nationality,
    emergency_contact_name,
    emergency_contact_number,
    bank_name,
    bank_account_number,
    highest_education,
    has_vehicle,
    vehicle_type,
    is_banned,
    created_at
  ) VALUES (
    gen_random_uuid(),
    'Muhammad Ainul Zafri Bin Mohd Khairul Anuar',
    '041007140729',
    '2004-10-07',
    '0192569384',
    'male',
    'ainulzafri@example.com',
    'Malaysian',
    'Mohd Khairul Anuar',
    '0192569384',
    'Bank Islam',
    '12345678',
    'Diploma',
    true,
    'car',
    false,
    current_timestamp
  ) RETURNING id INTO candidate_id;

  -- Insert performance metrics
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
    candidate_id,
    95.0,
    98.0,
    4.8,
    25,
    0,
    1,
    0,
    '{"event_crew": 4.9, "supervisor": 4.8, "usher": 4.7}',
    current_timestamp
  );

  -- Insert loyalty status
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
    candidate_id,
    'gold',
    25,
    2500,
    current_date,
    current_date + interval '1 year',
    true,
    current_timestamp
  );

  -- Insert language proficiencies
  INSERT INTO language_proficiency (
    candidate_id,
    language,
    proficiency_level,
    is_primary
  ) VALUES 
  (candidate_id, 'Malay', 'native', true),
  (candidate_id, 'English', 'fluent', false);

  -- Insert measurements
  INSERT INTO measurements (
    candidate_id,
    height_cm,
    weight_kg,
    shirt_size,
    shoe_size,
    last_updated
  ) VALUES (
    candidate_id,
    175,
    75,
    'XL',
    '42',
    current_timestamp
  );

  -- Insert experience records
  INSERT INTO experience (
    candidate_id,
    skill_name,
    years_experience,
    is_verified,
    created_at
  ) VALUES 
  (candidate_id, 'Event Crew', 2, true, current_timestamp),
  (candidate_id, 'Supervisor', 1, true, current_timestamp),
  (candidate_id, 'Usher', 1, true, current_timestamp),
  (candidate_id, 'Chauffeur', 1, true, current_timestamp),
  (candidate_id, 'Setup Crew', 1, true, current_timestamp);

  -- Insert location preferences
  INSERT INTO location_preferences (
    candidate_id,
    current_address,
    public_transport_dependent,
    last_location_update
  ) VALUES (
    candidate_id,
    'Wangsa Maju, Kuala Lumpur',
    false,
    current_timestamp
  );

  -- Insert availability
  INSERT INTO availability (
    candidate_id,
    preferred_working_hours,
    weekend_available,
    public_holiday_available,
    notice_period_days,
    last_updated
  ) VALUES (
    candidate_id,
    '{"weekdays": ["09:00-18:00"], "weekends": ["09:00-18:00"]}',
    true,
    true,
    7,
    current_timestamp
  );

  -- Insert certifications
  INSERT INTO certifications (
    candidate_id,
    cert_name,
    cert_number,
    issuing_body,
    issue_date,
    is_verified,
    created_at
  ) VALUES (
    candidate_id,
    'Event Management Certification',
    'EMC-2023-001',
    'Event Management Institute',
    current_date - interval '6 months',
    true,
    current_timestamp
  );
END $$;