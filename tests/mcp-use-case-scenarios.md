# MCP-Enhanced Chatbot: Use Case Test Scenarios

**Purpose:** Validate that the MCP-enhanced chatbot can handle real-world workflows with ADD/EDIT capabilities.

**Test Environment:** Development/Staging (NOT production)

**Security:** MCP set to development mode with proper access controls

---

## Test Scenario 1: Speed Project Creation (End-to-End)

### User Story
As a recruiter, I want to paste a job posting and have the system create the project, find candidates, and assign them automatically.

### Input
```
User: Looking for 10 promoters for Samsung product launch
Date: December 15-17, 2024
Time: 10am - 6pm
Location: Mid Valley Mall
Pay: RM15/hour
Must speak Mandarin
```

### Expected Chatbot Behavior

**Step 1: Reasoning**
```
Bot: 🧠 "I understand you need:
- 10 Mandarin-speaking promoters
- Samsung product launch
- Dec 15-17, 2024, 10am-6pm
- Mid Valley Mall, RM15/hr

I'll create this project and find suitable candidates for you."
```

**Step 2: Execute (MCP ADD)**
```sql
-- Create project
INSERT INTO projects (
  title, event_type, brand_name,
  start_date, end_date,
  working_hours_start, working_hours_end,
  venue_address, venue_details,
  crew_count, hourly_rate,
  status, priority, user_id
) VALUES (
  'Samsung Product Launch - Mid Valley Mall',
  'Product Launch',
  'Samsung',
  '2024-12-15', '2024-12-17',
  '10:00', '18:00',
  'Mid Valley Mall', 'Main Atrium',
  10, 15,
  'planning', 'high', <user_id>
) RETURNING id;
```

**Step 3: Find Candidates (MCP QUERY)**
```sql
-- Find Mandarin-speaking candidates
SELECT c.id, c.full_name, c.phone_number, c.skills,
       COUNT(ps.id) as past_projects,
       AVG(gf.rating) as avg_rating
FROM candidates c
LEFT JOIN project_staff ps ON c.id = ps.candidate_id
LEFT JOIN gig_feedback gf ON ps.id = gf.staff_id
WHERE c.status = 'active'
  AND 'Mandarin' = ANY(c.skills)
  AND NOT EXISTS (
    SELECT 1 FROM project_staff ps2
    JOIN projects p2 ON ps2.project_id = p2.id
    WHERE ps2.candidate_id = c.id
      AND p2.start_date <= '2024-12-17'
      AND p2.end_date >= '2024-12-15'
  )
GROUP BY c.id
ORDER BY avg_rating DESC NULLS LAST
LIMIT 15;
```

**Step 4: Present Results**
```
Bot: ✅ "Project created: Samsung Product Launch - Mid Valley Mall

Found 15 Mandarin-speaking candidates available:

Top 10 (sorted by rating):
1. Alice Wong ⭐4.9 (20 events)
2. David Lim ⭐4.8 (15 events)
3. Sarah Lee ⭐4.7 (12 events)
4. Mike Chen ⭐4.6 (10 events)
5. Lisa Tan ⭐4.6 (8 events)
6. John Tan ⭐4.5 (7 events)
7. Mary Ng ⭐4.5 (6 events)
8. Peter Wong ⭐4.4 (5 events)
9. Susan Lim ⭐4.3 (4 events)
10. Kevin Ho ⭐4.2 (3 events)

Would you like me to:
1. Assign top 10 automatically
2. Show more details first
3. Let me pick manually"
```

**Step 5: Auto-Assign (MCP ADD - Bulk)**
```
User: "Assign top 10"

Bot: ✅ "Assigning staff..."
```

```sql
-- Bulk insert project_staff
INSERT INTO project_staff (project_id, candidate_id, role, status)
VALUES
  (<project_id>, <alice_id>, 'Promoter', 'invited'),
  (<project_id>, <david_id>, 'Promoter', 'invited'),
  (<project_id>, <sarah_id>, 'Promoter', 'invited'),
  (<project_id>, <mike_id>, 'Promoter', 'invited'),
  (<project_id>, <lisa_id>, 'Promoter', 'invited'),
  (<project_id>, <john_id>, 'Promoter', 'invited'),
  (<project_id>, <mary_id>, 'Promoter', 'invited'),
  (<project_id>, <peter_id>, 'Promoter', 'invited'),
  (<project_id>, <susan_id>, 'Promoter', 'invited'),
  (<project_id>, <kevin_id>, 'Promoter', 'invited');

-- Update project filled_positions
UPDATE projects
SET filled_positions = 10
WHERE id = <project_id>;
```

