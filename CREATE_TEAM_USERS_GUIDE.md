# 👥 Create Baito Team User Accounts

This guide explains how to create the following team user accounts:

| Email | Password | Name | Role |
|-------|----------|------|------|
| jesley@baito.events | jiyu3299 | Jesley | user |
| winnie@baito.events | winnie1106 | Winnie | user |
| ava@baito.events | yoketing0811 | Ava | user |
| jamilatulaili@baito.events | laili1994! | Jamila Tulaili | user |
| crystal@baito.events | Crys-8711 | Crystal | user |

---

## 🚀 Method 1: Automated Script (Recommended)

### Prerequisites
1. Get your **Supabase Service Role Key**:
   - Go to: https://app.supabase.com/project/aoiwrdzlichescqgnohi/settings/api
   - Copy the **service_role** key (starts with `eyJ...`)
   - Add to `.env`:
     ```bash
     SUPABASE_SERVICE_ROLE_KEY=eyJ...your_service_role_key
     ```

### Run the Script
```bash
# Install dependencies (if needed)
npm install

# Run the user creation script
node create-team-users.js
```

### Expected Output
```
🚀 Creating Baito Team User Accounts

==================================================

✅ Created auth user: jesley@baito.events
✅ Created user profile: jesley@baito.events

✅ Created auth user: winnie@baito.events
✅ Created user profile: winnie@baito.events

... (continues for all users)

==================================================

✨ User creation process completed!

📋 Created accounts:
   - jesley@baito.events (Jesley)
   - winnie@baito.events (Winnie)
   - ava@baito.events (Ava)
   - jamilatulaili@baito.events (Jamila Tulaili)
   - crystal@baito.events (Crystal)
```

---

## 📝 Method 2: Manual Creation via Supabase Dashboard

If the automated script doesn't work, create users manually:

### Step-by-Step
1. **Go to Supabase Dashboard**:
   - Navigate to: https://app.supabase.com/project/aoiwrdzlichescqgnohi/auth/users

2. **Click "Add user"**

3. **For Each User**, enter:

   **User 1: Jesley**
   - Email: `jesley@baito.events`
   - Password: `jiyu3299`
   - Auto Confirm User: ✅ ON
   - Click "Create user"

   **User 2: Winnie**
   - Email: `winnie@baito.events`
   - Password: `winnie1106`
   - Auto Confirm User: ✅ ON
   - Click "Create user"

   **User 3: Ava**
   - Email: `ava@baito.events`
   - Password: `yoketing0811`
   - Auto Confirm User: ✅ ON
   - Click "Create user"

   **User 4: Jamila Tulaili**
   - Email: `jamilatulaili@baito.events`
   - Password: `laili1994!`
   - Auto Confirm User: ✅ ON
   - Click "Create user"

   **User 5: Crystal**
   - Email: `crystal@baito.events`
   - Password: `Crys-8711`
   - Auto Confirm User: ✅ ON
   - Click "Create user"

4. **Verify All Users Created**:
   - Go to Authentication → Users
   - Should see all 5 users listed
   - All should have status "Confirmed"

---

## 🗄️ Method 3: SQL Script (Advanced)

If you prefer SQL or need to create profiles separately:

1. **Run in Supabase SQL Editor**:
   - Go to: https://app.supabase.com/project/aoiwrdzlichescqgnohi/sql
   - Open file: `create-team-users.sql`
   - Copy contents and run

2. **Then manually create auth users** (Method 2)

---

## ✅ Verification

After creating users, verify they can log in:

1. **Test Login**:
   - Go to your app: https://baitoai.netlify.app
   - Try logging in with each account
   - Verify access levels (all should be "user" role, not admin)

2. **Check User Profiles**:
   - Query in SQL Editor:
     ```sql
     SELECT id, email, full_name, role
     FROM public.users
     WHERE email LIKE '%@baito.events'
     ORDER BY email;
     ```
   - Should return all 5 users with role = 'user'

---

## 🔒 Security Notes

⚠️ **Important:**
- The **Service Role Key** is extremely powerful - never expose it in client code
- Only use it in server-side scripts or admin tools
- Keep it in `.env` (already gitignored)
- Passwords are stored securely hashed by Supabase Auth

---

## 🐛 Troubleshooting

### Issue: "User already exists"
- Check Authentication → Users in Supabase Dashboard
- If user exists, you can reset their password or delete and recreate

### Issue: "Service role key not found"
- Verify `.env` has `SUPABASE_SERVICE_ROLE_KEY`
- Make sure you copied the full key (starts with `eyJ`)
- Restart your terminal after updating `.env`

### Issue: "Permission denied"
- Ensure RLS policies are correct
- The script handles both auth and profile creation
- Check the `users` table exists in your database

### Issue: Script shows auth errors
- The anon key can't create users (by design)
- You must use the service role key
- Get it from: https://app.supabase.com/project/aoiwrdzlichescqgnohi/settings/api

---

## 📋 Files Created

- `create-team-users.js` - Automated Node.js script
- `create-team-users.sql` - SQL alternative script
- `CREATE_TEAM_USERS_GUIDE.md` - This guide
- `.env.example` - Updated with service key placeholder

---

## 🎯 Next Steps

After creating users:
1. ✅ Test login for each account
2. ✅ Verify they have "user" role (not admin)
3. ✅ Check they can access appropriate features
4. ✅ Update passwords if needed (users can change via app)
5. ✅ Set up any additional user permissions/groups

---

**Need help?** Check the Supabase Auth documentation:
https://supabase.com/docs/guides/auth
