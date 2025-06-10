-- Import Projects Script for Supabase
-- This script creates demo data and imports all 88 projects

-- Step 1: Create demo companies
INSERT INTO companies (id, company_name, company_email, company_phone_no, address, created_at, updated_at)
VALUES 
  ('33333333-3333-3333-3333-333333333333', 'Demo Client Company', 'client@demo-events.com', '+60123456789', 'Kuala Lumpur, Malaysia', NOW(), NOW()),
  ('55555555-5555-5555-5555-555555555555', 'Demo Agency Company', 'agency@demo-events.com', '+60198765432', 'Petaling Jaya, Malaysia', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Step 2: Create demo users
INSERT INTO users (id, email, full_name, role, company_name, created_at, updated_at)
VALUES
  ('44444444-4444-4444-4444-444444444444', 'demo.manager@baito.events', 'Demo Manager', 'pm', 'Demo Agency Company', NOW(), NOW()),
  ('66666666-6666-6666-6666-666666666666', 'demo.client@baito.events', 'Demo Client', 'client', 'Demo Client Company', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Step 3: Import first batch of projects (25 projects)
INSERT INTO projects (
  title, client_id, manager_id, status, priority, 
  start_date, end_date, crew_count, filled_positions,
  working_hours_start, working_hours_end, event_type,
  venue_address, venue_details, supervisors_required,
  color, budget, project_type, schedule_type, brand_logo,
  created_at, updated_at
) VALUES
('Acson', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-04', '2025-04-04', 5, 3, '09:00', '18:00', 'activation', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),
('HSBC', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-10', '2025-04-10', 5, 3, '09:00', '18:00', 'corporate', 'To be confirmed', 'Details to be confirmed', 1, '#FFB347', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),
('Mytown Raya', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-10', '2025-04-10', 5, 3, '09:00', '18:00', 'event', 'To be confirmed', 'Details to be confirmed', 1, '#FF6B6B', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),
('Setup Crew', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-10', '2025-05-29', 5, 3, '09:00', '18:00', 'roving', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'recurring', NULL, NOW(), NOW()),
('Softlan Instore Roadshow', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-10', '2025-05-04', 5, 3, '09:00', '18:00', 'roving', 'To be confirmed', 'Details to be confirmed', 1, '#95E1D3', 1000, 'recruitment', 'recurring', NULL, NOW(), NOW()),
('Softlan Media', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-10', '2025-05-15', 5, 3, '09:00', '18:00', 'roving', 'To be confirmed', 'Details to be confirmed', 1, '#F38181', 1000, 'recruitment', 'recurring', NULL, NOW(), NOW()),
('Launch LRT', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-11', '2025-05-15', 5, 3, '09:00', '18:00', 'roving', 'To be confirmed', 'Details to be confirmed', 1, '#AA96DA', 1000, 'recruitment', 'recurring', NULL, NOW(), NOW()),
('MCD Raya', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-11', '2025-04-19', 5, 3, '09:00', '18:00', 'roving', 'To be confirmed', 'Details to be confirmed', 1, '#FCBAD3', 1000, 'recruitment', 'recurring', NULL, NOW(), NOW()),
('Mytown', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-11', '2025-07-26', 5, 3, '09:00', '18:00', 'roving', 'To be confirmed', 'Details to be confirmed', 1, '#FFFFD2', 1000, 'recruitment', 'recurring', NULL, NOW(), NOW()),
('Ribena K', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-17', '2025-04-17', 5, 3, '09:00', '18:00', 'activation', 'To be confirmed', 'Details to be confirmed', 1, '#A8E6CF', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),
('TFP', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-18', '2025-04-18', 5, 3, '09:00', '18:00', 'event', 'To be confirmed', 'Details to be confirmed', 1, '#C7CEEA', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),
('DIY CC Lemon Cotton Candy', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-20', '2025-04-20', 5, 3, '09:00', '18:00', 'activation', 'To be confirmed', 'Details to be confirmed', 1, '#FF8B94', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),
('FMS Jayson', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-20', '2025-04-20', 5, 3, '09:00', '18:00', 'event', 'To be confirmed', 'Details to be confirmed', 1, '#FFA5A5', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),
('Mas Airline Photobooth', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-20', '2025-04-20', 5, 3, '09:00', '18:00', 'photobooth', 'To be confirmed', 'Details to be confirmed', 1, '#C1C1C1', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),
('MrDiy Mascot MCD Danau Kota', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-20', '2025-04-20', 5, 3, '09:00', '18:00', 'mascot activation', 'To be confirmed', 'Details to be confirmed', 1, '#B4E7CE', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),
('Roots Grand Hyatt', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-22', '2025-04-22', 5, 3, '09:00', '18:00', 'event', 'To be confirmed', 'Details to be confirmed', 1, '#F0B7A4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),
('Q350-DIY Setup', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-23', '2025-04-23', 5, 3, '09:00', '18:00', 'setup', 'To be confirmed', 'Details to be confirmed', 1, '#F1E4E8', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),
('Q357-DIY LBH', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-24', '2025-04-24', 5, 3, '09:00', '18:00', 'activation', 'To be confirmed', 'Details to be confirmed', 1, '#E2D4F1', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),
('Softlan Media setup', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-24', '2025-04-24', 5, 3, '09:00', '18:00', 'media setup', 'To be confirmed', 'Details to be confirmed', 1, '#D4E8E2', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),
('Pickleball klgcc', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-25', '2025-04-25', 5, 3, '09:00', '18:00', 'sports event', 'To be confirmed', 'Details to be confirmed', 1, '#F8E1F4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),
('Skintific', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-26', '2025-04-26', 5, 3, '09:00', '18:00', 'activation', 'To be confirmed', 'Details to be confirmed', 1, '#BCE6FF', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),
('CP Purple Serum Instore', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-27', '2025-06-28', 5, 3, '09:00', '18:00', 'roving', 'To be confirmed', 'Details to be confirmed', 1, '#DDB6F2', 1000, 'recruitment', 'recurring', NULL, NOW(), NOW()),
('Cedric', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-27', '2025-04-27', 5, 3, '09:00', '18:00', 'event', 'To be confirmed', 'Details to be confirmed', 1, '#F7D060', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),
('Collect & Delivery', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-27', '2025-04-27', 5, 3, '09:00', '18:00', 'logistics', 'To be confirmed', 'Details to be confirmed', 1, '#F3B27A', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),
('DIY Cotton Candy', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-27', '2025-04-27', 5, 3, '09:00', '18:00', 'activation', 'To be confirmed', 'Details to be confirmed', 1, '#FFC7C7', 1000, 'recruitment', 'single', NULL, NOW(), NOW());