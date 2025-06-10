# Password Reset Token Setup Instructions

## Quick Fix

You're seeing the error because the `password_reset_tokens` table doesn't exist in your database yet. Here's how to fix it:

### Option 1: Simple Setup (Recommended for Quick Start)

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `apply-password-reset-tokens-simple.sql`
4. Click "Run" to execute the script
5. You should see "Table created successfully!" message

### Option 2: Full Setup with Security (Recommended for Production)

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `apply-password-reset-tokens.sql`
4. Click "Run" to execute the script
5. This includes Row Level Security policies for better security

### Option 3: Using Supabase CLI

If you have the Supabase CLI configured with your database password:

```bash
cd "project 10"
supabase db push
```

## Verify Installation

After running the migration, you can verify the table was created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'password_reset_tokens';
```

## Features

Once the table is created, you'll be able to:

1. Click the share icon next to any user in the Users table
2. A password setup link will be generated and copied to your clipboard
3. Share this link with the user (via email, messaging, etc.)
4. The link expires after 24 hours for security
5. Users can use the link to set their password

## Troubleshooting

If you still see errors after creating the table:

1. Make sure you're logged in as a super admin or admin user
2. Check that the table was created in the `public` schema
3. Ensure your user has the necessary permissions
4. Try refreshing the page after creating the table

## Security Notes

- Password reset tokens expire after 24 hours
- Each token can only be used once
- Only admins can generate password reset links
- The token is securely random and cannot be guessed