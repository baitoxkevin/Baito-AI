-- Add enhanced API functions for staff payroll
-- This migration adds new functions for interacting with payroll data from the client side

-- First, ensure that the project_staff table exists (stores candidate assignments to projects with salary info)
CREATE TABLE IF NOT EXISTS "public"."project_staff" (
  "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "project_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "designation" TEXT,
  "photo" TEXT,
  "working_dates" DATE[] DEFAULT '{}',
  "apply_type" TEXT DEFAULT 'full',
  "working_dates_with_salary" JSONB DEFAULT '[]'::jsonb,
  PRIMARY KEY ("id"),
  CONSTRAINT "project_staff_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE
);

-- Add comment explaining the column format if the table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'project_staff'
    AND column_name = 'working_dates_with_salary'
  ) THEN
    COMMENT ON COLUMN "public"."project_staff"."working_dates_with_salary" IS 
      'Array of objects with format: {date: "YYYY-MM-DD", basicSalary: number, claims: number, commission: number}';
  END IF;
END
$$;

-- Create index on project_id if it doesn't exist
CREATE INDEX IF NOT EXISTS project_staff_project_id_idx ON project_staff(project_id);

-- Now, ensure that we have a trigger to keep the working_dates array in sync
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

-- Create the trigger only if the table exists
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  -- Check if the table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'project_staff'
  ) INTO table_exists;
  
  -- Only create the trigger if the table exists
  IF table_exists THEN
    -- Drop the trigger if it exists, then recreate it
    DROP TRIGGER IF EXISTS sync_working_dates_trigger ON project_staff;
    
    CREATE TRIGGER sync_working_dates_trigger
    BEFORE INSERT OR UPDATE ON project_staff
    FOR EACH ROW
    WHEN (NEW.working_dates_with_salary IS NOT NULL)
    EXECUTE FUNCTION sync_working_dates();
  END IF;
END
$$;

-- Check if the tables exist before creating functions
DO $$
DECLARE
  staff_table_exists BOOLEAN;
  projects_table_exists BOOLEAN;
BEGIN
  -- Check if required tables exist
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'project_staff'
  ) INTO staff_table_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'projects'
  ) INTO projects_table_exists;
  
  -- Only proceed if both tables exist
  IF staff_table_exists AND projects_table_exists THEN
    -- Let PostgreSQL know we're creating objects with specific functions
    RAISE NOTICE 'Creating payroll functions - tables exist';
  END IF;
END
$$;

-- Function to save staff payroll - only create if the tables exist
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'project_staff'
  ) THEN
    -- Now create the function
    EXECUTE $func$
    CREATE OR REPLACE FUNCTION save_staff_payroll(
      p_staff_id UUID,
      p_working_dates_with_salary JSONB
    ) RETURNS BOOLEAN AS $body$
    DECLARE
      v_count INTEGER;
    BEGIN
      -- Validate input
      IF p_staff_id IS NULL OR p_working_dates_with_salary IS NULL THEN
        RAISE EXCEPTION 'Staff ID and working dates with salary are required';
      END IF;
      
      -- Check if staff member exists
      SELECT COUNT(*) INTO v_count FROM project_staff WHERE id = p_staff_id;
      IF v_count = 0 THEN
        RAISE EXCEPTION 'Staff member not found';
      END IF;
      
      -- Update staff payroll data
      UPDATE project_staff
      SET working_dates_with_salary = p_working_dates_with_salary
      WHERE id = p_staff_id;
      
      RETURN TRUE;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE;
    END;
    $body$ LANGUAGE plpgsql SECURITY DEFINER;
    $func$;
  END IF;
END
$$;

