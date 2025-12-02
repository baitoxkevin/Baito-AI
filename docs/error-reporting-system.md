# Error Reporting and Tracking System

## Architecture Overview

```
+------------------+       +---------------------+       +------------------+
|   Frontend App   |       |   Edge Functions    |       |   Supabase DB    |
|                  |       |                     |       |                  |
|  ErrorBoundary   +------>+ error-report        +------>+ error_reports    |
|  useErrorReport  |       | (submit errors)     |       | error_comments   |
|  Screenshot      |       |                     |       | error_history    |
|                  |       | error-report-query  |       | error_logs       |
+--------+---------+       | (query/manage)      |       +--------+---------+
         |                 +----------+----------+                |
         |                            |                           |
         v                            v                           v
+------------------+       +---------------------+       +------------------+
| Supabase Storage |       |    AI Processing    |       |  Claude Code/MCP |
|                  |       |                     |       |                  |
| error-screenshots|       | OpenRouter/Claude   |       | Query errors     |
| (PNG, JPEG)      |       | Auto-categorize     |       | Update status    |
|                  |       | Priority scoring    |       | Get insights     |
+------------------+       +---------------------+       +------------------+
```

## Database Schema

### Core Tables

#### `error_reports`
The main table storing all error reports.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `report_number` | SERIAL | Human-readable ID (ERR-00001) |
| `error_message` | TEXT | The error message |
| `error_stack` | TEXT | Full stack trace |
| `error_name` | TEXT | Error type (TypeError, etc.) |
| `component_name` | TEXT | React component name |
| `page_url` | TEXT | URL where error occurred |
| `status` | ENUM | new, acknowledged, in_progress, resolved, wont_fix, duplicate |
| `severity` | ENUM | critical, high, medium, low, info |
| `priority` | INTEGER | 1-100 priority score |
| `screenshot_path` | TEXT | Path in storage bucket |
| `screenshot_url` | TEXT | Signed URL for viewing |
| `reporter_id` | UUID | User who reported |
| `assigned_to` | UUID | Developer assigned |
| `resolution_notes` | TEXT | How it was resolved |
| `ai_analysis` | JSONB | AI-generated insights |
| `error_hash` | TEXT | For deduplication |
| `duplicate_of` | UUID | Reference to original |
| `duplicate_count` | INTEGER | Number of duplicates |
| `created_at` | TIMESTAMPTZ | When reported |
| `resolved_at` | TIMESTAMPTZ | When resolved |

#### `error_report_comments`
Comments and notes on error reports.

#### `error_report_history`
Audit trail of status changes.

#### `error_console_logs`
Console logs captured at error time.

#### `error_network_requests`
Network requests around error time.

## API Endpoints

### 1. Submit Error Report

**Endpoint:** `POST /functions/v1/error-report`

**Purpose:** Submit a new error report with optional screenshot.

**Request:**
```json
{
  "error_message": "Cannot read property 'name' of undefined",
  "error_stack": "TypeError: Cannot read property...\n    at ProjectCard.tsx:45",
  "error_name": "TypeError",
  "component_name": "ProjectCard",
  "page_url": "https://app.baito-ai.com/projects/123",
  "page_title": "Project Details",
  "route_path": "/projects/:id",
  "route_params": { "id": "123" },
  "user_description": "Page crashed when clicking edit button",
  "severity": "high",
  "screenshot_base64": "data:image/png;base64,iVBORw0KGgo...",
  "console_logs": [
    {
      "level": "error",
      "message": "Failed to fetch project data",
      "timestamp_offset": -500
    }
  ],
  "network_requests": [
    {
      "url": "/api/projects/123",
      "method": "GET",
      "status": 500,
      "is_error": true,
      "timestamp_offset": -1000
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "error_id": "550e8400-e29b-41d4-a716-446655440000",
  "report_number": 42,
  "display_id": "ERR-00042",
  "is_duplicate": false,
  "message": "Error report submitted successfully"
}
```

### 2. Query Error Reports

