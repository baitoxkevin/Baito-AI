# Project Workflow User Journey Scenarios

## Overview
This document maps out the complete user journey for managing projects in Baito AI, from creation through completion, including all critical touchpoints.

---

## Journey Map: Project Lifecycle Management

```
LOGIN → DASHBOARD → CREATE PROJECT → STAFF PROJECT → MANAGE → EXPORT/INVOICE → COMPLETE
  │         │            │               │              │            │              │
  └─────────┴────────────┴───────────────┴──────────────┴────────────┴──────────────┘
                                    Full Project Lifecycle
```

---

## Scenario 1: Complete Project Creation & Management (Happy Path)

### User Persona
**Name**: Sarah Chen
**Role**: Project Manager
**Goal**: Create a new event project, staff it, and track through completion

### Journey Steps

#### Step 1: Login to System
**Entry Point**: Login page
**Actions**:
1. Enter email and password
2. Click "Login" button
3. System authenticates user
4. Redirect to Projects Dashboard

**Expected Outcome**:
- User successfully logged in
- Session established
- Dashboard displays with user's projects

**Screenshot Location**: `[SCREENSHOT-001-login.png]`

---

#### Step 2: View Projects Dashboard
**Entry Point**: Projects Dashboard
**Actions**:
1. View project statistics (total, active, completed)
2. See project cards in grid/list view
3. Review projects by month using month selector
4. Quick filter by status (All, Planning, Confirmed, In Progress, Completed)

**Expected Outcome**:
- Dashboard shows accurate project counts
- Projects are grouped by month
- Filters work correctly
- Metrics update based on filters

**Screenshot Location**: `[SCREENSHOT-002-dashboard.png]`

---

#### Step 3: Create New Project
**Entry Point**: Projects Dashboard → "New Project" button
**Actions**:
1. Click "New Project" button
2. **Project Info Step**:
   - Enter project title: "Summer Festival 2025"
   - Select company from dropdown: "ABC Corporation"
   - Select project manager: "Sarah Chen"
   - Choose start date: "2025-07-15"
   - Choose end date: "2025-07-17"
   - Click "Next"

3. **Event Details Step**:
   - Select project type: "Recruitment"
   - Choose priority: "High"
   - Set status: "Planning"
   - Select brand logo (optional)
   - Click "Next"

4. **Location Step**:
   - Enter venue address: "Central Park, New York, NY"
   - Add venue details: "Main stage area, near fountain"
   - Click "Next"

5. **Schedule Step**:
   - Set schedule type: "Multiple days"
   - Set working hours start: "08:00"
   - Set working hours end: "18:00"
   - Click "Next"

6. **Staffing Step**:
   - Set crew count needed: 25
   - Set supervisors required: 3
   - Add special skills: "Event management, crowd control"
   - Click "Next"

7. **Advanced Settings Step**:
   - Enter budget: $15,000
   - Add invoice number (optional)
   - Choose project color: Blue
   - Click "Next"

8. **Review & Save Step**:
   - Review all entered information
   - Click "Create Project"

**Expected Outcome**:
- Project created in database
- Success message displayed
- User redirected to project details OR dashboard with new project visible
- Project appears in "Planning" status with correct dates

**Screenshot Locations**:
- `[SCREENSHOT-003-new-project-step1.png]`
- `[SCREENSHOT-004-new-project-step2.png]`
- `[SCREENSHOT-005-new-project-step3.png]`
- `[SCREENSHOT-006-new-project-step4.png]`
- `[SCREENSHOT-007-new-project-step5.png]`
- `[SCREENSHOT-008-new-project-step6.png]`
- `[SCREENSHOT-009-new-project-review.png]`

---

#### Step 4: Edit Project Details
**Entry Point**: Project card → "View Details" button
**Actions**:
1. Click "View Details" on project card
2. Project details dialog opens
3. Click "Edit" button (or navigate to edit mode)
4. Modify project information:
   - Update venue address
   - Change working hours
   - Adjust crew count
5. Click "Save Changes"

**Expected Outcome**:
- Changes persist to database
- Success toast notification
- Project card reflects updated information
- Edit history tracked (if audit feature exists)

**Screenshot Locations**:
- `[SCREENSHOT-010-project-details.png]`
- `[SCREENSHOT-011-edit-project.png]`

