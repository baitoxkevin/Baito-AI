# AI Chatbot - Missing Features Analysis

## Executive Summary
The AI chatbot currently has access to **only 6 tools** out of **50+ available database tables** in the system. This means the chatbot can only help with basic project and candidate queries, while most of your business features are not accessible through the AI.

---

## Current AI Capabilities ✅

The AI chatbot **CAN** currently help with:

1. **query_projects** - Search and filter projects
2. **query_candidates** - Search for candidates
3. **get_project_details** - Get specific project information
4. **calculate_revenue** - Calculate revenue for time periods
5. **get_current_datetime** - Get current date/time
6. **check_scheduling_conflicts** - Check for scheduling conflicts

---

## Missing Features ❌

### 1. **Warehouse Management** 🏭
**Tables:** `warehouse_items`, `warehouse_reservations`, `warehouse_checkouts`

**Missing Capabilities:**
- ❌ Query warehouse inventory ("What's in my warehouse?")
- ❌ Check item availability
- ❌ Reserve items for projects
- ❌ Check-in/check-out items
- ❌ View item location (rack/row)
- ❌ View reservation history

**Why This Matters:** You asked "what do i have in my warehouse?" and the AI couldn't answer because it has no access to warehouse tables.

---

### 2. **Expense Claims & Receipts** 💰
**Tables:** `expense_claims`, `receipts`, `payment_batches`, `payment_items`

**Missing Capabilities:**
- ❌ View pending expense claims
- ❌ Check claim status
- ❌ Query receipts by project/staff
- ❌ View payment batch status
- ❌ Approve/reject claims
- ❌ Check expense totals

---

### 3. **Tasks & To-Dos** ✅
**Tables:** `tasks`, `gig_tasks`, `task_comments`, `task_attachments`

**Missing Capabilities:**
- ❌ Create new tasks
- ❌ Query pending tasks
- ❌ Assign tasks to team members
- ❌ Mark tasks complete
- ❌ View task comments/attachments
- ❌ Task templates

---

### 4. **Team & Staff Management** 👥
**Tables:** `users`, `project_staff`, `crew_assignments`

**Missing Capabilities:**
- ❌ View team members
- ❌ Check who's assigned to what project
- ❌ Staff availability checks
- ❌ Performance metrics
- ❌ Staff schedules

---

### 5. **Attendance & Timesheets** ⏰
**Tables:** `attendance`, `gig_attendance`

**Missing Capabilities:**
- ❌ Clock in/out
- ❌ View attendance records
- ❌ Check who's present today
- ❌ Attendance reports
- ❌ Hours worked summaries

---

### 6. **Documents & Files** 📄
**Tables:** `project_documents`, `documents`

**Missing Capabilities:**
- ❌ Search documents
- ❌ Upload files
- ❌ View project documentation
- ❌ Share documents

---

### 7. **Notifications** 🔔
**Tables:** `notifications`

**Missing Capabilities:**
- ❌ View notifications
- ❌ Mark as read
- ❌ Send notifications
- ❌ Notification preferences

---

### 8. **Goals & Objectives** 🎯
**Tables:** `goals` (implied from routes)

**Missing Capabilities:**
- ❌ View goals
- ❌ Track progress
- ❌ Set new goals
- ❌ Goal analytics

---

### 9. **External Gigs** 🌐
**Tables:** `external_gigs`, `gig_categories`

**Missing Capabilities:**
- ❌ Browse available gigs
- ❌ Apply for gigs
- ❌ View gig details
- ❌ Gig recommendations

---

### 10. **Feedback & Performance** ⭐
**Tables:** `candidate_feedback`, `gig_feedback`, `performance_metrics`

**Missing Capabilities:**
- ❌ Submit feedback
- ❌ View ratings
- ❌ Performance reports
- ❌ Feedback history

---

### 11. **Sick Leave Management** 🏥
**Tables:** `sick_leaves`, `replacement_requests`

