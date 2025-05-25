-- Create activity_logs table for comprehensive activity tracking
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_project_id ON public.activity_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON public.activity_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_type ON public.activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_session_id ON public.activity_logs(session_id);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_project_timestamp ON public.activity_logs(project_id, timestamp DESC);

-- Enable RLS but allow all operations for now (can be tightened later)
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to insert their own logs
CREATE POLICY "Users can insert their own activity logs" ON public.activity_logs
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Allow users to read activity logs for projects they have access to
CREATE POLICY "Users can read activity logs for accessible projects" ON public.activity_logs
    FOR SELECT TO authenticated
    USING (true);

-- Optional: Create a function to clean up old logs (older than 6 months)
CREATE OR REPLACE FUNCTION public.cleanup_old_activity_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.activity_logs 
    WHERE created_at < now() - INTERVAL '6 months';
END;
$$;

-- Create a view for easier querying with user information
CREATE OR REPLACE VIEW public.activity_logs_with_user AS
SELECT 
    al.*,
    COALESCE(al.user_name, u.full_name, u.email, 'Unknown User') as display_name
FROM public.activity_logs al
LEFT JOIN auth.users u ON al.user_id::text = u.id::text;

-- Grant access to the view
GRANT SELECT ON public.activity_logs_with_user TO authenticated;