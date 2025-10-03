# AI Chatbot Comprehensive Test Suite
**Version:** 2.0
**Date:** October 3, 2025
**QA Lead:** Quinn (Test Architect)
**Total Tests:** 60 scenarios

---

## Test Execution Guide

### How to Run Tests
1. Start dev server: `npm run dev`
2. Open browser to `http://localhost:5173`
3. Open AI Chat widget (Cmd+K or click chat icon)
4. For each test below, paste the query and record:
   - ✅ **PASS**: Got expected result
   - ⚠️ **PARTIAL**: Got result but with issues
   - ❌ **FAIL**: Wrong result or error
   - 🚫 **NOT_IMPLEMENTED**: Feature doesn't exist

---

## Category 1: Basic Data Retrieval (10 tests)
**Purpose:** Test simple database queries

### Test 1.1: Project Count
```
Query: "How many projects do we have?"
Expected: Returns total count of projects
Status: [ ]
Notes:
```

### Test 1.2: Active Projects
```
Query: "Show me all active projects"
Expected: Returns list of projects with status='active'
Status: [ ]
Notes:
```

### Test 1.3: Completed Projects
```
Query: "List completed projects"
Expected: Returns projects with status='completed'
Status: [ ]
Notes:
```

### Test 1.4: All Candidates
```
Query: "Show me all candidates"
Expected: Returns list of candidates with full_name, phone_number, status
Status: [ ]
Notes:
```

### Test 1.5: Active Candidates
```
Query: "List all active candidates"
Expected: Returns candidates with status='active'
Status: [ ]
Notes:
```

### Test 1.6: Today's Projects
```
Query: "What projects are scheduled for today?"
Expected: Returns projects where start_date = today
Status: [ ]
Notes:
```

### Test 1.7: This Week's Projects
```
Query: "Show me projects for this week"
Expected: Returns projects in current week date range
Status: [ ]
Notes:
```

### Test 1.8: Project by ID
```
Query: "Show me details of project [actual-uuid-from-db]"
Expected: Returns full project details including staff
Status: [ ]
Notes:
```

### Test 1.9: Candidate by Name
```
Query: "Find candidate John Doe"
Expected: Returns candidate matching name
Status: [ ]
Notes:
```

### Test 1.10: Total Revenue
```
Query: "What's our total revenue?"
Expected: Sums budget from completed projects
Status: [ ]
Notes:
```

---

## Category 2: Complex Filtering & Joins (10 tests)
**Purpose:** Test multi-condition queries and relationships

### Test 2.1: Projects by Date Range
```
Query: "Show me projects from October 1st to October 15th"
Expected: Returns projects where start_date between dates
Status: [ ]
Notes:
```

### Test 2.2: Understaffed Projects
```
Query: "Which projects need more staff?"
Expected: Returns projects where filled_positions < crew_count
Status: [ ]
Notes:
```

### Test 2.3: Fully Staffed Projects
```
Query: "Show me fully staffed projects"
Expected: Returns projects where filled_positions >= crew_count
Status: [ ]
Notes:
```

### Test 2.4: Candidates with Vehicles
```
Query: "Which candidates have their own vehicle?"
Expected: Returns candidates where has_vehicle = true
Status: [ ]
Notes:
```

### Test 2.5: High Priority Projects
```
Query: "Show me all high priority projects"
Expected: Returns projects where priority = 'high'
Status: [ ]
Notes:
```

### Test 2.6: Projects by Location
```
Query: "Find projects at downtown warehouse"
Expected: Returns projects matching venue_address
Status: [ ]
Notes:
```

### Test 2.7: Morning Shift Projects
```
Query: "What projects start before 10 AM?"
Expected: Returns projects where working_hours_start < '10:00'
Status: [ ]
Notes:
```

### Test 2.8: Large Projects
```
Query: "Show me projects that need 10 or more people"
Expected: Returns projects where crew_count >= 10
Status: [ ]
Notes:
```

### Test 2.9: Projects by Company
```
Query: "Show me all projects for ABC Corp"
Expected: Returns projects where brand_name or client matches
Status: [ ]
Notes:
```

### Test 2.10: Weekend Projects
```
Query: "Are there any projects scheduled for this weekend?"
Expected: Returns Saturday/Sunday projects
Status: [ ]
Notes:
```