**Endpoint:** `GET /functions/v1/error-report-query`

**Purpose:** List, search, and filter error reports.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `action` | string | list, get, update, stats, search |
| `status` | string | Filter by status |
| `severity` | string | Filter by severity |
| `component` | string | Filter by component name |
| `search` | string | Full-text search |
| `limit` | number | Results per page (default: 50) |
| `offset` | number | Pagination offset |
| `order_by` | string | created_at, priority, severity |
| `order_dir` | string | ASC or DESC |

**Examples:**

```bash
# List all new errors
GET /functions/v1/error-report-query?action=list&status=new

# Search for TypeError
GET /functions/v1/error-report-query?action=search&search=TypeError

# Get specific error
GET /functions/v1/error-report-query?action=get&report_number=42

# Get statistics
GET /functions/v1/error-report-query?action=stats&start_date=2024-01-01
```

### 3. Update Error Status

**Endpoint:** `POST /functions/v1/error-report-query`

**Purpose:** Update error status, assign, resolve.

**Request:**
```json
{
  "action": "update",
  "error_id": "550e8400-e29b-41d4-a716-446655440000",
  "new_status": "resolved",
  "resolution_notes": "Fixed null check in ProjectCard line 45",
  "category": "UI"
}
```

## MCP Integration for Claude Code

### Overview

The error reporting system is designed to be accessed by Claude Code (Baiger) via MCP (Model Context Protocol). This enables:

1. **Querying errors:** Claude Code can fetch and analyze error reports
2. **Status updates:** Mark errors as in_progress or resolved
3. **Pattern detection:** Identify recurring issues
4. **Automated triage:** AI-assisted prioritization

### MCP Tool Definitions

Add these tools to your AI assistant's configuration:

```typescript
const ERROR_TRACKING_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'query_error_reports',
      description: 'Search and filter error reports from the error tracking system. Use this to find bugs, issues, and errors that users have reported.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['new', 'acknowledged', 'in_progress', 'resolved', 'wont_fix', 'duplicate'],
            description: 'Filter by error status'
          },
          severity: {
            type: 'string',
            enum: ['critical', 'high', 'medium', 'low', 'info'],
            description: 'Filter by severity level'
          },
          component: {
            type: 'string',
            description: 'Filter by component name (partial match)'
          },
          search: {
            type: 'string',
            description: 'Full-text search in error messages and stack traces'
          },
          limit: {
            type: 'number',
            default: 20,
            description: 'Maximum number of results'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_error_details',
      description: 'Get full details of a specific error report including screenshot, console logs, and network requests.',
      parameters: {
        type: 'object',
        properties: {
          error_id: {
            type: 'string',
            description: 'UUID of the error report'
          },
          report_number: {
            type: 'number',
            description: 'Human-readable report number (e.g., 42 for ERR-00042)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_error_status',
      description: 'Update the status of an error report. Use this to mark errors as in_progress when working on them, or resolved when fixed.',
      parameters: {
        type: 'object',
        properties: {
          error_id: {
            type: 'string',
            description: 'UUID of the error report'
          },
          new_status: {
            type: 'string',
            enum: ['acknowledged', 'in_progress', 'resolved', 'wont_fix'],
            description: 'New status for the error'
          },
          resolution_notes: {
            type: 'string',
            description: 'Notes about how the error was resolved or why it was closed'
          }
        },
        required: ['error_id', 'new_status']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_error_statistics',
      description: 'Get error statistics and trends. Shows counts by status, severity, top components, and daily trends.',
      parameters: {
        type: 'object',
        properties: {
          start_date: {
            type: 'string',
            format: 'date',
            description: 'Start date for statistics (defaults to 30 days ago)'
          },
          end_date: {
            type: 'string',
            format: 'date',
            description: 'End date for statistics (defaults to today)'
          }
        }
      }
    }
  }
]
```

### MCP Tool Implementation

