-- Sample Kanban Data Migration
-- This migration adds sample kanban data to the database

-- Insert sample kanban boards
INSERT INTO kanban_boards (id, name, description, project_id)
VALUES 
  ('bd001', 'Project Development', 'Track development tasks for the project', (SELECT id FROM projects LIMIT 1));

-- Insert sample kanban columns
INSERT INTO kanban_columns (id, name, board_id, position, color)
VALUES 
  ('col001', 'To Do', 'bd001', 0, '#E2E8F0'),
  ('col002', 'In Progress', 'bd001', 1, '#FEF3C7'),
  ('col003', 'Done', 'bd001', 2, '#DCFCE7');

-- Insert sample tasks
INSERT INTO tasks (
  id, 
  title, 
  description, 
  project_id, 
  status, 
  priority, 
  due_date, 
  position, 
  column_id, 
  board_id, 
  labels, 
  estimated_hours
)
VALUES 
  (
    'task001', 
    'Design System Setup', 
    'Set up the design system with Tailwind and component library', 
    (SELECT id FROM projects LIMIT 1), 
    'To Do', 
    'Medium', 
    CURRENT_DATE + INTERVAL '7 days', 
    0, 
    'col001', 
    'bd001', 
    ARRAY['design', 'setup']::text[], 
    8
  ),
  (
    'task002', 
    'Authentication Implementation', 
    'Implement authentication with Supabase', 
    (SELECT id FROM projects LIMIT 1), 
    'In Progress', 
    'High', 
    CURRENT_DATE + INTERVAL '3 days', 
    0, 
    'col002', 
    'bd001', 
    ARRAY['auth', 'backend']::text[], 
    12
  ),
  (
    'task003', 
    'Project Layout', 
    'Create the main project layout with navigation', 
    (SELECT id FROM projects LIMIT 1), 
    'Done', 
    'Medium', 
    CURRENT_DATE - INTERVAL '2 days', 
    0, 
    'col003', 
    'bd001', 
    ARRAY['ui', 'layout']::text[], 
    6
  ),
  (
    'task004', 
    'Database Schema Design', 
    'Design the database schema for the application', 
    (SELECT id FROM projects LIMIT 1), 
    'To Do', 
    'High', 
    CURRENT_DATE + INTERVAL '5 days', 
    1, 
    'col001', 
    'bd001', 
    ARRAY['database', 'design']::text[], 
    10
  ),
  (
    'task005', 
    'API Endpoints', 
    'Create API endpoints for projects and tasks', 
    (SELECT id FROM projects LIMIT 1), 
    'In Progress', 
    'Medium', 
    CURRENT_DATE + INTERVAL '6 days', 
    1, 
    'col002', 
    'bd001', 
    ARRAY['api', 'backend']::text[], 
    14
  );

-- Insert sample task comments
INSERT INTO task_comments (
  id,
  task_id,
  user_id,
  content,
  created_at
)
VALUES
  (
    'comment001',
    'task001',
    (SELECT id FROM auth.users LIMIT 1 OFFSET 0),
    'Let''s use shadcn/ui components for this',
    NOW() - INTERVAL '2 days'
  ),
  (
    'comment002',
    'task002',
    (SELECT id FROM auth.users LIMIT 1 OFFSET 0),
    'We should implement email and social login',
    NOW() - INTERVAL '1 day'
  ),
  (
    'comment003',
    'task003',
    (SELECT id FROM auth.users LIMIT 1 OFFSET 1),
    'Layout is complete with responsive design',
    NOW() - INTERVAL '12 hours'
  );

-- Insert sample task attachments
INSERT INTO task_attachments (
  id,
  task_id,
  file_name,
  file_url,
  file_type,
  uploaded_by,
  file_size
)
VALUES
  (
    'attachment001',
    'task001',
    'design-system-spec.pdf',
    'https://example.com/files/design-system-spec.pdf',
    'application/pdf',
    (SELECT id FROM auth.users LIMIT 1 OFFSET 0),
    1024
  ),
  (
    'attachment002',
    'task002',
    'auth-flow-diagram.png',
    'https://example.com/files/auth-flow-diagram.png',
    'image/png',
    (SELECT id FROM auth.users LIMIT 1 OFFSET 1),
    512
  );

-- Insert sample task templates
INSERT INTO task_templates (
  id,
  name,
  description,
  template_data,
  created_by
)
VALUES
  (
    'template001',
    'Bug Fix Template',
    'Template for bug fix tasks',
    jsonb_build_object(
      'title', 'Fix [Bug Name]',
      'description', 'Description of the bug and steps to reproduce it.\n\nExpected behavior:\n\nActual behavior:',
      'priority', 'Medium',
      'labels', ARRAY['bug', 'fix']::text[],
      'estimated_hours', 4
    ),
    (SELECT id FROM auth.users LIMIT 1 OFFSET 0)
  ),
  (
    'template002',
    'Feature Implementation',
    'Template for new feature implementation',
    jsonb_build_object(
      'title', 'Implement [Feature Name]',
      'description', 'Description of the feature to be implemented.\n\nRequirements:\n- Requirement 1\n- Requirement 2\n\nAcceptance Criteria:\n- Criteria 1\n- Criteria 2',
      'priority', 'High',
      'labels', ARRAY['feature', 'implementation']::text[],
      'estimated_hours', 8
    ),
    (SELECT id FROM auth.users LIMIT 1 OFFSET 0)
  );