-- Function to save project payroll - only create if tables exist
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'project_staff'
  ) AND EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'projects'
  ) THEN
    -- Now create the function
    EXECUTE $func$
    CREATE OR REPLACE FUNCTION save_project_payroll(
      p_project_id UUID,
      p_staff_payroll JSONB -- Array of objects with {id, working_dates_with_salary}
    ) RETURNS BOOLEAN AS $body$
    DECLARE
      v_count INTEGER;
      v_staff JSONB;
    BEGIN
      -- Validate input
      IF p_project_id IS NULL OR p_staff_payroll IS NULL THEN
        RAISE EXCEPTION 'Project ID and staff payroll data are required';
      END IF;
      
      -- Check if project exists
      SELECT COUNT(*) INTO v_count FROM projects WHERE id = p_project_id;
      IF v_count = 0 THEN
        RAISE EXCEPTION 'Project not found';
      END IF;
      
      -- Process each staff member's payroll data
      FOR v_staff IN SELECT * FROM jsonb_array_elements(p_staff_payroll)
      LOOP
        -- Update the staff member's payroll data
        UPDATE project_staff
        SET working_dates_with_salary = v_staff->'working_dates_with_salary'
        WHERE id = (v_staff->>'id')::UUID AND project_id = p_project_id;
      END LOOP;
      
      RETURN TRUE;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE;
    END;
    $body$ LANGUAGE plpgsql SECURITY DEFINER;
    $func$;
  END IF;
END
$$;

-- Function to get payroll by date - only create if tables exist
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'project_staff'
  ) AND EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'projects'
  ) THEN
    -- Now create the function
    EXECUTE $func$
    CREATE OR REPLACE FUNCTION get_payroll_by_date_range(
      p_start_date DATE,
      p_end_date DATE
    ) RETURNS TABLE (
      project_id UUID,
      project_title TEXT,
      staff_id UUID,
      staff_name TEXT,
      work_date DATE,
      basic_salary DECIMAL,
      claims DECIMAL,
      commission DECIMAL,
      total_amount DECIMAL
    ) AS $body$
    BEGIN
      RETURN QUERY
      WITH staff_dates AS (
        SELECT 
          ps.project_id,
          p.title as project_title,
          ps.id as staff_id,
          ps.name as staff_name,
          (item->>'date')::DATE as work_date,
          COALESCE((item->>'basicSalary')::DECIMAL, 0) as basic_salary,
          COALESCE((item->>'claims')::DECIMAL, 0) as claims,
          COALESCE((item->>'commission')::DECIMAL, 0) as commission
        FROM 
          project_staff ps
          JOIN projects p ON ps.project_id = p.id,
          jsonb_array_elements(ps.working_dates_with_salary) as item
        WHERE 
          (item->>'date')::DATE BETWEEN p_start_date AND p_end_date
      )
      SELECT 
        sd.project_id,
        sd.project_title,
        sd.staff_id,
        sd.staff_name,
        sd.work_date,
        sd.basic_salary,
        sd.claims,
        sd.commission,
        sd.basic_salary + sd.claims + sd.commission as total_amount
      FROM 
        staff_dates sd
      ORDER BY
        sd.project_title,
        sd.staff_name,
        sd.work_date;
    END;
    $body$ LANGUAGE plpgsql;
    $func$;
  END IF;
END
$$;

-- Add RLS policies for secure access
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  -- Check if the table exists first
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'project_staff'
  ) INTO table_exists;
  
  -- Only proceed if the table exists
  IF table_exists THEN
    -- Enable row level security
    ALTER TABLE IF EXISTS "public"."project_staff" ENABLE ROW LEVEL SECURITY;
    
    -- Add policy for read access
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'project_staff' AND policyname = 'Enable read access for all users'
    ) THEN
      CREATE POLICY "Enable read access for all users" 
        ON "public"."project_staff" FOR SELECT USING (true);
    END IF;
    
    -- Add policy for insert access
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'project_staff' AND policyname = 'Enable insert for authenticated users only'
    ) THEN
      CREATE POLICY "Enable insert for authenticated users only" 
        ON "public"."project_staff" FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;
    
    -- Add policy for project payroll updates
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'project_staff' AND policyname = 'Enable payroll update for authenticated users'
    ) THEN
      CREATE POLICY "Enable payroll update for authenticated users" 
        ON "public"."project_staff" 
        FOR UPDATE 
        USING (auth.role() = 'authenticated')
        WITH CHECK (auth.role() = 'authenticated');
    END IF;
  END IF;
END
$$;