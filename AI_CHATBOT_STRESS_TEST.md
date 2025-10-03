# AI Chatbot Stress Test & Fix List
**Date**: October 3, 2025
**Status**: In Progress

## Test Scenarios & Results

### ✅ WORKING Queries

#### 1. General Project Queries
- **Query**: "How many projects do we have today?"
- **Status**: ✅ WORKS
- **Response**: AI successfully queries projects table with date filter

#### 2. Project by Status
- **Query**: "Show me all active projects"
- **Status**: ✅ WORKS
- **Response**: AI filters by status='active'

---

## ❌ BROKEN Queries

### 1. Candidate Queries
- **Query**: "Which candidates are available this week?"
- **Status**: ❌ BROKEN
- **Error**: `column candidates.name does not exist`
- **Root Cause**: Edge Function uses `name` but database has `full_name`
- **Fix Required**: Update `queryCandidates()` function

### 2. Revenue Calculation
- **Query**: "What's our revenue this month?"
- **Status**: ⚠️ PARTIALLY WORKS
- **Issue**: Only counts completed projects, doesn't filter by date
- **Fix Required**: Add date filtering for "this month"

### 3. Project Details with Staff
- **Query**: "Show me details of project [ID]"
- **Status**: ⚠️ NEEDS TESTING
- **Potential Issue**: Uses `candidates(name, phone)` which don't exist
- **Fix Required**: Update to use `full_name, phone_number`

### 4. Scheduling Conflicts
- **Query**: "Check for scheduling conflicts this week"
- **Status**: ❌ NOT IMPLEMENTED
- **Response**: Returns empty array with "No conflicts detected"
- **Fix Required**: Implement actual conflict detection logic

---

## 🔧 Required Fixes

### HIGH PRIORITY (Breaks core functionality)

#### Fix #1: Update Candidate Schema References
**File**: `/supabase/functions/ai-chat/index.ts`
**Line**: 476-497 (queryCandidates function)

```typescript
// CURRENT (BROKEN):
async function queryCandidates(supabase: any, args: any, context: Context) {
  let query = supabase
    .from('candidates')
    .select('id, name, ic_number, phone, status')  // ❌ name, phone don't exist
    .order('name', { ascending: true })

// FIXED:
async function queryCandidates(supabase: any, args: any, context: Context) {
  let query = supabase
    .from('candidates')
    .select('id, full_name, ic_number, phone_number, email, status')  // ✅ correct fields
    .order('full_name', { ascending: true })
```

#### Fix #2: Update Project Staff Schema
**File**: `/supabase/functions/ai-chat/index.ts`
**Line**: 510-512 (getProjectDetails function)

```typescript
// CURRENT (BROKEN):
const { data: staff } = await supabase
  .from('project_staff')
  .select('candidate_id, role, status, candidates(id, name, phone)')  // ❌ wrong fields

// FIXED:
const { data: staff } = await supabase
  .from('project_staff')
  .select('candidate_id, role, status, candidates(id, full_name, phone_number, email)')  // ✅ correct
```

#### Fix #3: Add Date Filtering to Revenue Calculation
**File**: `/supabase/functions/ai-chat/index.ts`
**Line**: 521-538 (calculateRevenue function)

```typescript
// CURRENT (BROKEN):
async function calculateRevenue(supabase: any, args: any, context: Context) {
  const { data, error } = await supabase
    .from('projects')
    .select('id, budget, status')
    .eq('status', 'completed')  // ❌ No date filtering

// FIXED:
async function calculateRevenue(supabase: any, args: any, context: Context) {
  let query = supabase
    .from('projects')
    .select('id, budget, status, start_date')
    .eq('status', 'completed')

  // Add date filtering based on period
  if (args.period === 'this_month') {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    query = query.gte('start_date', firstDay.toISOString().split('T')[0])
                 .lte('start_date', lastDay.toISOString().split('T')[0])
  }

  const { data, error } = await query
```

### MEDIUM PRIORITY (Core features not implemented)

#### Fix #4: Implement Scheduling Conflict Detection
**File**: `/supabase/functions/ai-chat/index.ts`
**Line**: 540-544 (checkSchedulingConflicts function)

**Requirements**:
1. Query `project_staff` table
2. Check for overlapping date ranges
3. Check for double-booked candidates
4. Check for insufficient staff count

