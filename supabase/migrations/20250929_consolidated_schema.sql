-- ============================================================================
-- BAITO-AI CONSOLIDATED DATABASE SCHEMA
-- Version: 1.0.0
-- Date: 2025-09-29
-- Description: Consolidated and optimized database schema
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Organizations (Companies)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('agency', 'client', 'vendor')),
    logo_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(type);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);
CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations USING gin(name gin_trgm_ops);

-- Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'manager', 'staff', 'viewer')),
    organization_id UUID REFERENCES organizations(id),
    avatar_url TEXT,
    permissions JSONB DEFAULT '{}',
    last_login TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    client_id UUID REFERENCES organizations(id),
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'pending', 'active', 'completed', 'cancelled')),
    type TEXT NOT NULL,
    priority TEXT DEFAULT 'medium'
        CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    start_date DATE NOT NULL,
    end_date DATE,
    venue_address TEXT,
    venue_location JSONB,
    crew_count INTEGER DEFAULT 0,
    budget DECIMAL(15,2),
    color TEXT DEFAULT '#3B82F6',
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_dates ON projects(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_code ON projects(code);
CREATE INDEX IF NOT EXISTS idx_projects_status_dates ON projects(status, start_date, end_date);

-- Staff/Candidates
CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ic_number TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    postcode TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    nationality TEXT DEFAULT 'Malaysian',
    status TEXT DEFAULT 'active'
        CHECK (status IN ('active', 'inactive', 'blacklisted', 'pending')),
    profile JSONB DEFAULT '{}',
    skills TEXT[],
    languages TEXT[],
    shirt_size TEXT,
    rating DECIMAL(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
    total_projects INTEGER DEFAULT 0,
    avatar_url TEXT,
    emergency_contact JSONB,
    bank_details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_candidates_ic ON candidates(ic_number);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_skills ON candidates USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_candidates_name ON candidates USING gin(full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_candidates_rating ON candidates(rating DESC);

-- Project Staff Assignments
CREATE TABLE IF NOT EXISTS project_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES candidates(id),
    role TEXT NOT NULL,
    status TEXT DEFAULT 'assigned'
        CHECK (status IN ('assigned', 'confirmed', 'declined', 'completed', 'no_show')),
    daily_rate DECIMAL(10,2),
    start_date DATE,
    end_date DATE,
    check_in_time TIME,
    check_out_time TIME,
    actual_hours DECIMAL(5,2),
    performance_rating INTEGER CHECK (performance_rating >= 1 AND performance_rating <= 5),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_project_staff_project ON project_staff(project_id);
CREATE INDEX IF NOT EXISTS idx_project_staff_candidate ON project_staff(candidate_id);
CREATE INDEX IF NOT EXISTS idx_project_staff_status ON project_staff(status);
CREATE INDEX IF NOT EXISTS idx_project_staff_dates ON project_staff(start_date, end_date);

-- ============================================================================
-- FINANCIAL TABLES
-- ============================================================================

-- Payment Batches
CREATE TABLE IF NOT EXISTS payment_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_reference TEXT UNIQUE NOT NULL,
    project_id UUID REFERENCES projects(id),
    status TEXT DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'approved', 'rejected', 'completed')),
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    payment_date DATE NOT NULL,
    payment_method TEXT DEFAULT 'bank_transfer',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_batches_status ON payment_batches(status);
CREATE INDEX IF NOT EXISTS idx_payment_batches_date ON payment_batches(payment_date);
CREATE INDEX IF NOT EXISTS idx_payment_batches_project ON payment_batches(project_id);
CREATE INDEX IF NOT EXISTS idx_payment_batches_reference ON payment_batches(batch_reference);

-- Individual Payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES payment_batches(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES candidates(id),
    project_id UUID REFERENCES projects(id),
    amount DECIMAL(15,2) NOT NULL,
    type TEXT NOT NULL DEFAULT 'salary'
        CHECK (type IN ('salary', 'allowance', 'bonus', 'expense', 'other')),
    status TEXT DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    payment_date DATE NOT NULL,
    reference_number TEXT,
    bank_transaction_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_batch ON payments(batch_id);
CREATE INDEX IF NOT EXISTS idx_payments_candidate ON payments(candidate_id);
CREATE INDEX IF NOT EXISTS idx_payments_project ON payments(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_type ON payments(type);

-- Expense Claims
CREATE TABLE IF NOT EXISTS expense_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_number TEXT UNIQUE NOT NULL,
    project_id UUID REFERENCES projects(id),
    candidate_id UUID REFERENCES candidates(id),
    submitted_by UUID REFERENCES users(id),
    amount DECIMAL(15,2) NOT NULL,
    category TEXT NOT NULL
        CHECK (category IN ('transport', 'food', 'accommodation', 'materials', 'other')),
    status TEXT DEFAULT 'pending'
        CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'paid')),
    description TEXT,
    receipt_urls TEXT[],
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expense_claims_project ON expense_claims(project_id);
CREATE INDEX IF NOT EXISTS idx_expense_claims_candidate ON expense_claims(candidate_id);
CREATE INDEX IF NOT EXISTS idx_expense_claims_status ON expense_claims(status);
CREATE INDEX IF NOT EXISTS idx_expense_claims_category ON expense_claims(category);
CREATE INDEX IF NOT EXISTS idx_expense_claims_number ON expense_claims(claim_number);

-- ============================================================================
-- OPERATIONAL TABLES
-- ============================================================================

-- Attendance Records
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_staff_id UUID REFERENCES project_staff(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    check_in_location JSONB,
    check_out_location JSONB,
    status TEXT NOT NULL DEFAULT 'absent'
        CHECK (status IN ('present', 'absent', 'late', 'early_leave', 'holiday')),
    hours_worked DECIMAL(4,2),
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_staff_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_staff ON attendance(project_staff_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES users(id),
    status TEXT DEFAULT 'pending'
        CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority TEXT DEFAULT 'medium'
        CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date DATE,
    completed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL
        CHECK (entity_type IN ('project', 'candidate', 'expense_claim', 'payment')),
    entity_id UUID NOT NULL,
    document_type TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    uploaded_by UUID REFERENCES users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);

-- ============================================================================
-- AUDIT & SYSTEM TABLES
-- ============================================================================

-- Activity Logs
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}',
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- ============================================================================
-- VIEWS FOR REPORTING
-- ============================================================================

-- Project Summary View
CREATE OR REPLACE VIEW project_summary AS
SELECT
    p.id,
    p.code,
    p.title,
    p.status,
    p.start_date,
    p.end_date,
    o.name as client_name,
    COUNT(DISTINCT ps.candidate_id) as total_staff,
    COUNT(DISTINCT ps.candidate_id) FILTER (WHERE ps.status = 'confirmed') as confirmed_staff,
    COALESCE(SUM(ps.daily_rate), 0) as total_daily_cost,
    COALESCE(SUM(ec.amount), 0) as total_expenses,
    COALESCE(SUM(pay.amount), 0) as total_payments
FROM projects p
LEFT JOIN organizations o ON p.client_id = o.id
LEFT JOIN project_staff ps ON p.id = ps.project_id
LEFT JOIN expense_claims ec ON p.id = ec.project_id AND ec.status = 'approved'
LEFT JOIN payments pay ON p.id = pay.project_id AND pay.status = 'completed'
GROUP BY p.id, p.code, p.title, p.status, p.start_date, p.end_date, o.name;

-- Staff Performance View
CREATE OR REPLACE VIEW staff_performance AS
SELECT
    c.id,
    c.ic_number,
    c.full_name,
    c.status,
    c.rating,
    COUNT(DISTINCT ps.project_id) as total_projects,
    COUNT(DISTINCT ps.project_id) FILTER (WHERE ps.status = 'completed') as completed_projects,
    AVG(ps.performance_rating) as avg_performance,
    SUM(a.hours_worked) as total_hours_worked,
    SUM(pay.amount) as total_earnings
FROM candidates c
LEFT JOIN project_staff ps ON c.id = ps.candidate_id
LEFT JOIN attendance a ON ps.id = a.project_staff_id
LEFT JOIN payments pay ON c.id = pay.candidate_id AND pay.status = 'completed'
GROUP BY c.id, c.ic_number, c.full_name, c.status, c.rating;

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to all tables with updated_at
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT table_name
        FROM information_schema.columns
        WHERE column_name = 'updated_at'
        AND table_schema = 'public'
    LOOP
        EXECUTE format('
            CREATE TRIGGER update_%I_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at()', t, t);
    END LOOP;
END $$;

-- Generate unique codes
CREATE OR REPLACE FUNCTION generate_project_code()
RETURNS TRIGGER AS $$
BEGIN
    NEW.code = 'PRJ-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('project_code_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS project_code_seq;
CREATE TRIGGER generate_project_code_trigger
BEFORE INSERT ON projects
FOR EACH ROW
WHEN (NEW.code IS NULL)
EXECUTE FUNCTION generate_project_code();

-- Generate claim numbers
CREATE OR REPLACE FUNCTION generate_claim_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.claim_number = 'EXP-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(NEXTVAL('claim_number_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS claim_number_seq;
CREATE TRIGGER generate_claim_number_trigger
BEFORE INSERT ON expense_claims
FOR EACH ROW
WHEN (NEW.claim_number IS NULL)
EXECUTE FUNCTION generate_claim_number();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Basic - to be refined based on requirements)
-- Allow authenticated users to read their organization's data
CREATE POLICY "Users can view their organization data" ON organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id FROM users WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth_id = auth.uid());

CREATE POLICY "Authenticated users can view projects" ON projects
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view candidates" ON candidates
    FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================================
-- INITIAL DATA & CLEANUP
-- ============================================================================

-- Insert default organization if not exists
INSERT INTO organizations (id, name, type, status)
VALUES ('00000000-0000-0000-0000-000000000000', 'System', 'agency', 'active')
ON CONFLICT DO NOTHING;

-- Create indexes for performance
ANALYZE;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================