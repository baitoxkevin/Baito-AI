# Calendar Page UX Improvements Specification

**Date:** 2025-10-07
**Author:** Sally (UX Expert)
**Status:** Draft for Review

---

## Executive Summary

The calendar page currently has two critical issues preventing optimal user experience:
1. **List view doesn't center on today's date** - users can't quickly see current day events
2. **Calendar cells don't show enough event details** - unlike Google Calendar's clear information hierarchy

This document provides a comprehensive UX specification to transform the calendar into an intuitive, Google Calendar-inspired interface.

---

## Problem Statement

### Issue 1: List View Navigation

**Current Behavior:**
- Auto-scroll logic (CalendarPage.tsx:341-356) redirects to first month with projects
- If current month has no projects, user is taken away from today
- Unpredictable scrolling creates disorientation

**User Impact:**
- Cannot quickly see today's date
- Loses context of current timeline
- Confusing navigation experience

### Issue 2: Calendar Cell Information Display

**Current Behavior:**
- Debug/test elements visible (CalendarView.tsx:894-905) blocking actual calendar
- Fixed 120px cell height limits event information
- Events shown as small colored bars with truncated titles
- No time information visible in cells
- No hover preview or quick details

**User Impact:**
- Cannot identify events at a glance
- Must click each event to see basic information
- Poor information scent for decision-making
- Inferior to Google Calendar experience

---

## User Research Insights

### Google Calendar Best Practices

**What makes Google Calendar effective:**

1. **Clear Time Display**
   - Event blocks show start time
   - Different lengths indicate duration
   - Color coding for categories

2. **Information Hierarchy**
   - Event title prominently displayed
   - Time shown in event block
   - Location/attendees visible on hover
   - Clear visual weight differences

3. **Hover Interactions**
   - Rich preview card on hover
   - Shows all key details without clicking
   - Quick actions available

4. **Today Indicator**
   - Highly visible "today" marker
   - Different background color
   - Clear visual anchor point

5. **Responsive Design**
   - Adapts to screen size
   - Mobile shows agenda view
   - Desktop shows full grid

---

## Design Solutions

### Solution 1: Fix List View Navigation

#### Design Goal
List view should ALWAYS center on today's date, regardless of event distribution.

#### User Flow
```
User opens calendar → List view loads →
Auto-scrolls to today's date section →
User sees current context immediately
```

#### Implementation Requirements

1. **Remove Auto-Scroll Logic**
   - Delete lines 341-356 in CalendarPage.tsx
   - Remove conditional scrolling to "first month with projects"

2. **Add "Today" Scroll Target**
   ```typescript
   // Always scroll to today on initial load
   const scrollToToday = () => {
     const today = new Date();
     const todayElement = document.getElementById(
       `month-${today.getFullYear()}-${today.getMonth()}`
     );
     todayElement?.scrollIntoView({
       behavior: 'smooth',
       block: 'start'
     });
   };
   ```

3. **Visual "Today" Indicator**
   - Add highlighted background for today's date
   - Use primary color with 10% opacity
   - Include "TODAY" badge

4. **Quick Navigation Controls**
   - "Jump to Today" button always visible
   - Month selector dropdown
   - Keyboard shortcuts (T for Today)

#### Visual Design

```
┌─────────────────────────────────────┐
│  [< Prev]  [October 2025]  [Next >] │
│           [Jump to Today] ⭐         │
├─────────────────────────────────────┤
│                                      │
│  September 2025                      │
│  ├─ 30 Mon - Project Alpha           │
│  └─ 31 Tue - Project Beta            │
│                                      │
│  October 2025 ⭐ THIS MONTH          │
│  ├─ 01 Wed - Project Gamma           │
│  ├─ 02 Thu - Project Delta           │
│  ├─ 07 Tue ← TODAY                   │ 🎯 Highlighted
│  │   └─ Project Echo (9:00 AM)       │
│  │   └─ Project Foxtrot (2:00 PM)    │
│  └─ 15 Wed - Project Hotel           │
│                                      │
│  November 2025                       │
│  └─ 01 Fri - Project India           │
└─────────────────────────────────────┘
```

