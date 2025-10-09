# Excel Vision Extractor - Quick Reference

**Version:** 1.0.0 | **Status:** 🚧 In Development (30%)

## 60-Second Overview

AI-powered Excel data extraction system using Gemini Vision API. Handles complex layouts, validates data, generates mastersheet, imports to Supabase.

**Input:** Complex Excel files with irregular layouts
**Output:** Validated, standardized data in Supabase

## Quick Commands

```bash
# Full extraction pipeline
"Extract data from Excel files in excel_imports/ folder"

# Vision analysis only
"Analyze Excel structure using Gemini Vision"

# Generate mastersheet
"Consolidate all validated data into mastersheet"

# Import to database
"Import mastersheet to Supabase with dry-run first"
```

## Module Components

### Agents (4)
1. **Data Extraction Orchestrator** (Director) - Pipeline coordination
2. **Vision Analyzer** (Expert) - Gemini API integration, 4-phase analysis
3. **Validation Specialist** (Expert) - Data quality assurance
4. **Supabase Import Manager** (Expert) - Database operations

### Workflows (5)
1. **Full Extraction** - Complete end-to-end process
2. **Vision Analysis** - AI-powered structure analysis
3. **Data Verification** - Standalone validation
4. **Mastersheet Generator** - Data consolidation
5. **Supabase Import** - Database import with safety checks

### Tasks (3)
1. **Receipt Extractor** - Extract embedded images
2. **n8n Webhook Caller** - Trigger automation workflows
3. **Chrome Screenshot** - Capture sheet screenshots

## Key Features

### 4-Phase AI Analysis
1. **Structure** - Detect headers, merged cells, patterns
2. **Extract** - Pull candidate records with context
3. **Verify** - Self-check extraction accuracy
4. **Correct** - Fix identified issues

### Validation Engine
- ✅ Calculation verification (wages + ot + claims = total)
- ✅ Duplicate IC detection
- ✅ Format validation (IC, bank numbers)
- ✅ Cross-sheet consistency

### Safety Features
- 🛡️ Dry-run mode (always test first)
- 🛡️ Confidence scoring (flag uncertain extractions)
- 🛡️ Rollback support
- 🛡️ Comprehensive audit trail

## Data Flow

```
Excel Files
    ↓
Screenshot (Chrome MCP)
    ↓
Vision Analysis (Gemini 4-phase)
    ↓
Validation (calculations, duplicates, formats)
    ↓
Mastersheet (consolidated, standardized)
    ↓
Supabase Import (dry-run → confirm → execute)
```

## Configuration Highlights

```yaml
# API Settings
gemini_model: "gemini-2.0-flash-exp"
rate_limit_delay: 15  # seconds between API calls

# Validation
calculation_check: true
duplicate_check: true
ic_format_validation: true

# Import Safety
batch_size: 50
dry_run_default: true  # Always start safe!
```

## Output Structure

```
excel_extraction_results/
└── 20251008_140530/
    ├── mastersheet_20251008_140530.xlsx  # Main output
    ├── validation_report.md              # Quality assurance
    ├── extraction_log.txt                # Detailed log
    └── failed_rows.csv                   # Rows needing review

excel_screenshots/
└── baito_2025_master_Sheet1.png          # Vision input

excel_receipts/
└── extracted/
    └── receipt_001.png                   # Extracted images
```

## Prerequisites

### Environment Variables (.env)
```bash
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
N8N_WEBHOOK_URL=your_n8n_webhook_url  # Optional
```

### Python Dependencies
```bash
pip install openpyxl requests Pillow
```

### MCP Tools
- Chrome DevTools MCP (required)
- n8n MCP (optional)
- Supabase MCP (optional)

## Typical Usage Pattern

### Scenario: Process monthly payroll Excel files

```bash
# 1. Place Excel files in folder
excel_imports/
├── baito_january_2025.xlsx
├── baito_february_2025.xlsx
└── baito_march_2025.xlsx

# 2. Run full extraction
"Extract and validate data from excel_imports folder"

# 3. Review validation report
# Check: excel_extraction_results/[timestamp]/validation_report.md

# 4. Correct flagged rows (if any)
"Re-analyze rows flagged in validation report"

# 5. Import to Supabase
"Import mastersheet to Supabase with dry-run first"

# 6. Review dry-run results
# Check conflicts, duplicates, new records

# 7. Confirm import
"Proceed with actual import"

# Done! ✅
```

## Performance Expectations

- **Vision Analysis:** ~30 seconds per sheet
- **Validation:** ~5 seconds per 100 rows
- **Import:** ~60 seconds per 250 rows
- **Full Pipeline:** ~15 minutes for typical project (10 sheets, 250 rows)

## Success Indicators

**Extraction Quality:**
- ✅ 95%+ accuracy on structured data
- ✅ 90%+ accuracy on irregular layouts (with flagging)
- ✅ 100% calculation validation
- ✅ Complete duplicate detection

**Safety Metrics:**
- ✅ Zero accidental imports (dry-run first)
- ✅ Full rollback capability
- ✅ Complete audit trail
- ✅ No data loss

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Rate limit errors | Increase `rate_limit_delay` in config |
| Low confidence scores | Review flagged rows manually |
| Calculation mismatches | Check source Excel formulas |
| Duplicate IC numbers | Review validation report, resolve conflicts |
| Import conflicts | Choose resolution strategy (skip/update/replace) |

## Integration Points

### With n8n (Optional)
- Email notifications on completion
- Slack/Teams alerts for validation errors
- Automated stakeholder reports

### With Chrome DevTools MCP
- Excel sheet screenshot capture
- Visual debugging
- Receipt extraction

### With Supabase MCP
- Schema inspection
- Query validation
- Direct data import

## Documentation Map

- **README.md** - Comprehensive user guide
- **ROADMAP.md** - Implementation plan and progress
- **MODULE_SUMMARY.md** - This quick reference
- **config.yaml** - Module configuration
- **agents/*.md** - Agent definitions
- **workflows/*/instructions.md** - Workflow steps

## Development Status

### ✅ Complete (30%)
- Module structure
- Configuration
- Documentation foundation

### ⚠️ In Progress (0%)
- Core agents (4)
- Workflows (5)
- Tasks (3)
- Python scripts (3)

### 📋 Planned (70%)
- Testing & refinement
- Real-world validation
- Performance optimization

## Support

**For Implementation Questions:**
See ROADMAP.md for detailed specs

**For Usage Questions:**
See README.md for comprehensive guide

**For Quick Tasks:**
See workflow instructions.md files

---

**Last Updated:** 2025-10-08
**Next Milestone:** Complete Vision Analyzer agent (Phase 2)
