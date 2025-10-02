# Quick Start Guide - Baito Mobile App

**App URL:** http://localhost:8087
**Status:** ✅ Running
**Auth:** Email Magic Link (FREE)

---

## 🚀 How to Login (First Time)

### Step 1: Go to Login Page
```
http://localhost:8087
```
You'll see the login screen.

### Step 2: Enter Your Email
- Enter any email you have access to
- Example: `your.email@gmail.com`

### Step 3: Click "Send Magic Link"
- Will show: "Check your email!" alert
- Supabase sends email to your inbox

### Step 4: Check Your Email
- **From:** noreply@mail.app.supabase.com
- **Subject:** "Confirm your signup" or "Magic Link"
- **Action:** Click the link in the email

### Step 5: Logged In!
- Link opens → Callback page
- Extracts tokens from URL
- Creates session
- Redirects to: `/worker` dashboard ✅

---

## ⚠️ IMPORTANT: Configure Supabase First

**Before testing, add redirect URL:**

1. Go to [Supabase Dashboard](https://app.supabase.com/project/aoiwrdzlichescqgnohi/auth/url-configuration)

2. Click **Authentication** → **URL Configuration**

3. Add to **Redirect URLs**:
   ```
   http://localhost:8087/auth/callback
   http://localhost:8087/**
   ```

4. Click **Save**

**Without this, the magic link won't work!**

---

## 📱 What You'll See After Login

### Worker Dashboard (`/worker`)
**Tabs:**
- **Gigs** - Browse available gigs (empty for now)
- **Profile** - Worker profile & logout

**Current State:**
- ✅ Tab navigation working
- ✅ Logout button working
- ⏳ No gigs yet (Week 2 feature)

**Screenshot:**
```
┌─────────────────────────────────┐
│     Available Gigs              │
├─────────────────────────────────┤
│                                 │
│   📦 No gigs available          │
│   Check back later for          │
│   new opportunities             │
│                                 │
├─────────────────────────────────┤
│  [Gigs]            [Profile]    │
└─────────────────────────────────┘
```

---

## 🔧 Alternative: Password Login

### If Email Magic Link Doesn't Work:

1. Click "Login with password instead"

2. First-time setup (via Supabase Dashboard):
   - Go to [Supabase Auth Users](https://app.supabase.com/project/aoiwrdzlichescqgnohi/auth/users)
   - Click "Add User"
   - Enter email & password
   - Click "Create User"

3. Then login:
   - Email: `your.email@example.com`
   - Password: `your_password`
   - Click "Login"

---

## 🐛 Troubleshooting

### Issue 1: "Invalid redirect URL" error
**Fix:** Add callback URL to Supabase Dashboard (see above)

### Issue 2: Email not received
**Check:**
- Spam/junk folder
- From: noreply@mail.app.supabase.com
- Can take 1-2 minutes

### Issue 3: Magic link expired
**Fix:**
- Links expire after 1 hour
- Request new magic link
- Click within 1 hour

### Issue 4: Still shows login page after clicking link
**Debug:**
1. Open browser console (F12)
2. Look for errors
3. Check console logs:
   - Should see: "Session created: your@email.com"
   - If not, URL hash tokens might not be extracted

**Quick fix:** Clear browser storage and try again
```javascript
localStorage.clear();
sessionStorage.clear();
```

---

## 📊 What's Currently Working

### ✅ Working Features:
- [x] Email magic link login
- [x] Password login (fallback)
- [x] Session management
- [x] Auto-redirect (logged in → /worker, logged out → /login)
- [x] Worker dashboard structure
- [x] Tab navigation
- [x] Logout functionality

### ⏳ Coming in Week 2:
- [ ] Gig browsing & filtering
- [ ] GPS-based clock-in/out
- [ ] Selfie verification
- [ ] Real-time attendance

---

## 🎯 Next Steps

### For You (Right Now):
1. **Configure Supabase redirect URL** (5 minutes)
2. **Test login flow** (send magic link → check email → click link)
3. **See worker dashboard** ✅

### For Development (Week 2):
4. Add gig browsing
5. Implement GPS clock-in
6. Add camera selfie capture
7. Real-time attendance tracking

---

## 💡 Quick Commands

### Start the app:
```bash
cd baito-mobile
npx expo start --web --port 8087
```

### Clear browser storage (if stuck):
```javascript
// Open browser console (F12), paste:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Check console for auth state:
```javascript
// Should see:
"Auth state changed: SIGNED_IN your@email.com"
```

---

## 📝 Summary

**Current State:**
- ✅ App running on http://localhost:8087
- ✅ Email magic link auth ($0 cost)
- ✅ Worker dashboard structure
- ⏳ No gigs data yet (normal - Week 2)

**To Login:**
1. Configure Supabase redirect URL
2. Enter email → Send magic link
3. Check email → Click link
4. ✅ Logged in to worker dashboard

**Status:** Week 1 Complete! Ready for Week 2 features.

---

**Need Help?** Check the logs:
- Browser console (F12)
- Look for: "Session created" or errors
- Supabase Dashboard → Logs → Auth
