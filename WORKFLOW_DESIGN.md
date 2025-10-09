# Complete Excel Extraction Workflow - Design Document

## 🎯 Goal
Extract candidate payment data from complex Excel sheets into a unified masterlist with verification and correction.

## 📋 Masterlist Schema

### Core Fields (Your Requirements)
```
1.  fullname
2.  ic
3.  bank
4.  bank_no
5.  project_name
6.  project_date (MULTIPLE - comma-separated or array)
7.  project_time
8.  wages
9.  hour_wages (if any)
10. ot (overtime)
11. claims
12. allowance
13. commission
14. payment_date
15. working_time
16. project_pic (person in charge)
17. project_venue (MULTIPLE - can have multiple venues)
```

### Additional Suggested Fields (For Tracking)
```
18. source_file (original Excel filename)
19. source_sheet (sheet name if multi-sheet)
20. source_row (row number in original)
21. extraction_confidence (high/medium/low)
22. total_payment (calculated: wages + ot + claims + allowance + commission)
23. verification_status (passed/failed/needs_review)
24. notes (any special cases or anomalies)
```

## 🔍 Complex Scenarios to Handle

### Scenario 1: Multiple Tables on One Page
```
┌─────────────────────────────────────┐
│ MAIN TABLE: Candidate Payment Data │
├─────────────────────────────────────┤
│ Name │ IC │ Bank │ Payment │ etc. │
└─────────────────────────────────────┘

┌──────────────────────┐  ┌──────────────────────┐
│ SIDE TABLE: Roster   │  │ SIDE TABLE: Venue    │
├──────────────────────┤  ├──────────────────────┤
│ Date │ Time │ Staff │  │ Location │ Details   │
└──────────────────────┘  └──────────────────────┘
```

**Challenge**: AI must:
1. Identify which is the MAIN table (has IC numbers, bank details)
2. Identify SIDE tables (roster, venue, schedule)
3. Link side table data to main table records (by date, name, or position)

### Scenario 2: Merged Cells (Continuation Rows)
```
Row 1: │ John Tan │ 920101... │ Maybank │ 1234... │ Project A │ 100 │
Row 2: │          │           │         │         │ 2025-01-15│ 50  │  <-- CONTINUATION
Row 3: │          │           │         │         │ 2025-01-16│ 50  │  <-- CONTINUATION
```

**Challenge**: AI must:
1. Detect empty cells that are actually merged/continuation
2. Check if IC number matches (or is empty = same person)
3. Aggregate data (multiple project dates, sum amounts if needed)
4. Create ONE masterlist record with multiple dates/amounts

### Scenario 3: Mixed Content Types
```
Page 1: Payment table with candidate data
Page 2: Receipt image (OCR needed)
Page 3: Roster/schedule only (no payment data)
```

**Challenge**: AI must:
1. Classify each page type
2. Extract differently based on type
3. Link receipts to candidates if possible

## 🤖 AI Extraction Strategy

### Phase 1: Deep Structure Analysis
```
Prompt to Gemini:
"Analyze this Excel image and provide COMPLETE structure analysis:

1. TABLE IDENTIFICATION:
   - How many tables are on this page?
   - Which is the MAIN table (contains IC numbers, bank details, payments)?
   - Which are SIDE tables (roster, venue, schedule)?
   - Provide coordinates/location of each table

2. MAIN TABLE STRUCTURE:
   - Column headers (left to right)
   - Which columns contain: name, IC, bank name, bank account, payment amounts
   - Data start row, data end row
   - Any merged cells (specify range)

3. MERGED CELL ANALYSIS:
   - List all merged cell ranges
   - For each merged range: what is the value, which candidate does it belong to?
   - Are these continuation rows (same person, multiple dates/payments)?

4. SIDE TABLE RELATIONSHIPS:
   - How do side tables relate to main table?
   - Are they per-candidate or per-project?
   - What additional data do they provide?

Return DETAILED JSON with structure analysis."
```

### Phase 2: Data Extraction with Context
```
Prompt to Gemini:
"Using the structure analysis, extract ALL candidate records:

For EACH CANDIDATE (not each row):
1. Personal Info: name, IC, bank, account number
2. Project Info: name, PIC, venue(s)
3. Payment Info:
   - wages (basic pay)
   - hour_wages (if hourly rate exists)
   - ot (overtime)
   - claims (expense claims)
   - allowance (meal/transport)
   - commission (if any)
   - total_payment (your calculation)
4. Dates:
   - project_date (all dates worked - array)
   - payment_date (when paid)
   - working_time (time ranges for each date)
5. From Side Tables:
   - venue details from venue table
   - roster info from roster table

CRITICAL RULES:
- If cells are empty but data continues, CHECK IC NUMBER
- If IC is same/empty = SAME PERSON, aggregate their data
- If row has 'Total', 'Grand Total', 'Subtotal' = SKIP IT
- Multiple dates for same candidate = combine into ONE record
- Calculate and verify: wages + ot + claims + allowance + commission

Return CANDIDATE RECORDS (not row-by-row data)."
```

