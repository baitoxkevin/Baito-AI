-- Add staff and working date fields to expense_claims table
ALTER TABLE expense_claims 
ADD COLUMN IF NOT EXISTS staff_id TEXT,
ADD COLUMN IF NOT EXISTS working_date DATE,
ADD COLUMN IF NOT EXISTS bill_number TEXT,
ADD COLUMN IF NOT EXISTS claim_type TEXT DEFAULT 'own' CHECK (claim_type IN ('own', 'behalf')),
ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES auth.users(id);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_expense_claims_staff_date 
ON expense_claims(project_id, staff_id, working_date);

-- Add index for bill number search
CREATE INDEX IF NOT EXISTS idx_expense_claims_bill_number 
ON expense_claims(bill_number);

-- Create receipts table if not exists
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_claim_id UUID REFERENCES expense_claims(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for receipts
CREATE INDEX IF NOT EXISTS idx_receipts_expense_claim 
ON receipts(expense_claim_id);

-- Create storage bucket for receipts if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for receipts bucket
CREATE POLICY "Users can upload receipts" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'receipts' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view their receipts" ON storage.objects
FOR SELECT USING (
  bucket_id = 'receipts' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their receipts" ON storage.objects
FOR DELETE USING (
  bucket_id = 'receipts' AND
  auth.uid() IS NOT NULL
);