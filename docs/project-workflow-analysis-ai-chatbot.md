# Project Workflow Analysis - AI Chatbot Expansion

**Analysis Date:** 2025-10-09
**Project Scope:** AI Chatbot Feature Expansion (Phase 2-3)
**Field Type:** Brownfield Enhancement
**Parent Project:** Baito-AI Workforce Management Platform

---

## Project Classification

### Project Level: **1** (Small/Moderate Feature Enhancement)

**Rationale:**
- Expanding existing AI chatbot from 6 → 50+ tools
- Infrastructure already exists (Supabase Edge Functions, OpenRouter, database tables with RLS)
- Well-defined requirements in AI_CHATBOT_PRD.md
- Clear implementation path defined in Sprint Change Proposal
- Moderate complexity: 44 new tools across 6 sprints (9-13 weeks)

### Field Type: **Brownfield**

- Existing AI chatbot infrastructure (ReAct loop implemented)
- 50+ database tables with RLS policies already in place
- Current implementation: 6 tools (12% coverage)
- Target: 50 tools (100% coverage)

### Project Type: **Backend Service Enhancement**

- **Primary:** Backend Edge Function expansion (Supabase Functions)
- **Secondary:** Frontend chat UI (already exists, minor enhancements)
- **Technology:** TypeScript + Deno (Edge Functions) + OpenRouter API

---

## User Interface Analysis

### Has User Interface: **true**

**UI Complexity:** Simple (already built)

**Existing UI Components:**
- Chat widget (src/components/ai-assistant/ChatWidget.tsx)
- Message list (src/components/ai-assistant/MessageList.tsx)
- Quick actions (src/components/ai-assistant/QuickActions.tsx)
- Typing indicator (src/components/ai-assistant/TypingIndicator.tsx)

**UI Changes Required:**
- Minimal: Update quick action buttons for new entity types
- Add entity-specific result cards (warehouse items, expense claims, tasks)
- Add photo preview for warehouse items with images
- Enhance error messages for new tool categories

**UX Spec Status:**
- Base UX spec exists: /docs/ux-specification.md
- Course Correction identified need for Section 8: Entity-Specific User Flows
- UX updates are ADDITIVE (new flows for warehouse, expense, tasks, attendance)

---

## Requirements Documentation

### PRD Status: **Complete** (with updates pending)

**PRD Location:** /docs/AI_CHATBOT_PRD.md

**Current State:**
- ✅ Complete Phase 1 documentation (6 tools implemented)
- ⏳ Pending updates from Course Correction (7 change proposals approved)
- ✅ FRs, NFRs, Epics defined
- ✅ Success metrics defined
- ⏳ Phase 2-3 tool specifications need expansion

**PRD Updates Required (from Sprint Change Proposal):**
1. Section 4.3.1: Expand Supported Entities table (8 → 20+ entities)
2. Section 9: Redefine Implementation Phases (mark Phase 1 complete, detail Phase 2-3)
3. Section 10.4.1: Expand AVAILABLE_TOOLS (6 → 26 tools shown)
4. Section 11: Add entity coverage KPIs (12% → 52% → 100%)

### GDD Status: **N/A** (Not a game project)

---

## Architecture Analysis

### Existing Architecture: **Well-Defined**

**Architecture Documentation:** /docs/architecture.md (847 lines)

**Current AI Chatbot Architecture:**
- Edge Function: supabase/functions/ai-chat/index.ts
- LLM Provider: OpenRouter with Gemini 2.5 Flash ($0.20/1M tokens)
- Pattern: ReAct loop (Reasoning + Acting)
- Database: Direct Supabase queries with RLS enforcement
- Conversation History: pgvector semantic search (future)

**Infrastructure Status:**
- ✅ 50+ database tables with complete RLS policies
- ✅ Supabase Edge Functions configured
- ✅ OpenRouter integration working
- ✅ Authentication flow integrated
- ✅ Rate limiting and security in place
- ⏳ Tool-to-table mappings need documentation

### Architecture Style: **Serverless Edge Functions + BaaS**

- Serverless: Supabase Edge Functions (Deno runtime)
- Database: Supabase PostgreSQL with Row-Level Security
- Frontend: React SPA
- State Management: React Query (for chat state)

### Repository Strategy: **Monorepo**

- Single repository: Baito-AI
- Frontend + Edge Functions + Database migrations in one repo
- Deployment: Netlify (frontend) + Supabase Cloud (backend)

---

## Epic Breakdown (from AI_CHATBOT_PRD.md)

### Completed Epics:
1. **Epic 1: AI Chatbot Assistant (Phase 1)** ✅
   - 6 tools implemented
   - ReAct loop working
   - Basic project and candidate queries

### Pending Epics (from Sprint Change Proposal):

2. **Epic 2: Warehouse Operations AI Tools** 🔴 High Priority
   - Sprint 1-2 (Weeks 1-4)
   - 8 tools: query, reserve, checkout, search by photo

