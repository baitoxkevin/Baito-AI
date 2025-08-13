# Project System Architecture & Workflow

## System Overview Flowchart

```mermaid
flowchart TB
    subgraph "User Types"
        U1[Super Admin]
        U2[Admin]
        U3[Manager]
        U4[Client]
        U5[Staff/Candidate]
    end

    subgraph "Authentication"
        AUTH[Supabase Auth]
        AUTH --> PROFILE[User Profiles]
        AUTH --> ROLES[Role Management]
    end

    subgraph "Core Modules"
        CM[Candidate Management]
        PM[Project Management]
        SM[Staffing & Scheduling]
        EM[Expense Management]
        PAY[Payment & Payroll]
        COM[Company Management]
        TM[Task Management]
    end

    subgraph "Features"
        CM --> CM1[Profile Management]
        CM --> CM2[Performance Tracking]
        CM --> CM3[Loyalty System]
        CM --> CM4[Import/Export]
        
        PM --> PM1[Project Creation]
        PM --> PM2[Location Management]
        PM --> PM3[Budget Tracking]
        PM --> PM4[Document Storage]
        
        SM --> SM1[Staff Assignment]
        SM --> SM2[Schedule Management]
        SM --> SM3[Conflict Detection]
        SM --> SM4[Calendar View]
        
        EM --> EM1[Claim Creation]
        EM --> EM2[Receipt Upload/OCR]
        EM --> EM3[Approval Workflow]
        EM --> EM4[Project Tracking]
        
        PAY --> PAY1[Batch Creation]
        PAY --> PAY2[DuitNow Export]
        PAY --> PAY3[Approval Process]
        PAY --> PAY4[Payment History]
    end

    U1 --> AUTH
    U2 --> AUTH
    U3 --> AUTH
    U4 --> AUTH
    U5 --> AUTH

    PROFILE --> CM
    PROFILE --> PM
    PROFILE --> SM
    PROFILE --> EM
    PROFILE --> PAY
    PROFILE --> COM
    PROFILE --> TM
```

## Main Business Process Flow

```mermaid
flowchart LR
    subgraph "1. Project Setup"
        A[Client Request] --> B[Create Project]
        B --> C[Define Requirements]
        C --> D[Set Budget & Timeline]
        D --> E[Add Locations]
    end

    subgraph "2. Staffing"
        E --> F[Search Candidates]
        F --> G[Review Profiles]
        G --> H[Assign Staff]
        H --> I[Send Invitations]
        I --> J[Staff Confirmation]
    end

    subgraph "3. Execution"
        J --> K[Project Start]
        K --> L[Attendance Tracking]
        L --> M[Task Management]
        M --> N[Expense Claims]
        N --> O[Progress Updates]
    end

    subgraph "4. Completion"
        O --> P[Project End]
        P --> Q[Calculate Payroll]
        Q --> R[Process Payments]
        R --> S[Generate Reports]
        S --> T[Update Metrics]
    end
```

## Candidate Lifecycle

```mermaid
flowchart TD
    subgraph "Registration"
        R1[New Candidate] --> R2{Registration Type}
        R2 -->|Manual| R3[Fill Profile]
        R2 -->|Import| R4[Bulk Upload]
        R3 --> R5[Profile Verification]
        R4 --> R5
    end

    subgraph "Profile Management"
        R5 --> P1[Basic Info]
        P1 --> P2[Banking Details]
        P2 --> P3[Emergency Contact]
        P3 --> P4[Skills & Languages]
        P4 --> P5[Document Upload]
    end

    subgraph "Job Application"
        P5 --> A1[Browse Projects]
        A1 --> A2[Apply/Get Assigned]
        A2 --> A3{Status}
        A3 -->|Confirmed| A4[View Schedule]
        A3 -->|Pending| A5[Wait for Approval]
        A3 -->|Rejected| A6[View Other Jobs]
    end

    subgraph "Work & Payment"
        A4 --> W1[Work on Project]
        W1 --> W2[Submit Attendance]
        W2 --> W3[Submit Expenses]
        W3 --> W4[Receive Payment]
        W4 --> W5[Update Performance]
    end

    subgraph "Performance"
        W5 --> PF1[Rating Update]
        PF1 --> PF2[Loyalty Tier]
        PF2 --> PF3[Future Opportunities]
    end
```

## Payment Processing Flow

