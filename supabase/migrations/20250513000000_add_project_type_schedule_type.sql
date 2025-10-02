-- Add missing columns to the projects table for proper scheduling and categorization
-- migration_name: add_project_type_schedule_type

-- Add project_type column with a check constraint to ensure it's one of the allowed values
ALTER TABLE "public"."projects" 
ADD COLUMN IF NOT EXISTS "project_type" text DEFAULT 'custom'::text;

-- Set up a check constraint for project_type
DO $$
BEGIN
    -- Drop the constraint if it already exists (to avoid errors if re-running)
    BEGIN
        ALTER TABLE "public"."projects" DROP CONSTRAINT IF EXISTS "projects_project_type_check";
    EXCEPTION
        WHEN undefined_object THEN
        -- Constraint doesn't exist, nothing to do
    END;
    
    -- Create the check constraint
    ALTER TABLE "public"."projects" 
    ADD CONSTRAINT "projects_project_type_check" 
    CHECK (project_type::text = ANY (ARRAY['recruitment'::text, 'internal_event'::text, 'custom'::text]));
END
$$;

-- Add schedule_type column with a check constraint to ensure it's one of the allowed values
ALTER TABLE "public"."projects" 
ADD COLUMN IF NOT EXISTS "schedule_type" text DEFAULT 'single'::text;

-- Set up a check constraint for schedule_type
DO $$
BEGIN
    -- Drop the constraint if it already exists (to avoid errors if re-running)
    BEGIN
        ALTER TABLE "public"."projects" DROP CONSTRAINT IF EXISTS "projects_schedule_type_check";
    EXCEPTION
        WHEN undefined_object THEN
        -- Constraint doesn't exist, nothing to do
    END;
    
    -- Create the check constraint
    ALTER TABLE "public"."projects" 
    ADD CONSTRAINT "projects_schedule_type_check" 
    CHECK (schedule_type::text = ANY (ARRAY['single'::text, 'recurring'::text, 'multiple'::text]));
END
$$;

-- Update RLS policies to include the new columns
DO $$
BEGIN
    -- Update the select policy
    BEGIN
        DROP POLICY IF EXISTS "Projects are viewable by authenticated users" ON "public"."projects";
        
        CREATE POLICY "Projects are viewable by authenticated users"
        ON "public"."projects"
        FOR SELECT
        TO authenticated
        USING (deleted_at IS NULL);
    EXCEPTION
        WHEN undefined_object THEN
        -- Policy doesn't exist, just create it
        CREATE POLICY "Projects are viewable by authenticated users"
        ON "public"."projects"
        FOR SELECT
        TO authenticated
        USING (deleted_at IS NULL);
    END;
    
    -- Update the insert policy
    BEGIN
        DROP POLICY IF EXISTS "Projects can be inserted by authenticated users" ON "public"."projects";
        
        CREATE POLICY "Projects can be inserted by authenticated users"
        ON "public"."projects"
        FOR INSERT
        TO authenticated
        WITH CHECK (true);
    EXCEPTION
        WHEN undefined_object THEN
        -- Policy doesn't exist, just create it
        CREATE POLICY "Projects can be inserted by authenticated users"
        ON "public"."projects"
        FOR INSERT
        TO authenticated
        WITH CHECK (true);
    END;
    
    -- Update the update policy
    BEGIN
        DROP POLICY IF EXISTS "Projects can be updated by authenticated users" ON "public"."projects";
        
        CREATE POLICY "Projects can be updated by authenticated users"
        ON "public"."projects"
        FOR UPDATE
        TO authenticated
        USING (deleted_at IS NULL)
        WITH CHECK (true);
    EXCEPTION
        WHEN undefined_object THEN
        -- Policy doesn't exist, just create it
        CREATE POLICY "Projects can be updated by authenticated users"
        ON "public"."projects"
        FOR UPDATE
        TO authenticated
        USING (deleted_at IS NULL)
        WITH CHECK (true);
    END;
END
$$;