```typescript
// Add to your AI chat edge function
async function executeErrorTrackingTool(
  toolName: string,
  args: any,
  supabase: any
): Promise<any> {
  const baseUrl = Deno.env.get('SUPABASE_URL')

  switch (toolName) {
    case 'query_error_reports': {
      const params = new URLSearchParams({
        action: 'list',
        ...(args.status && { status: args.status }),
        ...(args.severity && { severity: args.severity }),
        ...(args.component && { component: args.component }),
        ...(args.search && { search: args.search }),
        limit: String(args.limit || 20)
      })

      const response = await fetch(
        `${baseUrl}/functions/v1/error-report-query?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          }
        }
      )

      return await response.json()
    }

    case 'get_error_details': {
      const params = new URLSearchParams({
        action: 'get',
        ...(args.error_id && { error_id: args.error_id }),
        ...(args.report_number && { report_number: String(args.report_number) })
      })

      const response = await fetch(
        `${baseUrl}/functions/v1/error-report-query?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          }
        }
      )

      return await response.json()
    }

    case 'update_error_status': {
      const response = await fetch(
        `${baseUrl}/functions/v1/error-report-query`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'update',
            error_id: args.error_id,
            new_status: args.new_status,
            resolution_notes: args.resolution_notes
          })
        }
      )

      return await response.json()
    }

    case 'get_error_statistics': {
      const params = new URLSearchParams({
        action: 'stats',
        ...(args.start_date && { start_date: args.start_date }),
        ...(args.end_date && { end_date: args.end_date })
      })

      const response = await fetch(
        `${baseUrl}/functions/v1/error-report-query?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          }
        }
      )

      return await response.json()
    }

    default:
      throw new Error(`Unknown error tracking tool: ${toolName}`)
  }
}
```

### Example AI Interactions

**User:** "Show me the critical bugs that need attention"

**AI Response after using query_error_reports:**
```
I found 3 critical errors that need immediate attention:

1. **ERR-00156** - TypeError in ProjectCard
   - Component: ProjectCard
   - Page: /projects/123
   - Reported: 2 hours ago
   - Status: new

2. **ERR-00152** - API timeout in CandidateList
   - Component: CandidateList
   - Page: /candidates
   - Reported: 5 hours ago
   - Status: acknowledged

3. **ERR-00148** - Authentication failure
   - Component: LoginForm
   - Page: /login
   - Reported: 1 day ago
   - Status: in_progress (assigned to dev@example.com)

Would you like me to show details for any of these, or should I help investigate and fix them?
```

**User:** "Fix the ProjectCard error"

**AI Response after using get_error_details and analyzing:**
```
Looking at ERR-00156 in detail:

**Error:** Cannot read property 'name' of undefined
**Location:** ProjectCard.tsx line 45
**Stack Trace:**
  - at ProjectCard (ProjectCard.tsx:45)
  - at renderWithHooks (react-dom.js:...)

**Root Cause Analysis:**
The error occurs when `project.client` is undefined, and we try to access `project.client.name`.

**Fix:**
Add null check before accessing nested property:

```tsx
// Before (line 45)
<span>{project.client.name}</span>

// After
<span>{project.client?.name || 'No Client'}</span>
```

I'll update the error status to in_progress while you implement this fix.

*[Automatically updates error status]*

Would you like me to implement this fix directly?
```

## Frontend Integration

### React Error Boundary with Reporting

```tsx
// components/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react'
import { captureScreenshot, reportError } from '@/lib/error-reporting'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })

    // Capture screenshot
    const screenshot = await captureScreenshot()

    // Report error
    await reportError({
      error_message: error.message,
      error_stack: error.stack,
      error_name: error.name,
      component_name: errorInfo.componentStack?.split('\n')[1]?.trim(),
      component_stack: errorInfo.componentStack,
      page_url: window.location.href,
      page_title: document.title,
      screenshot_base64: screenshot,
      severity: 'high'
    })
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>Our team has been notified and is working on a fix.</p>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

### Error Reporting Hook