```mermaid
flowchart LR
    subgraph "Initiation"
        P1[Project Completion] --> P2[Generate Payroll]
        P2 --> P3[Review Staff Hours]
        P3 --> P4[Calculate Amounts]
    end

    subgraph "Batch Creation"
        P4 --> B1[Create Payment Batch]
        B1 --> B2[Add Staff Payments]
        B2 --> B3[Include Expenses]
        B3 --> B4[Set Payment Date]
    end

    subgraph "Approval"
        B4 --> A1{Manager Review}
        A1 -->|Approved| A2[Finance Review]
        A1 -->|Rejected| A3[Revise Batch]
        A2 -->|Approved| A4[Ready for Export]
        A2 -->|Rejected| A3
    end

    subgraph "Execution"
        A4 --> E1[Export DuitNow]
        E1 --> E2[Bank Processing]
        E2 --> E3[Payment Confirmation]
        E3 --> E4[Update Records]
        E4 --> E5[Notify Recipients]
    end
```

## Expense Management Flow

```mermaid
flowchart TD
    subgraph "Submission"
        E1[Expense Incurred] --> E2[Create Claim]
        E2 --> E3[Upload Receipt]
        E3 --> E4[OCR Processing]
        E4 --> E5[Verify Details]
        E5 --> E6[Submit for Approval]
    end

    subgraph "Approval Workflow"
        E6 --> A1{Project Manager}
        A1 -->|Approved| A2{Finance Team}
        A1 -->|Rejected| A3[Return to Staff]
        A2 -->|Approved| A4[Add to Payroll]
        A2 -->|Rejected| A3
        A3 --> E2
    end

    subgraph "Processing"
        A4 --> P1[Include in Payment Batch]
        P1 --> P2[Process Payment]
        P2 --> P3[Update Status]
        P3 --> P4[Archive Receipt]
    end
```

## System Architecture

```mermaid
flowchart TB
    subgraph "Frontend"
        UI[React + TypeScript]
        UI --> COMP[Components]
        UI --> PAGES[Pages]
        UI --> HOOKS[Custom Hooks]
        UI --> CTX[Context API]
    end

    subgraph "Backend Services"
        SUP[Supabase]
        SUP --> DB[(PostgreSQL)]
        SUP --> AUTH[Authentication]
        SUP --> STORE[File Storage]
        SUP --> RT[Realtime]
    end

    subgraph "External Services"
        OCR[OCR Service]
        BANK[Banking API]
        EMAIL[Email Service]
    end

    UI --> SUP
    UI --> OCR
    SUP --> BANK
    SUP --> EMAIL

    subgraph "Security"
        RLS[Row Level Security]
        TOKEN[Token Management]
        RBAC[Role-Based Access]
    end

    DB --> RLS
    AUTH --> TOKEN
    AUTH --> RBAC
```

## Data Model Overview

```mermaid
erDiagram
    USERS ||--o{ CANDIDATES : manages
    USERS ||--o{ PROJECTS : creates
    COMPANIES ||--o{ PROJECTS : owns
    PROJECTS ||--o{ PROJECT_STAFF : has
    CANDIDATES ||--o{ PROJECT_STAFF : assigned_to
    PROJECT_STAFF ||--o{ WORKING_DATES : has
    PROJECTS ||--o{ EXPENSE_CLAIMS : generates
    CANDIDATES ||--o{ EXPENSE_CLAIMS : submits
    EXPENSE_CLAIMS ||--o{ RECEIPTS : contains
    PROJECTS ||--o{ PAYMENT_BATCHES : creates
    PAYMENT_BATCHES ||--o{ PAYMENT_ITEMS : contains
    CANDIDATES ||--o{ PAYMENT_ITEMS : receives
    PROJECTS ||--o{ TASKS : has
    PROJECTS ||--o{ DOCUMENTS : stores
    CANDIDATES ||--o{ PERFORMANCE_METRICS : tracked_by
    CANDIDATES ||--o{ LOYALTY_STATUS : has

    USERS {
        uuid id PK
        string email
        string role
        json metadata
    }

    CANDIDATES {
        uuid id PK
        string name
        string ic_number
        string phone
        json banking_info
        float reliability_score
        string loyalty_tier
    }

    PROJECTS {
        uuid id PK
        string name
        uuid client_id FK
        date start_date
        date end_date
        string status
        decimal budget
    }

    PROJECT_STAFF {
        uuid id PK
        uuid project_id FK
        uuid candidate_id FK
        string status
        decimal daily_rate
    }
```

This comprehensive flowchart system shows:
1. **System Overview** - User types and core modules
2. **Main Business Process** - End-to-end project flow
3. **Candidate Lifecycle** - From registration to performance tracking
4. **Payment Processing** - Complete payroll workflow
5. **Expense Management** - Claim submission and approval
6. **System Architecture** - Technical stack and integrations
7. **Data Model** - Key database relationships

Each diagram can be rendered using any Mermaid-compatible tool or viewer.