```typescript
async function checkSchedulingConflicts(supabase: any, args: any, context: Context) {
  const { date_from, date_to } = args

  // Get all projects in date range
  const { data: projects } = await supabase
    .from('projects')
    .select(`
      id,
      title,
      start_date,
      end_date,
      crew_count,
      filled_positions,
      project_staff(
        candidate_id,
        candidates(full_name, phone_number)
      )
    `)
    .gte('start_date', date_from)
    .lte('start_date', date_to)

  // Check for understaffed projects
  const understaffed = projects.filter(p => p.filled_positions < p.crew_count)

  // Check for double-booked candidates
  const candidateSchedules = {}
  projects.forEach(project => {
    project.project_staff.forEach(staff => {
      if (!candidateSchedules[staff.candidate_id]) {
        candidateSchedules[staff.candidate_id] = []
      }
      candidateSchedules[staff.candidate_id].push({
        project_id: project.id,
        project_title: project.title,
        date: project.start_date
      })
    })
  })

  const doubleBooked = Object.entries(candidateSchedules)
    .filter(([_, projects]) => projects.length > 1)
    .map(([candidateId, projects]) => ({
      candidate_id: candidateId,
      conflicts: projects
    }))

  return {
    conflicts: [...understaffed, ...doubleBooked],
    understaffed_count: understaffed.length,
    double_booked_count: doubleBooked.length,
    message: `Found ${understaffed.length} understaffed projects and ${doubleBooked.length} double-booked candidates`
  }
}
```

#### Fix #5: Add More Tool Capabilities
**Current Tools**:
- ✅ query_projects
- ✅ query_candidates (broken)
- ✅ get_project_details (broken)
- ✅ calculate_revenue (partial)
- ✅ check_scheduling_conflicts (not implemented)

**Missing Tools** (should add):
- ❌ `create_project` - Create new projects
- ❌ `update_project_status` - Change project status
- ❌ `assign_candidate` - Add candidate to project
- ❌ `remove_candidate` - Remove candidate from project
- ❌ `search_candidates_by_skills` - Filter by skills/experience
- ❌ `get_candidate_availability` - Check candidate schedule
- ❌ `get_project_timeline` - Show upcoming deadlines
- ❌ `generate_report` - Export data to PDF/CSV

### LOW PRIORITY (Nice to have)

#### Fix #6: Improve AI Responses
**Current Issues**:
- Generic error messages
- No follow-up suggestions
- Doesn't explain what it's doing

**Improvements**:
1. Add thinking/reasoning steps in responses
2. Provide actionable next steps
3. Show what tools were used
4. Ask clarifying questions when ambiguous

#### Fix #7: Add Context Awareness
**Current**: AI treats each query independently
**Improvement**: Remember previous queries in conversation

Example:
```
User: "Show me projects for October"
AI: [shows projects]
User: "Which ones need more staff?"
AI: [should filter PREVIOUS results, not all projects]
```

#### Fix #8: Add Data Validation
**Current**: AI accepts any parameters
**Improvement**: Validate dates, IDs, status values before querying

---

## 🧪 Comprehensive Test Plan

### Phase 1: Basic Queries (5 tests)
1. ✅ "How many projects do we have?"
2. ✅ "Show me active projects"
3. ❌ "List all candidates" (BROKEN)
4. ⚠️ "Calculate revenue" (NEEDS DATE FILTER)
5. ❌ "Check for conflicts" (NOT IMPLEMENTED)

### Phase 2: Filtered Queries (5 tests)
6. "Show projects scheduled for next week"
7. "Find candidates with driving license"
8. "Which projects are understaffed?"
9. "Show me completed projects this month"
10. "List candidates who worked on project X"

### Phase 3: Complex Queries (5 tests)
11. "Compare revenue between Q1 and Q2"
12. "Find the busiest week in November"
13. "Which candidates have worked the most hours?"
14. "Show projects with no assigned staff"
15. "Calculate average project completion time"

### Phase 4: Conversational Context (5 tests)
16. "Show me projects" → "Filter by active status" → "Sort by date"
17. "Who is candidate John?" → "What projects has he worked on?"
18. "Show revenue" → "Break it down by month"
19. "Check conflicts" → "Show me only critical ones"
20. "List projects" → "How many need more staff?"

### Phase 5: Edge Cases (5 tests)
21. Invalid project ID
22. Date in wrong format
23. Asking for data that doesn't exist
24. Extremely long queries
25. Multiple questions in one query

