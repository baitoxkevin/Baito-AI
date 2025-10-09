-- Seed Test Projects for Calendar Testing
-- This SQL script creates realistic test projects to showcase the calendar improvements
--
-- INSTRUCTIONS:
-- 1. Replace YOUR_USER_ID with your actual user ID from auth.users
-- 2. Run this script in Supabase SQL Editor or via psql
--
-- To get your user ID, first run:
-- SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- Delete existing test projects (optional - uncomment if needed)
-- DELETE FROM projects WHERE title LIKE '%Test%' OR description LIKE '%test%';

-- TODAY - Multiple events to show time display
INSERT INTO projects (
  title, event_type, start_date, end_date,
  working_hours_start, working_hours_end,
  venue_address, crew_count, filled_positions,
  status, priority, color, description, created_by
) VALUES
-- Event 1: Morning
(
  'Morning Team Meeting',
  'Meeting',
  CURRENT_DATE,
  CURRENT_DATE,
  '09:00',
  '10:30',
  'Conference Room A, Main Office',
  8,
  6,
  'Active',
  'High',
  '#F59E0B',
  'Weekly team sync to discuss project updates and priorities',
  'YOUR_USER_ID'  -- Replace with your user ID
),

-- Event 2: Afternoon
(
  'Product Launch Event',
  'Corporate',
  CURRENT_DATE,
  CURRENT_DATE,
  '14:00',
  '18:00',
  'Downtown Convention Center, Hall B',
  25,
  25,
  'Active',
  'High',
  '#8B5CF6',
  'Major product launch with press conference and demo',
  'YOUR_USER_ID'
),

-- Event 3: Evening
(
  'Evening Networking Mixer',
  'Corporate',
  CURRENT_DATE,
  CURRENT_DATE,
  '19:00',
  '22:00',
  'Sky Lounge, 42nd Floor, City Tower',
  12,
  10,
  'Active',
  'Medium',
  '#8B5CF6',
  'Networking event for industry professionals',
  'YOUR_USER_ID'
),

-- TOMORROW - Multi-day event starting
(
  'Tech Conference 2025',
  'Conference',
  CURRENT_DATE + INTERVAL '1 day',
  CURRENT_DATE + INTERVAL '3 days',
  '08:00',
  '18:00',
  'Grand Convention Center, Exhibition Hall 1-3',
  50,
  45,
  'Active',
  'High',
  '#10B981',
  '3-day technology conference with keynotes and workshops',
  'YOUR_USER_ID'
),

-- Day +2
(
  'Corporate Training Session',
  'Meeting',
  CURRENT_DATE + INTERVAL '2 days',
  CURRENT_DATE + INTERVAL '2 days',
  '10:00',
  '16:00',
  'Training Center, Building 3',
  15,
  12,
  'Pending',
  'Medium',
  '#F59E0B',
  'Annual corporate training for new hires',
  'YOUR_USER_ID'
),

-- Day +4 - Multi-day festival
(
  'Summer Music Festival',
  'Festival',
  CURRENT_DATE + INTERVAL '4 days',
  CURRENT_DATE + INTERVAL '6 days',
  '12:00',
  '23:00',
  'Riverside Park, Main Stage Area',
  100,
  85,
  'Active',
  'High',
  '#F97316',
  '3-day outdoor music festival with multiple stages',
  'YOUR_USER_ID'
),

-- Day +5
(
  'Client Presentation',
  'Meeting',
  CURRENT_DATE + INTERVAL '5 days',
  CURRENT_DATE + INTERVAL '5 days',
  '14:00',
  '15:30',
  'Client Office, 25th Floor Boardroom',
  5,
  5,
  'Active',
  'High',
  '#F59E0B',
  'Q4 results presentation to key stakeholders',
  'YOUR_USER_ID'
),

-- Day +7 (Next week)
(
  'Wedding Reception - Johnson & Smith',
  'Wedding',
  CURRENT_DATE + INTERVAL '7 days',
  CURRENT_DATE + INTERVAL '7 days',
  '17:00',
  '23:00',
  'Garden Estate Venue, 1234 Vineyard Road',
  30,
  28,
  'Active',
  'High',
  '#EC4899',
  'Elegant outdoor wedding reception for 200 guests',
  'YOUR_USER_ID'
),

