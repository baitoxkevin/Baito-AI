# Excel Vision Extractor - Implementation Roadmap

**Version:** 1.0.0
**Last Updated:** 2025-10-08
**Status:** 🚧 In Development (30% Complete)

## Project Overview

Building a production-ready AI-powered Excel extraction system that handles complex, irregular spreadsheet layouts using Gemini Vision API with multi-phase validation.

## Progress Tracker

- [x] Phase 1: Foundation (30% complete)
- [ ] Phase 2: Core Agents (0% complete)
- [ ] Phase 3: Workflows (0% complete)
- [ ] Phase 4: Scripts & Tasks (0% complete)
- [ ] Phase 5: Testing & Refinement (0% complete)

---

## Phase 1: Foundation ✅ COMPLETE (30%)

### Completed Items

- [x] Module directory structure created
- [x] `config.yaml` with comprehensive settings
- [x] README.md documentation
- [x] ROADMAP.md (this file)
- [x] MODULE_SUMMARY.md quick reference

### Deliverables Created
- Module structure: `bmad/excel-extract/`
- Configuration: Full settings for APIs, validation, outputs
- Documentation: User guide and implementation plan

---

## Phase 2: Core Agents (Priority: HIGH)

### Agent 1: Data Extraction Orchestrator ⚠️ TODO
**Type:** Director Agent
**File:** `agents/data-extraction-orchestrator.md`

**Responsibilities:**
- Coordinates entire extraction pipeline
- Manages agent collaboration (Vision Analyzer, Validation Specialist, Import Manager)
- Handles file discovery and preparation
- Error recovery and retry logic
- Progress reporting and logging

**Key Capabilities:**
- Multi-file processing orchestration
- State management across workflow phases
- Automatic screenshot capture via Chrome MCP
- Report generation

**Implementation Checklist:**
- [ ] Agent definition with role and persona
- [ ] Workflow coordination logic
- [ ] Error handling strategies
- [ ] Progress tracking mechanisms
- [ ] Report templates

**Dependencies:**
- Chrome DevTools MCP (screenshots)
- File system access
- Other agents (Vision, Validation, Import)

---

### Agent 2: Vision Analyzer ⚠️ TODO (NEXT PRIORITY)
**Type:** Expert Agent
**File:** `agents/vision-analyzer.md`

**Responsibilities:**
- Gemini Vision API integration
- 4-phase AI analysis: Structure → Extract → Verify → Correct
- Handles merged cells, continuation rows, irregular layouts
- Extracts embedded receipts
- Provides confidence scores

**Key Capabilities:**

**Phase 1 - Structure Analysis:**
- Detect column headers and positions
- Identify merged cells and spanning regions
- Map continuation row patterns
- Detect receipt attachments

**Phase 2 - Data Extraction:**
- Extract candidate records row by row
- Handle multi-row candidates (continuation patterns)
- Parse payment calculations
- Extract receipt images

**Phase 3 - Self-Verification:**
- Verify column alignment
- Check extraction completeness
- Validate calculations
- Flag low-confidence extractions

**Phase 4 - Self-Correction:**
- Re-analyze flagged rows
- Correct misalignments
- Verify fixes

**Implementation Checklist:**
- [ ] Agent definition with expertise profile
- [ ] Gemini API integration code
- [ ] 4-phase analysis prompts
- [ ] Image handling (screenshots → API)
- [ ] Response parsing and structuring
- [ ] Confidence scoring algorithm
- [ ] Rate limiting implementation (15s delay)
- [ ] Error handling and retries

**Technical Specs:**
```python
# Gemini Vision Integration
model: "gemini-2.0-flash-exp"
input: PNG screenshot of Excel sheet
output: Structured JSON with candidate records

# API Call Pattern
1. Upload screenshot to Gemini
2. Send 4-phase analysis prompt
3. Parse JSON response
4. Validate structure
5. Return extracted data + confidence scores
```

**Dependencies:**
- `GEMINI_API_KEY` environment variable
- Chrome MCP for screenshots
- Python `requests` library

---

### Agent 3: Validation Specialist ⚠️ TODO
**Type:** Expert Agent
**File:** `agents/validation-specialist.md`

**Responsibilities:**
- Data quality assurance
- Calculation verification
- Duplicate detection
- Format validation
- Cross-sheet consistency checks

**Key Capabilities:**

**Calculation Verification:**
- Formula: `wages + ot + claims + allowance + commission = total_payment`
- Tolerance: ±RM 0.50 for rounding errors
- Flag mismatches for review

**Duplicate Detection:**
- Check for duplicate IC numbers
- Flag same IC with different names
- Cross-reference with existing Supabase data

**Format Validation:**
- IC: 12 digits (e.g., 990101-01-1234)
- Bank number: numeric, 10-20 digits
- Dates: valid formats
- Currency: numeric, positive values

**Cross-Sheet Consistency:**
- Same candidate across multiple sheets
- Project names consistency
- Payment date alignment

