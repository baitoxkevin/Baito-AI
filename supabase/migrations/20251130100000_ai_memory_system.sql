-- ============================================
-- AI Memory System Migration
-- Provides long-term memory and context awareness for Baiger
-- ============================================

-- ============================================
-- 1. USER MEMORY TABLE
-- Stores important facts learned about each user
-- ============================================
CREATE TABLE IF NOT EXISTS ai_user_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL, -- 'preference', 'fact', 'context', 'instruction'
  category TEXT, -- 'communication', 'work', 'team', 'personal'
  key TEXT NOT NULL, -- e.g., 'preferred_language', 'team_size', 'main_role'
  value TEXT NOT NULL, -- The actual memory content
  confidence FLOAT DEFAULT 1.0, -- How confident we are about this memory (0-1)
  source TEXT, -- Where this memory came from: 'explicit', 'inferred', 'conversation'
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  times_used INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Optional expiry for temporary memories
  UNIQUE(user_id, key)
);

-- Indexes for efficient memory lookup
CREATE INDEX IF NOT EXISTS idx_ai_user_memories_user_id ON ai_user_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_user_memories_type ON ai_user_memories(memory_type);
CREATE INDEX IF NOT EXISTS idx_ai_user_memories_category ON ai_user_memories(category);
CREATE INDEX IF NOT EXISTS idx_ai_user_memories_key ON ai_user_memories(key);
CREATE INDEX IF NOT EXISTS idx_ai_user_memories_last_used ON ai_user_memories(last_used_at DESC);

COMMENT ON TABLE ai_user_memories IS 'Long-term memory storage for user preferences and facts';
COMMENT ON COLUMN ai_user_memories.memory_type IS 'Type: preference (user likes), fact (about user), context (work context), instruction (how to behave)';
COMMENT ON COLUMN ai_user_memories.confidence IS 'Confidence score 0-1. Lower if inferred, higher if explicitly stated';

-- ============================================
-- 2. CONVERSATION SUMMARIES TABLE
-- Stores compressed summaries of past conversations
-- ============================================
CREATE TABLE IF NOT EXISTS ai_conversation_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
  summary TEXT NOT NULL, -- Compressed summary of the conversation
  key_topics TEXT[], -- Array of main topics discussed
  action_items TEXT[], -- Any action items or tasks mentioned
  entities_mentioned JSONB DEFAULT '{}', -- Projects, candidates, etc. mentioned
  sentiment TEXT, -- 'positive', 'neutral', 'negative', 'mixed'
  message_count INTEGER,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for summary lookup
CREATE INDEX IF NOT EXISTS idx_ai_conv_summaries_user_id ON ai_conversation_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conv_summaries_topics ON ai_conversation_summaries USING GIN(key_topics);
CREATE INDEX IF NOT EXISTS idx_ai_conv_summaries_created ON ai_conversation_summaries(created_at DESC);

COMMENT ON TABLE ai_conversation_summaries IS 'Compressed summaries of past conversations for memory recall';

-- ============================================
-- 3. USER CONTEXT SNAPSHOTS TABLE
-- Stores what the user was doing when they opened chat
-- ============================================
CREATE TABLE IF NOT EXISTS ai_context_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
  current_page TEXT, -- '/projects/123', '/candidates', etc.
  page_type TEXT, -- 'project_detail', 'candidate_list', 'dashboard', etc.
  entity_type TEXT, -- 'project', 'candidate', 'payment', etc.
  entity_id UUID, -- The specific entity being viewed
  entity_data JSONB, -- Snapshot of relevant entity data
  user_action TEXT, -- What user was doing: 'viewing', 'editing', 'creating'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for context lookup
CREATE INDEX IF NOT EXISTS idx_ai_context_user_conv ON ai_context_snapshots(user_id, conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_context_created ON ai_context_snapshots(created_at DESC);

COMMENT ON TABLE ai_context_snapshots IS 'Captures user context (current page, entity) when chat starts';

-- ============================================
-- 4. HELPER FUNCTIONS
-- ============================================

-- Function to get user memories
CREATE OR REPLACE FUNCTION get_user_memories(p_user_id UUID, p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  key TEXT,
  value TEXT,
  memory_type TEXT,
  category TEXT,
  confidence FLOAT,
  times_used INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.key,
    m.value,
    m.memory_type,
    m.category,
    m.confidence,
    m.times_used
  FROM ai_user_memories m
  WHERE m.user_id = p_user_id
    AND (m.expires_at IS NULL OR m.expires_at > NOW())
  ORDER BY m.times_used DESC, m.confidence DESC, m.last_used_at DESC
  LIMIT p_limit;
END;
$$;

-- Function to upsert a user memory
CREATE OR REPLACE FUNCTION upsert_user_memory(
  p_user_id UUID,
  p_key TEXT,
  p_value TEXT,
  p_memory_type TEXT DEFAULT 'fact',
  p_category TEXT DEFAULT NULL,
  p_confidence FLOAT DEFAULT 1.0,
  p_source TEXT DEFAULT 'conversation'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  memory_id UUID;
BEGIN
  INSERT INTO ai_user_memories (user_id, key, value, memory_type, category, confidence, source)
  VALUES (p_user_id, p_key, p_value, p_memory_type, p_category, p_confidence, p_source)
  ON CONFLICT (user_id, key)
  DO UPDATE SET
    value = EXCLUDED.value,
    confidence = GREATEST(ai_user_memories.confidence, EXCLUDED.confidence),
    times_used = ai_user_memories.times_used + 1,
    last_used_at = NOW(),
    updated_at = NOW()
  RETURNING id INTO memory_id;

  RETURN memory_id;
END;
$$;

-- Function to get recent conversation summaries
CREATE OR REPLACE FUNCTION get_recent_summaries(p_user_id UUID, p_limit INTEGER DEFAULT 5)
RETURNS TABLE (
  summary TEXT,
  key_topics TEXT[],
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.summary,
    s.key_topics,
    s.created_at
  FROM ai_conversation_summaries s
  WHERE s.user_id = p_user_id
  ORDER BY s.created_at DESC
  LIMIT p_limit;
END;
$$;

-- ============================================
-- 5. RLS POLICIES
-- ============================================

ALTER TABLE ai_user_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversation_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_context_snapshots ENABLE ROW LEVEL SECURITY;

-- User memories: users can view and manage their own
CREATE POLICY "Users can manage own memories" ON ai_user_memories
  FOR ALL USING (auth.uid() = user_id);

-- Conversation summaries: users can view their own
CREATE POLICY "Users can view own summaries" ON ai_conversation_summaries
  FOR SELECT USING (auth.uid() = user_id);

-- Context snapshots: users can manage their own
CREATE POLICY "Users can manage own context" ON ai_context_snapshots
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 6. GRANTS
-- ============================================

GRANT ALL ON ai_user_memories TO service_role;
GRANT ALL ON ai_conversation_summaries TO service_role;
GRANT ALL ON ai_context_snapshots TO service_role;
GRANT EXECUTE ON FUNCTION get_user_memories TO service_role;
GRANT EXECUTE ON FUNCTION upsert_user_memory TO service_role;
GRANT EXECUTE ON FUNCTION get_recent_summaries TO service_role;
