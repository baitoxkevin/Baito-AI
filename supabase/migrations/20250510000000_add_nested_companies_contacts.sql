-- Add parent_id column to companies table for hierarchical relationships
ALTER TABLE IF EXISTS companies 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES companies(id) ON DELETE SET NULL;

-- Add index for faster parent_id lookups
CREATE INDEX IF NOT EXISTS idx_companies_parent_id ON companies(parent_id);

-- Create company_contacts table for multiple contacts per company
CREATE TABLE IF NOT EXISTS company_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  designation TEXT,
  email TEXT,
  phone TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on company_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_company_contacts_company_id ON company_contacts(company_id);

-- Create index on is_primary for faster queries to find primary contacts
CREATE INDEX IF NOT EXISTS idx_company_contacts_is_primary ON company_contacts(is_primary) WHERE is_primary = true;

-- Enable RLS for the company_contacts table
ALTER TABLE company_contacts ENABLE ROW LEVEL SECURITY;

-- Create policies to match the companies table permissions
CREATE POLICY "Enable read access for all authenticated users" 
ON company_contacts FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Enable insert for authenticated users" 
ON company_contacts FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" 
ON company_contacts FOR UPDATE 
TO authenticated 
USING (true);

-- Helper function to migrate existing PIC data to company_contacts
CREATE OR REPLACE FUNCTION migrate_company_pics_to_contacts()
RETURNS void AS $$
BEGIN
  -- Insert existing PIC data into company_contacts table
  INSERT INTO company_contacts (company_id, name, designation, email, phone, is_primary)
  SELECT 
    id as company_id, 
    pic_name as name, 
    pic_designation as designation, 
    pic_email as email, 
    pic_phone as phone, 
    true as is_primary
  FROM companies
  WHERE pic_name IS NOT NULL AND pic_name != '';
END;
$$ LANGUAGE plpgsql;

-- Run the migration function (commented out until ready to run)
-- SELECT migrate_company_pics_to_contacts();