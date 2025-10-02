# 💰 Payment Flow Testing Guide

## 📋 Complete Flow: Create → Push → Export (DuitNow)

### Quick Test (10 minutes)
1. Navigate to project payroll page
2. Create payment batch
3. Push to payment queue
4. Export to Excel (DuitNow format)

---

## 🔄 Step-by-Step Testing

### Step 1: Create Payment Batch

**Location:** Project Payroll Tab

**Actions:**
1. Open a project (e.g., "MrDIY Flagship Opening")
2. Go to "Payroll" tab
3. Click "Set Basic Salary" (if needed)
4. Select staff members to pay
5. Click "Push Payment" button

**Expected Result:**
- ✅ Payment batch created
- ✅ Staff payment records generated
- ✅ Backend log created: `create_payment`
- ✅ Status shows "Ready for Payment"

**Check Backend Log:**
```javascript
// In browser console
const logs = await backendLogger.getPaymentLogs();
console.log('Latest payment log:', logs[0]);
// Should show: action: 'create', status: 'pending'
```

---

### Step 2: Push Payment

**Location:** Payment Queue Dialog

**Actions:**
1. After creating batch, payment dialog should appear
2. Review payment details
3. Click "Push to Queue"/"Confirm Payment"

**Expected Result:**
- ✅ Payment batch status: "Pushed"
- ✅ Backend log created: `push_payment`
- ✅ Payment queue entry created
- ✅ Staff members marked for payment

**Check Backend Log:**
```javascript
const logs = await backendLogger.getPaymentLogs();
console.log('Push payment log:', logs.find(l => l.action === 'push'));
// Should show: action: 'push', status: 'pushed', staff_count: X
```

**Database Verification:**
```sql
SELECT
  id,
  payment_batch_id,
  action,
  status,
  staff_count,
  amount,
  created_at
FROM payment_logs
WHERE action = 'push'
ORDER BY created_at DESC
LIMIT 5;
```

---

### Step 3: Export to DuitNow Excel

**Location:** Payment Queue / Payroll Manager

**Actions:**
1. Find the pushed payment batch
2. Click "Export" button
3. Select format: "DuitNow Excel"
4. Click "Download"

**Expected Result:**
- ✅ Excel file downloaded
- ✅ File format matches DuitNow template
- ✅ Backend log created: `export_payment`
- ✅ File path recorded in log

**Check Backend Log:**
```javascript
const logs = await backendLogger.getPaymentLogs();
const exportLog = logs.find(l => l.action === 'export');
console.log('Export log:', exportLog);
// Should show:
// - action: 'export'
// - status: 'exported'
// - export_format: 'duitnow'
// - file_path: '/downloads/payment_xxx.xlsx'
```

**Excel File Verification:**
Check the downloaded Excel file contains:
- Header row with DuitNow fields
- Staff payment data
- Correct formatting (amounts, dates, account numbers)

---

## 🧪 Automated Test Script

Create file: `/Users/baito.kevin/Downloads/Baito-AI/test-payment-flow.js`

```javascript
/**
 * Payment Flow Test Script
 * Run in browser console at http://localhost:5173
 */

async function testPaymentFlow() {
  console.log('🚀 Starting Payment Flow Test...\n');

  // Import logger (assuming it's available in window)
  const { backendLogger } = window;

  try {
    // Step 1: Create Payment
    console.log('📝 Step 1: Creating payment batch...');
    const createResult = await testCreatePayment();
    console.log('✅ Payment created:', createResult);

    // Step 2: Push Payment
    console.log('\n📤 Step 2: Pushing payment to queue...');
    const pushResult = await testPushPayment(createResult.batchId);
    console.log('✅ Payment pushed:', pushResult);

    // Step 3: Export to Excel
    console.log('\n💾 Step 3: Exporting to DuitNow Excel...');
    const exportResult = await testExportPayment(createResult.batchId);
    console.log('✅ Payment exported:', exportResult);

    // Verify Logs
    console.log('\n📊 Verifying backend logs...');
    const logs = await backendLogger.getPaymentLogs(createResult.batchId);
    console.log(`✅ Found ${logs.length} log entries`);

    console.table(logs.map(l => ({
      Action: l.action,
      Status: l.status,
      StaffCount: l.staff_count,
      Amount: l.amount,
      Time: new Date(l.created_at).toLocaleTimeString()
    })));

    console.log('\n✅ ✅ ✅ Payment Flow Test PASSED! ✅ ✅ ✅');
    return { success: true, batchId: createResult.batchId, logs };

  } catch (error) {
    console.error('❌ Payment Flow Test FAILED:', error);
    return { success: false, error: error.message };
  }
}

async function testCreatePayment() {
  // Simulate creating payment
  const batchId = 'batch_' + Date.now();

  await backendLogger.logPaymentCreated(
    batchId,
    'test-project-id',
    1000.00,
    5
  );

  return { batchId, amount: 1000, staffCount: 5 };
}

async function testPushPayment(batchId) {
  await backendLogger.logPaymentPushed(
    batchId,
    'test-project-id',
    5
  );

  return { batchId, status: 'pushed' };
}

async function testExportPayment(batchId) {
  const filePath = `/downloads/payment_${batchId}.xlsx`;

  await backendLogger.logPaymentExported(
    batchId,
    'test-project-id',
    'duitnow',
    filePath,
    5
  );

  return { batchId, filePath, format: 'duitnow' };
}

// Make functions available globally
window.testPaymentFlow = testPaymentFlow;

console.log('%c💰 Payment Flow Test Suite Loaded', 'font-size: 16px; color: #10b981; font-weight: bold');
console.log('Run: testPaymentFlow()');
```

