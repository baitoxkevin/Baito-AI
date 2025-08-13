# 🧪 Comprehensive Testing Checklist - Baito Events Management System

## Test Environment Setup
- [ ] URL: `http://localhost:5173` (local) or Netlify deployment URL
- [ ] Test Credentials: `admin@baito.events` / `Password123!!`
- [ ] Browser: Chrome (primary), Firefox, Safari, Edge
- [ ] Mobile Testing: iPhone, Android devices
- [ ] Clear cache and cookies before testing

---

## 1. 🔐 Authentication & User Management

### 1.1 Login Flow
- [ ] Login with valid credentials (admin@baito.events / Password123!!)
- [ ] Login with invalid email format - should show validation error
- [ ] Login with wrong password - should show error message
- [ ] Login with non-existent email - should show error
- [ ] Session persistence after page refresh
- [ ] Auto-redirect to login when session expires
- [ ] "Remember me" functionality (if available)

### 1.2 Password Reset
- [ ] Request password reset with valid email
- [ ] Request with invalid email format
- [ ] Request with non-registered email
- [ ] Reset link functionality and expiration
- [ ] Set new password with validation rules

### 1.3 User Profile Management
- [ ] View profile information
- [ ] Edit full name
- [ ] Change phone number
- [ ] Upload/change avatar image
- [ ] Avatar generation from initials
- [ ] Save profile changes
- [ ] Cancel without saving

### 1.4 Logout
- [ ] Logout button in sidebar
- [ ] Successful logout redirects to login
- [ ] Session cleared after logout
- [ ] Cannot access protected pages after logout

---

## 2. 📋 Project Management

### 2.1 Project Creation (Multi-Step Form)
- [ ] Step 1: Basic Information
  - [ ] Project title (required)
  - [ ] Client name with autocomplete
  - [ ] Brand logo search and selection
  - [ ] Manual logo URL input
  - [ ] Date range validation (end > start)
  - [ ] Working hours validation
  - [ ] Color picker for project color
- [ ] Step 2: Venue Details
  - [ ] Primary venue address
  - [ ] Add multiple locations
  - [ ] Remove locations
  - [ ] Set primary location
  - [ ] Map integration (if available)
- [ ] Step 3: CC Stakeholders
  - [ ] Add from company contacts
  - [ ] Add custom email addresses
  - [ ] Remove stakeholders
  - [ ] Validate email formats
- [ ] Step 4: Additional Details
  - [ ] Team size input
  - [ ] Project description
  - [ ] Special requirements
- [ ] Navigation between steps
- [ ] Save draft functionality
- [ ] Cancel and confirm dialog

### 2.2 Project Listing & Views
- [ ] Grid view display
- [ ] List view display
- [ ] Toggle between grid/list views
- [ ] Project cards show correct information
- [ ] Color coding by project color
- [ ] Status badges (Planning, Active, Completed, Cancelled)
- [ ] Priority indicators

### 2.3 Project Filtering & Search
- [ ] Search by project name
- [ ] Filter by status (All, Planning, Active, Completed, Cancelled)
- [ ] Filter by priority
- [ ] Filter by date range
- [ ] Filter by team
- [ ] Clear filters
- [ ] Persist filter selections

### 2.4 Project Details (SpotlightCard)
- [ ] Overview tab with project details
- [ ] Staffing tab functionality
- [ ] Expenses tab
- [ ] Documents tab
- [ ] History/Activity log tab
- [ ] Minimize/maximize card
- [ ] Close card

### 2.5 Project Editing
- [ ] Edit all project fields
- [ ] Update dates with validation
- [ ] Change project status
- [ ] Update locations
- [ ] Save changes
- [ ] Cancel without saving

### 2.6 Project Operations
- [ ] Duplicate project
- [ ] Delete project with confirmation
- [ ] Archive project
- [ ] Export project data

---

## 3. 👥 Candidate Management

