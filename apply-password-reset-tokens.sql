-- Create password_reset_tokens table for secure password setup
-- Run this script in the Supabase SQL Editor

-- Create the table
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    email text NOT NULL,
    token text NOT NULL UNIQUE,
    expires_at timestamp with time zone NOT NULL,
    used boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON public.password_reset_tokens(expires_at);

-- Enable RLS
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Super admins can create password reset tokens" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "Users can view their own password reset tokens" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "Super admins can view all password reset tokens" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "Super admins can update password reset tokens" ON public.password_reset_tokens;

-- Create policies
-- Only super admins can create password reset tokens
CREATE POLICY "Super admins can create password reset tokens" ON public.password_reset_tokens
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.is_super_admin = true
        )
    );

-- Users can view their own tokens
CREATE POLICY "Users can view their own password reset tokens" ON public.password_reset_tokens
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Super admins can view all tokens
CREATE POLICY "Super admins can view all password reset tokens" ON public.password_reset_tokens
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.is_super_admin = true
        )
    );

-- Super admins can update tokens (mark as used)
CREATE POLICY "Super admins can update password reset tokens" ON public.password_reset_tokens
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.is_super_admin = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.is_super_admin = true
        )
    );

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_password_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM public.password_reset_tokens
    WHERE expires_at < now() OR used = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT ALL ON public.password_reset_tokens TO authenticated;
GRANT ALL ON public.password_reset_tokens TO service_role;

-- Verify the table was created
SELECT 
    'password_reset_tokens table created successfully' as status,
    count(*) as row_count 
FROM public.password_reset_tokens;