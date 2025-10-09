# Full Extraction Workflow - Completion Checklist

**Workflow:** Full Extraction
**Version:** 1.0.0

## Pre-Execution Checklist

### Environment Setup
- [ ] `GEMINI_API_KEY` environment variable is set
- [ ] `SUPABASE_URL` environment variable is set
- [ ] `SUPABASE_ANON_KEY` environment variable is set
- [ ] `N8N_WEBHOOK_URL` environment variable set (if using n8n)

### File Preparation
- [ ] Excel files (.xlsx) are placed in `excel_imports/` folder
- [ ] Excel files are not corrupted or password-protected
- [ ] Excel files contain expected data structure
- [ ] No temporary Excel files (~$*.xlsx) in input folder

### Tool Availability
- [ ] Chrome DevTools MCP is accessible
- [ ] Python is installed with required libraries (openpyxl, requests, Pillow)
- [ ] Sufficient disk space available (100MB per 1000 rows estimated)

### Configuration Review
- [ ] `config.yaml` exists and is properly formatted
- [ ] `extraction.rate_limit_delay` is set (15s recommended)
- [ ] `extraction.gemini_model` is specified (gemini-2.0-flash-exp)
- [ ] `supabase.batch_size` is set (50 recommended)
- [ ] `supabase.dry_run_default` is true (safety first)

---

## Phase 1: Discovery & Preparation

### File Discovery
- [ ] Excel files successfully discovered in input folder
- [ ] Sheet count per file is accurate
- [ ] Total sheets count is confirmed
- [ ] No duplicate filenames detected

### Workspace Creation
- [ ] Timestamped output folder created: `excel_extraction_results/[timestamp]/`
- [ ] `intermediate/` subfolder created
- [ ] `excel_screenshots/` folder exists or created
- [ ] Extraction log initialized

### Prerequisites Validation
- [ ] API keys validated (test calls successful)
- [ ] Folder permissions verified (read/write access)
- [ ] Chrome MCP connection confirmed
- [ ] Estimated duration calculated and displayed to user

---

## Phase 2: Vision Analysis

### Per-Sheet Processing
For each Excel sheet:

- [ ] Screenshot captured successfully
- [ ] Screenshot saved to `excel_screenshots/` with correct naming
- [ ] Vision Analyzer agent invoked
- [ ] 4-phase analysis completed (structure, extract, verify, correct)
- [ ] Structured JSON data returned
- [ ] Confidence scores calculated
- [ ] Intermediate JSON saved to `intermediate/` folder
- [ ] Progress update displayed to user

### Rate Limiting
- [ ] 15-second delay enforced between Gemini API calls
- [ ] Rate limit errors caught and handled with backoff
- [ ] API quota not exceeded

### Progress Tracking
- [ ] Progress percentage calculated and displayed after each sheet
- [ ] ETA calculated based on average sheet processing time
- [ ] Checkpoint saved after each sheet
- [ ] Error sheets logged if any fail

### Error Handling
- [ ] Failed sheets logged with error details
- [ ] Failed sheets flagged for manual review
- [ ] Workflow continues despite sheet failures
- [ ] Summary includes failed sheet count

---

## Phase 3: Validation & Quality Assurance

### Data Consolidation
- [ ] All intermediate JSON files loaded
- [ ] Records merged into single dataset
- [ ] Source metadata preserved (file, sheet, row)
- [ ] Total record count matches expected

### Validation Execution
- [ ] Validation Specialist agent invoked
- [ ] All validation rules applied:
  - [ ] Calculation verification (wages + ot + claims = total)
  - [ ] Duplicate IC detection
  - [ ] IC format validation
  - [ ] Bank number format validation
  - [ ] Required fields completeness check
  - [ ] Date format validation
  - [ ] Currency amount validation
- [ ] Cross-sheet consistency checks performed
- [ ] Supabase duplicate check executed (if enabled)