---

#### Step 5: Add Staff to Project
**Entry Point**: Project Details → Staffing Tab
**Actions**:
1. Navigate to "Staffing" tab in project details
2. Click "Add Staff" button
3. Search for candidate by name: "John Doe"
4. Select candidate from dropdown
5. Choose designation: "Event Coordinator"
6. Set application type: "Full project" or "Specific dates"
7. If specific dates:
   - Select working dates from calendar
   - Set daily salary for each date
8. Set initial status: "Pending"
9. Click "Add to Project"

**Expected Outcome**:
- Staff member added to "Applicants" list
- Database record created linking staff to project
- Staff count updates on project card
- Conflict detection runs (warns if staff already assigned elsewhere)

**Screenshot Locations**:
- `[SCREENSHOT-012-staffing-tab.png]`
- `[SCREENSHOT-013-add-staff-search.png]`
- `[SCREENSHOT-014-add-staff-dates.png]`
- `[SCREENSHOT-015-conflict-warning.png]`

---

#### Step 6: Manage Staff Status
**Entry Point**: Staffing Tab → Applicants List
**Actions**:
1. View applicant in "Pending" section
2. Click status dropdown for staff member
3. Change status to "Confirmed"
4. Staff member automatically moves to "Confirmed Staff" section
5. Repeat for multiple staff members
6. Optionally remove staff member:
   - Click "Remove" button
   - Confirm removal in dialog
   - Staff removed from project

**Expected Outcome**:
- Status changes persist immediately to database
- Staff members appear in correct section based on status
- Project "filled_positions" count updates
- Removed staff no longer appear in project

**Screenshot Locations**:
- `[SCREENSHOT-016-staff-status-change.png]`
- `[SCREENSHOT-017-confirmed-staff-list.png]`
- `[SCREENSHOT-018-remove-staff.png]`

---

#### Step 7: Test Replacement Staff Feature
**Entry Point**: Staffing Tab → Confirmed Staff
**Actions**:
1. Select a confirmed staff member (e.g., "John Doe")
2. Click "Replace" button or icon
3. Replacement dialog opens
4. Select replacement reason: "Sick leave"
5. Search for replacement candidate: "Jane Smith"
6. Select replacement candidate
7. Set replacement dates (inherit from original staff or modify)
8. Click "Confirm Replacement"

**Expected Outcome**:
- Original staff marked as replaced with reason
- Replacement staff added with special "Replacement" badge
- Database records both original and replacement with relationship
- Project staff count remains consistent
- Notification sent (if notifications feature exists)

**Screenshot Locations**:
- `[SCREENSHOT-019-replace-staff-button.png]`
- `[SCREENSHOT-020-replacement-dialog.png]`
- `[SCREENSHOT-021-replacement-confirmed.png]`

---

#### Step 8: Manage Payroll
**Entry Point**: Project Details → Payroll/Finance Tab
**Actions**:
1. Navigate to "Payroll" or "Finance" tab
2. View list of all confirmed staff with working dates
3. For each staff member:
   - Verify working dates
   - Check daily salary rates
   - View calculated total
4. Edit individual salary if needed:
   - Click "Edit" on staff row
   - Modify daily rate or total
   - Click "Save"
5. Review total project payroll calculation
6. Click "Save Payroll" to finalize

**Expected Outcome**:
- All staff salaries calculated correctly
- Total payroll matches sum of individual amounts
- Changes persist to database
- Payroll ready for export/invoice generation

**Screenshot Locations**:
- `[SCREENSHOT-022-payroll-tab.png]`
- `[SCREENSHOT-023-edit-salary.png]`
- `[SCREENSHOT-024-payroll-summary.png]`

---

#### Step 9: Upload Documents
**Entry Point**: Project Details → Documents Tab
**Actions**:
1. Navigate to "Documents" tab
2. Click "Add Document" or "Upload" button
3. Choose file from computer (PDF, Word, Excel, Image)
4. Enter document details:
   - Document name: "Event Permit"
   - Description: "City permit for event"
   - Type: "Contract" or "Legal"
5. Click "Upload"
6. Repeat for multiple documents
7. Optionally add external link:
   - Click "Add External Link"
   - Enter URL and description
   - Click "Save"

