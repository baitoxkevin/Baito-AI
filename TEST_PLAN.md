# 🧪 BAITO-AI COMPREHENSIVE TEST PLAN

## Executive Summary
This test plan covers all testing activities for Baito-AI platform including unit, integration, end-to-end, performance, and security testing.

## Test Objectives
1. Ensure all features work as specified
2. Verify data integrity and security
3. Validate performance requirements
4. Confirm cross-browser compatibility
5. Test responsive design across devices

## Test Scope

### In Scope
- All user-facing features
- Authentication & authorization
- Database operations
- File uploads/downloads
- Payment processing
- API integrations

### Out of Scope
- Third-party service internals (Supabase, Google AI)
- Browser-specific bugs in unsupported browsers

## Test Strategy

### Testing Levels
1. **Unit Testing** - Component and function level
2. **Integration Testing** - Module interactions
3. **System Testing** - End-to-end workflows
4. **UAT** - User acceptance testing
5. **Performance Testing** - Load and stress tests
6. **Security Testing** - Vulnerability assessment

### Testing Types
- Functional Testing
- Regression Testing
- Smoke Testing
- Sanity Testing
- Compatibility Testing
- Usability Testing

## Test Cases

### 1. Authentication Module

#### TC001: User Login - Valid Credentials
**Priority:** Critical
**Precondition:** User account exists
**Test Steps:**
1. Navigate to login page
2. Enter valid email
3. Enter valid password
4. Click login button
**Expected Result:** User logged in, redirected to dashboard
**Test Data:** test@baito.ai / TestPass123!

#### TC002: User Login - Invalid Credentials
**Priority:** Critical
**Test Steps:**
1. Navigate to login page
2. Enter invalid credentials
3. Click login button
**Expected Result:** Error message displayed, no login

#### TC003: Password Reset Flow
**Priority:** High
**Test Steps:**
1. Click "Forgot Password"
2. Enter registered email
3. Submit form
4. Check email for reset link
5. Click link and set new password
**Expected Result:** Password successfully reset

#### TC004: Session Timeout
**Priority:** High
**Test Steps:**
1. Login successfully
2. Wait for 30 minutes (idle)
3. Attempt any action
**Expected Result:** Redirected to login with session expired message

#### TC005: Role-Based Access Control
**Priority:** Critical
**Test Steps:**
1. Login as STAFF role
2. Try accessing /admin route
**Expected Result:** Access denied, redirected

### 2. Project Management Module

#### TC006: Create New Project
**Priority:** Critical
**Test Steps:**
1. Navigate to Projects
2. Click "New Project"
3. Fill all required fields
4. Add multiple venues/dates
5. Submit form
**Expected Result:** Project created with all venues
**Test Data:**
- Title: "Tech Conference 2024"
- Venues: ["Hall A", "Hall B"]
- Dates: ["2024-03-01", "2024-03-02"]
- Staff Required: 10

#### TC007: Multi-Venue Conflict Detection
**Priority:** High
**Test Steps:**
1. Create project with venue A on date X
2. Assign staff member John
3. Create another project same date
4. Try assigning John
**Expected Result:** Conflict warning displayed

#### TC008: Project Status Workflow
**Priority:** High
**Test Steps:**
1. Create project (status: Planning)
2. Add all required staff
3. Change to Active
4. Complete all tasks
5. Change to Completed
**Expected Result:** Status changes follow business rules

### 3. Talent Management Module

#### TC009: Candidate Registration
**Priority:** Critical
**Test Steps:**
1. Navigate to Candidates
2. Click "Add Candidate"
3. Fill personal details
4. Upload photos (profile, half, full)
5. Add banking info
6. Submit
**Expected Result:** Candidate created with all data

#### TC010: IC Verification
**Priority:** High
**Test Steps:**
1. Enter valid Malaysian IC
2. Verify format validation
3. Check rate limiting (max 5 attempts)
**Expected Result:** IC validated, rate limit enforced

#### TC011: Candidate Blacklist
**Priority:** Medium
**Test Steps:**
1. Select candidate
2. Add to blacklist
3. Upload proof document
4. Try assigning to project
**Expected Result:** Blacklisted candidate cannot be assigned

### 4. Financial Module

#### TC012: Expense Claim with OCR
**Priority:** Critical
**Test Steps:**
1. Navigate to Expense Claims
2. Upload receipt image
3. Verify OCR extraction
4. Adjust if needed
5. Submit claim
**Expected Result:** Claim created with OCR data

