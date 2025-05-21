-- First add created_by column if it doesn't exist
ALTER TABLE expense_claims ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Update the existing rows to set created_by = user_id if created_by is null
UPDATE expense_claims SET created_by = user_id WHERE created_by IS NULL;

-- Update the view to include real user information
CREATE OR REPLACE VIEW expense_claims_summary AS
SELECT 
  ec.id,
  ec.title,
  ec.status,
  ec.total_amount,
  ec.submitted_at,
  ec.user_id,
  ec.created_by,
  ec.project_id,
  ec.expense_date,
  ec.receipt_number,
  ec.category,
  ec.description,
  COALESCE(u.email, cu.email) as user_email,
  COALESCE(ec.submitted_by, cu.email) as submitted_by,
  json_build_object(
    'id', COALESCE(ec.created_by, ec.user_id),
    'email', COALESCE(cu.email, u.email),
    'raw_user_meta_data', COALESCE(cu.raw_user_meta_data, u.raw_user_meta_data)
  ) as user_data,
  CASE 
    WHEN p.title IS NOT NULL THEN p.title
    ELSE 'Personal Expense'
  END as project_title,
  COUNT(r.id) as receipt_count,
  ec.created_at,
  ec.updated_at,
  ec.approved_at,
  ec.rejected_at,
  ec.rejection_reason
FROM expense_claims ec
LEFT JOIN auth.users u ON ec.user_id = u.id
LEFT JOIN auth.users cu ON ec.created_by = cu.id
LEFT JOIN projects p ON ec.project_id = p.id
LEFT JOIN receipts r ON ec.id = r.expense_claim_id
GROUP BY 
  ec.id, ec.title, ec.status, ec.total_amount, ec.submitted_at, 
  ec.user_id, ec.created_by, ec.project_id, ec.expense_date,
  ec.receipt_number, ec.category, ec.description,
  u.email, u.raw_user_meta_data, cu.email, cu.raw_user_meta_data, 
  p.title, ec.created_at, ec.updated_at, ec.approved_at, 
  ec.rejected_at, ec.rejection_reason;

-- Update the approve/reject functions to use the current user
CREATE OR REPLACE FUNCTION approve_expense_claim(claim_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Check if the claim exists and is pending
  IF NOT EXISTS (
    SELECT 1 FROM expense_claims 
    WHERE id = claim_id 
    AND status = 'pending'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Expense claim not found or not in pending status'
    );
  END IF;
  
  -- Update the claim status
  UPDATE expense_claims
  SET 
    status = 'approved',
    approved_at = NOW(),
    approved_by = current_user_id,
    updated_at = NOW()
  WHERE id = claim_id
  RETURNING jsonb_build_object(
    'id', id,
    'title', title,
    'status', status,
    'total_amount', total_amount,
    'approved_at', approved_at,
    'approved_by', approved_by
  ) INTO result;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Expense claim approved',
    'data', result
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION reject_expense_claim(claim_id UUID, reason TEXT)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Check if the claim exists and is pending
  IF NOT EXISTS (
    SELECT 1 FROM expense_claims 
    WHERE id = claim_id 
    AND status = 'pending'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Expense claim not found or not in pending status'
    );
  END IF;
  
  -- Update the claim status
  UPDATE expense_claims
  SET 
    status = 'rejected',
    rejected_at = NOW(),
    rejected_by = current_user_id,
    rejection_reason = reason,
    updated_at = NOW()
  WHERE id = claim_id
  RETURNING jsonb_build_object(
    'id', id,
    'title', title,
    'status', status,
    'rejection_reason', rejection_reason,
    'rejected_at', rejected_at,
    'rejected_by', rejected_by
  ) INTO result;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Expense claim rejected',
    'data', result
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;