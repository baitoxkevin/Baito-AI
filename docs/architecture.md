# Baito-AI Brownfield Architecture

## Introduction

This document outlines the existing architecture of **Baito-AI**, a comprehensive workforce and project management platform for event staffing and crew management. This serves as the architectural baseline for understanding the current system and planning future enhancements or the creation of complementary systems (like the Gigworker Interface Platform).

**Document Purpose:**
- Serve as architectural blueprint for AI-driven development
- Document current system state and constraints
- Guide integration strategies for new enhancements
- Establish baseline for complementary platform development

**Relationship to Other Systems:**
This architecture serves as the foundation for the new **Gigworker Interface Platform**, which will be a standalone companion system leveraging similar technology patterns while serving a different user base.

---

## Quick Reference - Key Files and Entry Points

### Critical Files for Understanding the System

**Main Entry Points:**
- **Application Root**: `src/main.tsx` - React app initialization
- **App Component**: `src/App.tsx` - Main application component with routing
- **Environment Config**: `.env`, `.env.example` - Environment variables

**Core Services (src/lib/):**
- **Supabase Client**: `src/lib/supabase.ts` - Database client initialization
- **Authentication**: `src/lib/auth.ts`, `src/lib/auth-optimized.ts` - Auth service
- **Project Management**: `src/lib/projects.ts`, `src/lib/projects-optimized.ts` - Project CRUD
- **Expense Claims**: `src/lib/expense-claim-service.ts` - Financial tracking
- **Payroll**: `src/lib/staff-payroll-service.ts` - Salary calculations
- **Document Management**: `src/lib/document-service.ts` - File operations
- **OCR Processing**: `src/lib/receipt-ocr-service.ts` - Receipt scanning

**Key Components (src/components/):**
- **Project Forms**: `src/components/project-form/` - Project CRUD UI
- **Payroll Manager**: `src/components/payroll-manager/` - Payment processing UI
- **Spotlight Card**: `src/components/spotlight-card/` - Project detail view
- **Calendar**: `src/components/CalendarView.tsx` - Event scheduling

**Database Types:**
- **Type Definitions**: `src/lib/database.types.ts` - Supabase auto-generated types
- **Custom Types**: `src/lib/types.ts` - Application-specific types

**Configuration Files:**
- **Vite Config**: `vite.config.ts` - Build configuration
- **TypeScript Config**: `tsconfig.json`, `tsconfig.app.json` - Type checking
- **TailwindCSS**: `tailwind.config.js` - Styling configuration
- **Netlify Deployment**: `netlify.toml` - Hosting configuration

**Migration Files:**
- **Database Migrations**: `supabase/migrations/*.sql` - 100+ migration files
- **Storage Buckets**: Configured via migrations (project-documents, receipts, company-logos)

---

## Existing Project Analysis

### Current Project State

- **Primary Purpose:** Workforce and project management platform for event staffing companies
- **Current Tech Stack:** React 18 + TypeScript + Vite + Supabase (PostgreSQL + Auth + Storage)
- **Architecture Style:** Monolithic SPA with BaaS (Backend-as-a-Service)
- **Deployment Method:** Static hosting (Netlify) + Supabase Cloud
- **Target Users:** Internal staff, project managers, admin (3-6 months) → External clients (6+ months)

### Available Documentation

- **FULL_STACK_ARCHITECTURE.md** - Comprehensive technical architecture (847 lines)
- **DEPLOYMENT_SUMMARY.md** - Deployment status and configuration
- **PRODUCTION_DEPLOYMENT_GUIDE.md** - Production deployment procedures
- **BACKEND_OPTIMIZATIONS_COMPLETE.md** - Performance optimization documentation
- **BACKEND_OPTIMIZATION_GUIDE.md** - Optimization implementation guide
- **SECURITY_AUDIT_REPORT.md** - Security assessment and fixes
- **CLAUDE.md** - Project guidelines and standards

### Identified Constraints

- **Technology Lock-in:** Supabase BaaS (vendor dependency)
- **Bundle Size:** 3.8MB (requires optimization)
- **No SSR/SSG:** Client-side rendering only (performance limitation)
- **Single Database Instance:** No read replicas (scalability constraint)
- **Limited Offline Support:** Requires network connectivity
- **TypeScript Coverage:** ~700 type errors remaining (technical debt)
- **Testing Coverage:** Requires expansion
- **Monitoring:** Basic monitoring only (needs enhancement)