---

### Solution 2: Enhanced Calendar Cell Design

#### Design Goal
Transform calendar cells to show event details clearly, inspired by Google Calendar.

#### Remove Debug Elements

**CRITICAL:** Delete debug code immediately
```typescript
// DELETE THESE LINES (894-905 in CalendarView.tsx)
// <!-- Debug info -->
// <div className="col-span-7 text-center py-2 bg-red-100 border border-red-500">
// ...
// </div>
//
// <!-- Test grid cells -->
// {Array.from({ length: 7 }, (_, i) => (
//   <div key={`test-${i}`} ...>TEST {i + 1}</div>
// ))}
```

#### Enhanced Event Display

**1. Event Block Design**

```typescript
interface EventBlockProps {
  project: Project;
  displayMode: 'full' | 'compact' | 'mini';
}

// Full mode (desktop, cells with space)
<div className="event-block">
  <div className="event-time">9:00 AM</div>
  <div className="event-title">Project Alpha</div>
  <div className="event-meta">
    <MapPin size={12} /> Downtown
  </div>
</div>

// Compact mode (medium cells)
<div className="event-block-compact">
  <span className="time">9:00</span>
  <span className="title">Project Alpha</span>
</div>

// Mini mode (cells with many events)
<div className="event-block-mini">
  <div className="dot" style={{backgroundColor: eventColor}} />
  <span>Project Alpha</span>
</div>
```

**2. Adaptive Cell Layout**

```typescript
// Calculate available space
const cellHeight = 120; // px
const headerHeight = 30; // px for date
const availableHeight = cellHeight - headerHeight; // 90px

// Determine display mode
const eventsInCell = dayProjects.length;
const heightPerEvent = availableHeight / eventsInCell;

let displayMode: 'full' | 'compact' | 'mini';
if (heightPerEvent >= 40) displayMode = 'full';
else if (heightPerEvent >= 25) displayMode = 'compact';
else displayMode = 'mini';
```

**3. Time Display in Events**

```typescript
// Show time in event block
const formatEventTime = (start: string, end: string) => {
  const startTime = formatTimeString(start); // "9:00 AM"
  const endTime = formatTimeString(end);     // "5:00 PM"

  // Full: "9:00 AM - 5:00 PM"
  // Compact: "9:00-5:00"
  // Mini: "9AM"

  return displayMode === 'full'
    ? `${startTime} - ${endTime}`
    : displayMode === 'compact'
    ? `${startTime.slice(0,-3)}-${endTime.slice(0,-3)}`
    : startTime.slice(0,-3);
};
```

#### Enhanced Hover Experience

```typescript
interface EventHoverCardProps {
  project: Project;
  anchorElement: HTMLElement;
}

const EventHoverCard = ({ project }: EventHoverCardProps) => (
  <Card className="event-hover-card">
    <CardHeader>
      <h4>{project.title}</h4>
      <Badge>{project.status}</Badge>
    </CardHeader>
    <CardContent>
      <div className="detail-row">
        <Clock size={16} />
        <span>
          {formatTimeString(project.working_hours_start)} -
          {formatTimeString(project.working_hours_end)}
        </span>
      </div>
      <div className="detail-row">
        <MapPin size={16} />
        <span>{project.venue_address}</span>
      </div>
      <div className="detail-row">
        <Users size={16} />
        <span>
          {project.filled_positions}/{project.crew_count} crew
        </span>
      </div>
      {project.client?.full_name && (
        <div className="detail-row">
          <User size={16} />
          <span>{project.client.full_name}</span>
        </div>
      )}
    </CardContent>
    <CardFooter>
      <Button size="sm" variant="outline">View Details</Button>
      <Button size="sm">Edit</Button>
    </CardFooter>
  </Card>
);
```

#### Visual Design - Calendar Cell

