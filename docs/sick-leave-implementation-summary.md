# Sick Leave & Replacement System - Implementation Summary

## 🎯 **What We've Built Today**

We've brainstormed and implemented **Phase 1** of the comprehensive sick leave and replacement workflow system.

---

## ✅ **Completed Tasks**

### 1. **Database Schema Design** ✅
Created complete database migration with:
- `sick_leaves` table - Tracks all sick leave reports
- `replacement_requests` table - Manages replacement offers and responses
- Updated `project_crew_assignments` table - Added replacement flags
- RLS policies for security
- Helper functions and triggers
- Useful views for queries

**File:** `/supabase/migrations/20250103_sick_leave_replacement_system.sql`

### 2. **System Documentation** ✅
Created comprehensive implementation plan including:
- Complete workflow diagram
- Database schema documentation
- Replacement matching algorithm specification
- UI/UX design guidelines
- Notification templates
- Analytics requirements
- 3-phase implementation roadmap

**File:** `/docs/sick-leave-replacement-system.md`

### 3. **Replacement Tags in Staffing Section** ✅
Updated `StaffingTab.tsx` to display replacement information:

**Interface Updates:**
```typescript
interface StaffMember {
  // ... existing fields
  isReplacement?: boolean;
  replacingCrewId?: string;
  replacingCrewName?: string;
  replacementReason?: 'sick' | 'emergency' | 'no-show' | 'other';
  replacementConfirmedAt?: Date;
}
```

**Visual Indicator:**
- Orange replacement badge next to "Confirmed" status
- Hover tooltip showing:
  - Who they're replacing
  - Reason for replacement
  - When it was confirmed
- Responsive flex-wrap layout

**Example Display:**
```
[✓ Confirmed] [🔄 Replacement]
```

**Tooltip Content:**
```
Replacement Crew
Replacing: Jane Smith
Reason: Sick
Confirmed: Jan 3, 2025, 2:30 PM
```

**File:** `/src/components/project-form/StaffingTab.tsx`

---

## 📊 **System Workflow (As Designed)**

```
1. CREW REPORTS SICK
   ├─ Mobile app form
   ├─ Select project + date
   ├─ Upload sick note (optional)
   └─ OTP verification
        ↓
2. PIC NOTIFICATION
   ├─ SMS alert
   ├─ Email alert
   └─ App notification
        ↓
3. PIC APPROVAL
   ├─ Review sick leave
   ├─ Approve or reject
   └─ If approved → Find replacement
        ↓
4. SYSTEM FINDS REPLACEMENTS
   ├─ Match algorithm (5 factors)
   ├─ Rank top 5 candidates
   └─ Show to PIC
        ↓
5. PIC SELECTS CANDIDATE
   ├─ Review ranked list
   └─ Select preferred
        ↓
6. SEND OFFER TO REPLACEMENT
   ├─ Push notification
   ├─ 30-minute timer
   └─ Wait for response
        ↓
7. IF ACCEPTED
   ├─ Assign to project
   ├─ Tag as replacement
   ├─ Update schedule
   └─ Show replacement badge
```

---

## 🔍 **Replacement Matching Algorithm**

### Scoring Formula:
```typescript
totalScore = (
  availability * 0.30 +     // 30% - Is crew free?
  skillMatch * 0.25 +       // 25% - Right role?
  distance * 0.20 +         // 20% - How close?
  pastPerformance * 0.15 +  // 15% - Good ratings?
  projectFamiliarity * 0.10 // 10% - Worked here before?
)
```

### Criteria Breakdown:

1. **Availability (30%)**
   - Completely free = 100
   - Can manage = 70
   - Busy = 40

2. **Skill Match (25%)**
   - Exact role = 100
   - Similar = 75
   - Capable = 50

3. **Distance (20%)**
   - < 5km = 100
   - 5-10km = 80
   - 10-20km = 60
   - > 20km = 30

4. **Past Performance (15%)**
   - 5 stars = 100
   - 4 stars = 80
   - 3 stars = 60

5. **Project Familiarity (10%)**
   - Same project before = 100
   - Same client = 70
   - New = 50

---

## 📍 **Where Replacement Tags Appear**

### 1. ✅ **Staffing Tab** (IMPLEMENTED)
**Location:** Project Form → Staffing Tab

**Visual:**
- Orange border badge: "🔄 Replacement"
- Appears next to "Confirmed" badge
- Tooltip with full details on hover

**Status:** ✅ Complete

---

### 2. ⏳ **SpotlightCard** (PENDING)
**Location:** Spotlight Card → Overview Tab

**Planned Visual:**
- Team members list with replacement badges
- Subtle orange indicator
- Tooltip with replacement context

