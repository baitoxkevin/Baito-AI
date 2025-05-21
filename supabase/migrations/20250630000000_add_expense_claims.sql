-- Create expense claims table
CREATE TABLE IF NOT EXISTS expense_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  approver_id UUID REFERENCES auth.users(id),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Link receipts to expense claims
CREATE TABLE IF NOT EXISTS expense_claim_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_claim_id UUID NOT NULL REFERENCES expense_claims(id) ON DELETE CASCADE,
  receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(expense_claim_id, receipt_id)
);

-- Add RLS policies
ALTER TABLE expense_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_claim_receipts ENABLE ROW LEVEL SECURITY;

-- User can view their own expense claims
CREATE POLICY "Users can view their own expense claims" 
  ON expense_claims
  FOR SELECT
  USING (auth.uid() = user_id);

-- Project managers can view expense claims for their projects
CREATE POLICY "Project managers can view expense claims" 
  ON expense_claims
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects 
      WHERE manager_id = auth.uid()
    )
  );

-- Approvers can view expense claims they need to approve
CREATE POLICY "Approvers can view expense claims" 
  ON expense_claims
  FOR SELECT
  USING (auth.uid() = approver_id);

-- Users can create and edit their own expense claims
CREATE POLICY "Users can manage their own expense claims" 
  ON expense_claims
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expense claims" 
  ON expense_claims
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'draft');

-- Users can manage their receipt mappings
CREATE POLICY "Users can manage expense claim receipts" 
  ON expense_claim_receipts
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM expense_claims 
    WHERE expense_claims.id = expense_claim_receipts.expense_claim_id
    AND expense_claims.user_id = auth.uid()
    AND expense_claims.status = 'draft'
  ));

-- Create function to update total amount when receipts are added/removed
CREATE OR REPLACE FUNCTION update_expense_claim_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE expense_claims
  SET total_amount = (
    SELECT COALESCE(SUM(amount), 0)
    FROM expense_claim_receipts
    WHERE expense_claim_id = NEW.expense_claim_id
  ),
  updated_at = NOW()
  WHERE id = NEW.expense_claim_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_expense_claim_total_on_insert
AFTER INSERT ON expense_claim_receipts
FOR EACH ROW
EXECUTE FUNCTION update_expense_claim_total();

CREATE TRIGGER update_expense_claim_total_on_update
AFTER UPDATE ON expense_claim_receipts
FOR EACH ROW
EXECUTE FUNCTION update_expense_claim_total();

CREATE TRIGGER update_expense_claim_total_on_delete
AFTER DELETE ON expense_claim_receipts
FOR EACH ROW
EXECUTE FUNCTION update_expense_claim_total();

-- Create view for expense claim summary
CREATE OR REPLACE VIEW expense_claims_summary AS
SELECT 
  ec.id,
  ec.title,
  ec.status,
  ec.total_amount,
  ec.submitted_at,
  ec.user_id,
  ec.project_id,
  u.email as user_email,
  CASE 
    WHEN p.title IS NOT NULL THEN p.title
    ELSE 'Personal Expense'
  END as project_title,
  COUNT(ecr.id) as receipt_count
FROM expense_claims ec
LEFT JOIN auth.users u ON ec.user_id = u.id
LEFT JOIN projects p ON ec.project_id = p.id
LEFT JOIN expense_claim_receipts ecr ON ec.id = ecr.expense_claim_id
WHERE ec.deleted_at IS NULL
GROUP BY ec.id, ec.title, ec.status, ec.total_amount, ec.submitted_at, 
  ec.user_id, ec.project_id, u.email, p.title;

-- Create function to submit expense claim for approval
CREATE OR REPLACE FUNCTION submit_expense_claim(claim_id UUID, approver_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Validate the claim exists and belongs to the current user
  IF NOT EXISTS (
    SELECT 1 FROM expense_claims 
    WHERE id = claim_id 
    AND user_id = auth.uid()
    AND status = 'draft'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Expense claim not found or not in draft status'
    );
  END IF;
  
  -- Validate the claim has receipts
  IF NOT EXISTS (
    SELECT 1 FROM expense_claim_receipts
    WHERE expense_claim_id = claim_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Expense claim must have at least one receipt'
    );
  END IF;
  
  -- Update the claim status
  UPDATE expense_claims
  SET 
    status = 'pending',
    submitted_at = NOW(),
    approver_id = approver_id,
    updated_at = NOW()
  WHERE id = claim_id
  RETURNING jsonb_build_object(
    'id', id,
    'title', title,
    'status', status,
    'total_amount', total_amount,
    'submitted_at', submitted_at
  ) INTO result;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Expense claim submitted for approval',
    'data', result
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to approve an expense claim
CREATE OR REPLACE FUNCTION approve_expense_claim(claim_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Validate the approver is authorized
  IF NOT EXISTS (
    SELECT 1 FROM expense_claims 
    WHERE id = claim_id 
    AND approver_id = auth.uid()
    AND status = 'pending'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Not authorized to approve this expense claim or claim not in pending status'
    );
  END IF;
  
  -- Update the claim status
  UPDATE expense_claims
  SET 
    status = 'approved',
    approved_at = NOW(),
    updated_at = NOW()
  WHERE id = claim_id
  RETURNING jsonb_build_object(
    'id', id,
    'title', title,
    'status', status,
    'total_amount', total_amount,
    'approved_at', approved_at
  ) INTO result;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Expense claim approved',
    'data', result
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject an expense claim
CREATE OR REPLACE FUNCTION reject_expense_claim(claim_id UUID, reason TEXT)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Validate the approver is authorized
  IF NOT EXISTS (
    SELECT 1 FROM expense_claims 
    WHERE id = claim_id 
    AND approver_id = auth.uid()
    AND status = 'pending'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Not authorized to reject this expense claim or claim not in pending status'
    );
  END IF;
  
  -- Update the claim status
  UPDATE expense_claims
  SET 
    status = 'rejected',
    rejected_at = NOW(),
    rejection_reason = reason,
    updated_at = NOW()
  WHERE id = claim_id
  RETURNING jsonb_build_object(
    'id', id,
    'title', title,
    'status', status,
    'rejection_reason', rejection_reason,
    'rejected_at', rejected_at
  ) INTO result;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Expense claim rejected',
    'data', result
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;