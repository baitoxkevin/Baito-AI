# Sick Leave & Replacement System
## Implementation Plan

---

## 📋 **System Overview**

When a crew member calls in sick:
1. Crew reports via mobile app with OTP verification
2. System notifies Project PIC immediately
3. PIC reviews and approves sick leave
4. System finds top 5 replacement candidates (algorithm)
5. PIC selects preferred replacement
6. Replacement receives offer and accepts/declines
7. If accepted, replacement is tagged and assigned to project
8. Visual indicators show replacement status in project views

---

## 🗄️ **Database Schema**

### **New Tables**

#### `sick_leaves`
```sql
CREATE TABLE sick_leaves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Who & What
  crew_id UUID REFERENCES crew_members(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES project_crew_assignments(id),

  -- When
  sick_date DATE NOT NULL,
  sick_date_end DATE, -- For multi-day sick leaves

  -- Why
  reason TEXT,
  sick_note_url TEXT, -- Uploaded medical certificate

  -- Verification
  verification_status VARCHAR(20) DEFAULT 'pending', -- pending/verified/rejected
  verification_otp VARCHAR(6),
  otp_sent_at TIMESTAMPTZ,
  otp_verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id), -- Manager who approved

  -- Replacement Status
  replacement_status VARCHAR(20) DEFAULT 'pending', -- pending/finding/assigned/failed
  replacement_crew_id UUID REFERENCES crew_members(id),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sick_leaves_crew ON sick_leaves(crew_id);
CREATE INDEX idx_sick_leaves_project ON sick_leaves(project_id);
CREATE INDEX idx_sick_leaves_date ON sick_leaves(sick_date);
CREATE INDEX idx_sick_leaves_status ON sick_leaves(verification_status);
```

#### `replacement_requests`
```sql
CREATE TABLE replacement_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- References
  sick_leave_id UUID REFERENCES sick_leaves(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  original_crew_id UUID REFERENCES crew_members(id),
  target_crew_id UUID REFERENCES crew_members(id),

  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending/accepted/declined/expired

  -- Matching
  match_score DECIMAL(5,2), -- 0-100 score from algorithm
  distance_km DECIMAL(6,2),
  skill_match_score INTEGER,
  availability_score INTEGER,

  -- Timeline
  offered_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- 30 minutes from offered_at

  -- Notes
  pic_notes TEXT,
  crew_decline_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_replacement_requests_sick_leave ON replacement_requests(sick_leave_id);
CREATE INDEX idx_replacement_requests_target ON replacement_requests(target_crew_id);
CREATE INDEX idx_replacement_requests_status ON replacement_requests(status);
```

### **Updated Tables**

#### `project_crew_assignments` (Add columns)
```sql
ALTER TABLE project_crew_assignments
ADD COLUMN is_replacement BOOLEAN DEFAULT FALSE,
ADD COLUMN replacing_crew_id UUID REFERENCES crew_members(id),
ADD COLUMN replacement_reason VARCHAR(50), -- sick/emergency/no-show
ADD COLUMN original_assignment_id UUID REFERENCES project_crew_assignments(id);

CREATE INDEX idx_assignments_replacement ON project_crew_assignments(is_replacement);
CREATE INDEX idx_assignments_replacing ON project_crew_assignments(replacing_crew_id);
```

---

## 🎯 **Replacement Matching Algorithm**

### Scoring Formula:
```typescript
interface MatchScore {
  availability: number      // 30% weight
  skillMatch: number        // 25% weight
  distance: number          // 20% weight
  pastPerformance: number   // 15% weight
  projectFamiliarity: number // 10% weight
}

totalScore = (
  availability * 0.30 +
  skillMatch * 0.25 +
  distance * 0.20 +
  pastPerformance * 0.15 +
  projectFamiliarity * 0.10
)
```

### Criteria:

1. **Availability (30%)**
   - Completely free on the date = 100
   - Has other projects but manageable = 70
   - Busy but might accept = 40

2. **Skill Match (25%)**
   - Exact same role = 100
   - Similar role/experience = 75
   - Different but capable = 50

