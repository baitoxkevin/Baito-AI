# 🔧 Notification Migration Fix

## Issue Resolved
**Error:** `column "auth_user_id" does not exist`

The original migration referenced a non-existent column. This has been fixed.

---

## ✅ Quick Fix

Run this SQL to fix the achievement notification trigger:

### Supabase Dashboard:
1. Go to: https://app.supabase.com/project/aoiwrdzlichescqgnohi/sql/new

2. **Copy & Paste This SQL:**

```sql
-- Fix the achievement notification trigger
DROP FUNCTION IF EXISTS notify_achievement_unlock() CASCADE;

-- Recreate the function with correct logic
CREATE OR REPLACE FUNCTION notify_achievement_unlock()
RETURNS TRIGGER AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Use candidate_id directly as user_id
  -- This assumes candidates.id matches auth.users.id
  user_id := NEW.candidate_id;

  IF user_id IS NOT NULL THEN
    PERFORM send_notification(
      user_id,
      '🏆 ' || NEW.achievement_name,
      NEW.achievement_description || ' You earned ' || NEW.points_awarded || ' points!',
      'achievement',
      jsonb_build_object(
        'achievement_id', NEW.id,
        'achievement_type', NEW.achievement_type,
        'points_awarded', NEW.points_awarded
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trigger_achievement_notification
  AFTER INSERT ON achievements
  FOR EACH ROW
  EXECUTE FUNCTION notify_achievement_unlock();
```

3. **Click Run** ✅

---

## 📝 What Was Fixed

**Before:**
```sql
-- Tried to get auth_user_id column (doesn't exist)
SELECT auth_user_id INTO user_id
FROM candidates
WHERE id = NEW.candidate_id;
```

**After:**
```sql
-- Use candidate_id directly as user_id
user_id := NEW.candidate_id;
```

---

## ✅ Verify Success

After running the fix:

1. **Check Function Exists:**
   - Database → Functions
   - Should see: `notify_achievement_unlock`

2. **Check Trigger Exists:**
   - Database → Tables → achievements → Triggers
   - Should see: `trigger_achievement_notification`

3. **Test Achievement Notification:**
   - Complete a shift as a worker
   - Earn an achievement
   - Check `/worker/notifications` → Should receive notification!

---

## 📋 Alternative: Re-run Full Migration

If you prefer, re-run the complete fixed migration:

**File:** `supabase/migrations/20251002020000_create_notifications_system.sql`
(This file has been updated with the fix)

**Or use file:** `supabase/migrations/20251002020001_fix_notification_trigger.sql`
(Quick fix only)

---

## 🧪 Test It Works

1. **Complete a shift** → Earn achievement
2. **Check notifications** → `/worker/notifications`
3. **Should see:** 🏆 Achievement notification with points!

---

✅ **Fix Applied! Notifications Ready!** 🎉
