-- Create BaitoAI project
INSERT INTO projects (
  title,
  description,
  status,
  priority,
  start_date,
  end_date,
  event_type,
  crew_count,
  working_hours_start,
  working_hours_end,
  venue_address,
  supervisors_required
) VALUES (
  'baitoAI',
  'Project launch and development',
  'new',
  'high',
  '2024-03-01',
  '2024-03-08',
  'corporate',
  3,
  '09:00',
  '17:00',
  'Remote',
  1
) ON CONFLICT DO NOTHING;