---

## Category 3: Multi-Step Reasoning (10 tests)
**Purpose:** Test AI's ability to chain multiple operations

### Test 3.1: Find and Assign
```
Query: "Find available candidates and assign them to tomorrow's warehouse project"
Expected:
1. Queries available candidates
2. Identifies tomorrow's warehouse project
3. Asks for confirmation before assigning
Status: [ ]
Notes:
```

### Test 3.2: Create and Staff
```
Query: "Create a new project for Friday and assign 5 warehouse workers"
Expected:
1. Creates project
2. Searches for warehouse workers
3. Assigns staff
Status: [ ]
Notes:
```

### Test 3.3: Compare Revenue
```
Query: "Compare this month's revenue with last month"
Expected:
1. Calculates this month's revenue
2. Calculates last month's revenue
3. Shows comparison with percentage change
Status: [ ]
Notes:
```

### Test 3.4: Conflict Detection and Resolution
```
Query: "Check for scheduling conflicts and suggest solutions"
Expected:
1. Identifies conflicts
2. Proposes candidate reassignments
3. Shows alternative options
Status: [ ]
Notes:
```

### Test 3.5: Find Busiest Day
```
Query: "Which day has the most projects this month?"
Expected:
1. Groups projects by date
2. Counts projects per day
3. Returns day with max count
Status: [ ]
Notes:
```

### Test 3.6: Staff Utilization
```
Query: "Which candidates have worked the most days this month?"
Expected:
1. Counts assignments per candidate
2. Ranks by frequency
3. Shows top performers
Status: [ ]
Notes:
```

### Test 3.7: Fill Gaps
```
Query: "Fill all understaffed projects with available candidates"
Expected:
1. Finds understaffed projects
2. Finds available candidates
3. Matches candidates to projects
4. Requests confirmation
Status: [ ]
Notes:
```

### Test 3.8: Revenue Forecast
```
Query: "If all active projects complete, what will be our total revenue?"
Expected:
1. Sums budgets from active projects
2. Adds to completed project revenue
3. Shows projected total
Status: [ ]
Notes:
```

### Test 3.9: Candidate Performance Analysis
```
Query: "Show me candidates who have worked on multiple projects"
Expected:
1. Joins candidates with project_staff
2. Groups by candidate
3. Filters by count > 1
4. Shows list with project count
Status: [ ]
Notes:
```

### Test 3.10: Weekly Planning
```
Query: "Plan next week's staffing by showing all projects and their staffing status"
Expected:
1. Gets next week's projects
2. Checks staffing for each
3. Highlights gaps
4. Suggests actions
Status: [ ]
Notes:
```

---

## Category 4: Context Awareness (10 tests)
**Purpose:** Test AI's ability to remember conversation context

### Test 4.1: Follow-up Filter
```
Sequence:
1. "Show me all projects"
2. "Filter by active status"
3. "Sort by date"
Expected: Each query builds on previous results
Status: [ ]
Notes:
```

### Test 4.2: Pronoun Resolution
```
Sequence:
1. "Show me project ABC123"
2. "Who is assigned to it?"
3. "When does it start?"
Expected: "it" refers to project ABC123
Status: [ ]
Notes:
```

### Test 4.3: Implicit Entity
```
Sequence:
1. "Find candidate John Doe"
2. "What projects has he worked on?"
3. "Is he available tomorrow?"
Expected: "he" refers to John Doe
Status: [ ]
Notes:
```

### Test 4.4: Conversation Threading
```
Sequence:
1. "Show me revenue this month"
2. "Break it down by project"
3. "Which project made the most?"
Expected: Context carries through 3 queries
Status: [ ]
Notes:
```

### Test 4.5: Clarification Request
```
Query: "Show me the project"
Expected: AI asks "Which project?" because there are multiple
Status: [ ]
Notes:
```

### Test 4.6: Ambiguity Resolution
```
Sequence:
1. "Show me candidates"
2. "Assign them to the project"
Expected: AI asks which project or uses recent context
Status: [ ]
Notes:
```

### Test 4.7: Multi-Turn Planning
```
Sequence:
1. "I need to staff a warehouse project"
2. "It's on Friday morning"
3. "Need 8 people"
4. "Find suitable candidates"
Expected: AI accumulates requirements across turns
Status: [ ]
Notes:
```

