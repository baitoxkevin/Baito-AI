-- ==========================================
-- AI Chatbot Schema Migration (Simplified)
-- Version: 1.0.1
-- Date: October 3, 2025
-- Description: Creates tables and functions for AI chatbot with agentic capabilities
-- ==========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. AI CONVERSATIONS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  session_summary TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_session_per_user UNIQUE(user_id, session_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_session_id ON ai_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_last_activity ON ai_conversations(last_activity DESC);

-- Comments
COMMENT ON TABLE ai_conversations IS 'Stores AI chat conversation sessions with context summary';
COMMENT ON COLUMN ai_conversations.session_summary IS 'Auto-generated summary of conversation (Layer 2 memory)';
COMMENT ON COLUMN ai_conversations.metadata IS 'Additional context like user preferences, last topic, etc.';

-- ==========================================
-- 2. AI MESSAGES TABLE (with pgvector embeddings)
-- ==========================================

CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('user', 'assistant', 'system', 'tool', 'error')),
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance and semantic search
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created_at ON ai_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_messages_type ON ai_messages(type);

-- HNSW index for fast vector similarity search (Layer 3 memory)
CREATE INDEX IF NOT EXISTS ai_messages_embedding_idx ON ai_messages
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Comments
COMMENT ON TABLE ai_messages IS 'Stores all AI chat messages with embeddings for semantic search';
COMMENT ON COLUMN ai_messages.embedding IS 'Vector embedding for semantic similarity search (Layer 3 memory)';
COMMENT ON COLUMN ai_messages.metadata IS 'Tool calls, function results, confidence scores, etc.';

-- ==========================================
-- 3. AI ACTION LOGS TABLE (Audit trail)
-- ==========================================

CREATE TABLE IF NOT EXISTS ai_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  parameters JSONB DEFAULT '{}'::jsonb,
  result JSONB DEFAULT '{}'::jsonb,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for querying and auditing
