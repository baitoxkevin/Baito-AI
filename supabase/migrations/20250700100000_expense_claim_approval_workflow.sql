-- Add role field to users if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS role text DEFAULT 'staff';

-- Add expense claim tracking columns to expense_claims
ALTER TABLE expense_claims ADD COLUMN IF NOT EXISTS is_added_to_payroll boolean DEFAULT false;
ALTER TABLE expense_claims ADD COLUMN IF NOT EXISTS payroll_updated_at timestamptz;

-- Create unpaid_claims table for non-staff users
CREATE TABLE IF NOT EXISTS unpaid_claims (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    expense_claim_id uuid NOT NULL REFERENCES expense_claims(id),
    amount decimal(10,2) NOT NULL,
    project_id uuid REFERENCES projects(id),
    is_paid boolean DEFAULT false,
    paid_at timestamptz,
    paid_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_unpaid_claims_user_id ON unpaid_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_unpaid_claims_expense_claim_id ON unpaid_claims(expense_claim_id);
CREATE INDEX IF NOT EXISTS idx_unpaid_claims_project_id ON unpaid_claims(project_id);

-- RLS policies for unpaid_claims
ALTER TABLE unpaid_claims ENABLE ROW LEVEL SECURITY;

-- Users can view their own unpaid claims
CREATE POLICY "Users can view own unpaid claims" ON unpaid_claims
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Managers can view all unpaid claims
CREATE POLICY "Managers can view all unpaid claims" ON unpaid_claims
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'manager'
    )
);

-- Only system/managers can create unpaid claims
CREATE POLICY "System can create unpaid claims" ON unpaid_claims
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('manager', 'event_pic')
    )
);

-- Update function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for unpaid_claims
CREATE TRIGGER unpaid_claims_updated_at 
BEFORE UPDATE ON unpaid_claims
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();