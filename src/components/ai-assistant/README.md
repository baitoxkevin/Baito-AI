# AI Chat Widget - Features & Formatting Guide

The AI Chat Widget supports rich content formatting including action buttons, markdown tables, code blocks, and more.

---

## 📊 Markdown Tables

Tables are automatically rendered with professional styling. Use standard markdown table syntax:

### Example Table Response

```markdown
I found 49 projects with a High priority.

Here are the top 10:

| Title | Status | Crew Need | Filled | Start Date | End Date |
|-------|--------|-----------|--------|------------|----------|
| Honda @ Autoshow | New | 21 | 1 | 2025-05-07 | 2025-05-23 |
| DIY Raya | Scheduled | 6 | 0 | 2025-04-12 | 2025-04-12 |
| Redoxon Team 2 | Scheduled | 8 | 0 | 2025-03-23 | 2025-03-24 |
| HSBC | Completed | 6 | 0 | 2025-03-23 | 2025-04-03 |
| Oppo Warrior | Scheduled | 8 | 0 | 2025-03-15 | 2025-03-16 |
```

**Features:**
- ✅ Clean, bordered table layout
- ✅ Sticky header with uppercase labels
- ✅ Hover effects on rows
- ✅ Horizontal scrolling for wide tables
- ✅ Responsive design
- ✅ Dark mode support
- ✅ Alternating row colors for better readability
- ✅ Compact text sizing for data-dense tables

**Best Practices for Tables:**
- Keep column headers short and clear
- Use consistent formatting (dates, numbers, etc.)
- Limit to 10-15 rows for readability (paginate if needed)
- Add summary text before/after the table
- Combine with action buttons for navigation

---

## 💬 Other Formatting Options

### Code Blocks

Use triple backticks with language specification:

````markdown
Here's how to query the database:

```typescript
const projects = await supabase
  .from('projects')
  .select('*')
  .eq('priority', 'high')
```
````

### Lists

**Bullet Lists:**
```markdown
Available features:
- Project management
- Staff scheduling
- Payment tracking
- Expense claims
```

**Numbered Lists:**
```markdown
Steps to create a project:
1. Navigate to Projects page
2. Click "Create New Project"
3. Fill in project details
4. Assign staff members
5. Save and publish
```

### Text Formatting

```markdown
**Bold text** for emphasis
*Italic text* for subtle emphasis
~~Strikethrough~~ for deprecated info
`inline code` for technical terms

> Blockquote for important notes or warnings
```

---

## 🔘 Action Buttons

## How to Use Action Buttons

The AI backend can include navigation buttons in responses by adding a `buttons` array to the response:

### Response Format

```typescript
{
  reply: "Here's what I found...",
  buttons: [
    {
      label: "View Projects",
      path: "/projects",
      icon: "projects",
      variant: "default"
    },
    {
      label: "View Candidates",
      path: "/candidates",
      icon: "candidates",
      variant: "outline"
    }
  ]
}
```

### Button Properties

- **label** (required): The text displayed on the button
- **path** (optional): Internal route path (e.g., `/dashboard`, `/projects`)
- **url** (optional): External URL (opens in new tab)
- **icon** (optional): Icon name from the icon map
- **variant** (optional): Button style - `default`, `outline`, or `secondary`

### Available Icons

- `dashboard` - Dashboard icon
- `projects` - Projects/folder icon
- `candidates` - Users/people icon
- `calendar` - Calendar icon
- `tools` - Tools/wrench icon
- `payments` - Credit card icon
- `expenses` - Receipt icon
- `settings` - Settings icon
- `goals` - Target icon
- `warehouse` - Warehouse icon
- `invites` - Mail/envelope icon
- `team` - Team/users icon
- `external` - External link icon

### Available Routes

Common routes in the application:

- `/dashboard` - Main Dashboard
- `/projects` - Projects List
- `/projects/:id` - Project Details
- `/candidates` - Candidates Management
- `/calendar` - Calendar View
- `/calendar/list` - Calendar List View
- `/calendar/view` - Calendar Grid View
- `/team` - Team Management
- `/tools` - Tools & Utilities
- `/payments` - Payments
- `/expenses` - Expense Claims
- `/goals` - Goals
- `/warehouse` - Warehouse
- `/invites` - Invites
- `/settings` - Settings

## Example Use Cases

### 1. Project Query with Navigation

```typescript
// User asks: "Show me active projects"
{
  reply: "You have 5 active projects. Here's a summary:\n\n- Project A (10 staff)\n- Project B (8 staff)\n- ...",
  buttons: [
    {
      label: "View All Projects",
      path: "/projects",
      icon: "projects",
      variant: "default"
    }
  ]
}
```

### 2. Candidate Search with Multiple Actions

```typescript
// User asks: "Find available candidates"
{
  reply: "I found 12 available candidates for this week.",
  buttons: [
    {
      label: "View Candidates",
      path: "/candidates",
      icon: "candidates",
      variant: "default"
    },
    {
      label: "View Calendar",
      path: "/calendar",
      icon: "calendar",
      variant: "outline"
    }
  ]
}
```

### 3. External Resource

```typescript
{
  reply: "Here's the documentation you requested.",
  buttons: [
    {
      label: "Open Documentation",
      url: "https://docs.example.com",
      icon: "external",
      variant: "outline"
    }
  ]
}
```

## Implementation in AI Backend

In your Edge Function, you can conditionally add buttons based on the query context:

```typescript
const response = {
  reply: assistantMessage,
  toolsUsed: toolsUsed,
  buttons: []
}

// Add navigation buttons based on context
if (queryIntent === 'view_projects') {
  response.buttons.push({
    label: "View Projects",
    path: "/projects",
    icon: "projects",
    variant: "default"
  })
}

if (queryIntent === 'view_candidates') {
  response.buttons.push({
    label: "View Candidates",
    path: "/candidates",
    icon: "candidates",
    variant: "default"
  })
}

return response
```

## Styling

Buttons automatically:
- Animate on appearance with staggered delays
- Show hover effects with chevron animation
- Support dark mode
- Are responsive and wrap appropriately
- Display below the message bubble for assistant messages
