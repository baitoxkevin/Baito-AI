-- ============================================
-- AI Enhancement Tables Migration
-- Supports: Rate Limiting, Tool Analytics, Personas, Caching
-- ============================================

-- Add persona column to ai_conversations if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_conversations' AND column_name = 'persona'
  ) THEN
    ALTER TABLE ai_conversations ADD COLUMN persona TEXT DEFAULT 'general';
  END IF;
END $$;

-- Add metadata column to ai_messages if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_messages' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE ai_messages ADD COLUMN metadata JSONB;
  END IF;
END $$;

-- ============================================
-- Tool Analytics Table
-- Tracks tool usage for insights and optimization
-- ============================================
CREATE TABLE IF NOT EXISTS ai_tool_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  execution_time_ms INTEGER NOT NULL,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  parameters JSONB,
  result_size INTEGER, -- Size of result in bytes
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying analytics
CREATE INDEX IF NOT EXISTS idx_ai_tool_analytics_user_id ON ai_tool_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_tool_analytics_tool_name ON ai_tool_analytics(tool_name);
CREATE INDEX IF NOT EXISTS idx_ai_tool_analytics_created_at ON ai_tool_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_tool_analytics_success ON ai_tool_analytics(success);

-- ============================================
-- Rate Limits Table
-- Tracks user request rates for throttling
-- ============================================
CREATE TABLE IF NOT EXISTS ai_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  request_count_minute INTEGER NOT NULL DEFAULT 0,
  request_count_hour INTEGER NOT NULL DEFAULT 0,
  request_count_day INTEGER NOT NULL DEFAULT 0,
  tokens_used_day INTEGER NOT NULL DEFAULT 0,
  last_request_at TIMESTAMPTZ,
  minute_window_start TIMESTAMPTZ,
  hour_window_start TIMESTAMPTZ,
  day_window_start TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================
-- Query Cache Table
-- Caches frequent query results
-- ============================================
CREATE TABLE IF NOT EXISTS ai_query_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  tool_name TEXT NOT NULL,
  parameters_hash TEXT NOT NULL,
  result JSONB NOT NULL,
  hit_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for cache lookups
CREATE INDEX IF NOT EXISTS idx_ai_query_cache_key ON ai_query_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_query_cache_expires ON ai_query_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_query_cache_tool ON ai_query_cache(tool_name);

-- ============================================
-- Agent Sessions Table
-- Tracks conversation sessions with personas
-- ============================================
CREATE TABLE IF NOT EXISTS ai_agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
  persona TEXT NOT NULL DEFAULT 'general',
  model_used TEXT,
  total_tokens_used INTEGER DEFAULT 0,
  total_tool_calls INTEGER DEFAULT 0,
  total_iterations INTEGER DEFAULT 0,
  total_time_ms INTEGER DEFAULT 0,
  feedback_rating INTEGER, -- 1-5 user rating
  feedback_text TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for session queries
CREATE INDEX IF NOT EXISTS idx_ai_agent_sessions_user ON ai_agent_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_sessions_persona ON ai_agent_sessions(persona);
CREATE INDEX IF NOT EXISTS idx_ai_agent_sessions_started ON ai_agent_sessions(started_at DESC);

-- ============================================
-- Insights Cache Table
-- Pre-computed insights for quick access
-- ============================================
CREATE TABLE IF NOT EXISTS ai_insights_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL, -- 'project_summary', 'staffing_alerts', 'upcoming_deadlines'
  insight_data JSONB NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, insight_type)
);

-- Index for insight lookups
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_type ON ai_insights_cache(user_id, insight_type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_valid ON ai_insights_cache(valid_until);

-- ============================================
-- External Integrations Table (P2)
-- Stores integration configs for WhatsApp, Calendar, etc.
-- ============================================
CREATE TABLE IF NOT EXISTS ai_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL, -- 'whatsapp', 'google_calendar', 'slack'
  config JSONB NOT NULL DEFAULT '{}',
  credentials JSONB, -- Encrypted credentials
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending', -- 'pending', 'success', 'failed'
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, integration_type)
);

-- ============================================
-- RLS Policies
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE ai_tool_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_query_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_integrations ENABLE ROW LEVEL SECURITY;

-- Tool Analytics: Users can view their own analytics
CREATE POLICY "Users can view own tool analytics" ON ai_tool_analytics
  FOR SELECT USING (auth.uid() = user_id);

-- Rate Limits: Users can view own rate limits
CREATE POLICY "Users can view own rate limits" ON ai_rate_limits
  FOR SELECT USING (auth.uid() = user_id);

-- Query Cache: Service role only (no user access needed)
CREATE POLICY "Service role can manage cache" ON ai_query_cache
  FOR ALL USING (true);

-- Agent Sessions: Users can view own sessions
CREATE POLICY "Users can view own sessions" ON ai_agent_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON ai_agent_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Insights Cache: Users can view own insights
CREATE POLICY "Users can view own insights" ON ai_insights_cache
  FOR SELECT USING (auth.uid() = user_id);

-- Integrations: Users can manage own integrations
CREATE POLICY "Users can manage own integrations" ON ai_integrations
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- Helper Functions
-- ============================================

-- Function to increment filled_positions (if not exists)
CREATE OR REPLACE FUNCTION increment_filled_positions(project_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE projects
  SET filled_positions = COALESCE(filled_positions, 0) + 1,
      updated_at = NOW()
  WHERE id = project_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement filled_positions
CREATE OR REPLACE FUNCTION decrement_filled_positions(project_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE projects
  SET filled_positions = GREATEST(0, COALESCE(filled_positions, 0) - 1),
      updated_at = NOW()
  WHERE id = project_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION cleanup_ai_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM ai_query_cache WHERE expires_at < NOW();
  DELETE FROM ai_insights_cache WHERE valid_until < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get tool usage statistics
CREATE OR REPLACE FUNCTION get_ai_tool_stats(time_period INTERVAL DEFAULT '7 days')
RETURNS TABLE (
  tool_name TEXT,
  total_calls BIGINT,
  success_rate NUMERIC,
  avg_execution_time NUMERIC,
  error_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.tool_name,
    COUNT(*)::BIGINT as total_calls,
    ROUND((COUNT(*) FILTER (WHERE a.success = true)::NUMERIC / NULLIF(COUNT(*), 0) * 100), 2) as success_rate,
    ROUND(AVG(a.execution_time_ms)::NUMERIC, 2) as avg_execution_time,
    COUNT(*) FILTER (WHERE a.success = false)::BIGINT as error_count
  FROM ai_tool_analytics a
  WHERE a.created_at > NOW() - time_period
  GROUP BY a.tool_name
  ORDER BY total_calls DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Audit Log Updates
-- ============================================

-- Add AI-specific fields to audit_logs if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'model_used'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN model_used TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'tool_name'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN tool_name TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'execution_time_ms'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN execution_time_ms INTEGER;
  END IF;
END $$;

-- Grant necessary permissions to service role
GRANT ALL ON ai_tool_analytics TO service_role;
GRANT ALL ON ai_rate_limits TO service_role;
GRANT ALL ON ai_query_cache TO service_role;
GRANT ALL ON ai_agent_sessions TO service_role;
GRANT ALL ON ai_insights_cache TO service_role;
GRANT ALL ON ai_integrations TO service_role;
GRANT EXECUTE ON FUNCTION increment_filled_positions TO service_role;
GRANT EXECUTE ON FUNCTION decrement_filled_positions TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_ai_cache TO service_role;
GRANT EXECUTE ON FUNCTION get_ai_tool_stats TO service_role;