**Implementation Checklist:**
- [ ] Agent definition with validation expertise
- [ ] Calculation verification logic
- [ ] Duplicate detection algorithms
- [ ] Format validation rules
- [ ] Consistency check mechanisms
- [ ] Validation report generator
- [ ] Error flagging system

**Output Format:**
```markdown
# Validation Report
## Summary
- Total rows: 250
- Passed: 235 (94%)
- Failed: 15 (6%)

## Calculation Errors (5 rows)
- Row 12: Total mismatch (Expected: RM150, Found: RM145)
- Row 45: Missing OT calculation

## Duplicates (3 rows)
- IC 990101-01-1234: Appears in rows 23, 67 (different names)

## Format Issues (7 rows)
- Row 8: Invalid IC format
- Row 15: Bank number too short
```

**Dependencies:**
- Extracted data from Vision Analyzer
- Validation rules from config.yaml
- Supabase access (for duplicate checks)

---

### Agent 4: Supabase Import Manager ⚠️ TODO
**Type:** Expert Agent
**File:** `agents/supabase-import-manager.md`

**Responsibilities:**
- Database import operations
- Batch processing with conflict resolution
- Dry-run mode for safety
- Progress tracking and rollback support
- Schema validation

**Key Capabilities:**

**Batch Import:**
- Process records in batches (default: 50)
- Handle upsert conflicts (update vs insert)
- Track import progress
- Resume from failures

**Dry-Run Mode:**
- Simulate imports without writing
- Validate data against schema
- Report potential issues
- Estimate import time

**Conflict Resolution:**
- Detect existing records by IC + project
- Choose strategy: skip, update, or replace
- Log all conflicts

**Rollback Support:**
- Track imported record IDs
- Provide rollback commands
- Backup before major imports

**Implementation Checklist:**
- [ ] Agent definition with database expertise
- [ ] Supabase client integration
- [ ] Batch processing logic
- [ ] Dry-run simulation
- [ ] Conflict detection and resolution
- [ ] Progress tracking
- [ ] Rollback mechanisms
- [ ] Import report generator

**Technical Specs:**
```python
# Import Configuration
batch_size: 50
dry_run_default: true
table: "candidates"
conflict_resolution: "update"  # or "skip", "replace"

# Import Process
1. Validate schema mapping
2. Run dry-run simulation
3. Report potential issues
4. Confirm with user
5. Execute batch imports
6. Track progress
7. Generate completion report
```

**Output Format:**
```markdown
# Import Report
## Dry-Run Results
- Records to import: 250
- New records: 200
- Updates: 45
- Conflicts: 5

## Execution Summary (if confirmed)
- Batch 1/5: 50 records imported
- Batch 2/5: 50 records imported
- ...
- Total imported: 250
- Errors: 0
- Duration: 45 seconds
```