**Step 6: Confirmation**
```
Bot: 🎉 "Done! Samsung Product Launch is now 100% staffed.

✅ 10 promoters assigned
✅ Invitations sent to all candidates
✅ Project status: Ready for confirmation

Next steps:
- Candidates have 48 hours to accept
- I'll notify you when they respond
- Would you like me to create schedules or payment batch?"
```

### Expected Database Changes

**Tables Modified:**
1. ✅ `projects` - 1 new row
2. ✅ `project_staff` - 10 new rows
3. ✅ `notifications` - 10 new rows (invitations sent)

**Validation Queries:**
```sql
-- Verify project created
SELECT * FROM projects WHERE title LIKE '%Samsung Product Launch%';

-- Verify staff assigned
SELECT COUNT(*) FROM project_staff WHERE project_id = <project_id>;
-- Expected: 10

-- Verify filled_positions updated
SELECT filled_positions FROM projects WHERE id = <project_id>;
-- Expected: 10
```

### Success Criteria
- ✅ Project created with all correct details
- ✅ 10 candidates assigned
- ✅ No scheduling conflicts
- ✅ Notifications sent
- ✅ Total time: < 60 seconds

### Metrics
- **Current manual process:** 15-20 minutes
- **MCP-enhanced:** ~30 seconds
- **Time saved:** 95%
- **Error reduction:** 90% (no manual data entry)

---

## Test Scenario 2: Smart Candidate Onboarding

### User Story
As a recruiter, I want to quickly add a new candidate and immediately match them to suitable projects.

### Input
```
User: "Add new candidate:
Name: John Tan
Phone: 012-345-6789
IC: 950123-10-5678
Skills: Mandarin, English, Promoter
Has vehicle: Yes
Address: Petaling Jaya, Selangor"
```

### Expected Chatbot Behavior

**Step 1: Parse & Validate**
```
Bot: 🧠 "I'll add John Tan to the system. Let me validate the details:

✅ Name: John Tan
✅ Phone: 012-345-6789 (Malaysia format)
✅ IC: 950123-10-5678 (Age: 29, valid)
✅ Skills: Mandarin, English, Promoter
✅ Vehicle: Yes
✅ Location: Petaling Jaya

All details look good. Adding to system..."
```

**Step 2: Create Candidate (MCP ADD)**
```sql
INSERT INTO candidates (
  full_name, phone_number, ic_number,
  skills, has_vehicle,
  business_address, home_address,
  status, created_by
) VALUES (
  'John Tan',
  '012-345-6789',
  '950123-10-5678',
  ARRAY['Mandarin', 'English', 'Promoter'],
  true,
  'Petaling Jaya, Selangor',
  'Petaling Jaya, Selangor',
  'active',
  <user_id>
) RETURNING id;
```

**Step 3: Find Matching Projects (MCP QUERY)**
```sql
-- Find suitable projects
SELECT p.id, p.title, p.brand_name,
       p.start_date, p.end_date,
       p.venue_address, p.hourly_rate,
       p.crew_count - p.filled_positions as positions_needed
FROM projects p
WHERE p.status IN ('active', 'planning')
  AND p.filled_positions < p.crew_count
  AND (
    'Mandarin' = ANY(p.required_skills) OR
    'Promoter' = ANY(p.required_skills) OR
    p.required_skills IS NULL
  )
  AND p.start_date >= CURRENT_DATE
ORDER BY p.start_date
LIMIT 10;
```

**Step 4: Present Opportunities**
```
Bot: ✅ "John Tan added successfully! (ID: C-1234)

I found 3 projects that match his skills:

1. 🔥 Samsung Product Launch
   - Dec 15-17, 2024
   - Mid Valley Mall
   - RM15/hr
   - Needs: 2 more Mandarin promoters
   - Perfect match! ⭐

2. Mr. DIY Roadshow
   - Dec 20-22, 2024
   - Sunway Pyramid
   - RM14/hr
   - Needs: 5 more promoters

3. Coca-Cola Festival
   - Dec 28-30, 2024
   - KLCC
   - RM16/hr
   - Needs: 3 more staff

Would you like me to:
1. Auto-invite him to Samsung (best match)
2. Invite to all 3 projects
3. Let John choose
4. Just save for now"
```