### 3.1 Candidate Registration
- [ ] Add new candidate with all fields
- [ ] Required field validation
- [ ] IC number formatting (XXXXXX-XX-XXXX)
- [ ] Phone number formatting
- [ ] Email validation
- [ ] Upload profile photo
- [ ] Upload full body photo
- [ ] Upload half body photo
- [ ] Drag and drop photo upload
- [ ] Photo preview before save
- [ ] Duplicate candidate detection by IC
- [ ] Duplicate detection by email
- [ ] Update existing when duplicate found

### 3.2 Candidate Search & List
- [ ] Search by name
- [ ] Search by IC number
- [ ] Search by phone number
- [ ] Search by email
- [ ] Clear search
- [ ] Sort by name (A-Z, Z-A)
- [ ] Sort by tier level
- [ ] Sort by experience
- [ ] Sort by vehicle availability
- [ ] Sort by rating
- [ ] Pagination or infinite scroll

### 3.3 Candidate Details
- [ ] View full candidate profile
- [ ] Performance metrics display
- [ ] Loyalty tier display
- [ ] Issue tracking (no-shows, late arrivals)
- [ ] Project history
- [ ] Documents/certifications
- [ ] Emergency contact info
- [ ] Bank account details

### 3.4 Candidate Actions
- [ ] Edit candidate information
- [ ] Update photos
- [ ] Share update link via WhatsApp
- [ ] Report candidate (with reason)
- [ ] Ban/unban candidate
- [ ] Add to project
- [ ] View availability calendar

### 3.5 Candidate Import Tool
- [ ] Bulk import from text
- [ ] CSV import
- [ ] Parse WhatsApp format
- [ ] Preview before import
- [ ] Handle duplicates
- [ ] Import success/error reporting

### 3.6 Mobile Candidate Update
- [ ] Access update link
- [ ] Mobile-optimized form
- [ ] Update personal info
- [ ] Upload photos on mobile
- [ ] Save changes
- [ ] Success confirmation

---

## 4. 📅 Calendar & Scheduling

### 4.1 Calendar Views
- [ ] Monthly calendar view
- [ ] List view
- [ ] Toggle between views
- [ ] View persistence

### 4.2 Calendar Navigation
- [ ] Navigate to previous month
- [ ] Navigate to next month
- [ ] Jump to today
- [ ] Refresh calendar
- [ ] Month/year selector

### 4.3 Calendar Display
- [ ] Projects display on correct dates
- [ ] Multi-day projects span correctly
- [ ] Project colors visible
- [ ] Hover tooltips with project info
- [ ] Click project to open details

### 4.4 Calendar Operations
- [ ] Create project from calendar date
- [ ] Drag to reschedule (if enabled)
- [ ] Conflict detection
- [ ] Weekend/holiday indicators

---

## 5. 💰 Expense & Payment Management

### 5.1 Expense Claims Creation
- [ ] Create new expense claim
- [ ] Select project
- [ ] Select category
- [ ] Enter amount with validation
- [ ] Add description
- [ ] Upload receipt image
- [ ] Receipt preview
- [ ] Save as draft
- [ ] Submit for approval

### 5.2 Receipt Management
- [ ] Upload receipt image
- [ ] OCR text extraction
- [ ] Edit extracted data
- [ ] Multiple receipt upload
- [ ] Delete receipt
- [ ] View receipt full size

### 5.3 Expense Claims List
- [ ] View all claims
- [ ] Filter by status (Draft, Submitted, Approved, Rejected)
- [ ] Filter by project
- [ ] Filter by date range
- [ ] Search claims
- [ ] Sort by date, amount, status

### 5.4 Expense Approval Workflow
- [ ] Manager view pending claims
- [ ] Approve claim
- [ ] Reject with reason
- [ ] Bulk approve/reject
- [ ] Email notifications

### 5.5 Payment Processing
- [ ] Create payment batch
- [ ] Select claims for payment
- [ ] Review payment summary
- [ ] Generate DuitNow file
- [ ] Mark as paid
- [ ] Payment history

---

## 6. 👷 Staff Management & Payroll