**Status:** ⏳ Pending (awaits crew member listing in spotlight)

---

### 3. ⏳ **Schedule View** (PENDING)
**Location:** Calendar → Schedule View

**Planned Visual:**
- Orange border-left on replacement assignments
- "R" badge in calendar cells
- Different background color (orange-50)
- Tooltip showing replacement details

**Status:** ⏳ Pending (awaits schedule component integration)

---

## 📁 **Files Modified/Created**

### Created:
1. `/supabase/migrations/20250103_sick_leave_replacement_system.sql`
2. `/docs/sick-leave-replacement-system.md`
3. `/docs/sick-leave-implementation-summary.md` (this file)

### Modified:
1. `/src/components/project-form/StaffingTab.tsx`
   - Added replacement fields to `StaffMember` interface
   - Added replacement badge display
   - Added replacement tooltip

---

## 🚀 **Next Steps (Remaining Implementation)**

### **Phase 1 Remaining:**
- [ ] Sick leave reporting form (mobile)
- [ ] OTP verification system
- [ ] PIC notification system
- [ ] Replacement tags in Schedule view

### **Phase 2:**
- [ ] Replacement matching algorithm
- [ ] PIC replacement selection interface
- [ ] Replacement offer system
- [ ] Accept/decline workflow

### **Phase 3:**
- [ ] Machine learning for matching
- [ ] Predictive analytics
- [ ] Automated escalation
- [ ] Analytics dashboard

---

## 🎨 **Design Specifications**

### **Color Scheme:**
- **Replacement Badge:** Orange (`orange-500`, `orange-700`)
- **Background:** `orange-50` (light), `orange-900/20` (dark)
- **Border:** `border-orange-500`
- **Icon:** 🔄 (cycle emoji)

### **Typography:**
- **Badge Font:** Medium weight
- **Tooltip Title:** Semibold, orange-600
- **Details:** Regular, small text

### **Spacing:**
- **Badge Padding:** `px-2 py-1`
- **Gap Between Badges:** `gap-2`
- **Tooltip Spacing:** `space-y-1`

---

## 💡 **Key Decisions Made**

1. **✅ Sick Leave Reporting:** Mobile Self-Service (Option A)
2. **✅ Verification:** Manager Approval (Option B)
3. **✅ Replacement Selection:** Semi-Automatic - PIC selects from ranked list (Option B)
4. **✅ Notifications:** PIC + HR only (not other crew)
5. **✅ Visual Tags:** Orange replacement badges in:
   - ✅ Staffing Tab
   - ⏳ SpotlightCard
   - ⏳ Schedule

---

## 📊 **Database Tables**

### **sick_leaves**
- Stores all sick leave reports
- Tracks verification status
- Links to replacement crew
- Includes OTP verification data

### **replacement_requests**
- Tracks each replacement offer
- Stores match scores
- Records accept/decline responses
- Manages expiry (30 minutes)

### **project_crew_assignments (updated)**
- New: `is_replacement` boolean
- New: `replacing_crew_id` reference
- New: `replacement_reason` enum
- New: `original_assignment_id` reference

---

## 🔐 **Security Features**

1. **OTP Verification:** 6-digit code via SMS
2. **Manager Approval:** Required before replacement
3. **RLS Policies:** Row-level security on all tables
4. **Audit Trail:** All actions logged with timestamps
5. **Data Privacy:** Sick notes stored securely in Supabase Storage

---

## 📈 **Success Metrics (To Track)**

1. **Response Time:** Average time from sick report to replacement assigned
2. **Match Success Rate:** % of first-choice replacements that accept
3. **PIC Satisfaction:** Feedback on matching quality
4. **Crew Reliability:** Track sick leave patterns
5. **System Usage:** Adoption rate of mobile reporting

---

## 🎯 **Ready for Production When:**

- [x] Database schema created
- [x] RLS policies configured
- [ ] Mobile sick leave form built
- [ ] OTP verification implemented
- [ ] PIC notification system active
- [ ] Replacement tags visible in all 3 locations
- [ ] Matching algorithm functional
- [ ] Acceptance workflow complete
- [ ] Testing completed
- [ ] Documentation finalized

---

## 📞 **Support & Maintenance**

### **Monitoring:**
- Track daily sick leave reports
- Monitor replacement success rates
- Alert on high sick leave frequency
- Review matching algorithm performance

### **Maintenance:**
- Weekly: Review flagged sick leaves
- Monthly: Analyze matching accuracy
- Quarterly: Update algorithm weights
- Yearly: Audit compliance

---

**Last Updated:** 2025-10-03
**Status:** Phase 1 In Progress (30% Complete)
**Next Milestone:** Complete mobile sick leave reporting