---

## 📊 Test Results Summary

| Category | Total | Passed | Failed | Not Implemented |
|----------|-------|--------|--------|-----------------|
| Basic Queries | 5 | 2 | 1 | 2 |
| Filtered Queries | 5 | 0 | 0 | 5 |
| Complex Queries | 5 | 0 | 0 | 5 |
| Conversational | 5 | 0 | 0 | 5 |
| Edge Cases | 5 | 0 | 0 | 5 |
| **TOTAL** | **25** | **2** | **1** | **22** |

**Success Rate**: 8% (2/25)
**Target**: 80% (20/25)

---

## 🚀 Implementation Priority

### Sprint 1 (Critical Fixes)
- [ ] Fix #1: Update candidate schema references
- [ ] Fix #2: Update project staff schema
- [ ] Fix #3: Add date filtering to revenue

**Estimated Time**: 30 minutes
**Impact**: Fixes 60% of broken queries

### Sprint 2 (Core Features)
- [ ] Fix #4: Implement scheduling conflicts
- [ ] Fix #5: Add create/update/assign tools
- [ ] Test Phase 2: Filtered queries

**Estimated Time**: 2 hours
**Impact**: Adds critical business logic

### Sprint 3 (Enhancements)
- [ ] Fix #6: Improve AI responses
- [ ] Fix #7: Add context awareness
- [ ] Fix #8: Add data validation
- [ ] Test Phase 3: Complex queries

**Estimated Time**: 3 hours
**Impact**: Makes AI feel intelligent

### Sprint 4 (Polish)
- [ ] Test Phase 4: Conversational context
- [ ] Test Phase 5: Edge cases
- [ ] Add error recovery
- [ ] Add conversation memory

**Estimated Time**: 2 hours
**Impact**: Production-ready quality

---

## 📝 Notes

### Why Chatbot Doesn't Feel "Agentic"
1. **Limited Tools**: Only 5 tools, 2 broken, 1 not implemented
2. **No Multi-Step Reasoning**: Can't chain tools together
3. **No Context Memory**: Forgets previous queries
4. **Generic Responses**: Doesn't explain its thinking
5. **No Proactive Actions**: Doesn't suggest related queries
6. **No Error Recovery**: Gives up on first error

### To Make It More Agentic
1. ✅ Add more tools (CRUD operations)
2. ✅ Enable multi-step tool chaining
3. ✅ Add conversation memory
4. ✅ Make responses more detailed
5. ✅ Add "thinking out loud" capability
6. ✅ Suggest next actions
7. ✅ Handle errors gracefully

---

## 🎯 Success Metrics

**Current State**:
- 2/5 tools working
- 8% test pass rate
- No multi-step reasoning
- No context memory

**Target State** (by end of Sprint 4):
- 10/10 tools working
- 80% test pass rate
- Multi-step reasoning enabled
- Context memory across 10+ messages
- Proactive suggestions
- Error recovery

---

## 🔍 Troubleshooting Guide

### If candidate queries still fail:

1. **Clear Browser Storage**:
   - Open DevTools (F12)
   - Go to Application > Local Storage
   - Clear all chat-related data
   - Refresh page

2. **Start Fresh Conversation**:
   - Close chat widget
   - Open again (Cmd+K)
   - This creates a new session_id

3. **Check Edge Function Logs**:
   ```bash
   # View real-time logs
   npx supabase functions logs ai-chat --project-ref aoiwrdzlichescqgnohi
   ```

   Look for:
   - `[queryCandidates] Starting with args` - confirms function was called
   - `[queryCandidates] ERROR` - shows actual database error
   - `[queryCandidates] SUCCESS` - confirms query worked

4. **Test Edge Function Directly**:
   Replace USER_ID with an actual UUID from your users table:
   ```bash
   curl -X POST "https://aoiwrdzlichescqgnohi.supabase.co/functions/v1/ai-chat" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "userId": "ACTUAL-USER-UUID",
       "sessionId": "test-session-'$(date +%s)'",
       "message": "List all candidates"
     }'
   ```

5. **Check Database Schema**:
   ```sql
   -- Verify candidates table has correct columns
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'candidates'
   ORDER BY ordinal_position;
   ```

---

**Last Updated**: October 3, 2025 04:20 AM
**Next Review**: After Sprint 1 completion
