# ✅ Migration Fixed!

## Issue Resolved
**Error:** `column c.name does not exist`
**Fix:** Changed `c.name` to `c.full_name` (the actual column name in candidates table)

---

## 🔄 Re-Apply Migration 2

The migration file has been updated. Please re-run it:

### Quick Fix (Supabase Dashboard):

1. **Go to:** https://app.supabase.com/project/aoiwrdzlichescqgnohi/sql/new

2. **Copy & paste this FIXED SQL:**

```sql
-- Drop old view if it exists
DROP VIEW IF EXISTS leaderboard;

-- Create leaderboard view (FIXED)
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  c.id,
  c.full_name as name,
  c.email,
  c.total_points,
  COUNT(DISTINCT a.id) as total_shifts,
  COUNT(DISTINCT ach.id) as total_achievements,
  RANK() OVER (ORDER BY c.total_points DESC) as rank
FROM candidates c
LEFT JOIN attendance a ON c.id = a.candidate_id AND a.status = 'checked_out'
LEFT JOIN achievements ach ON c.id = ach.candidate_id
GROUP BY c.id, c.full_name, c.email, c.total_points
ORDER BY c.total_points DESC;

-- Create function to get candidate stats
CREATE OR REPLACE FUNCTION get_candidate_stats(p_candidate_id UUID)
RETURNS TABLE (
  total_points INTEGER,
  rank BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.total_points,
    (SELECT COUNT(*) + 1 FROM candidates WHERE total_points > c.total_points)::BIGINT as rank
  FROM candidates c
  WHERE c.id = p_candidate_id;
END;
$$ LANGUAGE plpgsql;
```

3. **Click Run** ✅

---

## ✅ What's Fixed

**Before:**
- Used `c.name` (doesn't exist)
- Missing `get_candidate_stats` function

**After:**
- Uses `c.full_name` as name (correct column)
- Added `get_candidate_stats` function for PointsDisplay component

---

## 🧪 Test It Works

After running the fixed SQL:

1. **Check View Created:**
   - Go to: Database → Views
   - You should see: ✅ `leaderboard`

2. **Test Leaderboard:**
   ```bash
   # Open: http://localhost:8087/worker/leaderboard
   ```

3. **Should work now!** 🎉

---

## 📝 Full Migration (if you want to run complete file again)

Or run the complete updated migration file:
```
supabase/migrations/20251002010000_create_gamification_tables.sql
```

(It's been fixed - now uses `c.full_name as name`)

---

## Summary

✅ Migration file updated
✅ Column name fixed (`full_name` → `name` alias)
✅ Helper function added (`get_candidate_stats`)
✅ Ready to test!
