# Baito - Epic Breakdown

**Author:** Kevin
**Date:** 2025-10-09
**Project Level:** Level 2
**Target Scale:** 8-12 stories, 1-2 epics, 1-2 week timeline

---

## Epic Overview

This feature enhancement introduces multi-schedule project capabilities to the Baito crew management system through two focused epics:

**Epic 1: Multi-Schedule Project Infrastructure** (8-10 stories, ~1 week)
Core functionality enabling projects with multiple date ranges, locations, and schedules. Includes database schema updates, enhanced UI components, and backward compatibility layers.

**Epic 2: Job Ad Import & Automation** (3-4 stories, ~3-4 days)
Intelligent parsing system for WhatsApp job advertisements with one-click import, plus critical bug fixes for calendar location editing.

**Total Scope:** 12-14 stories across 2 epics, estimated 1-2 weeks for solo development.

---

## Epic 1: Multi-Schedule Project Infrastructure

**Epic Goal:** Enable project managers to create and manage projects spanning multiple non-contiguous date ranges, locations, and schedules while maintaining backward compatibility with existing single-day projects.

**Priority:** P0 (Critical - blocks Epic 2)

### Stories

#### Story 1.1: Database Schema for Multi-Schedule Projects
**As a** developer
**I want** to extend the database schema to support multiple schedules per project
**So that** we can store multi-day, multi-location project data without breaking existing projects

**Acceptance Criteria:**
- [ ] Create `project_schedules` table with columns: id, project_id, start_date, end_date, location_id, working_hours_start, working_hours_end, call_time, break_time
- [ ] Create `project_locations` table with columns: id, project_id, venue_name, venue_address, parking_info, access_instructions, contact_person
- [ ] Add `is_multi_schedule` boolean flag to existing `projects` table (default: false)
- [ ] Write migration script with rollback capability
- [ ] Test migration on copy of production database
- [ ] Verify existing single-schedule projects still work after migration
- [ ] Document schema changes in DATABASE_SCHEMA_EXTENDED.md

**Technical Notes:**
- Use Supabase migration tools
- Implement ACID-compliant transactions
- Add database indexes for query performance (project_id, start_date, end_date)

---

#### Story 1.2: Multiple Date Range Management UI
**As a** project manager
**I want** to add multiple date ranges to a single project
**So that** I can create projects spanning non-contiguous periods (e.g., Oct 13-16 + Oct 27-30)

**Acceptance Criteria:**
- [ ] Add "Add Date Range" button in project creation form
- [ ] Each date range row includes: start date picker, end date picker, location dropdown
- [ ] Support adding unlimited date ranges (with warning after 10+)
- [ ] Allow removing date ranges (with confirmation if crew assigned)
- [ ] Allow reordering date ranges by drag-and-drop
- [ ] Validate no overlapping dates within same project
- [ ] Show total days count across all date ranges
- [ ] Mobile-responsive design (stacked layout on small screens)

**Design Reference:** Follow existing ProjectCard responsive patterns from CLAUDE.md

---

#### Story 1.3: Multiple Location Management System
**As a** project manager
**I want** to manage multiple locations and associate them with date ranges
**So that** multi-location events are properly organized

**Acceptance Criteria:**
- [ ] Add "Manage Locations" section in project creation form
- [ ] Create location entry form: venue name, address, parking info, access instructions, contact person
- [ ] Save locations to `project_locations` table
- [ ] Allow selecting saved location when adding date ranges
- [ ] Support location reuse across different date ranges in same project
- [ ] Provide location autocomplete for previously used venues
- [ ] Display location count badge on project card
- [ ] Allow editing location details from calendar view

---

#### Story 1.4: Flexible Schedule Configuration
**As a** project manager
**I want** to configure different working hours for different date ranges
**So that** each location/date can have unique scheduling

**Acceptance Criteria:**
- [ ] Each date range allows setting: working_hours_start, working_hours_end, call_time, break_time
- [ ] Provide "Copy from previous range" quick action
- [ ] Support bulk schedule update for selected ranges
- [ ] Validate working hours (must be within 24-hour period)
- [ ] Calculate and display total working hours per range
- [ ] Show overtime calculations if hours exceed standard
- [ ] Store schedule templates for commonly used configurations (optional enhancement)

---

#### Story 1.5: Multi-Schedule Calendar Display Enhancement
**As a** project manager
**I want** to see all date ranges visualized in the calendar
**So that** I can quickly understand project complexity and crew allocation

**Acceptance Criteria:**
- [ ] Calendar shows all date ranges for multi-schedule projects
- [ ] Use color gradient to differentiate date ranges within same project
- [ ] Display location name on hover for each date block
- [ ] Add visual indicator (icon/badge) for multi-schedule projects
- [ ] Support expand/collapse for multi-day project details
- [ ] Clicking date range opens ProjectSpotlight with schedule details
- [ ] Performance: Render within 500ms for projects with up to 20 date ranges
- [ ] Mobile view: Optimized display for small screens

