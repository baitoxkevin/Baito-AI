# Event Management System - Visual Workflow Diagram

## System Architecture Overview

```mermaid
graph TB
    subgraph "Authentication Layer"
        A[Login Page] --> B[Supabase Auth]
        B --> C{Authenticated?}
        C -->|Yes| D[Dashboard]
        C -->|No| A
    end

    subgraph "Main Navigation Hub"
        D --> E[Sidebar Navigation]
        E --> F[Projects]
        E --> G[Calendar]
        E --> H[Candidates]
        E --> I[Payments]
        E --> J[Tools]
        E --> K[Team]
        E --> L[Settings]
    end

    subgraph "Project Management Flow"
        F --> M[Project List]
        M --> N[Create Project]
        M --> O[Filter/Search]
        M --> P[SpotlightCard]
        P --> Q[Project Details]
        Q --> R[Staffing Tab]
        Q --> S[Expenses Tab]
        Q --> T[Documents Tab]
        Q --> U[Tasks Tab]
    end

    subgraph "Staffing Workflow"
        H --> V[Candidate List]
        V --> W[Add Candidate]
        V --> X[Import Candidates]
        V --> Y[Generate Update Link]
        Y --> Z[Mobile Update Form]
        R --> AA[Assign Staff]
        AA --> V
    end

    subgraph "Financial Workflows"
        R --> AB[Submit Payroll]
        AB --> AC[Payment Queue]
        AC --> AD[Payment Batches]
        AD --> I
        I --> AE{Approve/Reject}
        
        J --> AF[Receipt Scanner]
        AF --> AG[Expense Claims]
        AG --> AH{Claim Approval}
    end

    subgraph "Scheduling System"
        G --> AI[Calendar View]
        G --> AJ[List View]
        AI --> AK[Date Selection]
        AK --> N
    end

    subgraph "Configuration"
        L --> AL[Companies]
        L --> AM[Users]
        L --> AN[Permissions]
        AL --> AO[Client Database]
        AO --> N
    end
```

## Detailed User Flow Diagrams

### 1. Project Creation and Management Flow

```mermaid
sequenceDiagram
    participant U as User
    participant S as Settings
    participant P as Projects Page
    participant D as Project Details
    participant C as Calendar
    participant DB as Database

    U->>S: Create Company (if new client)
    S->>DB: Save company data
    U->>P: Navigate to Projects
    U->>P: Click "New Project"
    P->>DB: Create project record
    DB-->>P: Return project ID
    P->>D: Open project details
    U->>D: Fill project information
    U->>D: Navigate to Staffing Tab
    U->>D: Assign candidates
    D->>DB: Update project staffing
    U->>C: View in calendar
    C->>DB: Fetch project schedule
```

### 2. Candidate Management and Assignment Flow

```mermaid
flowchart LR
    A[Candidates Page] --> B{Action?}
    B -->|Add New| C[Create Candidate Form]
    B -->|Import| D[Text Import Tool]
    B -->|Update| E[Generate Secure Link]
    
    C --> F[Save to Database]
    D --> G[Parse & Validate]
    G --> F
    E --> H[Send Link via WhatsApp]
    H --> I[Mobile Update Form]
    I --> J[Candidate Updates Info]
    J --> F
    
    F --> K[Available in Staffing]
    K --> L[Project Assignment]
    L --> M[Working Schedule]
```

### 3. Payment Processing Workflow

```mermaid
stateDiagram-v2
    [*] --> ProjectStaffing: Staff Assigned
    ProjectStaffing --> PayrollCalculation: Event Completed
    PayrollCalculation --> PaymentSubmission: Calculate Hours & Rates
    PaymentSubmission --> PaymentQueue: Submit Batch
    PaymentQueue --> PendingApproval: Queue Processing
    
    PendingApproval --> AdminReview: Admin Access
    AdminReview --> Approved: Approve
    AdminReview --> Rejected: Reject
    
    Approved --> ExportData: Generate Export
    ExportData --> PaymentProcessed: External Processing
    PaymentProcessed --> [*]
    
    Rejected --> ProjectStaffing: Revise & Resubmit
```

### 4. Expense Claims Flow

```mermaid
graph TD
    A[User] --> B[Tools Page]
    B --> C[Receipt Scanner]
    C --> D[Upload Receipt]
    D --> E[OCR Processing]
    E --> F[Fill Claim Form]
    F --> G{Save as Draft?}
    G -->|Yes| H[Draft Claims]
    G -->|No| I[Submit Claim]
    I --> J[Pending Approval]
    J --> K[Admin Review]
    K --> L{Decision}
    L -->|Approve| M[Approved Claims]
    L -->|Reject| N[Rejected Claims]
    M --> O[Payment Processing]
    H --> F
```

