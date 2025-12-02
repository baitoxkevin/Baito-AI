# Baito Product Requirements Document (PRD)

**Author:** Kevin
**Date:** 2025-10-09
**Project Level:** Level 2
**Project Type:** Web application (Feature Enhancement)
**Target Scale:** 8-12 stories, 1-2 epics, 1-2 week timeline

---

## Description, Context and Goals

### Feature Description

**Multi-Schedule Project Creation System** - A comprehensive enhancement to the Baito project management system that enables creating and managing complex projects spanning multiple days, locations, and schedules. This feature addresses the current limitation where projects can only be created for single-day, single-location events.

**Key Components:**

1. **One-Click Job Ad Import Parser**
   - Parse structured WhatsApp job advertisements
   - Auto-extract: dates, locations, working hours, salary, job requirements
   - Support for multi-day ranges (e.g., "13-16 Oct @ Menara SSM + 27-30 Oct @ SSM Shah Alam")
   - Convert text format into structured project data

2. **Multi-Dimensional Project Creation UI**
   - Enhanced project creation form supporting multiple date ranges
   - Multiple location management per project
   - Flexible schedule configuration (different times per location/date)
   - Visual representation of complex schedules

3. **Location Editing Bug Fix**
   - Fix inconsistent location editing behavior in ProjectSpotlight calendar view
   - Some projects allow double-click to edit location, others don't
   - Standardize location editing interaction across all projects

4. **Backward Compatibility**
   - Existing single-day, single-location projects continue working
   - Graceful migration path for legacy project data
   - Database schema extends without breaking changes

**Example Use Case:**
```
Job Ad Input:
"RM1200 Female Crew - Fluent English
📍Date & Location: MUST COMMIT FULL 8 DAYS
• 13-16 Oct @ Menara SSM
• 27-30 Oct @ SSM Shah Alam
⏰Time: 9am-5pm (call time 8am)
💰Salary: RM150/day, total RM1200"

Expected Output:
- Project created with 2 location blocks
- Date range 1: Oct 13-16, 2024 @ Menara SSM (4 days)
- Date range 2: Oct 27-30, 2024 @ SSM Shah Alam (4 days)
- Working hours: 9am-5pm (call time 8am) for all days
- Total: 8 days @ RM150/day = RM1200
- Crew requirements: Female, Fluent English, Energetic
```

### Deployment Intent

**Production-Ready App** - This feature will be deployed to the live Baito crew management system for immediate use by project managers handling real crew bookings and event staffing operations.

### Context

The current Baito system only supports single-day, single-location project creation, forcing project managers to either (1) manually create multiple separate projects for multi-day events (tedious, error-prone, and time-consuming), (2) use workarounds that compromise data integrity, or (3) decline complex job opportunities altogether. As clients increasingly request multi-day, multi-location crew staffing (like the 8-day SSM events), this limitation directly impacts revenue and operational efficiency. Additionally, project managers spend 5-10 minutes manually transcribing WhatsApp job advertisements into the system - a repetitive task ripe for automation. The combination of these pain points creates an urgent need for a system that can handle real-world project complexity while maintaining the simplicity that makes Baito effective for straightforward single-day bookings.

### Goals

**Goal 1: Streamline Complex Project Creation**
- Enable project managers to create multi-day, multi-location projects in under 2 minutes (vs. creating 8+ separate single-day projects)
- Support projects spanning multiple date ranges and venues without workarounds
- Reduce data entry errors for complex scheduling scenarios

**Goal 2: Accelerate Job Ad Processing**
- Implement one-click import from WhatsApp job advertisements
- Auto-extract project details (dates, locations, times, pay, requirements) with 90%+ accuracy
- Reduce project setup time from 5-10 minutes to under 30 seconds for standard job ads

**Goal 3: Improve System Reliability and UX Consistency**
- Fix location editing bug in ProjectSpotlight calendar view
- Standardize editing interactions across all project types
- Ensure backward compatibility with existing single-day projects (zero breaking changes)