**Step 5: Auto-Invite (MCP ADD)**
```
User: "Auto-invite to Samsung"

Bot: ✅ "Inviting John to Samsung Product Launch..."
```

```sql
-- Create invitation
INSERT INTO project_staff (
  project_id, candidate_id, role, status
) VALUES (
  <samsung_project_id>,
  <john_id>,
  'Promoter',
  'invited'
);

-- Create notification
INSERT INTO notifications (
  user_id, type, title, message,
  project_id, candidate_id
) VALUES (
  <john_id>,
  'project_invitation',
  'New Project Invitation',
  'You have been invited to Samsung Product Launch at Mid Valley Mall',
  <samsung_project_id>,
  <john_id>
);
```

**Step 6: Confirmation**
```
Bot: 🎉 "Done! John Tan has been:
✅ Added to candidate database
✅ Invited to Samsung Product Launch
✅ SMS invitation sent to 012-345-6789

Samsung project now: 11/10 staff (1 pending confirmation)

John's profile:
- Skills: Mandarin, English, Promoter
- Vehicle: Yes
- Status: Active, pending invitation response
- Next opportunity: Samsung (awaiting response)"
```

### Expected Database Changes

**Tables Modified:**
1. ✅ `candidates` - 1 new row (John Tan)
2. ✅ `project_staff` - 1 new row (invitation)
3. ✅ `notifications` - 1 new row (SMS)

### Success Criteria
- ✅ Candidate created with all details
- ✅ Skills parsed correctly
- ✅ Matched to relevant projects
- ✅ Invitation sent automatically
- ✅ Time: < 30 seconds

---

## Test Scenario 3: Emergency Staff Replacement

### User Story
As a project manager, when a staff member cancels last minute, I want the system to immediately find and assign a replacement.

### Input
```
Bot: 🚨 "ALERT: John Tan just canceled for Samsung Launch (TODAY, starts in 2 hours)

Reason: Emergency
Project: Samsung Product Launch - Mid Valley Mall
Time: 10am-6pm (starts at 10am)
Current time: 8:00am

Finding replacement..."
```

### Expected Chatbot Behavior

**Step 1: Find Emergency Replacement (MCP QUERY)**
```sql
-- Find immediate replacements
SELECT c.id, c.full_name, c.phone_number,
       c.business_address, c.has_vehicle,
       COUNT(ps.id) as total_projects,
       AVG(gf.rating) as avg_rating,
       (
         SELECT COUNT(*) FROM project_staff ps2
         JOIN projects p2 ON ps2.project_id = p2.id
         WHERE ps2.candidate_id = c.id
           AND p2.brand_name = 'Samsung'
       ) as samsung_experience
FROM candidates c
LEFT JOIN project_staff ps ON c.id = ps.candidate_id
LEFT JOIN gig_feedback gf ON ps.id = gf.staff_id
WHERE c.status = 'active'
  AND 'Mandarin' = ANY(c.skills)
  AND c.id != <john_id>
  AND NOT EXISTS (
    -- Not already assigned today
    SELECT 1 FROM project_staff ps3
    JOIN projects p3 ON ps3.project_id = p3.id
    WHERE ps3.candidate_id = c.id
      AND p3.start_date = CURRENT_DATE
  )
GROUP BY c.id
ORDER BY
  avg_rating DESC NULLS LAST,
  samsung_experience DESC,
  total_projects DESC
LIMIT 5;
```

**Step 2: Present Options (Urgency Mode)**
```
Bot: ⚡ "Found 3 candidates available RIGHT NOW:

1. 🌟 Alice Wong (BEST CHOICE)
   ⭐ 4.9 rating
   ✅ 12 Samsung events worked
   ✅ Lives 5km from Mid Valley
   ✅ Has vehicle
   ✅ Available now
   ✅ Can arrive by 9:45am

2. David Lim
   ⭐ 4.8 rating
   ✅ 8 Samsung events
   ⚠️ Lives 15km away
   ✅ Has vehicle
   ⏰ Can arrive by 10:15am (15min late)

3. Sarah Lee
   ⭐ 4.7 rating
   ✅ 5 Samsung events
   ⚠️ No vehicle
   ⏰ Needs Grab (30min)

🔥 URGENT: This project starts in 2 hours!

Should I:
1. Auto-assign Alice (RECOMMENDED)
2. Call Alice first
3. Show all options"
```

