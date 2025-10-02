# 🧪 Payment Flow Test Execution Guide

## Current Status: Ready to Test ✅

The complete payment flow test infrastructure is ready. However, **database migrations must be applied first** for logging to work.

---

## ⚠️ IMPORTANT: Prerequisites

### 1. Apply Database Migrations First

**Why?** The backend logging system requires two database tables that don't exist yet:
- `user_activity_logs` - For general activity tracking
- `payment_logs` - For payment-specific tracking
- `created_by` column in `projects` table - For creator tracking

**How to Apply:** Follow instructions in `/APPLY_MIGRATIONS_NOW.md`

---

## 🚀 Test Execution Methods

### Method 1: Interactive HTML Test Suite (Recommended)

**Step 1:** Open the test page
```bash
open http://localhost:5173/test-payment-flow.html
```
Or navigate to: http://localhost:5173/test-payment-flow.html

**Step 2:** Use the interactive interface
- Click "Run All Tests" for complete flow
- Or run tests individually:
  - "Test Create Payment" → Creates payment batch
  - "Test Push Payment" → Pushes to queue
  - "Test Export Payment" → Exports to DuitNow Excel

**Step 3:** View results
- Test results appear in real-time
- Summary table shows pass/fail status
- Backend logs section shows database entries

---

### Method 2: Browser Console Test Script (Real Data)

**Step 1:** Load the test script
```bash
# Open your app
open http://localhost:5173

# Make sure you're logged in
# Navigate to a project with staff (e.g., "MrDIY Flagship Opening")
# Go to the Payroll tab
```

**Step 2:** Load test script in console
```html
<!-- Add this to your page or load via script tag -->
<script type="module" src="/test-payment-real.js"></script>
```

**Step 3:** Run in browser console (F12)
```javascript
// Run complete test
await testRealPaymentFlow()

// Or run individual commands
await testPaymentLogs('batch_1234567890')
await getPaymentSummary()
```

---

### Method 3: Manual Testing

**Step 1:** Navigate to a project
```bash
open http://localhost:5173
# Go to: Projects → [Any Project] → Payroll Tab
```

**Step 2:** Create Payment Batch
1. Select staff members
2. Set working dates and salary
3. Click "Create Payment Batch"
4. **Expected**: Payment batch created with logging

**Step 3:** Push to Queue
1. Review payment batch
2. Click "Push Payment"
3. **Expected**: Payment queued for processing with logging

**Step 4:** Export to DuitNow
1. Click "Export to DuitNow"
2. **Expected**: Excel file downloads with logging

**Step 5:** Verify Logging
```sql
-- In Supabase SQL Editor
SELECT * FROM payment_logs
ORDER BY created_at DESC
LIMIT 10;

SELECT * FROM payment_activity_summary
LIMIT 10;
```

---

## 📊 What The Tests Do

### Test 1: Create Payment
- **Action**: Creates a payment batch with test data
- **Data**: 8 staff members, RM 625 each = RM 5,000 total
- **Logging**:
  - Logs to `payment_logs` table (action: 'create', status: 'pending')
  - Logs to `user_activity_logs` (action: 'create_payment_batch')

### Test 2: Push Payment
- **Action**: Pushes payment batch to processing queue
- **Logging**:
  - Logs to `payment_logs` (action: 'push', status: 'pushed')
  - Logs to `user_activity_logs` (action: 'push_payment')

### Test 3: Export to DuitNow Excel
- **Action**: Generates DuitNow-formatted Excel file
- **Format**: Bank transfer template for Malaysian banks
- **Logging**:
  - Logs to `payment_logs` (action: 'export', status: 'exported', format: 'duitnow')
  - Logs to `user_activity_logs` (action: 'export_payment')

---

## ✅ Expected Results

### If Migrations Applied ✓

**Console Output:**
```
🚀 REAL Payment Flow Test Starting...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 Step 1: Creating Payment Batch...
✅ Create Result: { batchId: 'batch_1696234567890', ... }

📤 Step 2: Pushing Payment...
✅ Push Result: { success: true, ... }

💾 Step 3: Exporting to DuitNow Excel...
✅ Export Result: { fileName: 'payment_duitnow_batch_1696234567890.csv', ... }

📊 Step 4: Verifying Backend Logs...
✅ Found 3 log entries for batch batch_1696234567890

┌─────────┬────────┬──────────┬───────┬────────┬──────┐
│ Action  │ Status │ Amount   │ Staff │ Format │ Time │
├─────────┼────────┼──────────┼───────┼────────┼──────┤
│ create  │ pending│ RM 5000  │ 8     │ -      │ 23:45│
│ push    │ pushed │ -        │ 8     │ -      │ 23:45│
│ export  │ exported│ -       │ 8     │duitnow │ 23:46│
└─────────┴────────┴──────────┴───────┴────────┴──────┘

✅ ✅ ✅ ALL TESTS PASSED! ✅ ✅ ✅
```

