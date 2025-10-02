# 🚀 Quick Test Guide - Add New Project

## ⚡ 5-Minute Quick Test

### 1. Open Browser Console
```bash
# Your dev server is already running!
# Just open: http://localhost:5173
# Then press F12 (Developer Tools)
```

### 2. Run Automated Tests
1. Copy the file `browser-test-script.js`
2. Paste into console
3. Run: `runTests()`
4. See instant results! ✨

### 3. Manual Happy Path Test (2 minutes)

**Click "Add New Project" (or similar button)**

**Step 1: Basic Information**
```
Project Name: "Annual Tech Conference 2025"
Customer: [Select any]
Manager: [Select any]
Brand Name: "Nike"
[Click "Find Logo" → optional]
```
Click **Next** →

**Step 2: Event Details**
```
Event Type: "Conference"
Project Category: "Custom"
Description: "Tech conference for 2025"
```
Click **Next** →

**Step 3: Location**
```
Venue Address: "123 Convention Center, Kuala Lumpur"
Venue Details: "Main Hall, 3rd Floor"
```
Click **Next** →

**Step 4: Schedule**
```
Start Date: [Today]
End Date: [Tomorrow]
Start Time: 09:00
End Time: 18:00
Schedule Type: "Single Event"
```
Click **Next** →

**Step 5: Staffing**
```
Crew Count: 10
Supervisors: 2
```
Click **Next** →

**Step 6: Advanced**
```
Status: "Planning"
Priority: "High"
Budget: 5000
Invoice: "INV-2024-001"
```
Click **Next** →

**Step 7: Review**
- ✅ Check all data is correct
- Click **"Create Project"**
- ✅ Should see success toast
- ✅ Dialog closes
- ✅ Project appears in list

---

## 🧪 Critical Tests (5 minutes)

### Test 1: Required Field Validation
1. Open "Add New Project"
2. **DON'T** fill any fields
3. Click "Next"
4. ✅ Should show error: "Please fill in required fields"
5. ✅ Required fields should have red borders

### Test 2: Date Range Validation
1. Go to Step 4 (Schedule)
2. Set Start Date: **Tomorrow**
3. Set End Date: **Today** (before start!)
4. Try to proceed
5. ✅ Should show error: "End date must be after start date"

### Test 3: Crew Count Validation
1. Go to Step 5 (Staffing)
2. Set Crew Count: **0**
3. ✅ Should enforce minimum of 1
4. Set Supervisors: **10**
5. ✅ Should cap at 9

### Test 4: CC Contacts Feature
1. Go to Step 1
2. Select a Customer
3. Click "CC Contacts" dropdown
4. ✅ Should show only that customer's contacts
5. Select 2-3 contacts
6. ✅ Should show badges below
7. Change Customer
8. ✅ CC Contacts should reset (Note: no confirmation!)

### Test 5: Brand Logo Search
1. Go to Step 1
2. Enter Brand Name: "Coca-Cola"
3. Click "Find Logo" button
4. ✅ Should open Google Images search
5. Copy an image URL
6. Paste in "Brand Logo URL"
7. ✅ Should show preview below

---

## 🐛 Known Issues to Watch For

### Issue #1: Mixed Language Errors ⚠️
**What to look for:**
- Error messages in Chinese (请填写必填字段)
- Should be in English

**Where:** Any validation error
**Severity:** Medium

### Issue #2: Brand Logo Error ⚠️
**What to look for:**
- Enter invalid logo URL
- Image fails to load
- Error message: "Logo 加载失败" (Chinese)
- Multiple error messages if you retry

**Where:** Step 1 - Brand Logo field
**Severity:** Medium

### Issue #3: No Loading State ⚠️
**What to look for:**
- When dialog opens
- Dropdowns appear empty briefly
- Then suddenly populate

**Where:** Customer & Manager dropdowns
**Severity:** Low

---

## 📊 Expected Results

