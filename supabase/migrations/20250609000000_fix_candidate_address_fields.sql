-- Migration to add address JSON columns to candidates table

-- First, check if the column exists to prevent errors
DO $$
BEGIN
    -- Add address_business column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'candidates' 
        AND column_name = 'address_business'
    ) THEN
        ALTER TABLE candidates 
        ADD COLUMN address_business JSONB DEFAULT NULL;
    END IF;

    -- Add address_mailing column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'candidates' 
        AND column_name = 'address_mailing'
    ) THEN
        ALTER TABLE candidates 
        ADD COLUMN address_mailing JSONB DEFAULT NULL;
    END IF;

    -- Add full_body_photos array column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'candidates' 
        AND column_name = 'full_body_photos'
    ) THEN
        ALTER TABLE candidates 
        ADD COLUMN full_body_photos TEXT[] DEFAULT '{}';
    END IF;

    -- Add half_body_photos array column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'candidates' 
        AND column_name = 'half_body_photos'
    ) THEN
        ALTER TABLE candidates 
        ADD COLUMN half_body_photos TEXT[] DEFAULT '{}';
    END IF;

    -- Add is_customer column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'candidates' 
        AND column_name = 'is_customer'
    ) THEN
        ALTER TABLE candidates 
        ADD COLUMN is_customer BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add is_supplier column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'candidates' 
        AND column_name = 'is_supplier'
    ) THEN
        ALTER TABLE candidates 
        ADD COLUMN is_supplier BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add entity_type column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'candidates' 
        AND column_name = 'entity_type'
    ) THEN
        ALTER TABLE candidates 
        ADD COLUMN entity_type VARCHAR(50) DEFAULT 'individual';
    END IF;

    -- Add registration_type column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'candidates' 
        AND column_name = 'registration_type'
    ) THEN
        ALTER TABLE candidates 
        ADD COLUMN registration_type VARCHAR(50) DEFAULT 'nric';
    END IF;

    -- Add old_registration_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'candidates' 
        AND column_name = 'old_registration_id'
    ) THEN
        ALTER TABLE candidates 
        ADD COLUMN old_registration_id VARCHAR(100) DEFAULT NULL;
    END IF;

    -- Add tin column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'candidates' 
        AND column_name = 'tin'
    ) THEN
        ALTER TABLE candidates 
        ADD COLUMN tin VARCHAR(100) DEFAULT NULL;
    END IF;

    -- Add sst_registration_no column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'candidates' 
        AND column_name = 'sst_registration_no'
    ) THEN
        ALTER TABLE candidates 
        ADD COLUMN sst_registration_no VARCHAR(100) DEFAULT NULL;
    END IF;

    -- Add the financial columns if they don't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'candidates' 
        AND column_name = 'receivable_ac_code'
    ) THEN
        ALTER TABLE candidates 
        ADD COLUMN receivable_ac_code VARCHAR(100) DEFAULT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'candidates' 
        AND column_name = 'payable_ac_code'
    ) THEN
        ALTER TABLE candidates 
        ADD COLUMN payable_ac_code VARCHAR(100) DEFAULT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'candidates' 
        AND column_name = 'income_ac_code'
    ) THEN
        ALTER TABLE candidates 
        ADD COLUMN income_ac_code VARCHAR(100) DEFAULT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'candidates' 
        AND column_name = 'expense_ac_code'
    ) THEN
        ALTER TABLE candidates 
        ADD COLUMN expense_ac_code VARCHAR(100) DEFAULT NULL;
    END IF;

END $$;

-- Add comments for documentation
COMMENT ON COLUMN candidates.address_business IS 'JSON structure containing the business address details';
COMMENT ON COLUMN candidates.address_mailing IS 'JSON structure containing the mailing address details';
COMMENT ON COLUMN candidates.full_body_photos IS 'Array of URLs for full body photos';
COMMENT ON COLUMN candidates.half_body_photos IS 'Array of URLs for half body photos';
COMMENT ON COLUMN candidates.is_customer IS 'Flag indicating if this candidate is also a customer';
COMMENT ON COLUMN candidates.is_supplier IS 'Flag indicating if this candidate is also a supplier';
COMMENT ON COLUMN candidates.entity_type IS 'Type of entity (individual, company, etc.)';
COMMENT ON COLUMN candidates.registration_type IS 'Type of registration document (nric, passport, etc.)';
COMMENT ON COLUMN candidates.tin IS 'Tax Identification Number';
COMMENT ON COLUMN candidates.sst_registration_no IS 'Sales and Service Tax registration number';
COMMENT ON COLUMN candidates.receivable_ac_code IS 'Accounts receivable code';
COMMENT ON COLUMN candidates.payable_ac_code IS 'Accounts payable code';
COMMENT ON COLUMN candidates.income_ac_code IS 'Income account code';
COMMENT ON COLUMN candidates.expense_ac_code IS 'Expense account code';