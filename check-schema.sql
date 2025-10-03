-- Check users table structure and role enum
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_name = 'users' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there's a role enum type
SELECT
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname LIKE '%role%'
ORDER BY t.typname, e.enumsortorder;

-- Check existing users
SELECT id, email, full_name, role, created_at
FROM public.users
WHERE email LIKE '%@baito.events'
ORDER BY email;
