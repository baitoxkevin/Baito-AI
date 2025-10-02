-- Add simple text address fields to candidates table

-- Add home_address column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'candidates' 
        AND column_name = 'home_address'
    ) THEN
        ALTER TABLE candidates 
        ADD COLUMN home_address TEXT DEFAULT NULL;
    END IF;

    -- Add business_address column if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'candidates' 
        AND column_name = 'business_address'
    ) THEN
        ALTER TABLE candidates 
        ADD COLUMN business_address TEXT DEFAULT NULL;
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN candidates.home_address IS 'Home address as simple text';
COMMENT ON COLUMN candidates.business_address IS 'Business address as simple text';