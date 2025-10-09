# Sprint Change Proposal: Auth Session & Cache Synchronization Fix

**Date:** 2025-10-07
**Severity:** 🔴 CRITICAL
**Status:** ✅ IMPLEMENTED - Ready for Testing
**Change Scope:** Major - Core Authentication & Data Loading
**Implementation Date:** 2025-10-07

---

## 1. Issue Summary

### Problem Statement

Users experience complete data loss after page refresh, requiring them to log out and log back in. The application becomes unusable after 1-2 page refreshes, with the following symptoms:

- ✅ **First Login:** Data loads successfully
- ❌ **After Refresh #1:** Data disappears, auth session appears degraded
- ❌ **After Refresh #2:** User forced back to login page
- 🔍 **User Avatar:** Changes from "KR" → "U" (logged out state)

### Discovery Context

Issue discovered during production usage testing. User reported the exact pattern: "database won't load... it only loads on the first login when clicked refresh, it will clear auth session and refresh one more time, it will go back to login."

### Evidence

1. **Cache System:** Cache version check disabled in `src/lib/cache.ts` (lines 20-44)
2. **Auth Timeouts:** Multiple timeout mechanisms racing against each other:
   - 3s timeout in `ensureAuthReady()` (supabase.ts)
   - 2s timeout in `fetchProjects()` (projects.ts)
   - 30s safety timeout in cache system
3. **No Session Tracking:** Cache doesn't invalidate when auth session changes
4. **Previous Fix Attempts:** auth-refresh-loop-issue.md documents earlier attempts that didn't resolve root cause

---

## 2. Impact Analysis

### Epic Impact

**No Direct Epic Impact** - This is a production bug fix that blocks all user workflows. Does not change product requirements or add new features.

### Story Impact

**Current Story:** None - emergency production fix
**Future Stories:** All authentication-dependent stories are blocked until this is resolved

### Artifact Conflicts

#### Technical Architecture (CRITICAL)

**Affected Components:**
- **Authentication System** (`src/lib/supabase.ts`, `src/lib/auth.ts`)
  - Current: Simple timeout-based session restore
  - Required: Retry logic + session validation + automatic refresh

- **Cache Layer** (`src/lib/cache.ts`)
  - Current: Version check disabled, no session awareness
  - Required: Re-enable version control + session-aware invalidation

- **Data Fetching** (`src/lib/projects.ts`)
  - Current: 2s auth timeout race condition
  - Required: Proper auth wait + session validation

**Architecture Patterns:**
- Current: Timeout-based "best effort" loading
- New: Explicit session validation with graceful degradation

#### PRD Impact

**MVP Status:** ❌ BLOCKS MVP
This is a showstopper bug that prevents basic application usage. Users cannot maintain authenticated sessions across page refreshes.

#### UI/UX Impact

**Current User Experience:**
1. Login successfully ✅
2. Use app normally ✅
3. Refresh page → Data disappears ❌
4. Refresh again → Kicked to login ❌

**Fixed User Experience:**
1. Login successfully ✅
2. Use app normally ✅
3. Refresh page → Data remains, session intact ✅
4. Session expires → Auto-refresh attempted → Graceful re-login prompt ✅

---

## 3. Root Cause Analysis

### Technical Flow Breakdown

#### Current (Broken) Flow

```
Page Load
  ↓
ensureAuthReady() starts (3s timeout)
  ↓
AppStateContext loads user (parallel)
  ↓
fetchProjects() called
  ↓ (2s timeout on auth)
Auth not ready yet → Continue anyway
  ↓
Database query with INVALID/EXPIRED session
  ↓
Cache lookup succeeds (stale data from previous session)
  ↓
Cache returns data with wrong session context
  ↓
Data appears briefly, then fails silently
  ↓
Next refresh: Auth completely fails → Logout
```

#### Root Causes Identified

1. **Cache Version Check Disabled**
   - Lines 20-44 in `src/lib/cache.ts` commented out
   - Comment: "DISABLED: Cache version check temporarily to debug loading issues"
   - Cache serves stale data indefinitely

2. **Auth Race Condition**
   - `fetchProjects()` has 2s timeout on `ensureAuthReady()`
   - `ensureAuthReady()` has 3s timeout
   - Data fetching proceeds before auth completes

3. **No Session Change Detection**
   - Cache doesn't know when user logs out or session changes
   - No mechanism to invalidate cache on auth state change

