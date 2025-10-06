# Test Priorities Matrix

## Purpose
Classify test scenarios by priority (P0/P1/P2/P3) to ensure critical functionality is tested first and resources are allocated efficiently.

## Priority Levels Overview

| Priority | Name | Execution | Failure Impact | Examples |
|----------|------|-----------|----------------|----------|
| **P0** | Blocker | Every commit/PR | Blocks release, revenue loss | Payment processing, authentication, data loss prevention |
| **P1** | Critical | Every commit/PR | Major feature broken | Project creation, staff assignment, invoice generation |
| **P2** | Important | Daily/Nightly | Feature degradation | Filtering, search, export formats |
| **P3** | Nice-to-have | Weekly/On-demand | Minor inconvenience | UI polish, tooltips, non-critical notifications |

---

## P0: Blocker (Must Pass Before Release)

### Criteria
- **Revenue Critical**: Directly impacts money flow (payments, invoicing, payroll)
- **Data Integrity**: Risk of data loss, corruption, or security breach
- **Compliance**: Legal/regulatory requirements (audit trails, tax calculations)
- **Authentication/Authorization**: Security gates that protect the system
- **System Stability**: Core functionality that entire app depends on

### When to Assign P0
Ask: *"If this fails, do we lose money, data, or face legal consequences?"*

- ✅ **YES** → P0
- ❌ **NO** → Consider P1 or lower

### Examples from Baito AI

| Feature | Why P0? |
|---------|---------|
| User login/authentication | Security: Unauthorized access = data breach |
| Payroll calculation accuracy | Revenue: Incorrect pay = legal liability + refunds |
| Project creation with mandatory fields | Data integrity: Missing data breaks downstream features |
| Invoice generation with correct totals | Revenue: Wrong amounts = financial losses |
| Staff assignment to projects | Core: Entire business depends on this |
| Database CRUD operations for projects | Data integrity: Loss of project data unacceptable |
| Document upload and retrieval | Data integrity: Lost documents = compliance risk |

### P0 Test Requirements
- ✅ Must have automated tests (unit + integration + E2E)
- ✅ Must pass before merging to main branch
- ✅ Run on every commit in CI/CD pipeline
- ✅ 100% pass rate required for deployment
- ✅ Manual verification for critical paths (e.g., payment flows)

---

## P1: Critical (Core Functionality)

### Criteria
- **Core User Journeys**: Features users need to complete their primary tasks
- **Frequently Used**: Daily/hourly usage by most users
- **Business Impact**: Degrades user experience significantly
- **No Workaround**: Users cannot accomplish task another way

### When to Assign P1
Ask: *"If this fails, can users still complete their main job?"*

- ✅ **NO** → P1
- ❌ **YES** (they can work around it) → P2

### Examples from Baito AI

| Feature | Why P1? |
|---------|---------|
| Edit existing project details | Core: Users need to update projects regularly |
| Add/remove staff from projects | Core: Primary workflow for project management |
| Filter projects by status/date | Core: Users need to find projects quickly |
| View project details | Core: Essential for project management |
| Export project list (basic CSV) | Important: Common reporting need |
| Staff schedule conflict detection | Important: Prevents double-booking errors |
| Document management (add/delete) | Important: Required for project documentation |
| Search functionality for candidates | Core: Essential for finding staff |
| Bulk staff operations | Important: Efficiency for large projects |

### P1 Test Requirements
- ✅ Must have automated tests (unit + integration recommended)
- ✅ Should pass before merging (can proceed with known issues if documented)
- ✅ Run on every commit in CI/CD pipeline
- ✅ 95%+ pass rate required for deployment
- ⚠️ Failures must have mitigation plan

---

## P2: Important (Secondary Features)

### Criteria
- **Nice-to-Have**: Improves efficiency but not required for core tasks
- **Occasional Use**: Used weekly or monthly, not daily
- **Has Workaround**: Users can accomplish task another way
- **Quality of Life**: Makes experience better but not essential

### When to Assign P2
Ask: *"If this fails, will users be annoyed but still productive?"*