#### TC013: Expense Approval Workflow
**Priority:** High
**Test Steps:**
1. Submit expense claim as STAFF
2. Login as MANAGER
3. Review claim
4. Approve/Reject with notes
**Expected Result:** Status updated, notifications sent

#### TC014: Payroll Calculation
**Priority:** Critical
**Test Steps:**
1. Assign staff to project
2. Set working hours and rate
3. Mark attendance
4. Generate payroll
**Expected Result:** Correct salary calculated

#### TC015: Payment Export
**Priority:** High
**Test Steps:**
1. Select approved payments
2. Generate DuitNow file
3. Download export
4. Verify format
**Expected Result:** Valid DuitNow format file

### 5. Document Management

#### TC016: File Upload Security
**Priority:** Critical
**Test Steps:**
1. Try uploading .exe file
2. Try uploading >10MB file
3. Upload valid PDF
4. Upload valid image
**Expected Result:** Invalid files rejected, valid accepted

#### TC017: Document Access Control
**Priority:** High
**Test Steps:**
1. Upload document as User A
2. Login as User B (different company)
3. Try accessing document
**Expected Result:** Access denied

### 6. Performance Tests

#### TC018: Page Load Time
**Priority:** High
**Test Steps:**
1. Clear cache
2. Load dashboard
3. Measure time to interactive
**Expected Result:** <3 seconds

#### TC019: Concurrent Users
**Priority:** High
**Test Steps:**
1. Simulate 100 concurrent users
2. All performing CRUD operations
3. Monitor response times
**Expected Result:** <2s response time, no errors

#### TC020: Large Data Sets
**Priority:** Medium
**Test Steps:**
1. Load project with 1000 candidates
2. Test pagination
3. Test search/filter
**Expected Result:** Smooth performance, <1s operations

## Test Environment

### Development
- URL: http://localhost:5173
- Database: Supabase Dev
- Browser: Chrome latest

### Staging
- URL: https://staging.baito.ai
- Database: Supabase Staging
- Browsers: Chrome, Firefox, Safari, Edge

### Production
- URL: https://app.baito.ai
- Database: Supabase Production
- All supported browsers

## Test Data Requirements

### User Accounts
```javascript
const testUsers = [
  { email: 'admin@test.baito.ai', role: 'ADMIN' },
  { email: 'manager@test.baito.ai', role: 'MANAGER' },
  { email: 'staff@test.baito.ai', role: 'STAFF' }
];
```

### Sample Projects
- 10 active projects
- 5 completed projects
- Various venue configurations

### Sample Candidates
- 50 active candidates
- Various skill sets
- Different availability patterns

## Entry/Exit Criteria

### Entry Criteria
- Code complete for feature
- Unit tests passing
- Development testing done
- Test environment ready

### Exit Criteria
- All critical tests passed
- <5% test failure rate
- No critical bugs open
- Performance benchmarks met

## Risk Assessment

### High Risks
1. API key exposure
2. Payment processing errors
3. Data loss during migration

### Mitigation
1. Rotate keys regularly
2. Extensive payment testing
3. Backup before deployment

## Defect Management

### Severity Levels
- **Critical:** System unusable
- **High:** Major feature broken
- **Medium:** Minor feature issue
- **Low:** Cosmetic issue

### Priority Matrix
```
         Impact
       High  Med  Low
    C  | 1  | 2  | 3  |
    H  | 2  | 3  | 4  |
    M  | 3  | 4  | 5  |
    L  | 4  | 5  | 5  |
```

## Test Schedule

### Phase 1: Unit Testing (2 days)
- Component testing
- Service testing
- Utility function testing

### Phase 2: Integration Testing (2 days)
- API integration tests
- Database operation tests
- Service interaction tests

### Phase 3: System Testing (3 days)
- End-to-end workflows
- Cross-module operations
- User journey tests

### Phase 4: UAT (2 days)
- Business user testing
- Feedback collection
- Issue resolution

### Phase 5: Performance (1 day)
- Load testing
- Stress testing
- Benchmark validation

## Automation Strategy

### Tools
- Jest for unit tests
- Cypress for E2E tests
- Artillery for load tests

### Coverage Goals
- 80% unit test coverage
- Critical paths automated
- Regression suite automated

## Reporting

### Daily Reports
- Tests executed
- Pass/fail rate
- Defects found
- Blockers

### Final Report
- Overall pass rate
- Defect summary
- Performance metrics
- Recommendations