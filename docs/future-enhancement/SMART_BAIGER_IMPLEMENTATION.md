# Smart Baiger Implementation Guide

> Last Updated: December 2025
> Status: Phase 1 Complete, Phase 2-3 Pending

## Overview

Smart Baiger transforms the AI assistant from a simple chatbot into a comprehensive **business intelligence co-pilot** that can:
- Answer general business questions with data
- Analyze problems and provide root cause analysis
- Calculate profitability and financial metrics
- Forecast demand and capacity needs
- Give proactive recommendations

---

## Implementation Status

### Phase 1: Backend Intelligence ✅ COMPLETE

| Component | File Location | Status |
|-----------|---------------|--------|
| Business Overview Tool | `supabase/functions/ai-chat-mcp-enhanced/tools/index.ts` | ✅ Deployed |
| Problem Analysis Tool | `supabase/functions/ai-chat-mcp-enhanced/tools/index.ts` | ✅ Deployed |
| Financial Analysis Tool | `supabase/functions/ai-chat-mcp-enhanced/tools/index.ts` | ✅ Deployed |
| Forecast Tool | `supabase/functions/ai-chat-mcp-enhanced/tools/index.ts` | ✅ Deployed |
| Smart Recommendations Tool | `supabase/functions/ai-chat-mcp-enhanced/tools/index.ts` | ✅ Deployed |
| Enhanced System Prompt | `supabase/functions/ai-chat-mcp-enhanced/index.ts` | ✅ Deployed |

### Phase 2: Enhanced Frontend UI 🔲 PENDING

| Component | File Location | Status |
|-----------|---------------|--------|
| Project Data Card | `src/components/ai-assistant/DataCards/ProjectDataCard.tsx` | Created, not integrated |
| Candidate Data Card | `src/components/ai-assistant/DataCards/CandidateDataCard.tsx` | Created, not integrated |
| Data Table Component | `src/components/ai-assistant/DataCards/DataTable.tsx` | Created, not integrated |
| Tool Execution Indicator | `src/components/ai-assistant/ToolExecutionIndicator.tsx` | Created, not integrated |
| Enhanced Message List | `src/components/ai-assistant/EnhancedMessageList.tsx` | Created, not integrated |
| Confirmation Dialog | `src/components/ai-assistant/ConfirmationDialog.tsx` | Created, not integrated |
| Enhanced Chat Widget | `src/components/ai-assistant/EnhancedChatWidget.tsx` | Created, not integrated |
| Enhanced AI Chat Hook | `src/hooks/use-enhanced-ai-chat.ts` | Created, not integrated |
| AI Chat Types | `src/types/ai-chat.types.ts` | Created, not integrated |

### Phase 3: Advanced Features 🔲 PENDING

| Feature | Description | Status |
|---------|-------------|--------|
| Multi-turn Context | Remember conversation across messages | Not started |
| Proactive Notifications | Baiger alerts about issues | Not started |
| Voice Input | Speak to Baiger | Not started |
| Quick Actions | Trigger Baiger from other pages | Not started |

---

## Phase 1: Business Intelligence Tools

### 1. get_business_overview

**Purpose:** Answer "how are we doing" type questions

**Parameters:**
```typescript
{
  period: 'today' | 'this_week' | 'this_month' | 'last_month' | 'this_quarter' | 'this_year',
  compare_to_previous: boolean
}
```

**Returns:**
- Total projects, completed, active, understaffed
- Crew utilization rate
- Period-over-period comparison
- Top performers
- Insights and concerns

**Example Query:** "How are we doing this month?"

---

### 2. analyze_problem

**Purpose:** Root cause analysis for business problems

**Parameters:**
```typescript
{
  problem_type: 'no_shows' | 'understaffing' | 'low_performance' | 'high_cancellations' |
                'payment_delays' | 'client_complaints' | 'crew_shortage' | 'scheduling_conflicts' | 'other',
  custom_problem?: string,
  time_range_days: number
}
```

**Returns:**
- Findings (data-driven observations)
- Root causes
- Recommendations
- Action items

**Example Query:** "Why do we keep having no-shows?"

---

### 3. get_financial_analysis

**Purpose:** Profitability analysis by venue/client/event type