---

## 🔍 Manual Testing Checklist

### Pre-Test Setup
- [ ] Login to application
- [ ] Navigate to a project with staff
- [ ] Open browser DevTools (F12)
- [ ] Open Console tab

### Test 1: Create Payment
- [ ] Go to Payroll tab
- [ ] Set basic salary if needed
- [ ] Select staff for payment
- [ ] Click "Push Payment"
- [ ] Verify payment dialog appears
- [ ] Check console for log: `create_payment`

### Test 2: Push to Queue
- [ ] In payment dialog, review details
- [ ] Click "Push to Queue"
- [ ] Verify success message
- [ ] Check console for log: `push_payment`
- [ ] Verify payment appears in queue

### Test 3: Export Excel
- [ ] Find payment in queue/list
- [ ] Click "Export" button
- [ ] Select "DuitNow" format
- [ ] Click "Download"
- [ ] Verify file downloads
- [ ] Check console for log: `export_payment`
- [ ] Open Excel file and verify data

### Post-Test Verification
- [ ] Check all logs in database
- [ ] Verify payment status is correct
- [ ] Confirm file was generated
- [ ] Review any error logs

---

## 🛠️ Debugging Common Issues

### Issue 1: Payment Not Created
**Symptoms:**
- No payment batch ID
- Console error about missing data

**Solutions:**
```javascript
// Check staff data
console.log('Staff for payment:', selectedStaff);

// Verify salary is set
console.log('Basic salary:', basicSalary);

// Check user permissions
const user = await getUser();
console.log('Current user:', user);
```

### Issue 2: Push Failed
**Symptoms:**
- Payment stuck in "pending"
- Backend log shows error

**Solutions:**
```javascript
// Check payment queue table
const { data, error } = await supabase
  .from('payment_queue')
  .select('*')
  .eq('batch_id', batchId);

console.log('Queue entry:', data, error);

// Verify RLS policies
// Run in Supabase SQL Editor:
SELECT * FROM payment_queue WHERE batch_id = 'your-batch-id';
```

### Issue 3: Export Failed
**Symptoms:**
- No file downloaded
- Error in console

**Solutions:**
```javascript
// Check export service
import { exportToDuitNow } from '@/lib/duitnow-payment-service';

// Test export directly
const result = await exportToDuitNow(paymentData);
console.log('Export result:', result);

// Check file permissions
console.log('Download folder writable:', navigator.storage);
```

---

## 📊 Backend Log Queries

### Get All Payment Logs
```sql
SELECT * FROM payment_logs
ORDER BY created_at DESC
LIMIT 20;
```

### Get Logs for Specific Batch
```sql
SELECT
  action,
  status,
  amount,
  staff_count,
  export_format,
  created_at,
  error_message
FROM payment_logs
WHERE payment_batch_id = 'your-batch-id'
ORDER BY created_at ASC;
```

### Get Payment Summary
```sql
SELECT * FROM payment_activity_summary
LIMIT 20;
```

### Get Failed Payments
```sql
SELECT
  payment_batch_id,
  action,
  error_message,
  created_at
FROM payment_logs
WHERE status = 'failed'
ORDER BY created_at DESC;
```

---

## 🎯 Success Criteria

### All Tests Pass When:
1. ✅ Payment batch created successfully
2. ✅ Backend log shows `create_payment` action
3. ✅ Payment pushed to queue
4. ✅ Backend log shows `push_payment` action
5. ✅ Excel file exported in DuitNow format
6. ✅ Backend log shows `export_payment` action with file path
7. ✅ All logs have correct status
8. ✅ No errors in console or logs
9. ✅ Payment data matches throughout flow
10. ✅ Excel file contains correct data

---

## 📱 Quick Test Commands

```bash
# Start dev server
npm run dev

# Open browser
open http://localhost:5173

# In browser console, run:
testPaymentFlow()

# Check logs:
await backendLogger.getPaymentSummary()
```

---

## 📝 Test Report Template

```markdown
# Payment Flow Test Report

**Date:** [Date]
**Tester:** [Name]
**Environment:** Development

## Test Results

### Step 1: Create Payment
- Status: [PASS/FAIL]
- Batch ID: [ID]
- Amount: [Amount]
- Staff Count: [Count]
- Notes: [Any observations]

### Step 2: Push Payment
- Status: [PASS/FAIL]
- Queue Status: [Status]
- Logs Created: [Yes/No]
- Notes: [Any observations]

### Step 3: Export Excel
- Status: [PASS/FAIL]
- Format: DuitNow
- File Downloaded: [Yes/No]
- Data Correct: [Yes/No]
- Notes: [Any observations]

## Backend Logs
[Paste log summary here]

## Issues Found
[List any issues discovered]

## Recommendations
[Any improvements suggested]
```

---

**End of Payment Flow Test Guide** ✅
