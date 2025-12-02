-- ROLLBACK Migration: Remove Multi-Schedule Support
-- Date: 2025-10-09
-- Purpose: Safely rollback multi-schedule changes if needed
-- Author: Kevin
-- WARNING: This will delete all gig_schedules and gig_locations data!

-- ============================================
-- STEP 1: Drop RLS policies
-- ============================================

-- Drop gig_schedules policies
DROP POLICY IF EXISTS "gig_schedules_select_public" ON gig_schedules;
DROP POLICY IF EXISTS "gig_schedules_select_own" ON gig_schedules;
DROP POLICY IF EXISTS "gig_schedules_insert_employer" ON gig_schedules;
DROP POLICY IF EXISTS "gig_schedules_update_employer" ON gig_schedules;
DROP POLICY IF EXISTS "gig_schedules_delete_employer" ON gig_schedules;

-- Drop gig_locations policies
DROP POLICY IF EXISTS "gig_locations_select_public" ON gig_locations;
DROP POLICY IF EXISTS "gig_locations_select_own" ON gig_locations;
DROP POLICY IF EXISTS "gig_locations_insert_employer" ON gig_locations;
DROP POLICY IF EXISTS "gig_locations_update_employer" ON gig_locations;
DROP POLICY IF EXISTS "gig_locations_delete_employer" ON gig_locations;

-- ============================================
-- STEP 2: Drop triggers
-- ============================================

DROP TRIGGER IF EXISTS trigger_validate_no_overlapping_schedules ON gig_schedules;
DROP TRIGGER IF EXISTS trigger_gig_schedules_updated_at ON gig_schedules;
DROP TRIGGER IF EXISTS trigger_gig_locations_updated_at ON gig_locations;

-- ============================================
-- STEP 3: Drop functions
-- ============================================

DROP FUNCTION IF EXISTS validate_no_overlapping_schedules();
-- Note: update_updated_at_column() is shared, don't drop it

-- ============================================
-- STEP 4: Drop view
-- ============================================

DROP VIEW IF EXISTS gigs_with_schedule;

-- ============================================
-- STEP 5: Drop foreign key constraint
-- ============================================

ALTER TABLE gig_schedules
DROP CONSTRAINT IF EXISTS fk_gig_schedules_location;

-- ============================================
-- STEP 6: Drop tables (CASCADE will remove dependent objects)
-- ============================================

DROP TABLE IF EXISTS gig_schedules CASCADE;
DROP TABLE IF EXISTS gig_locations CASCADE;

-- ============================================
-- STEP 7: Remove column from gigs table
-- ============================================

ALTER TABLE gigs
DROP COLUMN IF EXISTS is_multi_schedule;

-- Drop index
DROP INDEX IF EXISTS idx_gigs_multi_schedule;

-- ============================================
-- ROLLBACK COMPLETE
-- ============================================

-- Summary:
-- ✓ Removed is_multi_schedule flag from gigs table
-- ✓ Dropped gig_schedules table and all its data
-- ✓ Dropped gig_locations table and all its data
-- ✓ Removed all triggers, functions, views, and policies
-- ✓ System restored to single-schedule only mode
-- ⚠️ All multi-schedule data has been permanently deleted!
