# BaitoAI Software Architecture

## System Overview
BaitoAI is a React-based recruitment management system with role-based access control, document management, and AI-assisted features.

### Core Technologies
- Frontend: React + TypeScript + Vite
- UI Framework: shadcn/ui + Tailwind CSS
- Authentication & Database: Supabase
- Document Storage: Google Drive
- RAG Integration: n8n

## Component Architecture

### 1. Authentication Layer
- Supabase authentication with custom user management
- Two-tier admin system:
  - Super Admin: Full system access, user management, project deletion/restoration
  - Regular Admin: Limited worker-level access, view-only for deleted projects
- Direct super admin access fallback for authentication issues

### 2. Core Modules
#### User Management
- Role-based access control
- User metadata management
- Authentication state monitoring
- Session persistence

#### Project Management
- Project CRUD operations
- Document library integration
- Project status tracking
- Soft delete functionality

#### Document Management
- Google Drive integration
- RAG (Retrieval Augmented Generation) via n8n
- Document categorization:
  - Project P&L (mandatory)
  - Project claims
  - Project proposals
  - Briefing decks

#### Admin Interface
- User administration
- Company management
- System settings
- Invitation system

### 3. UI Components
#### Navigation
- Role-based sidebar navigation
- Dynamic route rendering
- Access control integration

#### Admin Dashboard
- User management interface
- Role assignment
- System configuration
- Activity monitoring

## Data Flow Architecture

### Authentication Flow
1. User login via Supabase
2. Role and permissions verification
3. Access token management
4. Session persistence handling

### Project Management Flow
1. Project creation/modification
2. Document attachment
3. User assignment
4. Status updates
5. Soft delete handling

### Document Processing Flow
1. Document upload to Google Drive
2. RAG processing via n8n
3. Metadata extraction
4. Search indexing

## Security Architecture

### Access Control
- Role-based access control (RBAC)
- Super admin privileges
- Regular admin limitations
- Worker-level permissions

### Data Protection
- Supabase RLS policies
- Document access controls
- Audit logging
- Session management

## Database Schema

### Users Table
- Standard auth fields
- Role management
- Super admin flags
- User metadata

### Projects Table
- Project details
- Document references
- User assignments
- Soft delete support

### Documents Table
- Google Drive integration
- Document metadata
- Access controls
- Version tracking

## Integration Points

### External Services
1. Supabase
   - Authentication
   - Database
   - Real-time subscriptions

2. Google Drive
   - Document storage
   - File management
   - Access control

3. n8n
   - RAG processing
   - Document analysis
   - Metadata extraction

## Development Guidelines

### Authentication Implementation
- Internal authentication only
- No external OAuth providers
- Fallback super admin access after 20 retries
- Session persistence configuration

### UI Implementation
- shadcn/ui component library
- Tailwind CSS styling
- Consistent color scheme:
  - Admin: #FBD75B
  - Manager: #5484ED
  - Staff: #51B749
  - Client: #DC2127

### Testing Requirements
- Authentication flow validation
- Role-based access verification
- UI component testing
- Integration testing
- Security testing
