# Admin Navigation Tasks

## Role-Based Access Control
### Super Admin Capabilities
- Complete system access including user management
- Full system modification privileges
- Access to all projects regardless of assignment
- Project deletion and restoration capabilities
- Full edit access to deleted projects

### Regular Admin Limitations
- Limited to worker-level access
- Can view but not modify deleted projects
- Project access limited to assigned projects only

## Authentication Requirements
- Login page must render outside main application container
- Navigation bar visible only post-authentication
- Super admin users need visibility to all database tables
- Authentication handled internally without external OAuth providers

## Pending Tasks
1. Create placeholder pages for new admin sections:
   - CompaniesPage.tsx
     - Company management interface
     - CRUD operations for company records
     - Role-based access controls
   
   - InvitesPage.tsx
     - User invitation management
     - Email invitation system
     - Role assignment during invitation
   
   - SettingsPage.tsx
     - System configuration interface
     - User role management
     - Global settings controls

2. Update routing structure for admin section:
   - Implement nested routing under /admin/*
   - Add routes for companies, invites, and settings
   - Implement role-based route guards
   - Handle unauthorized access attempts

3. UI Implementation Requirements:
   - Follow shadcn UI patterns consistently
   - Match existing color scheme:
     - Admin: #FBD75B (bg-opacity-10)
     - Manager: #5484ED (bg-opacity-10)
     - Staff: #51B749 (bg-opacity-10)
     - Client: #DC2127 (bg-opacity-10)
   - Implement loading states
   - Add error handling
   - Ensure responsive design

## Testing Requirements
- Verify role-based access control
- Test authentication flows
- Validate UI components
- Check database access rules
- Test CRUD operations
- Verify navigation flows

## Fallback Authentication
If standard authentication fails after 20 retries:
- Implement direct super admin access path
- Bypass standard login flow
- Maintain security measures
- Log access attempts

## Database Schema Notes
Key fields in users table:
- role (standard auth role)
- is_super_admin (boolean, nullable)
- raw_user_meta_data (contains super admin flag)
- raw_app_meta_data (auth metadata)

## Implementation Guidelines
- Follow existing code patterns precisely
- Match UI/UX design perfectly
- Add comprehensive error handling
- Test all changes thoroughly
- Verify UI visually in browser
- Focus on core functionality
- Consider user perspective in testing