- ✅ **YES** (annoyed but functional) → P2
- ❌ **NO** (can't work) → P1

### Examples from Baito AI

| Feature | Why P2? |
|---------|---------|
| Advanced filters (multi-criteria) | Nice-to-have: Basic filters cover most needs |
| Export to Excel with formatting | Nice-to-have: CSV export works as workaround |
| Project color customization | Quality of life: Doesn't affect functionality |
| Bulk import via Excel | Occasional: Most users create projects one by one |
| Staff availability calendar view | Nice-to-have: List view works as alternative |
| Email notifications for updates | Nice-to-have: Users can check dashboard manually |
| Project templates | Efficiency: Users can copy existing projects |
| Advanced reporting dashboards | Occasional: Basic reports cover most needs |
| Drag-and-drop staff assignment | Quality of life: Click/select works fine |

### P2 Test Requirements
- ⚖️ Automated tests recommended (unit preferred, integration optional)
- ⚖️ Can skip for time-sensitive releases (with tech debt ticket)
- ⚖️ Run nightly or before major releases
- ⚖️ 80%+ pass rate acceptable
- ⚠️ Failures logged but don't block deployment

---

## P3: Nice-to-Have (Polish & Edge Cases)

### Criteria
- **Rarely Used**: Features used by < 10% of users or < once/month
- **Cosmetic**: UI polish, animations, tooltips
- **Edge Cases**: Unusual scenarios with minimal impact
- **Admin/Internal Only**: Tools for system administrators

### When to Assign P3
Ask: *"If this never worked, would anyone notice?"*

- ✅ **NO** or "maybe eventually" → P3
- ❌ **YES** → Reconsider P2

### Examples from Baito AI

| Feature | Why P3? |
|---------|---------|
| Tooltip help text | Cosmetic: App is usable without tooltips |
| Loading animation polish | Cosmetic: Basic spinner works fine |
| Project card hover effects | Cosmetic: Visual enhancement only |
| Admin system logs viewer | Admin-only: Rarely accessed |
| Keyboard shortcuts | Rarely used: Most users prefer mouse |
| Dark mode toggle | Nice-to-have: Default theme works for everyone |
| Archived projects view | Rarely used: Active projects are priority |
| Staff profile photo cropping | Edge case: Photo upload works without cropping |
| Project history/audit log (non-compliance) | Rarely used: Only for curiosity, not required |

### P3 Test Requirements
- 🔵 Manual testing acceptable
- 🔵 Automated tests optional (only if trivial to add)
- 🔵 Run on-demand before major releases
- 🔵 Pass rate not tracked
- ⚠️ Failures acceptable; fix when time permits

---

## Priority Assignment Decision Tree

```
START: New Test Scenario
        │
        ▼
Does failure risk money loss, data loss, or legal issues?
        │
   ┌────┴────┐
  YES       NO
   │         │
   ▼         ▼
  P0    Can users complete core tasks without this?
             │
        ┌────┴────┐
       NO        YES
        │         │
        ▼         ▼
       P1    Is there a workaround?
                  │
             ┌────┴────┐
            YES       NO
             │         │
             ▼         ▼
        Is it used    P1
        frequently?
             │
        ┌────┴────┐
       YES       NO
        │         │
        ▼         ▼
       P2        P3
```

---

## Priority Matrix by Feature Category

### Project Management
| Feature | Priority | Reason |
|---------|----------|--------|
| Create project | P0 | Core business function |
| Edit project | P1 | Frequently used |
| Delete project | P1 | Data operation |
| Duplicate project | P2 | Nice-to-have shortcut |
| Archive project | P2 | Rarely used |
| Project color picker | P3 | Cosmetic |

### Staff Management
| Feature | Priority | Reason |
|---------|----------|--------|
| Assign staff to project | P0 | Core business function |
| Update staff status (confirmed/pending) | P1 | Essential workflow |
| Remove staff from project | P1 | Common operation |
| Conflict detection | P1 | Prevents business errors |
| Bulk staff import | P2 | Occasional use |
| Staff profile editing | P2 | Infrequent updates |
| Staff photo upload | P3 | Nice-to-have |

### Financial Operations
| Feature | Priority | Reason |
|---------|----------|--------|
| Calculate payroll | P0 | Revenue critical |
| Generate invoice | P0 | Revenue critical |
| Export invoice PDF | P1 | Required for billing |
| Payment tracking | P1 | Financial visibility |
| Budget vs actual reports | P2 | Analysis tool |
| Custom invoice templates | P3 | Rarely customized |

### Documents & Exports
| Feature | Priority | Reason |
|---------|----------|--------|
| Upload project documents | P0 | Compliance requirement |
| Download documents | P1 | Frequently needed |
| Export project CSV | P1 | Common reporting |
| Export Excel with formatting | P2 | Nice-to-have |
| Bulk document operations | P2 | Occasional use |
| Document version history | P3 | Rarely needed |

---

## Testing Resource Allocation

Based on priorities, allocate testing effort:

```
┌─────────────────────────────────────────────┐
│ Testing Time Budget                         │
├─────────────────────────────────────────────┤
│ P0: 50% of testing effort                   │
│ P1: 30% of testing effort                   │
│ P2: 15% of testing effort                   │
│ P3: 5% of testing effort (or skip)          │
└─────────────────────────────────────────────┘
```

### Example Sprint Allocation
**Total testing capacity**: 40 hours

- **P0 tests**: 20 hours
  - Write comprehensive unit + integration + E2E
  - Manual verification of critical paths
  - Performance testing for bottlenecks

- **P1 tests**: 12 hours
  - Unit + integration tests
  - Selective E2E for key journeys

- **P2 tests**: 6 hours
  - Unit tests for core logic
  - Manual testing for UI features

- **P3 tests**: 2 hours
  - Manual spot-checking only
  - Automated only if trivial to add

---

## Red Flags: When You've Assigned Wrong Priority

### ⚠️ Too Many P0s
**Problem**: Everything is P0
**Fix**: Only true blockers are P0. Ask: "Would we delay release for this?"

### ⚠️ No P0s
**Problem**: Nothing critical identified
**Fix**: Every feature has critical paths. Find them.

### ⚠️ All P3s
**Problem**: Under-prioritizing quality
**Fix**: Core workflows deserve automated tests.

### ⚠️ Skipping P0 E2E Tests
**Problem**: P0 features with only unit tests
**Fix**: Critical paths need end-to-end validation.

---

## Review Checklist

Before finalizing priorities, verify:

- [ ] All revenue-impacting features are P0
- [ ] All data integrity operations are P0 or P1
- [ ] Core user journeys have P0/P1 coverage
- [ ] P3 items are truly optional
- [ ] Priority distribution is reasonable (~20% P0, ~40% P1, ~30% P2, ~10% P3)
- [ ] Each P0 has E2E test coverage
- [ ] Test effort aligns with priority levels

---

## Framework Version
**Version:** 1.0
**Last Updated:** 2025-10-04
**Owner:** Quinn (Test Architect)
