# Multi-Schedule Migration Guide

**Date:** 2025-10-09
**Story:** 1.1 Database Schema for Multi-Schedule Projects
**Status:** Ready for Testing

---

## Migration Summary

### What's Being Added

1. **`gigs.is_multi_schedule`** - Boolean flag (default: `false`)
2. **`gig_schedules`** table - Stores multiple date ranges per gig
3. **`gig_locations`** table - Stores multiple locations per gig
4. **Validation function** - Prevents overlapping schedules
5. **RLS policies** - Inherits security from gigs table
6. **Backward compatibility view** - `gigs_with_schedule`

### Backward Compatibility

✅ **Zero breaking changes** - All existing single-schedule gigs continue working
✅ **Default behavior unchanged** - New gigs default to single-schedule mode (`is_multi_schedule = false`)
✅ **Existing queries work** - Original gigs table fields still function
✅ **Rollback capability** - Safe rollback migration provided

---

## Pre-Migration Checklist

### 1. Backup Database

```bash
# Via Supabase CLI
supabase db dump -f backup_before_multi_schedule_$(date +%Y%m%d_%H%M%S).sql

# Or via Supabase Dashboard
# Settings → Database → Database Backups → Create Manual Backup
```

### 2. Test Environment Setup

**Option A: Local Supabase (Recommended)**

```bash
# Start local Supabase
supabase start

# Reset local database
supabase db reset

# Apply migration
supabase db push
```

**Option B: Staging/Dev Branch**

```bash
# Create development branch (if you have Supabase branching)
supabase branches create test-multi-schedule

# Apply migration to branch
supabase db push --linked --project-ref <branch-ref>
```

### 3. Verify Current Schema

```sql
-- Count existing gigs
SELECT COUNT(*) as total_gigs FROM gigs;

-- Check for any gigs with NULL location or dates (edge cases)
SELECT id, title, venue_name, shift_date
FROM gigs
WHERE venue_name IS NULL OR shift_date IS NULL;
```

---

## Migration Steps

### Step 1: Apply Migration

**Local Development:**

```bash
# Apply migration
supabase db push

# Check migration status
supabase migration list
```

**Production (After testing):**

```bash
# Link to production project
supabase link --project-ref <your-prod-ref>

# Apply migration
supabase db push
```

### Step 2: Verify Migration Success

```sql
-- 1. Check new column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'gigs' AND column_name = 'is_multi_schedule';

-- Expected: is_multi_schedule | boolean | false

-- 2. Check new tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('gig_schedules', 'gig_locations');

-- Expected: 2 rows

-- 3. Verify all existing gigs have is_multi_schedule = false
SELECT is_multi_schedule, COUNT(*) as count
FROM gigs
GROUP BY is_multi_schedule;

-- Expected: false | <total_gig_count>

-- 4. Check trigger exists
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_validate_no_overlapping_schedules';

-- Expected: 1 row

-- 5. Verify RLS policies
SELECT tablename, policyname
FROM pg_policies
WHERE tablename IN ('gig_schedules', 'gig_locations')
ORDER BY tablename, policyname;

-- Expected: 10 policies total (5 per table)
```

### Step 3: Test Backward Compatibility

```sql
-- Test 1: Existing gigs still queryable
SELECT id, title, venue_name, shift_date, is_multi_schedule
FROM gigs
LIMIT 5;

-- Test 2: Create new single-schedule gig (should work as before)
INSERT INTO gigs (
  employer_id,
  title,
  description,
  category,
  location,
  venue_name,
  venue_address,
  shift_date,
  shift_start_time,
  shift_end_time,
  slots_available,
  hourly_rate,
  status
) VALUES (
  auth.uid(), -- Replace with your user ID
  'Test Single-Day Event',
  'Testing backward compatibility',
  'events',
  ST_GeographyFromText('POINT(101.6869 3.1390)'), -- Kuala Lumpur
  'Test Venue',
  'Test Address, KL',
  '2025-10-15',
  '09:00:00',
  '17:00:00',
  10,
  15.00,
  'open'
);

-- Test 3: Verify is_multi_schedule defaults to false
SELECT is_multi_schedule FROM gigs WHERE title = 'Test Single-Day Event';
-- Expected: false
```