**Step 3: Emergency Assignment (MCP EDIT + ADD)**
```
User: "Auto-assign Alice"

Bot: ⚡ "Emergency assignment in progress..."
```

```sql
-- Step 1: Remove John
UPDATE project_staff
SET status = 'cancelled',
    cancellation_reason = 'Emergency',
    cancelled_at = NOW()
WHERE project_id = <samsung_id>
  AND candidate_id = <john_id>;

-- Step 2: Assign Alice
INSERT INTO project_staff (
  project_id, candidate_id, role, status, is_emergency_replacement
) VALUES (
  <samsung_id>,
  <alice_id>,
  'Promoter',
  'confirmed',
  true
);

-- Step 3: Send URGENT notification
INSERT INTO notifications (
  user_id, type, title, message,
  priority, send_sms, send_push
) VALUES (
  <alice_id>,
  'emergency_assignment',
  '🚨 URGENT: Emergency Assignment',
  'Samsung Launch TODAY at Mid Valley Mall, 10am-6pm. Please confirm ASAP!',
  'high',
  true,
  true
);

-- Step 4: Notify supervisor
INSERT INTO notifications (
  user_id, type, title, message
) VALUES (
  <supervisor_id>,
  'staff_change',
  'Staff Replacement Completed',
  'John Tan replaced by Alice Wong for Samsung Launch (TODAY)',
  'high'
);
```

**Step 4: Real-time Confirmation**
```
Bot: ✅ "DONE in 8 seconds!

Changes made:
✅ Removed John Tan from Samsung Launch
✅ Assigned Alice Wong as replacement
✅ Sent URGENT SMS to Alice (012-XXX-XX89)
✅ Notified project supervisor
✅ Updated project roster

⏰ Alice response: "On my way! ETA 9:40am" (received 15 seconds ago)

Samsung Launch status:
- Staff: 10/10 ✓
- All confirmed ✓
- Starts in: 1h 52min

Crisis resolved! 🎉"
```

### Expected Database Changes

**Tables Modified:**
1. ✅ `project_staff` - 1 row updated (John cancelled), 1 row added (Alice assigned)
2. ✅ `notifications` - 2 new rows (Alice urgent, supervisor notified)
3. ✅ `projects` - filled_positions remains 10 (replacement, not addition)

### Success Criteria
- ✅ Replacement found within 10 seconds
- ✅ Best candidate selected automatically
- ✅ Urgent notifications sent
- ✅ No downtime for project
- ✅ Supervisor notified

---

## Test Scenario 4: Bulk Schedule Update with Conflict Resolution

### User Story
As a project manager, when event dates change, I want the system to update schedules and automatically resolve any conflicts.

### Input
```
User: "Samsung launch moved from Dec 15-17 to Dec 20-22"
```

### Expected Chatbot Behavior

**Step 1: Impact Analysis (MCP QUERY)**
```sql
-- Check conflicts
SELECT ps.candidate_id, c.full_name,
       p2.id as conflicting_project_id,
       p2.title as conflicting_project,
       p2.start_date, p2.end_date
FROM project_staff ps
JOIN candidates c ON ps.candidate_id = c.id
LEFT JOIN project_staff ps2 ON ps2.candidate_id = ps.candidate_id
LEFT JOIN projects p2 ON ps2.project_id = p2.id
WHERE ps.project_id = <samsung_id>
  AND ps.status = 'confirmed'
  AND p2.id IS NOT NULL
  AND p2.id != <samsung_id>
  AND (
    (p2.start_date BETWEEN '2024-12-20' AND '2024-12-22') OR
    (p2.end_date BETWEEN '2024-12-20' AND '2024-12-22') OR
    (p2.start_date <= '2024-12-20' AND p2.end_date >= '2024-12-22')
  );
```

