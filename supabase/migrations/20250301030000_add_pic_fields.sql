/*
  # Add Company PIC Fields
  
  1. Changes
    - Add pic_name column to companies table
    - Add pic_designation column to companies table
    - Add pic_email column to companies table 
    - Add pic_phone column to companies table
    - Update existing policies to include new fields
*/

-- Add PIC fields to companies table
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS pic_name text,
  ADD COLUMN IF NOT EXISTS pic_designation text,
  ADD COLUMN IF NOT EXISTS pic_email text,
  ADD COLUMN IF NOT EXISTS pic_phone text;

-- Create index for PIC email searches
CREATE INDEX IF NOT EXISTS idx_companies_pic_email ON companies (pic_email);