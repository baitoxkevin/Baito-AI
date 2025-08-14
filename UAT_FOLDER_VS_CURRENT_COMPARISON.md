# Comparison: UAT Project 10 Folder vs Current Project

## Folder Structure
- **UAT Project 10**: `/Users/baito.kevin/Downloads/UAT Project 10/uat/project 10/`
- **Current Project**: `/Users/baito.kevin/Downloads/project 10/`

## 1. Package.json Differences

### UAT Project 10 Has:
- **Additional Scripts:**
  - `security:remove-console` - Removes console.log statements
  - `security:restore-console` - Restores console.log statements
  - `security:audit` - Security audit
  - `security:check` - Complete security check
  - `lint:fix` - Auto-fix linting issues
  - `type-check` - TypeScript type checking
  - `analyze` - Bundle analysis

- **Additional Dependencies:**
  - `exceljs` (instead of xlsx)
  - `@react-spring/web: 9.5.5`
  - `playwright: ^1.53.0`
  - `puppeteer: ^24.10.0`
  - `isomorphic-dompurify: ^2.25.0`
  - `glob: ^11.0.2`

### Current Project Has:
- Uses `xlsx` instead of `exceljs`
- Older version of Supabase: `^2.39.8` (UAT has `^2.49.8`)

## 2. Pages Differences

### Only in UAT Project 10:
- `CandidateDashboardPage.tsx` - Candidate dashboard feature
- `GoalsPage.tsx` - Goals management
- `JobDiscoveryPage.tsx` - Job discovery feature
- `LocationFeatureDemo.tsx` - Location features demo
- `SetPasswordPage.tsx` - Password setting page

### Only in Current Project:
- `CompaniesPage.tsx` - Companies management
- `IntegratedStaffingPayrollDemo.tsx` - Staffing/payroll demo
- `PaymentQueueDemo.tsx` - Payment queue demo
- `MobileCandidateUpdatePage.backup.tsx` - Backup file

### Files That Differ (exist in both but different content):
- CalendarPage.tsx
- CandidateIcVerifyPage.tsx
- CandidatesPage.tsx
- DashboardPage.tsx
- ExpenseClaimsPage.tsx
- InvitesPage.tsx
- LoginPage.tsx
- MobileCandidateUpdatePage.tsx
- PaymentsPage.tsx
- ProjectDetailPage.tsx
- ProjectsPageRedesign.tsx
- SettingsPage.tsx
- TeamManagementPage.tsx
- ToolsPage.tsx
- UserConfigurationPage.tsx

## 3. Key Functional Differences

### UAT Project 10 Features:
1. **Candidate Dashboard** - Dedicated dashboard for candidates
2. **Goals Management** - Goal setting and tracking
3. **Job Discovery** - Job search/discovery features
4. **Enhanced Security** - Console log removal scripts, security audits
5. **Testing Tools** - Playwright and Puppeteer for automated testing
6. **Excel Processing** - Uses exceljs for better compatibility

### Current Project Features:
1. **Companies Management** - Company profiles and management
2. **Integrated Staffing/Payroll** - Combined staffing and payroll demo
3. **Payment Queue** - Payment processing queue system

## 4. Security Differences

### UAT Project 10:
- Has security scripts to remove console.log statements
- Security audit scripts
- Pre-build security checks
- Uses newer Supabase version with latest security patches

### Current Project:
- Standard security setup
- Older Supabase version

## 5. Build Configuration

### UAT Project 10:
- More comprehensive build pipeline with security checks
- Bundle analysis capability
- Type checking before build
- Clean script for clearing cache

### Current Project:
- Simpler build configuration
- Basic TypeScript compilation

## 6. Missing in Current Project (from UAT):

### Critical Files/Features:
1. **Candidate Dashboard** functionality
2. **Goals Management** system
3. **Job Discovery** features
4. **Security enhancement scripts**
5. **Automated testing setup** (Playwright/Puppeteer)

### Dependencies to Consider Adding:
- `exceljs` (replace xlsx for better Vite compatibility)
- Security tools for console.log removal
- Testing frameworks if needed

## 7. Recommendations

### High Priority (Bug Fixes & Compatibility):
1. **Replace xlsx with exceljs** - Better Vite compatibility
2. **Update Supabase** - From 2.39.8 to 2.49.8 for security patches

### Medium Priority (Features):
1. Consider adding **Candidate Dashboard** if needed
2. Evaluate if **Goals Management** is required
3. Review **Job Discovery** feature necessity

### Low Priority (Nice to Have):
1. Add security scripts for production builds
2. Implement automated testing with Playwright
3. Add bundle analysis tools

## 8. Database Schema Considerations

UAT Project 10 likely has database tables for:
- Goals/milestones
- Job postings/discovery
- Enhanced candidate profiles

Current project may need schema updates if these features are added.

## Summary

The UAT Project 10 appears to be a more feature-complete version with:
- Additional candidate-focused features
- Enhanced security measures
- Better testing infrastructure
- More comprehensive build pipeline

The current project has:
- Company management features
- Payment processing capabilities
- Simpler, more focused feature set

**Main Difference**: UAT Project 10 is candidate/job-focused, while current project is more company/payment-focused.