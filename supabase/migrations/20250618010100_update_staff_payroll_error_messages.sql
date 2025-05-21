-- Update the database function error messages to use "candidate" terminology

-- Check if the required tables exist
DO $$
DECLARE
  staff_table_exists BOOLEAN;
  projects_table_exists BOOLEAN;
BEGIN
  -- Check if project_staff table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'project_staff'
  ) INTO staff_table_exists;
  
  -- Check if projects table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'projects'
  ) INTO projects_table_exists;
  
  -- Only update functions if tables exist
  IF staff_table_exists AND projects_table_exists THEN
    -- Update save_staff_payroll function to use "candidate" terminology
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
        RAISE EXCEPTION 'Candidate ID and working dates with salary are required';
      END IF;
      
      -- Check if candidate exists in project_staff table
      SELECT COUNT(*) INTO v_count FROM project_staff WHERE id = p_staff_id;
      IF v_count = 0 THEN
        RAISE EXCEPTION 'Candidate not found';
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
    
    -- Update save_project_payroll function to use "candidate" terminology
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
        RAISE EXCEPTION 'Project ID and candidate payroll data are required';
      END IF;
      
      -- Check if project exists
      SELECT COUNT(*) INTO v_count FROM projects WHERE id = p_project_id;
      IF v_count = 0 THEN
        RAISE EXCEPTION 'Project not found';
      END IF;
      
      -- Process each candidate's payroll data
      FOR v_staff IN SELECT * FROM jsonb_array_elements(p_staff_payroll)
      LOOP
        -- Check if this candidate exists
        SELECT COUNT(*) INTO v_count FROM project_staff 
        WHERE id = (v_staff->>'id')::UUID 
        AND project_id = p_project_id;
        
        IF v_count = 0 THEN
          RAISE EXCEPTION 'Candidate not found with ID %', (v_staff->>'id');
        END IF;
        
        -- Update the candidate's payroll data
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