---

## Core Technology Stack

### Frontend Stack

| Category | Technology | Version | Usage | Notes |
|----------|------------|---------|-------|-------|
| Framework | React | 18.3.1 | Core UI framework | With concurrent features |
| Language | TypeScript | 5.5.3 | Type safety | Strict mode enabled |
| Bundler | Vite | 5.4.8 | Build tool | Fast HMR, optimized builds |
| UI Library | ShadCN UI + Radix UI | Latest | Component library | Accessible, customizable |
| Styling | TailwindCSS | 3.4.13 | Utility-first CSS | Small bundle size |
| Routing | React Router | 7.5.2 | Client-side routing | Type-safe routing |
| Forms | React Hook Form | 7.53.0 | Form management | Performance optimized |
| Animations | Framer Motion | 11.18.2 | UI animations | Smooth transitions |
| State Management | React Context + Hooks | Built-in | Global state | Custom hooks pattern |

### Backend Stack (Supabase)

| Category | Technology | Version | Usage | Notes |
|----------|------------|---------|-------|-------|
| Database | PostgreSQL | 15+ | Primary database | Supabase managed |
| Auth | Supabase Auth | Latest | Authentication | JWT-based |
| Storage | Supabase Storage | Latest | File storage | S3-compatible |
| Real-time | WebSockets | Latest | Live updates | Postgres changes |
| API | PostgREST | Latest | Auto-generated REST | From PostgreSQL |

### Infrastructure

| Category | Technology | Purpose | Notes |
|----------|------------|---------|-------|
| Hosting | Netlify | Static hosting | Global CDN, auto-deploy |
| Backend | Supabase Cloud | Managed backend | Auto-scaling |
| CI/CD | GitHub Actions | Automated deployment | Preview + production |
| Version Control | Git + GitHub | Source control | Standard workflow |

---

## Data Architecture

### Core Database Schema

**Primary Entities (30+ tables):**

1. **organizations/companies** - Client and vendor companies
2. **projects** - Event projects with multi-venue support
3. **candidates** - Workforce database with IC verification
4. **users** - System users (internal staff)
5. **project_staff** - Staff assignments (many-to-many)
6. **expense_claims** - Financial records with OCR
7. **project_documents** - Document management
8. **payments** - Payment processing and tracking
9. **warehouse_items** - Inventory management
10. **tasks** - Task management system

**Key Relationship Patterns:**

```
projects (1) ─── (*) project_staff ─── (*) candidates
    │                                         │
    ├─── (*) expense_claims                   ├─── (*) candidate_history
    ├─── (*) project_documents                ├─── (*) candidate_tokens
    └─── (*) tasks                            └─── (*) blacklist
```

### Storage Buckets

1. **project-documents** - Project-related files
2. **receipts** - Expense claim receipts (OCR processed)
3. **company-logos** - Company branding assets

---

## Component Architecture

### Frontend Structure

```
src/
├── components/           # 70+ reusable UI components
│   ├── ui/              # Base components (ShadCN)
│   ├── project-form/    # Project management
│   ├── payroll-manager/ # Financial management
│   ├── spotlight-card/  # Feature components
│   └── warehouse/       # Inventory components
├── pages/               # Route-based pages (20+ pages)
├── hooks/               # Custom React hooks (15+ hooks)
├── lib/                 # Core services (25+ services)
│   ├── auth.ts
│   ├── supabase.ts
│   ├── *-service.ts     # Domain services
│   └── utils.ts
├── contexts/            # React contexts
└── styles/              # Global styles
```

### Key Services

1. **Authentication Service** - JWT-based auth with Supabase
2. **Project Service** - Project CRUD and management
3. **Candidate Service** - Worker database management
4. **Expense Service** - Financial tracking with OCR
5. **Document Service** - File management
6. **Payroll Service** - Payment calculation and export
7. **Activity Logger** - Audit trail
8. **Notification Service** - User notifications

---

## Security Architecture

### Multi-Layer Security

**Layer 1: Network Security**
- HTTPS enforcement
- Content Security Policy (CSP)
- XSS protection headers
- CORS configuration

**Layer 2: Authentication**
- Supabase Auth (JWT tokens)
- Email/password authentication
- Session management
- Password reset flow
- Candidate token system (time-limited)