### 6.1 Staff Assignment
- [ ] Add staff to project
- [ ] Search candidates
- [ ] Filter by availability
- [ ] Filter by skills
- [ ] Assign roles
- [ ] Set working dates
- [ ] Bulk assignment

### 6.2 Attendance Tracking
- [ ] Mark attendance (Present, Late, Absent, MC)
- [ ] Bulk attendance update
- [ ] Add remarks
- [ ] View attendance history
- [ ] Generate attendance report

### 6.3 Payroll Calculation
- [ ] View payroll summary
- [ ] Daily rate calculation
- [ ] Overtime calculation
- [ ] Deductions
- [ ] Total calculation accuracy
- [ ] Export payroll data

### 6.4 Staff Scheduling
- [ ] View staff calendar
- [ ] Check conflicts
- [ ] Reassign staff
- [ ] Availability management

---

## 7. 📄 Document Management

### 7.1 Document Upload
- [ ] Upload to project
- [ ] Upload to candidate
- [ ] File type validation
- [ ] File size limits
- [ ] Progress indicator
- [ ] Cancel upload

### 7.2 Document Operations
- [ ] View document list
- [ ] Preview documents
- [ ] Download documents
- [ ] Delete documents
- [ ] Share document link
- [ ] Document categorization

---

## 8. 🏢 Company Management

### 8.1 Company Profile
- [ ] Add new company
- [ ] Edit company details
- [ ] Upload company logo
- [ ] Parent/child company relationships
- [ ] Company type selection

### 8.2 Company Contacts
- [ ] Add contact person
- [ ] Edit contact details
- [ ] Set primary contact
- [ ] Remove contact
- [ ] Contact appears in CC options

---

## 9. 👥 Team Management

### 9.1 Team Members
- [ ] View team list
- [ ] Invite new member
- [ ] Set roles (Admin, Manager, Staff)
- [ ] Edit member details
- [ ] Deactivate member
- [ ] Resend invitation

### 9.2 Permissions
- [ ] Role-based access control
- [ ] Admin full access
- [ ] Manager limited access
- [ ] Staff view-only areas
- [ ] Permission inheritance

---

## 10. 📊 Dashboard & Analytics

### 10.1 Dashboard Widgets
- [ ] Active projects count
- [ ] Revenue metrics
- [ ] Staff utilization
- [ ] Upcoming events
- [ ] Recent activities
- [ ] Quick actions

### 10.2 Revenue Dashboard (Goals)
- [ ] Revenue tracking
- [ ] Goal progress
- [ ] Monthly/yearly comparison
- [ ] Charts and visualizations
- [ ] Export data

---

## 11. 🛠️ Tools & Utilities

### 11.1 Data Extraction Tools
- [ ] WhatsApp parser
- [ ] Excel importer
- [ ] Data validation
- [ ] Preview results
- [ ] Export cleaned data

### 11.2 Receipt OCR Tool
- [ ] Upload receipt image
- [ ] Extract text
- [ ] Edit extracted data
- [ ] Save to expense claim

### 11.3 Calculators
- [ ] Payroll calculator
- [ ] Date range calculator
- [ ] Currency converter

---

## 12. ⚙️ Settings

### 12.1 General Settings
- [ ] Company information
- [ ] Default values
- [ ] Working hours
- [ ] Timezone settings

### 12.2 Notification Settings
- [ ] Email notifications toggle
- [ ] In-app notifications
- [ ] Notification preferences
- [ ] Test notifications

### 12.3 Security Settings
- [ ] Change password
- [ ] Two-factor auth (if available)
- [ ] Active sessions
- [ ] Login history

### 12.4 Theme Settings
- [ ] Toggle dark/light mode
- [ ] Theme persistence
- [ ] UI elements adapt to theme

---

## 13. 📱 Mobile Responsiveness

### 13.1 Responsive Design
- [ ] Sidebar collapses on mobile
- [ ] Tables scroll horizontally
- [ ] Forms adapt to mobile
- [ ] Touch-friendly buttons
- [ ] Readable text sizes