```
┌──────────────────────────────────┐
│ 7          [🔴🔵🟢]  Oct 2025   │ ← Date + Event dots + Month
├──────────────────────────────────┤
│                                  │
│ 9:00 AM Project Alpha 🟦        │ ← Full mode: time + title
│ 📍 Downtown • 5/10 crew          │ ← Location + crew count
│                                  │
│ 2:00 PM Project Beta 🟩         │
│ 📍 Uptown • 8/8 crew ✓           │
│                                  │
│ 6:00 PM Project Gamma 🟨        │
│ 📍 Suburbs • 3/6 crew            │
│                                  │
└──────────────────────────────────┘

HOVER STATE:
┌──────────────────────────────────┐
│ 7          [🔴🔵🟢]  Oct 2025   │
├──────────────────────────────────┤
│ ╔════════════════════════════╗  │
│ ║ Project Alpha              ║  │ ← Hover card overlay
│ ║ Active • High Priority     ║  │
│ ║ ────────────────────────── ║  │
│ ║ 🕐 9:00 AM - 5:00 PM       ║  │
│ ║ 📍 Downtown Conference     ║  │
│ ║ 👥 5/10 crew members       ║  │
│ ║ 👤 John Smith (Client)     ║  │
│ ║ ────────────────────────── ║  │
│ ║ [View Details]    [Edit]   ║  │
│ ╚════════════════════════════╝  │
└──────────────────────────────────┘
```

---

## Technical Implementation Plan

### Phase 1: Critical Fixes (Immediate)

**Priority: P0 - Blocker**

1. ✅ Remove debug elements (Lines 894-905)
   ```typescript
   // DELETE these lines completely
   // - Debug info display
   // - Test grid cells
   ```

2. ✅ Fix list view auto-scroll
   ```typescript
   // Remove auto-scroll to first project month
   // Always center on today
   ```

**Estimated Time:** 1-2 hours

### Phase 2: Event Display Enhancement

**Priority: P1 - High**

1. Add time display to event blocks
2. Implement adaptive display modes (full/compact/mini)
3. Improve event truncation and overflow handling
4. Add "+X more" indicator for cells with many events

**Estimated Time:** 4-6 hours

### Phase 3: Hover Experience

**Priority: P2 - Medium**

1. Create EventHoverCard component
2. Implement hover detection with delay (300ms)
3. Position card intelligently (avoid screen edges)
4. Add quick actions (View, Edit, Delete)

**Estimated Time:** 6-8 hours

### Phase 4: Visual Polish

**Priority: P3 - Nice to have**

1. Add animations and transitions
2. Improve color contrast and accessibility
3. Add keyboard navigation
4. Implement focus states

**Estimated Time:** 4-6 hours

---

## Accessibility Considerations

### WCAG 2.1 Level AA Compliance

1. **Color Contrast**
   - Ensure 4.5:1 contrast ratio for text
   - Don't rely solely on color for information
   - Add patterns/icons for event types

2. **Keyboard Navigation**
   - Tab through events in order
   - Arrow keys to navigate calendar grid
   - Enter/Space to activate events
   - Escape to close hover cards

3. **Screen Reader Support**
   - Semantic HTML (table/grid structure)
   - ARIA labels for date cells
   - ARIA live regions for dynamic updates
   - Descriptive event announcements

4. **Focus Management**
   - Clear focus indicators
   - Focus trap in modal dialogs
   - Return focus after actions

---

## Success Metrics

### Key Performance Indicators

1. **User Efficiency**
   - Time to find today's events: < 2 seconds
   - Time to understand event details: < 5 seconds
   - Clicks to view event: 0 (hover) vs 1 (current)

2. **User Satisfaction**
   - SUS Score: Target > 80
   - Task completion rate: > 95%
   - Error rate: < 5%

3. **Technical Performance**
   - Calendar load time: < 500ms
   - Hover card response: < 100ms
   - No layout shifts (CLS = 0)

---

## Responsive Design Strategy

### Breakpoints

