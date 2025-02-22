# Database Schema Reference

## Core Tables

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role UserRole NOT NULL,
  is_super_admin BOOLEAN DEFAULT FALSE,
  company_name TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  raw_user_meta_data JSONB,
  raw_app_meta_data JSONB
);

-- User Roles
CREATE TYPE UserRole AS ENUM (
  'super_admin',
  'admin',
  'manager',
  'client',
  'staff'
);
```

### Projects Table
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  client_id UUID REFERENCES users(id),
  manager_id UUID REFERENCES users(id),
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  crew_count INTEGER NOT NULL,
  filled_positions INTEGER NOT NULL,
  working_hours_start TEXT NOT NULL,
  working_hours_end TEXT NOT NULL,
  event_type TEXT NOT NULL,
  venue_address TEXT NOT NULL,
  venue_details TEXT,
  supervisors_required INTEGER NOT NULL,
  color TEXT NOT NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tasks Table
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TaskStatus NOT NULL,
  priority TEXT NOT NULL,
  project_id UUID REFERENCES projects(id),
  assigned_to UUID REFERENCES users(id),
  assigned_by UUID REFERENCES users(id),
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE TaskStatus AS ENUM (
  'backlog',
  'todo',
  'doing',
  'done'
);
```

### Documents Table
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  google_drive_id TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Security Policies

### Users Table Policies
```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Super Admin Access
CREATE POLICY "Super admins can do everything"
ON users FOR ALL TO authenticated
USING (
  users() IN (
    SELECT id FROM users WHERE is_super_admin = TRUE
  )
)
WITH CHECK (
  users() IN (
    SELECT id FROM users WHERE is_super_admin = TRUE
  )
);

-- Self Access
CREATE POLICY "Users can read their own data"
ON users FOR SELECT TO authenticated
USING (users() = id);
```

### Projects Table Policies
```sql
-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Super Admin Access
CREATE POLICY "Super admins can manage all projects"
ON projects FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = users()
    AND users.is_super_admin = true
  )
);

-- Regular User Access
CREATE POLICY "Regular users can only see non-deleted projects"
ON projects FOR SELECT TO authenticated
USING (
  deleted_at IS NULL OR
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = users()
    AND users.is_super_admin = true
  )
);
```

## Authentication Metadata

### User Metadata Structure
```typescript
interface UserMetadata {
  raw_user_meta_data: {
    full_name: string;
    email_verified: boolean;
    is_super_admin: boolean; // Source of truth for super admin status
  };
  raw_app_meta_data: {
    role: string;
    provider: string;
    providers: string[];
  };
}
```

## Foreign Key Relationships
- users.id → users(id)
- projects.client_id → users(id)
- projects.manager_id → users(id)
- projects.deleted_by → users(id)
- tasks.project_id → projects(id)
- tasks.assigned_to → users(id)
- tasks.assigned_by → users(id)
- documents.project_id → projects(id)
- documents.created_by → users(id)