## Requirements

### Functional Requirements

**FR001: Job Ad Text Import**
- System must provide a text input field that accepts WhatsApp job advertisement format
- Parse and extract structured data: dates, locations, working hours, pay rate, job requirements
- Support common date formats (e.g., "13-16 Oct", "Oct 13-16", "13/10 - 16/10")
- Display parsed data preview before project creation for user confirmation

**FR002: Multiple Date Range Management**
- Users can add multiple date ranges to a single project
- Each date range includes: start date, end date, and associated location
- Support non-contiguous date ranges (e.g., Oct 13-16 and Oct 27-30)
- Allow manual addition, editing, and removal of date ranges

**FR003: Multiple Location Management**
- Users can add multiple locations to a single project
- Each location includes: venue name, address, and associated date range(s)
- Support location-specific settings (parking, access instructions, contact person)
- Allow location reuse across different date ranges within the same project

**FR004: Flexible Schedule Configuration**
- Configure working hours per date range or per individual date
- Support different call times and end times for different locations/dates
- Specify break times and overtime rules per schedule
- Allow schedule templates for commonly used configurations

**FR005: Calendar Location Editing**
- Fix: Standardize double-click location editing behavior across all projects in ProjectSpotlight calendar view
- Enable inline editing of location for any project date
- Show visual indicator when location is editable
- Persist location changes immediately to database

**FR006: Multi-Schedule Project Display**
- Calendar view shows all date ranges for multi-schedule projects
- Visual differentiation between single-day and multi-schedule projects
- Display location information on hover or click
- Support expansion/collapse of multi-day project details

**FR007: Crew Assignment Across Schedules**
- Assign crew members to specific date ranges within a project
- Support different crew configurations for different locations/dates
- Track crew availability across the entire project duration
- Prevent double-booking crew members on overlapping dates

**FR008: Backward Compatibility**
- Existing single-day, single-location projects continue functioning without modification
- Database schema changes must not break existing project queries
- UI automatically detects and handles both project types (single vs. multi-schedule)
- Migration path for converting single-day projects to multi-schedule format (optional)

**FR009: Project Validation**
- Validate date ranges don't overlap within same project
- Ensure all date ranges have associated locations
- Verify working hours are within 24-hour period
- Check crew capacity doesn't exceed requirements for any date range

**FR010: Search and Filter Multi-Schedule Projects**
- Search projects by location (returns projects with any matching location)
- Filter projects by date range (shows projects overlapping the range)
- Display all relevant date ranges in search results
- Support filtering by project complexity (single-day vs. multi-schedule)

**FR011: Export Multi-Schedule Project Data**
- Generate reports showing all date ranges, locations, and assigned crew
- Export format compatible with existing payment export system
- Include per-location, per-date breakdowns for accounting
- Support batch export for multiple multi-schedule projects

### Non-Functional Requirements

**NFR001: Performance**
- Job ad parsing must complete within 3 seconds for typical advertisement text (200-500 words)
- Calendar view must render multi-schedule projects within 500ms on standard devices
- Database queries for multi-schedule projects must not exceed 200ms response time
- Support up to 100 concurrent users creating/editing multi-schedule projects

**NFR002: Data Integrity and Reliability**
- Zero data loss during migration from single-schedule to multi-schedule data model
- All database operations must be ACID-compliant with proper transaction handling
- Automatic backup before any schema migration or bulk data update
- 99.9% uptime for project creation and editing functionality

**NFR003: Usability and Accessibility**
- Multi-schedule project creation interface must be intuitive - new users complete first multi-schedule project within 5 minutes without training
- Job ad import parser must provide clear error messages when parsing fails, with suggestions for correction
- Mobile-responsive design per project standards (TailwindCSS breakpoints)
- Keyboard navigation support for all multi-schedule management features

**NFR004: Maintainability and Code Quality**
- Follow existing component development standards (standalone logic principles)
- Strong TypeScript typing for all new data structures (Project, Schedule, Location interfaces)
- Unit test coverage minimum 80% for job ad parsing logic
- Integration tests for critical flows (job ad import → project creation → calendar display)

