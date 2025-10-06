# Manual Testing Guide - Simple Language Fixes

## Quick Testing Session (15 minutes)

### Prerequisites
1. Open http://localhost:5173 in your browser
2. Login with test user credentials
3. Open the AI chatbot widget (bottom right corner)
4. Have this guide open side-by-side

---

## Test Set 1: Bug #1 - Vehicle Filter ✅

### Test 1.1: "Who has a car?"
**What to type:** `Who has a car?`

**Expected behavior:**
- ✅ AI should use `query_candidates` with `has_vehicle: true`
- ✅ AI should show list of candidates who have vehicles
- ✅ AI should mention how many candidates have cars

**How to verify:**
- Check if AI mentions specific candidate names
- Look for vehicle information in response
- AI should NOT ask "What do you mean by car?"

**Pass/Fail:** ⬜

---

### Test 1.2: "Do you know anyone with a vehicle?"
**What to type:** `Do you know anyone with a vehicle?`

**Expected behavior:**
- ✅ AI should understand this means the same as "who has a car?"
- ✅ AI should use `query_candidates` with `has_vehicle: true`
- ✅ Should return same results as Test 1.1

**Pass/Fail:** ⬜

---

## Test Set 2: Bug #2 - Date Logic ✅

### Test 2.1: "What's happening this month?"
**What to type:** `What's happening this month?`

**Expected behavior:**
- ✅ AI should use `query_projects` with `active_on_date: "2025-10-03"` (today's date)
- ✅ AI should show projects that are ACTIVE TODAY (not just starting in October)
- ✅ Should include MrDIY project (Sept 30 - Oct 4) if it exists
- ✅ AI should clarify "Here are today's active projects" or similar

**Pass/Fail:** ⬜

---

### Test 2.2: "Show me events today"
**What to type:** `Show me events today`

**Expected behavior:**
- ✅ AI should use `active_on_date` with today's date
- ✅ Should show same results as Test 2.1
- ✅ Should include ongoing projects, not just those starting today

**Pass/Fail:** ⬜

---

### Test 2.3: "What's starting this month?"
**What to type:** `What's starting this month?`

**Expected behavior:**
- ✅ AI should use `date_from: "2025-10-01"` and `date_to: "2025-10-31"`
- ✅ Should show projects with START DATE in October
- ✅ Should NOT include MrDIY project (started Sept 30)
- ✅ Results different from Test 2.1

**Pass/Fail:** ⬜

---

## Test Set 3: Bug #3 - Skills Filter ✅

### Test 3.1: "Show me people with forklift skills"
**What to type:** `Show me people with forklift skills`

**Expected behavior:**
- ✅ AI should use `query_candidates` with `skills: ["forklift"]`
- ✅ AI should show candidates who have "forklift" in their skills array
- ✅ AI should mention specific candidate names
- ✅ AI should NOT say "I don't have a skills filter"

**Pass/Fail:** ⬜

---

### Test 3.2: "Who knows how to drive a forklift?"
**What to type:** `Who knows how to drive a forklift?`

**Expected behavior:**
- ✅ AI should understand this is a skills query
- ✅ AI should search for "forklift" in skills
- ✅ Should return same candidates as Test 3.1

**Pass/Fail:** ⬜

---

## Test Set 4: Bug #4 - Understaffed Filter ✅

### Test 4.1: "Which projects need more staff?"
**What to type:** `Which projects need more staff?`

**Expected behavior:**
- ✅ AI should use `query_projects` with `understaffed: true`
- ✅ AI should show projects where `filled_positions < crew_count`
- ✅ AI should mention how many positions each project still needs
- ✅ AI should NOT use `check_scheduling_conflicts` (too complex)

**Pass/Fail:** ⬜

---

### Test 4.2: "Show me understaffed projects"
**What to type:** `Show me understaffed projects`

**Expected behavior:**
- ✅ AI should use `understaffed: true` parameter
- ✅ Should show same projects as Test 4.1
- ✅ Clear indication of staffing gaps

**Pass/Fail:** ⬜

---

### Test 4.3: "What jobs don't have enough people?"
**What to type:** `What jobs don't have enough people?`

**Expected behavior:**
- ✅ AI should understand "jobs" = "projects"
- ✅ AI should understand "don't have enough people" = "understaffed"
- ✅ Should use `understaffed: true` parameter
- ✅ Should show same results as Test 4.1

**Pass/Fail:** ⬜

---

## Remaining Category 1 Tests

### Test 1.10: Project Details
**What to type:** `Tell me about the MrDIY project` (or any specific project name you know)

**Expected behavior:**
- ✅ AI should use `query_projects` with company_name or specific search
- ✅ Should show detailed project information
- ✅ Should include dates, location, staffing, etc.

**Pass/Fail:** ⬜

---

### Test 1.12: Revenue Last Month
**What to type:** `What was revenue last month?`

**Expected behavior:**
- ✅ AI should use `calculate_revenue` with `period: "last_month"`
- ✅ Should show total revenue calculation
- ✅ Should mention the month being calculated (September 2025)

**Pass/Fail:** ⬜

---

### Test 1.13: High Priority Projects
**What to type:** `Show me high priority projects`

**Expected behavior:**
- ✅ AI should use `query_projects` with `priority: "high"`
- ✅ Should filter and show only high priority projects
- ✅ Should mention how many high priority projects exist

**Pass/Fail:** ⬜

---

### Test 1.15: Available Next Friday
**What to type:** `Who is available next Friday?`

**Expected behavior:**
- ✅ AI should calculate next Friday's date from today (Oct 3 → Oct 10)
- ✅ AI should use `query_candidates` with `available_date: "2025-10-10"`
- ✅ Should show candidates NOT assigned to projects on that date
- ✅ Should mention the calculated date

**Pass/Fail:** ⬜

---

## Summary

**Bug Fix Tests (10 tests):**
- Bug #1 (Vehicle): ⬜ ⬜ (2 tests)
- Bug #2 (Date Logic): ⬜ ⬜ ⬜ (3 tests)
- Bug #3 (Skills): ⬜ ⬜ (2 tests)
- Bug #4 (Understaffed): ⬜ ⬜ ⬜ (3 tests)

**Category 1 Remaining (4 tests):**
- 1.10 Project Details: ⬜
- 1.12 Revenue Last Month: ⬜
- 1.13 High Priority: ⬜
- 1.15 Available Next Friday: ⬜

**Total Tests: 14**
**Passed: ___ / 14**
**Failed: ___ / 14**

---

## Notes

Record any issues here:

---

## After Testing

1. Update `AI_CHATBOT_100_TEST_SCENARIOS.md` with results
2. Update `AI_CHATBOT_TEST_REPORT_2025_10_03.md` with findings
3. Calculate new intelligence score
4. Report any failures for immediate fixes

---

**Testing Date:** __________
**Tester:** __________
**Time Taken:** __________
**Intelligence Score (if all pass):** 85/100 (Grade A-)