**Design Pattern:** Extend existing WavesBackground and ProjectCard components

---

#### Story 1.6: Crew Assignment Across Multiple Schedules
**As a** project manager
**I want** to assign crew to specific date ranges within a project
**So that** different crew can work different locations/dates

**Acceptance Criteria:**
- [ ] Crew assignment modal shows all date ranges with checkboxes
- [ ] Allow assigning crew to specific date ranges (not entire project)
- [ ] Support selecting "All date ranges" for crew working entire project
- [ ] Display crew availability status for each date range
- [ ] Prevent double-booking crew on overlapping dates
- [ ] Show crew count vs. requirement per date range
- [ ] Update projects.filled_positions based on average across ranges
- [ ] Generate crew schedule export per date range

---

#### Story 1.7: Backward Compatibility Layer
**As a** developer
**I want** existing single-schedule projects to work without code changes
**So that** the migration is zero-disruption for current users

**Acceptance Criteria:**
- [ ] All existing API queries continue working without modification
- [ ] Single-schedule projects automatically treated as is_multi_schedule=false
- [ ] UI detects project type and renders appropriate interface
- [ ] Option to convert single-schedule to multi-schedule (copy to schedules table)
- [ ] Rollback capability: Disable multi-schedule via feature flag
- [ ] Component Development Standards: Follow standalone logic principles
- [ ] Zero failing tests after schema migration
- [ ] Document migration strategy in technical-decisions.md

---

#### Story 1.8: Project Validation Engine
**As a** system administrator
**I want** comprehensive validation for multi-schedule projects
**So that** data integrity is maintained and errors prevented

**Acceptance Criteria:**
- [ ] Validate no overlapping date ranges within same project
- [ ] Ensure each date range has associated location
- [ ] Verify working hours are valid (within 24h, end > start)
- [ ] Check crew capacity doesn't exceed requirements for any range
- [ ] Validate location addresses are not empty
- [ ] Show user-friendly error messages with correction suggestions
- [ ] Backend validation (database triggers/constraints)
- [ ] Frontend validation (real-time, pre-submission)

---

#### Story 1.9: Multi-Schedule Search & Filter System
**As a** project manager
**I want** to search projects by location or date range
**So that** I can find all projects at a specific venue or time period

**Acceptance Criteria:**
- [ ] Search by location returns projects with ANY matching location
- [ ] Filter by date range shows projects overlapping the range
- [ ] Display ALL relevant date ranges in search results
- [ ] Add "Project Type" filter: Single-day | Multi-schedule | All
- [ ] Search results show location count and total days
- [ ] Support combined filters (location + date range + status)
- [ ] Performance: Search completes within 200ms
- [ ] Update existing search components to handle multi-schedule data

**Database Optimization:** Add indexes on project_schedules(start_date, end_date, location_id)

---

#### Story 1.10: Multi-Schedule Export System
**As a** project manager
**I want** to export multi-schedule project data with per-location breakdowns
**So that** accounting and reporting are accurate

**Acceptance Criteria:**
- [ ] Export includes all date ranges with locations
- [ ] Per-location, per-date breakdown for crew assignments
- [ ] Compatible with existing payment export system
- [ ] Generate separate sheets/sections per location
- [ ] Include schedule details (working hours, call times, breaks)
- [ ] Calculate totals per location and grand total
- [ ] Support batch export for multiple multi-schedule projects
- [ ] Export format: Excel (.xlsx) with proper formatting

**Integration Point:** Extend existing lib/payment-queue-service.ts

---

## Epic 2: Job Ad Import & Automation

**Epic Goal:** Automate project creation from WhatsApp job advertisements and fix critical calendar editing bugs.

**Priority:** P1 (High - major UX improvement)

### Stories

#### Story 2.1: Job Ad Text Parser Engine
**As a** project manager
**I want** to paste WhatsApp job ad text and auto-extract project details
**So that** I can create projects in under 30 seconds instead of 5-10 minutes

**Acceptance Criteria:**
- [ ] Add "Import from Job Ad" section to project creation form
- [ ] Large textarea for pasting WhatsApp job ad text
- [ ] Parse and extract:
  - Project title (from first line or pay rate line)
  - Multiple date ranges (e.g., "13-16 Oct @ Menara SSM + 27-30 Oct @ SSM Shah Alam")
  - Locations (venue names and addresses)
  - Working hours (e.g., "9am-5pm", "call time 8am")
  - Pay rate (e.g., "RM150/day", "total RM1200")
  - Job requirements (e.g., "Female", "Fluent English", "Energetic")