### Phase 3: Verification Pass
```
Prompt to Gemini:
"Review the extracted data and verify:

1. CALCULATION CHECKS:
   - Does wages + ot + claims + allowance + commission = total_payment?
   - Flag any mismatches

2. DUPLICATE CHECKS:
   - Any duplicate IC numbers with DIFFERENT data?
   - Same person appearing multiple times?

3. DATA QUALITY:
   - All IC numbers valid format?
   - All account numbers clean (no .0 suffix)?
   - All dates in YYYY-MM-DD format?
   - Any obviously wrong data (e.g., Days=500, Name='Total')?

4. MISSING DATA:
   - Which fields are empty for each candidate?
   - Is this expected or data extraction error?

Return VERIFICATION REPORT with issues found."
```

### Phase 4: Auto-Correction
```
Prompt to Gemini:
"Based on verification issues, CORRECT the data:

For each issue:
1. Explain the problem
2. Provide corrected value with reasoning
3. Confidence level in correction

Re-analyze the original image if needed to find missed data."
```

## 📊 Masterlist Structure

### Front Page (Consolidated Masterlist)
```
Sheet 1: "MASTERLIST"
- All candidates from all Excel files
- One row per unique candidate
- Multiple dates/venues in comma-separated format or multiple columns
- Source tracking columns (which file, which sheet, which row)
```

### Original Sheets (Reference)
```
Sheet 2: "Source_baito_2025_full_year.xlsx"
Sheet 3: "Source_combined_2025.xlsx"
etc.
- Keep original extracted data
- For reference and verification
```

### Verification Report
```
Sheet N: "VERIFICATION_REPORT"
- List of all issues found
- Corrections made
- Items needing manual review
```

## 🔄 Complete Workflow

```
1. UPLOAD
   ↓
2. DETECT CONTENT TYPE
   ├─ Excel table data → Process normally
   ├─ Receipt images → OCR extraction
   └─ Mixed → Handle both
   ↓
3. SCREENSHOT CONVERSION
   - Convert each sheet to PNG
   - Handle multi-page Excel files
   ↓
4. STRUCTURE ANALYSIS (Gemini Pass 1)
   - Identify tables
   - Detect merged cells
   - Classify table types
   ↓
5. DATA EXTRACTION (Gemini Pass 2)
   - Extract candidate records
   - Handle continuations
   - Link side table data
   ↓
6. VERIFICATION (Gemini Pass 3)
   - Validate calculations
   - Check duplicates
   - Find data quality issues
   ↓
7. AUTO-CORRECTION (Gemini Pass 4)
   - Fix identified issues
   - Re-extract if needed
   ↓
8. MASTERLIST GENERATION
   - Combine all sources
   - Deduplicate by IC
   - Export to Excel
   ↓
9. EXPORT
   - Master Excel (front page + source sheets + report)
   - Optional: Push to Supabase
```

## 💾 Implementation Plan

### Script Structure:
```python
excel_extraction_complete.py
├── detect_content_type()
├── convert_to_screenshots()
├── analyze_structure()      # Gemini Pass 1
├── extract_candidates()     # Gemini Pass 2
├── verify_data()           # Gemini Pass 3
├── auto_correct()          # Gemini Pass 4
├── generate_masterlist()
└── export_to_excel()
```

### Key Features:
1. **Multi-pass AI analysis** (4 Gemini calls per Excel file)
2. **Merged cell intelligence** (checks IC to group rows)
3. **Side table detection** (roster, venue, schedule)
4. **Verification with reasoning** (explains what's wrong)
5. **Auto-correction** (fixes issues automatically)
6. **Consolidated masterlist** (all sources combined)
7. **Full traceability** (source tracking for every record)

## ⚠️ Edge Cases to Handle

1. **Same person, different projects** → Multiple masterlist rows? Or one row with project array?
2. **Partial data** → How to handle missing IC or bank info?
3. **Receipt images in Excel** → Extract separately or skip?
4. **Non-standard formats** → AI must be flexible
5. **Handwritten notes** → Can Gemini OCR handwriting?

## 🎯 Success Criteria

1. ✅ Extract 100% of candidate records (no missed rows)
2. ✅ Correctly handle merged cells (group by IC)
3. ✅ Identify and link side tables
4. ✅ Verify calculations (catch errors)
5. ✅ Auto-correct common issues
6. ✅ Generate clean masterlist Excel file
7. ✅ Full traceability (can find source of any record)

---

## 🤔 Questions Before Implementation:

1. **Multiple dates handling**:
   - One row per candidate with dates comma-separated: "2025-01-15, 2025-01-16"
   - OR multiple rows per candidate (one per date)?

2. **Duplicate candidates across files**:
   - Same IC in multiple Excel files = combine into one record?
   - OR keep separate (different projects)?

3. **Receipt handling**:
   - Should we OCR receipt images found in Excel?
   - Or skip them for now?

4. **API choice**:
   - Use Google Gemini direct API (faster, cheaper)
   - OR OpenRouter (same API, more flexibility)?

5. **Output format**:
   - Excel only?
   - Also push to Supabase?
