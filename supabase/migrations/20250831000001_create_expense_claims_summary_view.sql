-- Create expense_claims_summary view for displaying expense claims with related data
CREATE OR REPLACE VIEW expense_claims_summary AS
SELECT 
  ec.id,
  ec.title,
  ec.description,
  ec.bill_number as receipt_number,
  ec.status,
  ec.amount,
  ec.amount as total_amount,
  ec.expense_date,
  ec.expense_date as date,
  ec.category,
  ec.project_id,
  ec.staff_id,
  ec.working_date,
  ec.claim_type,
  ec.submitted_by,
  ec.created_at,
  ec.updated_at,
  ec.created_at as submitted_at,
  ec.approved_at,
  ec.rejected_at,
  ec.rejection_reason,
  ec.approver_id,
  ec.submitted_by as user_id,
  p.title as project_title,
  u.email as user_email,
  u.raw_user_meta_data->>'full_name' as submitted_by_name,
  u.raw_user_meta_data->>'avatar_url' as user_image,
  (
    SELECT COUNT(*) 
    FROM receipts r 
    WHERE r.expense_claim_id = ec.id
  ) as receipt_count
FROM 
  expense_claims ec
  LEFT JOIN projects p ON ec.project_id = p.id
  LEFT JOIN auth.users u ON ec.submitted_by = u.id
ORDER BY 
  ec.created_at DESC;

-- Grant permissions
GRANT SELECT ON expense_claims_summary TO authenticated;
GRANT SELECT ON expense_claims_summary TO anon;

-- Add RLS policies for expense_claims table if not exists
ALTER TABLE expense_claims ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own expense claims
CREATE POLICY "Users can view own expense claims" ON expense_claims
  FOR SELECT
  USING (auth.uid() = submitted_by OR auth.uid() IN (
    SELECT user_id FROM project_staff WHERE project_id = expense_claims.project_id
  ));

-- Policy: Users can create expense claims
CREATE POLICY "Users can create expense claims" ON expense_claims
  FOR INSERT
  WITH CHECK (auth.uid() = submitted_by);

-- Policy: Users can update their own pending/draft claims
CREATE POLICY "Users can update own pending claims" ON expense_claims
  FOR UPDATE
  USING (auth.uid() = submitted_by AND status IN ('draft', 'pending'))
  WITH CHECK (auth.uid() = submitted_by);

-- Policy: Users can delete their own draft claims
CREATE POLICY "Users can delete own draft claims" ON expense_claims
  FOR DELETE
  USING (auth.uid() = submitted_by AND status = 'draft');