-- Day +9 - Multi-day production
(
  'TV Commercial Shoot',
  'Production',
  CURRENT_DATE + INTERVAL '9 days',
  CURRENT_DATE + INTERVAL '10 days',
  '06:00',
  '20:00',
  'Studio 7, Production Complex',
  40,
  35,
  'Pending',
  'Medium',
  '#3B82F6',
  '2-day commercial shoot for major brand',
  'YOUR_USER_ID'
),

-- Day +12
(
  'Rock Concert - The Voltage',
  'Concert',
  CURRENT_DATE + INTERVAL '12 days',
  CURRENT_DATE + INTERVAL '12 days',
  '19:00',
  '23:30',
  'Arena Stadium, Gate 5',
  60,
  55,
  'Active',
  'High',
  '#EF4444',
  'Live rock concert with opening acts',
  'YOUR_USER_ID'
),

-- Day +14 - Multi-day retreat
(
  'Annual Corporate Retreat',
  'Corporate',
  CURRENT_DATE + INTERVAL '14 days',
  CURRENT_DATE + INTERVAL '16 days',
  '09:00',
  '17:00',
  'Mountain Resort & Conference Center',
  20,
  15,
  'Pending',
  'Medium',
  '#8B5CF6',
  '3-day company retreat with team building activities',
  'YOUR_USER_ID'
),

-- Day +18
(
  'Fashion Show - Spring Collection',
  'Production',
  CURRENT_DATE + INTERVAL '18 days',
  CURRENT_DATE + INTERVAL '18 days',
  '18:00',
  '21:00',
  'Modern Art Museum, Grand Hall',
  35,
  30,
  'Pending',
  'High',
  '#3B82F6',
  'High-fashion runway show and after-party',
  'YOUR_USER_ID'
),

-- Day +21 (3 weeks out)
(
  'Board Meeting - Q4 Review',
  'Meeting',
  CURRENT_DATE + INTERVAL '21 days',
  CURRENT_DATE + INTERVAL '21 days',
  '09:00',
  '12:00',
  'Executive Suite, Corporate HQ',
  6,
  6,
  'Pending',
  'High',
  '#F59E0B',
  'Quarterly board meeting and strategic planning',
  'YOUR_USER_ID'
),

-- YESTERDAY (to test past events)
(
  'Film Production Wrap Party',
  'Production',
  CURRENT_DATE - INTERVAL '1 day',
  CURRENT_DATE - INTERVAL '1 day',
  '20:00',
  '01:00',
  'Sunset Studios, Stage 4',
  25,
  25,
  'Completed',
  'Low',
  '#3B82F6',
  'Celebration wrap party for completed film project',
  'YOUR_USER_ID'
),

-- Last week (to test list view scrolling)
(
  'Charity Gala Dinner',
  'Corporate',
  CURRENT_DATE - INTERVAL '7 days',
  CURRENT_DATE - INTERVAL '7 days',
  '18:30',
  '23:00',
  'Grand Hotel Ballroom',
  40,
  40,
  'Completed',
  'Medium',
  '#8B5CF6',
  'Annual charity fundraising gala',
  'YOUR_USER_ID'
);

-- Verify the insert
SELECT
  COUNT(*) as total_projects,
  COUNT(CASE WHEN start_date = CURRENT_DATE THEN 1 END) as today_events,
  COUNT(CASE WHEN start_date > CURRENT_DATE THEN 1 END) as future_events,
  COUNT(CASE WHEN start_date < CURRENT_DATE THEN 1 END) as past_events
FROM projects
WHERE created_by = 'YOUR_USER_ID';

-- Show the projects by date
SELECT
  title,
  event_type,
  start_date,
  end_date,
  working_hours_start,
  status
FROM projects
WHERE created_by = 'YOUR_USER_ID'
ORDER BY start_date, working_hours_start;
