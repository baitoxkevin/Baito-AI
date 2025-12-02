-- ============================================================================
-- Error Reporting System - Complete Database Schema
-- Version: 1.0.0
-- Purpose: Automated error tracking with screenshot support and AI processing
-- ============================================================================

-- ============================================================================
-- SECTION 1: Core Tables
-- ============================================================================

-- Error severity enum type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'error_severity') THEN
        CREATE TYPE error_severity AS ENUM ('critical', 'high', 'medium', 'low', 'info');
    END IF;
END $$;

-- Error status enum type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'error_status') THEN
        CREATE TYPE error_status AS ENUM ('new', 'acknowledged', 'in_progress', 'resolved', 'wont_fix', 'duplicate');
    END IF;
END $$;

-- Main error_reports table
CREATE TABLE IF NOT EXISTS public.error_reports (
    -- Primary identification
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_number SERIAL UNIQUE, -- Human-readable incrementing number (e.g., ERR-001)

    -- Error details
    error_message TEXT NOT NULL,
    error_stack TEXT,
    error_name TEXT, -- e.g., "TypeError", "NetworkError"
    error_code TEXT, -- Custom error codes if applicable
    component_name TEXT, -- React component or module where error occurred
    component_stack TEXT, -- React component stack trace

    -- Context information
    page_url TEXT NOT NULL,
    page_title TEXT,
    route_path TEXT, -- React Router path (e.g., /projects/:id)
    route_params JSONB DEFAULT '{}', -- Route parameters

    -- User context
    reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reporter_email TEXT,
    reporter_name TEXT,
    user_role TEXT,

    -- Browser/Device information
    user_agent TEXT,
    browser_name TEXT,
    browser_version TEXT,
    os_name TEXT,
    os_version TEXT,
    device_type TEXT, -- desktop, mobile, tablet
    screen_width INTEGER,
    screen_height INTEGER,
    viewport_width INTEGER,
    viewport_height INTEGER,

    -- Screenshot reference (stored in Supabase Storage)
    screenshot_path TEXT, -- Path in error-screenshots bucket
    screenshot_url TEXT, -- Public or signed URL
    screenshot_taken_at TIMESTAMPTZ,

    -- Additional context
    user_description TEXT, -- User's description of what they were doing
    reproduction_steps TEXT, -- Steps to reproduce
    expected_behavior TEXT,
    actual_behavior TEXT,

    -- Application state
    app_version TEXT,
    environment TEXT DEFAULT 'production', -- development, staging, production
    session_id TEXT, -- Browser session identifier
    request_id TEXT, -- If related to a specific API request

    -- Network context
    network_type TEXT, -- wifi, cellular, etc.
    is_online BOOLEAN DEFAULT true,

    -- Related entities
    related_project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    related_candidate_id UUID REFERENCES public.candidates(id) ON DELETE SET NULL,

    -- Classification (can be AI-assisted)
    category TEXT, -- e.g., "UI", "API", "Authentication", "Data"
    subcategory TEXT,
    tags TEXT[] DEFAULT '{}',

    -- Status and workflow
    status error_status DEFAULT 'new',
    severity error_severity DEFAULT 'medium',
    priority INTEGER DEFAULT 50 CHECK (priority >= 1 AND priority <= 100),

    -- Assignment
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ,

    -- Resolution
    resolution_notes TEXT,
    resolution_type TEXT, -- fixed, workaround, duplicate, wont_fix, cannot_reproduce
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    fix_commit_hash TEXT, -- Git commit reference
    fix_pr_url TEXT, -- Pull request URL

    -- AI Processing
    ai_processed BOOLEAN DEFAULT false,
    ai_processed_at TIMESTAMPTZ,
    ai_analysis JSONB DEFAULT '{}', -- AI-generated analysis
    ai_suggested_priority INTEGER,
    ai_suggested_category TEXT,
    ai_similar_errors UUID[], -- References to similar errors

    -- Deduplication
    error_hash TEXT, -- Hash for finding duplicates
    duplicate_of UUID REFERENCES public.error_reports(id) ON DELETE SET NULL,
    duplicate_count INTEGER DEFAULT 0,

    -- Timestamps
    occurred_at TIMESTAMPTZ DEFAULT now(), -- When the error actually occurred
    created_at TIMESTAMPTZ DEFAULT now(), -- When the report was created
    updated_at TIMESTAMPTZ DEFAULT now(),
    first_seen_at TIMESTAMPTZ DEFAULT now(),
    last_seen_at TIMESTAMPTZ DEFAULT now(),

    -- Soft delete
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================================================
-- SECTION 2: Supporting Tables
-- ============================================================================

-- Error report comments/notes
CREATE TABLE IF NOT EXISTS public.error_report_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    error_report_id UUID NOT NULL REFERENCES public.error_reports(id) ON DELETE CASCADE,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    author_name TEXT,
    content TEXT NOT NULL,
    comment_type TEXT DEFAULT 'comment' CHECK (comment_type IN ('comment', 'note', 'status_change', 'assignment', 'ai_analysis')),
    is_internal BOOLEAN DEFAULT false, -- Internal notes not visible to reporters
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Error report attachments (beyond screenshots)
CREATE TABLE IF NOT EXISTS public.error_report_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    error_report_id UUID NOT NULL REFERENCES public.error_reports(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Path in storage bucket
    file_size INTEGER,
    file_type TEXT, -- MIME type
    upload_type TEXT DEFAULT 'manual' CHECK (upload_type IN ('auto_screenshot', 'manual', 'console_log', 'network_log')),
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Error report status history
CREATE TABLE IF NOT EXISTS public.error_report_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    error_report_id UUID NOT NULL REFERENCES public.error_reports(id) ON DELETE CASCADE,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    changed_by_name TEXT,
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    change_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Console logs captured at error time
CREATE TABLE IF NOT EXISTS public.error_console_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    error_report_id UUID NOT NULL REFERENCES public.error_reports(id) ON DELETE CASCADE,
    log_level TEXT NOT NULL CHECK (log_level IN ('log', 'info', 'warn', 'error', 'debug')),
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    timestamp_offset INTEGER, -- Milliseconds before the error occurred
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Network requests around error time
CREATE TABLE IF NOT EXISTS public.error_network_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    error_report_id UUID NOT NULL REFERENCES public.error_reports(id) ON DELETE CASCADE,
    request_url TEXT NOT NULL,
    request_method TEXT DEFAULT 'GET',
    request_headers JSONB DEFAULT '{}',
    request_body TEXT,
    response_status INTEGER,
    response_headers JSONB DEFAULT '{}',
    response_body TEXT,
    duration_ms INTEGER,
    is_error BOOLEAN DEFAULT false,
    timestamp_offset INTEGER, -- Milliseconds before the error occurred
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- SECTION 3: Indexes for Performance
-- ============================================================================

-- Primary search and filter indexes
CREATE INDEX IF NOT EXISTS idx_error_reports_status ON public.error_reports(status);
CREATE INDEX IF NOT EXISTS idx_error_reports_severity ON public.error_reports(severity);
CREATE INDEX IF NOT EXISTS idx_error_reports_priority ON public.error_reports(priority DESC);
CREATE INDEX IF NOT EXISTS idx_error_reports_created_at ON public.error_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_reports_occurred_at ON public.error_reports(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_reports_reporter_id ON public.error_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_error_reports_assigned_to ON public.error_reports(assigned_to);
CREATE INDEX IF NOT EXISTS idx_error_reports_environment ON public.error_reports(environment);
CREATE INDEX IF NOT EXISTS idx_error_reports_category ON public.error_reports(category);
CREATE INDEX IF NOT EXISTS idx_error_reports_component_name ON public.error_reports(component_name);

-- Deduplication index
CREATE INDEX IF NOT EXISTS idx_error_reports_error_hash ON public.error_reports(error_hash);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_error_reports_message_fts ON public.error_reports
    USING gin(to_tsvector('english', error_message || ' ' || COALESCE(error_stack, '')));

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_error_reports_status_severity ON public.error_reports(status, severity);
CREATE INDEX IF NOT EXISTS idx_error_reports_status_created ON public.error_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_reports_unresolved ON public.error_reports(status, priority DESC)
    WHERE status NOT IN ('resolved', 'wont_fix', 'duplicate');

-- Related entity indexes
CREATE INDEX IF NOT EXISTS idx_error_reports_related_project ON public.error_reports(related_project_id);
CREATE INDEX IF NOT EXISTS idx_error_reports_related_candidate ON public.error_reports(related_candidate_id);

-- Supporting table indexes
CREATE INDEX IF NOT EXISTS idx_error_report_comments_report ON public.error_report_comments(error_report_id);
CREATE INDEX IF NOT EXISTS idx_error_report_attachments_report ON public.error_report_attachments(error_report_id);
CREATE INDEX IF NOT EXISTS idx_error_report_history_report ON public.error_report_history(error_report_id);
CREATE INDEX IF NOT EXISTS idx_error_console_logs_report ON public.error_console_logs(error_report_id);
CREATE INDEX IF NOT EXISTS idx_error_network_requests_report ON public.error_network_requests(error_report_id);

-- Tags GIN index for array search
CREATE INDEX IF NOT EXISTS idx_error_reports_tags ON public.error_reports USING gin(tags);

-- ============================================================================
-- SECTION 4: Functions
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_error_report_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS trigger_error_reports_updated_at ON public.error_reports;
CREATE TRIGGER trigger_error_reports_updated_at
    BEFORE UPDATE ON public.error_reports
    FOR EACH ROW
    EXECUTE FUNCTION public.update_error_report_updated_at();

-- Function to generate error hash for deduplication
CREATE OR REPLACE FUNCTION public.generate_error_hash(
    p_error_message TEXT,
    p_error_stack TEXT,
    p_component_name TEXT
) RETURNS TEXT AS $$
BEGIN
    RETURN md5(
        COALESCE(p_error_message, '') ||
        COALESCE(substring(p_error_stack from 1 for 500), '') ||
        COALESCE(p_component_name, '')
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to find duplicate errors
CREATE OR REPLACE FUNCTION public.find_duplicate_error(
    p_error_hash TEXT
) RETURNS UUID AS $$
DECLARE
    v_duplicate_id UUID;
BEGIN
    SELECT id INTO v_duplicate_id
    FROM public.error_reports
    WHERE error_hash = p_error_hash
      AND status NOT IN ('resolved', 'wont_fix')
      AND is_deleted = false
    ORDER BY created_at ASC
    LIMIT 1;

    RETURN v_duplicate_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to record status change history
CREATE OR REPLACE FUNCTION public.record_error_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.error_report_history (
            error_report_id, changed_by, field_name, old_value, new_value
        ) VALUES (
            NEW.id, NEW.assigned_to, 'status', OLD.status::text, NEW.status::text
        );
    END IF;

    IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
        INSERT INTO public.error_report_history (
            error_report_id, changed_by, field_name, old_value, new_value
        ) VALUES (
            NEW.id, NEW.assigned_to, 'assigned_to', OLD.assigned_to::text, NEW.assigned_to::text
        );
        NEW.assigned_at = now();
    END IF;

    IF OLD.severity IS DISTINCT FROM NEW.severity THEN
        INSERT INTO public.error_report_history (
            error_report_id, changed_by, field_name, old_value, new_value
        ) VALUES (
            NEW.id, NEW.assigned_to, 'severity', OLD.severity::text, NEW.severity::text
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for recording status changes
DROP TRIGGER IF EXISTS trigger_error_status_change ON public.error_reports;
CREATE TRIGGER trigger_error_status_change
    BEFORE UPDATE ON public.error_reports
    FOR EACH ROW
    EXECUTE FUNCTION public.record_error_status_change();

-- Function to increment duplicate count
CREATE OR REPLACE FUNCTION public.increment_duplicate_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.duplicate_of IS NOT NULL THEN
        UPDATE public.error_reports
        SET duplicate_count = duplicate_count + 1,
            last_seen_at = now()
        WHERE id = NEW.duplicate_of;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for duplicate count
DROP TRIGGER IF EXISTS trigger_increment_duplicate ON public.error_reports;
CREATE TRIGGER trigger_increment_duplicate
    AFTER INSERT ON public.error_reports
    FOR EACH ROW
    WHEN (NEW.duplicate_of IS NOT NULL)
    EXECUTE FUNCTION public.increment_duplicate_count();

-- Function to get error statistics
CREATE OR REPLACE FUNCTION public.get_error_statistics(
    p_start_date TIMESTAMPTZ DEFAULT now() - INTERVAL '30 days',
    p_end_date TIMESTAMPTZ DEFAULT now()
)
RETURNS TABLE (
    total_errors BIGINT,
    new_errors BIGINT,
    resolved_errors BIGINT,
    critical_errors BIGINT,
    avg_resolution_time_hours NUMERIC,
    top_components JSONB,
    errors_by_status JSONB,
    errors_by_severity JSONB,
    errors_by_day JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT * FROM public.error_reports
        WHERE created_at BETWEEN p_start_date AND p_end_date
          AND is_deleted = false
    )
    SELECT
        COUNT(*)::BIGINT as total_errors,
        COUNT(*) FILTER (WHERE status = 'new')::BIGINT as new_errors,
        COUNT(*) FILTER (WHERE status = 'resolved')::BIGINT as resolved_errors,
        COUNT(*) FILTER (WHERE severity = 'critical')::BIGINT as critical_errors,
        ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) FILTER (WHERE resolved_at IS NOT NULL), 2) as avg_resolution_time_hours,
        (
            SELECT jsonb_agg(jsonb_build_object('component', component_name, 'count', cnt))
            FROM (
                SELECT component_name, COUNT(*) as cnt
                FROM stats
                WHERE component_name IS NOT NULL
                GROUP BY component_name
                ORDER BY cnt DESC
                LIMIT 10
            ) top_comp
        ) as top_components,
        jsonb_object_agg(COALESCE(status::text, 'unknown'), status_count) as errors_by_status,
        jsonb_object_agg(COALESCE(severity::text, 'unknown'), sev_count) as errors_by_severity,
        (
            SELECT jsonb_agg(jsonb_build_object('date', day, 'count', day_count))
            FROM (
                SELECT DATE(created_at) as day, COUNT(*) as day_count
                FROM stats
                GROUP BY DATE(created_at)
                ORDER BY day
            ) by_day
        ) as errors_by_day
    FROM (
        SELECT status, COUNT(*) as status_count FROM stats GROUP BY status
    ) s
    CROSS JOIN (
        SELECT severity, COUNT(*) as sev_count FROM stats GROUP BY severity
    ) sv;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function for MCP/Claude Code to query errors
CREATE OR REPLACE FUNCTION public.query_error_reports(
    p_status error_status DEFAULT NULL,
    p_severity error_severity DEFAULT NULL,
    p_component TEXT DEFAULT NULL,
    p_search TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0,
    p_order_by TEXT DEFAULT 'created_at',
    p_order_dir TEXT DEFAULT 'DESC'
)
RETURNS TABLE (
    id UUID,
    report_number INTEGER,
    error_message TEXT,
    error_name TEXT,
    component_name TEXT,
    page_url TEXT,
    status error_status,
    severity error_severity,
    priority INTEGER,
    reporter_email TEXT,
    reporter_name TEXT,
    assigned_to UUID,
    category TEXT,
    tags TEXT[],
    screenshot_url TEXT,
    ai_analysis JSONB,
    duplicate_count INTEGER,
    created_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        er.id,
        er.report_number,
        er.error_message,
        er.error_name,
        er.component_name,
        er.page_url,
        er.status,
        er.severity,
        er.priority,
        er.reporter_email,
        er.reporter_name,
        er.assigned_to,
        er.category,
        er.tags,
        er.screenshot_url,
        er.ai_analysis,
        er.duplicate_count,
        er.created_at,
        er.resolved_at
    FROM public.error_reports er
    WHERE er.is_deleted = false
      AND (p_status IS NULL OR er.status = p_status)
      AND (p_severity IS NULL OR er.severity = p_severity)
      AND (p_component IS NULL OR er.component_name ILIKE '%' || p_component || '%')
      AND (p_search IS NULL OR
           er.error_message ILIKE '%' || p_search || '%' OR
           er.error_stack ILIKE '%' || p_search || '%')
    ORDER BY
        CASE WHEN p_order_by = 'created_at' AND p_order_dir = 'DESC' THEN er.created_at END DESC,
        CASE WHEN p_order_by = 'created_at' AND p_order_dir = 'ASC' THEN er.created_at END ASC,
        CASE WHEN p_order_by = 'priority' AND p_order_dir = 'DESC' THEN er.priority END DESC,
        CASE WHEN p_order_by = 'priority' AND p_order_dir = 'ASC' THEN er.priority END ASC,
        CASE WHEN p_order_by = 'severity' AND p_order_dir = 'DESC' THEN er.severity END DESC,
        er.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to update error status (for MCP/Claude Code)
CREATE OR REPLACE FUNCTION public.update_error_status(
    p_error_id UUID,
    p_status error_status,
    p_resolution_notes TEXT DEFAULT NULL,
    p_resolver_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    UPDATE public.error_reports
    SET
        status = p_status,
        resolution_notes = COALESCE(p_resolution_notes, resolution_notes),
        resolved_by = CASE WHEN p_status = 'resolved' THEN COALESCE(p_resolver_id, resolved_by) ELSE resolved_by END,
        resolved_at = CASE WHEN p_status = 'resolved' THEN now() ELSE resolved_at END
    WHERE id = p_error_id
    RETURNING jsonb_build_object(
        'success', true,
        'id', id,
        'report_number', report_number,
        'status', status,
        'resolved_at', resolved_at
    ) INTO v_result;

    IF v_result IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Error report not found');
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 5: Views
-- ============================================================================

-- View for error reports with enriched data
CREATE OR REPLACE VIEW public.error_reports_enriched AS
SELECT
    er.*,
    'ERR-' || LPAD(er.report_number::TEXT, 5, '0') as display_id,
    COALESCE(reporter.raw_user_meta_data->>'full_name', er.reporter_name, er.reporter_email, 'Anonymous') as reporter_display_name,
    COALESCE(assignee.raw_user_meta_data->>'full_name', 'Unassigned') as assignee_display_name,
    CASE
        WHEN er.resolved_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (er.resolved_at - er.created_at)) / 3600
        ELSE NULL
    END as resolution_time_hours,
    (SELECT COUNT(*) FROM public.error_report_comments WHERE error_report_id = er.id) as comment_count,
    (SELECT COUNT(*) FROM public.error_report_attachments WHERE error_report_id = er.id) as attachment_count
FROM public.error_reports er
LEFT JOIN auth.users reporter ON er.reporter_id = reporter.id
LEFT JOIN auth.users assignee ON er.assigned_to = assignee.id
WHERE er.is_deleted = false;

-- View for unresolved errors dashboard
CREATE OR REPLACE VIEW public.error_reports_dashboard AS
SELECT
    id,
    'ERR-' || LPAD(report_number::TEXT, 5, '0') as display_id,
    error_message,
    component_name,
    page_url,
    status,
    severity,
    priority,
    category,
    duplicate_count,
    screenshot_url,
    created_at,
    EXTRACT(EPOCH FROM (now() - created_at)) / 3600 as age_hours
FROM public.error_reports
WHERE status NOT IN ('resolved', 'wont_fix', 'duplicate')
  AND is_deleted = false
ORDER BY
    CASE severity
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
        ELSE 5
    END,
    priority DESC,
    created_at DESC;

-- Grant access to views
GRANT SELECT ON public.error_reports_enriched TO authenticated;
GRANT SELECT ON public.error_reports_dashboard TO authenticated;

-- ============================================================================
-- SECTION 6: RLS Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE public.error_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_report_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_report_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_report_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_console_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_network_requests ENABLE ROW LEVEL SECURITY;

-- Error Reports Policies
-- Anyone can submit error reports
CREATE POLICY "Anyone can submit error reports" ON public.error_reports
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Authenticated users can view all error reports
CREATE POLICY "Authenticated users can view error reports" ON public.error_reports
    FOR SELECT TO authenticated
    USING (true);

-- Admins and managers can update error reports
CREATE POLICY "Admins can update error reports" ON public.error_reports
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin', 'manager')
        )
        OR reporter_id = auth.uid() -- Reporters can update their own
        OR assigned_to = auth.uid() -- Assignees can update their assigned
    );

-- Only admins can delete (soft delete)
CREATE POLICY "Admins can soft delete error reports" ON public.error_reports
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

-- Comments Policies
CREATE POLICY "Authenticated can insert comments" ON public.error_report_comments
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated can view non-internal comments" ON public.error_report_comments
    FOR SELECT TO authenticated
    USING (
        is_internal = false
        OR EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin', 'manager')
        )
    );

-- Attachments Policies
CREATE POLICY "Authenticated can insert attachments" ON public.error_report_attachments
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated can view attachments" ON public.error_report_attachments
    FOR SELECT TO authenticated
    USING (true);

-- History Policies (read-only for most)
CREATE POLICY "Authenticated can view history" ON public.error_report_history
    FOR SELECT TO authenticated
    USING (true);

-- Console logs policies
CREATE POLICY "Authenticated can insert console logs" ON public.error_console_logs
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated can view console logs" ON public.error_console_logs
    FOR SELECT TO authenticated
    USING (true);

-- Network requests policies
CREATE POLICY "Authenticated can insert network requests" ON public.error_network_requests
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated can view network requests" ON public.error_network_requests
    FOR SELECT TO authenticated
    USING (true);

-- ============================================================================
-- SECTION 7: Storage Bucket for Screenshots
-- ============================================================================

-- Create the error-screenshots storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'error-screenshots',
    'error-screenshots',
    false, -- Private bucket (use signed URLs)
    5242880, -- 5MB limit per screenshot
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop existing policies if any
DROP POLICY IF EXISTS "error_screenshots_insert" ON storage.objects;
DROP POLICY IF EXISTS "error_screenshots_select" ON storage.objects;
DROP POLICY IF EXISTS "error_screenshots_delete" ON storage.objects;

-- Storage policies for error-screenshots bucket
CREATE POLICY "error_screenshots_insert" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'error-screenshots');

