# Manual Testing Guide: Auth Session Fix

**Purpose:** Verify that the auth session and cache fixes work correctly
**Estimated Time:** 5 minutes
**Date:** 2025-10-07

---

## 🎯 What We're Testing

The fix should prevent:
- ❌ Data disappearing after page refresh
- ❌ User avatar changing from "KR" → "U"
- ❌ Being forced to logout after 1-2 refreshes

---

## 📋 Step-by-Step Test Protocol

### **Pre-Test Setup**

1. Open Chrome/Edge (with DevTools)
2. Press `F12` to open DevTools
3. Go to **Console** tab
4. Clear console: Click 🚫 icon
5. Navigate to: `http://localhost:5173/login`

---

### **TEST 1: Initial Login & Data Load** ⏱️ 1 min

**Steps:**
1. ✅ Login with your credentials
2. ✅ Navigate to `/dashboard`
3. ✅ Wait 2-3 seconds for data to load

**Expected Results:**
```
Console should show:
[AUTH] Initializing Supabase auth...
[AUTH] Session restored in XXms
[CACHE] Version mismatch (1.0.0 -> 2.0.0), clearing all caches
[CACHE] All caches cleared
```

**Check:**
- [ ] Projects/data visible
- [ ] Avatar shows your initials (e.g., "KR")
- [ ] No errors in console

---

### **TEST 2: The Critical Refresh Test** ⏱️ 2 min

**🚨 THIS IS THE MAIN TEST - Do it carefully!**

**Steps:**
1. ✅ Press `F5` (or `Cmd+R` on Mac) to refresh
2. ✅ **Wait 3 seconds** - Watch the console
3. ✅ Repeat refresh **5 times total**

