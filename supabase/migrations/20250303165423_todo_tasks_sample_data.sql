-- Insert sample todo tasks data
-- This migration adds sample tasks for the TodoPage to use from database

-- Insert sample tasks
INSERT INTO gig_tasks (
  id, 
  title, 
  description, 
  status, 
  priority, 
  due_date, 
  assigned_to, 
  created_at,
  labels,
  estimated_hours
)
VALUES 
  (
    '0d647d1c-5a8f-4d5e-b5d0-9c5a0ab0d1a5', 
    'Design System Implementation', 
    'Implement a comprehensive design system including components, tokens, and documentation.', 
    'backlog', 
    'high', 
    CURRENT_DATE + INTERVAL '14 days', 
    (SELECT id FROM auth.users LIMIT 1 OFFSET 0), 
    CURRENT_TIMESTAMP,
    ARRAY['design', 'ui', 'components']::text[],
    20
  ),
  (
    '3fc1e2a0-b9d2-471d-a4d7-79e18e6f5c0d', 
    'User Authentication Flow', 
    'Create a secure authentication system with login, registration, and password recovery. @Ava please take a look at the security aspects.', 
    'todo', 
    'medium', 
    CURRENT_DATE + INTERVAL '10 days', 
    (SELECT id FROM auth.users LIMIT 1 OFFSET 1), 
    CURRENT_TIMESTAMP,
    ARRAY['auth', 'security']::text[],
    16
  ),
  (
    '8b96c3e7-4a5d-4b8a-9f3c-12d4e8a7b6c5', 
    'API Integration', 
    'Integrate third-party APIs and implement data synchronization features. @Crystal will handle API security.', 
    'doing', 
    'high', 
    CURRENT_DATE + INTERVAL '5 days', 
    (SELECT id FROM auth.users LIMIT 1 OFFSET 2), 
    CURRENT_TIMESTAMP,
    ARRAY['api', 'integration', 'backend']::text[],
    24
  ),
  (
    'e4f8a2c6-9d3b-4e7f-8c5a-1b2d3e4f5a6b', 
    'Database Schema Design', 
    'Design and implement the database schema for the application''s core features. @Winnie to review the schema.', 
    'done', 
    'low', 
    CURRENT_DATE - INTERVAL '3 days', 
    (SELECT id FROM auth.users LIMIT 1 OFFSET 3), 
    CURRENT_TIMESTAMP - INTERVAL '7 days',
    ARRAY['database', 'schema', 'design']::text[],
    12
  );

-- Add assigned_by and assigned_at for tasks
UPDATE gig_tasks 
SET 
  assigned_by = (SELECT id FROM auth.users LIMIT 1 OFFSET 0),
  assigned_at = CURRENT_TIMESTAMP - INTERVAL '1 day'
WHERE 
  assigned_to IS NOT NULL;