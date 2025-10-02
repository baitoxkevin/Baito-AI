-- ==========================================
-- AI Chatbot Schema Migration
-- Version: 1.0.0
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
-- 4. USER PREFERENCES TABLE (Learning)
-- ==========================================

CREATE TABLE IF NOT EXISTS ai_user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  parameters JSONB DEFAULT '{}'::jsonb,
  satisfaction_score INTEGER CHECK (satisfaction_score BETWEEN 1 AND 5),
  frequency INTEGER DEFAULT 1,
  last_used TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_action UNIQUE(user_id, action_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_user_preferences_user_id ON ai_user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_user_preferences_satisfaction ON ai_user_preferences(satisfaction_score DESC);
CREATE INDEX IF NOT EXISTS idx_ai_user_preferences_frequency ON ai_user_preferences(frequency DESC);

-- Comments
COMMENT ON TABLE ai_user_preferences IS 'Stores user preferences and patterns for AI learning';
COMMENT ON COLUMN ai_user_preferences.satisfaction_score IS 'User rating 1-5 for this action';
COMMENT ON COLUMN ai_user_preferences.frequency IS 'How many times user performed this action';

-- ==========================================
-- 5. SECURITY EVENTS TABLE (Monitoring)
-- ==========================================

CREATE TABLE IF NOT EXISTS ai_security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_security_events_user_id ON ai_security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_security_events_severity ON ai_security_events(severity);
CREATE INDEX IF NOT EXISTS idx_ai_security_events_created_at ON ai_security_events(created_at DESC);

-- Comments
COMMENT ON TABLE ai_security_events IS 'Security monitoring and unauthorized access attempts';
COMMENT ON COLUMN ai_security_events.event_type IS 'unauthorized_access, permission_denied, rate_limit_exceeded, etc.';

-- ==========================================
-- 6. FUNCTIONS
-- ==========================================

-- Function: Search conversation history using semantic similarity (Layer 3 memory)
CREATE OR REPLACE FUNCTION search_conversation_history(
  query_embedding vector(1536),
  p_conversation_id uuid,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  message_id uuid,
  content text,
  similarity float,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    id,
    content,
    1 - (embedding <=> query_embedding) as similarity,
    created_at
  FROM ai_messages
  WHERE
    conversation_id = p_conversation_id
    AND embedding IS NOT NULL
    AND 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION search_conversation_history IS 'Semantic search of conversation history using pgvector';

-- Function: Get conversation context (combines all 3 memory layers)
CREATE OR REPLACE FUNCTION get_conversation_context(
  p_conversation_id uuid,
  p_query_embedding vector(1536) DEFAULT NULL,
  working_memory_limit int DEFAULT 10,
  semantic_memory_limit int DEFAULT 5
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_working_memory JSONB;
  v_session_summary TEXT;
  v_semantic_memory JSONB;
BEGIN
  -- Layer 1: Working memory (last N messages)
  SELECT jsonb_agg(
    jsonb_build_object(
      'type', type,
      'content', content,
      'created_at', created_at
    ) ORDER BY created_at DESC
  )
  INTO v_working_memory
  FROM (
    SELECT type, content, created_at
    FROM ai_messages
    WHERE conversation_id = p_conversation_id
    ORDER BY created_at DESC
    LIMIT working_memory_limit
  ) recent;

  -- Layer 2: Session summary
  SELECT session_summary
  INTO v_session_summary
  FROM ai_conversations
  WHERE id = p_conversation_id;

  -- Layer 3: Semantic memory (if query embedding provided)
  IF p_query_embedding IS NOT NULL THEN
    SELECT jsonb_agg(
      jsonb_build_object(
        'content', content,
        'similarity', similarity,
        'created_at', created_at
      )
    )
    INTO v_semantic_memory
    FROM search_conversation_history(
      p_query_embedding,
      p_conversation_id,
      0.7,
      semantic_memory_limit
    );
  ELSE
    v_semantic_memory := '[]'::jsonb;
  END IF;

  -- Combine all layers
  v_result := jsonb_build_object(
    'working_memory', COALESCE(v_working_memory, '[]'::jsonb),
    'session_summary', COALESCE(v_session_summary, ''),
    'semantic_memory', COALESCE(v_semantic_memory, '[]'::jsonb)
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_conversation_context IS 'Returns complete conversation context (3-layer memory)';

-- Function: Update conversation activity timestamp
CREATE OR REPLACE FUNCTION update_conversation_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ai_conversations
  SET last_activity = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update conversation activity on new message
DROP TRIGGER IF EXISTS trigger_update_conversation_activity ON ai_messages;
CREATE TRIGGER trigger_update_conversation_activity
  AFTER INSERT ON ai_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_activity();

-- Function: Log security event
CREATE OR REPLACE FUNCTION log_security_event(
  p_user_id uuid,
  p_event_type text,
  p_severity text,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
  v_event_id uuid;
BEGIN
  INSERT INTO ai_security_events (user_id, event_type, severity, details)
  VALUES (p_user_id, p_event_type, p_severity, p_details)
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION log_security_event IS 'Helper function to log security events';

-- ==========================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_security_events ENABLE ROW LEVEL SECURITY;

-- ============ AI CONVERSATIONS RLS ============

-- Users see only their own conversations
CREATE POLICY "Users view own conversations"
ON ai_conversations FOR SELECT
USING (auth.uid() = user_id);

-- Admins see all conversations
CREATE POLICY "Admins view all conversations"
ON ai_conversations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role IN ('admin', 'super_admin')
  )
);

-- Users create their own conversations
CREATE POLICY "Users create own conversations"
ON ai_conversations FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users update their own conversations
CREATE POLICY "Users update own conversations"
ON ai_conversations FOR UPDATE
USING (auth.uid() = user_id);

-- ============ AI MESSAGES RLS ============

-- Users view messages in their conversations
CREATE POLICY "Users view messages in own conversations"
ON ai_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM ai_conversations
    WHERE ai_conversations.id = ai_messages.conversation_id
    AND ai_conversations.user_id = auth.uid()
  )
);

-- Users insert messages in their conversations
CREATE POLICY "Users insert messages in own conversations"
ON ai_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM ai_conversations
    WHERE ai_conversations.id = conversation_id
    AND ai_conversations.user_id = auth.uid()
  )
);

