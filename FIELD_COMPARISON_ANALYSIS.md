# Field Comparison Analysis: NewProjectDialog vs EditProjectDialogStepped

## Fields Present in NewProjectDialog but MISSING in EditProjectDialogStepped:

### 1. Manager/Person in Charge Fields
- **`manager_id`** (Line 94, 456-491 in NewProjectDialog)
  - Field for selecting the person in charge of the project
  - Shows list of users with admin/super_admin/manager roles
  - This is a REQUIRED field in NewProjectDialog

### 2. Brand Information Fields
- **`brand_name`** (Line 95, 496-540 in NewProjectDialog)
  - Text field for entering brand name (e.g., Nike, Coca-Cola)
  - Has integration with logo search functionality
  
- **`brand_logo`** (Line 96, 542-608 in NewProjectDialog)
  - URL field for brand logo
  - Includes preview functionality
  - Has "Find Logo" button integration with BrandLogoSelector component
  - Google Image search helper button

### 3. Advanced/Financial Fields
- **`supervisors_required`** (Line 119, 1030-1056 in NewProjectDialog)
  - Number field for specifying how many supervisors are needed
  - Range: 0-9 supervisors
  - Part of the staffing requirements

## Fields Present in Both (for reference):

Both dialogs include these common fields:
- title
- description
- client_id
- event_type
- project_type
- venue_address
- venue_details
- start_date / end_date
- working_hours_start / working_hours_end
- schedule_type
- crew_count
- status
- priority
- budget
- invoice_number
- color (in Edit only, not in New)

## Key Differences in Implementation:

1. **Step Organization**:
   - NewProjectDialog has these fields distributed across steps:
     - `manager_id`, `brand_name`, `brand_logo` → in "project-info" step
     - `supervisors_required` → in "staffing" step

2. **Required Fields**:
   - `manager_id` is marked as REQUIRED in NewProjectDialog
   - Brand fields are optional

3. **UI Features Missing in Edit**:
   - BrandLogoSelector component integration
   - Logo search functionality
   - Manager selection with role-based filtering

## Recommendations:

To achieve feature parity, EditProjectDialogStepped should add:

1. In the "project-info" step:
   - Manager/Person in Charge selection field
   - Brand name and logo fields with search functionality

2. In the "staffing" step:
   - Supervisors required field

3. Supporting functionality:
   - Import and use BrandLogoSelector component
   - Fetch managers/users list with role filtering
   - Add validation for manager_id as required field