**Layer 3: Authorization**
- Row Level Security (RLS) policies
- Role-based access control (RBAC)
- User roles: super_admin, admin, manager, staff, candidate
- Permission matrix per role

**Layer 4: Data Protection**
- TLS in transit
- AES-256 at rest (Supabase managed)
- Sensitive field masking
- Audit logging

### Security Measures Implemented

✅ Security headers configured (HSTS, CSP, etc.)
✅ Content Security Policy implemented
✅ SQL injection prevention (parameterized queries)
✅ XSS protection (React auto-escaping)
✅ CSRF protection (SameSite cookies)
✅ Rate limiting (Supabase managed)
✅ Input validation (Zod schemas)

---

## Performance Optimizations

### Frontend Optimizations

1. **Code Splitting**
   - Route-based lazy loading
   - Component-level code splitting
   - Dynamic imports for heavy components

2. **Bundle Optimization**
   ```javascript
   manualChunks: {
     'supabase': ['@supabase/*'],
     'react': ['react', 'react-dom'],
     'radix-ui': ['@radix-ui/*'],
     'vendor': [/* other dependencies */]
   }
   ```

3. **Render Optimization**
   - React.memo for expensive components
   - useMemo/useCallback for computed values
   - Virtual scrolling for large lists

4. **Asset Optimization**
   - Image lazy loading
   - WebP format support
   - Font subsetting

### Backend Optimizations

1. **Database Indexes**
   - Frequently queried columns indexed
   - Composite indexes for common queries
   - Partial indexes for filtered queries

2. **Caching Strategy**
   - In-memory cache (development)
   - Redis/Upstash support (production-ready)
   - Cache invalidation on updates

3. **Connection Pooling**
   - Min: 2, Max: 10 connections
   - Query batching for bulk operations
   - Automatic connection release

### Performance Metrics

- Page Load Time: ~4s (target: <3s)
- Time to Interactive: ~6s (target: <5s)
- API Response: ~300ms (target: <200ms)
- Bundle Size: 3.8MB (target: <2MB)

---

## Deployment Architecture

### Current Setup

```
GitHub → GitHub Actions → Netlify (Production)
                       ↓
                Netlify (Preview)
```

### Environment Configuration

```bash
# Production Environment
VITE_SUPABASE_URL=https://aoiwrdzlichescqgnohi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_ENVIRONMENT=production
NODE_ENV=production
```

### Deployment Configuration

**netlify.toml:**
- Build command: `npx vite build`
- Publish directory: `dist`
- Security headers configured
- SPA routing configured
- Asset caching (1 year for JS/CSS)

**GitHub Actions:**
- Automated testing
- Type checking
- Security scanning
- Preview deployments (PRs)
- Production deployment (main branch)

---

## Integration Points for New Systems

### API Surface

The existing Baito-AI system exposes these integration points:

1. **Supabase API** (PostgreSQL tables via PostgREST)
   - RESTful API auto-generated
   - JWT authentication required
   - RLS policies enforce security

2. **Real-time Subscriptions**
   - WebSocket connections
   - Table change notifications
   - Presence tracking

3. **Storage API**
   - File upload/download
   - Signed URLs for temporary access
   - RLS-protected buckets

### Reusable Patterns for New Platform

**Authentication Pattern:**
```typescript
// Supabase client setup
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

// Authentication flow
const { data, error } = await supabase.auth.signInWithPassword({
  email, password
})
```

**Service Layer Pattern:**
```typescript
// Example: Project Service
class ProjectService {
  async getById(id: string): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }
}
```

**Component Pattern:**
```typescript
// Standalone component with direct DB access
export function StaffManager({ projectId }: Props) {
  const [staff, setStaff] = useState<Staff[]>([])

  // Direct database operations
  const handleAddStaff = async (data: StaffInput) => {
    const { error } = await supabase
      .from('project_staff')
      .insert(data)

    if (error) toast.error('Failed to add staff')
    else toast.success('Staff added successfully')
  }

  return <>{/* UI */}</>
}
```

---

## Technical Debt and Known Issues

### Critical Technical Debt

1. **TypeScript Type Errors (~700 remaining)**
   - Location: Throughout codebase
   - Impact: Reduced type safety, potential runtime errors
   - Reason: Legacy code, rapid development, insufficient refactoring time
   - Mitigation: Gradual cleanup, prioritize critical paths
   - Files affected: Check with `npx tsc --noEmit` for full list