### Step 4: Test Multi-Schedule Functionality

```sql
-- Test 1: Create multi-schedule gig
INSERT INTO gigs (
  employer_id,
  title,
  description,
  category,
  location, -- Keep original field for backward compatibility
  venue_name, -- Keep original field
  venue_address, -- Keep original field
  shift_date, -- Keep original field (will use first schedule date)
  shift_start_time, -- Keep original field
  shift_end_time, -- Keep original field
  slots_available,
  hourly_rate,
  status,
  is_multi_schedule
) VALUES (
  auth.uid(),
  'Test Multi-Day SSM Event',
  'Testing multi-schedule system',
  'events',
  ST_GeographyFromText('POINT(101.6869 3.1390)'),
  'Menara SSM', -- Will create matching location entry
  'SSM HQ, KL',
  '2025-10-13', -- First date
  '09:00:00',
  '17:00:00',
  20,
  150.00,
  'open',
  TRUE -- Enable multi-schedule
)
RETURNING id;

-- Store the returned gig_id for next steps
\set test_gig_id '<paste-the-id-here>'

-- Test 2: Add first location
INSERT INTO gig_locations (
  gig_id,
  location,
  venue_name,
  venue_address,
  city,
  state,
  parking_info,
  geofence_radius_meters
) VALUES (
  :'test_gig_id',
  ST_GeographyFromText('POINT(101.6869 3.1390)'),
  'Menara SSM',
  'Persiaran Perdana, Presint 2, 62623 Putrajaya',
  'Putrajaya',
  'Wilayah Persekutuan',
  'Free parking available',
  100
)
RETURNING id;

-- Store location_id
\set loc1_id '<paste-location-id>'

-- Test 3: Add second location
INSERT INTO gig_locations (
  gig_id,
  location,
  venue_name,
  venue_address,
  city,
  state
) VALUES (
  :'test_gig_id',
  ST_GeographyFromText('POINT(101.5183 3.0738)'),
  'SSM Shah Alam',
  'Persiaran Damai, 40000 Shah Alam, Selangor',
  'Shah Alam',
  'Selangor'
)
RETURNING id;

-- Store location_id
\set loc2_id '<paste-location-id>'

-- Test 4: Add first schedule (Oct 13-16 @ Menara SSM)
INSERT INTO gig_schedules (
  gig_id,
  start_date,
  end_date,
  location_id,
  shift_start_time,
  shift_end_time,
  call_time,
  hourly_rate,
  daily_rate
) VALUES (
  :'test_gig_id',
  '2025-10-13',
  '2025-10-16',
  :'loc1_id',
  '09:00:00',
  '17:00:00',
  '08:00:00',
  NULL,
  150.00
);

-- Test 5: Add second schedule (Oct 27-30 @ SSM Shah Alam)
INSERT INTO gig_schedules (
  gig_id,
  start_date,
  end_date,
  location_id,
  shift_start_time,
  shift_end_time,
  call_time,
  hourly_rate,
  daily_rate
) VALUES (
  :'test_gig_id',
  '2025-10-27',
  '2025-10-30',
  :'loc2_id',
  '09:00:00',
  '17:00:00',
  '08:00:00',
  NULL,
  150.00
);

-- Test 6: Verify schedules created
SELECT
  gs.id,
  gs.start_date,
  gs.end_date,
  gs.total_days,
  gl.venue_name,
  gl.city
FROM gig_schedules gs
JOIN gig_locations gl ON gs.location_id = gl.id
WHERE gs.gig_id = :'test_gig_id'
ORDER BY gs.start_date;

-- Expected: 2 rows (Oct 13-16 @ Menara SSM, Oct 27-30 @ SSM Shah Alam)

-- Test 7: Test overlapping validation (should fail)
INSERT INTO gig_schedules (
  gig_id,
  start_date,
  end_date,
  location_id,
  shift_start_time,
  shift_end_time
) VALUES (
  :'test_gig_id',
  '2025-10-14', -- Overlaps with first schedule
  '2025-10-17',
  :'loc1_id',
  '09:00:00',
  '17:00:00'
);

-- Expected: ERROR: Schedule dates overlap with existing schedule for this gig
```

---

## Performance Testing

