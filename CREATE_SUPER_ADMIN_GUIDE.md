# How to Create a Super Admin Account

## Method 1: Using Supabase Dashboard (Easiest)

1. **Create the Auth User**
   - Go to your [Supabase Dashboard](https://supabase.com/dashboard)
   - Navigate to **Authentication** > **Users**
   - Click **Add user** > **Create new user**
   - Enter:
     - Email: `admin@baitoevents.com` (or your preferred email)
     - Password: Choose a secure password
     - ✅ Check "Auto Confirm User"
   - Click **Create user**
   - Copy the User ID that appears

2. **Grant Super Admin Privileges**
   - Go to **SQL Editor** in your Supabase Dashboard
   - Run this SQL (replace the email if you used a different one):
   ```sql
   SELECT setup_super_admin('admin@baitoevents.com');
   ```
   
   If the function doesn't exist, first run the migration:
   - Go to the migrations folder
   - Copy the contents of `20250525000000_create_super_admin.sql`
   - Paste and run in SQL Editor

## Method 2: Direct SQL Insert

If Method 1 doesn't work, use this direct approach:

1. **Create the Auth User** (same as Method 1, step 1)

2. **Run this SQL** (replace values):
   ```sql
   INSERT INTO public.users (
     id,
     email,
     username,
     full_name,
     role,
     is_super_admin,
     avatar_seed,
     created_at,
     updated_at
   ) VALUES (
     'PASTE_USER_ID_HERE', -- From step 1
     'admin@baitoevents.com', -- Your email
     'admin', -- Username
     'Super Administrator',
     'admin',
     true, -- This makes them super admin
     'randomseed123',
     NOW(),
     NOW()
   )
   ON CONFLICT (id) DO UPDATE SET
     is_super_admin = true,
     role = 'admin',
     updated_at = NOW();
   ```

## Testing Your Super Admin Account

1. Go to http://localhost:5174/login
2. Enter your credentials:
   - Email: `admin@baitoevents.com`
   - Password: The password you set
3. Click "Sign In"

You should now have full super admin access to the system!

## Troubleshooting

- **"Invalid login credentials"**: Make sure the user exists in Authentication > Users
- **"User profile not found"**: Run the SQL commands above to create the profile
- **Can't access admin features**: Verify `is_super_admin` is `true` in the users table