**Step 2: Present Conflicts**
```
Bot: 🔍 "Analyzing impact of date change...

Found 3 conflicts:

1. ⚠️ John Tan
   - Conflict: Mr. DIY Roadshow (Dec 20-22)
   - Status: Confirmed on both projects
   - Action needed: Choose one

2. ⚠️ Sarah Lee
   - Conflict: Coca-Cola Setup (Dec 20, 4pm-10pm)
   - Samsung: 10am-6pm
   - Partial overlap: 4pm-6pm (2 hours)
   - Action needed: Adjust schedule or replace

3. ⚠️ Venue availability
   - Mid Valley Mall may not be available Dec 20-22
   - Action needed: Check venue

Resolution options:
1. Auto-resolve conflicts (recommended)
   - Move John to Samsung (higher priority/pay)
   - Adjust Sarah's Coca-Cola shift to 7pm-10pm
   - Flag venue for manual check

2. Show me all options first
3. Cancel date change

Recommended: Option 1 (auto-resolve)
Would you like me to proceed?"
```

**Step 3: Auto-Resolve (MCP EDIT - Multiple)**
```
User: "Auto-resolve"

Bot: ⚡ "Resolving conflicts..."
```

```sql
-- Step 1: Update Samsung project dates
UPDATE projects
SET start_date = '2024-12-20',
    end_date = '2024-12-22',
    updated_at = NOW()
WHERE id = <samsung_id>;

-- Step 2: Move John from Mr. DIY to backup
UPDATE project_staff
SET status = 'backup',
    notes = 'Moved to backup due to Samsung priority (higher pay: RM15 vs RM14)',
    updated_at = NOW()
WHERE project_id = <mrdiy_id>
  AND candidate_id = <john_id>;

-- Step 3: Adjust Sarah's Coca-Cola shift
UPDATE project_staff
SET custom_schedule = jsonb_set(
  COALESCE(custom_schedule, '{}'::jsonb),
  '{working_hours}',
  '{"start": "19:00", "end": "22:00"}'::jsonb
),
notes = 'Shifted to 7pm-10pm to avoid Samsung overlap',
updated_at = NOW()
WHERE project_id = <cocacola_id>
  AND candidate_id = <sarah_id>;

-- Step 4: Create notifications
INSERT INTO notifications (user_id, type, title, message, priority)
VALUES
  (<john_id>, 'schedule_change', 'Schedule Update',
   'Samsung Launch moved to Dec 20-22. You have been prioritized for Samsung.', 'high'),
  (<sarah_id>, 'schedule_change', 'Schedule Adjustment',
   'Coca-Cola shift adjusted to 7pm-10pm to accommodate Samsung event.', 'medium'),
  (<mrdiy_supervisor_id>, 'staff_change', 'Staff Update',
   'John Tan moved to backup for Mr. DIY (Dec 20-22) due to Samsung priority.', 'medium');

-- Step 5: Create task for venue check
INSERT INTO task_templates (
  title, description, priority, assigned_to, due_date
) VALUES (
  'Verify venue availability',
  'Check Mid Valley Mall availability for Samsung Launch Dec 20-22',
  'high',
  <manager_id>,
  '2024-12-01'
);
```

**Step 4: Resolution Complete**
```
Bot: ✅ "All conflicts resolved!

Date change summary:
📅 Samsung Launch: Dec 15-17 → Dec 20-22

Resolutions:
1. ✅ John Tan: Prioritized for Samsung
   - Mr. DIY: Moved to backup list
   - Reason: Samsung pays RM15 vs Mr. DIY RM14
   - Notified: Yes

2. ✅ Sarah Lee: Schedule adjusted
   - Samsung: 10am-6pm (unchanged)
   - Coca-Cola: 4pm-10pm → 7pm-10pm
   - No overlap now ✓
   - Notified: Yes

3. ⚠️ Venue check: Manual task created
   - Task assigned to you
   - Due: Dec 1
   - Priority: High

Updated project status:
- Samsung Launch: 10/10 staff ✓
- All dates updated ✓
- All staff notified ✓
- No conflicts remaining ✓

Mr. DIY Roadshow now: 7/8 staff (needs 1 replacement)
Would you like me to find a replacement for Mr. DIY?"
```

### Expected Database Changes

**Tables Modified:**
1. ✅ `projects` - 1 row updated (dates changed)
2. ✅ `project_staff` - 2 rows updated (John backup, Sarah schedule)
3. ✅ `notifications` - 3 new rows (all affected parties)
4. ✅ `task_templates` - 1 new row (venue check)

