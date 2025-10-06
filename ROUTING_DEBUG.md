# Routing Debug Guide

## Current Routes Setup

### Standalone Routes (No MainAppLayout)
- `/login` - LoginPage
- `/set-password` - SetPasswordPage
- `/receipt-scanner` - ReceiptScannerPage
- `/job-discovery` - JobDiscoveryPage
- `/staff-dashboard` - StaffDashboardPage
- **`/report-sick-leave`** - ReportSickLeavePage ✅ NEW
- **`/sick-leave/pending`** - SickLeaveApprovalPage ✅ NEW
- `/location-feature-demo` - LocationFeatureDemo
- `/candidate-update-mobile/:candidateId` - MobileCandidateUpdatePage
- `/candidate/dashboard/:candidateId` - CandidateDashboardPage

### Routes with MainAppLayout
- `/dashboard`
- `/projects`
- `/projects/:projectId`
- `/calendar/*`
- `/tools`
- `/invites`
- `/candidates`
- `/team`
- `/settings`
- `/payments`
- `/goals`
- `/expenses`
- `/warehouse`

## Common Routing Issues & Solutions

### Issue 1: "Cannot read properties of null"
**Solution**: Ensure you're logged in before accessing protected routes

### Issue 2: Blank page
**Cause**: Component rendering error or missing imports
**Check**: Browser console for errors

### Issue 3: 404 Not Found
**Cause**: Route not properly defined or path mismatch
**Check**: Verify URL matches exact route path

### Issue 4: Navigation not working from NotificationBell
**Cause**: `useNavigate()` hook not working
**Solution**: NotificationBell must be inside BrowserRouter (already is ✅)

## How to Test Routes

### Test 1: Direct URL Access
1. Navigate to http://localhost:5174/report-sick-leave
2. Should show sick leave form (or redirect to login if not authenticated)

### Test 2: Direct URL Access (Approval Page)
1. Navigate to http://localhost:5174/sick-leave/pending
2. Should show approval page (or redirect to login if not authenticated)

### Test 3: Navigation from NotificationBell
1. Log in as a user
2. Check notification bell in top-right
3. Click a notification
4. Should navigate to action_url

## Debugging Steps

1. **Open Browser Console** (F12)
2. **Check for errors** - Look for red error messages
3. **Check Network tab** - See if routes are 404ing
4. **Check Authentication** - Verify user is logged in
5. **Check Route Path** - Ensure URL exactly matches route definition

## Potential Issues in Current Setup

### ✅ CORRECT
- Routes are properly defined in App.tsx
- Auth checks exist in ReportSickLeavePage
- NotificationBell is inside BrowserRouter
- All imports are correct

### ⚠️ POTENTIAL ISSUES
1. **Database tables not created** - Run migrations first
2. **Missing permissions** - Check Supabase RLS policies
3. **User not authenticated** - Login required for these routes
4. **Overlapping UI** - NotificationBell at `fixed top-4 right-20` might overlap

## Quick Fixes

### If routes show 404:
```bash
# Restart dev server
npm run dev
```

### If database errors:
```bash
# Apply migrations (via Supabase dashboard or CLI)
supabase db push
```

### If authentication issues:
- Check if user is logged in
- ReportSickLeavePage redirects to /login if not authenticated (line 92)
- SickLeaveApprovalPage requires currentUser from AppStateContext

## Next Steps

Please provide:
1. **Exact error message** from browser console
2. **Which route** is not working
3. **What behavior** you're seeing vs. expected
4. **Screenshot** of the error (if possible)
