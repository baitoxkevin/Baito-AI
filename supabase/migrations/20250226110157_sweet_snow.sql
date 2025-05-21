/*
  # Add Company PIC Fields

  1. Changes
    - Add pic_name column to companies table
    - Add pic_designation column to companies table
    - Add pic_email column to companies table
    - Add pic_phone column to companies table
    - Update existing policies to include new fields

  2. Security
    - Maintain existing RLS policies
    - All new fields inherit existing table security
*/

-- Add new columns to companies table
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS pic_name text,
  ADD COLUMN IF NOT EXISTS pic_designation text,
  ADD COLUMN IF NOT EXISTS pic_email text,
  ADD COLUMN IF NOT EXISTS pic_phone text;

-- Create index for PIC email searches
CREATE INDEX IF NOT EXISTS idx_companies_pic_email ON companies (pic_email);

-- Update companies view to include PIC information
CREATE OR REPLACE VIEW company_details AS
SELECT 
  id,
  name,
  contact_email,
  contact_phone,
  address,
  pic_name,
  pic_designation,
  pic_email,
  pic_phone,
  created_at,
  updated_at
FROM companies
WHERE deleted_at IS NULL;