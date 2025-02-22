# Component Architecture

## Frontend Components

### Core Components
1. App.tsx
   - Main application container
   - Route configuration
   - Authentication state management

2. Sidebar.tsx
   - Navigation management
   - Role-based menu rendering
   - User context integration

3. AdminPage.tsx
   - Admin interface
   - User management
   - System configuration
   - Role-based access control

### Feature Components
1. ProjectsPage.tsx
   - Project management
   - CRUD operations
   - Document integration

2. CalendarPage.tsx
   - Event management
   - Scheduling interface
   - Color-coded events

3. DocumentsPage.tsx
   - Document library
   - Google Drive integration
   - File management

### UI Components
1. shadcn/ui Components
   - Button
   - Dialog
   - Form
   - Table
   - Toast
   - Calendar

2. Custom Components
   - NotificationBell
   - ColorPicker
   - MentionInput
   - AIAssistant

## Backend Integration

### Supabase Integration
1. Authentication
   - User management
   - Session handling
   - Role-based access

2. Database
   - Real-time subscriptions
   - Row-level security
   - Data management

### External Services
1. Google Drive
   - Document storage
   - File management
   - Access control

2. n8n Integration
   - RAG processing
   - Document analysis
   - Metadata extraction

## Component Dependencies
- React Router for navigation
- Supabase client for backend communication
- shadcn/ui for UI components
- Tailwind CSS for styling