```sql
-- Test query performance for multi-schedule search
EXPLAIN ANALYZE
SELECT DISTINCT g.id, g.title, g.venue_name
FROM gigs g
LEFT JOIN gig_schedules gs ON g.id = gs.gig_id
WHERE g.is_multi_schedule = TRUE
  AND gs.start_date <= '2025-10-31'
  AND gs.end_date >= '2025-10-01';

-- Test spatial search with multi-schedule
EXPLAIN ANALYZE
SELECT g.id, g.title, gl.venue_name, gl.city
FROM gigs g
JOIN gig_locations gl ON g.id = gl.gig_id
WHERE ST_DWithin(
  gl.location,
  ST_GeographyFromText('POINT(101.6869 3.1390)'),
  5000 -- 5km radius
);
```

---

## Rollback Procedure

**If migration fails or needs rollback:**

```bash
# Apply rollback migration
supabase db push --include-named 20251009000001_rollback_multi_schedule_support

# Or manually run rollback SQL
psql $DATABASE_URL -f supabase/migrations/20251009000001_rollback_multi_schedule_support.sql
```

**Verify rollback:**

```sql
-- Confirm tables removed
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('gig_schedules', 'gig_locations');

-- Expected: 0 rows

-- Confirm column removed
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'gigs' AND column_name = 'is_multi_schedule';

-- Expected: 0 rows
```

---

## Post-Migration Tasks

### 1. Update Documentation

- [ ] Update DATABASE_SCHEMA_EXTENDED.md with new tables
- [ ] Document gig_schedules and gig_locations schema
- [ ] Update API documentation (if applicable)

### 2. Monitor Production

```sql
-- Monitor multi-schedule adoption
SELECT
  is_multi_schedule,
  COUNT(*) as gig_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM gigs
GROUP BY is_multi_schedule;

-- Monitor schedule table growth
SELECT
  COUNT(DISTINCT gig_id) as multi_schedule_gigs,
  COUNT(*) as total_schedules,
  ROUND(AVG(total_days), 1) as avg_days_per_schedule
FROM gig_schedules;
```

### 3. Performance Monitoring

```bash
# Monitor query performance in production
# Check slow query log for multi-schedule queries
# Adjust indexes if needed
```

---

## Troubleshooting

### Issue: Migration fails with "table already exists"

**Solution:**

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('gig_schedules', 'gig_locations');

-- If they exist, drop and re-run migration
DROP TABLE IF EXISTS gig_schedules CASCADE;
DROP TABLE IF EXISTS gig_locations CASCADE;
```

### Issue: RLS policies block access

**Solution:**

```sql
-- Temporarily disable RLS for testing (DO NOT DO IN PRODUCTION)
ALTER TABLE gig_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE gig_locations DISABLE ROW LEVEL SECURITY;

-- Test your queries

-- Re-enable RLS
ALTER TABLE gig_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE gig_locations ENABLE ROW LEVEL SECURITY;
```

### Issue: Overlapping validation too strict

**Solution:**

```sql
-- Soft-delete schedules instead of hard delete
UPDATE gig_schedules SET is_active = FALSE WHERE id = '<schedule-id>';

-- Or temporarily disable trigger
ALTER TABLE gig_schedules DISABLE TRIGGER trigger_validate_no_overlapping_schedules;

-- Re-enable after fixing
ALTER TABLE gig_schedules ENABLE TRIGGER trigger_validate_no_overlapping_schedules;
```

---

## Success Criteria

✅ Migration applied without errors
✅ All existing gigs still queryable
✅ New single-schedule gigs can be created (is_multi_schedule = false)
✅ New multi-schedule gigs can be created with multiple schedules
✅ Overlapping schedule validation works
✅ RLS policies enforce security
✅ Performance acceptable (< 200ms query time)
✅ Rollback tested and confirmed working

---

## Next Steps After Migration

Once migration is successful:

1. ✅ **Story 1.1 Complete** - Database schema ready
2. **Story 1.2** - Build Multiple Date Range Management UI
3. **Story 1.3** - Build Multiple Location Management System
4. **Story 1.4** - Implement Flexible Schedule Configuration

---

**Migration Status:** ⏳ Ready for Testing
**Author:** Kevin
**Reviewer:** (To be assigned)
**Sign-off:** (Date when production migration approved)
