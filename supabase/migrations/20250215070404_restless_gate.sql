-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can create chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can update their own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can view messages from their sessions" ON chat_messages;
DROP POLICY IF EXISTS "Users can create messages in their sessions" ON chat_messages;

-- Create more permissive policies for development
CREATE POLICY "enable_all_chat_sessions"
  ON chat_sessions
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "enable_all_chat_messages"
  ON chat_messages
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Insert temporary user if it doesn't exist
INSERT INTO users (
  id,
  email,
  full_name,
  role
) VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'temp@example.com',
  'Temporary User',
  'client'
) ON CONFLICT (id) DO NOTHING;

-- Insert a default chat session for the temporary user
INSERT INTO chat_sessions (
  id,
  user_id,
  is_active,
  context
) VALUES (
  'a98f8a9e-5c9a-4f3d-9f9d-b6c7e2f1d8e3',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  true,
  '{}'::jsonb
) ON CONFLICT DO NOTHING;