- [ ] Support common date formats: "13-16 Oct", "Oct 13-16", "13/10 - 16/10"
- [ ] Handle multiple location-date combinations (split by "+", "and", ";")
- [ ] Parsing completes within 3 seconds for typical 200-500 word ads
- [ ] Implement regex-based parser (v1) or LLM-based parser (v2 enhancement)

**Example Input:**
```
RM1200 Female Crew can speak Fluent English
✅Energetic and talkative
📍Date & Location: MUST COMMIT FULL 8 DAYS
• 13 - 16 Oct @ Menara SSM
• 27 - 30 Oct @ SSM Shah Alam
⏰Time: 9am to 5pm (call time 8am)
💰Salary: RM150/day, total RM1200
```

---

#### Story 2.2: Parsed Data Preview & Confirmation
**As a** project manager
**I want** to review and adjust parsed data before creating the project
**So that** I can correct any parsing errors or add missing details

**Acceptance Criteria:**
- [ ] Display parsed data in structured preview card
- [ ] Show confidence score for each extracted field (if LLM-based)
- [ ] Allow inline editing of all fields before project creation
- [ ] Highlight fields that failed to parse (with yellow warning)
- [ ] Provide "Re-parse" button if user edits job ad text
- [ ] Show side-by-side: Original text | Parsed data
- [ ] "Create Project" button only enabled after review
- [ ] Save successful parse patterns for improving parser (optional ML)

---

#### Story 2.3: Calendar Location Editing Bug Fix
**As a** project manager
**I want** consistent location editing for all projects in calendar view
**So that** I can quickly update locations without workarounds

**Acceptance Criteria:**
- [ ] Investigate root cause: Why some projects allow double-click editing, others don't
- [ ] Fix: Standardize double-click behavior across all project types
- [ ] Show visual indicator (cursor change, hover highlight) for editable locations
- [ ] Location editing modal opens consistently for all projects
- [ ] Changes persist immediately to database (standalone component logic)
- [ ] Show success toast notification after location update
- [ ] Test on both single-schedule and multi-schedule projects
- [ ] Document fix in context-awareness-fix.md or similar

**Reference:** ProjectSpotlight component and calendar interaction handlers

---

#### Story 2.4: Parser Error Handling & Fallback
**As a** project manager
**I want** clear error messages when job ad parsing fails
**So that** I can understand what went wrong and fix it

**Acceptance Criteria:**
- [ ] Detect unparseable text and show user-friendly error messages
- [ ] Suggest corrections: "Could not find dates. Try format: '13-16 Oct'"
- [ ] Provide example job ad text format
- [ ] Fall back to manual input if parsing completely fails
- [ ] Allow partial parsing (some fields extracted, others manual)
- [ ] Log parsing failures for improving algorithm
- [ ] Show "Need help?" tooltip with formatting guide
- [ ] Maintain UX principle: Graceful degradation

**Error Handling:** Use try/catch with toast notifications per project standards

---

## Implementation Sequence

### Phase 1: Foundation (Days 1-2)
1. Story 1.1: Database Schema Migration
2. Story 1.7: Backward Compatibility Layer
3. Story 1.8: Project Validation Engine

### Phase 2: Core Multi-Schedule (Days 3-5)
4. Story 1.2: Multiple Date Range Management UI
5. Story 1.3: Multiple Location Management
6. Story 1.4: Flexible Schedule Configuration
7. Story 1.5: Multi-Schedule Calendar Display

### Phase 3: Integration (Days 6-7)
8. Story 1.6: Crew Assignment Across Schedules
9. Story 1.9: Multi-Schedule Search & Filter
10. Story 1.10: Multi-Schedule Export System

### Phase 4: Automation (Days 8-10)
11. Story 2.1: Job Ad Text Parser
12. Story 2.2: Parsed Data Preview
13. Story 2.3: Calendar Location Editing Fix
14. Story 2.4: Parser Error Handling

---

## Risk Mitigation

**Risk: Database migration failure**
- Mitigation: Test on production copy first, implement rollback capability, backup before migration

**Risk: Backward compatibility breaks existing projects**
- Mitigation: Comprehensive testing, feature flags, phased rollout

**Risk: Job ad parsing accuracy < 90%**
- Mitigation: Start with regex parser, iterate based on real-world data, provide manual override

**Risk: Calendar performance degradation with complex projects**
- Mitigation: Database indexes, query optimization, pagination for large datasets

---

## Success Metrics

**Development:**
- All 12-14 stories completed within 2 weeks
- Zero breaking changes to existing functionality
- 80%+ unit test coverage for new code
- All PRD requirements met

**User Impact:**
- Multi-schedule project creation time: <2 minutes (vs. 10+ minutes)
- Job ad import success rate: >90%
- Calendar location editing bug: 100% fixed
- User adoption: 50%+ of new projects use multi-schedule within 2 weeks

---

_This epic breakdown is ready for solutioning workflow to generate technical specifications._