**NFR005: Backward Compatibility and Migration Safety**
- Existing single-schedule projects must continue functioning without code changes
- Database migration must be reversible (rollback capability)
- No breaking changes to existing API contracts or component interfaces
- Feature flagging support to enable/disable multi-schedule functionality if issues arise

## User Journeys

### Primary User Journey: Creating Multi-Schedule Project from WhatsApp Job Ad

**Persona:** Kevin (Project Manager)
**Goal:** Create an 8-day, multi-location project from a WhatsApp job advertisement in under 2 minutes

**Journey Steps:**

1. **Receive Job Ad** (External)
   - Kevin receives WhatsApp message with SSM event details (8 days, 2 locations, specific requirements)
   - Needs to quickly add to Baito system

2. **Navigate to Project Creation**
   - Opens Baito web app → Clicks "Create New Project" button → Sees enhanced project creation form

3. **Import Job Ad**
   - Notices "Import from Job Ad" button/section
   - Copies job ad text from WhatsApp → Pastes into text input field → Clicks "Parse Job Ad" button

4. **Review Parsed Data**
   - System displays preview of extracted information:
     - Title: "RM1200 Female Crew - Fluent English"
     - Date Range 1: Oct 13-16, 2024 @ Menara SSM
     - Date Range 2: Oct 27-30, 2024 @ SSM Shah Alam
     - Working hours: 9am-5pm (call time 8am)
     - Pay rate: RM150/day
     - Requirements: Female, Fluent English, Energetic
   - Kevin reviews and makes minor adjustments if needed

5. **Confirm and Create Project**
   - Kevin confirms the parsed data is accurate
   - Clicks "Create Multi-Schedule Project" → System creates project with 2 schedule blocks

6. **View in Calendar**
   - System redirects to calendar view → Multi-schedule project appears across all 8 days
   - Color-coded blocks show: Oct 13-16 (Menara SSM) and Oct 27-30 (SSM Shah Alam)
   - Kevin hovers over each date to see location details

7. **Verify and Next Steps**
   - Kevin double-clicks on Oct 13 date → Location editing modal opens
   - Can edit inline (bug fix working correctly) → Confirms project is ready for crew assignment

**Success Criteria:**
- ✓ Total time: Under 2 minutes (vs. 10+ minutes manually)
- ✓ Zero data entry errors (parsing accuracy)
- ✓ Immediate calendar visualization
- ✓ Location editing works consistently

**Pain Points Addressed:**
- No more manual creation of multiple single-day projects
- No more copy-paste errors from WhatsApp
- Immediate visual confirmation of complex schedules
- Fixed location editing inconsistency

## UX Design Principles

**UX Principle 1: Progressive Disclosure**
- Simple projects remain simple (single-day flow unchanged)
- Multi-schedule complexity only revealed when needed
- Job ad import is optional - power users can find it, others can use manual input
- Advanced features (schedule templates, location-specific settings) hidden behind expandable sections

**UX Principle 2: Immediate Visual Feedback**
- Job ad parsing shows real-time preview before project creation
- Calendar updates immediately after project creation (no page refresh needed)
- Visual differentiation between single-day and multi-schedule projects
- Hover states clearly indicate editable elements (location double-click fix)

**UX Principle 3: Error Prevention Over Error Handling**
- Date range validation prevents overlapping schedules
- Location autocomplete reduces typos
- Required fields clearly marked before submission
- Confirmation dialog for complex operations (bulk edits, migrations)

**UX Principle 4: Consistent Interaction Patterns**
- All projects use same editing interactions (fix for location editing bug)
- Color coding follows existing Baito calendar conventions
- Mobile responsive breakpoints per project standards (TailwindCSS)
- Keyboard navigation for power users

**UX Principle 5: Graceful Degradation**
- If job ad parsing fails, fall back to manual input
- If multi-schedule features unavailable, single-day mode still works
- Calendar view optimizes for device capabilities (simpler on mobile)
- Feature flags allow safe rollback if issues arise

