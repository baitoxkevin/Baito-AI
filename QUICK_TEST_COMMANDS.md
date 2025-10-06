# Quick Test Commands - Copy & Paste into Chatbot

## 🎯 Category 1 Remaining Tests (1.8-1.15)

### Test 1.8: Date Range (Bug Fix Verification)
```
What's starting this month?
```
**Expected:** Shows projects with START DATE in October 2025

---

### Test 1.9: Vehicle Filter (Bug Fix Verification)
```
Who has a car?
```
**Expected:** Shows candidates with has_vehicle = true

---

### Test 1.10: Project Details
```
Tell me about the MrDIY project
```
**Expected:** Shows detailed info about MrDIY projects

---

### Test 1.11: Skills Filter (Bug Fix Verification)
```
Show me people with forklift skills
```
**Expected:** Shows candidates with "forklift" in skills

---

### Test 1.12: Revenue Last Month
```
What was revenue last month?
```
**Expected:** Calculates September 2025 revenue

---

### Test 1.13: High Priority
```
Show me high priority projects
```
**Expected:** Filters priority = "high"

---

### Test 1.14: Understaffed (Bug Fix Verification)
```
Which projects need more staff?
```
**Expected:** Shows projects with filled_positions < crew_count

---

### Test 1.15: Availability
```
Who is available next Friday?
```
**Expected:** Calculates Oct 10, 2025, shows available candidates

---

## 🎯 Category 2: Complex Filtering (2.1-2.15)

### Test 2.1: Multi-Filter Projects
```
Show active high-priority projects starting this month
```
**Expected:** Combines status, priority, and date filters

---

### Test 2.2: Multi-Skill with Vehicle
```
Find candidates with forklift AND warehouse experience who have vehicles
```
**Expected:** Multiple skills + has_vehicle filter

---

### Test 2.3: Revenue by Status
```
What's revenue from completed vs active projects?
```
**Expected:** Two calculate_revenue calls with different status

---

### Test 2.4: Location-Based Candidate Search
```
Find candidates near Kuala Lumpur who are available this week
```
**Expected:** Location + availability combination

---

### Test 2.5: Project Staffing Analysis
```
Show me projects that are fully staffed vs understaffed
```
**Expected:** Two queries: understaffed=false and understaffed=true

---

### Test 2.6: Skill Combination Search
```
Who speaks Mandarin and has vehicle and forklift certification?
```
**Expected:** languages + has_vehicle + skills filters

---

### Test 2.7: Date Range Revenue
```
What was our revenue between September 1 and September 30?
```
**Expected:** calculate_revenue with custom period

---

### Test 2.8: Priority and Status Combination
```
Show me all urgent projects that are still pending
```
**Expected:** priority="urgent" + status="pending"

---

### Test 2.9: Candidate Experience Level
```
Find experienced candidates with 5+ completed projects
```
**Expected:** May need to use rating or custom logic

---

### Test 2.10: Project Timeline Conflicts
```
Which projects overlap with the MrDIY project dates?
```
**Expected:** Date range overlap detection

---

### Test 2.11: Multi-Status Project Query
```
Show me all active and pending projects
```
**Expected:** Multiple queries or OR logic

---

### Test 2.12: Candidate Availability Pattern
```
Who is available on weekends?
```
**Expected:** May need availability table or custom_fields

---

### Test 2.13: Project Location Filter
```
Show me all projects in Kuala Lumpur
```
**Expected:** venue_address or location filter

---

### Test 2.14: Rate Analysis
```
Which candidates have daily rates above RM200?
```
**Expected:** May need project_staff or candidate rate data

---

### Test 2.15: Combined Date and Priority
```
Show high priority projects ending this week
```
**Expected:** priority + end_date filter

---

## 🎯 Category 3: Multi-Step Reasoning (3.1-3.10)

### Test 3.1: Best Candidate Match
```
Find the best candidate for a forklift operator role at MrDIY project
```
**Expected:** Skills match + availability + location reasoning

---

### Test 3.2: Staffing Gap Analysis
```
How many more staff do we need to hire to fill all projects?
```
**Expected:** Calculate total gaps across all understaffed projects