### Validation Reporting
- [ ] Validation report generated (`validation_report.md`)
- [ ] Passed records exported (`passed_records.xlsx`)
- [ ] Flagged records exported (`flagged_records.xlsx`)
- [ ] Summary statistics calculated:
  - [ ] Total records count
  - [ ] Passed records count and percentage
  - [ ] Flagged records count and percentage
  - [ ] Issues grouped by severity (HIGH, MEDIUM, LOW)
  - [ ] Issues grouped by type
- [ ] Validation report presented to user

---

## Phase 4: Review & Correction

### Flagged Rows Review
- [ ] Flagged rows presented to user with evidence
- [ ] High severity issues highlighted
- [ ] User options provided (re-analyze, manual correct, proceed)

### Re-analysis (if requested)
- [ ] Flagged rows identified and source sheets located
- [ ] Screenshots re-captured (if needed)
- [ ] Vision Analyzer re-invoked for flagged rows
- [ ] Corrections applied to dataset
- [ ] Re-validation executed
- [ ] Updated validation report generated

### Dataset Finalization
- [ ] Manual corrections applied (if provided by user)
- [ ] Re-analyzed data merged into dataset
- [ ] Passed records updated
- [ ] Flagged records updated
- [ ] Final validation report generated
- [ ] User confirmation received to proceed

---

## Phase 5: Mastersheet Generation

### Column Mapping
- [ ] Standard column names applied per config
- [ ] All required columns present in output
- [ ] Optional columns included if available

### Metadata Addition
- [ ] `source_file` populated for all records
- [ ] `source_sheet` populated for all records
- [ ] `source_row` populated for all records
- [ ] `extraction_date` added
- [ ] `confidence` scores included
- [ ] `verification_status` set (passed/flagged/corrected)
- [ ] `notes` field populated with relevant flags/corrections

### Export
- [ ] Mastersheet Excel file generated
- [ ] Mastersheet CSV file generated
- [ ] Files saved to output folder with timestamp
- [ ] File paths confirmed and displayed to user
- [ ] File sizes reasonable and validated
- [ ] Record count in mastersheet matches expected

---

## Phase 6: Supabase Import

### Dry-Run Execution
- [ ] Supabase Import Manager agent invoked with `dry_run` mode
- [ ] Mastersheet successfully loaded
- [ ] Schema validation completed:
  - [ ] All source fields compatible with target table
  - [ ] Field types match
  - [ ] Required fields present
- [ ] Conflict detection executed:
  - [ ] Existing records queried by IC + project_name
  - [ ] New records identified
  - [ ] Updates identified
  - [ ] Conflicts identified
- [ ] Dry-run report generated (`import_dry_run.md`)
- [ ] Import plan statistics calculated:
  - [ ] New inserts count
  - [ ] Updates count
  - [ ] Conflicts count
  - [ ] Skips count
- [ ] Estimated duration calculated
- [ ] Dry-run report presented to user

### User Confirmation
- [ ] User reviews dry-run report
- [ ] Conflicts explained clearly
- [ ] Before/after comparisons shown for updates
- [ ] Conflict resolution strategy confirmed (skip/update/replace)
- [ ] User explicitly approves execution
- [ ] Or user requests strategy adjustment
- [ ] Or user cancels import

### Import Execution (if confirmed)
- [ ] Import Manager invoked with `execute` mode
- [ ] Records processed in batches
- [ ] Progress displayed after each batch:
  - [ ] Batch X/Y completed
  - [ ] Records processed count
  - [ ] Success/failure rates
- [ ] Conflicts resolved per strategy:
  - [ ] Skips logged
  - [ ] Updates executed
  - [ ] Replaces executed
- [ ] Errors caught and logged
- [ ] Failed records saved to separate file
- [ ] Import log created with all record IDs
- [ ] Rollback information saved

### Import Reporting
- [ ] Import report generated (`import_report.md`)
- [ ] Import summary statistics calculated:
  - [ ] Total records processed
  - [ ] Inserted count
  - [ ] Updated count
  - [ ] Skipped count
  - [ ] Error count
  - [ ] Duration
- [ ] Import log saved (`import_log_[timestamp].json`)
- [ ] Imported record IDs saved
- [ ] Rollback command provided
- [ ] Report presented to user