3. **Distance from Venue (20%)**
   - < 5 km = 100
   - 5-10 km = 80
   - 10-20 km = 60
   - > 20 km = 30

4. **Past Performance (15%)**
   - Average rating from previous projects
   - 5 stars = 100
   - 4 stars = 80
   - 3 stars = 60

5. **Project Familiarity (10%)**
   - Worked on this project before = 100
   - Worked with this client = 70
   - Never worked together = 50

---

## 📱 **UI Components to Build**

### 1. **Crew - Sick Leave Reporting Form**
Location: `/pages/ReportSickLeavePage.tsx` (Mobile-first)

Features:
- Date picker (single or range)
- Project selector
- Reason text field
- File upload for sick note
- OTP verification
- Confirmation screen

### 2. **PIC - Sick Leave Alert Card**
Location: Dashboard widget

Features:
- Real-time notification
- Sick crew details
- Project impact summary
- Quick actions: Approve/Reject/Find Replacement

### 3. **PIC - Replacement Selection Interface**
Location: Modal/Drawer component

Features:
- Top 5 ranked candidates
- Score breakdown visualization
- Candidate details card
- One-click selection
- Manual search fallback

### 4. **Replacement - Offer Notification**
Location: Mobile notification + page

Features:
- Project details
- Pay rate
- Accept/Decline buttons
- 30-minute countdown timer
- Map to venue

---

## 🏷️ **Visual Indicators - Replacement Tags**

### Location 1: **SpotlightCard Component**
```tsx
// Show replacement badge next to crew name
<Badge variant="warning" className="ml-2">
  🔄 Replacement
</Badge>

// Tooltip with details
<Tooltip>
  <TooltipTrigger>🔄</TooltipTrigger>
  <TooltipContent>
    Replacing: Jane Smith (Sick Leave)
    Confirmed: 2 hours ago
  </TooltipContent>
</Tooltip>
```

### Location 2: **Schedule Component**
```tsx
// In calendar/schedule view, show distinct styling
<div className={cn(
  "crew-assignment",
  isReplacement && "border-l-4 border-orange-500 bg-orange-50"
)}>
  {crew.name}
  {isReplacement && (
    <Badge size="sm" variant="secondary">R</Badge>
  )}
</div>
```

### Location 3: **Staffing Section**
```tsx
// Staffing list with replacement context
<div className="staff-member">
  <Avatar src={crew.avatar} />
  <div>
    <span>{crew.name}</span>
    {assignment.is_replacement && (
      <div className="text-xs text-orange-600">
        ↳ Replacing {originalCrew.name}
      </div>
    )}
  </div>
  {assignment.is_replacement && (
    <Badge variant="outline" className="border-orange-500 text-orange-700">
      Replacement
    </Badge>
  )}
</div>
```

---

## 🔔 **Notification System**

### SMS Template (PIC Alert):
```
🚨 SICK LEAVE ALERT

Crew: [Name]
Project: [Project Name]
Date: [Date]
Shift: [Start - End Time]

Action Required:
Review and find replacement

[Open App] [Call Crew]
```

### Email Template (PIC):
```html
Subject: [URGENT] Sick Leave - [Project Name]

Hi [PIC Name],

[Crew Name] has reported sick for [Project Name] on [Date].

Project Details:
• Venue: [Location]
• Time: [Start - End]
• Role: [Position]

We've found 5 potential replacements ranked by suitability.

[REVIEW REPLACEMENTS] [APPROVE SICK LEAVE]

Thanks,
Baito-AI System
```

### Push Notification (Replacement Offer):
```
🔔 Replacement Opportunity

[Project Name] - [Date]
Pay: $[Amount] | [Duration] hours
Location: [Venue] ([Distance] km away)

[ACCEPT] [DECLINE] [DETAILS]

⏰ Respond in 30 minutes
```

---

## 🔄 **Complete Workflow Diagram**