### 13.2 Mobile Navigation
- [ ] Hamburger menu works
- [ ] Swipe gestures (if any)
- [ ] Back button behavior
- [ ] Deep linking

---

## 14. 🔍 Search & Filters

### 14.1 Global Search
- [ ] Search across entities
- [ ] Search suggestions
- [ ] Recent searches
- [ ] Clear search history

### 14.2 Advanced Filters
- [ ] Multiple filter combination
- [ ] Save filter presets
- [ ] Reset filters
- [ ] Filter count indicators

---

## 15. ⚡ Performance & UX

### 15.1 Loading States
- [ ] Page load indicators
- [ ] Skeleton screens
- [ ] Progress bars
- [ ] No flickering

### 15.2 Error Handling
- [ ] Network error messages
- [ ] Form validation errors
- [ ] 404 pages
- [ ] 500 error handling
- [ ] Retry mechanisms

### 15.3 Data Operations
- [ ] Pagination works
- [ ] Sorting is fast
- [ ] Search is responsive
- [ ] Bulk operations don't freeze UI

### 15.4 Accessibility
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] Focus indicators
- [ ] ARIA labels

---

## 16. 🔒 Security Testing

### 16.1 Authentication Security
- [ ] Cannot access protected routes without login
- [ ] Session timeout works
- [ ] No sensitive data in localStorage
- [ ] HTTPS only

### 16.2 Data Security
- [ ] Can't see other users' private data
- [ ] Role restrictions enforced
- [ ] No SQL injection vulnerabilities
- [ ] XSS protection

---

## 17. 🔄 Integration Testing

### 17.1 Supabase Integration
- [ ] Data syncs correctly
- [ ] Real-time updates (if any)
- [ ] File storage works
- [ ] Authentication flows

### 17.2 Third-party Services
- [ ] WhatsApp link generation
- [ ] OCR service
- [ ] Email notifications
- [ ] Payment gateways

---

## Critical User Flows to Test

### Flow 1: Complete Project Lifecycle
1. [ ] Create new project
2. [ ] Add staff members
3. [ ] Track attendance
4. [ ] Submit expenses
5. [ ] Process payroll
6. [ ] Complete project

### Flow 2: Candidate Journey
1. [ ] Register new candidate
2. [ ] Assign to project
3. [ ] Track performance
4. [ ] Update tier status
5. [ ] Process payments

### Flow 3: Expense Workflow
1. [ ] Create expense claim
2. [ ] Upload receipt
3. [ ] Submit for approval
4. [ ] Manager approves
5. [ ] Process payment

---

## Automated Test Coverage Areas

### Vibetest Priority Areas:
1. **Authentication flows** - Critical path testing
2. **CRUD operations** - Create, read, update, delete for all entities
3. **Form validations** - All input validation rules
4. **Navigation paths** - All routes accessible
5. **Error scenarios** - Network failures, invalid data
6. **Permission tests** - Role-based access control
7. **Search functionality** - All search features
8. **Data integrity** - Calculations, date handling

---

## Test Data Requirements

### Required Test Data:
- Multiple user accounts with different roles
- Projects in various states (planning, active, completed)
- Candidates with different tiers and statuses
- Expense claims in different approval states
- Historical data for reports
- Edge cases (very long names, special characters)

---

## Notes for Testers

1. **Always test both happy path and edge cases**
2. **Check console for JavaScript errors**
3. **Verify data persists after page refresh**
4. **Test with slow network (throttling)**
5. **Verify all toast notifications appear**
6. **Check responsive design at different breakpoints**
7. **Test with multiple tabs open**
8. **Verify real-time updates where applicable**

---

## Severity Classification

- **🔴 Critical**: Blocks core functionality (auth, payments, data loss)
- **🟡 High**: Major feature broken but workaround exists
- **🟢 Medium**: Minor feature issue, cosmetic problems
- **⚪ Low**: Enhancement suggestions, nice-to-have features