2. **ESLint Warnings (~1000+)**
   - Location: Throughout codebase
   - Impact: Code quality inconsistencies, potential bugs
   - Common issues: Unused variables, missing dependencies in useEffect, any types
   - Mitigation: Address warnings during feature development
   - Check: `npm run lint` for full report

3. **Vulnerable Dependencies**
   - **xlsx package**: Known security vulnerabilities
   - **Other dependencies**: Check `npm audit` for current status
   - Impact: Security risks in production
   - Mitigation: Planned migration to safer alternatives (see XLSX_TO_EXCELJS_MIGRATION.md)

4. **Limited Test Coverage**
   - Current coverage: <30% estimated
   - Missing: Integration tests, E2E tests
   - Impact: Regression risks, difficult refactoring
   - Critical untested areas: Payroll calculations, expense claims, OCR processing

5. **Database Migration Management**
   - 100+ migration files in `supabase/migrations/`
   - Some migrations have naming conflicts (timestamp collisions)
   - No rollback strategy for failed migrations
   - Manual intervention required for production deployments

6. **Inconsistent Service Patterns**
   - Some services use classes, others use functions
   - Mixed patterns: callbacks vs promises vs async/await
   - Example: `src/lib/projects.ts` vs `src/lib/projects-optimized.ts`
   - Impact: Code maintainability, developer confusion

7. **Duplicate Code**
   - Multiple versions of similar components (e.g., CalendarView vs CalendarViewOptimized)
   - Duplicate service implementations (auth.ts vs auth-optimized.ts)
   - Reason: Performance optimization attempts, feature experiments
   - Impact: Increased maintenance burden, inconsistency

### Workarounds and Gotchas

**⚠️ CRITICAL - Do Not Modify These Without Understanding Impact:**

1. **Supabase Connection Pool**
   - Hardcoded to max 10 connections
   - Changing this may break expense claims service
   - Workaround: Connection pooling managed at Supabase level

2. **Storage RLS Policies**
   - Multiple migration attempts to fix storage policies (20+ migrations)
   - Files: `supabase/migrations/20250700*` series
   - Current state: Some RLS disabled for project-documents bucket
   - **DO NOT enable RLS without testing document upload/download**

3. **Expense Claims Table**
   - Multiple attempts to ensure table exists (migrations 20250630*, 20250701*, 20250831*)
   - Some views and functions depend on specific column names
   - Changing schema requires updating views: `expense_claims_summary_view`

4. **TypeScript Build**
   - Build succeeds despite type errors due to `skipLibCheck: true`
   - Production builds use `tsc --noEmit` check which may fail
   - Workaround: CI pipeline configured to continue on type errors

5. **Calendar Component Performance**
   - Original CalendarView has performance issues with 100+ events
   - CalendarViewOptimized created as replacement
   - Both exist in codebase for backward compatibility
   - **Use CalendarViewOptimized for new features**

6. **Environment Variables**
   - Some components expect specific env var format
   - `VITE_` prefix required for all client-side variables
   - Missing variables may cause silent failures (no error messages)
   - Always check `.env.example` for required variables

7. **Project Staff Assignment**
   - Complex relationship between `project_staff` and `candidates`
   - Multiple status fields that must stay in sync
   - Changing staff status requires updating multiple tables
   - Use `src/hooks/use-project-staff.ts` hook to avoid inconsistencies

### Known Bugs and Limitations

1. **Timezone Handling**
   - Inconsistent timezone conversions across the app
   - Calendar displays may show incorrect times for international projects
   - Workaround: All times stored in UTC, converted client-side

2. **File Upload Size Limits**
   - Supabase free tier: 50MB per file
   - No client-side validation for file size
   - Large uploads fail silently
   - Workaround: Manual size check before upload

3. **Offline Support**
   - Limited offline capability
   - Service worker configured but not fully implemented
   - Users lose work if connection drops during form submission

4. **Mobile Responsiveness**
   - Some components not fully optimized for mobile
   - Calendar view difficult to use on small screens
   - Payroll manager requires landscape orientation

5. **Search Performance**
   - Full-text search slow on large candidate databases (1000+ records)
   - No pagination on some list views
   - Workaround: Client-side filtering, virtual scrolling planned

---

## Testing Reality

### Current Test Coverage