```
1. CREW REPORTS SICK (Mobile App)
   ├─ Fill form (date, project, reason)
   ├─ Upload sick note (optional)
   └─ Request OTP
        ↓
2. OTP VERIFICATION
   ├─ SMS sent to crew phone
   ├─ Crew enters OTP
   └─ System validates
        ↓
3. PIC NOTIFICATION (Instant)
   ├─ SMS alert
   ├─ Email alert
   ├─ App push notification
   └─ Dashboard badge
        ↓
4. PIC REVIEWS
   ├─ View sick leave details
   ├─ Check sick note
   ├─ Approve or Reject
   └─ If approved → Find Replacement
        ↓
5. SYSTEM FINDS REPLACEMENTS
   ├─ Query available crew
   ├─ Calculate match scores
   ├─ Rank top 5 candidates
   └─ Show to PIC
        ↓
6. PIC SELECTS REPLACEMENT
   ├─ Review ranked list
   ├─ See score breakdown
   ├─ Select preferred candidate
   └─ Confirm selection
        ↓
7. SEND OFFER TO REPLACEMENT
   ├─ Push notification
   ├─ SMS with details
   ├─ 30-minute expiry timer
   └─ Wait for response
        ↓
8. REPLACEMENT RESPONDS
   ├─ ACCEPTS
   │   ├─ Assign to project
   │   ├─ Tag as replacement
   │   ├─ Update schedule
   │   ├─ Notify PIC (success)
   │   └─ Show replacement badge
   │
   └─ DECLINES
       ├─ Record decline reason
       ├─ Mark request as declined
       └─ Return to Step 6 (next candidate)
        ↓
9. NO SUITABLE REPLACEMENT FOUND
   ├─ All 5 declined or unavailable
   ├─ Escalate to PIC
   ├─ Manual search option
   └─ Or cancel project slot
```

---

## 📊 **Analytics & Reporting**

Track the following metrics:

1. **Sick Leave Statistics**
   - Total sick leaves per month
   - Average sick leave duration
   - Repeat offenders (fraud detection)
   - Sick leave by project type

2. **Replacement Efficiency**
   - Average time to find replacement
   - Acceptance rate per candidate rank
   - Cost of replacements vs. regular crew
   - Success rate by project type

3. **Crew Reliability Score**
   - Sick leave frequency
   - Last-minute cancellations
   - Replacement availability
   - Overall reliability rating

---

## 🚀 **Implementation Phases**

### **Phase 1: Core Functionality (This Sprint)**
- [ ] Database schema & migrations
- [ ] Sick leave reporting form (mobile)
- [ ] OTP verification system
- [ ] PIC notification system
- [ ] Replacement tags in UI (SpotlightCard, Schedule, Staffing)

### **Phase 2: Replacement Automation (Next Sprint)**
- [ ] Matching algorithm
- [ ] PIC selection interface
- [ ] Replacement offer system
- [ ] Acceptance/decline workflow

### **Phase 3: Advanced Features (Future)**
- [ ] Machine learning for better matching
- [ ] Predictive sick leave patterns
- [ ] Automated escalation
- [ ] Comprehensive analytics dashboard

---

## 🔐 **Security & Compliance**

1. **Data Privacy**
   - Sick notes stored securely in Supabase Storage
   - Access restricted to HR and managers
   - GDPR-compliant data retention

2. **Fraud Prevention**
   - OTP verification mandatory
   - Track IP addresses and timestamps
   - Flag suspicious patterns
   - Require manager approval

3. **Audit Trail**
   - Log all actions (report, approve, assign)
   - Immutable record of changes
   - Compliance reporting

---

## ✅ **Acceptance Criteria**

System is ready when:
- ✅ Crew can report sick leave via mobile
- ✅ OTP verification works reliably
- ✅ PIC receives instant notifications
- ✅ PIC can approve/reject sick leave
- ✅ System suggests top 5 replacements
- ✅ PIC can select replacement
- ✅ Replacement tags visible in all 3 locations
- ✅ Replacement can accept/decline offer
- ✅ Assignment updated with replacement flag
- ✅ All data persisted correctly

---

**Last Updated:** 2025-10-03
**Status:** Ready for Implementation
**Estimated Time:** 2-3 weeks for full system