```scss
// Mobile: < 640px
- Agenda/list view only
- Full event cards
- Swipe navigation

// Tablet: 640px - 1024px
- Mini month view
- Compact event display
- Side panel for details

// Desktop: > 1024px
- Full calendar grid
- Full event display
- Hover cards
- Dual-pane layout
```

### Mobile-First Approach

```typescript
// Mobile: Show agenda by default
const defaultView = useMediaQuery('(min-width: 640px)')
  ? 'calendar'
  : 'list';

// Adapt event display
const eventDisplay = useMemo(() => {
  if (isMobile) return 'card'; // Full card
  if (isTablet) return 'compact'; // Compact bar
  return 'full'; // Full details in cell
}, [isMobile, isTablet]);
```

---

## Testing Plan

### User Testing Scenarios

1. **Scenario 1: Quick Event Check**
   - Task: Find what events you have today
   - Success: User finds events in < 5 seconds
   - Metric: Time to task completion

2. **Scenario 2: Event Details Review**
   - Task: Find event location and time
   - Success: User gets info without clicking
   - Metric: Number of clicks required

3. **Scenario 3: Multi-Day Planning**
   - Task: Check your schedule for next week
   - Success: User reviews 5-7 days in < 30 seconds
   - Metric: Information retrieval time

### A/B Testing

**Test 1: Event Display Modes**
- Variant A: Current implementation
- Variant B: New adaptive display with time
- Metric: Task completion time, user satisfaction

**Test 2: Hover vs Click**
- Variant A: Click to see details (current)
- Variant B: Hover to see details (proposed)
- Metric: Interaction efficiency, user preference

---

## Design System Integration

### Component Specifications

```typescript
// Event Block Component
<EventBlock
  project={project}
  displayMode="full" | "compact" | "mini"
  showTime={true}
  showLocation={false}
  onClick={handleClick}
  onHover={handleHover}
/>

// Calendar Cell Component
<CalendarCell
  date={date}
  events={dayEvents}
  isToday={isToday}
  maxVisibleEvents={3}
  renderEvent={(event) => <EventBlock project={event} />}
/>

// Event Hover Card Component
<EventHoverCard
  project={project}
  position="auto" | "top" | "bottom" | "left" | "right"
  showActions={true}
  onViewDetails={handleView}
  onEdit={handleEdit}
/>
```

### Color System

```typescript
// Event colors with WCAG AA contrast
const eventColors = {
  'Production': {
    bg: '#DBEAFE',    // blue-100
    text: '#1E40AF',   // blue-800
    border: '#3B82F6'  // blue-500
  },
  'Meeting': {
    bg: '#FEF3C7',    // yellow-100
    text: '#92400E',   // yellow-900
    border: '#F59E0B'  // yellow-500
  },
  // ... etc
};
```

---

## Next Steps

### Immediate Actions (This Week)

1. ✅ **Remove debug code** - Blocking calendar display
2. ✅ **Fix list view scroll** - Users can't find today
3. ✅ **Add time to events** - Core functionality

### Short Term (2 Weeks)

4. Implement adaptive event display
5. Add hover card component
6. Improve overflow handling

### Medium Term (1 Month)

7. Full responsive design
8. Accessibility audit
9. Performance optimization
10. User testing and iteration

---

## Appendix

### Google Calendar UX Analysis

**Strengths to Adopt:**
- ✅ Clear time display in event blocks
- ✅ Hover preview with rich details
- ✅ Color coding with good contrast
- ✅ Adaptive layout for different densities
- ✅ Today indicator highly visible

**Areas to Improve Upon:**
- ⚡ Better mobile experience
- ⚡ Faster event creation workflow
- ⚡ Smarter default view selection
- ⚡ Better handling of all-day events

### User Quotes (From Research)

> "I can't tell what time my events are without clicking each one"
> - Beta User #3

> "Why does it jump to last month? I want to see what's happening today"
> - Beta User #7

> "Google Calendar shows everything I need at a glance"
> - Beta User #12

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-07 | Sally (UX Expert) | Initial specification |

