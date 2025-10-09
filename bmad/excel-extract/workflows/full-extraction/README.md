# Full Extraction Workflow

**Workflow Name:** Full Extraction
**Module:** Excel Vision Extractor
**Version:** 1.0.0
**Type:** End-to-End Pipeline

## Overview

The Full Extraction workflow is the complete end-to-end pipeline for extracting candidate and project data from Excel files, validating the data, generating a consolidated mastersheet, and importing to Supabase. This is the primary workflow for processing Excel files.

## Use Cases

- **Monthly Payroll Processing:** Extract data from monthly Excel payroll files
- **Historical Data Migration:** Process multiple years of Excel records
- **Regular Data Imports:** Scheduled processing of new Excel files
- **Data Consolidation:** Merge data from multiple Excel files into single database

## Workflow Phases

### Phase 1: Discovery & Preparation
- Scan input folder for Excel files
- Create timestamped output workspace
- Validate prerequisites (API keys, folder permissions)
- Generate processing plan

### Phase 2: Vision Analysis (Per Sheet)
- Capture sheet screenshots (Chrome MCP)
- Execute 4-phase Gemini Vision analysis
- Extract structured data with confidence scores
- Save intermediate JSON results

### Phase 3: Validation & Quality Assurance
- Apply validation rules to extracted data
- Check calculations, formats, duplicates
- Query Supabase for existing records
- Generate validation report

### Phase 4: Review & Correction
- Present flagged rows to user
- Re-analyze low confidence extractions
- Apply manual corrections if needed
- Update validated dataset

### Phase 5: Mastersheet Generation
- Consolidate data from all sheets
- Apply standard column mapping
- Add metadata (source, confidence, etc.)
- Export to Excel + CSV formats

### Phase 6: Supabase Import
- Execute dry-run simulation
- Present import preview to user
- Await confirmation
- Execute actual import with progress tracking
- Generate completion report

## Entry Points

### Command Syntax
```
Extract data from Excel files in [folder_path]
```

### Examples
```
Extract data from Excel files in excel_imports/
Process baito_2025_master.xlsx with full extraction pipeline
Run full extraction on all files in current folder
```

## Prerequisites

### Required Environment Variables
```bash
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
```

### Required Folders
```
excel_imports/              # Input Excel files here
excel_extraction_results/   # Output folder (auto-created)
excel_screenshots/          # Screenshots (auto-created)
```

### Required MCP Tools
- Chrome DevTools MCP (for screenshots)
- Supabase MCP (optional, for schema inspection)

## Workflow Steps

See [instructions.md](./instructions.md) for detailed step-by-step execution instructions.

## Expected Outputs

```
excel_extraction_results/20251008_144530/
├── mastersheet_20251008_144530.xlsx    # Consolidated data
├── mastersheet_20251008_144530.csv     # CSV format
├── validation_report.md                # Quality assurance
├── extraction_log.txt                  # Detailed operation log
├── import_report.md                    # Supabase import summary
├── passed_records.xlsx                 # Clean records
├── flagged_records.xlsx                # Records needing review
└── intermediate/                       # JSON extractions per sheet
    ├── baito_january_Sheet1.json
    ├── baito_january_Sheet2.json
    └── ...

excel_screenshots/
├── baito_january_Sheet1.png
├── baito_january_Sheet2.png
└── ...
```

## Performance Expectations

### Typical Project (10 sheets, 250 rows):
- **Discovery:** 5 seconds
- **Vision Analysis:** 5-7 minutes (30-45s per sheet)
- **Validation:** 10 seconds
- **Mastersheet Generation:** 5 seconds
- **Import (dry-run + execution):** 2 minutes
- **Total:** 12-15 minutes

### Large Project (50 sheets, 1000 rows):
- **Total:** 45-60 minutes

## Error Recovery

The workflow includes comprehensive error handling:

- **API Failures:** Automatic retry with exponential backoff
- **Vision Errors:** Skip sheet, flag for manual review, continue
- **Validation Failures:** Flag rows, continue to mastersheet
- **Import Errors:** Rollback capability, detailed error logs

**Checkpoints:** Saved after each sheet analysis and after validation. Can resume from any checkpoint.

## Quality Metrics

### Success Criteria:
- ✅ 95%+ extraction accuracy on structured data
- ✅ 90%+ on irregular layouts (with flagging)
- ✅ 100% calculation validation
- ✅ Complete duplicate detection
- ✅ Safe import with dry-run preview

### Output Quality:
- High confidence records: 90%+ typical
- Medium confidence: 5-8%
- Low confidence: <5% (manual review)

## Workflow Checklist

See [checklist.md](./checklist.md) for completion criteria.

## Integration

### With Other Workflows:
- **Vision Analysis Workflow:** Used for each sheet
- **Data Verification Workflow:** Used after extraction
- **Mastersheet Generator Workflow:** Used for consolidation
- **Supabase Import Workflow:** Used for final import

### With Agents:
- **Data Extraction Orchestrator:** Coordinates entire workflow
- **Vision Analyzer:** Processes each sheet
- **Validation Specialist:** Validates extracted data
- **Supabase Import Manager:** Handles database import

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No Excel files found | Check folder path, ensure .xlsx files present |
| Rate limit errors | Increase `rate_limit_delay` in config.yaml |
| Low confidence scores | Review validation report, re-analyze flagged sheets |
| Import conflicts | Review dry-run report, adjust conflict strategy |
| Vision API errors | Check GEMINI_API_KEY, verify API quota |

## Next Steps After Completion

1. ✅ Review validation report for flagged rows
2. ✅ Check import report for conflicts
3. ✅ Verify data in Supabase dashboard
4. ✅ Keep logs for audit trail
5. ✅ Archive source Excel files

---

**Workflow Status:** ✅ Fully Defined
**Last Updated:** 2025-10-08
