# Full Extraction Workflow - Detailed Instructions

**Workflow:** Full Extraction
**Agent:** Data Extraction Orchestrator (Director)
**Duration:** 12-60 minutes (depending on data volume)

## Overview

Execute complete Excel data extraction pipeline from file discovery through Supabase import.

## Prerequisites Check

Before starting, verify:

```yaml
required_files:
  - Excel files in excel_imports/ folder
  - config.yaml properly configured

required_environment:
  - GEMINI_API_KEY set
  - SUPABASE_URL set
  - SUPABASE_ANON_KEY set

required_tools:
  - Chrome DevTools MCP available
  - Python with openpyxl, requests, Pillow

required_permissions:
  - Read access to excel_imports/
  - Write access to excel_extraction_results/
  - Write access to excel_screenshots/
```

## Workflow Execution

### PHASE 1: Discovery & Preparation (30-60 seconds)

**Objective:** Identify files and prepare workspace

#### Step 1.1: Discover Excel Files

```yaml
action: Scan input folder

implementation:
  - Navigate to excel_imports/ folder
  - Find all .xlsx files
  - Exclude temporary files (~$*.xlsx)
  - Count total sheets across all files

code_reference:
  ```python
  import os
  import openpyxl

  def discover_excel_files(folder_path):
      excel_files = []
      for file in os.listdir(folder_path):
          if file.endswith('.xlsx') and not file.startswith('~$'):
              file_path = os.path.join(folder_path, file)
              wb = openpyxl.load_workbook(file_path, read_only=True)
              sheets = wb.sheetnames
              excel_files.append({
                  'file': file,
                  'path': file_path,
                  'sheets': sheets,
                  'sheet_count': len(sheets)
              })
              wb.close()
      return excel_files
  ```

output:
  message: |
    🎯 Starting Full Extraction Pipeline

    📋 Discovery Results:
    - Found 3 Excel files
      1. baito_january_2025.xlsx (8 sheets)
      2. baito_february_2025.xlsx (7 sheets)
      3. baito_march_2025.xlsx (9 sheets)
    - Total: 24 sheets to process

    ⏳ Estimated time: 15-20 minutes
```

#### Step 1.2: Create Workspace

```yaml
action: Create timestamped output folders

implementation:
  - Generate timestamp: YYYYMMDD_HHMMSS
  - Create folders:
      - excel_extraction_results/[timestamp]/
      - excel_extraction_results/[timestamp]/intermediate/
      - excel_screenshots/ (if not exists)
  - Initialize extraction log

code_reference:
  ```python
  from datetime import datetime
  import os

  def create_workspace():
      timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
      base_folder = f'excel_extraction_results/{timestamp}'

      os.makedirs(f'{base_folder}/intermediate', exist_ok=True)
      os.makedirs('excel_screenshots', exist_ok=True)

      # Initialize log
      log_path = f'{base_folder}/extraction_log.txt'
      with open(log_path, 'w') as f:
          f.write(f'Extraction started: {timestamp}\\n')

      return {
          'base_folder': base_folder,
          'timestamp': timestamp,
          'log_path': log_path
      }
  ```

output:
  message: |
    📁 Workspace created:
    - Output: excel_extraction_results/20251008_144530/
    - Logs: excel_extraction_results/20251008_144530/extraction_log.txt
```

#### Step 1.3: Validate Prerequisites

```yaml
action: Check environment and dependencies

checks:
  - GEMINI_API_KEY environment variable set
  - SUPABASE credentials available
  - Chrome MCP accessible
  - Sufficient disk space (estimate: 100MB per 1000 rows)

on_failure:
  - Report missing dependencies
  - Block execution
  - Provide setup instructions
```

---

### PHASE 2: Vision Analysis (5-30 minutes)

**Objective:** Extract data from each Excel sheet using Gemini Vision

#### Step 2.1: Process Each File and Sheet

```yaml
action: Loop through files and sheets

for_each_file:
  for_each_sheet:
    - Capture screenshot
    - Analyze with Vision Analyzer agent
    - Save intermediate results
    - Respect rate limits
    - Track progress
```

#### Step 2.2: Capture Sheet Screenshot

**For each sheet:**

