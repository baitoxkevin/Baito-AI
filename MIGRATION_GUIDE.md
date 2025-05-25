# Supabase Migration Guide

## Prerequisites
1. Database password from Supabase dashboard
2. Supabase CLI installed (already available via npx)

## Steps to Run Migrations

### Option 1: Using Supabase CLI (Recommended)

1. **Get your database password:**
   - Go to: https://supabase.com/dashboard/project/aoiwrdzlichescqgnohi/settings/database
   - Copy the database password

2. **Run the migrations:**
   ```bash
   cd "/Users/baito.kevin/Downloads/project 10"
   npx supabase db push
   ```
   - Enter your database password when prompted
   - Wait for migrations to complete

3. **Verify migrations:**
   ```bash
   npx supabase db diff
   ```
   - This should show no differences if all migrations were applied

### Option 2: Using Supabase Dashboard

1. **Go to SQL Editor:**
   - Navigate to: https://supabase.com/dashboard/project/aoiwrdzlichescqgnohi/sql/new

2. **Run security migrations in order:**
   
   a. First, run the secure candidate tokens migration:
   ```sql
   -- Copy contents from: supabase/migrations/20250701000000_secure_candidate_tokens.sql
   ```
   
   b. Then, run the enhanced security tables migration:
   ```sql
   -- Copy contents from: supabase/migrations/20250701100000_enhanced_security_tables.sql
   ```

3. **Verify tables were created:**
   ```sql
   -- Check if security tables exist
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN (
     'candidate_verification_tokens',
     'security_rate_limits',
     'security_audit_logs',
     'csrf_tokens',
     'ip_blacklist'
   );
   ```

### Option 3: Using Database Client

If you have a PostgreSQL client (TablePlus, pgAdmin, etc.):

1. **Connection details:**
   - Host: `aws-0-us-east-1.pooler.supabase.com`
   - Database: `postgres`
   - User: `postgres.aoiwrdzlichescqgnohi`
   - Password: (from dashboard)
   - Port: `5432`

2. **Run migrations in order**

## Important Security Migrations

The two critical migrations for the candidate update security system are:

1. **`20250701000000_secure_candidate_tokens.sql`**
   - Creates `candidate_verification_tokens` table
   - Adds token generation functions
   - Sets up 1-hour token expiration

2. **`20250701100000_enhanced_security_tables.sql`**
   - Creates rate limiting tables
   - Adds security audit logging
   - Implements IP blacklisting
   - Adds CSRF protection tables

## Post-Migration Verification

After running migrations, verify everything is working:

```sql
-- Test token generation
SELECT generate_candidate_verification_token(
  'YOUR_CANDIDATE_ID'::uuid,
  NULL,
  1 -- 1 hour expiration
);

-- Check security tables
SELECT COUNT(*) FROM security_rate_limits;
SELECT COUNT(*) FROM security_audit_logs;

-- Verify functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'generate_candidate_verification_token',
  'validate_candidate_token_secure',
  'check_suspicious_activity'
);
```

## Troubleshooting

### If migrations fail:

1. **Check for conflicts:**
   ```bash
   npx supabase db diff
   ```

2. **Reset specific tables (if needed):**
   ```sql
   DROP TABLE IF EXISTS candidate_verification_tokens CASCADE;
   DROP TABLE IF EXISTS security_rate_limits CASCADE;
   -- etc.
   ```

3. **Re-run migrations**

### Common Issues:

- **Permission denied**: Make sure you're using the correct database password
- **Table already exists**: Drop the table first or modify the migration
- **Function already exists**: Drop the function with CASCADE

## Security Checklist

After migrations are complete:

- [ ] Verify all security tables are created
- [ ] Test token generation function
- [ ] Confirm rate limiting is working
- [ ] Check audit log entries are being created
- [ ] Test the candidate update flow end-to-end

## Next Steps

1. Test the candidate update system:
   - Generate a test update link
   - Access it and verify security features work
   - Check audit logs for entries

2. Monitor security events:
   - Add the SecurityMonitoringPanel to your admin dashboard
   - Review security logs regularly
   - Adjust rate limits as needed

3. Configure production settings:
   - Update CORS settings
   - Set proper security headers
   - Enable HTTPS enforcement