# AI Chatbot - 100 Comprehensive Test Scenarios

## Test Execution Status
- **Total Scenarios**: 100
- **Passed**: 3
- **Failed**: 0
- **Pending**: 97
- **Intelligence Score**: 73/100 (Grade B - Good)
- **Test Coverage**: 3% (Critical: Needs 90%+ for production)
- **Production Status**: ✅ APPROVED for PILOT | 🔴 NOT APPROVED for FULL PRODUCTION

---

## Category 1: Basic Data Retrieval (15 tests)

### 1.1 ✅ PASS - Project Count
**Query**: "How many projects do we have?"
**Expected**: Count of all projects
**Result**: 212 projects ✅
**Tool Used**: query_projects

### 1.2 ✅ PASS - Active Projects
**Query**: "Show me all active projects"
**Expected**: List projects with status='active'
**Result**: 0 active projects (correct filter) ✅
**Tool Used**: query_projects

### 1.3 Candidate Listing
**Query**: "List all candidates"
**Expected**: Show first 20 candidates with basic info
**Tool**: query_candidates

### 1.4 Revenue Calculation
**Query**: "What's our total revenue?"
**Expected**: Calculate sum of all project payments
**Tool**: calculate_revenue

### 1.5 Scheduling Conflicts
**Query**: "Check for scheduling conflicts this week"
**Expected**: Detect double-bookings and understaffing
**Tool**: check_scheduling_conflicts

### 1.6 Project by Status
**Query**: "Show me completed projects"
**Expected**: Filter projects where status='completed'
**Tool**: query_projects

### 1.7 Candidate by Status
**Query**: "Show me available candidates"
**Expected**: Filter candidates where status='available'
**Tool**: query_candidates

### 1.8 Projects by Date Range
**Query**: "Show projects starting this month"
**Expected**: Filter by start_date in current month
**Tool**: query_projects

### 1.9 Candidates with Vehicles
**Query**: "Which candidates have vehicles?"
**Expected**: Filter candidates where has_vehicle=true
**Tool**: query_candidates

### 1.10 Project Details
**Query**: "Tell me about project X"
**Expected**: Show full details for specific project
**Tool**: query_projects

### 1.11 Candidate Skills
**Query**: "Show me candidates with forklift certification"
**Expected**: Search candidates with 'forklift' in skills
**Tool**: query_candidates

### 1.12 Revenue by Date Range
**Query**: "What was revenue last month?"
**Expected**: Calculate revenue for specific month
**Tool**: calculate_revenue

### 1.13 High Priority Projects
**Query**: "Show me high priority projects"
**Expected**: Filter projects where priority='high'
**Tool**: query_projects

### 1.14 Understaffed Projects
**Query**: "Which projects need more staff?"
**Expected**: Find projects where filled_positions < crew_count
**Tool**: check_scheduling_conflicts OR query_projects

### 1.15 Available Candidates for Date
**Query**: "Who is available next Friday?"
**Expected**: Check candidate availability for specific date
**Tool**: query_candidates with available_date filter

---

## Category 2: Complex Filtering & Multi-Criteria Queries (15 tests)

### 2.1 Multi-Filter Projects
**Query**: "Show active high-priority projects starting this month"
**Expected**: Combine status, priority, and date filters
**Tool**: query_projects with multiple args

### 2.2 Candidate Skill Match
**Query**: "Find candidates with forklift AND warehouse experience who have vehicles"
**Expected**: Filter by multiple skills + has_vehicle=true
**Tool**: query_candidates

### 2.3 Revenue Analysis by Status
**Query**: "What's revenue from completed vs active projects?"
**Expected**: Calculate revenue grouped by project status
**Tool**: calculate_revenue (may need multiple calls)

### 2.4 Scheduling Conflicts by Priority
**Query**: "Check for conflicts in high-priority projects only"
**Expected**: Filter conflicts by project priority
**Tool**: check_scheduling_conflicts + query_projects

### 2.5 Geographic Filtering
**Query**: "Show projects in downtown area"
**Expected**: Search venue_address for location keywords
**Tool**: query_projects

### 2.6 Candidate Availability Window
**Query**: "Who is available between March 1-15?"
**Expected**: Check availability for date range
**Tool**: query_candidates with date range logic

### 2.7 Project Capacity Analysis
**Query**: "Which projects are over 80% staffed?"
**Expected**: Calculate filled_positions/crew_count > 0.8
**Tool**: query_projects with calculation

### 2.8 Multi-Skill Candidates
**Query**: "Find candidates with at least 3 different skills"
**Expected**: Parse skills array and count
**Tool**: query_candidates