### Test 4.8: Reference to Previous Result
```
Sequence:
1. "Show me active projects"
2. "How many are there?"
Expected: "how many" refers to previous result count
Status: [ ]
Notes:
```

### Test 4.9: Continuation Query
```
Sequence:
1. "Show me first 5 projects"
2. "Show me 5 more"
Expected: Pagination continues from previous query
Status: [ ]
Notes:
```

### Test 4.10: Conversation Reset
```
Sequence:
1. "Show me projects"
2. "Now forget that and show me candidates"
Expected: AI clears context and starts fresh
Status: [ ]
Notes:
```

---

## Category 5: Data Analysis & Insights (10 tests)
**Purpose:** Test AI's analytical and reasoning capabilities

### Test 5.1: Revenue Trend
```
Query: "Show me revenue trend for the last 3 months"
Expected:
- Groups revenue by month
- Shows comparison
- Identifies trend (increasing/decreasing)
Status: [ ]
Notes:
```

### Test 5.2: Staffing Efficiency
```
Query: "Calculate average staffing fill rate this month"
Expected:
- Calculates filled_positions / crew_count for each project
- Averages across all projects
- Shows percentage
Status: [ ]
Notes:
```

### Test 5.3: Candidate Availability Rate
```
Query: "What percentage of candidates are currently active?"
Expected:
- Counts active candidates
- Counts total candidates
- Calculates percentage
Status: [ ]
Notes:
```

### Test 5.4: Project Duration Analysis
```
Query: "What's the average project duration?"
Expected:
- Calculates end_date - start_date for each project
- Averages durations
- Shows in days
Status: [ ]
Notes:
```

### Test 5.5: Peak Hours Analysis
```
Query: "What are the most common working hours for projects?"
Expected:
- Groups by working_hours_start and working_hours_end
- Counts frequency
- Shows top time slots
Status: [ ]
Notes:
```

### Test 5.6: Geographic Distribution
```
Query: "Which locations have the most projects?"
Expected:
- Groups by venue_address
- Counts projects per location
- Ranks by frequency
Status: [ ]
Notes:
```

### Test 5.7: Candidate Workload Balance
```
Query: "Are any candidates overbooked or underutilized?"
Expected:
- Counts assignments per candidate
- Identifies outliers (too many or too few)
- Suggests rebalancing
Status: [ ]
Notes:
```

### Test 5.8: Project Success Rate
```
Query: "What percentage of projects complete successfully?"
Expected:
- Counts completed vs cancelled
- Calculates completion rate
- Shows percentage
Status: [ ]
Notes:
```

### Test 5.9: Financial Forecast
```
Query: "Based on current pace, what's our projected monthly revenue?"
Expected:
- Analyzes completed projects per month
- Averages revenue
- Projects forward
Status: [ ]
Notes:
```

### Test 5.10: Bottleneck Identification
```
Query: "What factors cause project delays or cancellations?"
Expected:
- Analyzes cancelled/delayed projects
- Identifies common patterns (understaffing, location, etc.)
- Provides insights
Status: [ ]
Notes:
```

---

## Category 6: Error Handling & Edge Cases (10 tests)
**Purpose:** Test AI's robustness and error recovery

### Test 6.1: Invalid Date Format
```
Query: "Show me projects on 32nd October"
Expected: AI recognizes invalid date and asks for correction
Status: [ ]
Notes:
```

### Test 6.2: Non-existent Entity
```
Query: "Show me project with ID 00000000-0000-0000-0000-000000000000"
Expected: AI returns "No project found with that ID"
Status: [ ]
Notes:
```

### Test 6.3: Ambiguous Query
```
Query: "Show me stuff"
Expected: AI asks for clarification on what "stuff" means
Status: [ ]
Notes:
```

### Test 6.4: Typo Handling
```
Query: "Sho me projcts"
Expected: AI corrects typo and understands "Show me projects"
Status: [ ]
Notes:
```

### Test 6.5: Empty Result
```
Query: "Show me projects scheduled for year 2099"
Expected: AI returns "No projects found for that date range"
Status: [ ]
Notes:
```

