-- Simple version: Create password_reset_tokens table
-- Run this script in the Supabase SQL Editor

-- Create the table (if it doesn't exist)
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);

-- Disable RLS for now (you can enable it later with proper policies)
ALTER TABLE public.password_reset_tokens DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.password_reset_tokens TO authenticated;
GRANT ALL ON public.password_reset_tokens TO service_role;
GRANT ALL ON public.password_reset_tokens TO anon;

-- Test the table
SELECT 'Table created successfully!' as message;