4. **No Session Refresh Logic**
   - When session expires, app doesn't attempt to refresh
   - Fails silently instead of recovering

### Why Previous Fixes Failed

The `auth-refresh-loop-issue.md` documents previous attempts that:
- ✅ Simplified `ensureAuthReady()`
- ✅ Removed aggressive session clearing
- ❌ Didn't fix cache synchronization
- ❌ Didn't add session validation
- ❌ Didn't remove race conditions in data fetching

---

## 4. Recommended Approach

### Selected Path: **Direct Adjustment (Option 1)**

**Why this approach:**
- ✅ No rollback needed - incremental fixes
- ✅ Maintains existing architecture patterns
- ✅ Low risk - targeted changes to specific files
- ✅ Fast implementation - 4 focused changes
- ✅ Testable - can verify each fix independently

**Rejected Alternatives:**

**Option 2: Rollback Previous Auth Fixes**
- ❌ Previous fixes were partially correct
- ❌ Would reintroduce aggressive session clearing
- ❌ Doesn't address cache synchronization

**Option 3: Complete Auth Rewrite**
- ❌ High risk - too many moving parts
- ❌ Long implementation time
- ❌ Could introduce new bugs

### Effort Estimate: **Medium (4-6 hours)**

- Proposal #1: 2 hours (cache + testing)
- Proposal #2: 1 hour (auth retry logic)
- Proposal #3: 30 minutes (remove timeout race)
- Proposal #4: 2 hours (session validation + testing)
- Integration Testing: 30 minutes

### Risk Level: **Low-Medium**

**Mitigations:**
- Each change is isolated to specific files
- Can be deployed incrementally
- Rollback strategy: Revert individual commits
- Extensive logging for debugging

### Timeline Impact: **0 days**

This is a bug fix that unblocks existing functionality. No timeline delay - actually accelerates delivery by making app usable.

---

## 5. Detailed Change Proposals

### **Proposal #1: Re-enable Cache Version Check with Session Awareness**

**File:** `src/lib/cache.ts`
**Lines:** 15-44 (replace commented code)
**Risk:** Low

**Changes:**
1. Increment `CACHE_VERSION` from `1.0.0` → `2.0.0` (forces one-time clear)
2. Re-enable cache version check
3. Add session ID tracking in localStorage
4. Monitor `supabase.auth.onAuthStateChange()`
5. Clear cache on `SIGNED_OUT` or session ID change
6. Extract `clearAllCaches()` helper function

**Testing:**
- Login → Verify cache populated
- Logout → Verify cache cleared
- Login as different user → Verify cache cleared

---

### **Proposal #2: Increase Auth Timeout & Add Retry Logic**

**File:** `src/lib/supabase.ts`
**Lines:** 52-75 (replace timeout logic)
**Risk:** Low

**Changes:**
1. Increase timeout: 3s → 5s
2. Add retry loop (max 2 retries)
3. Add 1s delay between retries
4. Improved logging for debugging

**Testing:**
- Normal load: Session restores in <1s
- Slow connection: Retries kick in, eventually succeeds
- No session: Logs correctly after all retries

---

### **Proposal #3: Remove Auth Timeout Race in Data Fetching**

**File:** `src/lib/projects.ts`
**Lines:** 38-43 (replace race condition)
**Risk:** Low

**Changes:**
1. Remove 2s timeout race
2. Wait for full `ensureAuthReady()` (now has built-in retry)
3. Add explicit session validation before queries
4. Log warning if no session (graceful degradation)

**Testing:**
- Normal load: Data fetches after auth ready
- No session: Logs warning, RLS policies prevent unauthorized access
- Session refresh: Data fetch waits correctly

---

### **Proposal #4: Add Session Validation Helper & Error Recovery**

**File:** `src/lib/auth.ts`
**Lines:** Add after line 27, modify `getUser()` function
**Risk:** Medium (touches core auth flow)

**Changes:**
1. Add `isSessionValid()` helper function
   - Checks session exists
   - Validates token not expired
2. Add `refreshSession()` helper function
   - Attempts Supabase token refresh
   - Returns success/failure
3. Modify `getUser()` to use session validation
   - Check validity first
   - Auto-refresh if expired
   - Throw clear error if refresh fails