### Test 6.6: Permission Denied
```
Query: "Delete all projects"
Expected: AI refuses and explains permission requirements
Status: [ ]
Notes:
```

### Test 6.7: Very Long Query
```
Query: [500 character query with multiple nested conditions]
Expected: AI processes or asks to break into smaller queries
Status: [ ]
Notes:
```

### Test 6.8: Special Characters
```
Query: "Find project with name: ABC & Co. (2024) - Test #1"
Expected: AI handles special characters correctly
Status: [ ]
Notes:
```

### Test 6.9: SQL Injection Attempt
```
Query: "Show projects WHERE 1=1; DROP TABLE projects;"
Expected: AI blocks malicious input and logs security event
Status: [ ]
Notes:
```

### Test 6.10: Rapid Fire Queries
```
Action: Send 20 queries in 10 seconds
Expected: AI handles rate limiting gracefully
Status: [ ]
Notes:
```

---

## Category 7: Intelligence & Reasoning (Bonus 10 tests)
**Purpose:** Test true agentic intelligence

### Test 7.1: Proactive Suggestion
```
Query: "Show me tomorrow's projects"
Expected: AI also mentions "3 projects are understaffed, would you like to fill them?"
Status: [ ]
Notes:
```

### Test 7.2: Alternative Proposal
```
Query: "Assign John to tomorrow's project"
Context: John is already booked
Expected: AI suggests alternative candidates
Status: [ ]
Notes:
```

### Test 7.3: Efficiency Optimization
```
Query: "Staff all Friday projects"
Expected: AI suggests optimal assignment to minimize travel/maximize skills
Status: [ ]
Notes:
```

### Test 7.4: Cost Optimization
```
Query: "How can we reduce project costs?"
Expected: AI analyzes data and suggests actionable improvements
Status: [ ]
Notes:
```

### Test 7.5: Risk Detection
```
Query: "Are there any risks in next week's schedule?"
Expected: AI identifies conflicts, gaps, or issues
Status: [ ]
Notes:
```

### Test 7.6: Explanation Request
```
Query: "Why did you recommend John for this project?"
Expected: AI explains reasoning (skills match, availability, past performance)
Status: [ ]
Notes:
```

### Test 7.7: What-If Scenario
```
Query: "What if we cancel Project ABC? How does that affect staffing?"
Expected: AI simulates scenario and shows impact
Status: [ ]
Notes:
```

### Test 7.8: Learning from Feedback
```
Sequence:
1. AI suggests Candidate A
2. User: "Not A, they're unreliable"
3. Next time AI should avoid suggesting A
Expected: AI remembers preference
Status: [ ]
Notes:
```

### Test 7.9: Complex Problem Solving
```
Query: "We lost 3 staff members. Reschedule next week's projects to accommodate."
Expected:
1. Identifies affected projects
2. Proposes rescheduling options
3. Checks for new conflicts
4. Presents solution
Status: [ ]
Notes:
```

### Test 7.10: Creative Solution
```
Query: "We need 15 warehouse workers but only have 10 available"
Expected: AI suggests creative solutions (split shifts, hire temp staff, delay projects, etc.)
Status: [ ]
Notes:
```

---

## Test Results Summary

### Execution Tracking
- **Total Tests:** 70
- **Passed:** 0
- **Partial:** 0
- **Failed:** 0
- **Not Implemented:** 0
- **Success Rate:** 0%

### Category Scores
| Category | Tests | Passed | Success Rate |
|----------|-------|--------|--------------|
| Basic Data Retrieval | 10 | 0 | 0% |
| Complex Filtering | 10 | 0 | 0% |
| Multi-Step Reasoning | 10 | 0 | 0% |
| Context Awareness | 10 | 0 | 0% |
| Data Analysis | 10 | 0 | 0% |
| Error Handling | 10 | 0 | 0% |
| Intelligence & Reasoning | 10 | 0 | 0% |
| **TOTAL** | **70** | **0** | **0%** |

### Target Success Rates
- **MVP (Phase 1):** 50% (35/70 tests)
- **Enhanced (Phase 2):** 75% (52/70 tests)
- **Full Agentic (Phase 3):** 90% (63/70 tests)

---

## Intelligence Score Breakdown

### Intelligence Dimensions
Rate each dimension 1-10:

