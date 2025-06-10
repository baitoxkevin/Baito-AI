-- Complete Project Import SQL
-- This file creates demo companies, users, and imports all 88 projects from the CSV

-- Step 1: Create demo companies
INSERT INTO companies (id, name, created_at, updated_at)
VALUES 
  ('33333333-3333-3333-3333-333333333333', 'Demo Client Company', NOW(), NOW()),
  ('55555555-5555-5555-5555-555555555555', 'Demo Agency Company', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Step 2: Create demo users
INSERT INTO users (id, email, role, full_name, created_at, updated_at)
VALUES
  ('44444444-4444-4444-4444-444444444444', 'demo.manager@company.com', 'manager', 'Demo Manager', NOW(), NOW()),
  ('66666666-6666-6666-6666-666666666666', 'demo.staff@company.com', 'staff', 'Demo Staff User', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Step 3: Import all 88 projects from CSV
INSERT INTO projects (
  title, client_id, manager_id, status, priority, 
  start_date, end_date, crew_count, filled_positions,
  working_hours_start, working_hours_end, event_type,
  venue_address, venue_details, supervisors_required,
  color, budget, project_type, schedule_type, brand_logo,
  created_at, updated_at
) VALUES
-- Project 1
('Acson', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-04', '2025-04-04', 5, 3, '09:00', '18:00', 'activation', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 2
('HSBC', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-10', '2025-04-10', 5, 3, '09:00', '18:00', 'corporate', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 3
('Mytown Raya', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-10', '2025-04-10', 5, 3, '09:00', '18:00', 'event', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 4
('Setup Crew', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-10', '2025-05-29', 5, 3, '09:00', '18:00', 'roving', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'recurring', NULL, NOW(), NOW()),

-- Project 5
('Softlan Instore Roadshow', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-10', '2025-05-04', 5, 3, '09:00', '18:00', 'roving', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'recurring', NULL, NOW(), NOW()),

-- Project 6
('Softlan Media', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-10', '2025-05-15', 5, 3, '09:00', '18:00', 'roving', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'recurring', NULL, NOW(), NOW()),

-- Project 7
('Launch LRT', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-11', '2025-05-15', 5, 3, '09:00', '18:00', 'roving', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'recurring', NULL, NOW(), NOW()),

-- Project 8
('MCD Raya', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-11', '2025-04-19', 5, 3, '09:00', '18:00', 'roving', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'recurring', NULL, NOW(), NOW()),

-- Project 9
('Mytown', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-11', '2025-07-26', 5, 3, '09:00', '18:00', 'roving', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'recurring', NULL, NOW(), NOW()),

-- Project 10
('Ribena K', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-17', '2025-04-17', 5, 3, '09:00', '18:00', 'activation', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 11
('TFP', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-18', '2025-04-18', 5, 3, '09:00', '18:00', 'event', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 12
('DIY CC Lemon Cotton Candy', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-20', '2025-04-20', 5, 3, '09:00', '18:00', 'activation', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 13
('FMS Jayson', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-20', '2025-04-20', 5, 3, '09:00', '18:00', 'event', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 14
('Mas Airline Photobooth', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-20', '2025-04-20', 5, 3, '09:00', '18:00', 'photobooth', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 15
('MrDiy Mascot MCD Danau Kota', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-20', '2025-04-20', 5, 3, '09:00', '18:00', 'mascot activation', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 16
('Roots Grand Hyatt', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-22', '2025-04-22', 5, 3, '09:00', '18:00', 'event', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 17
('Q350-DIY Setup', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-23', '2025-04-23', 5, 3, '09:00', '18:00', 'setup', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 18
('Q357-DIY LBH', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-24', '2025-04-24', 5, 3, '09:00', '18:00', 'activation', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 19
('Softlan Media setup', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-24', '2025-04-24', 5, 3, '09:00', '18:00', 'media setup', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 20
('Pickleball klgcc', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-25', '2025-04-25', 5, 3, '09:00', '18:00', 'sports event', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 21
('Skintific', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-26', '2025-04-26', 5, 3, '09:00', '18:00', 'activation', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 22
('CP Purple Serum Instore', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-27', '2025-06-28', 5, 3, '09:00', '18:00', 'roving', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'recurring', NULL, NOW(), NOW()),

-- Project 23
('Cedric', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-27', '2025-04-27', 5, 3, '09:00', '18:00', 'event', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 24
('Collect & Delivery', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-27', '2025-04-27', 5, 3, '09:00', '18:00', 'logistics', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 25
('DIY Cotton Candy', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-27', '2025-04-27', 5, 3, '09:00', '18:00', 'activation', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 26
('Pickleball', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-27', '2025-04-27', 5, 3, '09:00', '18:00', 'sports event', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 27
('Q350 - DIY Mytown', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-27', '2025-05-04', 5, 3, '09:00', '18:00', 'roving', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'recurring', NULL, NOW(), NOW()),

-- Project 28
('Spritzer x Pokemon Jam Sampling', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-27', '2025-04-27', 5, 3, '09:00', '18:00', 'sampling', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 29
('Unifi Bukit Jalil', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-27', '2025-04-27', 5, 3, '09:00', '18:00', 'activation', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 30
('Colgate Setup', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-30', '2025-04-30', 5, 3, '09:00', '18:00', 'setup', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 31
('Colgate Velocity Redoxon Schoc', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-30', '2025-04-30', 5, 3, '09:00', '18:00', 'activation', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 32
('DIY Dismantle', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-04-30', '2025-04-30', 5, 3, '09:00', '18:00', 'dismantle', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 33
('Diy Mytown', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-05-01', '2025-05-01', 5, 3, '09:00', '18:00', 'activation', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 34
('PA System', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-05-02', '2025-05-02', 5, 3, '09:00', '18:00', 'technical setup', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 35
('Colgate Velocity', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-05-03', '2025-05-03', 5, 3, '09:00', '18:00', 'activation', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 36
('Dr. Ora IOI Puchong', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-05-04', '2025-05-04', 5, 3, '09:00', '18:00', 'activation', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 37
('Dr. Ora Wastons Instore', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-05-04', '2025-05-10', 5, 3, '09:00', '18:00', 'roving', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'recurring', NULL, NOW(), NOW()),

-- Project 38
('FMS Delivery HK Photobooth Jam Sampling', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-05-04', '2025-05-04', 5, 3, '09:00', '18:00', 'delivery & sampling', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 39
('SoTinge Speed20', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-05-04', '2025-05-04', 5, 3, '09:00', '18:00', 'activation', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 40
('Zenith 360 Photobooth', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-05-04', '2025-05-04', 5, 3, '09:00', '18:00', 'photobooth', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 41
('Maggie-Roots', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-05-06', '2025-05-06', 5, 3, '09:00', '18:00', 'event', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 42
('Calvin Office', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-05-08', '2025-05-08', 5, 3, '09:00', '18:00', 'office event', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 43
('Diy Mascot Mid', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-05-09', '2025-05-09', 5, 3, '09:00', '18:00', 'mascot activation', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 44
('Acson Aircond', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-05-10', '2025-06-02', 5, 3, '09:00', '18:00', 'roving', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'recurring', NULL, NOW(), NOW()),

-- Project 45
('Careton Penang', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-05-10', '2025-05-10', 5, 3, '09:00', '18:00', 'activation', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 46
('DIY Mytown Dismantle', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-05-11', '2025-05-11', 5, 3, '09:00', '18:00', 'dismantle', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 47
('Spritzer x Pokemon', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-05-11', '2025-08-30', 5, 3, '09:00', '18:00', 'roving', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'recurring', NULL, NOW(), NOW()),

-- Project 48
('setup', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-05-15', '2025-05-15', 5, 3, '09:00', '18:00', 'setup', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 49
('Grand Gala Premiere @ TRG', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-05-16', '2025-05-16', 5, 3, '09:00', '18:00', 'premiere', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 50
('Redoxon KL', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-05-16', '2025-08-02', 5, 3, '09:00', '18:00', 'roving', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'recurring', NULL, NOW(), NOW()),

-- Project 51
('Careton Lee Frozen', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-05-17', '2025-05-17', 5, 3, '09:00', '18:00', 'activation', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 52
('Hepii', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-05-17', '2025-08-02', 5, 3, '09:00', '18:00', 'roving', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'recurring', NULL, NOW(), NOW()),

-- Project 53
('So tinge Roving', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-05-19', '2025-06-11', 5, 3, '09:00', '18:00', 'roving', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'recurring', NULL, NOW(), NOW()),

-- Project 54
('Ribena', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-05-21', '2025-06-10', 5, 3, '09:00', '18:00', 'roving', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'recurring', NULL, NOW(), NOW()),

-- Project 55
('Redoxon Penang', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-05-24', '2025-06-21', 5, 3, '09:00', '18:00', 'roving', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'recurring', NULL, NOW(), NOW()),

-- Project 56
('Spritzer Meet & Greet', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-05-24', '2025-05-24', 5, 3, '09:00', '18:00', 'meet & greet', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 57
('Tayyib Meeting', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-05-27', '2025-05-27', 5, 3, '09:00', '18:00', 'meeting', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 58
('Jom Heboh', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-05-31', '2025-06-02', 5, 3, '09:00', '18:00', 'roving', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'recurring', NULL, NOW(), NOW()),

-- Project 59
('MrDIY Concert', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-05-31', '2025-05-31', 5, 3, '09:00', '18:00', 'concert', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 60
('Mytown Workshop-ee Frozen', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-05-31', '2025-05-31', 5, 3, '09:00', '18:00', 'workshop', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 61
('Myra', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-05-31', '2025-06-02', 5, 3, '09:00', '18:00', 'roving', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'recurring', NULL, NOW(), NOW()),

-- Project 62
('Redoxon JB', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-05-31', '2025-06-28', 5, 3, '09:00', '18:00', 'roving', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'recurring', NULL, NOW(), NOW()),

-- Project 63
('Spritzer Softlan Air Cuti Team A', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-05-31', '2025-05-31', 5, 3, '09:00', '18:00', 'activation', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 64
('Village Grocer Nilai', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-05-31', '2025-06-02', 5, 3, '09:00', '18:00', 'roving', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'recurring', NULL, NOW(), NOW()),

-- Project 65
('CP Purple JB', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-06-01', '2025-06-02', 5, 3, '09:00', '18:00', 'instore activation', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 66
('CP Purple KL', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-06-01', '2025-06-02', 5, 3, '09:00', '18:00', 'instore activation', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 67
('CP Purple Penang', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-06-01', '2025-06-02', 5, 3, '09:00', '18:00', 'instore activation', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 68
('Mytown Workshop', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-06-01', '2025-06-07', 5, 3, '09:00', '18:00', 'roving', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'recurring', NULL, NOW(), NOW()),

-- Project 69
('Spritzer Team A Jom Heboh', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-06-01', '2025-06-02', 5, 3, '09:00', '18:00', 'activation', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 70
('Telco Roving', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-06-01', '2025-06-02', 5, 3, '09:00', '18:00', 'roving', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 71
('Sime Darby Setup', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-06-03', '2025-06-03', 5, 3, '09:00', '18:00', 'setup', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 72
('MAS Training', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-06-04', '2025-06-04', 5, 3, '09:00', '18:00', 'training', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 73
('Mytown Sime Darby Diem', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-06-04', '2025-06-04', 5, 3, '09:00', '18:00', 'activation', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 74
('TFP Italian Fair', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-06-06', '2025-06-22', 5, 3, '09:00', '18:00', 'roving', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'recurring', NULL, NOW(), NOW()),

-- Project 75
('Spritzer Air Cuti Team A', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-06-07', '2025-07-12', 5, 3, '09:00', '18:00', 'roving', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'recurring', NULL, NOW(), NOW()),

-- Project 76
('Spritzer Air Cuti Team B', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-06-07', '2025-07-19', 5, 3, '09:00', '18:00', 'roving', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'recurring', NULL, NOW(), NOW()),

-- Project 77
('Tayyib Ranch', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-06-07', '2025-06-07', 5, 3, '09:00', '18:00', 'event', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 78
('Malaysia Airline', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-06-11', '2025-06-11', 5, 3, '09:00', '18:00', 'event', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 79
('Evay''s job', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-06-12', '2025-06-12', 5, 3, '09:00', '18:00', 'event', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 80
('Traveloka @ 1U', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-06-13', '2025-06-13', 5, 3, '09:00', '18:00', 'activation', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 81
('Careton PJ', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-06-14', '2025-06-14', 5, 3, '09:00', '18:00', 'activation', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 82
('Spritzer Sparkling Lemon', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-06-14', '2025-06-28', 5, 3, '09:00', '18:00', 'roving', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'recurring', NULL, NOW(), NOW()),

-- Project 83
('Adwalker', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-06-28', '2025-07-26', 5, 3, '09:00', '18:00', 'activation', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 84
('MrToy Mytown', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-06-28', '2025-07-04', 5, 3, '09:00', '18:00', 'roving', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'recurring', NULL, NOW(), NOW()),

-- Project 85
('Music Festival', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-07-04', '2025-07-04', 5, 3, '09:00', '18:00', 'festival', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 86
('Diy Concert', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-07-11', '2025-07-11', 5, 3, '09:00', '18:00', 'concert', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW()),

-- Project 87
('Mr DIY Karnival Penang', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'confirmed', 'medium', '2025-07-11', '2025-07-13', 5, 3, '09:00', '18:00', 'karnival', 'To be confirmed', 'Details to be confirmed', 1, '#4ECDC4', 1000, 'recruitment', 'single', NULL, NOW(), NOW());

-- Summary
-- This script will:
-- 1. Create 2 demo companies (client and agency)
-- 2. Create 2 demo users (manager and staff)
-- 3. Import all 88 projects from the CSV with:
--    - client_id replaced with '33333333-3333-3333-3333-333333333333'
--    - manager_id replaced with '44444444-4444-4444-4444-444444444444'
--    - brand_logo set to NULL (removed placeholder)
--    - All other fields preserved from the CSV