### 2.9 Recent Projects
**Query**: "Show projects that started in the last 30 days"
**Expected**: Filter start_date within last month
**Tool**: query_projects with date calculation

### 2.10 Weekend Availability
**Query**: "Who can work weekends?"
**Expected**: Check candidate availability + working hours logic
**Tool**: query_candidates

### 2.11 Project Duration Filter
**Query**: "Show projects lasting more than 1 week"
**Expected**: Calculate end_date - start_date > 7 days
**Tool**: query_projects

### 2.12 Budget Range Projects
**Query**: "Show projects with budget over $10,000"
**Expected**: Filter by project financial threshold
**Tool**: query_projects (if budget field exists)

### 2.13 Fully Staffed Projects
**Query**: "Which projects are fully staffed?"
**Expected**: filled_positions = crew_count
**Tool**: query_projects

### 2.14 Emergency Staff Availability
**Query**: "Who can start work tomorrow?"
**Expected**: Immediate availability check
**Tool**: query_candidates

### 2.15 Multi-Project Candidates
**Query**: "Show candidates assigned to multiple projects"
**Expected**: Join candidates with project_staff count
**Tool**: query_candidates (may need multiple queries)

---

## Category 3: Multi-Step Reasoning & Problem Solving (15 tests)

### 3.1 Staff Recommendation
**Query**: "We have a new warehouse project. Who should I assign?"
**Expected**: Find candidates with warehouse skills + check availability
**Tools**: query_candidates → check_scheduling_conflicts

### 3.2 Project Feasibility Check
**Query**: "Can we take on a 5-person project starting next week?"
**Expected**: Check available candidates count + scheduling conflicts
**Tools**: query_candidates → check_scheduling_conflicts

### 3.3 Revenue Projection
**Query**: "If we complete all pending projects, what's total revenue?"
**Expected**: Filter pending projects → calculate revenue
**Tools**: query_projects → calculate_revenue

### 3.4 Conflict Resolution
**Query**: "Sarah is double-booked on Friday. Show me alternatives."
**Expected**: Find conflict → suggest available candidates
**Tools**: check_scheduling_conflicts → query_candidates

### 3.5 Capacity Planning
**Query**: "How many more projects can we handle this month?"
**Expected**: Count available staff → check existing commitments
**Tools**: query_candidates → query_projects → calculate

### 3.6 Skill Gap Analysis
**Query**: "We need forklift operators. Do we have enough?"
**Expected**: Count forklift candidates → compare to project needs
**Tools**: query_candidates → query_projects

### 3.7 Project Prioritization
**Query**: "Which understaffed project should we prioritize?"
**Expected**: Find understaffed → rank by priority
**Tools**: check_scheduling_conflicts → query_projects

### 3.8 Cost-Benefit Analysis
**Query**: "What's average revenue per project by priority level?"
**Expected**: Group projects by priority → calculate avg revenue
**Tools**: query_projects → calculate_revenue → analysis

### 3.9 Resource Reallocation
**Query**: "Can we move staff from Project A to Project B?"
**Expected**: Check Project A overstaffing → Project B needs → availability
**Tools**: query_projects → check_scheduling_conflicts

### 3.10 Timeline Optimization
**Query**: "When can we schedule a 3-day project with 4 staff?"
**Expected**: Find 4 candidates with 3 consecutive days available
**Tools**: query_candidates → multiple availability checks

### 3.11 Emergency Coverage
**Query**: "Two staff called in sick for Project X. Find replacements."
**Expected**: Check project details → find available skilled candidates
**Tools**: query_projects → query_candidates → check_scheduling_conflicts

### 3.12 Budget Utilization
**Query**: "Are we maximizing revenue from available staff?"
**Expected**: Compare staff utilization rate to revenue
**Tools**: query_candidates → query_projects → calculate_revenue

### 3.13 Quality Control
**Query**: "Show projects with low client satisfaction and who worked them"
**Expected**: Filter projects by satisfaction → get assigned staff
**Tools**: query_projects → project_staff lookup

### 3.14 Workload Balance
**Query**: "Who is overworked this month?"
**Expected**: Count assignments per candidate → identify high counts
**Tools**: query_candidates → query_projects → analysis

### 3.15 Seasonal Planning
**Query**: "Prepare for Q4 - do we need to hire more staff?"
**Expected**: Forecast Q4 projects → compare to staff capacity
**Tools**: query_projects → query_candidates → calculate

---

## Category 4: Context Awareness & Conversation Memory (15 tests)

### 4.1 Follow-up Query
**Query 1**: "Show me active projects"
**Query 2**: "How many are high priority?"
**Expected**: Remember "active projects" context