### Success Criteria
- ✅ Dates updated correctly
- ✅ Conflicts identified automatically
- ✅ Conflicts resolved intelligently
- ✅ All parties notified
- ✅ Minimal manual intervention
- ✅ Time: < 60 seconds

---

## Test Scenario 5: Intelligent Expense Claim Processing

### User Story
As a finance manager, I want the system to validate and auto-approve legitimate expense claims.

### Input
```
User: "John Tan: Grab fare to Samsung event RM35.50"
```

### Expected Chatbot Behavior

**Step 1: Context Gathering (MCP QUERY)**
```sql
-- Get John's recent work
SELECT ps.id, p.title, p.venue_address,
       p.start_date, ps.working_hours_start,
       c.home_address
FROM project_staff ps
JOIN projects p ON ps.project_id = p.id
JOIN candidates c ON ps.candidate_id = c.id
WHERE c.full_name = 'John Tan'
  AND ps.status = 'completed'
  AND p.start_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY p.start_date DESC
LIMIT 5;

-- Check historical expenses
SELECT AVG(amount) as avg_transport
FROM expense_claims
WHERE candidate_id = <john_id>
  AND category = 'Transportation'
  AND status = 'approved';
```

**Step 2: Intelligent Validation**
```
Bot: 🔍 "Validating expense claim...

Expense: RM35.50 (Grab fare)
Claimant: John Tan
Event: Samsung Product Launch

Verification checks:
✅ John worked Samsung Launch on Dec 20
✅ Shift: 10am-6pm at Mid Valley Mall
✅ His address: Petaling Jaya (12km from venue)
✅ Typical Grab PJ → Mid Valley: RM30-40
✅ Amount is within expected range
✅ No duplicate claims found
✅ John's average transport claim: RM32 (consistent)

Risk assessment: LOW ✅
Legitimacy score: 95/100

Recommendation: AUTO-APPROVE

Should I:
1. Auto-approve and add to next payment batch
2. Request receipt photo first
3. Flag for manual review"
```

**Step 3: Auto-Approve (MCP ADD)**
```
User: "Auto-approve"

Bot: ✅ "Approving expense claim..."
```

```sql
-- Create expense claim
INSERT INTO expense_claims (
  candidate_id, project_id,
  category, subcategory,
  amount, description,
  claim_date, status,
  approved_by, approved_at,
  legitimacy_score,
  validation_notes
) VALUES (
  <john_id>,
  <samsung_id>,
  'Transportation',
  'Grab/Taxi',
  35.50,
  'Grab fare to Samsung event',
  CURRENT_DATE,
  'approved',
  'AI Auto-Approved',
  NOW(),
  95,
  'Auto-validated: Distance check ✓, Amount reasonable ✓, Historical pattern ✓'
) RETURNING id;

-- Add to payment batch
INSERT INTO payment_batch_items (
  batch_id, candidate_id, expense_claim_id,
  amount, type
) VALUES (
  <current_batch_id>,
  <john_id>,
  <expense_id>,
  35.50,
  'expense_reimbursement'
);

-- Update batch total
UPDATE payment_batches
SET total_amount = total_amount + 35.50,
    item_count = item_count + 1
WHERE id = <current_batch_id>;

-- Notify John
INSERT INTO notifications (
  user_id, type, title, message
) VALUES (
  <john_id>,
  'expense_approved',
  'Expense Approved',
  'Your RM35.50 transportation claim has been approved and added to Payment Batch #47'
);
```

**Step 4: Confirmation**
```
Bot: ✅ "Expense claim approved!

Details:
- Amount: RM35.50
- Category: Transportation (Grab)
- Status: Approved (AI validated)
- Legitimacy: 95/100
- Added to: Payment Batch #47
- Payment date: Dec 31, 2024

John Tan's summary:
- Total pending expenses: RM35.50
- Next payment: Dec 31
- Historical claims: 8 approved, 0 rejected

Would you like me to:
- Process more expense claims
- Review Payment Batch #47
- Generate expense report"
```

### Expected Database Changes

**Tables Modified:**
1. ✅ `expense_claims` - 1 new row (approved)
2. ✅ `payment_batch_items` - 1 new row
3. ✅ `payment_batches` - 1 row updated (totals)
4. ✅ `notifications` - 1 new row

