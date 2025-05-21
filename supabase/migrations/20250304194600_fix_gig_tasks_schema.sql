-- Ensure the gig_tasks table has all the columns needed for the kanban board

-- Simply add columns (if they exist, the statements will fail but that's okay)
ALTER TABLE gig_tasks ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE gig_tasks ADD COLUMN IF NOT EXISTS status text DEFAULT 'backlog';
ALTER TABLE gig_tasks ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium';
ALTER TABLE gig_tasks ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Refresh schema cache to make new columns available
NOTIFY pgrst, 'reload schema';