-- Add missing columns to receipts table if they don't exist

-- Check and add content_type column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'receipts' 
        AND column_name = 'content_type'
    ) THEN
        ALTER TABLE receipts ADD COLUMN content_type text;
    END IF;
END $$;

-- Check and add file_size column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'receipts' 
        AND column_name = 'file_size'
    ) THEN
        ALTER TABLE receipts ADD COLUMN file_size bigint;
    END IF;
END $$;

-- Check and add description column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'receipts' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE receipts ADD COLUMN description text;
    END IF;
END $$;

-- Check and add amount column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'receipts' 
        AND column_name = 'amount'
    ) THEN
        ALTER TABLE receipts ADD COLUMN amount decimal(10,2);
    END IF;
END $$;

-- Check and add date column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'receipts' 
        AND column_name = 'date'
    ) THEN
        ALTER TABLE receipts ADD COLUMN date date;
    END IF;
END $$;

-- Check and add vendor column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'receipts' 
        AND column_name = 'vendor'
    ) THEN
        ALTER TABLE receipts ADD COLUMN vendor text;
    END IF;
END $$;

-- Check and add category column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'receipts' 
        AND column_name = 'category'
    ) THEN
        ALTER TABLE receipts ADD COLUMN category text;
    END IF;
END $$;

-- Check and add uploaded_by column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'receipts' 
        AND column_name = 'uploaded_by'
    ) THEN
        ALTER TABLE receipts ADD COLUMN uploaded_by uuid REFERENCES users(id);
    END IF;
END $$;

-- Add missing timestamps if needed
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'receipts' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE receipts ADD COLUMN created_at timestamptz DEFAULT now();
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'receipts' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE receipts ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
END $$;

-- Refresh the schema cache to recognize the new columns
COMMENT ON TABLE receipts IS 'Table for storing receipt metadata';