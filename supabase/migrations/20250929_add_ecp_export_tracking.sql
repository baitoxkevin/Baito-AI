-- Add ECP export tracking tables

-- Create table for tracking ECP export batches
CREATE TABLE IF NOT EXISTS ecp_export_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_reference VARCHAR(50) UNIQUE NOT NULL,
  payment_batch_id UUID REFERENCES payment_batches(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  transaction_type VARCHAR(10) CHECK (transaction_type IN ('IBG', 'RENTAS')) NOT NULL,
  payment_date DATE NOT NULL,
  total_amount DECIMAL(15, 2) NOT NULL,
  payment_count INTEGER NOT NULL,
  exported_by UUID REFERENCES users(id),
  exported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  upload_status VARCHAR(20) DEFAULT 'pending' CHECK (upload_status IN ('pending', 'uploaded', 'processing', 'completed', 'failed')),
  upload_confirmed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX idx_ecp_export_batches_payment_batch_id ON ecp_export_batches(payment_batch_id);
CREATE INDEX idx_ecp_export_batches_exported_by ON ecp_export_batches(exported_by);
CREATE INDEX idx_ecp_export_batches_upload_status ON ecp_export_batches(upload_status);
CREATE INDEX idx_ecp_export_batches_exported_at ON ecp_export_batches(exported_at);

-- Create table for bank BIC codes reference
CREATE TABLE IF NOT EXISTS bank_bic_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name VARCHAR(100) NOT NULL,
  bank_code VARCHAR(20),
  transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('IBG', 'RENTAS')),
  bic_code VARCHAR(20) NOT NULL,
  swift_code VARCHAR(20),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(bank_name, transaction_type)
);

-- Insert common Malaysian bank BIC codes
INSERT INTO bank_bic_codes (bank_name, bank_code, transaction_type, bic_code) VALUES
-- IBG Codes
('Maybank', 'MBB', 'IBG', 'MBBEMYKL'),
('CIMB Bank', 'CIMB', 'IBG', 'CIBBMYKL'),
('Public Bank', 'PBB', 'IBG', 'PBBEMYKL'),
('RHB Bank', 'RHB', 'IBG', 'RHBBMYKL'),
('Hong Leong Bank', 'HLB', 'IBG', 'HLBBMYKL'),
('AmBank', 'AMB', 'IBG', 'ARBKMYKL'),
('Bank Rakyat', 'BKRM', 'IBG', 'BKRMMYKL'),
('Bank Islam', 'BIMB', 'IBG', 'BIMBMYKL'),
('OCBC Bank', 'OCBC', 'IBG', 'OCBCMYKL'),
('HSBC Bank', 'HSBC', 'IBG', 'HBMBMYKL'),
('Standard Chartered', 'SCB', 'IBG', 'SCBLMYKX'),
('UOB Bank', 'UOB', 'IBG', 'UOVBMYKL'),
('Affin Bank', 'AFFIN', 'IBG', 'PHBMMYKL'),
('Alliance Bank', 'ALLIANCE', 'IBG', 'MFBBMYKL'),
('Bank Muamalat', 'MUAMALAT', 'IBG', 'BMMBMYKL'),
('BSN', 'BSN', 'IBG', 'BSNAMYK1'),
('Kuwait Finance House', 'KFH', 'IBG', 'KFHOMYKL'),
('Bank of China', 'BOC', 'IBG', 'BKCHMYKL'),
('Agro Bank', 'AGRO', 'IBG', 'BPMMMY2K'),
-- RENTAS Codes
('Maybank', 'MBB', 'RENTAS', 'MBBEMYKLXXX'),
('CIMB Bank', 'CIMB', 'RENTAS', 'CIBBMYKLXXX'),
('Public Bank', 'PBB', 'RENTAS', 'PBBEMYKLXXX'),
('RHB Bank', 'RHB', 'RENTAS', 'RHBBMYKLXXX'),
('Hong Leong Bank', 'HLB', 'RENTAS', 'HLBBMYKLXXX'),
('AmBank', 'AMB', 'RENTAS', 'ARBKMYKLXXX'),
('Bank Rakyat', 'BKRM', 'RENTAS', 'BKRMMYKLXXX'),
('Bank Islam', 'BIMB', 'RENTAS', 'BIMBMYKLXXX'),
('OCBC Bank', 'OCBC', 'RENTAS', 'OCBCMYKLXXX'),
('HSBC Bank', 'HSBC', 'RENTAS', 'HBMBMYKLXXX'),
('Standard Chartered', 'SCB', 'RENTAS', 'SCBLMYKXXXX'),
('UOB Bank', 'UOB', 'RENTAS', 'UOVBMYKLXXX'),
('Affin Bank', 'AFFIN', 'RENTAS', 'PHBMMYKLXXX'),
('Alliance Bank', 'ALLIANCE', 'RENTAS', 'MFBBMYKLXXX'),
('Bank Muamalat', 'MUAMALAT', 'RENTAS', 'BMMBMYKLXXX'),
('BSN', 'BSN', 'RENTAS', 'BSNAMYK1XXX'),
('Kuwait Finance House', 'KFH', 'RENTAS', 'KFHOMYKLXXX'),
('Bank of China', 'BOC', 'RENTAS', 'BKCHMYKLXXX'),
('Agro Bank', 'AGRO', 'RENTAS', 'BPMMMY2KXXX')
ON CONFLICT (bank_name, transaction_type) DO NOTHING;