**Parameters:**
```typescript
{
  analysis_type: 'venue' | 'client' | 'event_type' | 'overall',
  filter_value?: string,
  period_months: number
}
```

**Returns:**
- Overall totals (revenue, cost, profit, margin)
- Breakdown by category
- Best performers
- Underperformers
- Insights and recommendations

**Example Query:** "Am I making money on Pavilion projects?"

---

### 4. get_forecast

**Purpose:** Demand forecasting and capacity planning

**Parameters:**
```typescript
{
  period: 'next_week' | 'next_month' | 'next_quarter',
  compare_to_historical: boolean
}
```

**Returns:**
- Forecast period details
- Demand metrics (projects, crew needed, fill rate)
- Capacity status (active/inactive crew, gap)
- Historical comparison
- Peak days
- Recommendations

**Example Query:** "What should I prepare for December?"

---

### 5. get_smart_recommendations

**Purpose:** Proactive AI suggestions based on current state

**Parameters:**
```typescript
{
  focus_area: 'all' | 'staffing' | 'projects' | 'finance' | 'performance'
}
```

**Returns:**
- Overall status (good/needs_attention/review_recommended)
- Priority summary (critical/high/medium/low counts)
- Prioritized recommendations with actions
- Top priority item

**Example Query:** "Any issues I should know about?"

---

## Phase 2: Frontend Integration Guide

### Step 1: Replace ChatWidget with EnhancedChatWidget

```tsx
// In App.tsx or wherever ChatWidget is used
import { EnhancedChatWidget } from '@/components/ai-assistant/EnhancedChatWidget';

// Replace:
<ChatWidget userId={currentUser.id} ... />

// With:
<EnhancedChatWidget userId={currentUser.id} ... />
```

### Step 2: Enable Action Buttons

The API already returns action buttons in responses:
```json
{
  "reply": "...",
  "buttons": [
    {"label": "View Project", "action": "get_project_details", "variant": "default"},
    {"label": "Find Crew", "action": "find_candidates", "variant": "outline"}
  ]
}
```

The EnhancedMessageList component renders these as clickable buttons that trigger new queries.

### Step 3: Enable Data Cards

When tool results contain project/candidate data, render them as cards:

```tsx
// In EnhancedMessageList.tsx
{message.toolResults?.map(result => {
  if (result.type === 'project') {
    return <ProjectDataCard project={result.data} />;
  }
  if (result.type === 'candidate') {
    return <CandidateDataCard candidate={result.data} />;
  }
  return <DataTable data={result.data} />;
})}
```

### Step 4: Enable Tool Execution Indicator

Show "Searching database..." while tools are running:

```tsx
// In ChatWidget
{isExecutingTool && (
  <ToolExecutionIndicator
    toolName={currentToolName}
    status="running"
  />
)}
```

### Step 5: Enable Confirmation Dialogs

For write operations (assign crew, create project), show confirmation:

```tsx
// In EnhancedChatWidget
{pendingAction && (
  <ConfirmationDialog
    action={pendingAction}
    onConfirm={handleConfirm}
    onCancel={handleCancel}
  />
)}
```

---

## Phase 3: Advanced Features Guide

### Multi-turn Context

Store conversation history in Supabase and pass to each request:

```typescript
// In use-enhanced-ai-chat.ts
const conversationHistory = await supabase
  .from('chat_conversations')
  .select('messages')
  .eq('user_id', userId)
  .single();

// Pass to API
fetch('/functions/v1/ai-chat-mcp-enhanced', {
  body: JSON.stringify({
    message,
    conversationHistory: conversationHistory.data?.messages
  })
});
```

### Proactive Notifications

Create a scheduled Edge Function that runs `get_smart_recommendations` and sends push notifications:

```typescript
// supabase/functions/baiger-alerts/index.ts
Deno.cron("Check for alerts", "0 9 * * *", async () => {
  const { data } = await supabase.rpc('get_smart_recommendations');
  if (data.critical > 0) {
    await sendPushNotification(userId, data.topPriority);
  }
});
```

### Voice Input

Add Web Speech API integration:

```typescript
// In ChatWidget
const recognition = new webkitSpeechRecognition();
recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  handleSendMessage(transcript);
};
```

