# Apply CC Stakeholders Migration

## Overview
This migration adds CC (carbon copy) functionality to projects, allowing multiple additional clients and users to be associated with a project beyond the main client and person in charge.

## Migration Steps

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/aoiwrdzlichescqgnohi/editor/sql

2. **Run the Migration**
   - Copy the entire contents of `apply-cc-stakeholders-migration.sql`
   - Paste it into the SQL editor
   - Click "Run" or press Cmd/Ctrl + Enter

3. **Verify the Migration**
   - Check that the following columns exist in the projects table:
     - `cc_client_ids` (UUID array)
     - `cc_user_ids` (UUID array)
   - The migration should complete without errors

## What This Migration Does

1. **Adds New Columns**
   - `cc_client_ids`: Array of additional client company IDs
   - `cc_user_ids`: Array of additional user IDs

2. **Creates Indexes**
   - GIN indexes on both array columns for better query performance

3. **Updates RLS Policies**
   - Users in CC lists can view projects they're involved with

4. **Creates Helper Function**
   - `get_project_stakeholders()`: Returns all stakeholders for a project

## Testing the Feature

After applying the migration:

1. **Edit a Project**
   - Go to any project
   - Click "Edit Project"
   - Look for the new "Additional Stakeholders (CC)" section
   - Add CC clients and CC users
   - Save changes

2. **Verify Data**
   - Run this query to check CC data:
   ```sql
   SELECT 
     title,
     cc_client_ids,
     cc_user_ids
   FROM projects
   WHERE cc_client_ids != '{}' OR cc_user_ids != '{}';
   ```

## Rollback (if needed)

If you need to rollback this migration:
```sql
ALTER TABLE projects 
DROP COLUMN IF EXISTS cc_client_ids,
DROP COLUMN IF EXISTS cc_user_ids;

DROP INDEX IF EXISTS idx_projects_cc_client_ids;
DROP INDEX IF EXISTS idx_projects_cc_user_ids;

DROP FUNCTION IF EXISTS get_project_stakeholders(UUID);
```