-- Add column to payment_batches to track ECP export
ALTER TABLE payment_batches
ADD COLUMN IF NOT EXISTS ecp_export_id UUID REFERENCES ecp_export_batches(id),
ADD COLUMN IF NOT EXISTS ecp_exported_at TIMESTAMP WITH TIME ZONE;

-- Add column to payment_queue to track individual payment ECP status
ALTER TABLE payment_queue
ADD COLUMN IF NOT EXISTS ecp_transaction_ref VARCHAR(100),
ADD COLUMN IF NOT EXISTS ecp_status VARCHAR(20);

-- Create function to log ECP export
CREATE OR REPLACE FUNCTION log_ecp_export(
  p_payment_batch_id UUID,
  p_batch_reference VARCHAR,
  p_filename VARCHAR,
  p_transaction_type VARCHAR,
  p_payment_date DATE,
  p_total_amount DECIMAL,
  p_payment_count INTEGER,
  p_user_id UUID
) RETURNS UUID AS $$
DECLARE
  v_export_id UUID;
BEGIN
  -- Insert export record
  INSERT INTO ecp_export_batches (
    batch_reference,
    payment_batch_id,
    filename,
    transaction_type,
    payment_date,
    total_amount,
    payment_count,
    exported_by
  ) VALUES (
    p_batch_reference,
    p_payment_batch_id,
    p_filename,
    p_transaction_type,
    p_payment_date,
    p_total_amount,
    p_payment_count,
    p_user_id
  ) RETURNING id INTO v_export_id;

  -- Update payment batch
  UPDATE payment_batches
  SET
    ecp_export_id = v_export_id,
    ecp_exported_at = NOW(),
    exported_at = NOW(),
    exported_by = p_user_id
  WHERE id = p_payment_batch_id;

  RETURN v_export_id;
END;
$$ LANGUAGE plpgsql;

-- Create view for ECP export summary
CREATE OR REPLACE VIEW ecp_export_summary AS
SELECT
  e.id,
  e.batch_reference,
  e.filename,
  e.transaction_type,
  e.payment_date,
  e.total_amount,
  e.payment_count,
  e.upload_status,
  e.exported_at,
  e.upload_confirmed_at,
  u.full_name as exported_by_name,
  u.email as exported_by_email,
  p.project_id,
  proj.name as project_name,
  p.company_name
FROM ecp_export_batches e
LEFT JOIN users u ON e.exported_by = u.id
LEFT JOIN payment_batches p ON e.payment_batch_id = p.id
LEFT JOIN projects proj ON p.project_id = proj.id
ORDER BY e.exported_at DESC;

-- Grant appropriate permissions
GRANT SELECT ON ecp_export_batches TO authenticated;
GRANT INSERT ON ecp_export_batches TO authenticated;
GRANT UPDATE ON ecp_export_batches TO authenticated;
GRANT SELECT ON bank_bic_codes TO authenticated;
GRANT SELECT ON ecp_export_summary TO authenticated;
GRANT EXECUTE ON FUNCTION log_ecp_export TO authenticated;

-- Add RLS policies for security
ALTER TABLE ecp_export_batches ENABLE ROW LEVEL SECURITY;

-- Policy for viewing exports (users can see all exports)
CREATE POLICY "Users can view all ECP exports"
  ON ecp_export_batches
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for creating exports (users can create their own)
CREATE POLICY "Users can create ECP exports"
  ON ecp_export_batches
  FOR INSERT
  TO authenticated
  WITH CHECK (exported_by = auth.uid());

-- Policy for updating exports (users can update their own)
CREATE POLICY "Users can update their own ECP exports"
  ON ecp_export_batches
  FOR UPDATE
  TO authenticated
  USING (exported_by = auth.uid());

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ecp_export_batches_updated_at
  BEFORE UPDATE ON ecp_export_batches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_bic_codes_updated_at
  BEFORE UPDATE ON bank_bic_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();