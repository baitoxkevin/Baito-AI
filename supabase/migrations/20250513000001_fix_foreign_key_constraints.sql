-- Fix foreign key constraints and relational issues
-- migration_name: fix_foreign_key_constraints

-- First, drop the existing foreign key constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'projects_client_id_fkey' 
    AND table_name = 'projects'
  ) THEN
    ALTER TABLE "public"."projects" DROP CONSTRAINT "projects_client_id_fkey";
  END IF;
END
$$;

-- Fix the client_id foreign key to reference multiple tables
-- Option 1: Make client_id nullable
ALTER TABLE "public"."projects" 
  ALTER COLUMN "client_id" DROP NOT NULL;

-- Option 2: Add FK constraint to companies table if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'companies' 
    AND table_schema = 'public'
  ) THEN
    -- First, check if the constraint already exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'projects_client_id_companies_fkey' 
      AND table_name = 'projects'
    ) THEN
      -- Add foreign key to companies table
      ALTER TABLE "public"."projects"
      ADD CONSTRAINT "projects_client_id_companies_fkey"
      FOREIGN KEY ("client_id")
      REFERENCES "public"."companies"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE
      DEFERRABLE INITIALLY IMMEDIATE
      NOT VALID; -- Not valid to allow existing data that might not match
    END IF;
  END IF;
END
$$;

-- Check for clients table and add FK if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'clients' 
    AND table_schema = 'public'
  ) THEN
    -- First, check if the constraint already exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'projects_client_id_clients_fkey' 
      AND table_name = 'projects'
    ) THEN
      -- Add foreign key to clients table
      ALTER TABLE "public"."projects"
      ADD CONSTRAINT "projects_client_id_clients_fkey"
      FOREIGN KEY ("client_id")
      REFERENCES "public"."clients"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE
      DEFERRABLE INITIALLY IMMEDIATE
      NOT VALID; -- Not valid to allow existing data that might not match
    END IF;
  END IF;
END
$$;

-- Check for users table and add FK if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'users' 
    AND table_schema = 'public'
  ) THEN
    -- First, check if the constraint already exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'projects_client_id_users_fkey' 
      AND table_name = 'projects'
    ) THEN
      -- Add foreign key to users table
      ALTER TABLE "public"."projects"
      ADD CONSTRAINT "projects_client_id_users_fkey"
      FOREIGN KEY ("client_id")
      REFERENCES "public"."users"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE
      DEFERRABLE INITIALLY IMMEDIATE
      NOT VALID; -- Not valid to allow existing data that might not match
    END IF;
  END IF;
END
$$;

-- Also check and fix manager_id FK constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'projects_manager_id_fkey' 
    AND table_name = 'projects'
  ) THEN
    ALTER TABLE "public"."projects" DROP CONSTRAINT "projects_manager_id_fkey";
  END IF;
END
$$;

-- Make manager_id nullable
ALTER TABLE "public"."projects" 
  ALTER COLUMN "manager_id" DROP NOT NULL;

-- Check for users table and add FK for manager_id if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'users' 
    AND table_schema = 'public'
  ) THEN
    -- First, check if the constraint already exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'projects_manager_id_users_fkey' 
      AND table_name = 'projects'
    ) THEN
      -- Add foreign key to users table
      ALTER TABLE "public"."projects"
      ADD CONSTRAINT "projects_manager_id_users_fkey"
      FOREIGN KEY ("manager_id")
      REFERENCES "public"."users"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE
      DEFERRABLE INITIALLY IMMEDIATE
      NOT VALID; -- Not valid to allow existing data that might not match
    END IF;
  END IF;
END
$$;

-- Ensure there's a clients table if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'clients' 
    AND table_schema = 'public'
  ) THEN
    -- Create clients table
    CREATE TABLE IF NOT EXISTS "public"."clients" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "full_name" text NOT NULL,
      "company_name" text,
      "email" text,
      "contact_phone" text,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now(),
      "deleted_at" timestamptz,
      "deleted_by" uuid,
      CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
    );

    -- Add RLS policies for clients table
    ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;

    -- Create RLS policies
    CREATE POLICY "Clients are viewable by authenticated users"
      ON "public"."clients"
      FOR SELECT
      TO authenticated
      USING (deleted_at IS NULL);

    CREATE POLICY "Clients can be inserted by authenticated users"
      ON "public"."clients"
      FOR INSERT
      TO authenticated
      WITH CHECK (true);

    CREATE POLICY "Clients can be updated by authenticated users"
      ON "public"."clients"
      FOR UPDATE
      TO authenticated
      USING (deleted_at IS NULL)
      WITH CHECK (true);
  END IF;
END
$$;

-- Check for proper indexes for improved performance
DO $$
BEGIN
  -- Create index on client_id for projects table if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'projects' 
    AND indexname = 'projects_client_id_idx'
  ) THEN
    CREATE INDEX IF NOT EXISTS "projects_client_id_idx" ON "public"."projects" ("client_id");
  END IF;

  -- Create index on manager_id for projects table if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'projects' 
    AND indexname = 'projects_manager_id_idx'
  ) THEN
    CREATE INDEX IF NOT EXISTS "projects_manager_id_idx" ON "public"."projects" ("manager_id");
  END IF;

  -- Create index on start_date and end_date for projects table for faster date range queries
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'projects' 
    AND indexname = 'projects_date_range_idx'
  ) THEN
    CREATE INDEX IF NOT EXISTS "projects_date_range_idx" ON "public"."projects" ("start_date", "end_date");
  END IF;
END
$$;

-- Make sure the JSONB array fields are properly handled
DO $$
BEGIN
  -- Check if recurrence_days column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' 
    AND column_name = 'recurrence_days'
    AND table_schema = 'public'
  ) THEN
    -- Check if the column type is jsonb, if not, convert it
    IF (
      SELECT data_type FROM information_schema.columns 
      WHERE table_name = 'projects' 
      AND column_name = 'recurrence_days'
      AND table_schema = 'public'
    ) <> 'jsonb' THEN
      ALTER TABLE "public"."projects" 
      ALTER COLUMN "recurrence_days" TYPE jsonb USING to_jsonb(recurrence_days);
    END IF;
  ELSE
    -- Add the column if it doesn't exist
    ALTER TABLE "public"."projects" 
    ADD COLUMN IF NOT EXISTS "recurrence_days" jsonb;
  END IF;
END
$$;