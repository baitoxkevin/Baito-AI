# 🚀 Apply Migrations - Quick Start

## 📋 Step-by-Step Guide

### ✅ Option 1: Supabase Dashboard (2 minutes)

**Migration 1: Attendance Table**
1. Go to: https://app.supabase.com/project/aoiwrdzlichescqgnohi/sql/new
2. Copy **entire content** from:
   ```
   supabase/migrations/20251002000000_create_attendance_table.sql
   ```
3. Paste into SQL Editor
4. Click **Run** (top right)
5. ✅ You should see: "Success. No rows returned"

**Migration 2: Gamification Tables**
1. Same Supabase SQL Editor
2. Copy **entire content** from:
   ```
   supabase/migrations/20251002010000_create_gamification_tables.sql
   ```
3. Paste into SQL Editor
4. Click **Run**
5. ✅ You should see: "Success. No rows returned"

---

### ✅ Option 2: Use the Helper Script

```bash
chmod +x apply-migrations.sh
./apply-migrations.sh
```

---

### ✅ Option 3: Supabase CLI (if installed)

```bash
# If you have Supabase CLI installed
supabase db push
```

---

## 🔍 Verify Migrations Applied

After applying, verify in Supabase Dashboard:

**Check Tables Created:**
1. Go to: https://app.supabase.com/project/aoiwrdzlichescqgnohi/database/tables
2. You should see these NEW tables:
   - ✅ `attendance`
   - ✅ `points_log`
   - ✅ `achievements`

**Check View Created:**
1. Click **Views** tab (next to Tables)
2. You should see:
   - ✅ `leaderboard` view

**Check Functions Created:**
1. Go to: https://app.supabase.com/project/aoiwrdzlichescqgnohi/database/functions
2. You should see:
   - ✅ `validate_geofence`
   - ✅ `award_points`
   - ✅ `check_achievements`
   - ✅ `calculate_attendance_hours`
   - ✅ `award_attendance_points`

---

## 🧪 Test the App

After migrations are applied:

1. **Start app** (if not running):
   ```bash
   cd baito-mobile
   npx expo start --web --port 8087
   ```

2. **Open:** http://localhost:8087

3. **Test Flow:**
   - Login → Browse Gigs → Apply
   - Click Gig → Clock In (GPS)
   - Take Selfie → Clock Out
   - See Points Awarded ✨
   - Check Leaderboard 🏆

---

## 📊 What Each Migration Does

### Migration 1: `create_attendance_table.sql`
✅ Creates `attendance` table
✅ GPS tracking (lat/lng)
✅ Geofence validation (100m)
✅ Auto hours calculation
✅ Selfie photo storage
✅ RLS policies

### Migration 2: `create_gamification_tables.sql`
✅ Creates `points_log` table
✅ Creates `achievements` table
✅ Creates `leaderboard` view
✅ Auto point awarding (trigger)
✅ Achievement unlocking
✅ RLS policies

---

## ❌ Troubleshooting

**Error: "relation already exists"**
- ✅ This is OK! Table already exists, skip to next migration

**Error: "permission denied"**
- ❌ Use Supabase Dashboard instead (you're not admin in CLI)

**Error: "syntax error"**
- ❌ Make sure you copied the ENTIRE SQL file
- ❌ Don't modify the SQL

**Can't see tables after migration**
- 🔄 Refresh the Supabase Dashboard page
- 🔄 Click on another section, then back to Tables

---

## 🎯 Quick Copy-Paste

**Migration 1 Path:**
```
/Users/baito.kevin/Downloads/Baito-AI/baito-mobile/supabase/migrations/20251002000000_create_attendance_table.sql
```

**Migration 2 Path:**
```
/Users/baito.kevin/Downloads/Baito-AI/baito-mobile/supabase/migrations/20251002010000_create_gamification_tables.sql
```

**Supabase SQL Editor:**
```
https://app.supabase.com/project/aoiwrdzlichescqgnohi/sql/new
```

---

## ✨ After Migrations

You'll have:
- 🎯 GPS clock-in/out working
- 📸 Selfie verification working
- 🏆 Points system working
- 🥇 Leaderboard working
- 📊 Admin dashboard working
- ⚡ Real-time updates everywhere

**Total setup time: < 5 minutes**

---

**Pro Tip:** Keep the SQL Editor tab open - you might want to run test queries!
