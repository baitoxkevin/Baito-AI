/*
  # Add shirt_size and languages_spoken to candidates table

  1. Changes
    - Add shirt_size column as TEXT (not ENUM for flexibility)
    - Add languages_spoken column as TEXT (comma-separated values)
    - Add other missing fields from the form:
      - gender as TEXT (not ENUM for flexibility)
      - date_of_birth as DATE
      - nationality as TEXT
      - emergency_contact_name as TEXT
      - emergency_contact_number as TEXT
      - emergency_contact_relationship as TEXT
      - bank_name as TEXT
      - bank_account_number as TEXT
      - bank_account_name as TEXT
      - bank_account_relationship as TEXT
      - highest_education as TEXT
      - field_of_study as TEXT
      - has_vehicle as BOOLEAN
      - vehicle_type as TEXT
      - work_experience as TEXT
      - race as TEXT
      - not_own_account as BOOLEAN
    
  2. Security
    - No changes to RLS policies needed
    - All columns are nullable to maintain backward compatibility
*/

-- Add shirt_size column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'candidates' 
        AND column_name = 'shirt_size'
    ) THEN
        ALTER TABLE candidates 
        ADD COLUMN shirt_size TEXT;
    END IF;
END $$;

-- Add languages_spoken column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'candidates' 
        AND column_name = 'languages_spoken'
    ) THEN
        ALTER TABLE candidates 
        ADD COLUMN languages_spoken TEXT;
    END IF;
END $$;

-- Add gender column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'candidates' 
        AND column_name = 'gender'
    ) THEN
        ALTER TABLE candidates 
        ADD COLUMN gender TEXT;
    END IF;
END $$;

-- Add date_of_birth column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'candidates' 
        AND column_name = 'date_of_birth'
    ) THEN
        ALTER TABLE candidates 
        ADD COLUMN date_of_birth DATE;
    END IF;
END $$;

-- Add nationality column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'candidates' 
        AND column_name = 'nationality'
    ) THEN
        ALTER TABLE candidates 
        ADD COLUMN nationality TEXT;
    END IF;
END $$;

-- Add emergency contact fields if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'candidates' 
        AND column_name = 'emergency_contact_name'
    ) THEN
        ALTER TABLE candidates 
        ADD COLUMN emergency_contact_name TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'candidates' 
        AND column_name = 'emergency_contact_number'
    ) THEN
        ALTER TABLE candidates 
        ADD COLUMN emergency_contact_number TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'candidates' 
        AND column_name = 'emergency_contact_relationship'
    ) THEN
        ALTER TABLE candidates 
        ADD COLUMN emergency_contact_relationship TEXT;
    END IF;
END $$;

-- Add bank-related fields if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'candidates' 
        AND column_name = 'bank_name'
    ) THEN
        ALTER TABLE candidates 
        ADD COLUMN bank_name TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'candidates' 
        AND column_name = 'bank_account_number'
    ) THEN
        ALTER TABLE candidates 
        ADD COLUMN bank_account_number TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'candidates' 
        AND column_name = 'bank_account_name'
    ) THEN
        ALTER TABLE candidates 
        ADD COLUMN bank_account_name TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'candidates' 
        AND column_name = 'bank_account_relationship'
    ) THEN
        ALTER TABLE candidates 
        ADD COLUMN bank_account_relationship TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'candidates' 
        AND column_name = 'not_own_account'
    ) THEN
        ALTER TABLE candidates 
        ADD COLUMN not_own_account BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add education fields if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'candidates' 
        AND column_name = 'highest_education'
    ) THEN
        ALTER TABLE candidates 
        ADD COLUMN highest_education TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'candidates' 
        AND column_name = 'field_of_study'
    ) THEN
        ALTER TABLE candidates 
        ADD COLUMN field_of_study TEXT;
    END IF;
END $$;

-- Add vehicle fields if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'candidates' 
        AND column_name = 'has_vehicle'
    ) THEN
        ALTER TABLE candidates 
        ADD COLUMN has_vehicle BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'candidates' 
        AND column_name = 'vehicle_type'
    ) THEN
        ALTER TABLE candidates 
        ADD COLUMN vehicle_type TEXT;
    END IF;
END $$;

-- Add work_experience field if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'candidates' 
        AND column_name = 'work_experience'
    ) THEN
        ALTER TABLE candidates 
        ADD COLUMN work_experience TEXT;
    END IF;
END $$;

-- Add race field if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'candidates' 
        AND column_name = 'race'
    ) THEN
        ALTER TABLE candidates 
        ADD COLUMN race TEXT;
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN candidates.shirt_size IS 'Shirt size for uniforms (XS, S, M, L, XL, XXL, XXXL)';
COMMENT ON COLUMN candidates.languages_spoken IS 'Languages spoken by the candidate (comma-separated)';
COMMENT ON COLUMN candidates.gender IS 'Gender of the candidate (male, female, other)';
COMMENT ON COLUMN candidates.date_of_birth IS 'Date of birth of the candidate';
COMMENT ON COLUMN candidates.nationality IS 'Nationality of the candidate';
COMMENT ON COLUMN candidates.emergency_contact_name IS 'Name of emergency contact person';
COMMENT ON COLUMN candidates.emergency_contact_number IS 'Phone number of emergency contact';
COMMENT ON COLUMN candidates.emergency_contact_relationship IS 'Relationship with emergency contact';
COMMENT ON COLUMN candidates.bank_name IS 'Name of the bank for salary payments';
COMMENT ON COLUMN candidates.bank_account_number IS 'Bank account number for salary payments';
COMMENT ON COLUMN candidates.bank_account_name IS 'Name on the bank account';
COMMENT ON COLUMN candidates.bank_account_relationship IS 'Relationship if using someone else''s account';
COMMENT ON COLUMN candidates.not_own_account IS 'Flag indicating if using someone else''s bank account';
COMMENT ON COLUMN candidates.highest_education IS 'Highest education level achieved';
COMMENT ON COLUMN candidates.field_of_study IS 'Field of study for highest education';
COMMENT ON COLUMN candidates.has_vehicle IS 'Whether candidate has their own vehicle';
COMMENT ON COLUMN candidates.vehicle_type IS 'Type of vehicle if has_vehicle is true';
COMMENT ON COLUMN candidates.work_experience IS 'Work experience details (free text)';
COMMENT ON COLUMN candidates.race IS 'Race/ethnicity of the candidate';