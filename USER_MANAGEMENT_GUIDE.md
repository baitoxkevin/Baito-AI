# User Management Guide

This guide explains how to create and manage users in the system.

## Creating Users

To create a new user:

1. Navigate to Settings → Users tab
2. Click "Add User"
3. Fill in the user details:
   - **Full Name** (required)
   - **Email** (required)
   - **Role** - Choose from:
     - Staff
     - Manager
     - Client
     - Admin
     - Super Admin
   - **Password** (required, minimum 8 characters)
4. Click "Create User"

The user will be created immediately and will receive a confirmation email. They can then log in with their email and password.

## Updating Users

To update an existing user:

1. Navigate to Settings → Users tab
2. Find the user in the list
3. Click the Edit (pencil) icon
4. Update the user details (note: email cannot be changed)
5. Click "Update User"

## User Roles

The system supports the following roles:

- **Staff**: Basic user with limited permissions
- **Manager**: Can manage projects and view reports
- **Client**: External users with project-specific access
- **Admin**: Can manage most system settings
- **Super Admin**: Full system access, including user management

## Troubleshooting

### "Password reset tokens table not found" Error

This error occurs when trying to use the invite link method without the required database table.

**Solution:**
1. Run the `create-password-reset-tokens.sql` script in Supabase SQL Editor
2. Try creating the user again

### "Cannot create user directly" Error

This error occurs due to foreign key constraints between the `users` and `auth.users` tables.

**Solution:**
- Use Method 1 (provide a password when creating the user)
- Or ensure the password reset tokens table is properly set up

### User Already Exists

If you see "A user with this email already exists", it means:
- The email is already registered in the system
- You need to use a different email address
- Or edit the existing user instead

## Best Practices

1. **Always provide a password** when creating users if possible - it's simpler and more reliable
2. **Use strong passwords** - minimum 8 characters with mixed case, numbers, and symbols
3. **Assign appropriate roles** - follow the principle of least privilege
4. **Keep user information updated** - regularly review and update user details
5. **Document role assignments** - maintain a record of why users have specific roles

## Security Considerations

- Only Super Admins and Admins can create new users
- Users cannot change their own roles
- Password reset tokens expire after 72 hours
- All user actions are logged for audit purposes

## Troubleshooting

### "Could not find the 'avatar_seed' column" Error

This error occurs when optional columns are missing from the users table.

**Solution:**
1. Open your Supabase Dashboard
2. Navigate to the SQL Editor
3. Run the script in `add-missing-user-columns.sql`
4. Try creating the user again

The system will now automatically handle missing optional columns and create users with just the required fields.

### User Already Exists

If you see "A user with this email already exists", it means:
- The email is already registered in the system
- You need to use a different email address
- Or edit the existing user instead

### Rate Limit Errors

If you see "Too many attempts. Please try again later":
- Wait a few minutes before trying again
- This is a security feature to prevent abuse

## Need Help?

If you encounter issues not covered in this guide:
1. Check the browser console for detailed error messages
2. Verify your user permissions (you need Admin or Super Admin role)
3. Ensure your Supabase database is properly configured
4. Contact your system administrator for assistance