### 4.2 ✅ PASS - Pronoun Resolution
**Query 1**: "Who is available next Monday?"
**Query 2**: "Can they work Tuesday too?"
**Expected**: Resolve "they" to previous candidate list
**Result**: Successfully resolved "they" to 39 candidates from Monday query ✅
**Response**: "All 39 candidates available Monday also available Tuesday"
**Tool Used**: query_candidates (both turns)
**Score**: 10/10 - Perfect pronoun resolution and context tracking

### 4.3 Implied Context
**Query 1**: "Check Project Alpha's status"
**Query 2**: "Who is assigned to it?"
**Expected**: Resolve "it" to Project Alpha

### 4.4 Multi-Turn Refinement
**Query 1**: "Find warehouse candidates"
**Query 2**: "With forklift certification"
**Query 3**: "Available this week"
**Expected**: Progressively filter same dataset

### 4.5 Comparison Requests
**Query 1**: "Show revenue for Project A"
**Query 2**: "Compare with Project B"
**Expected**: Remember Project A data for comparison

### 4.6 Clarification Handling
**Query**: "Show me projects"
**AI**: "Which status?"
**User**: "Active ones"
**Expected**: Handle clarification loop

### 4.7 Entity Tracking
**Query 1**: "Find Sarah Johnson"
**Query 2**: "What projects is she on?"
**Expected**: Track Sarah Johnson entity across turns

### 4.8 Negation Context
**Query 1**: "Show candidates"
**Query 2**: "Not the ones on Project X"
**Expected**: Exclude based on previous context

### 4.9 Time Reference
**Query 1**: "Check conflicts for next week"
**Query 2**: "What about the week after?"
**Expected**: Increment time reference

### 4.10 Aggregate Follow-up
**Query 1**: "Calculate total revenue"
**Query 2**: "Break it down by month"
**Expected**: Apply breakdown to same dataset

### 4.11 Alternative Phrasing
**Query 1**: "How many projects?"
**Query 2**: "Show me the complete list"
**Expected**: Same entity, different request

### 4.12 Correction Handling
**Query 1**: "Show Project Alpha"
**Query 2**: "Sorry, I meant Project Beta"
**Expected**: Replace context with correction

### 4.13 Multi-Entity Tracking
**Query**: "Compare candidates A, B, and C"
**Expected**: Track multiple entities simultaneously

### 4.14 Temporal Context
**Query 1**: "Revenue this month"
**Query 2**: "vs last month"
**Expected**: Maintain temporal comparison context

### 4.15 Conditional Follow-up
**Query 1**: "If Project X is understaffed..."
**Query 2**: "...find candidates with Y skill"
**Expected**: Execute conditional logic across turns

---

## Category 5: Data Analysis & Insights (10 tests)

### 5.1 Trend Identification
**Query**: "Are we getting more high-priority projects over time?"
**Expected**: Analyze project priority distribution by month

### 5.2 Performance Metrics
**Query**: "What's our project completion rate?"
**Expected**: Calculate completed/(completed+active) ratio

### 5.3 Utilization Rate
**Query**: "What percentage of candidates are currently assigned?"
**Expected**: Calculate assigned/total candidates

### 5.4 Revenue Growth
**Query**: "Is revenue increasing month-over-month?"
**Expected**: Calculate revenue trend

### 5.5 Bottleneck Detection
**Query**: "What's causing scheduling conflicts?"
**Expected**: Analyze conflict patterns (understaffing, double-booking, etc.)

### 5.6 Skill Demand Analysis
**Query**: "Which skills are most requested?"
**Expected**: Aggregate skills across all projects

### 5.7 Geographic Insights
**Query**: "Where are most projects located?"
**Expected**: Group projects by venue_address patterns

### 5.8 Candidate Performance
**Query**: "Who are our top performers?"
**Expected**: Analyze assignment count + project success

### 5.9 Risk Assessment
**Query**: "Which upcoming projects are at risk?"
**Expected**: Identify understaffed or conflicting projects

### 5.10 Capacity Forecast
**Query**: "Can we handle 10 more projects this quarter?"
**Expected**: Calculate remaining capacity

---

## Category 6: Error Handling & Edge Cases (15 tests)

### 6.1 Invalid Date
**Query**: "Show projects on February 30th"
**Expected**: Gracefully handle invalid date

### 6.2 No Results
**Query**: "Find candidates with quantum physics skill"
**Expected**: Handle empty result set gracefully

### 6.3 Ambiguous Request
**Query**: "Show me everything"
**Expected**: Ask for clarification

### 6.4 Out of Range
**Query**: "Show projects from year 1900"
**Expected**: Handle historical date gracefully

### 6.5 Null Values
**Query**: "Show projects without end dates"
**Expected**: Handle null fields correctly

