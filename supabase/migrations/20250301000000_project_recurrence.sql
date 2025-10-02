/*
  # Create Project Recurrence and Multiple Locations Support
  
  This migration adds support for recurring projects and projects with multiple locations.
*/

-- Create the project_locations table if it doesn't exist
CREATE OR REPLACE FUNCTION create_project_locations_if_not_exists() 
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'project_locations'
  ) THEN
    CREATE TABLE public.project_locations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
      address text NOT NULL,
      date date NOT NULL,
      is_primary boolean DEFAULT false,
      notes text,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now()
    );
    
    -- Add RLS policies
    ALTER TABLE public.project_locations ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Enable all for authenticated users" ON public.project_locations
      FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create the project_recurrence table if it doesn't exist
CREATE OR REPLACE FUNCTION create_project_recurrence_if_not_exists() 
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'project_recurrence'
  ) THEN
    CREATE TABLE public.project_recurrence (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
      pattern text NOT NULL,
      days integer[] DEFAULT '{}',
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now()
    );
    
    -- Add RLS policies
    ALTER TABLE public.project_recurrence ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Enable all for authenticated users" ON public.project_recurrence
      FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Execute functions to create tables if they don't exist
SELECT create_project_locations_if_not_exists();
SELECT create_project_recurrence_if_not_exists();