**Unit Tests:**
- Framework: Jest + React Testing Library
- Location: `src/__tests__/`, `src/lib/__tests__/`
- Coverage: ~20-30% estimated (no coverage reports generated)
- Files tested:
  - `src/lib/__tests__/cache-manager.test.ts`
  - `src/__tests__/setup.ts` (test configuration)

**Integration Tests:**
- Status: Minimal/None
- Reason: Rapid development prioritized over testing
- Missing: API integration tests, database operation tests

**End-to-End Tests:**
- Status: None
- Planned: Playwright or Cypress (not yet implemented)

**Manual Testing:**
- Primary QA method
- Test scenarios: Documented informally, not automated
- Critical paths tested before each deployment

### Running Tests

```bash
# Run existing unit tests
npm test

# Watch mode for development
npm test -- --watch

# Check TypeScript errors
npx tsc --noEmit

# Run linter
npm run lint

# Security audit
npm audit
```

### Testing Limitations

1. **No CI/CD Test Gate**
   - Tests run in CI but don't block deployment
   - Type errors don't block deployment
   - Relies on manual QA

2. **Supabase Mocking Challenges**
   - Difficult to mock Supabase client in tests
   - No test database for integration testing
   - Workaround: Tests use real Supabase instance (not ideal)

3. **Complex Component Testing**
   - Many components tightly coupled to Supabase
   - Difficult to test in isolation
   - Forms have complex state management (React Hook Form)

---

## Constraints and Limitations

### Current Limitations

1. **Scalability**
   - Single PostgreSQL instance
   - No read replicas
   - Limited connection pool (10 max)

2. **Performance**
   - Large bundle size (3.8MB)
   - No SSR/SSG capabilities
   - Limited offline support

3. **Infrastructure**
   - No multi-region deployment
   - Basic monitoring only
   - Manual scaling required

4. **Technical Debt**
   - ~700 TypeScript errors
   - ~1000+ ESLint warnings
   - Limited test coverage
   - Vulnerable dependencies (xlsx, etc.)

### Design Constraints

1. **Must follow React + TypeScript patterns**
2. **Must use Supabase for consistency**
3. **Must implement RLS for all tables**
4. **Must follow existing component structure**
5. **Must maintain backward compatibility**

---

## Next Steps

### For New Gigworker Platform Development

1. **Leverage Existing Patterns**
   - Reuse authentication setup
   - Follow component architecture
   - Use same service layer patterns
   - Apply security best practices

2. **Avoid Existing Limitations**
   - Start with smaller bundle size
   - Implement SSR/SSG if needed
   - Plan for offline support
   - Design for scalability from start

3. **Maintain Consistency**
   - Same tech stack (React + TypeScript + Supabase)
   - Similar UI/UX patterns (TailwindCSS + ShadCN)
   - Consistent security model
   - Shared deployment pipeline

4. **Integration Considerations**
   - Separate Supabase project OR shared database?
   - Shared authentication OR separate auth?
   - Cross-platform data synchronization needs
   - API compatibility requirements

---

## Appendix - Useful Commands and Scripts

### Development Commands

```bash
# Start development server (Vite)
npm run dev
# Runs on http://localhost:5173 by default

# Build for production
npm run build
# Output: dist/ directory

# Preview production build locally
npm run preview

# Type checking (without build)
npx tsc --noEmit

# Linting
npm run lint
npm run lint -- --fix  # Auto-fix issues

# Format code (if Prettier configured)
npm run format  # or npx prettier --write .
```

### Database Commands

```bash
# Generate TypeScript types from Supabase
npx supabase gen types typescript --project-id aoiwrdzlichescqgnohi > src/lib/database.types.ts

# Link to Supabase project
npx supabase link --project-ref aoiwrdzlichescqgnohi

# Pull remote database schema
npx supabase db pull

# Reset local database (dev only)
npx supabase db reset

# Create new migration
npx supabase migration new migration_name

# Apply migrations
npx supabase migration up

# Check migration status
npx supabase migration list
```

### Deployment Commands

```bash
# Manual Netlify deployment
netlify deploy --prod

# Netlify preview deployment
netlify deploy

# Build and deploy
npm run build && netlify deploy --prod

# Check deployment status
netlify status
```

### Debugging and Troubleshooting

**Common Issues and Solutions:**