**Missing Capabilities:**
- ❌ Report sick leave
- ❌ Find replacements
- ❌ Approve sick leave
- ❌ Sick leave reports

---

### 12. **Certifications & Skills** 📜
**Tables:** `certifications`, `language_proficiency`, `physical_capabilities`

**Missing Capabilities:**
- ❌ View candidate certifications
- ❌ Check language skills
- ❌ Physical capability checks
- ❌ Certification expiry tracking

---

## Recommended Priority for Implementation

### **High Priority** 🔴 (Immediate Business Impact)
1. **Warehouse Management** - You're already asking for this
2. **Expense Claims** - Critical for finance
3. **Tasks/To-Dos** - Daily operations
4. **Team Management** - Staff coordination

### **Medium Priority** 🟡 (Important but can wait)
5. **Attendance** - Tracking & reporting
6. **Documents** - Information retrieval
7. **Notifications** - Communication
8. **Goals** - Progress tracking

### **Low Priority** 🟢 (Nice to have)
9. **External Gigs** - Expansion features
10. **Feedback** - Quality improvement
11. **Sick Leave** - HR automation
12. **Certifications** - Compliance tracking

---

## Implementation Roadmap

### Phase 1: Core Business Operations (Week 1-2)
```typescript
// Add these tools to ai-chat/index.ts:

1. query_warehouse_items
2. reserve_warehouse_item
3. query_expense_claims
4. query_tasks
5. assign_task
6. query_team_members
```

### Phase 2: Tracking & Reporting (Week 3-4)
```typescript
7. query_attendance
8. query_documents
9. query_notifications
10. mark_notification_read
```

### Phase 3: Advanced Features (Week 5+)
```typescript
11. query_goals
12. submit_feedback
13. query_external_gigs
14. manage_sick_leave
```

---

## Example: How to Add Warehouse Support

To fix the "what do i have in my warehouse?" issue:

```typescript
// In supabase/functions/ai-chat/index.ts

// Add to AVAILABLE_TOOLS array:
{
  type: 'function',
  function: {
    name: 'query_warehouse',
    description: 'Search warehouse inventory, check availability, and view item details.',
    parameters: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Search by item ID, name, or description'
        },
        status: {
          type: 'string',
          enum: ['available', 'in_use', 'maintenance'],
          description: 'Filter by item status'
        },
        rack_no: {
          type: 'string',
          description: 'Filter by rack number'
        },
        limit: {
          type: 'number',
          default: 20
        }
      }
    }
  }
}

// Add tool implementation:
async function queryWarehouse(args: any, supabase: any) {
  let query = supabase
    .from('warehouse_items')
    .select('*')

  if (args.search) {
    query = query.or(`item_id.ilike.%${args.search}%,name.ilike.%${args.search}%,description.ilike.%${args.search}%`)
  }

  if (args.status) {
    query = query.eq('status', args.status)
  }

  if (args.rack_no) {
    query = query.eq('rack_no', args.rack_no)
  }

  query = query.limit(args.limit || 20)

  const { data, error } = await query
  if (error) throw error

  return {
    items: data,
    total: data.length,
    summary: `Found ${data.length} warehouse items`
  }
}
```

---

## Next Steps

1. **Review this document** with your team
2. **Prioritize features** based on business needs
3. **Create implementation tickets** for each tool
4. **Start with High Priority** items (Warehouse, Expense Claims, Tasks)
5. **Test each tool** thoroughly before moving to next
6. **Update system prompt** to reflect new capabilities

---

## Questions to Consider

1. Which features does your team use most frequently?
2. What questions do users commonly ask the AI that fail?
3. Are there any compliance/audit requirements for certain features?
4. What would provide the most immediate ROI?

---

**Last Updated:** 2025-10-07
**AI Model:** Claude Sonnet 4.5
**Current Tool Count:** 6/50+ tables
