-- Create receipts table if it doesn't exist
CREATE TABLE IF NOT EXISTS receipts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    expense_claim_id uuid NOT NULL REFERENCES expense_claims(id) ON DELETE CASCADE,
    url text NOT NULL,
    filename text NOT NULL,
    file_size bigint,
    content_type text,
    description text,
    amount decimal(10,2),
    date date,
    vendor text,
    category text,
    uploaded_by uuid REFERENCES users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_receipts_expense_claim_id ON receipts(expense_claim_id);
CREATE INDEX IF NOT EXISTS idx_receipts_uploaded_by ON receipts(uploaded_by);

-- Enable RLS
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view receipts for their own expense claims
CREATE POLICY "Users can view own expense receipts" ON receipts
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM expense_claims
    WHERE expense_claims.id = receipts.expense_claim_id
    AND expense_claims.created_by = auth.uid()
  )
);

-- Users can create receipts for their own expense claims
CREATE POLICY "Users can create own expense receipts" ON receipts
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM expense_claims
    WHERE expense_claims.id = receipts.expense_claim_id
    AND expense_claims.created_by = auth.uid()
  )
);

-- Users can update their own receipts
CREATE POLICY "Users can update own expense receipts" ON receipts
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM expense_claims
    WHERE expense_claims.id = receipts.expense_claim_id
    AND expense_claims.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM expense_claims
    WHERE expense_claims.id = receipts.expense_claim_id
    AND expense_claims.created_by = auth.uid()
  )
);

-- Users can delete their own receipts
CREATE POLICY "Users can delete own expense receipts" ON receipts
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM expense_claims
    WHERE expense_claims.id = receipts.expense_claim_id
    AND expense_claims.created_by = auth.uid()
  )
);

-- Create an updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER receipts_updated_at BEFORE UPDATE ON receipts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();