**Expected Outcome**:
- Files uploaded to Supabase storage
- Document metadata saved to database
- Documents appear in list with download buttons
- File previews work (for images/PDFs)
- External links are clickable

**Screenshot Locations**:
- `[SCREENSHOT-025-documents-tab.png]`
- `[SCREENSHOT-026-upload-document.png]`
- `[SCREENSHOT-027-document-list.png]`

---

#### Step 10: Export Project Details
**Entry Point**: Project Details or Dashboard
**Actions**:
1. Click "Export" button on project
2. Choose export format:
   - **CSV**: Basic project and staff data
   - **Excel**: Formatted with multiple sheets
   - **PDF**: Printable project summary
3. Select what to include:
   - Project information
   - Staff list with contact details
   - Financial summary
   - Documents list
4. Click "Download"

**Expected Outcome**:
- File downloads successfully
- Contains accurate, up-to-date data
- Formatting is clean and readable
- All selected sections included

**Screenshot Locations**:
- `[SCREENSHOT-028-export-button.png]`
- `[SCREENSHOT-029-export-options.png]`
- `[SCREENSHOT-030-exported-file.png]`

---

#### Step 11: Generate Invoice
**Entry Point**: Project Details → Finance/Export Section
**Actions**:
1. Navigate to invoice generation area
2. Click "Generate Invoice" button
3. Invoice preview dialog opens showing:
   - Company details
   - Project information
   - Staff costs breakdown
   - Total amount
   - Invoice number
4. Optionally edit invoice details:
   - Modify invoice number
   - Adjust line items
   - Add notes/terms
5. Click "Generate PDF" or "Download Invoice"

**Expected Outcome**:
- Professional invoice PDF generated
- Correct calculations (staff costs + overhead)
- Invoice saved to project documents
- Database updated with invoice record

**Screenshot Locations**:
- `[SCREENSHOT-031-generate-invoice.png]`
- `[SCREENSHOT-032-invoice-preview.png]`
- `[SCREENSHOT-033-invoice-pdf.png]`

---

#### Step 12: Mark Project Complete
**Entry Point**: Project Details or Card
**Actions**:
1. Open project details
2. Click status dropdown
3. Select "Completed"
4. Confirmation dialog appears (optional)
5. Click "Confirm"

**Expected Outcome**:
- Project status updated to "Completed"
- Project moves to "Completed" filter section
- Project card visual changes (e.g., green border)
- Completion date recorded
- Project locked from further staff changes (optional business rule)

**Screenshot Locations**:
- `[SCREENSHOT-034-complete-project.png]`
- `[SCREENSHOT-035-completed-status.png]`

---

## Scenario 2: Error Handling & Edge Cases

### Scenario 2A: Schedule Conflict Detection
**User Action**: Add staff member already assigned to another project on same dates
**Expected System Behavior**:
1. System detects conflict when adding staff
2. Warning dialog appears showing:
   - Conflicting project name
   - Overlapping dates
   - Warning message
3. User can:
   - Cancel and choose different staff
   - Proceed anyway (with override permission)
4. If proceeded, conflict logged in database

**Screenshot Location**: `[SCREENSHOT-036-conflict-detection.png]`

---

### Scenario 2B: Validation Errors
**User Action**: Submit project form with missing required fields
**Expected System Behavior**:
1. Form validation triggers before submission
2. Error messages appear next to invalid fields:
   - "Title is required"
   - "Company must be selected"
   - "Start date is required"
3. Form cannot submit until errors resolved
4. First error field auto-focused

**Screenshot Location**: `[SCREENSHOT-037-validation-errors.png]`

---

### Scenario 2C: Database Operation Failure
**User Action**: Create project but database is temporarily unavailable
**Expected System Behavior**:
1. Loading spinner shows during submission
2. After timeout, error toast appears:
   - "Failed to create project. Please try again."
3. Form data preserved (not lost)
4. User can retry submission
5. Error logged for debugging

**Screenshot Location**: `[SCREENSHOT-038-database-error.png]`

---

### Scenario 2D: File Upload Limits
**User Action**: Upload document larger than size limit (e.g., > 10MB)
**Expected System Behavior**:
1. File size checked before upload
2. Error message appears:
   - "File size exceeds 10MB limit"
