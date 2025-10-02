/*
  # Add Sample Projects

  1. New Data
    - Adds sample project data for testing calendar functionality
    - Includes a mix of past, current, and future projects
    - Covers different event types and statuses

  2. Project Details
    - Each project has realistic dates, times, and locations
    - Includes various event types (roving, roadshow, etc.)
    - Different crew sizes and requirements
*/

DO $$
DECLARE
  manager_id uuid;
  client_id uuid;
BEGIN
  -- Get a manager ID (fallback to creating one if none exists)
  SELECT id INTO manager_id FROM users WHERE role = 'manager' LIMIT 1;
  IF manager_id IS NULL THEN
    INSERT INTO users (
      id, email, username, full_name, role, is_super_admin, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      'manager@example.com',
      'manager',
      'Project Manager',
      'manager',
      false,
      now(),
      now()
    ) RETURNING id INTO manager_id;
  END IF;

  -- Get a client ID (fallback to creating one if none exists)
  SELECT id INTO client_id FROM users WHERE role = 'client' LIMIT 1;
  IF client_id IS NULL THEN
    INSERT INTO users (
      id, email, username, full_name, role, is_super_admin, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      'client@example.com',
      'client',
      'Test Client',
      'client',
      false,
      now(),
      now()
    ) RETURNING id INTO client_id;
  END IF;

  -- Insert sample projects
  INSERT INTO projects (
    title,
    client_id,
    manager_id,
    status,
    priority,
    start_date,
    end_date,
    crew_count,
    filled_positions,
    working_hours_start,
    working_hours_end,
    event_type,
    venue_address,
    venue_details,
    supervisors_required,
    color
  ) VALUES
  -- Past Event
  (
    'Tech Conference 2024',
    client_id,
    manager_id,
    'completed',
    'high',
    now() - interval '2 days',
    now() - interval '1 day',
    10,
    10,
    '09:00',
    '18:00',
    'conference',
    'Convention Center, Downtown',
    'Main Hall A, Registration at Gate 2',
    2,
    '#4F46E5'
  ),
  -- Current Event
  (
    'Product Launch Roadshow',
    client_id,
    manager_id,
    'in-progress',
    'high',
    now(),
    now() + interval '3 days',
    5,
    5,
    '10:00',
    '20:00',
    'roadshow',
    'Shopping Mall Central',
    'Near Main Entrance',
    1,
    '#2563EB'
  ),
  -- Upcoming Event
  (
    'Summer Music Festival',
    client_id,
    manager_id,
    'new',
    'medium',
    now() + interval '5 days',
    now() + interval '7 days',
    15,
    0,
    '14:00',
    '23:00',
    'concert',
    'City Park Amphitheater',
    'Outdoor venue, multiple stages',
    3,
    '#7C3AED'
  ),
  -- Future Event
  (
    'Corporate Team Building',
    client_id,
    manager_id,
    'new',
    'low',
    now() + interval '10 days',
    now() + interval '10 days',
    8,
    0,
    '08:00',
    '17:00',
    'corporate',
    'Adventure Park',
    'Meeting point at visitor center',
    1,
    '#059669'
  ),
  -- Multi-day Event
  (
    'Food & Beverage Expo',
    client_id,
    manager_id,
    'new',
    'high',
    now() + interval '15 days',
    now() + interval '18 days',
    20,
    0,
    '09:00',
    '21:00',
    'roadshow',
    'Exhibition Center',
    'Halls 1-3, Multiple stations',
    4,
    '#DC2626'
  );

  -- Initialize crew assignments for each project
  -- (The trigger we created earlier will handle this automatically)
END $$;