-- Admins see all messages
CREATE POLICY "Admins view all messages"
ON ai_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role IN ('admin', 'super_admin')
  )
);

-- ============ AI ACTION LOGS RLS ============

-- Users view their own actions
CREATE POLICY "Users view own actions"
ON ai_action_logs FOR SELECT
USING (auth.uid() = user_id);

-- Finance views payment-related actions
CREATE POLICY "Finance views payment actions"
ON ai_action_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'finance'
  )
  AND action_type IN (
    'create_payment',
    'approve_payment',
    'process_payment',
    'create_expense_claim',
    'approve_expense_claim'
  )
);

-- Admins view all actions
CREATE POLICY "Admins view all actions"
ON ai_action_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role IN ('admin', 'super_admin')
  )
);

-- System can insert action logs (from Edge Functions)
CREATE POLICY "System inserts action logs"
ON ai_action_logs FOR INSERT
WITH CHECK (true); -- Edge Functions run as service role

-- ============ USER PREFERENCES RLS ============

-- Users see and manage their own preferences
CREATE POLICY "Users manage own preferences"
ON ai_user_preferences FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============ SECURITY EVENTS RLS ============

-- Only admins can view security events
CREATE POLICY "Admins view security events"
ON ai_security_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role IN ('admin', 'super_admin')
  )
);

-- System can insert security events (from Edge Functions)
CREATE POLICY "System inserts security events"
ON ai_security_events FOR INSERT
WITH CHECK (true); -- Edge Functions run as service role

-- ==========================================
-- 8. INITIAL DATA / SEED
-- ==========================================

-- No seed data needed - tables are empty on creation

-- ==========================================
-- MIGRATION COMPLETE
-- ==========================================

COMMENT ON SCHEMA public IS 'AI Chatbot schema migration completed successfully';
