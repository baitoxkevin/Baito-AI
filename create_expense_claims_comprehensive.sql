-- Comprehensive solution for expense claims table
-- This handles all possible states and ensures the table is in the correct format

-- First, check if the table exists and create if needed
CREATE TABLE IF NOT EXISTS public.expense_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    receipt_number VARCHAR(255),
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
    expense_date DATE,
    category VARCHAR(50),
    submitted_at TIMESTAMP WITH TIME ZONE,
    submitted_by VARCHAR(255),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    amount DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns if they don't exist
ALTER TABLE public.expense_claims ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(255);
ALTER TABLE public.expense_claims ADD COLUMN IF NOT EXISTS expense_date DATE;
ALTER TABLE public.expense_claims ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE public.expense_claims ADD COLUMN IF NOT EXISTS amount DECIMAL(10, 2);

-- Make receipt_number nullable temporarily
ALTER TABLE public.expense_claims ALTER COLUMN receipt_number DROP NOT NULL;

-- Update existing null receipt_numbers
UPDATE public.expense_claims 
SET receipt_number = 'REC-' || EXTRACT(YEAR FROM created_at) || '-' || substr(id::text, 1, 8)
WHERE receipt_number IS NULL;

-- Create receipts table if needed
CREATE TABLE IF NOT EXISTS public.receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_claim_id UUID REFERENCES public.expense_claims(id) ON DELETE CASCADE,
    url TEXT,
    filename VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.expense_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own expense claims" ON public.expense_claims;
DROP POLICY IF EXISTS "Users can create their own expense claims" ON public.expense_claims;
DROP POLICY IF EXISTS "Users can update their own expense claims" ON public.expense_claims;
DROP POLICY IF EXISTS "Project managers can view expense claims" ON public.expense_claims;

-- Create comprehensive policies
CREATE POLICY "Users can view their own expense claims" 
ON public.expense_claims FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT id FROM users WHERE role = 'manager' OR role = 'admin'
));

CREATE POLICY "Users can create their own expense claims" 
ON public.expense_claims FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expense claims" 
ON public.expense_claims FOR UPDATE 
USING (auth.uid() = user_id AND status IN ('draft', 'pending'))
WITH CHECK (auth.uid() = user_id);

-- Create function to handle expense claim creation with auto-generated receipt_number
CREATE OR REPLACE FUNCTION create_expense_claim_with_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.receipt_number IS NULL THEN
        NEW.receipt_number := 'REC-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || substr(NEW.id::text, 1, 8);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate receipt_number
DROP TRIGGER IF EXISTS auto_generate_receipt_number ON public.expense_claims;
CREATE TRIGGER auto_generate_receipt_number
    BEFORE INSERT ON public.expense_claims
    FOR EACH ROW
    EXECUTE FUNCTION create_expense_claim_with_receipt_number();