-- Migration to fix and enhance project staff data (confirmed_staff and applicants)

-- Ensure confirmed_staff and applicants are initialized properly for all projects
UPDATE projects
SET confirmed_staff = '[]'::jsonb
WHERE confirmed_staff IS NULL OR confirmed_staff::text = 'null';

UPDATE projects
SET applicants = '[]'::jsonb
WHERE applicants IS NULL OR applicants::text = 'null';

-- Create a function to convert non-JSONB arrays to JSONB arrays
CREATE OR REPLACE FUNCTION fix_project_staff_arrays()
RETURNS void AS $$
BEGIN
  -- Fix any confirmed_staff that might be stored as string or invalid format
  UPDATE projects
  SET confirmed_staff = '[]'::jsonb
  WHERE confirmed_staff IS NOT NULL 
    AND (jsonb_typeof(confirmed_staff) != 'array' OR confirmed_staff::text = '{}');
  
  -- Fix any applicants that might be stored as string or invalid format
  UPDATE projects
  SET applicants = '[]'::jsonb
  WHERE applicants IS NOT NULL 
    AND (jsonb_typeof(applicants) != 'array' OR applicants::text = '{}');
    
  RAISE NOTICE 'Project staff arrays fixed';
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT fix_project_staff_arrays();

-- Create or replace validate_staff_member function to ensure staff data is valid
CREATE OR REPLACE FUNCTION validate_staff_member(staff_member jsonb)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  -- Ensure the staff member has required fields
  result = staff_member;
  
  -- Generate a random ID if not present
  IF NOT (result ? 'id') OR result->>'id' IS NULL THEN
    result = jsonb_set(result, '{id}', to_jsonb('staff_' || substr(md5(random()::text), 1, 8)));
  END IF;
  
  -- Ensure name is present
  IF NOT (result ? 'name') OR result->>'name' IS NULL THEN
    result = jsonb_set(result, '{name}', '"Unknown"');
  END IF;
  
  -- Set status if not present
  IF NOT (result ? 'status') OR result->>'status' IS NULL THEN
    result = jsonb_set(result, '{status}', '"pending"');
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create a function to process and validate staff arrays
CREATE OR REPLACE FUNCTION process_project_staff_arrays()
RETURNS void AS $$
DECLARE
  project_rec record;
  clean_confirmed_staff jsonb;
  clean_applicants jsonb;
BEGIN
  FOR project_rec IN SELECT id, confirmed_staff, applicants FROM projects WHERE confirmed_staff IS NOT NULL OR applicants IS NOT NULL
  LOOP
    -- Process confirmed_staff
    IF project_rec.confirmed_staff IS NOT NULL AND jsonb_typeof(project_rec.confirmed_staff) = 'array' THEN
      clean_confirmed_staff = '[]'::jsonb;
      
      -- Process each staff member
      FOR i IN 0..jsonb_array_length(project_rec.confirmed_staff) - 1 LOOP
        clean_confirmed_staff = clean_confirmed_staff || jsonb_build_array(
          validate_staff_member(project_rec.confirmed_staff->i)
        );
      END LOOP;
      
      -- Update the project with clean data
      UPDATE projects 
      SET confirmed_staff = clean_confirmed_staff
      WHERE id = project_rec.id;
    END IF;
    
    -- Process applicants
    IF project_rec.applicants IS NOT NULL AND jsonb_typeof(project_rec.applicants) = 'array' THEN
      clean_applicants = '[]'::jsonb;
      
      -- Process each applicant
      FOR i IN 0..jsonb_array_length(project_rec.applicants) - 1 LOOP
        clean_applicants = clean_applicants || jsonb_build_array(
          validate_staff_member(project_rec.applicants->i)
        );
      END LOOP;
      
      -- Update the project with clean data
      UPDATE projects 
      SET applicants = clean_applicants
      WHERE id = project_rec.id;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Project staff arrays processed and validated';
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT process_project_staff_arrays();

-- Add a trigger function to ensure staff arrays are always valid on insert/update
CREATE OR REPLACE FUNCTION ensure_valid_staff_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure confirmed_staff is a valid JSONB array or initialize it
  IF NEW.confirmed_staff IS NULL OR jsonb_typeof(NEW.confirmed_staff) != 'array' THEN
    NEW.confirmed_staff = '[]'::jsonb;
  END IF;
  
  -- Ensure applicants is a valid JSONB array or initialize it
  IF NEW.applicants IS NULL OR jsonb_typeof(NEW.applicants) != 'array' THEN
    NEW.applicants = '[]'::jsonb;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on the projects table
DROP TRIGGER IF EXISTS trigger_ensure_valid_staff_data ON projects;
CREATE TRIGGER trigger_ensure_valid_staff_data
BEFORE INSERT OR UPDATE OF confirmed_staff, applicants ON projects
FOR EACH ROW
EXECUTE FUNCTION ensure_valid_staff_data();

-- Create an RPC function to get simplified staff counts for a project
CREATE OR REPLACE FUNCTION get_project_staff_counts(project_id text)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'confirmed_count', COALESCE(jsonb_array_length(confirmed_staff), 0),
    'applicants_count', COALESCE(jsonb_array_length(applicants), 0)
  ) INTO result
  FROM projects
  WHERE id = project_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create an RPC function to add a staff member to a project
CREATE OR REPLACE FUNCTION add_staff_to_project(
  p_project_id text,
  p_staff_data jsonb,
  p_staff_type text DEFAULT 'applicant'
)
RETURNS boolean AS $$
DECLARE
  valid_staff jsonb;
  current_array jsonb;
BEGIN
  -- Validate the staff data
  valid_staff = validate_staff_member(p_staff_data);
  
  -- Default to applicants if not specified
  IF p_staff_type NOT IN ('confirmed', 'applicant') THEN
    p_staff_type := 'applicant';
  END IF;
  
  -- Update the appropriate array
  IF p_staff_type = 'confirmed' THEN
    -- Get current confirmed_staff array
    SELECT confirmed_staff INTO current_array
    FROM projects
    WHERE id = p_project_id;
    
    IF current_array IS NULL THEN
      current_array := '[]'::jsonb;
    END IF;
    
    -- Add the staff member to the array
    UPDATE projects
    SET confirmed_staff = current_array || jsonb_build_array(valid_staff)
    WHERE id = p_project_id;
  ELSE
    -- Get current applicants array
    SELECT applicants INTO current_array
    FROM projects
    WHERE id = p_project_id;
    
    IF current_array IS NULL THEN
      current_array := '[]'::jsonb;
    END IF;
    
    -- Add the staff member to the array
    UPDATE projects
    SET applicants = current_array || jsonb_build_array(valid_staff)
    WHERE id = p_project_id;
  END IF;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;