**After EACH refresh, check:**
- [ ] Data still visible (doesn't disappear)
- [ ] Avatar still shows your initials (NOT "U")
- [ ] Console shows: `[AUTH] Session restored in XXms`
- [ ] URL stays at `/dashboard` (doesn't kick to login)

**Console Logs to Look For:**

✅ **GOOD** - These are what you want to see:
```
[AUTH] Session restored in 45ms
[PROJECTS] No active session - data fetch may fail (can ignore if data loads)
[CACHE] CACHE HIT: projects/...
```

❌ **BAD** - If you see these, the fix didn't work:
```
clearing bad session data
Session restore timed out
Auth session missing
```

---

### **TEST 3: Session Validation** ⏱️ 30 sec

**Steps:**
1. ✅ Open Console in DevTools
2. ✅ Type and run this command:

```javascript
// Test session validation
import('./src/lib/auth.js').then(async ({ isSessionValid }) => {
  const valid = await isSessionValid();
  console.log('Session Valid:', valid);
});
```

**Expected:**
```
Session Valid: true
```

---

### **TEST 4: Logout & Cache Clearing** ⏱️ 1 min

**Steps:**
1. ✅ Clear console
2. ✅ Click **Logout** button
3. ✅ Watch console for cache clearing

**Expected Console Logs:**
```
[CACHE] Auth state changed, clearing cache
[CACHE] All caches cleared
```

**Check:**
1. ✅ Open DevTools → Application → Local Storage
2. ✅ Verify these keys are REMOVED:
   - `last_session_id`
   - `cache_*` (all cache keys)
3. ✅ Verify you're redirected to `/login`

---

### **TEST 5: Re-login & Fresh Cache** ⏱️ 30 sec

**Steps:**
1. ✅ Login again
2. ✅ Go to dashboard
3. ✅ Check console

**Expected:**
```
[AUTH] Session restored in XXms
[CACHE] CACHE MISS: projects/... (first time after cache clear)
```

**Check:**
- [ ] Data loads fresh
- [ ] Avatar correct
- [ ] New `last_session_id` in localStorage

---

## ✅ TEST RESULTS CHECKLIST

After completing all tests, mark these:

### **Critical Success Criteria:**
- [ ] ✅ Refreshed page 5+ times without data loss
- [ ] ✅ Avatar stayed correct (never changed to "U")
- [ ] ✅ No console errors about "clearing bad session"
- [ ] ✅ Cache cleared on logout
- [ ] ✅ Fresh cache created on re-login

### **Performance Metrics:**
- Auth restore time: _______ ms (should be < 500ms)
- Data load after refresh: _______ sec (should be < 2s)
- Number of successful refreshes: _______ (goal: 10+)

---

## 🐛 If Tests FAIL

### **Scenario 1: Data disappears after refresh**

**Diagnosis:**
- Cache synchronization might not be working
- Check: `localStorage.getItem('last_session_id')`

**Fix:**
- Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
- Clear Application → Storage
- Restart dev server

### **Scenario 2: Avatar changes to "U"**

**Diagnosis:**
- Session validation failing
- Auth token expired

**Check Console For:**
```
[AUTH] Invalid session detected, attempting refresh...
[AUTH] Session refresh failed
```

**Fix:**
- This means the session actually expired - login again
- If it happens immediately after login, report bug

### **Scenario 3: Console shows "clearing bad session"**

**Diagnosis:**
- Old code still running (cache issue)
- Build didn't pick up new changes

**Fix:**
```bash
# In terminal:
npm run build
# Or restart dev server:
Ctrl+C
npm run dev
```

---

## 📊 Expected Console Output (Full Flow)

### **On Initial Login:**
```
[AUTH] Initializing Supabase auth...
[AUTH] Session restored in 45ms
[CACHE] Version mismatch (1.0.0 -> 2.0.0), clearing all caches
[CACHE] All caches cleared
[CACHE] CACHE MISS: projects/
[CACHE] Starting request for projects/
[CACHE] Request completed for projects/ in 234ms
```

### **On First Refresh:**
```
[AUTH] Initializing Supabase auth...
[AUTH] Session restored in 38ms
[CACHE] CACHE HIT: projects/
```

### **On Subsequent Refreshes:**
```
[AUTH] Initializing Supabase auth...
[AUTH] Session restored in 42ms
[CACHE] CACHE HIT: projects/
```

### **On Logout:**
```
[CACHE] Auth state changed, clearing cache
[CACHE] All caches cleared
```

---

## 📸 Screenshots to Capture

If testing fails, please capture:

1. **Console logs** (full output)
2. **Network tab** (auth/projects requests)
3. **Application → Local Storage** (all keys)
4. **Browser version** and OS

---

## 🎉 Success Indicators

You'll know it's working when:

1. ✅ You can refresh 10+ times without issues
2. ✅ Console shows consistent `[AUTH] Session restored` logs
3. ✅ Cache hits after first load
4. ✅ No red errors in console
5. ✅ Data loads fast (<1s) on refreshes

---

## 📝 Test Results Form

**Tester:** Kevin Baito
**Date:** 2025-10-07
**Browser:** _______________
**OS:** macOS

| Test | Result | Notes |
|------|--------|-------|
| Initial Login | ⬜ Pass / ⬜ Fail | |
| 5 Refreshes | ⬜ Pass / ⬜ Fail | |
| Session Validation | ⬜ Pass / ⬜ Fail | |
| Logout & Cache Clear | ⬜ Pass / ⬜ Fail | |
| Re-login Fresh Cache | ⬜ Pass / ⬜ Fail | |

**Overall Result:** ⬜ PASS / ⬜ FAIL

**Additional Notes:**
_______________________________________________________
_______________________________________________________
_______________________________________________________

---

**If all tests PASS:** 🎉 The fix is working! You can commit the changes.

**If any test FAILS:** 📧 Share console logs and I'll help debug.

---

**Test Created By:** Winston (Architect) via BMAD Method
**Related Docs:**
- `/docs/SPRINT_CHANGE_PROPOSAL_AUTH_SESSION_FIX.md`
- `/docs/auth-refresh-loop-issue.md`