```yaml
action: Screenshot Excel sheet

implementation:
  method_1_chrome_mcp:
    - Open Excel file in web-based viewer or Google Sheets
    - Navigate to specific sheet
    - Use Chrome MCP to capture full-page screenshot
    - Save as: excel_screenshots/{filename}_{sheetname}.png

  method_2_python_openpyxl:
    # If Chrome MCP unavailable, use Python screenshot
    - Load workbook with openpyxl
    - Export sheet as image
    - Save to excel_screenshots/

code_reference:
  ```python
  # Using Chrome MCP (preferred)
  async def capture_sheet_screenshot(file_path, sheet_name, output_path):
      # Open file in Chrome/web viewer
      # Use mcp__chrome-devtools__take_screenshot tool
      # Save to output_path
      pass
  ```

output:
  message: |
    📸 Screenshot captured: excel_screenshots/baito_january_Sheet1.png
```

#### Step 2.3: Invoke Vision Analyzer Agent

**For each sheet screenshot:**

```yaml
agent: Vision Analyzer (Expert)

task: "Analyze Excel sheet using 4-phase Gemini Vision"

input:
  - screenshot_path: "excel_screenshots/baito_january_Sheet1.png"
  - sheet_info:
      file: "baito_january_2025.xlsx"
      sheet: "Sheet1"
      expected_columns: [from config.yaml]

execution:
  - Vision Analyzer executes 4-phase analysis:
      1. Structure Analysis
      2. Data Extraction
      3. Self-Verification
      4. Self-Correction
  - Returns structured JSON with records and confidence scores

output_handling:
  - Save to: intermediate/baito_january_Sheet1.json
  - Log extraction summary
  - Track confidence distribution

progress_update:
  message: |
    ✅ Sheet 1/24 complete: baito_january_Sheet1
    - Records extracted: 25
    - Average confidence: 0.93
    - Flagged rows: 2

    📊 Progress: 4% complete (1/24 sheets)
    ⏱️ Elapsed: 45 seconds | Remaining: ~17 minutes
```

#### Step 2.4: Rate Limiting & Progress Tracking

```yaml
rate_limiting:
  - Wait 15 seconds between Gemini API calls
  - Log wait times
  - Display countdown to user

progress_tracking:
  - Update after each sheet
  - Show: current file/sheet, X/Y complete, % done
  - Calculate ETA based on average sheet time

checkpointing:
  - Save progress after each sheet
  - Enable resume from last checkpoint if interrupted
  - Store: checkpoint_20251008_144530.json
```

---

### PHASE 3: Validation & Quality Assurance (10-30 seconds)

**Objective:** Verify data quality and flag issues

#### Step 3.1: Consolidate Extracted Data

```yaml
action: Merge all intermediate JSON files

implementation:
  - Load all JSON files from intermediate/
  - Combine records into single dataset
  - Preserve source metadata (file, sheet, row)

code_reference:
  ```python
  def consolidate_extracted_data(intermediate_folder):
      all_records = []
      for json_file in os.listdir(intermediate_folder):
          if json_file.endswith('.json'):
              with open(f'{intermediate_folder}/{json_file}') as f:
                  data = json.load(f)
                  all_records.extend(data['records'])
      return all_records
  ```
```

#### Step 3.2: Invoke Validation Specialist Agent

```yaml
agent: Validation Specialist (Expert)

task: "Validate extracted data quality"

input:
  - extracted_records: [{...}, {...}, ...] (from consolidation)
  - validation_rules: from config.yaml
  - supabase_check: true (query for existing records)

execution:
  - Apply validation rules:
      - Calculation verification
      - Duplicate detection
      - Format validation
      - Completeness checks
      - Cross-sheet consistency
  - Query Supabase for conflicts
  - Generate validation report

output:
  - validation_report: {...}
  - passed_records: [{...}] (clean data)
  - flagged_records: [{...}] (needs review)
  - recommendations: [...]

output_handling:
  - Save validation_report.md
  - Save passed_records.xlsx
  - Save flagged_records.xlsx
  - Present summary to user

user_message:
  |
    ✅ Validation Complete!

    📊 Summary:
    - Total records: 250
    - Passed: 235 (94%)
    - Flagged: 15 (6%)

    ⚠️ Issues Found:
    - Calculation errors: 5 rows
    - Duplicate ICs: 3 rows
    - Format issues: 7 rows

    📁 Reports saved:
    - validation_report.md
    - flagged_records.xlsx

    🔍 Next: Review flagged rows before proceeding
```

---

### PHASE 4: Review & Correction (User-Driven)

**Objective:** Address flagged rows

#### Step 4.1: Present Flagged Rows