### 5. Calendar and Scheduling Integration

```mermaid
gantt
    title Project Timeline View
    dateFormat  YYYY-MM-DD
    section Project A
    Planning           :a1, 2024-01-01, 7d
    Staffing          :a2, after a1, 3d
    Event Execution   :a3, after a2, 2d
    Payroll           :a4, after a3, 1d
    
    section Project B
    Planning           :b1, 2024-01-05, 5d
    Staffing          :b2, after b1, 2d
    Event Execution   :b3, after b2, 3d
    Payroll           :b4, after b3, 1d
    
    section Project C
    Planning           :c1, 2024-01-10, 4d
    Staffing          :c2, after c1, 2d
    Event Execution   :c3, after c2, 1d
    Payroll           :c4, after c3, 1d
```

## User Role Permissions Matrix

```mermaid
graph LR
    subgraph "Super Admin"
        SA1[All Features]
        SA2[System Settings]
        SA3[Role Management]
        SA4[Company Management]
    end
    
    subgraph "Admin"
        A1[Project Management]
        A2[Payment Approval]
        A3[Expense Approval]
        A4[Staff Management]
    end
    
    subgraph "User"
        U1[View Projects]
        U2[Submit Expenses]
        U3[Update Own Info]
        U4[View Calendar]
    end
    
    subgraph "Guest"
        G1[Limited View]
        G2[Update Own Profile]
    end
```

## Quick Start Guide for New Users

```mermaid
flowchart TD
    Start([New User Login]) --> Dashboard[View Dashboard]
    Dashboard --> Explore{Explore System}
    
    Explore --> Path1[Project Manager Path]
    Path1 --> CreateCompany[1. Add Client Company]
    CreateCompany --> CreateProject[2. Create First Project]
    CreateProject --> AddStaff[3. Assign Staff]
    AddStaff --> Monitor[4. Monitor Progress]
    
    Explore --> Path2[Staff Coordinator Path]
    Path2 --> AddCandidates[1. Import Candidates]
    AddCandidates --> UpdateInfo[2. Send Update Links]
    UpdateInfo --> AssignProjects[3. Assign to Projects]
    AssignProjects --> TrackWork[4. Track Working Hours]
    
    Explore --> Path3[Finance Admin Path]
    Path3 --> ReviewPayments[1. Check Payment Queue]
    ReviewPayments --> ProcessClaims[2. Review Expense Claims]
    ProcessClaims --> ApprovePayments[3. Approve Payments]
    ApprovePayments --> Export[4. Export for Processing]
    
    Monitor --> Complete([Event Complete])
    TrackWork --> Complete
    Export --> Complete
```

## Data Flow Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[React Components]
        State[Local State Management]
        Cache[View Cache]
    end
    
    subgraph "API Layer"
        Auth[Supabase Auth]
        RLS[Row Level Security]
        Functions[Database Functions]
    end
    
    subgraph "Database Layer"
        Projects[(Projects Table)]
        Candidates[(Candidates Table)]
        Staff[(Project Staff Table)]
        Payments[(Payments Table)]
        Claims[(Expense Claims Table)]
    end
    
    UI <--> State
    State <--> Cache
    Cache <--> Auth
    Auth <--> RLS
    RLS <--> Functions
    Functions <--> Projects
    Functions <--> Candidates
    Functions <--> Staff
    Functions <--> Payments
    Functions <--> Claims
    
    Projects --> Staff
    Candidates --> Staff
    Staff --> Payments
    Projects --> Claims
```

## Security and Access Control Flow

```mermaid
flowchart TD
    A[User Request] --> B{Authenticated?}
    B -->|No| C[Redirect to Login]
    B -->|Yes| D[Check Role]
    
    D --> E{Role Type}
    E -->|Super Admin| F[Full Access]
    E -->|Admin| G[Company Scope]
    E -->|User| H[Limited Access]
    E -->|Guest| I[Minimal Access]
    
    F --> J[All Features Available]
    G --> K[Company Data Only]
    H --> L[Own Data + View]
    I --> M[Profile Update Only]
    
    J --> N[Render UI]
    K --> N
    L --> N
    M --> N
```

This comprehensive workflow guide and diagram set provides:
1. System architecture overview
2. Detailed user flows for each major feature
3. Visual representations of data flow
4. Permission matrices
5. Quick start guides for different user types

The diagrams can be rendered using any Mermaid-compatible viewer or documentation system.