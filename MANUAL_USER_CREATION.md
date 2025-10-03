# 📝 Manual User Creation Instructions

The automated script encountered database errors. Please create users manually via Supabase Dashboard.

## ✅ Users to Create

Based on the errors, these users need to be created:

| Status | Email | Password | Name | Role |
|--------|-------|----------|------|------|
| ❌ Need | jesley@baito.events | jiyu3299 | Jesley | staff |
| ✅ Exists | winnie@baito.events | winnie1106 | Winnie | staff |
| ❌ Need | ava@baito.events | yoketing0811 | Ava | staff |
| ✅ Exists | jamilatulaili@baito.events | laili1994! | Jamila Tulaili | staff |
| ❌ Need | crystal@baito.events | Crys-8711 | Crystal | staff |

## 🚀 Create Missing Users (3 users)

### Step-by-Step for Each User:

1. **Go to Supabase Auth Dashboard**:
   ```
   https://app.supabase.com/project/aoiwrdzlichescqgnohi/auth/users
   ```

2. **Click "Add user" button**

3. **For Jesley:**
   - Email: `jesley@baito.events`
   - Password: `jiyu3299`
   - Auto Confirm User: ✅ **ON** (important!)
   - Click "Create user"

4. **For Ava:**
   - Email: `ava@baito.events`
   - Password: `yoketing0811`
   - Auto Confirm User: ✅ **ON**
   - Click "Create user"

5. **For Crystal:**
   - Email: `crystal@baito.events`
   - Password: `Crys-8711`
   - Auto Confirm User: ✅ **ON**
   - Click "Create user"

## 📋 Create User Profiles (All 5 users)

After creating auth users, create profiles in the `users` table:

1. **Go to Supabase SQL Editor**:
   ```
   https://app.supabase.com/project/aoiwrdzlichescqgnohi/sql
   ```

2. **Run this SQL** (copy and paste):

```sql
-- Create user profiles for Baito team
-- Note: Replace auth_id UUIDs with actual IDs from auth.users table

-- First, check existing auth users and get their IDs:
SELECT id, email FROM auth.users WHERE email LIKE '%@baito.events' ORDER BY email;

-- Then insert/update profiles (adjust UUIDs as needed):
INSERT INTO public.users (auth_id, email, full_name, role, is_active)
VALUES
  -- Get the actual UUID from above query for each email
  ((SELECT id FROM auth.users WHERE email = 'jesley@baito.events'), 'jesley@baito.events', 'Jesley', 'staff', true),
  ((SELECT id FROM auth.users WHERE email = 'winnie@baito.events'), 'winnie@baito.events', 'Winnie', 'staff', true),
  ((SELECT id FROM auth.users WHERE email = 'ava@baito.events'), 'ava@baito.events', 'Ava', 'staff', true),
  ((SELECT id FROM auth.users WHERE email = 'jamilatulaili@baito.events'), 'jamilatulaili@baito.events', 'Jamila Tulaili', 'staff', true),
  ((SELECT id FROM auth.users WHERE email = 'crystal@baito.events'), 'crystal@baito.events', 'Crystal', 'staff', true)
ON CONFLICT (email) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    auth_id = EXCLUDED.auth_id,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Verify the profiles were created:
SELECT email, full_name, role, is_active, created_at
FROM public.users
WHERE email LIKE '%@baito.events'
ORDER BY email;
```

## ✅ Verification

After creating all users:

1. **Check Auth Users**:
   - Go to: https://app.supabase.com/project/aoiwrdzlichescqgnohi/auth/users
   - Should see all 5 @baito.events users
   - All should be "Confirmed"

2. **Check User Profiles**:
   Run in SQL Editor:
   ```sql
   SELECT
     u.email,
     u.full_name,
     u.role,
     u.is_active,
     CASE WHEN u.auth_id IS NOT NULL THEN '✅ Linked' ELSE '❌ Not linked' END as auth_status
   FROM public.users u
   WHERE u.email LIKE '%@baito.events'
   ORDER BY u.email;
   ```

3. **Test Login**:
   - Try logging into the app with each account
   - Verify they have correct access level (staff role)

## 🔒 Important Notes

- **Valid Roles**: super_admin, admin, manager, staff, viewer
- **Staff Role**: General team member access level
- **Auto Confirm**: Must be ON to avoid email verification
- **Profile Link**: auth_id must match auth.users.id

## 🐛 Troubleshooting

### "User already exists"
- Check in Authentication → Users
- If exists, just create the profile in users table

### "Invalid role"
- Use only: super_admin, admin, manager, staff, or viewer
- We're using "staff" for these users

### Profile creation fails
- Ensure auth user exists first
- Check auth_id matches auth.users.id
- Verify email is unique in users table

## 📞 Need Help?

The automated script has issues with:
- Database errors (might be RLS or permissions)
- Service role key authentication

Manual creation via dashboard is the most reliable method.