```yaml
action: Show flagged rows to user

presentation:
  - Display validation report summary
  - Highlight high severity issues
  - Show evidence for each flag
  - Provide correction options

user_options:
  1. Review and manually correct in Excel
  2. Re-analyze specific rows with Vision Analyzer
  3. Accept flags and proceed (will be excluded from import)
  4. Adjust validation rules and re-validate
```

#### Step 4.2: Re-analyze if Requested

```yaml
if_user_requests_re_analysis:
  action: Re-run Vision Analyzer on flagged rows

  process:
    - Identify source sheets for flagged rows
    - Re-capture screenshots if needed
    - Re-run 4-phase analysis with focus on flagged rows
    - Update dataset with corrections
    - Re-validate

  output:
    message: |
      🔄 Re-analysis complete
      - Rows re-analyzed: 5
      - Corrections applied: 4
      - Still flagged: 1
```

#### Step 4.3: Update Validated Dataset

```yaml
action: Finalize clean dataset

process:
  - Apply any manual corrections
  - Merge re-analyzed data
  - Update passed_records
  - Re-generate validation report

output:
  message: |
    ✅ Dataset finalized
    - Final passed records: 239 (95.6%)
    - Final flagged records: 11 (4.4%)

    Ready to generate mastersheet.
```

---

### PHASE 5: Mastersheet Generation (5-15 seconds)

**Objective:** Create consolidated, standardized output

#### Step 5.1: Apply Column Mapping

```yaml
action: Standardize column names and formats

column_mapping:
  # From config.yaml
  standard_columns:
    - fullname
    - ic
    - bank
    - bank_no
    - project_name
    - project_date
    - project_time
    - wages
    - hour_wages
    - ot
    - claims
    - allowance
    - commission
    - total_payment
    - payment_date
    - working_time
    - project_pic
    - project_venue
    - source_file
    - source_sheet
    - source_row
    - confidence
    - verification_status
    - notes
```

#### Step 5.2: Add Metadata

```yaml
action: Enrich records with metadata

metadata_added:
  - source_file: Original Excel filename
  - source_sheet: Original sheet name
  - source_row: Row number in original sheet
  - extraction_date: When extracted
  - confidence: Confidence score from Vision Analyzer
  - verification_status: passed | flagged | corrected
  - notes: Any validation flags or corrections
```

#### Step 5.3: Export Mastersheet

```yaml
action: Generate Excel and CSV outputs

implementation:
  ```python
  def generate_mastersheet(records, output_folder, timestamp):
      import pandas as pd

      # Create DataFrame
      df = pd.DataFrame(records)

      # Export Excel
      excel_path = f'{output_folder}/mastersheet_{timestamp}.xlsx'
      df.to_excel(excel_path, index=False, engine='openpyxl')

      # Export CSV
      csv_path = f'{output_folder}/mastersheet_{timestamp}.csv'
      df.to_csv(csv_path, index=False)

      return {
          'excel': excel_path,
          'csv': csv_path,
          'record_count': len(df)
      }
  ```

output:
  message: |
    📊 Mastersheet Generated

    - Excel: mastersheet_20251008_144530.xlsx
    - CSV: mastersheet_20251008_144530.csv
    - Records: 239
    - Size: 2.3 MB

    Ready for Supabase import.
```

---

### PHASE 6: Supabase Import (1-3 minutes)

**Objective:** Import validated data to database

#### Step 6.1: Execute Dry-Run

```yaml
agent: Supabase Import Manager (Expert)

task: "Import mastersheet to Supabase (dry-run)"

input:
  - mastersheet_path: "results/mastersheet_20251008_144530.xlsx"
  - import_mode: "dry_run"
  - conflict_strategy: "update" (from config)

execution:
  - Load mastersheet
  - Validate schema compatibility
  - Detect conflicts with existing Supabase records
  - Generate import preview

output:
  - dry_run_report: {...}
  - import_plan:
      new_records: 200
      updates: 35
      conflicts: 4
      skips: 0
  - estimated_duration: 60 seconds

user_presentation:
  |
    🔍 Dry-Run Import Preview

    📊 Import Plan:
    - New records: 200 (83.7%)
    - Updates: 35 (14.6%)
    - Conflicts: 4 (1.7%)

    ⚠️ Conflicts Detected:
    - 4 records already exist with different payment amounts
    - Strategy: UPDATE existing records

    ⏱️ Estimated duration: 60 seconds

    📋 Review dry-run report: import_dry_run.md

    ❓ Proceed with actual import? (yes/no/adjust)
```

#### Step 6.2: Await User Confirmation

