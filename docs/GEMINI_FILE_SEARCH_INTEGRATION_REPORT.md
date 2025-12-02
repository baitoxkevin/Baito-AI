# Gemini File Search Integration Report
## Baito-AI System Comprehensive Analysis

**Date:** December 1, 2025
**Version:** 1.0
**Prepared for:** Baito-AI Development Team

---

## Executive Summary

This report provides a comprehensive analysis of the Baito-AI staffing and project management system, identifying ALL integration points for Gemini File Search across the entire platform. The analysis covers web application, mobile app, edge functions, and backend services.

Gemini File Search can transform how users interact with documents, enabling natural language queries across contracts, resumes, receipts, schedules, and historical data - making information retrieval instant and contextual.

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Module-by-Module Analysis](#2-module-by-module-analysis)
   - [2.1 Project Management](#21-project-management)
   - [2.2 Candidate Management](#22-candidate-management)
   - [2.3 Staff Scheduling & Calendar](#23-staff-scheduling--calendar)
   - [2.4 Expense Claims](#24-expense-claims)
   - [2.5 Payments & Payroll](#25-payments--payroll)
   - [2.6 Document Management](#26-document-management)
   - [2.7 AI Chat Assistant](#27-ai-chat-assistant)
   - [2.8 Tools & Data Extraction](#28-tools--data-extraction)
   - [2.9 Settings & Configuration](#29-settings--configuration)
   - [2.10 Dashboard & Analytics](#210-dashboard--analytics)
   - [2.11 Warehouse Management](#211-warehouse-management)
   - [2.12 Mobile Application](#212-mobile-application)
3. [Unified File Search Architecture](#3-unified-file-search-architecture)
4. [Data Types & Indexing Strategy](#4-data-types--indexing-strategy)
5. [Implementation Roadmap](#5-implementation-roadmap)
6. [Technical Specifications](#6-technical-specifications)

---

## 1. System Architecture Overview

### Current Tech Stack
- **Frontend:** React 18 + TypeScript + Vite
- **UI:** TailwindCSS + ShadCN UI
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **AI Services:** OpenRouter API (Gemini 2.5 Flash), Google Generative AI
- **Mobile:** React Native (Expo)
- **Storage:** Supabase Storage (project_documents bucket)

### Key Data Entities
```
Projects          -> Documents, Contracts, Briefs
Candidates        -> Resumes, CVs, Certifications, ID Documents
Expense Claims    -> Receipts, Invoices
Payments          -> Payment Records, Bank Statements
Companies         -> Contracts, Agreements
Warehouse Items   -> Product Manuals, Specifications
```

### Current Document Storage
- **Location:** `supabase.storage.from('project_documents')`
- **Supported Types:** PDF, Word, Excel, Images, Videos, Links
- **Max Size:** 20MB per file
- **Organization:** By project_id subdirectories

---

## 2. Module-by-Module Analysis

### 2.1 Project Management

**File Location:** `/src/pages/ProjectsPageRedesign.tsx`, `/src/components/NewProjectDialog.tsx`

#### Current Functionality
- Create, edit, delete projects
- Manage project details (dates, venue, staffing requirements)
- Project status tracking (planning, active, completed, cancelled)
- Brand/company association
- Staff assignment and scheduling

#### File Search Integration Opportunities

| Use Case | Document Types | Natural Language Queries |
|----------|----------------|-------------------------|
| Contract Lookup | PDF, Word | "Find the contract for Mr.DIY October event" |
| Brief Search | PDF, Images | "Show me event briefs mentioning outdoor setup" |
| Venue Documents | PDF, Images | "Find floor plans for KLCC venue" |
| Client Requirements | Word, PDF | "What are Samsung's brand guidelines?" |
| Historical Projects | All | "Show similar projects to this roadshow" |

#### Specific Integration Points

```typescript
// ProjectDocumentsManager.tsx - Add semantic search
interface ProjectDocumentSearch {
  projectId: string;
  query: string;
  documentTypes?: ('contract' | 'brief' | 'permit' | 'invoice' | 'plan')[];
}

// Example queries:
"Find safety permits for this project"
"What is the payment terms in the contract?"
"Show requirements mentioning uniform color"
"Find all venue layout documents"
```

#### Data to Index
- `project_documents` table (file_name, description, file_content)
- `projects` table (title, venue_address, venue_details, description)
- Linked external documents (Google Drive, Slides)

---

### 2.2 Candidate Management

**File Location:** `/src/pages/CandidatesPage.tsx`, `/src/components/CandidateDetailsDialog.tsx`, `/src/components/EditCandidateDialog.tsx`

#### Current Functionality
- Full candidate database with 100+ fields
- Performance metrics and loyalty tiers
- Blacklist/ban management
- Project history tracking
- Resume text import via AI extraction

#### File Search Integration Opportunities

| Use Case | Document Types | Natural Language Queries |
|----------|----------------|-------------------------|
| Resume Search | PDF, Word, Text | "Find candidates with forklift certification" |
| Certification Lookup | PDF, Images | "Show valid typhoid certificates expiring this month" |
| ID Verification | Images | "Find candidate IC images for payroll verification" |
| Experience Match | All | "Candidates who worked at Samsung events before" |
| Skills Discovery | Resumes | "Find Chinese-speaking promoters with car" |

#### Specific Integration Points

```typescript
// CandidateSearchEngine - Enhanced with File Search
interface CandidateFileSearch {
  // Skill-based resume search
  skills: string[];
  certifications: string[];
  experience_keywords: string[];

  // Document search
  documentTypes: ('resume' | 'ic' | 'cert' | 'photo')[];
  query: string;
}

// Example queries:
"Find candidates with event management experience"
"Show resumes mentioning hospitality background"
"Candidates with valid food handler certificate"
"Find Chinese fluent promoters who worked at malls"
```

#### Data to Index
- `candidates` table (full_name, work_experience, skills, raw_resume)
- Candidate documents (profile_photo, ic images, certificates)
- `candidate_history` table (project assignments, ratings, feedback)
- Performance metrics and ratings

---

### 2.3 Staff Scheduling & Calendar

**File Location:** `/src/pages/CalendarPage.tsx`, `/src/components/CalendarView.tsx`, `/src/components/ListView.tsx`

#### Current Functionality
- Monthly/weekly calendar views
- Project scheduling across multiple days
- Staff assignment per project per day
- Multi-month data prefetching
- Conflict detection for double-booking

#### File Search Integration Opportunities

| Use Case | Document Types | Natural Language Queries |
|----------|----------------|-------------------------|
| Schedule Documents | Excel, PDF | "Find October schedule spreadsheet" |
| Attendance Records | Excel, PDF | "Show attendance report for Hatch project" |
| Shift Rosters | Excel | "Find roster for next week's Samsung event" |
| Leave Records | PDF | "Which staff requested leave in December?" |

#### Specific Integration Points

```typescript
// ScheduleDocumentSearch
interface ScheduleSearch {
  dateRange: { start: Date; end: Date };
  projectId?: string;
  candidateId?: string;
  query: string;
}

// Example queries:
"Find all schedules for December 2025"
"Show historical attendance for John at roadshows"
"Find shift conflicts for next week"
"Attendance reports with late arrivals"
```

#### Data to Index
- Schedule exports (Excel, PDF)
- Attendance records
- Leave applications
- Project staff assignments history

---

### 2.4 Expense Claims

**File Location:** `/src/pages/ExpenseClaimsPage.tsx`, `/src/components/ExpenseClaimForm.tsx`, `/src/lib/expense-claim-service.ts`

#### Current Functionality
- Create expense claims with multiple receipts
- OCR scanning via Gemini Vision API
- Draft/Pending/Approved/Rejected workflow
- Project association for claims
- Receipt validation and categorization

#### File Search Integration Opportunities

| Use Case | Document Types | Natural Language Queries |
|----------|----------------|-------------------------|
| Receipt Search | Images, PDF | "Find all petrol receipts from October" |
| Invoice Lookup | PDF | "Show approved invoices over RM500" |
| Vendor Search | Receipts | "All receipts from 7-Eleven this month" |
| Audit Trail | All | "Find rejected claims with reason 'missing receipt'" |
| Category Analysis | All | "Transport expenses for Project X" |

#### Specific Integration Points

```typescript
// ExpenseClaimFileSearch - Enhanced OCR + Search
interface ExpenseSearch {
  dateRange: { start: Date; end: Date };
  amountRange?: { min: number; max: number };
  category?: ('transport' | 'meals' | 'supplies' | 'equipment')[];
  projectId?: string;
  vendor?: string;
  query: string;
}

// Example queries:
"Find all meal receipts for Samsung project"
"Show expenses over RM100 this month"
"Receipts from Shell petrol station"
"Claims pending approval longer than 7 days"
```

#### Data to Index
- Receipt images (OCR extracted text)
- `expense_claims` table (title, description, amount, category)
- Approval documents and rejection reasons
- Vendor information extracted from receipts

---

### 2.5 Payments & Payroll

**File Location:** `/src/pages/PaymentsPage.tsx`, `/src/lib/payment-queue-service.ts`, `/src/components/payroll-manager/`

#### Current Functionality
- Payment batch management
- Staff payment processing
- DuitNow payment export
- ECP (Electronic Credit Payment) export
- Payment status tracking (pending, approved, completed)

#### File Search Integration Opportunities

| Use Case | Document Types | Natural Language Queries |
|----------|----------------|-------------------------|
| Payment Records | PDF, Excel | "Show all payments to Ahmad in 2025" |
| Bank Statements | PDF | "Find bank reconciliation for October" |
| Payroll Reports | Excel | "Payroll summary for Project ABC" |
| Payment Exports | CSV, TXT | "Find DuitNow export file for batch 123" |

#### Specific Integration Points

```typescript
// PayrollDocumentSearch
interface PayrollSearch {
  dateRange: { start: Date; end: Date };
  candidateId?: string;
  projectId?: string;
  batchId?: string;
  status?: ('pending' | 'approved' | 'completed')[];
  query: string;
}

// Example queries:
"Find payment proof for staff ID 12345"
"Show October payroll exports"
"Bank statements for reconciliation"
"Payment history for Siti over last 6 months"
```

#### Data to Index
- Payment batch records
- Export files (DuitNow, ECP format)
- Bank reconciliation documents
- Payment slips and confirmations

---

### 2.6 Document Management

**File Location:** `/src/components/ProjectDocumentsManager.tsx`, `/src/lib/document-service.ts`

#### Current Functionality
- Upload files to projects (PDF, Word, Excel, Images)
- Link external documents (Google Drive, Slides)
- Document categorization (contracts, invoices, reports, permits, plans)
- Download and delete capabilities
- Document preview and metadata

#### File Search Integration Opportunities

| Use Case | Document Types | Natural Language Queries |
|----------|----------------|-------------------------|
| Cross-Project Search | All | "Find all contracts mentioning penalty clause" |
| Template Search | Word, PDF | "Show job order template" |
| Legal Documents | PDF | "Find NDA agreements" |
| Permit Search | PDF | "Valid permits for outdoor events" |

#### Specific Integration Points

```typescript
// GlobalDocumentSearch - System-wide file search
interface GlobalDocumentSearch {
  scope: 'all' | 'project' | 'company' | 'category';
  scopeId?: string;
  categories?: string[];
  fileTypes?: string[];
  dateRange?: { start: Date; end: Date };
  query: string;
}

// Example queries:
"Find all documents mentioning confidentiality"
"Insurance certificates valid in 2025"
"Setup instructions for exhibition booths"
"Find invoice templates"
```

#### Data to Index
- `project_documents` table (full-text content)
- External link metadata
- Document categories and tags
- File contents via OCR/text extraction

---

### 2.7 AI Chat Assistant

**File Location:** `/src/components/ai-assistant/ChatWidget.tsx`, `/src/hooks/use-ai-chat.ts`, `/supabase/functions/ai-chat/`

#### Current Functionality
- Natural language queries for projects and candidates
- ReAct pattern with tool calling
- Context awareness (current page, entity)
- Multiple personas (general, operations, finance, HR)
- Semantic memory with embeddings

#### File Search Integration Opportunities

**THIS IS THE PRIMARY INTEGRATION POINT FOR GEMINI FILE SEARCH**

| Use Case | Document Types | Natural Language Queries |
|----------|----------------|-------------------------|
| Document Q&A | All | "What does the contract say about overtime pay?" |
| Cross-Reference | All | "Find candidates matching the requirements in job_brief.pdf" |
| Compliance Check | Contracts | "Are we compliant with the safety requirements in permit.pdf?" |
| Summary Generation | All | "Summarize the project requirements from attached documents" |

#### Specific Integration Points

```typescript
// Enhanced AI Chat with File Search Tool
const FILE_SEARCH_TOOL = {
  type: 'function',
  function: {
    name: 'search_documents',
    description: 'Search through uploaded documents to find relevant information',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural language search query'
        },
        scope: {
          type: 'string',
          enum: ['current_project', 'all_projects', 'candidates', 'expenses', 'global'],
          description: 'Scope of document search'
        },
        document_types: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by document types (contract, receipt, resume, etc.)'
        }
      },
      required: ['query']
    }
  }
}

// Example conversations:
User: "What are the key requirements in the event brief?"
AI: [Calls search_documents] "Based on the project brief, the key requirements are..."

User: "Find candidates that match the skills in job_posting.pdf"
AI: [Searches job_posting.pdf, then queries candidates] "I found 5 candidates matching..."

User: "How much did we spend on transport for the Samsung project?"
AI: [Searches expense claims + receipts] "Total transport expenses: RM 2,450..."
```

#### Current AI Chat Tools to Enhance
1. `query_projects` - Add document content search
2. `query_candidates` - Add resume/certification search
3. `get_project_details` - Include document summaries
4. NEW: `search_documents` - Dedicated file search tool
5. NEW: `answer_from_document` - Q&A on specific document

---

### 2.8 Tools & Data Extraction

**File Location:** `/src/pages/ToolsPage.tsx`, `/src/lib/ai-candidate-extractor.ts`, `/src/lib/receipt-ocr-service.ts`

#### Current Functionality
- Data extraction from WhatsApp chats
- Receipt OCR scanning (Gemini Vision)
- Resume text import and parsing
- Google Slides scraping
- Payroll management tools

#### File Search Integration Opportunities

| Use Case | Document Types | Natural Language Queries |
|----------|----------------|-------------------------|
| Bulk Resume Processing | PDF, Word | "Extract all candidates from uploaded resumes" |
| Receipt Batch Search | Images | "Find duplicate receipts in batch" |
| Template Matching | All | "Match data format to existing templates" |

#### Specific Integration Points

```typescript
// Enhanced Data Extraction with File Search
interface SmartExtraction {
  // Use file search to find similar documents
  findSimilarDocuments(file: File): Promise<Document[]>;

  // Auto-suggest field mappings based on historical data
  suggestFieldMappings(content: string): Promise<FieldMapping[]>;

  // Validate extracted data against existing records
  validateAgainstExisting(data: any): Promise<ValidationResult>;
}

// Example use cases:
"Find similar resumes to auto-fill missing fields"
"Match this receipt format to known vendors"
"Find duplicates before importing"
```

---

### 2.9 Settings & Configuration

**File Location:** `/src/pages/SettingsPage.tsx`

#### Current Functionality
- Company management
- User/staff management
- Candidate management (settings view)
- Authentication status checking

#### File Search Integration Opportunities

| Use Case | Document Types | Natural Language Queries |
|----------|----------------|-------------------------|
| Policy Search | PDF | "Find company policy on expense limits" |
| Template Management | Word, PDF | "Show all email templates" |
| Configuration Docs | PDF | "System setup documentation" |

#### Specific Integration Points

```typescript
// Policy & Template Search
interface PolicySearch {
  category: 'hr' | 'finance' | 'operations' | 'legal';
  query: string;
}

// Example queries:
"Company leave policy"
"Expense approval workflow document"
"Staff onboarding checklist"
```

---

### 2.10 Dashboard & Analytics

**File Location:** `/src/pages/DashboardPage.tsx`

#### Current Functionality
- Personal KPIs (projects, tasks, hours)
- Todo list with priorities
- Upcoming birthdays
- Leave balance tracking
- AI-generated advice

#### File Search Integration Opportunities

| Use Case | Document Types | Natural Language Queries |
|----------|----------------|-------------------------|
| Report Search | Excel, PDF | "Find Q3 performance report" |
| Historical Data | All | "Compare this month to last month's metrics" |
| Trend Analysis | Reports | "Projects with declining staff attendance" |

#### Specific Integration Points

```typescript
// Dashboard Document Insights
interface DashboardSearch {
  metric: string;
  timeRange: 'week' | 'month' | 'quarter' | 'year';
  includeDocuments: boolean;
  query: string;
}

// Example queries:
"Show revenue reports for Q4"
"Find projects mentioned in client feedback"
"Historical performance trends"
```

---

### 2.11 Warehouse Management

**File Location:** `/src/pages/WarehousePage.tsx`, `/src/components/warehouse/`

#### Current Functionality
- Inventory tracking with QR codes
- Item reservations for projects
- Rack/row location management
- Item checkout/checkin

#### File Search Integration Opportunities

| Use Case | Document Types | Natural Language Queries |
|----------|----------------|-------------------------|
| Product Manuals | PDF | "Find setup instructions for booth display" |
| Inventory Docs | Excel | "Inventory count from last audit" |
| Equipment Specs | PDF | "Specifications for projector model X" |

#### Specific Integration Points

```typescript
// Warehouse Document Search
interface WarehouseDocSearch {
  itemId?: string;
  category?: string;
  documentType: ('manual' | 'specs' | 'warranty' | 'inventory');
  query: string;
}

// Example queries:
"Setup guide for event tent"
"Warranty documents for audio equipment"
"Previous usage history for item ABC"
```

---

### 2.12 Mobile Application

**File Location:** `/baito-mobile/`

#### Current Functionality
- Worker app for staff
- Admin app for managers
- Clock in/out
- Schedule viewing
- Profile management
- Notifications

#### File Search Integration Opportunities

| Use Case | Document Types | Natural Language Queries |
|----------|----------------|-------------------------|
| On-site Document Access | PDF, Images | "Show venue map for today's event" |
| Quick Reference | PDF | "Event brief for current assignment" |
| Offline Search | Cached | "My certifications" |

#### Specific Integration Points

```typescript
// Mobile File Search API
interface MobileDocSearch {
  // Context-aware (current assignment)
  currentAssignment?: boolean;

  // Offline-capable cached search
  offlineOnly?: boolean;

  query: string;
}

// Example mobile queries:
"Show today's project brief"
"Contact details from assignment"
"My uploaded certificates"
```

---

## 3. Unified File Search Architecture

### Proposed Architecture

```
+------------------------------------------------------------------+
|                    BAITO-AI FILE SEARCH LAYER                     |
+------------------------------------------------------------------+
|                                                                    |
|   +------------------+     +--------------------+                  |
|   | Gemini File API  |<--->| Document Indexer   |                  |
|   | (File Search)    |     | (Vector Embeddings)|                  |
|   +------------------+     +--------------------+                  |
|            ^                        ^                              |
|            |                        |                              |
|   +--------v------------------------v---------+                    |
|   |          UNIFIED SEARCH SERVICE           |                    |
|   |  - Natural language query processing      |                    |
|   |  - Context-aware search (project/user)    |                    |
|   |  - Multi-source aggregation               |                    |
|   |  - Permission-based filtering             |                    |
|   +-------------------------------------------+                    |
|            ^            ^            ^                             |
|            |            |            |                             |
+------------|------------|------------|-----------------------------+
             |            |            |
    +--------+---+  +-----+-----+  +---+--------+
    | AI Chat    |  | Document  |  | Module     |
    | Assistant  |  | Manager   |  | Search     |
    | (Baiger)   |  | Component |  | APIs       |
    +------------+  +-----------+  +------------+
```

### Core Components

#### 1. Document Indexer Service
```typescript
// /src/lib/file-search/document-indexer.ts
interface DocumentIndexer {
  // Index new documents on upload
  indexDocument(doc: ProjectDocument): Promise<IndexResult>;

  // Batch index existing documents
  indexBatch(projectId: string): Promise<BatchResult>;

  // Update index on document change
  updateIndex(docId: string): Promise<void>;

  // Remove from index on delete
  removeFromIndex(docId: string): Promise<void>;
}
```

#### 2. Unified Search Service
```typescript
// /src/lib/file-search/search-service.ts
interface UnifiedSearchService {
  // Natural language search
  search(query: string, options: SearchOptions): Promise<SearchResult[]>;

  // Question answering on documents
  askQuestion(question: string, documentIds: string[]): Promise<Answer>;

  // Find similar documents
  findSimilar(documentId: string, limit: number): Promise<Document[]>;

  // Summarize documents
  summarize(documentIds: string[]): Promise<Summary>;
}

interface SearchOptions {
  scope: 'global' | 'project' | 'candidate' | 'expenses';
  scopeId?: string;
  documentTypes?: string[];
  dateRange?: DateRange;
  userId: string; // For permission checking
}
```

#### 3. AI Chat Integration
```typescript
// /supabase/functions/ai-chat-mcp-enhanced/file-search-tool.ts
const FILE_SEARCH_TOOLS = [
  {
    name: 'search_documents',
    description: 'Search through uploaded documents',
    handler: async (args, context) => {
      const results = await searchService.search(args.query, {
        scope: args.scope || 'global',
        userId: context.userId
      });
      return formatSearchResults(results);
    }
  },
  {
    name: 'ask_document',
    description: 'Ask a question about a specific document',
    handler: async (args, context) => {
      const answer = await searchService.askQuestion(
        args.question,
        args.documentIds
      );
      return answer;
    }
  },
  {
    name: 'summarize_documents',
    description: 'Generate a summary of one or more documents',
    handler: async (args, context) => {
      const summary = await searchService.summarize(args.documentIds);
      return summary;
    }
  }
];
```

---

## 4. Data Types & Indexing Strategy

### Document Categories & Index Priority

| Category | File Types | Index Priority | OCR Required | Embedding Model |
|----------|-----------|----------------|--------------|-----------------|
| Contracts | PDF, Word | HIGH | Yes | text-embedding-3-large |
| Resumes | PDF, Word, Text | HIGH | Yes | text-embedding-3-large |
| Receipts | Images, PDF | HIGH | Yes | text-embedding-3-small |
| Briefs | PDF, Word | MEDIUM | Yes | text-embedding-3-large |
| Photos | Images | LOW | No | CLIP (if needed) |
| Videos | Links | LOW | No | Metadata only |
| Spreadsheets | Excel, CSV | MEDIUM | No | Custom parser |

### Index Schema

```sql
-- Supabase table for document embeddings
CREATE TABLE document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES project_documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding vector(1536), -- OpenAI text-embedding-3-small
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_doc_chunk UNIQUE (document_id, chunk_index)
);

-- Index for vector similarity search
CREATE INDEX document_embeddings_vector_idx
ON document_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Search function
CREATE OR REPLACE FUNCTION search_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  filter_project_id uuid DEFAULT NULL,
  filter_document_types text[] DEFAULT NULL
)
RETURNS TABLE (
  document_id uuid,
  chunk_text text,
  similarity float,
  metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    de.document_id,
    de.chunk_text,
    1 - (de.embedding <=> query_embedding) as similarity,
    de.metadata
  FROM document_embeddings de
  JOIN project_documents pd ON de.document_id = pd.id
  WHERE
    (filter_project_id IS NULL OR pd.project_id = filter_project_id)
    AND (filter_document_types IS NULL OR pd.file_type = ANY(filter_document_types))
    AND 1 - (de.embedding <=> query_embedding) > match_threshold
  ORDER BY de.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

---

## 5. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

#### Tasks
- [ ] Set up Gemini File Search API integration
- [ ] Create document embedding service
- [ ] Add `document_embeddings` table to Supabase
- [ ] Implement basic text extraction for PDF/Word
- [ ] Create indexing pipeline for new uploads

#### Deliverables
- Document indexer service
- Basic search API
- Admin tool to trigger re-indexing

### Phase 2: AI Chat Integration (Week 3-4)

#### Tasks
- [ ] Add `search_documents` tool to AI chat
- [ ] Add `ask_document` tool for Q&A
- [ ] Implement context-aware search (current project)
- [ ] Add document citations in AI responses

#### Deliverables
- Enhanced AI chat with file search capability
- "Ask about documents" quick action
- Document reference cards in chat

### Phase 3: Module Integration (Week 5-6)

#### Tasks
- [ ] Add search bar to ProjectDocumentsManager
- [ ] Implement candidate resume search
- [ ] Add expense receipt search
- [ ] Create global search command (Cmd+K)

#### Deliverables
- Search UI in all document-heavy modules
- Global search spotlight
- Search result previews

### Phase 4: Mobile & Advanced Features (Week 7-8)

#### Tasks
- [ ] Mobile file search API
- [ ] Offline search capability
- [ ] Document summarization feature
- [ ] Similar document suggestions
- [ ] Search analytics dashboard

#### Deliverables
- Mobile search integration
- AI-powered document insights
- Usage analytics

---

## 6. Technical Specifications

### API Endpoints

```typescript
// File Search API
POST /api/file-search/index
POST /api/file-search/search
POST /api/file-search/ask
POST /api/file-search/summarize
GET  /api/file-search/similar/:documentId

// Edge Function
POST /functions/v1/ai-chat-mcp-enhanced
// Enhanced with file search tools
```

### Environment Variables

```env
# Gemini File Search
VITE_GEMINI_FILE_SEARCH_API_KEY=xxx
GEMINI_FILE_SEARCH_BUCKET=xxx

# Embeddings (if using OpenAI)
OPENAI_API_KEY=xxx

# Supabase
SUPABASE_URL=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```

### Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Search Latency | < 500ms | For cached queries |
| Indexing Speed | < 5s/doc | For average PDF |
| Accuracy | > 85% | For top-5 results |
| Concurrent Searches | 100/s | Per tenant |

### Security Considerations

1. **Permission-based access:** All searches filtered by user permissions
2. **Document-level ACL:** Respect visibility settings (public, view_only, download_allowed)
3. **Audit logging:** Track all search queries
4. **PII handling:** Mask sensitive data in search previews
5. **Rate limiting:** Prevent abuse of search API

---

## Appendix A: Sample Search Queries by Module

### Project Management
```
"Find contracts mentioning penalty clause"
"Show event briefs for outdoor venues"
"Documents with Samsung brand guidelines"
"All permits expiring this month"
```

### Candidate Management
```
"Candidates with forklift license"
"Resumes mentioning hospitality experience"
"Chinese-speaking candidates with own car"
"Certifications expiring in 30 days"
```

### Expense Claims
```
"Petrol receipts from Shell station"
"Claims over RM500 pending approval"
"Transport expenses for Project ABC"
"Duplicate receipt detection"
```

### Payments
```
"Payment history for staff ID 12345"
"October payroll exports"
"Failed bank transfers this week"
"Reconciliation documents"
```

### AI Chat Assistant
```
User: "What does the contract say about overtime?"
User: "Find candidates matching the job brief requirements"
User: "Summarize the project documents"
User: "Any safety concerns in the venue permits?"
```

---

## Appendix B: File Type Support Matrix

| File Type | OCR Support | Full-Text Index | Preview | Download |
|-----------|-------------|-----------------|---------|----------|
| PDF | Yes | Yes | Yes | Yes |
| Word (.docx) | Yes | Yes | Yes | Yes |
| Excel (.xlsx) | No | Partial | Yes | Yes |
| Images (JPG/PNG) | Yes | Yes | Yes | Yes |
| Text (.txt) | N/A | Yes | Yes | Yes |
| Google Docs Link | Via API | Yes | External | External |
| Video Links | No | Metadata | Embed | External |

---

## Conclusion

Gemini File Search integration will transform Baito-AI from a data management system to an intelligent knowledge platform. Users will be able to:

1. **Find documents instantly** with natural language queries
2. **Get answers** from uploaded documents without manual reading
3. **Discover connections** between candidates, projects, and documents
4. **Make informed decisions** with AI-powered document insights

The recommended implementation approach is phased, starting with the AI Chat Assistant integration (highest impact) and expanding to module-specific search features.

**Estimated Total Effort:** 8 weeks
**Recommended Start:** Immediately after approval

---

*Report prepared by: Claude Code Analysis*
*Last Updated: December 1, 2025*