---

### Test 3.3: Revenue Projection
```
If we complete all pending projects, what will our total revenue be?
```
**Expected:** Query pending projects + calculate potential revenue

---

### Test 3.4: Candidate Utilization
```
Which candidates are working on the most projects?
```
**Expected:** Query project_staff + count by candidate

---

### Test 3.5: Schedule Optimization
```
Can we move staff from overstaffed projects to understaffed ones?
```
**Expected:** Identify overstaffed + understaffed + suggest moves

---

### Test 3.6: Timeline Analysis
```
What projects are starting within 7 days and still need staff?
```
**Expected:** date_from filter + understaffed check

---

### Test 3.7: Skill Gap Analysis
```
What skills are most needed for our pending projects?
```
**Expected:** Analyze project requirements vs available skills

---

### Test 3.8: Revenue Trend
```
How does this month's revenue compare to last month?
```
**Expected:** Two revenue calculations + comparison

---

### Test 3.9: Candidate Recommendation
```
Recommend 3 candidates for a warehouse project starting next week
```
**Expected:** Skills + availability + rating consideration

---

### Test 3.10: Conflict Resolution
```
If candidate X is double-booked, which project should we prioritize?
```
**Expected:** Priority + date + client importance reasoning

---

## 🎯 Category 4: Context Awareness (4.4-4.15)

### Test 4.4: Pronoun Resolution
```
[First: Show me MrDIY projects]
[Then: When are they happening?]
```
**Expected:** "they" = MrDIY projects

---

### Test 4.5: Implicit Reference
```
[First: Find forklift operators]
[Then: Who among them has a vehicle?]
```
**Expected:** Filters previous candidates list

---

### Test 4.6: Context Continuation
```
[First: Show high priority projects]
[Then: Which ones are understaffed?]
```
**Expected:** Combines priority + understaffed

---

### Test 4.7: Temporal Context
```
[First: What's our revenue this month?]
[Then: How about last month?]
```
**Expected:** Maintains revenue calculation context

---

### Test 4.8: Entity Tracking
```
[First: Tell me about candidate John]
[Then: Is he available next week?]
```
**Expected:** "he" = John

---

### Test 4.9: Comparison Context
```
[First: Show me project A]
[Then: Compare it with project B]
```
**Expected:** Maintains project A context

---

### Test 4.10: List Context
```
[First: List all candidates]
[Then: Show me the first 5]
```
**Expected:** Limits previous list

---

### Test 4.11: Attribute Context
```
[First: Show MrDIY projects]
[Then: What's the staffing status?]
```
**Expected:** Analyzes MrDIY project staffing

---

### Test 4.12: Date Context
```
[First: Show projects starting next week]
[Then: Which ones need more staff?]
```
**Expected:** Combines date + understaffed

---

### Test 4.13: Multi-Turn Reasoning
```
[First: Find candidates with vehicles]
[Then: Among them, who speaks Mandarin?]
[Then: And who is available tomorrow?]
```
**Expected:** Progressive filtering

---

### Test 4.14: Correction Handling
```
[First: Show me projects for MTDIY]
[AI suggests: Did you mean MrDIY?]
[Then: Yes]
```
**Expected:** Accepts correction

---

### Test 4.15: Negation Context
```
[First: Show all projects]
[Then: Not the completed ones]
```
**Expected:** Excludes completed status

---

## Testing Instructions

### For Each Test:
1. ✅ Copy the query
2. ✅ Paste into chatbot
3. ✅ Wait for response
4. ✅ Check if correct tool used
5. ✅ Mark result in TEST_BATCH_RUNNER.md

### Keyboard Shortcuts:
- **Cmd+C**: Copy query
- **Cmd+V**: Paste into chatbot
- **Enter**: Send message
- **Repeat**: Next test

### Time per Category:
- Category 1 (8 tests): ~10 minutes
- Category 2 (15 tests): ~20 minutes
- Category 3 (10 tests): ~15 minutes
- Category 4 (12 tests): ~15 minutes

**Total Time: ~60 minutes for 45 tests**

---

**Ready to start! 🚀**
**Begin with Category 1, Test 1.8**
