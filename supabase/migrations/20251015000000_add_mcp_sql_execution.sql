-- ============================================
-- MCP SQL Execution Function
-- ============================================
-- Allows AI chatbot to execute SQL queries safely
-- with validation and audit logging

-- Create execute_sql function for MCP
CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  query_type TEXT;
  has_returning BOOLEAN;
BEGIN
  -- Extract query type (first word)
  query_type := UPPER(SPLIT_PART(TRIM(sql_query), ' ', 1));

  -- Block DELETE operations
  IF query_type = 'DELETE' THEN
    RAISE EXCEPTION 'DELETE operations are not allowed';
  END IF;

  -- Block DROP operations
  IF query_type = 'DROP' THEN
    RAISE EXCEPTION 'DROP operations are not allowed';
  END IF;

  -- Block TRUNCATE operations
  IF query_type = 'TRUNCATE' THEN
    RAISE EXCEPTION 'TRUNCATE operations are not allowed';
  END IF;

  -- Check if query has RETURNING clause
  has_returning := UPPER(sql_query) LIKE '%RETURNING%';

  -- Handle different query types
  IF query_type IN ('INSERT', 'UPDATE') THEN
    -- For INSERT/UPDATE with RETURNING, wrap to get JSON
    IF has_returning THEN
      EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || sql_query || ') t'
      INTO result;
      RETURN COALESCE(result, '[]'::jsonb);
    ELSE
      -- For INSERT/UPDATE without RETURNING, just execute and return success
      EXECUTE sql_query;
      RETURN jsonb_build_object(
        'success', true,
        'message', query_type || ' operation completed successfully',
        'operation', query_type
      );
    END IF;
  ELSE
    -- For SELECT and other read operations, use original approach
    EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || sql_query || ') t'
    INTO result;
    RETURN COALESCE(result, '[]'::jsonb);
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    -- Return error details
    RAISE;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION execute_sql(TEXT) TO service_role;

-- Add comment
COMMENT ON FUNCTION execute_sql IS 'Execute SQL queries for MCP AI chatbot. Blocks DELETE, DROP, and TRUNCATE operations.';

-- ============================================
-- Audit Logs Table
-- ============================================
-- Track all database operations by the chatbot

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  operation_type TEXT NOT NULL,
  sql_query TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_operation ON audit_logs(operation_type);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
  ON audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can insert audit logs
CREATE POLICY "Service role can insert audit logs"
  ON audit_logs
  FOR INSERT
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE audit_logs IS 'Audit trail of all database operations performed by AI chatbot';
COMMENT ON COLUMN audit_logs.operation_type IS 'Type of SQL operation: SELECT, INSERT, UPDATE, SQL_BLOCKED';
COMMENT ON COLUMN audit_logs.sql_query IS 'The actual SQL query that was executed or blocked';
COMMENT ON COLUMN audit_logs.success IS 'Whether the operation succeeded';
COMMENT ON COLUMN audit_logs.error_message IS 'Error message if operation failed';
