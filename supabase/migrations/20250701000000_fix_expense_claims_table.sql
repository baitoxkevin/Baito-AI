-- Create expense_claims table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.expense_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    receipt_number VARCHAR(255) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
    expense_date DATE NOT NULL,
    category VARCHAR(50) NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE,
    submitted_by VARCHAR(255),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    mileage_km DECIMAL(10, 2),
    vendor VARCHAR(255),
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    tax_amount DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'MYR',
    exchange_rate DECIMAL(10, 4) DEFAULT 1.0,
    is_reimbursable BOOLEAN DEFAULT true,
    reimbursed_at TIMESTAMP WITH TIME ZONE,
    reimbursed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create receipts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_claim_id UUID REFERENCES public.expense_claims(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    filename VARCHAR(255),
    file_size BIGINT,
    content_type VARCHAR(100),
    description TEXT,
    amount DECIMAL(10, 2),
    date DATE,
    vendor VARCHAR(255),
    category VARCHAR(50),
    extracted_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_expense_claims_project_id ON public.expense_claims(project_id);
CREATE INDEX IF NOT EXISTS idx_expense_claims_user_id ON public.expense_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_claims_status ON public.expense_claims(status);
CREATE INDEX IF NOT EXISTS idx_expense_claims_submitted_at ON public.expense_claims(submitted_at);
CREATE INDEX IF NOT EXISTS idx_receipts_expense_claim_id ON public.receipts(expense_claim_id);

-- Add RLS policies
ALTER TABLE public.expense_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own expense claims
CREATE POLICY "Users can view own expense claims" ON public.expense_claims
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can create their own expense claims
CREATE POLICY "Users can create own expense claims" ON public.expense_claims
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own expense claims that are in draft or rejected status
CREATE POLICY "Users can update own draft/rejected expense claims" ON public.expense_claims
    FOR UPDATE
    USING (auth.uid() = user_id AND status IN ('draft', 'rejected'))
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own expense claims that are in draft status
CREATE POLICY "Users can delete own draft expense claims" ON public.expense_claims
    FOR DELETE
    USING (auth.uid() = user_id AND status = 'draft');

-- Policy: Project managers can view all expense claims for their projects
CREATE POLICY "Project managers can view project expense claims" ON public.expense_claims
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = expense_claims.project_id
            AND p.created_by = auth.uid()
        )
    );

-- Policy: Users can view receipts for their own expense claims
CREATE POLICY "Users can view own expense claim receipts" ON public.receipts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.expense_claims ec
            WHERE ec.id = receipts.expense_claim_id
            AND ec.user_id = auth.uid()
        )
    );

-- Policy: Users can add receipts to their own expense claims
CREATE POLICY "Users can add receipts to own expense claims" ON public.receipts
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.expense_claims ec
            WHERE ec.id = receipts.expense_claim_id
            AND ec.user_id = auth.uid()
            AND ec.status IN ('draft', 'rejected')
        )
    );

-- Policy: Users can update receipts for their own expense claims
CREATE POLICY "Users can update receipts for own expense claims" ON public.receipts
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.expense_claims ec
            WHERE ec.id = receipts.expense_claim_id
            AND ec.user_id = auth.uid()
            AND ec.status IN ('draft', 'rejected')
        )
    );

-- Policy: Users can delete receipts from their own expense claims
CREATE POLICY "Users can delete receipts from own expense claims" ON public.receipts
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.expense_claims ec
            WHERE ec.id = receipts.expense_claim_id
            AND ec.user_id = auth.uid()
            AND ec.status IN ('draft', 'rejected')
        )
    );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_expense_claims_updated_at BEFORE UPDATE ON public.expense_claims
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_receipts_updated_at BEFORE UPDATE ON public.receipts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();