1. **Development Server Won't Start**
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install

   # Check port availability (5173)
   lsof -ti:5173 | xargs kill -9  # Kill process on port 5173
   ```

2. **Build Fails with Type Errors**
   ```bash
   # Check specific errors
   npx tsc --noEmit | head -20

   # Build with relaxed type checking (emergency only)
   npm run build -- --mode production
   ```

3. **Supabase Connection Issues**
   ```bash
   # Verify environment variables
   cat .env | grep VITE_SUPABASE

   # Test Supabase connection
   curl https://aoiwrdzlichescqgnohi.supabase.co/rest/v1/ \
     -H "apikey: YOUR_ANON_KEY"
   ```

4. **Storage Upload Failures**
   ```bash
   # Check RLS policies
   npx supabase db execute "SELECT * FROM storage.policies WHERE bucket_id = 'project-documents';"

   # Verify bucket exists
   npx supabase storage ls
   ```

5. **Database Migration Conflicts**
   ```bash
   # Check applied migrations
   npx supabase migration list

   # Manually fix migration order in database
   # (Contact DBA or check Supabase dashboard)
   ```

### Performance Monitoring

```bash
# Analyze bundle size
npm run build
npx vite-bundle-visualizer

# Check lighthouse scores (manual)
# Open Chrome DevTools > Lighthouse > Generate Report

# Monitor production performance
# Check Netlify Analytics or Sentry (if configured)
```

### Security Checks

```bash
# Run security audit
npm audit

# Fix automatically fixable vulnerabilities
npm audit fix

# Force fix (may cause breaking changes)
npm audit fix --force

# Check for outdated packages
npm outdated

# Update packages safely
npm update

# Update package interactively
npx npm-check -u
```

### Git Workflow Commands

```bash
# Create feature branch
git checkout -b feature/feature-name

# Commit with conventional format
git commit -m "feat(scope): description"
git commit -m "fix(scope): description"

# Push and create PR
git push -u origin feature/feature-name

# Update from main
git checkout main
git pull origin main
git checkout feature/feature-name
git merge main
```

### Environment Setup

**First Time Setup:**

```bash
# 1. Clone repository
git clone <repository-url>
cd Baito-AI

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env

# 4. Edit .env with your Supabase credentials
# VITE_SUPABASE_URL=your-project-url
# VITE_SUPABASE_ANON_KEY=your-anon-key

# 5. Start development server
npm run dev
```

**Common Environment Variables:**

```bash
# Required
VITE_SUPABASE_URL=https://aoiwrdzlichescqgnohi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_ENVIRONMENT=development

# Optional (for specific features)
VITE_ENABLE_ANALYTICS=false
VITE_SENTRY_DSN=your-sentry-dsn
VITE_API_URL=http://localhost:3000
```

### Quick Fixes for Common Problems

**Problem: "Cannot find module" errors**
```bash
npm install
```

**Problem: TypeScript errors in IDE**
```bash
# Reload VS Code window
# Command Palette > "Developer: Reload Window"

# Or restart TypeScript server
# Command Palette > "TypeScript: Restart TS Server"
```

**Problem: Netlify deployment fails**
```bash
# Check build logs in Netlify dashboard
# Common fix: Clear cache and redeploy
netlify deploy --prod --build
```

**Problem: Storage upload returns 403**
```bash
# Check RLS policies in Supabase dashboard
# Storage > Policies > project-documents
# Ensure authenticated users have INSERT/SELECT permissions
```

### Logs and Monitoring

**Application Logs:**
- Browser console: Check for JavaScript errors
- Network tab: Monitor API requests/responses
- Supabase logs: Dashboard > Logs section

**Production Logs:**
- Netlify: Functions > Function Logs
- Supabase: Dashboard > Logs > Select service (API, Auth, Storage)
- Client errors: Check browser console in production

---

## Change Log

| Date | Version | Change | Author |
|------|---------|--------|--------|
| 2025-10-01 | 1.0 | Initial brownfield architecture documentation | Winston (AI Architect) |
| 2025-10-01 | 1.1 | Enhanced with Quick Reference, Technical Debt, Testing Reality, and Appendix sections | Winston (AI Architect) |

---

**Document Status:** ✅ Complete (Enhanced Brownfield Documentation)
**Coverage:** Full brownfield architecture including technical debt, workarounds, testing status, and operational commands
**Next Action:** Complete remaining documentation tasks (doc-out)
**Reference:** Based on FULL_STACK_ARCHITECTURE.md and extensive codebase analysis