CREATE POLICY "error_screenshots_select" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'error-screenshots');

CREATE POLICY "error_screenshots_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'error-screenshots'
        AND EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role IN ('admin', 'super_admin')
        )
    );

-- ============================================================================
-- SECTION 8: Grants
-- ============================================================================

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.generate_error_hash TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_duplicate_error TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_error_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION public.query_error_reports TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_error_status TO authenticated;

-- Grant access to tables
GRANT SELECT, INSERT ON public.error_reports TO authenticated;
GRANT SELECT, INSERT ON public.error_report_comments TO authenticated;
GRANT SELECT, INSERT ON public.error_report_attachments TO authenticated;
GRANT SELECT ON public.error_report_history TO authenticated;
GRANT SELECT, INSERT ON public.error_console_logs TO authenticated;
GRANT SELECT, INSERT ON public.error_network_requests TO authenticated;

-- Grant update to error_reports for authorized users (RLS handles the rest)
GRANT UPDATE ON public.error_reports TO authenticated;

-- Grant usage on sequences
GRANT USAGE, SELECT ON SEQUENCE public.error_reports_report_number_seq TO authenticated;

-- ============================================================================
-- SECTION 9: Service Role Function for AI Processing
-- ============================================================================

-- Function for AI (Baiger) to process and analyze errors
CREATE OR REPLACE FUNCTION public.ai_process_error_report(
    p_error_id UUID,
    p_analysis JSONB,
    p_suggested_priority INTEGER DEFAULT NULL,
    p_suggested_category TEXT DEFAULT NULL,
    p_similar_errors UUID[] DEFAULT NULL
)
RETURNS JSONB AS $$
BEGIN
    UPDATE public.error_reports
    SET
        ai_processed = true,
        ai_processed_at = now(),
        ai_analysis = p_analysis,
        ai_suggested_priority = COALESCE(p_suggested_priority, ai_suggested_priority),
        ai_suggested_category = COALESCE(p_suggested_category, ai_suggested_category),
        ai_similar_errors = COALESCE(p_similar_errors, ai_similar_errors)
    WHERE id = p_error_id;

    RETURN jsonb_build_object(
        'success', true,
        'error_id', p_error_id,
        'processed_at', now()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.ai_process_error_report TO authenticated;
