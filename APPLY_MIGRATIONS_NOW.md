# 🚨 APPLY THESE MIGRATIONS NOW

## ⚡ Quick Start (5 minutes)

### Step 1: Fix `created_by` Column Error

**Error You're Seeing:**
```
ERROR: 42703: column p.created_by does not exist
```

**Solution:** Run this SQL in Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select your project: `aoiwrdzlichescqgnohi`
3. Click: **SQL Editor** (left sidebar)
4. Click: **New Query**
5. Copy and paste this:

```sql
-- ========================================
-- MIGRATION 1: Add created_by column
-- ========================================

-- Add the column
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);

-- Add comment
COMMENT ON COLUMN projects.created_by IS 'User ID of the person who created this project';

-- Backfill existing projects
UPDATE projects
SET created_by = manager_id
WHERE created_by IS NULL
  AND manager_id IS NOT NULL;

-- Verify
SELECT
  COUNT(*) as total_projects,
  COUNT(created_by) as with_creator
FROM projects;
```

6. Click: **Run** (or press ⌘+Enter)
7. You should see: `Success. No rows returned`

**Verification:**
```sql
-- Run this to confirm it worked
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'projects' AND column_name = 'created_by';

-- Should return: created_by | uuid
```

---

### Step 2: Add Comprehensive Logging System

**In same SQL Editor:**

```sql
-- ========================================
-- MIGRATION 2: Comprehensive Logging
-- ========================================

-- Create user activity logs table
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_name TEXT,
  action TEXT NOT NULL,
  action_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_action ON user_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_project ON user_activity_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at DESC);

-- Create payment logs table
CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_batch_id UUID,
  project_id UUID REFERENCES projects(id),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  status TEXT NOT NULL,
  amount DECIMAL(15,2),
  staff_count INTEGER,
  export_format TEXT,
  file_path TEXT,
  details JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create indexes for payment logs
CREATE INDEX IF NOT EXISTS idx_payment_logs_batch ON payment_logs(payment_batch_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_project ON payment_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_action ON payment_logs(action);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON payment_logs(created_at DESC);

-- Enable RLS
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_activity_logs
CREATE POLICY "Users can view their own activity logs"
  ON user_activity_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view project activity logs"
  ON user_activity_logs FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE deleted_at IS NULL
    )
  );

CREATE POLICY "Authenticated users can insert activity logs"
  ON user_activity_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for payment_logs
CREATE POLICY "Users can view payment logs for accessible projects"
  ON payment_logs FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE deleted_at IS NULL
    )
  );

CREATE POLICY "Authenticated users can insert payment logs"
  ON payment_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create logging functions
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id UUID,
  p_action TEXT,
  p_action_type TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_project_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}',
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_user_email TEXT;
  v_user_name TEXT;
BEGIN
  SELECT email, full_name INTO v_user_email, v_user_name
  FROM users WHERE id = p_user_id;

  INSERT INTO user_activity_logs (
    user_id, user_email, user_name, action, action_type,
    entity_type, entity_id, project_id, details, success, error_message
  ) VALUES (
    p_user_id, v_user_email, v_user_name, p_action, p_action_type,
    p_entity_type, p_entity_id, p_project_id, p_details, p_success, p_error_message
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION log_payment_activity(
  p_payment_batch_id UUID,
  p_project_id UUID,
  p_user_id UUID,
  p_action TEXT,
  p_status TEXT,
  p_amount DECIMAL DEFAULT NULL,
  p_staff_count INTEGER DEFAULT NULL,
  p_export_format TEXT DEFAULT NULL,
  p_file_path TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}',
  p_error_message TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO payment_logs (
    payment_batch_id, project_id, user_id, action, status,
    amount, staff_count, export_format, file_path,
    details, error_message,
    completed_at
  ) VALUES (
    p_payment_batch_id, p_project_id, p_user_id, p_action, p_status,
    p_amount, p_staff_count, p_export_format, p_file_path,
    p_details, p_error_message,
    CASE WHEN p_status IN ('exported', 'failed', 'cancelled') THEN NOW() ELSE NULL END
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create summary view
CREATE OR REPLACE VIEW payment_activity_summary AS
SELECT
  pl.payment_batch_id,
  p.title as project_title,
  u.full_name as user_name,
  pl.action,
  pl.status,
  pl.amount,
  pl.staff_count,
  pl.export_format,
  pl.created_at,
  pl.completed_at,
  pl.error_message,
  EXTRACT(EPOCH FROM (pl.completed_at - pl.created_at)) as duration_seconds
FROM payment_logs pl
LEFT JOIN projects p ON p.id = pl.project_id
LEFT JOIN users u ON u.id = pl.user_id
ORDER BY pl.created_at DESC;

-- Grant permissions
GRANT SELECT, INSERT ON user_activity_logs TO authenticated;
GRANT SELECT, INSERT ON payment_logs TO authenticated;
GRANT SELECT ON payment_activity_summary TO authenticated;
GRANT EXECUTE ON FUNCTION log_user_activity TO authenticated;
GRANT EXECUTE ON FUNCTION log_payment_activity TO authenticated;
```