---

## Final Report & Cleanup

### Final Report Generation
- [ ] Comprehensive final report generated (`final_report.md`)
- [ ] Report includes all phase summaries:
  - [ ] Discovery results
  - [ ] Vision analysis statistics
  - [ ] Validation results
  - [ ] Mastersheet details
  - [ ] Import summary
- [ ] Performance metrics calculated:
  - [ ] Total duration
  - [ ] Average time per sheet
  - [ ] API calls made
  - [ ] Success rates
- [ ] Recommendations provided for next steps
- [ ] Report saved to output folder

### File Organization
- [ ] All outputs organized in timestamped folder
- [ ] Intermediate files preserved for debugging
- [ ] Logs complete and readable
- [ ] File paths all valid and accessible

### User Communication
- [ ] Success message displayed
- [ ] Key metrics highlighted
- [ ] Output folder path provided
- [ ] Next steps clearly stated
- [ ] User knows how to access results

---

## Post-Execution Verification

### Data Integrity
- [ ] Record counts match across all outputs:
  - [ ] Extraction JSON total = Mastersheet total
  - [ ] Mastersheet total = Passed + Flagged
  - [ ] Import report total matches import plan
- [ ] No data loss during processing
- [ ] Metadata preserved for all records

### Supabase Verification
- [ ] Imported data visible in Supabase dashboard
- [ ] Record counts match import report
- [ ] Sample records reviewed for accuracy
- [ ] No duplicate records created (unless intended)
- [ ] Referential integrity maintained

### Output Quality
- [ ] Mastersheet opens without errors
- [ ] CSV format is valid and parseable
- [ ] Validation report is readable and complete
- [ ] Import report is accurate
- [ ] Logs are detailed and useful

### Audit Trail
- [ ] Complete operation timeline in logs
- [ ] All API calls logged
- [ ] All conflicts logged with resolutions
- [ ] All errors logged with context
- [ ] Rollback information complete and accessible

---

## Error Recovery Checklist

### If Workflow Failed Mid-Execution

- [ ] Identify failure point from logs
- [ ] Check if checkpoint file exists
- [ ] Verify partial outputs saved correctly
- [ ] Determine if resumable or needs restart
- [ ] If resumable:
  - [ ] Load checkpoint
  - [ ] Resume from last completed sheet
  - [ ] Merge with previous results
- [ ] If restart needed:
  - [ ] Archive partial results
  - [ ] Clear intermediate files
  - [ ] Re-run from beginning

### If Import Failed

- [ ] Check import error log
- [ ] Identify failed batch
- [ ] Determine error cause (network, schema, constraint)
- [ ] If partial import occurred:
  - [ ] Check rollback availability
  - [ ] Decide: rollback or complete remaining
- [ ] If rollback needed:
  - [ ] Execute rollback command
  - [ ] Verify records removed
  - [ ] Fix error cause
  - [ ] Re-run import

---

## Success Criteria

### Minimum Success Threshold
- [ ] ≥95% of sheets successfully analyzed
- [ ] ≥90% of records passed validation
- [ ] Mastersheet generated without errors
- [ ] Import dry-run completed successfully
- [ ] User approved and import executed (or user chose to skip)

### Optimal Success
- [ ] 100% of sheets successfully analyzed
- [ ] ≥95% of records passed validation
- [ ] <5% records flagged with low confidence
- [ ] No import errors
- [ ] Complete audit trail
- [ ] User satisfied with results

---

## Sign-Off

### Workflow Completed By:
- Date: _______________
- Time: _______________
- User/Session: _______________

### Final Statistics:
- Files processed: _______________
- Sheets analyzed: _______________
- Records extracted: _______________
- Records imported: _______________
- Total duration: _______________
- Success rate: _______________

### Notes:
_________________________________
_________________________________
_________________________________

---

**Checklist Complete**
**Workflow Status:** ✅ Completed / ⚠️ Completed with Issues / ❌ Failed

**Next Steps:** [Document any follow-up actions needed]