**Dependencies:**
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` environment variables
- Supabase MCP (optional, for schema inspection)
- Validated data from Validation Specialist

---

## Phase 3: Workflows (Priority: HIGH)

### Workflow 1: Full Extraction ⚠️ TODO (HIGH PRIORITY)
**File:** `workflows/full-extraction/`
**Description:** Complete end-to-end extraction from Excel files to Supabase

**Steps:**
1. **File Discovery** (Orchestrator)
   - Scan `excel_imports/` folder
   - Identify `.xlsx` files
   - Create output directory with timestamp

2. **Sheet Processing** (Loop per sheet)
   - Capture screenshot (Chrome MCP)
   - Vision analysis (Vision Analyzer)
   - Extract data to JSON
   - Save intermediate results

3. **Validation** (Validation Specialist)
   - Run calculation checks
   - Detect duplicates
   - Validate formats
   - Generate validation report

4. **Correction** (Manual + Vision Analyzer)
   - Review flagged rows
   - Re-analyze with corrections
   - Update validated dataset

5. **Mastersheet Generation** (Orchestrator)
   - Consolidate all sheets
   - Apply standard column mapping
   - Add metadata (source file, sheet, row)
   - Export to Excel + CSV

6. **Supabase Import** (Import Manager)
   - Dry-run first
   - Review dry-run report
   - Confirm and execute
   - Generate completion report

**Implementation Checklist:**
- [ ] Workflow definition file (`workflow.yaml`)
- [ ] Instructions for each step (`instructions.md`)
- [ ] Checklist for completion (`checklist.md`)
- [ ] Templates for outputs
- [ ] Error handling strategies

**Expected Duration:** 5-15 minutes per Excel file (10 sheets)

---

### Workflow 2: Vision Analysis ⚠️ TODO
**File:** `workflows/vision-analysis/`
**Description:** Focused AI analysis of Excel structure and content

**Use Case:** When you just need to understand Excel layout without full extraction

**Steps:**
1. Screenshot capture
2. 4-phase Gemini analysis
3. Structure report generation
4. Optional: manual extraction guidance

---

### Workflow 3: Data Verification ⚠️ TODO
**File:** `workflows/data-verification/`
**Description:** Standalone validation of previously extracted data

**Use Case:** Re-validate after manual corrections or before import

---

### Workflow 4: Mastersheet Generator ⚠️ TODO
**File:** `workflows/mastersheet-generator/`
**Description:** Consolidate validated data from multiple sources

**Use Case:** Merge data from multiple extraction runs

---

### Workflow 5: Supabase Import ⚠️ TODO
**File:** `workflows/supabase-import/`
**Description:** Import mastersheet to database with safety checks

**Use Case:** Final step - import validated data to production database

---

## Phase 4: Scripts & Tasks (Priority: MEDIUM)

### Task 1: Receipt Extractor ⚠️ TODO
**File:** `tasks/receipt-extractor.xml`
**Purpose:** Extract embedded receipt images from Excel cells

**Implementation:**
- Use Chrome DevTools to screenshot specific cells
- Save receipts to `excel_receipts/` folder
- Generate receipt manifest with metadata

---

### Task 2: n8n Webhook Caller ⚠️ TODO
**File:** `tasks/n8n-webhook-caller.xml`
**Purpose:** Trigger n8n workflows for notifications and reporting

**Use Cases:**
- Send email notifications on completion
- Post to Slack/Teams channels
- Trigger downstream automation

---

### Task 3: Chrome Screenshot ⚠️ TODO
**File:** `tasks/chrome-screenshot.xml`
**Purpose:** Capture Excel sheet screenshots for vision analysis

**Implementation:**
- Open Excel file in Chrome/web viewer
- Capture full-page screenshot
- Save to `excel_screenshots/` folder

---

### Python Scripts

#### Script 1: `gemini_vision.py` ⚠️ TODO
**Purpose:** Gemini API wrapper for vision analysis

**Functions:**
- `analyze_excel_screenshot(image_path, prompt)`
- `parse_gemini_response(response)`
- `handle_rate_limits()`

---

#### Script 2: `excel_processor.py` ⚠️ TODO
**Purpose:** Excel file operations and mastersheet generation

**Functions:**
- `discover_excel_files(folder)`
- `consolidate_data(json_files)`
- `generate_mastersheet(data, output_path)`
- `export_csv(data, output_path)`

---

#### Script 3: `supabase_importer.py` ⚠️ TODO
**Purpose:** Database import operations

**Functions:**
- `dry_run_import(data, table)`
- `batch_import(data, table, batch_size)`
- `detect_conflicts(data, table)`
- `rollback_import(record_ids)`

---

## Phase 5: Testing & Refinement (Priority: MEDIUM)

### Test Cases ⚠️ TODO

1. **Simple Excel** (5 rows, no complications)
   - Expected: 100% extraction accuracy
   - Test all validation rules

2. **Complex Excel** (merged cells, continuation rows)
   - Expected: 95%+ accuracy with flagged rows
   - Test 4-phase correction

3. **Multi-File** (3+ Excel files, 30+ sheets)
   - Expected: Successful consolidation
   - Test duplicate detection across files

4. **Edge Cases**
   - Empty cells
   - Invalid formats
   - Calculation errors
   - Duplicate ICs

### Performance Benchmarks ⚠️ TODO

- **Vision Analysis:** < 30 seconds per sheet
- **Validation:** < 5 seconds per 100 rows
- **Import:** < 60 seconds per 250 rows
- **Full Extraction:** < 15 minutes for typical project (10 sheets, 250 rows)

---

## Dependencies & Prerequisites

### Environment Variables
```bash
GEMINI_API_KEY=your_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
N8N_WEBHOOK_URL=https://your-n8n-instance/webhook/excel-extraction
```

### Python Libraries
```bash
pip install openpyxl requests Pillow
```

### MCP Tools
- Chrome DevTools MCP (required)
- n8n MCP (optional)
- Supabase MCP (optional, helpful for schema inspection)

---

## Success Criteria

**Module Complete When:**
- [x] All 4 agents fully implemented and tested
- [x] All 5 workflows functional
- [x] All 3 tasks working
- [x] Python scripts operational
- [x] Test cases passing
- [x] Documentation complete
- [x] Real-world validation (process actual Baito Excel files)

**Acceptance Test:**
Process `baito_2025_full_year_master.xlsx` (all 12 months) with:
- 95%+ extraction accuracy
- Successful validation
- Clean Supabase import
- Complete audit trail

---

## Next Session Priorities

**Immediate Focus (Phase 2):**
1. ✅ Complete Data Extraction Orchestrator agent
2. ⚠️ Build Vision Analyzer agent (Gemini integration) ← **START HERE**
3. Build Validation Specialist agent
4. Build Supabase Import Manager agent

**Then (Phase 3):**
5. Implement Full Extraction workflow
6. Test end-to-end with sample Excel file

---

## Notes & Decisions

### Design Decisions Made:
- Using Gemini 2.0 Flash Exp for cost-effectiveness
- 15-second rate limit to stay within API quotas
- Dry-run first approach for safety
- Confidence scoring for human review prioritization
- Mastersheet consolidation before import (audit trail)

### Open Questions:
- Should we support Google Sheets as input? (Future enhancement)
- Receipt OCR - use Gemini or separate OCR service?
- Real-time vs batch processing for large files?

---

**Last Updated:** 2025-10-08 22:00
**Next Review:** After Phase 2 completion
