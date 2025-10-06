# Batch Test Runner - 100 Test Scenarios

## Testing Strategy

We'll test in **batches** using simple language approach:
1. Test Category 1 remaining (1.8-1.15) - 8 tests
2. Test Category 2 (2.1-2.15) - 15 tests
3. Test Category 3 (3.1-3.10) - 10 tests
4. Test Category 4 remaining (4.4-4.15) - 12 tests
5. Test Category 5 (5.1-5.10) - 10 tests
6. Test Category 6 (6.1-6.12) - 12 tests
7. Test Category 7 (7.1-7.13) - 13 tests

**Total Remaining: 80 tests**

---

## Current Testing Session - Category 1 Remaining (Tests 1.8-1.15)

### Test 1.8: ✅ FIXED - Projects by Date Range
**Simple Query:** "What's starting this month?"
**AI Should:**
- Use `query_projects` with `date_from: "2025-10-01"`, `date_to: "2025-10-31"`
- Show projects with START DATE in October
- **Status:** Bug fixed, needs verification

---

### Test 1.9: ✅ FIXED - Candidates with Vehicles
**Simple Query:** "Who has a car?"
**AI Should:**
- Use `query_candidates` with `has_vehicle: true`
- Show candidates with vehicles
- **Status:** Bug fixed, needs verification

---

### Test 1.10: ⏳ Project Details
**Simple Query:** "Tell me about the MrDIY project"
**AI Should:**
- Use `query_projects` with `company_name: "MrDIY"`
- Show detailed project information
- Include dates, location, staffing numbers
- **Status:** Ready to test

---

### Test 1.11: ✅ FIXED - Candidate Skills
**Simple Query:** "Show me people with forklift skills"
**AI Should:**
- Use `query_candidates` with `skills: ["forklift"]`
- Show candidates with forklift in skills array
- **Status:** Bug fixed, needs verification

---

### Test 1.12: ⏳ Revenue by Date Range
**Simple Query:** "What was revenue last month?"
**AI Should:**
- Use `calculate_revenue` with `period: "last_month"`
- Calculate and show total revenue for September 2025
- Mention the month being calculated
- **Status:** Ready to test

---

### Test 1.13: ⏳ High Priority Projects
**Simple Query:** "Show me high priority projects"
**AI Should:**
- Use `query_projects` with `priority: "high"`
- Filter and show only high priority projects
- Mention count of high priority projects
- **Status:** Ready to test

---

### Test 1.14: ✅ FIXED - Understaffed Projects
**Simple Query:** "Which projects need more staff?"
**AI Should:**
- Use `query_projects` with `understaffed: true`
- Show projects where filled_positions < crew_count
- Mention staffing gaps
- **Status:** Bug fixed, needs verification

---

### Test 1.15: ⏳ Available Candidates for Date
**Simple Query:** "Who is available next Friday?"
**AI Should:**
- Calculate next Friday = October 10, 2025
- Use `query_candidates` with `available_date: "2025-10-10"`
- Show candidates NOT assigned on that date
- Mention the calculated date
- **Status:** Ready to test

---

## Testing Checklist - Category 1 (Tests 1.8-1.15)

| Test | Query | Expected Tool | Status | Result |
|------|-------|---------------|--------|--------|
| 1.8 | "What's starting this month?" | query_projects (date_from/to) | ✅ Fixed | ⬜ |
| 1.9 | "Who has a car?" | query_candidates (has_vehicle) | ✅ Fixed | ⬜ |
| 1.10 | "Tell me about MrDIY project" | query_projects (company_name) | ⏳ Test | ⬜ |
| 1.11 | "Show me forklift operators" | query_candidates (skills) | ✅ Fixed | ⬜ |
| 1.12 | "What was revenue last month?" | calculate_revenue (last_month) | ⏳ Test | ⬜ |
| 1.13 | "Show me high priority projects" | query_projects (priority: high) | ⏳ Test | ⬜ |
| 1.14 | "Which projects need more staff?" | query_projects (understaffed) | ✅ Fixed | ⬜ |
| 1.15 | "Who is available next Friday?" | query_candidates (available_date) | ⏳ Test | ⬜ |

---

## How to Test

### Method 1: Manual Testing (Recommended for now)
1. Open http://localhost:5173
2. Login with your account
3. Open AI chatbot widget
4. For each test:
   - Type the simple query exactly as shown
   - Observe AI response
   - Check if correct tool was used
   - Mark ✅ PASS or ❌ FAIL in Result column
   - Note any issues

### Method 2: Automated Testing (Requires auth setup)
```bash
# First, need to set up test user credentials
# Then run:
node test-simple-language.js
```

---

## Test Results Recording

After each test, record:
- ✅ **PASS** - AI used correct tool with correct parameters
- ❌ **FAIL** - AI used wrong tool or wrong parameters
- ⚠️ **PARTIAL** - AI used correct tool but parameters incomplete
- ⏭️ **SKIP** - Test skipped (blocked or not applicable)

### Example Recording:
```
Test 1.10: "Tell me about MrDIY project"
Result: ✅ PASS
Tool Used: query_projects({ company_name: "MrDIY" })
Response: Showed 2 MrDIY projects with details
Notes: Fuzzy search worked correctly
```

---

## After Category 1 Complete

### Calculate Category 1 Score
- Total Tests: 15
- Passed: ___ / 15
- Category Score: ____%

### Update Intelligence Score
Current projected: 85/100 (with 4 bug fixes)
- If all Category 1 passes: Maintain 85/100
- If any failures: Identify bugs and fix immediately

### Proceed to Category 2
Move to next batch: Category 2 - Complex Filtering (15 tests)

---

## Progress Tracking

**Overall Progress:**
- Category 1: 7/15 completed ✅ (46.7%)
- Category 2: 0/15 (0%)
- Category 3: 0/10 (0%)
- Category 4: 3/15 completed ✅ (20%)
- Category 5: 0/10 (0%)
- Category 6: 0/12 (0%)
- Category 7: 0/13 (0%)

**Total: 10/100 tests completed (10%)**
**Target: 90/100 for production (90%)**

---

## Next Testing Session

After completing Category 1 (1.8-1.15):

### Category 2: Complex Filtering & Multi-Criteria (15 tests)
Preview of first 3 tests:
- 2.1: "Show active high-priority projects starting this month"
- 2.2: "Find candidates with forklift AND warehouse who have vehicles"
- 2.3: "What's revenue from completed vs active projects?"

### Estimated Time
- Category 1 remaining: 15 minutes (8 tests)
- Category 2: 30 minutes (15 tests)
- Category 3: 20 minutes (10 tests)
- **Total today:** ~65 minutes (33 tests)

---

**Current Session:** Category 1.8-1.15
**Start Time:** __________
**Expected Completion:** 15 minutes
**Status:** Ready to begin testing 🚀
