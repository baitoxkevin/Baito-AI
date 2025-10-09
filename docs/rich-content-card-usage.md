# Rich Content Card Usage Guide

The RichContentCard component allows the AI assistant to display structured, interactive content beyond plain text or markdown.

## Component Types

### 1. List Card
Display a list of items with icons, subtitles, values, and status badges.

**Use Cases**: Staff list, project list, task list, candidate list

**Example Data**:
```json
{
  "type": "list",
  "data": {
    "title": "Today's Projects",
    "description": "Active projects requiring attention",
    "items": [
      {
        "id": "proj-1",
        "title": "Wedding Setup - Grand Hotel",
        "subtitle": "Setup Team A",
        "value": "8/10",
        "status": "warning",
        "icon": "users"
      },
      {
        "id": "proj-2",
        "title": "Corporate Event - Convention Center",
        "subtitle": "Setup Team B",
        "value": "12/12",
        "status": "success",
        "icon": "users"
      }
    ],
    "footer": "2 projects total"
  }
}
```

### 2. Info Card
Display key-value pairs in a simple card format.

**Use Cases**: Candidate details, project information, staff profile

**Example Data**:
```json
{
  "type": "card",
  "data": {
    "title": "Candidate Details",
    "description": "John Doe - Event Staff",
    "items": [
      { "title": "Experience", "value": "3 years" },
      { "title": "Rate", "value": "$25/hour" },
      { "title": "Availability", "value": "Weekends" },
      { "title": "Languages", "value": "English, Chinese" }
    ]
  }
}
```

### 3. Metrics Card
Display key metrics with trend indicators and icons.

**Use Cases**: Dashboard stats, project metrics, financial summaries

**Example Data**:
```json
{
  "type": "metrics",
  "data": {
    "title": "This Week's Performance",
    "metrics": [
      {
        "label": "Projects Completed",
        "value": 12,
        "change": 15,
        "trend": "up",
        "icon": "calendar"
      },
      {
        "label": "Active Staff",
        "value": 45,
        "change": -5,
        "trend": "down",
        "icon": "users"
      },
      {
        "label": "Revenue",
        "value": "$15,450",
        "change": 8,
        "trend": "up",
        "icon": "dollar"
      },
      {
        "label": "Hours Worked",
        "value": "1,240",
        "change": 0,
        "trend": "neutral",
        "icon": "clock"
      }
    ]
  }
}
```

### 4. Schedule Card
Display time-based schedule with status indicators.

**Use Cases**: Daily schedule, meeting agenda, shift schedule

**Example Data**:
```json
{
  "type": "schedule",
  "data": {
    "title": "Today's Schedule",
    "date": "October 7, 2025",
    "items": [
      {
        "time": "09:00",
        "title": "Morning Setup - Wedding Venue",
        "location": "Grand Hotel Ballroom",
        "status": "completed"
      },
      {
        "time": "14:00",
        "title": "Staff Check-in",
        "location": "Convention Center",
        "status": "ongoing"
      },
      {
        "time": "18:00",
        "title": "Evening Teardown",
        "location": "Grand Hotel Ballroom",
        "status": "upcoming"
      }
    ]
  }
}
```

### 5. Status Card
Display important status messages with details.

**Use Cases**: Success confirmations, error messages, warnings, info

**Example Data**:
```json
{
  "type": "status",
  "data": {
    "title": "Staff Successfully Added",
    "status": "success",
    "message": "John Doe has been added to the system.",
    "details": [
      "Profile created with ID: ST-12345",
      "Welcome email sent",
      "Ready to be assigned to projects"
    ]
  }
}
```

**Error Example**:
```json
{
  "type": "status",
  "data": {
    "title": "Validation Error",
    "status": "error",
    "message": "Unable to create project. Please fix the following issues:",
    "details": [
      "Start date is required",
      "At least one staff member must be assigned",
      "Venue address cannot be empty"
    ]
  }
}
```

## Edge Function Integration

### Returning Rich Content

In your Supabase Edge Function (`ai-chat`), return rich content in the metadata:

```typescript
// Example Edge Function response
return new Response(
  JSON.stringify({
    conversationId: conversation.id,
    messageId: assistantMessage.id,
    reply: "I found 3 projects scheduled for today:",
    toolsUsed: ["query_projects", "format_list"],
    buttons: [],
    metadata: {
      rich_content: {
        type: "list",
        data: {
          title: "Today's Projects",
          items: projects.map(p => ({
            id: p.id,
            title: p.title,
            subtitle: p.location,
            value: `${p.staffed}/${p.required}`,
            status: p.staffed === p.required ? "success" : "warning",
            icon: "users"
          })),
          footer: `${projects.length} projects total`
        }
      }
    }
  }),
  { headers: { "Content-Type": "application/json" } }
);
```

### Database Storage

Rich content is automatically stored in the `ai_messages.metadata` JSONB column:

```sql
-- Example stored message
INSERT INTO ai_messages (conversation_id, type, content, metadata)
VALUES (
  'uuid-here',
  'assistant',
  'I found 3 projects scheduled for today:',
  '{
    "rich_content": {
      "type": "list",
      "data": {...}
    },
    "tools_used": ["query_projects"]
  }'::jsonb
);
```

## TypeScript Types

All types are exported from `@/components/chat/RichContentCard`:

```typescript
import {
  RichContent,
  RichContentType,
  ListItem,
  MetricItem,
  CardData,
  MetricsData,
  ScheduleData,
  StatusData
} from '@/components/chat/RichContentCard'

// Example type usage
const content: RichContent = {
  type: 'metrics',
  data: {
    title: 'Weekly Stats',
    metrics: [...]
  }
}
```

## Styling & Theming

The RichContentCard automatically uses design tokens for consistent styling:
- Colors from `@/lib/chat/design-tokens`
- Responsive design (mobile-optimized)
- Dark mode support
- Framer Motion animations

## Accessibility

All cards include:
- Proper ARIA labels
- Semantic HTML structure
- Keyboard navigation support
- Screen reader friendly

## Examples for Common Scenarios

### Staff Management
```typescript
// List today's staff
{
  type: 'list',
  data: {
    title: "Today's Staff On-Site",
    items: staff.map(s => ({
      title: s.name,
      subtitle: s.role,
      value: s.hours + 'h',
      icon: 'clock',
      status: s.checked_in ? 'success' : 'warning'
    }))
  }
}
```

### Project Dashboard
```typescript
// Show project metrics
{
  type: 'metrics',
  data: {
    title: 'Project Overview',
    metrics: [
      { label: 'Active', value: active, icon: 'calendar' },
      { label: 'Staff', value: staff, icon: 'users' },
      { label: 'Budget', value: '$' + budget, icon: 'dollar' }
    ]
  }
}
```

### Expense Report
```typescript
// Show expense details
{
  type: 'card',
  data: {
    title: 'Expense Report #1234',
    description: 'Submitted by John Doe',
    items: [
      { title: 'Amount', value: '$250.00' },
      { title: 'Category', value: 'Transportation' },
      { title: 'Date', value: 'Oct 7, 2025' },
      { title: 'Status', value: 'Pending Approval' }
    ]
  }
}
```

## Testing

Test rich content display by sending a message through the Edge Function with rich_content in metadata. The MessageList component will automatically detect and render it.

```typescript
// Test in Edge Function
const testRichContent: RichContent = {
  type: 'status',
  data: {
    title: 'Test Successful',
    status: 'success',
    message: 'Rich content is working correctly!',
    details: ['Component loaded', 'Data parsed', 'UI rendered']
  }
}
```