### If Migrations NOT Applied ⚠️

**Console Output:**
```
🚀 REAL Payment Flow Test Starting...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 Step 1: Creating Payment Batch...
✅ Create Result: { batchId: 'batch_1696234567890', ... }
⚠️  Could not log to backend: relation "payment_logs" does not exist

📤 Step 2: Pushing Payment...
✅ Push Result: { success: true, ... }
⚠️  Could not log push to backend

💾 Step 3: Exporting to DuitNow Excel...
✅ Export Result: { fileName: 'payment_duitnow_batch_1696234567890.csv', ... }
⚠️  Could not log export to backend

📊 Step 4: Verifying Backend Logs...
❌ Failed to verify logs: relation "payment_logs" does not exist
💡 This is expected if migrations are not applied yet.

⚠️  Backend logging not working
💡 Apply migrations from: APPLY_MIGRATIONS_NOW.md
```

---

## 🐛 Troubleshooting

### Issue: "relation payment_logs does not exist"
**Solution:** Apply migrations from `/APPLY_MIGRATIONS_NOW.md`

### Issue: "column p.created_by does not exist"
**Solution:** Apply migrations from `/APPLY_MIGRATIONS_NOW.md` (Step 1)

### Issue: "Test script not found"
**Solution:** Ensure dev server is running:
```bash
npm run dev
```

### Issue: "Not logged in"
**Solution:** Navigate to http://localhost:5173 and sign in first

### Issue: "No staff in project"
**Solution:**
1. Go to a project with staff
2. Or add staff first via Staffing tab
3. Then run payment tests

---

## 📁 Test Files Reference

### Test Infrastructure Files:
- `/test-payment-flow.html` - Interactive HTML test suite
- `/public/test-payment-real.js` - Real browser test script
- `/src/lib/backend-logger.ts` - Logging service
- `/src/lib/payment-logger-integration.ts` - Payment logging helpers

### Migration Files:
- `/supabase/migrations/20251002000000_add_created_by_to_projects.sql`
- `/supabase/migrations/20251002010000_comprehensive_user_activity_logs.sql`
- `/APPLY_MIGRATIONS_NOW.md` - Migration instructions

### Documentation:
- `/PAYMENT_FLOW_TEST_GUIDE.md` - Comprehensive testing guide
- `/IMPLEMENTATION_SUMMARY.md` - Complete implementation overview
- `/PROJECT_CREATOR_TRACKING_GUIDE.md` - Creator tracking docs

---

## 🎯 Quick Start (For Impatient Testers)

```bash
# 1. Apply migrations (5 minutes)
# Follow: /APPLY_MIGRATIONS_NOW.md

# 2. Open test page
open http://localhost:5173/test-payment-flow.html

# 3. Click "Run All Tests"

# 4. View results and verify logs in Supabase Dashboard
```

---

## 📞 Support

### Check Backend Logs in Supabase:
```sql
-- View payment activity
SELECT * FROM payment_activity_summary
ORDER BY created_at DESC
LIMIT 20;

-- View payment logs for specific batch
SELECT * FROM payment_logs
WHERE payment_batch_id = 'batch_1234567890';

-- View user activity
SELECT * FROM user_activity_logs
WHERE action_type = 'payment'
ORDER BY created_at DESC
LIMIT 20;
```

### Available Console Commands:
```javascript
// After loading test-payment-real.js

testRealPaymentFlow()              // Run complete flow
testPaymentLogs('batch_id')        // Get logs for batch
getPaymentSummary()                // Get recent activity
```

---

## ✨ Success Checklist

- [ ] Migrations applied in Supabase
- [ ] Dev server running (http://localhost:5173)
- [ ] Logged into application
- [ ] Project with staff selected
- [ ] Test page opened
- [ ] All tests executed
- [ ] Logs verified in database
- [ ] No errors in console

**When all checked:** 🎉 Payment flow with logging is working perfectly!

---

## 🚨 Critical Notes

1. **Apply Migrations First**: Without them, logging won't work (tests will run but won't log)
2. **Be Logged In**: Tests require authentication
3. **Use Real Project**: Navigate to actual project for context
4. **Check Console**: F12 → Console tab for test output
5. **Verify Database**: Check Supabase SQL Editor for logs

---

**Ready to test?** Start with `/APPLY_MIGRATIONS_NOW.md` then come back here! 🚀