Click: **Run**

**Verification:**
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('user_activity_logs', 'payment_logs')
ORDER BY table_name;

-- Should return both tables
```

---

## ✅ Final Verification

Run this to make sure everything works:

```sql
-- Test 1: Check created_by column
SELECT
  p.id,
  p.title,
  p.created_by,
  u.full_name as creator_name
FROM projects p
LEFT JOIN users u ON u.id = p.created_by
LIMIT 5;

-- Test 2: Check logging tables
SELECT 'user_activity_logs' as table_name, COUNT(*) as rows FROM user_activity_logs
UNION ALL
SELECT 'payment_logs', COUNT(*) FROM payment_logs;

-- Test 3: Test logging function
SELECT log_user_activity(
  auth.uid(),
  'test_action',
  'create',
  'project',
  NULL,
  NULL,
  '{"test": true}'::jsonb,
  true,
  NULL
) as log_id;

-- Should return a UUID
```

---

## 🎯 What This Fixes

### Before (Problems):
❌ `column p.created_by does not exist` error
❌ No tracking of who created projects
❌ No logging of payment operations
❌ Can't audit user actions

### After (Solutions):
✅ `created_by` column exists and populated
✅ Complete user activity logging
✅ Payment flow fully tracked
✅ Comprehensive audit trail

---

## 🚨 If Something Goes Wrong

### Error: "relation already exists"
**Meaning:** Table already created
**Solution:** That's fine! It means it worked before

### Error: "permission denied"
**Meaning:** RLS blocking you
**Solution:** You need to be logged in as admin

### Error: "function does not exist"
**Meaning:** Function creation failed
**Solution:** Run the migration again, check for syntax errors

---

## 📞 Quick Help

```bash
# 1. Apply migrations (as shown above)
# 2. Restart your dev server
npm run dev

# 3. Test in browser console
# Go to: http://localhost:5173
# Press F12, then in console:

import { backendLogger } from './src/lib/backend-logger.ts';
const logs = await backendLogger.getPaymentSummary();
console.log(logs);
```

---

## ✨ Success Indicators

You'll know it worked when:

1. ✅ No more `column p.created_by does not exist` error
2. ✅ Query runs successfully:
   ```sql
   SELECT p.title, u.full_name as creator
   FROM projects p
   LEFT JOIN users u ON u.id = p.created_by
   LIMIT 1;
   ```

3. ✅ Can log activity:
   ```javascript
   await backendLogger.logActivity({
     action: 'test',
     actionType: 'create'
   });
   ```

4. ✅ Can view logs:
   ```sql
   SELECT * FROM user_activity_logs LIMIT 5;
   ```

---

## 🎉 After Migrations

1. **Test Payment Flow**
   - Open: `test-payment-flow.html`
   - Run all tests
   - Verify logs appear

2. **Check Creator Tracking**
   - Create a new project
   - View project details
   - See "Created by [Your Name]"

3. **Monitor Logs**
   ```sql
   SELECT * FROM payment_activity_summary;
   ```

---

**That's it!** 🚀

After running these migrations:
- ✅ No more database errors
- ✅ Complete logging system
- ✅ Payment tracking works
- ✅ Creator attribution enabled

**Run the migrations now to fix everything!**