3. Upload cancelled
4. User can select different file

**Screenshot Location**: `[SCREENSHOT-039-file-size-error.png]`

---

## Scenario 3: Bulk Operations

### Scenario 3A: Bulk Staff Assignment
**User Action**: Add multiple staff members at once
**Expected System Behavior**:
1. Click "Bulk Add Staff" button
2. Multi-select interface appears
3. User selects 5+ staff members
4. Set common properties:
   - Same designation
   - Same dates
   - Same salary
5. Click "Add All"
6. All staff added in single transaction

**Screenshot Location**: `[SCREENSHOT-040-bulk-add-staff.png]`

---

### Scenario 3B: Bulk Status Update
**User Action**: Confirm all pending applicants at once
**Expected System Behavior**:
1. Select all pending applicants (checkbox)
2. Click "Confirm All" button
3. Confirmation dialog shows count: "Confirm 8 applicants?"
4. Click "Yes"
5. All moved to Confirmed section
6. Success message: "8 staff members confirmed"

**Screenshot Location**: `[SCREENSHOT-041-bulk-confirm.png]`

---

## Scenario 4: Search & Filter

### Scenario 4A: Advanced Project Search
**User Action**: Find specific project among hundreds
**Actions**:
1. Use search bar at top of dashboard
2. Type project title: "Summer Festival"
3. Results filter in real-time
4. Optionally combine with filters:
   - Status: "In Progress"
   - Month: "July 2025"
   - Priority: "High"
5. Click on result to open

**Screenshot Location**: `[SCREENSHOT-042-search-filter.png]`

---

### Scenario 4B: Staff Search in Assignment
**User Action**: Find candidate for assignment from large database
**Actions**:
1. In "Add Staff" dialog
2. Type candidate name in search: "Smith"
3. Results show matching candidates with:
   - Photo
   - Name
   - Designation
   - Availability indicator
4. Click to select

**Screenshot Location**: `[SCREENSHOT-043-staff-search.png]`

---

## Scenario 5: Mobile/Responsive Views

### Scenario 5A: Mobile Dashboard
**User Action**: Access dashboard on phone (375px width)
**Expected Behavior**:
- Project cards stack vertically
- Touch-friendly buttons (min 44px)
- Simplified metrics (stacked, not side-by-side)
- Hamburger menu for filters
- Swipe gestures work

**Screenshot Location**: `[SCREENSHOT-044-mobile-dashboard.png]`

---

### Scenario 5B: Tablet Staffing
**User Action**: Add staff on tablet (768px width)
**Expected Behavior**:
- Dialog fills screen appropriately
- Form fields readable size
- Date picker touch-friendly
- Staff list shows in optimized layout

**Screenshot Location**: `[SCREENSHOT-045-tablet-staffing.png]`

---

## User Needs Summary

Based on these scenarios, users need:

1. **Efficiency**: Quick project creation with smart defaults
2. **Reliability**: Data saves immediately, no lost work
3. **Visibility**: Clear status indicators and progress tracking
4. **Flexibility**: Easy editing and updates throughout project lifecycle
5. **Accuracy**: Conflict detection, validation, error prevention
6. **Reporting**: Export capabilities for external stakeholders
7. **Documentation**: Upload and organize project-related files
8. **Financial Control**: Transparent payroll and invoice generation
9. **Mobile Access**: Responsive design for on-the-go management
10. **Bulk Operations**: Efficiency tools for large projects

---

## Critical Paths Identified

1. **Login → Dashboard** (P0)
2. **Create Project** (P0)
3. **Add Staff → Confirm** (P0)
4. **Generate Invoice** (P0)
5. **Export Project Data** (P1)
6. **Edit Project** (P1)
7. **Upload Documents** (P1)
8. **Replace Staff** (P2)
9. **Bulk Operations** (P2)
10. **Search/Filter** (P2)

---

## Next Steps

This journey map will be used to:
1. Create detailed user story document (Epic 1, Story 1)
2. Design test scenarios with specific test cases
3. Build user guide with step-by-step screenshots
4. Identify automation opportunities for E2E testing

---

**Document Version:** 1.0
**Created:** 2025-10-04
**Owner:** Sarah Chen (Project Manager) & Quinn (Test Architect)
