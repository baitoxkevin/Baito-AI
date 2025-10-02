-- Add invoice tracking to projects table
-- Migration: Add invoice fields for project billing

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS invoice_number TEXT,
ADD COLUMN IF NOT EXISTS invoice_amount DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS invoice_status TEXT DEFAULT 'pending'
    CHECK (invoice_status IN ('pending', 'sent', 'paid', 'overdue', 'cancelled')),
ADD COLUMN IF NOT EXISTS invoice_date DATE,
ADD COLUMN IF NOT EXISTS invoice_due_date DATE,
ADD COLUMN IF NOT EXISTS invoice_paid_date DATE,
ADD COLUMN IF NOT EXISTS invoice_notes TEXT;

-- Create index for invoice lookups
CREATE INDEX IF NOT EXISTS idx_projects_invoice_number ON projects(invoice_number);
CREATE INDEX IF NOT EXISTS idx_projects_invoice_status ON projects(invoice_status);
CREATE INDEX IF NOT EXISTS idx_projects_invoice_date ON projects(invoice_date);

-- Add comment
COMMENT ON COLUMN projects.invoice_number IS 'Invoice number for billing';
COMMENT ON COLUMN projects.invoice_amount IS 'Total invoice amount';
COMMENT ON COLUMN projects.invoice_status IS 'Invoice payment status';
COMMENT ON COLUMN projects.invoice_date IS 'Invoice issue date';
COMMENT ON COLUMN projects.invoice_due_date IS 'Invoice payment due date';
COMMENT ON COLUMN projects.invoice_paid_date IS 'Actual payment received date';
COMMENT ON COLUMN projects.invoice_notes IS 'Additional invoice notes';
