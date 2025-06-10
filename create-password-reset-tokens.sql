-- Run this script in Supabase SQL Editor to enable password reset tokens
-- This is required for the invite user functionality

-- Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    email text NOT NULL,
    token text NOT NULL UNIQUE,
    expires_at timestamp with time zone NOT NULL,
    used boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON public.password_reset_tokens(expires_at);

-- Enable Row Level Security
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can create password reset tokens" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "Users can view their own password reset tokens" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "Admins can view all password reset tokens" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "Admins can update password reset tokens" ON public.password_reset_tokens;

-- Create RLS policies
-- Admins can create password reset tokens
CREATE POLICY "Admins can create password reset tokens" ON public.password_reset_tokens
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND (users.is_super_admin = true OR users.role IN ('admin', 'super_admin'))
        )
    );

-- Users can view their own tokens
CREATE POLICY "Users can view their own password reset tokens" ON public.password_reset_tokens
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Admins can view all tokens
CREATE POLICY "Admins can view all password reset tokens" ON public.password_reset_tokens
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND (users.is_super_admin = true OR users.role IN ('admin', 'super_admin'))
        )
    );

-- Admins can update tokens (mark as used)
CREATE POLICY "Admins can update password reset tokens" ON public.password_reset_tokens
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND (users.is_super_admin = true OR users.role IN ('admin', 'super_admin'))
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND (users.is_super_admin = true OR users.role IN ('admin', 'super_admin'))
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

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Password reset tokens table created successfully!';
    RAISE NOTICE 'You can now use the invite user functionality.';
END $$;