CREATE INDEX IF NOT EXISTS idx_ai_action_logs_user_id ON ai_action_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_action_logs_action_type ON ai_action_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_ai_action_logs_executed_at ON ai_action_logs(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_action_logs_success ON ai_action_logs(success);

-- Comments
COMMENT ON TABLE ai_action_logs IS 'Audit trail of all actions executed by AI agent';
COMMENT ON COLUMN ai_action_logs.action_type IS 'Type of action: query_projects, create_project, update_candidate, etc.';
COMMENT ON COLUMN ai_action_logs.entity_type IS 'Database entity affected: project, candidate, payment, etc.';
COMMENT ON COLUMN ai_action_logs.parameters IS 'Input parameters passed to the action';
COMMENT ON COLUMN ai_action_logs.result IS 'Result data returned by the action';

-- ==========================================
-- 4. SEMANTIC SEARCH FUNCTION
-- ==========================================

CREATE OR REPLACE FUNCTION search_conversation_history(
  query_embedding vector(1536),
  p_conversation_id uuid,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  message_id uuid,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    id,
    content,
    1 - (embedding <=> query_embedding) as similarity
  FROM ai_messages
  WHERE conversation_id = p_conversation_id
    AND embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION search_conversation_history IS 'Semantic search across conversation history using vector embeddings';

-- ==========================================
-- 5. AUTO-UPDATE TRIGGERS
-- ==========================================

-- Update conversation last_activity when messages are added
CREATE OR REPLACE FUNCTION update_conversation_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ai_conversations
  SET last_activity = NEW.created_at
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_activity
AFTER INSERT ON ai_messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_activity();

-- Mark conversations for summarization every 20 messages
CREATE OR REPLACE FUNCTION check_conversation_summarization()
RETURNS TRIGGER AS $$
DECLARE
  message_count INT;
BEGIN
  -- Count messages in this conversation
  SELECT COUNT(*) INTO message_count
  FROM ai_messages
  WHERE conversation_id = NEW.conversation_id;

  -- Every 20 messages, update metadata to trigger summarization
  IF message_count % 20 = 0 THEN
    UPDATE ai_conversations
    SET metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{needs_summary}',
      'true'
    )
    WHERE id = NEW.conversation_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_summarization
AFTER INSERT ON ai_messages
FOR EACH ROW
EXECUTE FUNCTION check_conversation_summarization();

-- ==========================================
-- 6. UTILITY FUNCTIONS
-- ==========================================

-- Get conversation statistics
CREATE OR REPLACE FUNCTION get_conversation_stats(p_conversation_id uuid)
RETURNS TABLE (
  total_messages INT,
  user_messages INT,
  assistant_messages INT,
  tool_calls INT,
  avg_response_time_seconds FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INT as total_messages,
    COUNT(*) FILTER (WHERE type = 'user')::INT as user_messages,
    COUNT(*) FILTER (WHERE type = 'assistant')::INT as assistant_messages,
    COUNT(*) FILTER (WHERE type = 'tool')::INT as tool_calls,
    AVG(
      EXTRACT(EPOCH FROM (created_at - LAG(created_at) OVER (ORDER BY created_at)))
    )::FLOAT as avg_response_time_seconds
  FROM ai_messages
  WHERE conversation_id = p_conversation_id;
END;
$$;

-- Get user AI usage statistics
CREATE OR REPLACE FUNCTION get_user_ai_stats(p_user_id uuid)
RETURNS TABLE (
  total_conversations INT,
  active_conversations INT,
  total_messages INT,
  total_actions INT,
  successful_actions INT,
  last_conversation_date TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::INT FROM ai_conversations WHERE user_id = p_user_id),
    (SELECT COUNT(*)::INT FROM ai_conversations WHERE user_id = p_user_id AND ended_at IS NULL),
    (SELECT COUNT(*)::INT FROM ai_messages m
     JOIN ai_conversations c ON m.conversation_id = c.id
     WHERE c.user_id = p_user_id),
    (SELECT COUNT(*)::INT FROM ai_action_logs WHERE user_id = p_user_id),
    (SELECT COUNT(*)::INT FROM ai_action_logs WHERE user_id = p_user_id AND success = true),
    (SELECT MAX(last_activity) FROM ai_conversations WHERE user_id = p_user_id);
END;
$$;

-- ==========================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all AI tables
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_action_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Users view own conversations" ON ai_conversations;
DROP POLICY IF EXISTS "Users create own conversations" ON ai_conversations;
DROP POLICY IF EXISTS "Users update own conversations" ON ai_conversations;
DROP POLICY IF EXISTS "Users view own messages" ON ai_messages;
DROP POLICY IF EXISTS "Users insert own messages" ON ai_messages;
DROP POLICY IF EXISTS "Users view own action logs" ON ai_action_logs;
DROP POLICY IF EXISTS "Users insert own action logs" ON ai_action_logs;

-- ==========================================
-- POLICIES: ai_conversations
-- ==========================================

-- Users can view their own conversations
CREATE POLICY "Users view own conversations"
ON ai_conversations FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own conversations
CREATE POLICY "Users create own conversations"
ON ai_conversations FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own conversations
CREATE POLICY "Users update own conversations"
ON ai_conversations FOR UPDATE
USING (auth.uid() = user_id);

-- ==========================================
-- POLICIES: ai_messages
-- ==========================================

-- Users can view messages from their own conversations
CREATE POLICY "Users view own messages"
ON ai_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM ai_conversations
    WHERE ai_conversations.id = ai_messages.conversation_id
    AND ai_conversations.user_id = auth.uid()
  )
);

-- Users can insert messages into their own conversations
CREATE POLICY "Users insert own messages"
ON ai_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM ai_conversations
    WHERE ai_conversations.id = ai_messages.conversation_id
    AND ai_conversations.user_id = auth.uid()
  )
);

-- ==========================================
-- POLICIES: ai_action_logs
-- ==========================================

-- Users can view their own action logs
CREATE POLICY "Users view own action logs"
ON ai_action_logs FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own action logs
CREATE POLICY "Users insert own action logs"
ON ai_action_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- END OF MIGRATION
-- ==========================================