1. **Data Retrieval** [ /10] - Can find and return correct data
2. **Query Understanding** [ /10] - Interprets natural language accurately
3. **Multi-Step Reasoning** [ /10] - Chains multiple operations logically
4. **Context Awareness** [ /10] - Remembers conversation history
5. **Analytical Thinking** [ /10] - Derives insights from data
6. **Error Recovery** [ /10] - Handles errors gracefully
7. **Proactive Intelligence** [ /10] - Suggests without being asked
8. **Learning Ability** [ /10] - Improves from feedback
9. **Creative Problem Solving** [ /10] - Proposes innovative solutions
10. **User Empathy** [ /10] - Understands user intent and needs

**Overall Intelligence Score:** [ /100]

### Intelligence Baseline (Current State)
Based on code analysis:
- Data Retrieval: 3/10 (schema bugs, limited queries)
- Query Understanding: 5/10 (basic NLU works)
- Multi-Step Reasoning: 1/10 (ReAct loop exists but limited tools)
- Context Awareness: 2/10 (no conversation memory)
- Analytical Thinking: 2/10 (basic aggregation only)
- Error Recovery: 3/10 (catches errors but doesn't recover well)
- Proactive Intelligence: 1/10 (no proactive features)
- Learning Ability: 0/10 (no learning mechanism)
- Creative Problem Solving: 0/10 (follows strict tool patterns)
- User Empathy: 4/10 (polite but generic responses)

**Current Intelligence Score: 21/100** ⚠️ NEEDS SIGNIFICANT IMPROVEMENT

### Target Intelligence Scores
- **MVP:** 50/100 (Functional assistant)
- **Enhanced:** 70/100 (Smart assistant)
- **Full Agentic:** 85/100 (Intelligent agent)

---

## Critical Findings (Pre-Test)

### HIGH PRIORITY FIXES REQUIRED
1. ❌ **Schema Bugs**: Using wrong column names (`name` vs `full_name`)
2. ❌ **Unimplemented Features**: Scheduling conflicts returns empty
3. ❌ **Missing Date Filters**: Revenue calculation ignores date ranges
4. ❌ **No Multi-Tool Chaining**: Can't perform multi-step operations
5. ❌ **No Context Memory**: Forgets previous queries immediately

### MEDIUM PRIORITY ENHANCEMENTS
6. ⚠️ **Limited Tools**: Only 5 tools (need 15-20 for full functionality)
7. ⚠️ **No Proactive Suggestions**: Doesn't anticipate user needs
8. ⚠️ **Generic Responses**: Doesn't explain reasoning
9. ⚠️ **No Learning**: Can't adapt to user preferences
10. ⚠️ **Basic Analytics**: Can't derive insights from data

---

## Test Execution Instructions

### For QA Agent (Quinn):
```bash
# 1. Start dev server
npm run dev

# 2. Open browser with Chrome DevTools MCP
# Use mcp__chrome-devtools tools to:
# - navigate_page to http://localhost:5173
# - take_snapshot to see page structure
# - click on chat widget
# - fill chat input with test query
# - wait_for response
# - take_snapshot of response
# - record result

# 3. For each test:
#    - Execute query
#    - Capture response
#    - Evaluate against expected result
#    - Mark status (✅⚠️❌🚫)
#    - Document findings
```

### For Dev Agent (James):
After QA results:
1. Read this test report
2. Prioritize fixes by:
   - HIGH: Broken functionality (Tests marked ❌)
   - MEDIUM: Partial functionality (Tests marked ⚠️)
   - LOW: Missing features (Tests marked 🚫)
3. Implement fixes in order
4. Re-run tests after each fix
5. Target 80%+ success rate

---

## Next Steps

1. ✅ Test suite created (70 comprehensive scenarios)
2. ⏳ Execute tests with Chrome DevTools MCP
3. ⏳ Document results with confidence scores
4. ⏳ Hand off to Dev agent with prioritized fix list
5. ⏳ Dev implements fixes
6. ⏳ Re-run tests to validate improvements
7. ⏳ Repeat until 80%+ success rate achieved

---

**Last Updated:** October 3, 2025
**Next Review:** After test execution
**QA Sign-off:** [ ] Quinn (Test Architect)