```yaml
user_decision_point:
  options:
    yes: Proceed with import as planned
    no: Cancel import, return to review
    adjust: Change conflict strategy (skip/update/replace)

validation:
  - User must explicitly confirm
  - Cannot proceed without confirmation
  - Provide clear next steps for each option
```

#### Step 6.3: Execute Import

```yaml
if_user_confirms:
  agent: Supabase Import Manager

  task: "Execute actual import"

  input:
    - mastersheet_path: "results/mastersheet_20251008_144530.xlsx"
    - import_mode: "execute"
    - conflict_strategy: "update"

  execution:
    - Process records in batches (50 per batch)
    - Track progress
    - Handle conflicts per strategy
    - Log all operations
    - Save imported record IDs

  progress_updates:
    |
      📦 Importing to Supabase...

      Batch 1/5: 50 records processed ✅
      Batch 2/5: 50 records processed ✅
      Batch 3/5: 50 records processed ✅
      Batch 4/5: 50 records processed ✅
      Batch 5/5: 39 records processed ✅

      ✅ Import complete! (62 seconds)

  output:
    - import_report: {...}
    - imported_record_ids: [...]
    - rollback_info: {...}

  completion_message:
    |
      ✅ Supabase Import Complete!

      📊 Summary:
      - Inserted: 200 records
      - Updated: 35 records
      - Errors: 0
      - Duration: 62 seconds

      📁 Reports:
      - import_report.md
      - import_log_20251008_144530.json

      🔄 Rollback available: Yes
      - Use: "Rollback import from 2025-10-08 14:45:30"

      ✅ All done! Data successfully imported to Supabase.
```

---

## Final Report Generation

```yaml
action: Generate comprehensive final report

report_includes:
  - Extraction summary (files, sheets, records)
  - Vision analysis statistics
  - Validation results
  - Mastersheet details
  - Import summary
  - Performance metrics
  - Next steps and recommendations

output_file: final_report.md

user_message:
  |
    ✅ Full Extraction Workflow Complete!

    📊 Summary:
    - Files processed: 3
    - Sheets analyzed: 24
    - Records extracted: 250
    - Records validated: 239 (95.6%)
    - Records imported: 239
    - Duration: 18 minutes 42 seconds

    📁 All outputs saved to:
    excel_extraction_results/20251008_144530/

    📋 Key Files:
    - mastersheet_20251008_144530.xlsx
    - validation_report.md
    - import_report.md
    - final_report.md

    🎉 Success! Your Excel data is now in Supabase.

    📝 Recommended Next Steps:
    1. Review flagged records (11 rows)
    2. Verify imported data in Supabase dashboard
    3. Keep logs for audit trail
    4. Archive source Excel files
```

---

## Error Handling

### During Any Phase:

```yaml
error_handling:
  api_failures:
    - Log error details
    - Retry with exponential backoff (max 3x)
    - If all retries fail: skip item, flag, continue
    - Report in final summary

  validation_failures:
    - Flag rows but don't block pipeline
    - Continue to mastersheet generation
    - Present flags to user

  import_failures:
    - Rollback batch if needed
    - Log failed records
    - Generate error report
    - Provide resolution strategies

  critical_failures:
    - Save checkpoint
    - Generate error report
    - Provide recovery instructions
    - Enable resume from checkpoint
```

---

## Performance Optimization

```yaml
optimization_tips:
  parallel_processing:
    # Not currently supported, but future enhancement
    - Process multiple sheets in parallel
    - Requires managing API rate limits across threads

  rate_limit_tuning:
    - Adjust rate_limit_delay in config.yaml
    - Balance: speed vs API quota

  batch_size_tuning:
    - Adjust Supabase batch_size in config.yaml
    - Larger batches: faster but higher error risk
    - Smaller batches: slower but more resilient

  checkpoint_frequency:
    - Current: after each sheet
    - Can adjust for faster processing with less checkpointing
```

---

## Resuming from Checkpoint

```yaml
if_workflow_interrupted:
  action: Resume from last checkpoint

  user_command: "Resume extraction from checkpoint"

  implementation:
    - Load checkpoint file
    - Identify last completed sheet
    - Resume from next sheet
    - Merge with previous results
    - Continue workflow

  output:
    message: |
      🔄 Resuming from checkpoint...

      Last completed: Sheet 15/24
      Resuming from: Sheet 16/24

      Continuing extraction...
```

---

**Workflow Instructions Complete**
**Execution Time:** 12-60 minutes (data volume dependent)
**Success Rate:** 95%+ typical
