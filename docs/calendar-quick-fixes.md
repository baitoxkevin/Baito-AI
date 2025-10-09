# Calendar Quick Fixes - Implementation Guide

**Priority:** Critical Blockers
**Estimated Time:** 1-2 hours
**Impact:** Immediately fixes broken calendar display

---

## Issue 1: Calendar Grid Not Visible (CRITICAL)

### Problem
Debug and test elements are rendering OVER the actual calendar grid, making it completely invisible.

**File:** `src/components/CalendarView.tsx`
**Lines:** 893-905

### Fix: Delete Debug Code

```typescript
// ❌ DELETE THESE LINES (893-905)

{/* Debug info */}
<div className="col-span-7 text-center py-2 bg-red-100 border border-red-500">
  <p className="text-red-800 text-xs">
    DEBUG: Rendering {daysInMonth.length} calendar days for {format(date, 'MMMM yyyy')}
  </p>
</div>

{/* Test grid cells - if these don't show, grid is broken */}
{Array.from({ length: 7 }, (_, i) => (
  <div key={`test-${i}`} className="bg-yellow-200 border-2 border-yellow-500 h-20 flex items-center justify-center">
    <span className="text-yellow-800 font-bold">TEST {i + 1}</span>
  </div>
))}
```

### After Deletion

The code should jump directly from the day headers to the calendar days:

```typescript
          {/* Day headers */}
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day) => (
            <div
              key={day}
              className="h-5 sm:h-6 flex items-center justify-center..."
            >
              <span className="text-[10px] sm:text-xs font-medium...">
                {day}
              </span>
            </div>
          ))}

          {/* Calendar days */}  ← Should come right after headers
          {daysInMonth.map((day, index) => {
            // ... calendar day rendering
          })}
```

**Result:** Calendar grid will be immediately visible with proper cells.

---

## Issue 2: List View Not Showing Today

### Problem
Auto-scroll logic redirects users away from today's date when the current month has no projects.

**File:** `src/pages/CalendarPage.tsx`
**Lines:** 341-356

### Current Code (REMOVE THIS)

```typescript
// IMPORTANT: Check if current month has no projects but other months do have projects
if (results[0].length === 0 && allProjects.length > 0) {
  console.log("Current month has no projects, but other months do - adjusting view");

  // Determine which month to target (prefer most recent past month with projects)
  const targetMonthOffset = earliestMonthWithProjects !== null ? earliestMonthWithProjects : 0;

  // Store target month for auto-scrolling after render
  window.sessionStorage.setItem('calendarAutoScrollTarget',
    JSON.stringify({
      targetMonth: targetMonthOffset,
      hasProjects: allProjects.length > 0,
      // Add a timestamp to prevent stale data
      timestamp: Date.now()
    })
  );
  console.log(`Set auto-scroll target to month offset: ${targetMonthOffset}`);
}
```

### Replace With (SIMPLE VERSION)

```typescript
// Always scroll to today's month - don't jump to other months
console.log(`Initial list view load with ${allProjects.length} total projects`);

// Set a flag to scroll to today's section after render
window.sessionStorage.setItem('calendarAutoScrollTarget',
  JSON.stringify({
    targetMonth: 0, // Always target current month
    scrollToToday: true,
    timestamp: Date.now()
  })
);
```

### Additional Changes in Same File

**Find and update all similar blocks:**

Lines 562-578 (in `handlePrevMonthOld`)
Lines 706-722 (in `handleNextMonth`)
Lines 851-867 (in `handleTodayClick`)
Lines 985-1001 (in `handleRefresh`)

**Replace all instances of:**
```typescript
const targetMonthOffset = earliestMonthWithProjects !== null ? earliestMonthWithProjects : 0;
```

**With:**
```typescript
const targetMonthOffset = 0; // Always center on current month
```

**Result:** List view will always show today's date, even when current month has no projects.

---

## Issue 3: Add Time Display to Events

### Problem
Events in calendar cells don't show time information, making it hard to understand schedules at a glance.

**File:** `src/components/CalendarView.tsx`
**Lines:** 1161-1203 (EventBlock rendering)

### Current Code

```typescript
<div
  className={cn(
    `rounded-md border shadow-sm px-2 py-0.5 truncate cursor-pointer day-single-event`,
    //... rest of classes
  )}
  style={{ /* ... */ }}
>
  <div className="w-2 h-2 rounded-full bg-current opacity-90 flex-shrink-0" />
  <div className="truncate text-[11px] leading-[14px]">
    {project.title}
  </div>
</div>
```

### Enhanced Code (WITH TIME)

```typescript
<div
  className={cn(
    `rounded-md border shadow-sm px-2 py-0.5 cursor-pointer day-single-event`,
    "flex flex-col gap-0.5", // Changed: now column layout for time + title
    //... rest of classes
  )}
  style={{
    height: '32px', // Increased from 22px for time display
    /* ... rest of styles ... */
  }}
>
  {/* Time display */}
  <div className="flex items-center gap-1 text-[9px] opacity-75 font-medium">
    <Clock size={8} className="flex-shrink-0" />
    <span>
      {formatTimeString(project.working_hours_start).slice(0, -3)} {/* "9:00" instead of "9:00 AM" */}
    </span>
  </div>

  {/* Title */}
  <div className="truncate text-[11px] leading-[14px] font-medium">
    {project.title}
  </div>
</div>
```

### Import Required

Add at the top of CalendarView.tsx if not already present:

```typescript
import { Clock } from 'lucide-react';
```

**Result:** Events will show time information, making the calendar more useful at a glance.

---

## Verification Checklist

After making these changes, verify:

- [ ] Calendar grid is visible (no debug elements)
- [ ] Can see all 7 columns (M-T-W-T-F-S-S)
- [ ] Can see all 6 rows of dates
- [ ] Events are displaying within cells
- [ ] List view shows today's date on load
- [ ] Events show time information
- [ ] Multi-day events still render as bars
- [ ] Single-day events show in cells

---

## Testing Instructions

### Test 1: Calendar View Visibility
1. Navigate to `/calendar/view`
2. **Expected:** See full calendar grid with dates
3. **Expected:** See events displayed in cells
4. **NOT Expected:** See "DEBUG:" or "TEST 1" messages

### Test 2: List View Today
1. Navigate to `/calendar/list`
2. **Expected:** Page scrolls to current month/today
3. **Expected:** Can see today's date highlighted
4. **NOT Expected:** Page jumps to a past month

### Test 3: Event Time Display
1. Look at calendar cells with events
2. **Expected:** See time displayed (e.g., "9:00")
3. **Expected:** See event title below time
4. **Expected:** Can read both time and title

---

## Rollback Plan

If issues occur after these changes:

```bash
# Rollback to previous version
git checkout HEAD~1 src/components/CalendarView.tsx
git checkout HEAD~1 src/pages/CalendarPage.tsx

# Or create a backup before changes
cp src/components/CalendarView.tsx src/components/CalendarView.tsx.backup
cp src/pages/CalendarPage.tsx src/pages/CalendarPage.tsx.backup
```

---

## Next Phase

After these critical fixes are deployed:

1. **Phase 2:** Implement adaptive event display (full/compact/mini modes)
2. **Phase 3:** Add hover cards for rich event details
3. **Phase 4:** Responsive design improvements

See `calendar-ux-improvements.md` for complete roadmap.

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify all debug code was removed
3. Ensure imports are correct (Clock icon)
4. Clear cache and hard refresh (Cmd+Shift+R)

