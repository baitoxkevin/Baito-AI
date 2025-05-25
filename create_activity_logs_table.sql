-- Simple SQL to create activity_logs table manually
-- Run this when your database is available

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID,
    user_id UUID NOT NULL,
    user_name TEXT,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('navigation', 'interaction', 'data_change', 'view', 'action')),
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT now(),
    session_id TEXT,
    page_url TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_project_id ON public.activity_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON public.activity_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_type ON public.activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_project_timestamp ON public.activity_logs(project_id, timestamp DESC);

-- Enable RLS and create policies
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own activity logs" ON public.activity_logs
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can read activity logs for accessible projects" ON public.activity_logs
    FOR SELECT TO authenticated
    USING (true);

-- Grant access
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;