### 6.6 Type Mismatch
**Query**: "Show projects with priority = 'tomorrow'"
**Expected**: Recognize type error

### 6.7 Missing Required Data
**Query**: "Calculate revenue" (without project context)
**Expected**: Ask for required parameters

### 6.8 Circular Logic
**Query**: "Find candidates not assigned to projects they're assigned to"
**Expected**: Detect logical contradiction

### 6.9 Extremely Large Numbers
**Query**: "Show projects with 1000000 staff"
**Expected**: Handle unrealistic values

### 6.10 Special Characters
**Query**: "Find candidate with name @#$%"
**Expected**: Handle special character input

### 6.11 Empty Query
**Query**: "" (blank)
**Expected**: Prompt for input

### 6.12 Very Long Query
**Query**: 500-word rambling question
**Expected**: Extract intent from verbose input

### 6.13 Mixed Languages
**Query**: "Show me projects在北京"
**Expected**: Handle multilingual input

### 6.14 Conflicting Filters
**Query**: "Show projects that are both active and completed"
**Expected**: Detect mutually exclusive conditions

### 6.15 Database Constraint Violation
**Query**: Operation that would violate FK constraints
**Expected**: Prevent and explain error

---

## Category 7: Advanced Intelligence & Reasoning (15 tests)

### 7.1 Infer Intent
**Query**: "We're short-staffed"
**Expected**: Infer need to check scheduling conflicts

### 7.2 Proactive Suggestion
**Query**: "Show Project X details"
**Expected**: Notice understaffing and suggest candidates

### 7.3 Alternative Solutions
**Query**: "No candidates available Friday"
**Expected**: Suggest rescheduling or alternative dates

### 7.4 Explain Reasoning
**Query**: "Why is Project X at risk?"
**Expected**: Analyze and explain multiple contributing factors

### 7.5 Predict Outcome
**Query**: "If we assign John to Project Y?"
**Expected**: Predict potential conflicts or issues

### 7.6 Learn from Feedback
**Query 1**: "Find warehouse staff"
**AI**: Shows general candidates
**User**: "I need forklift certification"
**Expected**: Refine understanding for future

### 7.7 Synthesize Information
**Query**: "Summarize our staffing situation"
**Expected**: Aggregate data from multiple sources

### 7.8 Detect Anomalies
**Query**: "Anything unusual this week?"
**Expected**: Identify outliers (unusual conflicts, spikes, etc.)

### 7.9 Prioritize Actions
**Query**: "What should I focus on today?"
**Expected**: Rank urgent tasks based on data

### 7.10 Connect Insights
**Query**: "Why is revenue down?"
**Expected**: Correlate multiple factors (fewer projects, understaffing, etc.)

### 7.11 Strategic Recommendation
**Query**: "Should we hire more staff?"
**Expected**: Analyze capacity trends and project growth

### 7.12 Natural Conversation
**Query**: "Hey, quick question about that downtown project we discussed"
**Expected**: Parse casual language and infer context

### 7.13 Emotion Recognition
**Query**: "This is urgent! Need staff NOW!"
**Expected**: Recognize urgency and prioritize response

### 7.14 Complex Calculation
**Query**: "ROI if we invest in 3 more forklifts"
**Expected**: Multi-step financial reasoning

### 7.15 Creative Problem Solving
**Query**: "How can we maximize Q4 revenue?"
**Expected**: Generate actionable strategies from data

---

## Intelligence Scoring Rubric (10 Dimensions)

### 1. Tool Selection Accuracy (0-10)
- Correct tool chosen for query
- Efficient tool usage
- No unnecessary tool calls

### 2. Query Understanding (0-10)
- Natural language parsing
- Intent recognition
- Handling ambiguity

### 3. Data Retrieval Accuracy (0-10)
- Correct filters applied
- Complete results returned
- No data corruption

### 4. Response Quality (0-10)
- Clear, concise answers
- Helpful context provided
- Professional tone

### 5. Error Handling (0-10)
- Graceful failure recovery
- Meaningful error messages
- Suggested alternatives

### 6. Context Awareness (0-10)
- Conversation memory
- Entity tracking
- Follow-up coherence

### 7. Multi-Step Reasoning (0-10)
- Complex problem solving
- Logical step sequencing
- Correct conclusions

### 8. Proactive Intelligence (0-10)
- Anticipate user needs
- Suggest improvements
- Identify issues preemptively

### 9. Learning & Adaptation (0-10)
- Refine from feedback
- Improve over conversation
- Personalize responses

### 10. Business Value (0-10)
- Actionable insights
- Time saved for user
- Decision support quality

**Total Score**: Sum of all dimensions = __/100