### Success Criteria
- ✅ Expense validated intelligently
- ✅ Auto-approved if legitimate
- ✅ Added to payment batch
- ✅ Candidate notified
- ✅ Time: < 15 seconds

---

## Test Scenario 6-10 (Summary Format)

### Test Scenario 6: Batch Candidate Certification Update
**Input:** "These 15 candidates completed fire safety training: [list]"
**Expected:** Update all 15 profiles, identify upgrades, open new opportunities
**DB Changes:** `candidates` (15 updates), `certifications` (15 inserts)

### Test Scenario 7: Smart Payment Batch Creation
**Input:** "Create payment batch for December"
**Expected:** Analyze all work, detect issues, create validated batch
**DB Changes:** `payment_batches` (1 insert), `payment_batch_items` (bulk insert)

### Test Scenario 8: Multi-Project Assignment
**Input:** "Alice Wong available for all of January, find her projects"
**Expected:** Find 8 matches, assign to top 3, optimize schedule
**DB Changes:** `project_staff` (3 inserts), 3 projects now fully staffed

### Test Scenario 9: Proactive Staffing Alert
**Input:** System detects understaffed project
**Expected:** Bot alerts user, finds replacements, auto-invites
**DB Changes:** `notifications` (user alert), `project_staff` (2 invites)

### Test Scenario 10: Intelligent Candidate Matching
**Input:** "Need 5 people for luxury hotel event, 4.5+ rating, formal attire"
**Expected:** Complex query, rank by rating/experience, assign top 5
**DB Changes:** `project_staff` (5 inserts), project fully staffed

---

## Test Execution Framework

### Setup
```bash
# 1. Deploy MCP-enhanced chatbot to staging
supabase functions deploy ai-chat-mcp --project-ref <staging>

# 2. Seed test data
psql -h <staging-db> -f tests/seed-mcp-test-data.sql

# 3. Run tests
npm run test:mcp-scenarios
```

### Validation Script
```typescript
// tests/validate-mcp-scenario.ts
async function validateScenario(scenarioId: number) {
  const scenario = SCENARIOS[scenarioId]

  // 1. Execute chatbot interaction
  const response = await chatbot.send(scenario.input)

  // 2. Verify database changes
  const dbChanges = await verifyDatabaseChanges(scenario.expectedChanges)

  // 3. Check success criteria
  const criteriasMet = scenario.successCriteria.every(c => checkCriteria(c))

  // 4. Generate report
  return {
    scenarioId,
    passed: criteriasMet && dbChanges.valid,
    response,
    dbChanges,
    timeTaken: response.metadata.totalTime
  }
}
```

---

## Success Metrics

### Performance Targets

| Scenario | Current Manual | MCP-Enhanced | Target |
|----------|---------------|--------------|--------|
| 1. Speed Creation | 15-20 min | 30 sec | < 60 sec |
| 2. Onboarding | 10 min | 30 sec | < 60 sec |
| 3. Emergency Replace | 20 min | 10 sec | < 30 sec |
| 4. Schedule Update | 60 min | 45 sec | < 90 sec |
| 5. Expense Process | 5 min | 15 sec | < 30 sec |

### Quality Metrics

- **Accuracy:** > 95% correct database operations
- **Conflict Detection:** 100% of scheduling conflicts identified
- **Security:** 0 unauthorized data access
- **User Satisfaction:** > 4.5/5 rating
- **Error Rate:** < 2% failed operations

---

## Security Validation

### Required Checks

```sql
-- Verify RLS is working
SELECT * FROM candidates WHERE user_id != current_user_id();
-- Should return 0 rows if RLS is correct

-- Verify write permissions
SELECT current_setting('role');
-- Should be 'authenticated' not 'service_role'

-- Check audit logs
SELECT * FROM ai_action_logs
WHERE action_type IN ('INSERT', 'UPDATE')
ORDER BY created_at DESC
LIMIT 50;
-- All operations should be logged
```

---

## Next Steps

1. ✅ Review test scenarios
2. ⏳ Deploy MCP-enhanced chatbot to staging
3. ⏳ Run Scenario 1-5 (high priority)
4. ⏳ Measure performance vs manual
5. ⏳ Validate security
6. ⏳ Deploy to production if successful

**Ready to implement?** 🚀
