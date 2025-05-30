# Event Management System - User Workflow Guide

## System Overview
This is a comprehensive event management platform designed to handle project coordination, staffing, scheduling, payments, and expense tracking for event management companies.

## User Roles & Access Levels
- **Super Admin**: Full system access
- **Admin**: Company-level management
- **User**: Basic operational access
- **Guest**: Limited view access

## Main System Workflows

### 1. Authentication & Initial Setup
```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Login     │────►│   Dashboard  │────►│  Main App    │
│   Page      │     │  (Metrics)   │     │  Navigation  │
└─────────────┘     └──────────────┘     └──────────────┘
```

### 2. Project Management Workflow
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Settings   │     │   Projects   │     │   Project    │     │   Calendar   │
│  (Companies) │────►│    Page      │────►│   Details    │◄───►│    View      │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
       │                     │                     │
       │                     │                     │
       ▼                     ▼                     ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Create New   │     │  Filter &    │     │   Staffing   │
│  Company     │     │   Search     │     │    Tab       │
└──────────────┘     └──────────────┘     └──────────────┘
```

### 3. Staffing & Candidate Management
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Candidates  │     │   Generate   │     │   Mobile     │     │  Project     │
│    Page      │────►│ Update Link  │────►│   Update     │     │  Staffing    │
└──────────────┘     └──────────────┘     │    Form      │     └──────────────┘
       │                                   └──────────────┘            │
       │                                                               │
       ▼                                                               ▼
┌──────────────┐                                             ┌──────────────┐
│   Import     │                                             │   Assign     │
│ Candidates   │                                             │    Staff     │
└──────────────┘                                             └──────────────┘
```

### 4. Financial Management Workflow

#### A. Payroll Flow
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Project    │     │   Payroll    │     │   Payment    │     │   Payments   │
│  Staffing    │────►│  Submission  │────►│    Queue     │────►│    Page      │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                                        │
                                                                        ▼
                                                               ┌──────────────┐
                                                               │  Approval/   │
                                                               │  Rejection   │
                                                               └──────────────┘
```

#### B. Expense Claims Flow
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    Tools     │     │   Receipt    │     │   Expense    │     │   Admin      │
│   (Scanner)  │────►│   Upload     │────►│   Claims     │────►│  Approval    │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

### 5. Team Management (Internal)
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│     Team     │     │   Schedule   │     │    Check     │
│  Management  │────►│   Events     │────►│   Complete   │
└──────────────┘     └──────────────┘     └──────────────┘
```

## Page-by-Page User Guide

### 1. Login Page (`/login`)
- **Purpose**: System entry point
- **Actions**: 
  - Enter email and password
  - Click login to access dashboard
  - System validates credentials via Supabase

### 2. Dashboard (`/dashboard`)
- **Purpose**: Performance overview and metrics
- **Key Features**:
  - KPI cards (completion rate, on-time delivery, etc.)
  - Weekly goals tracking
  - Team leaderboard
  - Achievement system with XP and levels
- **Navigation**: Links to all major sections

### 3. Projects Page (`/projects`)
- **Purpose**: Central project management hub
- **Key Actions**:
  - Create new projects
  - Filter by status/priority/client
  - Group projects by various criteria
  - View project cards (SpotlightCard)
  - Navigate between months
  - Batch delete operations

### 4. Project Details (`/projects/:id`)
- **Purpose**: Individual project management
- **Tabs Available**:
  - Overview: Project info and timeline
  - Staffing: Assign candidates to positions
  - Expenses: Track project-related expenses
  - Documents: Upload/manage project documents
  - Tasks: Project task management
  - Calendar: Project schedule view

### 5. Candidates Page (`/candidates`)
- **Purpose**: Staff database management
- **Key Features**:
  - Loyalty tier system (Bronze → Diamond)
  - Performance metrics (rating, reliability)
  - Generate secure update links
  - Import candidates via text tool
  - Sort by experience, skills, availability

### 6. Calendar Page (`/calendar`)
- **Purpose**: Visual scheduling interface
- **Views**:
  - Calendar Grid: Month view with projects
  - List View: Tabular project list
- **Actions**:
  - Create projects with date selection
  - Navigate between months
  - Switch between views

### 7. Payments Page (`/payments`)
- **Purpose**: Payment approval workflow
- **Process**:
  1. Staff submit payroll from projects
  2. Batches appear as pending
  3. Admin reviews and approves/rejects
  4. Export approved payments

### 8. Expense Claims (`/tools` → Receipt Scanner)
- **Purpose**: Expense submission and tracking
- **Workflow**:
  1. Upload receipt via scanner
  2. Fill claim details
  3. Submit for approval
  4. Track status (draft/pending/approved/rejected)

### 9. Team Management (`/team`)
- **Purpose**: Internal team coordination
- **Features**:
  - Assign projects to team members
  - Schedule internal events
  - Track task completion

### 10. Settings (`/settings`)
- **Purpose**: System configuration
- **Sections**:
  - Companies: Client management
  - Candidates (Admin): Direct candidate editing
  - Staff (Admin): User management
  - Auth Check: Database testing

### 11. Tools Page (`/tools`)
- **Purpose**: Productivity utilities
- **Available Tools**:
  - Data Extraction (WhatsApp parser)
  - Receipt OCR Scanner
  - Payroll Manager
  - Resume Analyzer
  - Various other utilities

## Tips for New Users

1. **Start with Dashboard**: Get familiar with metrics and navigation
2. **Create a Test Project**: Use Projects page to create a sample project
3. **Add Candidates**: Import or manually add staff members
4. **Assign Staff**: Use project staffing tab to assign candidates
5. **Track Finances**: Submit test expense claims and payroll
6. **Use Calendar**: Visualize project schedules
7. **Explore Tools**: Enhance productivity with utility tools

## Common User Journeys

### Event Manager Journey
1. Login → Dashboard
2. Create new project in Projects page
3. Assign staff in Project Details → Staffing
4. Monitor progress in Calendar view
5. Submit payroll after event
6. Track payment approval

### Staff Member Journey
1. Receive update link via WhatsApp/Email
2. Update personal information
3. View assigned projects
4. Submit expense claims if applicable

### Finance Admin Journey
1. Login → Dashboard
2. Check Payments page for pending batches
3. Review and approve/reject payments
4. Process expense claims
5. Export payment data for processing

## Keyboard Shortcuts
- **Cmd/Ctrl + K**: Open spotlight search
- **Space (5x)**: Activate special visual effect
- Navigation shortcuts available in various pages

## Security Features
- Token-based candidate update links
- Role-based access control
- Activity logging for audit trails
- Secure payment approval workflow

## Support & Help
- Use the spotlight command (Cmd+K) for quick navigation
- Check tooltips for feature explanations
- Contact admin for role-based permissions