```tsx
// hooks/useErrorReport.ts
import { useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface ErrorReportData {
  error_message: string
  error_stack?: string
  component_name?: string
  user_description?: string
  screenshot_base64?: string
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'info'
}

export function useErrorReport() {
  const reportError = useCallback(async (data: ErrorReportData) => {
    try {
      const response = await supabase.functions.invoke('error-report', {
        body: {
          ...data,
          page_url: window.location.href,
          page_title: document.title,
          user_agent: navigator.userAgent,
          screen_width: window.screen.width,
          screen_height: window.screen.height,
          viewport_width: window.innerWidth,
          viewport_height: window.innerHeight
        }
      })

      if (response.error) {
        console.error('Failed to report error:', response.error)
        return null
      }

      return response.data
    } catch (err) {
      console.error('Error reporting failed:', err)
      return null
    }
  }, [])

  return { reportError }
}
```

### Screenshot Capture Utility

```typescript
// lib/error-reporting.ts
import html2canvas from 'html2canvas'

export async function captureScreenshot(): Promise<string | null> {
  try {
    const canvas = await html2canvas(document.body, {
      logging: false,
      useCORS: true,
      scale: 0.5, // Reduce size
      ignoreElements: (element) => {
        // Ignore sensitive elements
        return element.classList.contains('sensitive') ||
               element.tagName === 'INPUT' && element.type === 'password'
      }
    })

    return canvas.toDataURL('image/png', 0.7)
  } catch (error) {
    console.error('Screenshot capture failed:', error)
    return null
  }
}

export async function reportError(data: ErrorReportData): Promise<void> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  await fetch(`${supabaseUrl}/functions/v1/error-report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`
    },
    body: JSON.stringify(data)
  })
}
```

## Security Considerations

### RLS Policies

1. **Submit Access:** Any authenticated user can submit error reports
2. **View Access:** All authenticated users can view all error reports
3. **Update Access:** Only admins, managers, assigned users, or original reporters can update
4. **Delete Access:** Only admins can delete (soft delete)
5. **Internal Comments:** Only admins/managers can view internal comments

### Storage Security

- Screenshot bucket is private (not public)
- Signed URLs are generated for viewing (7-day expiry)
- Only admins can delete screenshots
- File size limit: 5MB per screenshot

### Data Privacy

- User agents and browser info are captured for debugging
- Sensitive inputs (passwords) are excluded from screenshots
- Reporter information is optional for anonymous reports
- Data retention: Configurable cleanup after 6 months

## Deployment

### 1. Run Database Migration

```bash
supabase db push
# or
supabase migration up
```

### 2. Deploy Edge Functions

```bash
supabase functions deploy error-report
supabase functions deploy error-report-query
```

### 3. Set Environment Variables

```bash
supabase secrets set OPENROUTER_API_KEY=your_key
```

### 4. Add AI Tools to Chat Function

Update your AI chat function to include the error tracking tools.

## Monitoring

### Recommended Alerts

1. **Critical Error Threshold:** Alert when >5 critical errors in 1 hour
2. **Error Spike:** Alert when error rate increases 50% above baseline
3. **Unresolved Age:** Alert when critical errors remain unresolved for 24h

### Dashboard Queries

```sql
-- Today's error summary
SELECT
  status,
  severity,
  COUNT(*) as count
FROM error_reports
WHERE created_at > CURRENT_DATE
  AND is_deleted = false
GROUP BY status, severity
ORDER BY count DESC;

-- Top error-prone components
SELECT
  component_name,
  COUNT(*) as error_count,
  COUNT(*) FILTER (WHERE severity = 'critical') as critical_count
FROM error_reports
WHERE created_at > CURRENT_DATE - INTERVAL '7 days'
  AND is_deleted = false
GROUP BY component_name
ORDER BY error_count DESC
LIMIT 10;

-- Average resolution time
SELECT
  AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) as avg_hours
FROM error_reports
WHERE resolved_at IS NOT NULL
  AND created_at > CURRENT_DATE - INTERVAL '30 days';
```