## Epics

### Epic 1: Multi-Schedule Project Infrastructure
**Priority:** P0 (Critical - blocks Epic 2)
**Stories:** 10 stories
**Timeline:** ~1 week

Core functionality enabling projects with multiple date ranges, locations, and schedules. Includes:
- Database schema migration for multi-schedule support
- Multiple date range and location management UI
- Flexible schedule configuration per date range
- Enhanced calendar display for multi-schedule projects
- Crew assignment across multiple schedules
- Backward compatibility layer for existing single-day projects
- Project validation engine
- Multi-schedule search, filter, and export systems

### Epic 2: Job Ad Import & Automation
**Priority:** P1 (High - major UX improvement)
**Stories:** 4 stories
**Timeline:** ~3-4 days

Intelligent parsing system for WhatsApp job advertisements with one-click import:
- Job ad text parser engine (regex or LLM-based)
- Parsed data preview and confirmation interface
- Calendar location editing bug fix (critical)
- Parser error handling and graceful fallback

**Total Scope:** 2 epics, 14 stories, estimated 1-2 weeks (solo development)

**Note:** Detailed story breakdown with acceptance criteria available in `epic-stories.md`

## Out of Scope

**Future Enhancements - Intentionally Excluded from v1:**

1. **Recurring Project Templates** - Automatic project creation from templates deferred to Phase 2
2. **LLM-Based Job Ad Parser** - Initial release uses regex-based parser; AI enhancement in v2 based on accuracy metrics
3. **Multi-Currency Support** - Current scope limited to RM (Malaysian Ringgit); international expansion deferred
4. **Advanced Crew Scheduling Optimization** - AI-based assignment suggestions deferred until 50%+ adoption
5. **Real-Time Collaboration Features** - Multi-user editing deferred to future collaboration epic
6. **Mobile App Native Features** - Mobile-responsive web sufficient for Phase 1; native apps deferred to mobile roadmap
7. **Advanced Analytics Dashboard** - Multi-schedule metrics and reporting deferred to Analytics epic (Q2 2025)
8. **Automated Client Communication** - SMS/WhatsApp integration deferred to Communication automation epic

**Rationale:** Focus on core multi-schedule functionality, validate adoption, keep initial release simple and reliable.

## Assumptions and Dependencies

### Assumptions

1. **WhatsApp Job Ad Format Consistency** - Job ads follow semi-structured format; if format varies, regex parser may fail (mitigation: manual override)
2. **Database Performance** - Supabase PostgreSQL can handle junction tables at current scale (mitigation: proper indexing, pagination)
3. **User Adoption** - Project managers will prefer one-click import over manual entry (mitigation: make import optional, progressive disclosure)
4. **Single Developer Capacity** - 14 stories completable in 1-2 weeks solo (mitigation: phased rollout, prioritize Epic 1)
5. **Calendar Component Extensibility** - Current calendar can be enhanced for multi-schedule display (mitigation: review architecture first)

### Dependencies

**Critical:**
- Supabase access with migration permissions ✓
- Existing projects table schema understanding (DATABASE_SCHEMA_EXTENDED.md) ✓

**High:**
- ProjectSpotlight and calendar components must be refactorable ✓
- No concurrent schema changes by other developers

**Medium:**
- Payment export system (lib/payment-queue-service.ts) extensibility ✓
- Testing infrastructure (Vitest, Playwright) ✓

**External:**
- Supabase PostgreSQL, React 18 + TypeScript, TailwindCSS + ShadCN UI

---

## Next Steps

{{next_steps}}

## Document Status

- [ ] Goals and context validated with stakeholders
- [ ] All functional requirements reviewed
- [ ] User journeys cover all major personas
- [ ] Epic structure approved for phased delivery
- [ ] Ready for architecture phase

_Note: See technical-decisions.md for captured technical context_

---

_This PRD adapts to project level Level 2 - providing appropriate detail without overburden._