3. **Epic 3: Enhanced Expense Management** 🔴 High Priority
   - Sprint 2-3 (Weeks 3-6)
   - 10 tools: claims, receipts, approvals, batches

4. **Epic 4: Task & Goal Management** 🔴 High Priority
   - Sprint 3-4 (Weeks 5-8)
   - 8 tools: tasks, assignments, comments, goals

5. **Epic 5: Team & Attendance Intelligence** 🟡 Medium Priority
   - Sprint 4-5 (Weeks 7-10)
   - 12 tools: attendance, schedules, performance

6. **Epic 6: Document & Notification Hub** 🟢 Full Coverage
   - Sprint 5-6 (Weeks 9-13)
   - 6 tools: documents, notifications, feedback

---

## Technical Constraints

### Must-Have Constraints:
- **Database:** Supabase PostgreSQL (existing)
- **Edge Runtime:** Deno (Supabase Functions)
- **LLM Provider:** OpenRouter (cost-effective)
- **Authentication:** Supabase Auth (existing)
- **RLS Policies:** All tools must respect existing RLS policies
- **Language:** TypeScript

### Performance Requirements:
- Tool execution: < 500ms per database query
- LLM response: < 3 seconds (P95)
- Concurrent users: Support 50+ simultaneous chat sessions
- Rate limiting: 20 requests/minute per user

### Security Requirements:
- All tools enforce RLS policies (no privilege escalation)
- User can only access data they have permission to view
- No SQL injection vectors (parameterized queries only)
- API keys secured in environment variables

---

## Integration Requirements

### Internal Integrations:
- ✅ Supabase Auth (existing)
- ✅ Supabase Database with RLS (existing)
- ✅ Supabase Storage (for warehouse item photos)
- ⏳ Activity logging system (comprehensive logging implemented)

### External Integrations:
- ✅ OpenRouter API (Gemini 2.5 Flash)
- 🟡 Future: CrewAI for multi-agent orchestration (Phase 3)
- 🟡 Future: Vector search for conversation history (Phase 3)

---

## Implementation Phases

### Phase 1: Core Operations (Complete) ✅
- **Timeline:** Completed
- **Coverage:** 6 tools (12%)
- **Status:** LIVE in production

### Phase 2: High Priority Business Operations 🔴
- **Timeline:** Weeks 1-6 (Sprint 1-3)
- **Coverage:** 26 tools (52%)
- **Epics:** Warehouse, Expense Claims, Tasks, Team Management
- **Status:** READY TO START (pending architecture updates)

### Phase 3: Full Coverage 🟡
- **Timeline:** Weeks 7-13 (Sprint 4-6)
- **Coverage:** 50 tools (100%)
- **Epics:** All remaining features
- **Status:** PLANNED

---

## Workflow Status Tracking

### Completed Workflows:
- [x] Course Correction Analysis (correct-course)
- [x] Sprint Change Proposal generated
- [x] 7 change proposals approved
- [x] Handoff plan established

### In Progress:
- [ ] Solution Architecture (solution-architecture) ← CURRENT
- [ ] Validate latest Tech Spec (validate-architecture)
- [ ] Create Tech-Spec for specific epic (tech-spec)

### Pending:
- [ ] Apply PRD updates (Architect Week 1)
- [ ] Create AI_CHATBOT_TOOL_REFERENCE.md (Architect Week 1)
- [ ] Update AI_CHATBOT_MISSING_FEATURES.md (Architect Week 1)
- [ ] Add UX Spec Section 8 (Architect Week 1)
- [ ] Sprint 1 kickoff (Week 1, Days 4-5)

---

## Success Criteria

### Phase 2 Success Metrics (Week 6):
- Entity coverage: 52% (26/50 tools)
- Warehouse queries working: "What do I have in my warehouse?" returns results
- Expense claim queries: "Show pending expense claims" returns data
- Task queries: "What are my open tasks?" returns task list
- User satisfaction: 4+ stars for new features

### Phase 3 Success Metrics (Week 13):
- Entity coverage: 100% (50/50 tools)
- All database tables accessible via AI chat
- Advanced features: Multi-agent orchestration, vector search
- Performance: <3s LLM response time (P95)
- Adoption: 80% of active users use AI chat weekly

---

## Next Steps

1. **Execute solution-architecture workflow** to create AI_CHATBOT_ARCHITECTURE.md
2. **Validate architecture** against existing system (brownfield integration)
3. **Generate tech specs** for each epic (Warehouse, Expense, Tasks, Team, Documents)
4. **Architect applies PRD updates** per Sprint Change Proposal (Week 1)
5. **Sprint 1 kickoff** - Warehouse Operations (Week 1, Days 4-5)

---

**Analysis Version:** 1.0
**Last Updated:** 2025-10-09
**Next Review:** After solution architecture completion
