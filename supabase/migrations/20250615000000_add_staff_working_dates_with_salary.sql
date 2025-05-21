-- Add enhanced working dates functionality to project_staff
-- This migration adds support for storing working dates with salary information
-- Each staff member can have specific dates they work with associated salary data

-- First, ensure project_staff table has necessary columns
ALTER TABLE IF EXISTS "public"."project_staff" 
  ADD COLUMN IF NOT EXISTS "working_dates" DATE[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "apply_type" TEXT DEFAULT 'full';

-- Create JSONB column for storing working dates with salary information
ALTER TABLE IF EXISTS "public"."project_staff" 
  ADD COLUMN IF NOT EXISTS "working_dates_with_salary" JSONB DEFAULT '[]'::jsonb;

-- Add comment explaining the column format
COMMENT ON COLUMN "public"."project_staff"."working_dates_with_salary" IS 
  'Array of objects with format: {date: "YYYY-MM-DD", basicSalary: number, claims: number, commission: number}';

-- Create function to extract all working dates from working_dates_with_salary
CREATE OR REPLACE FUNCTION extract_working_dates(dates_with_salary JSONB)
RETURNS DATE[] AS $$
DECLARE
  result DATE[] := '{}';
  item JSONB;
BEGIN
  IF dates_with_salary IS NULL OR jsonb_array_length(dates_with_salary) = 0 THEN
    RETURN result;
  END IF;
  
  FOR item IN SELECT * FROM jsonb_array_elements(dates_with_salary)
  LOOP
    IF item->>'date' IS NOT NULL THEN
      result := array_append(result, (item->>'date')::DATE);
    END IF;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add trigger to automatically update the working_dates array
CREATE OR REPLACE FUNCTION sync_working_dates()
RETURNS TRIGGER AS $$
BEGIN
  -- Extract simple dates from working_dates_with_salary
  NEW.working_dates := extract_working_dates(NEW.working_dates_with_salary);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists, then recreate it
DROP TRIGGER IF EXISTS sync_working_dates_trigger ON project_staff;

CREATE TRIGGER sync_working_dates_trigger
BEFORE INSERT OR UPDATE ON project_staff
FOR EACH ROW
WHEN (NEW.working_dates_with_salary IS NOT NULL)
EXECUTE FUNCTION sync_working_dates();

-- Create index on working_dates for faster query performance
CREATE INDEX IF NOT EXISTS project_staff_working_dates_idx 
  ON project_staff USING GIN (working_dates);

-- Add RLS policy
ALTER TABLE "public"."project_staff" ENABLE ROW LEVEL SECURITY;

-- Ensure we have policies for reading and updating (if not already created)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'project_staff' AND policyname = 'Enable read access for all users'
  ) THEN
    CREATE POLICY "Enable read access for all users" 
      ON "public"."project_staff" FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'project_staff' AND policyname = 'Enable insert for authenticated users only'
  ) THEN
    CREATE POLICY "Enable insert for authenticated users only" 
      ON "public"."project_staff" FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'project_staff' AND policyname = 'Enable update for authenticated users only'
  ) THEN
    CREATE POLICY "Enable update for authenticated users only" 
      ON "public"."project_staff" FOR UPDATE USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END
$$;