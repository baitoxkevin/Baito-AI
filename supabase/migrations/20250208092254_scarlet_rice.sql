/*
  # Add project details fields

  1. Changes
    - Add new columns to projects table:
      - `end_date` (timestamptz)
      - `working_hours_start` (time)
      - `working_hours_end` (time)
      - `venue_address` (text)
      - `venue_details` (text)
      - `company_name` (text)
      - `contact_name` (text)
      - `contact_email` (text)
      - `contact_phone` (text)
      - `supervisors_required` (integer)

  2. Notes
    - All new fields are nullable to maintain compatibility with existing data
    - Added appropriate indexes for search optimization
*/

DO $$ 
BEGIN
  -- Add new columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'end_date') THEN
    ALTER TABLE projects ADD COLUMN end_date timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'working_hours_start') THEN
    ALTER TABLE projects ADD COLUMN working_hours_start time;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'working_hours_end') THEN
    ALTER TABLE projects ADD COLUMN working_hours_end time;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'venue_address') THEN
    ALTER TABLE projects ADD COLUMN venue_address text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'venue_details') THEN
    ALTER TABLE projects ADD COLUMN venue_details text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'company_name') THEN
    ALTER TABLE projects ADD COLUMN company_name text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'contact_name') THEN
    ALTER TABLE projects ADD COLUMN contact_name text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'contact_email') THEN
    ALTER TABLE projects ADD COLUMN contact_email text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'contact_phone') THEN
    ALTER TABLE projects ADD COLUMN contact_phone text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'supervisors_required') THEN
    ALTER TABLE projects ADD COLUMN supervisors_required integer DEFAULT 0;
  END IF;
END $$;

-- Add indexes for commonly searched fields
CREATE INDEX IF NOT EXISTS idx_projects_company_name ON projects(company_name);
CREATE INDEX IF NOT EXISTS idx_projects_contact_email ON projects(contact_email);
CREATE INDEX IF NOT EXISTS idx_projects_end_date ON projects(end_date);