### ✅ What Should Work
- [x] All 7 steps navigate smoothly
- [x] Form validation prevents bad data
- [x] Date validation works correctly
- [x] Customer dropdown is searchable
- [x] CC Contacts filter by selected customer
- [x] Brand logo preview displays
- [x] Budget formats as currency (RM 1,000.50)
- [x] Review step shows all data correctly
- [x] Submit creates project successfully
- [x] Success toast notification appears
- [x] Dialog closes after submit
- [x] New project appears in projects list

### ⚠️ What Might Have Issues
- [ ] Error messages in Chinese (not English)
- [ ] Brand logo error handling (multiple errors)
- [ ] No loading indicators
- [ ] CC contacts reset without confirmation
- [ ] Large component (performance impact?)

---

## 🎯 Quick Checklist

### Before Testing
- [ ] Dev server running (http://localhost:5173)
- [ ] Browser console open (F12)
- [ ] Network tab ready (to check API calls)
- [ ] Test data ready (customer names, etc.)

### During Testing
- [ ] Try happy path (all fields correct)
- [ ] Try sad path (validation errors)
- [ ] Check console for errors
- [ ] Monitor network requests
- [ ] Test all 7 steps thoroughly

### After Testing
- [ ] Note any bugs found
- [ ] Check performance (lag, slow loads)
- [ ] Verify data saved to database
- [ ] Test on different screen sizes
- [ ] Check dark mode (if applicable)

---

## 🔍 Where to Look

### Browser Console
```javascript
// Check for errors
// Red text = errors ❌
// Yellow text = warnings ⚠️
// Blue text = info ℹ️
```

### Network Tab
```
Filter: "projects"
Look for:
- POST /projects (create new project)
- GET /companies (load customers)
- GET /company_contacts (load contacts)
- GET /users (load managers)

Status codes:
- 200/201 = Success ✅
- 400 = Validation error ⚠️
- 401 = Not authenticated ❌
- 500 = Server error ❌
```

### React DevTools
```
Components:
- NewProjectDialog
  - Check state values
  - Monitor re-renders
  - Inspect props
```

---

## 💡 Pro Tips

1. **Clear Console** before each test
   ```javascript
   console.clear()
   ```

2. **Monitor Re-renders**
   - React DevTools → Profiler
   - Record a session
   - Check for unnecessary renders

3. **Test Keyboard Navigation**
   - Use Tab key to navigate
   - Enter to submit
   - Esc to close

4. **Test with Bad Data**
   - Special characters: `<script>alert('xss')</script>`
   - Very long strings (500+ chars)
   - Emoji in project names: "🎉 Party Event"
   - SQL injection attempts: `'; DROP TABLE--`

5. **Check Mobile View**
   - Chrome DevTools → Toggle Device Toolbar
   - Test on iPhone/iPad sizes
   - Check touch interactions

---

## 📱 Mobile Testing (Optional)

```bash
# Get your local IP
ifconfig | grep "inet "

# Access from phone/tablet:
http://[YOUR_IP]:5173

# Example:
http://192.168.1.100:5173
```

---

## 🚨 Report Bugs

### Bug Template
```markdown
**Bug Title:** [Short description]

**Steps to Reproduce:**
1. Open Add New Project
2. Click on [field]
3. Enter [value]
4. Click [button]

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Screenshots:**
[Attach if available]

**Severity:** Critical / High / Medium / Low

**Browser:** Chrome 120.x
**OS:** macOS 14.x
```

---

## ✅ Done Testing?

### Post-Test Checklist
- [ ] All critical tests passed
- [ ] Documented any bugs found
- [ ] Tested on multiple browsers (optional)
- [ ] Tested on mobile (optional)
- [ ] Performance acceptable
- [ ] No console errors (or documented)
- [ ] Database entries verified

### Next Steps
1. Review `TEST_SUMMARY.md` for full report
2. Review `QA_TEST_REPORT.md` for technical details
3. Fix high-priority issues
4. Re-test after fixes
5. 🚀 Ship it!

---

**Happy Testing! 🧪**

*Need help? Check the other test reports:*
- `TEST_SUMMARY.md` - Executive summary
- `QA_TEST_REPORT.md` - Detailed technical report
- `browser-test-script.js` - Automated tests
