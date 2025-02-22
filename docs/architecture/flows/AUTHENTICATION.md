# Authentication Flow

## Standard Authentication Flow
1. User accesses login page
2. Credentials validation via Supabase
3. Role and permissions verification
4. Session token generation
5. User metadata retrieval
6. Access control implementation

## Super Admin Authentication
1. Standard authentication attempt
2. Role verification for super admin status
3. Access to all system features
4. Full CRUD capabilities
5. System-wide visibility

## Regular Admin Authentication
1. Standard authentication process
2. Limited access rights
3. View-only for certain features
4. Project-specific access

## Fallback Authentication
After 20 failed standard authentication attempts:
1. Direct super admin access path
2. Bypass normal authentication flow
3. Maintain security logging
4. Temporary access provision

## Session Management
1. Token management
2. Session persistence
3. Auto-refresh mechanism
4. Logout handling