---

## Testing

### Test Commands

```bash
# Test Business Overview
curl -X POST "https://aoiwrdzlichescqgnohi.supabase.co/functions/v1/ai-chat-mcp-enhanced" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"message": "how are we doing this month?", "showToolCalls": true}'

# Test Problem Analysis
curl -X POST "..." \
  -d '{"message": "why do we keep having no-shows?", "showToolCalls": true}'

# Test Financial Analysis
curl -X POST "..." \
  -d '{"message": "am i making money on promotion events?", "showToolCalls": true}'

# Test Forecast
curl -X POST "..." \
  -d '{"message": "what should I prepare for next month?", "showToolCalls": true}'

# Test Recommendations
curl -X POST "..." \
  -d '{"message": "what should I focus on today?", "showToolCalls": true}'
```

### Expected Response Times

| Tool | Target | Actual (Production) |
|------|--------|---------------------|
| get_business_overview | < 20s | ~16s |
| analyze_problem | < 10s | ~5s |
| get_financial_analysis | < 5s | ~3s |
| get_forecast | < 10s | ~5s |
| get_smart_recommendations | < 10s | ~8s |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ ChatWidget  │→ │ useAIChat    │→ │ EnhancedMessageList│  │
│  │             │  │ Hook         │  │ + DataCards        │  │
│  └─────────────┘  └──────────────┘  └────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Edge Function                    │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ System      │→ │ LLM (Groq/   │→ │ Tool Execution     │  │
│  │ Prompt      │  │ OpenRouter)  │  │ Engine             │  │
│  └─────────────┘  └──────────────┘  └────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Business Intelligence Tools               │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────────┐  │
│  │ get_business_ │ │ analyze_      │ │ get_financial_    │  │
│  │ overview      │ │ problem       │ │ analysis          │  │
│  └───────────────┘ └───────────────┘ └───────────────────┘  │
│  ┌───────────────┐ ┌───────────────┐                        │
│  │ get_forecast  │ │ get_smart_    │                        │
│  │               │ │ recommendations│                        │
│  └───────────────┘ └───────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase Database                       │
│  projects │ candidates │ project_staff │ expense_claims     │
└─────────────────────────────────────────────────────────────┘
```

---

## File Locations Summary

### Backend (Supabase Edge Functions)
```
supabase/functions/ai-chat-mcp-enhanced/
├── index.ts                 # Main entry, system prompt
└── tools/
    ├── index.ts             # All tool definitions including BI tools
    ├── cache.ts             # Caching layer
    └── integrations.ts      # External integrations
```

### Frontend (React Components)
```
src/
├── components/ai-assistant/
│   ├── ChatWidget.tsx           # Current chat widget (Phase 1)
│   ├── EnhancedChatWidget.tsx   # Enhanced widget (Phase 2)
│   ├── EnhancedMessageList.tsx  # Rich message rendering
│   ├── ToolExecutionIndicator.tsx
│   ├── ConfirmationDialog.tsx
│   ├── DataCards/
│   │   ├── ProjectDataCard.tsx
│   │   ├── CandidateDataCard.tsx
│   │   ├── DataTable.tsx
│   │   └── index.ts
│   └── index.ts
├── hooks/
│   └── use-enhanced-ai-chat.ts  # Enhanced hook with streaming
└── types/
    └── ai-chat.types.ts         # TypeScript types
```

---

## Cost Estimates

| Users/Month | Queries/User | Total Queries | Est. Cost |
|-------------|--------------|---------------|-----------|
| 100 | 50 | 5,000 | ~$5 |
| 500 | 50 | 25,000 | ~$20 |
| 1,000 | 50 | 50,000 | ~$40 |

*Based on Groq/OpenRouter pricing for qwen3-32b model*

---

## Changelog

### 2025-12-02: Phase 1 Complete
- Added 5 business intelligence tools
- Updated system prompt with smart reasoning guidelines
- Deployed to production
- Tested all tools successfully

### Next Steps
1. Integrate frontend components (Phase 2)
2. Add streaming responses
3. Implement confirmation dialogs for write operations
4. Add multi-turn conversation memory (Phase 3)
