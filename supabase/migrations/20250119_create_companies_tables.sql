-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  company_name TEXT NOT NULL,
  company_email TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create company_contacts table
CREATE TABLE IF NOT EXISTS company_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  designation TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_company_contacts_company_id ON company_contacts(company_id);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_contacts ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all companies and contacts
CREATE POLICY "Users can view all companies" ON companies
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view all company contacts" ON company_contacts
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to create companies and contacts
CREATE POLICY "Users can create companies" ON companies
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can create company contacts" ON company_contacts
  FOR INSERT TO authenticated WITH CHECK (true);

-- Allow authenticated users to update companies and contacts
CREATE POLICY "Users can update companies" ON companies
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can update company contacts" ON company_contacts
  FOR UPDATE TO authenticated USING (true);

-- Insert some sample data
INSERT INTO companies (id, name, company_name, company_email, logo_url) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Acme Corp', 'Acme Corporation', 'contact@acme.com', 'https://via.placeholder.com/150'),
  ('22222222-2222-2222-2222-222222222222', 'Tech Solutions', 'Tech Solutions Inc', 'info@techsolutions.com', 'https://via.placeholder.com/150'),
  ('33333333-3333-3333-3333-333333333333', 'Global Events', 'Global Events Ltd', 'hello@globalevents.com', 'https://via.placeholder.com/150')
ON CONFLICT (id) DO NOTHING;

-- Insert sample contacts
INSERT INTO company_contacts (company_id, name, email, designation) VALUES
  ('11111111-1111-1111-1111-111111111111', 'John Smith', 'john@acme.com', 'CEO'),
  ('11111111-1111-1111-1111-111111111111', 'Jane Doe', 'jane@acme.com', 'Project Manager'),
  ('22222222-2222-2222-2222-222222222222', 'Bob Johnson', 'bob@techsolutions.com', 'CTO'),
  ('33333333-3333-3333-3333-333333333333', 'Alice Brown', 'alice@globalevents.com', 'Event Director');