**Testing:**
- Fresh session: Validates immediately
- Expired token: Auto-refreshes successfully
- Invalid session: Clear error, redirect to login
- Monitor console for refresh attempts

---

## 6. Implementation Handoff

### Change Scope Classification: **MINOR**

**Reasoning:**
- All changes confined to 3 files
- No database migrations needed
- No API contract changes
- No UI/UX modifications
- Direct implementation by development team

### Handoff: **Development Team**

**Implementation Order:**
1. **Proposal #4 First** - Session validation helpers (foundation)
2. **Proposal #2 Next** - Auth retry logic (uses helpers)
3. **Proposal #3 Next** - Remove data fetch race (uses improved auth)
4. **Proposal #1 Last** - Cache synchronization (depends on auth stability)

### Deliverables

**Code Changes:**
- ✅ `src/lib/auth.ts` - Session validation helpers
- ✅ `src/lib/supabase.ts` - Retry logic
- ✅ `src/lib/projects.ts` - Remove race condition
- ✅ `src/lib/cache.ts` - Session-aware cache

**Testing Checklist:**
- [ ] Unit tests for `isSessionValid()`
- [ ] Unit tests for `refreshSession()`
- [ ] Integration test: Login → Refresh → Data persists
- [ ] Integration test: Logout → Cache cleared
- [ ] Integration test: Session expiry → Auto-refresh
- [ ] Manual test: Multiple refresh cycles
- [ ] Manual test: Slow connection simulation

**Documentation:**
- [ ] Update `auth-refresh-loop-issue.md` with final resolution
- [ ] Add JSDoc comments to new helper functions
- [ ] Update architecture diagram (if exists) with cache-session relationship

---

## 7. Success Criteria

### Definition of Done

- [ ] User can refresh page indefinitely without losing data
- [ ] User avatar remains "KR" (or correct initials) after refresh
- [ ] Cache invalidates when logging out
- [ ] Cache invalidates when switching users
- [ ] Session auto-refreshes when expired (if possible)
- [ ] Clear error message if session cannot be refreshed
- [ ] All console warnings documented and expected
- [ ] No regression in login flow performance

### Monitoring

**Post-deployment metrics to watch:**
1. Auth initialization time (should be <2s average)
2. Session refresh success rate
3. Cache hit/miss ratio
4. User reports of data loss (should drop to zero)

---

## 8. Rollback Plan

### If Issues Arise

**Individual Proposal Rollback:**
Each proposal can be reverted independently via git:

```bash
# Rollback Proposal #1 (cache)
git revert <commit-hash-proposal-1>

# Rollback Proposal #2 (auth retry)
git revert <commit-hash-proposal-2>

# etc.
```

**Full Rollback:**
```bash
# Revert all 4 proposals
git revert <commit-hash-proposal-4>
git revert <commit-hash-proposal-3>
git revert <commit-hash-proposal-2>
git revert <commit-hash-proposal-1>
```

**Emergency Cache Clear:**
If cache issues persist in production, force clear all user caches:

```typescript
// src/lib/cache.ts - Change version number
const CACHE_VERSION = '2.1.0'; // Increment to force clear
```

---

## 9. Appendix

### Related Documents
- `docs/auth-refresh-loop-issue.md` - Previous fix attempts
- `scripts/seed-test-projects.js` - Not related to issue
- `supabase/migrations/20250303000000_default_users.sql` - Not related to issue

### Files Modified Summary
| File | Lines Changed | Risk | Impact |
|------|---------------|------|--------|
| `src/lib/cache.ts` | ~50 | Low | High - Fixes cache sync |
| `src/lib/supabase.ts` | ~30 | Low | High - Fixes auth retry |
| `src/lib/projects.ts` | ~10 | Low | Medium - Removes race |
| `src/lib/auth.ts` | ~60 | Medium | High - Adds validation |

### Technical Debt Addressed
- ✅ Re-enables cache version control
- ✅ Removes commented-out code
- ✅ Adds proper error handling
- ✅ Implements session lifecycle management

---

**Approval Required From:**
- [x] Kevin Baito (Product Owner)
- [ ] Development Team Lead
- [ ] QA Lead (for testing plan)

**Implementation Priority:** 🔴 CRITICAL - P0
**Target Completion:** Within 1 business day

---

**Generated by:** BMAD Method - Winston (Architect)
**Workflow:** Course Correction Analysis
**Date:** 2025-10-07
