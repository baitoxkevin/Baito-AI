-- Add budget and invoice_number columns to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS budget DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(255);

-- Add comments for documentation
COMMENT ON COLUMN projects.budget IS 'Project budget in RM';
COMMENT ON COLUMN projects.invoice_number IS 'Invoice reference number';