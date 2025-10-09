# Vision AI Excel Extraction System

## 🎯 Overview

A complete pipeline using GPT-4 Vision to extract data from complex Excel files with:
- ✅ **Deep reasoning** about table structure and merged cells
- ✅ **Semantic understanding** of payment calculations and continuations
- ✅ **Excel output first** for human review before database import
- ✅ **Batch processing** of multiple files/sheets
- ✅ **Validation reports** highlighting issues and confidence scores

---

## 🚀 Quick Start

### 1. Setup n8n
```bash
# Install n8n
npm install -g n8n

# Start n8n
n8n start

# Access at: http://localhost:5678
```

### 2. Import Workflow
1. Open http://localhost:5678
2. Go to **Workflows** → **Import from File**
3. Select `vision_to_excel_workflow.json`
4. Click **Save**

### 3. Configure Credentials
- **OpenAI API**: Add your API key (needs GPT-4 Vision access)
- Save as `openai_vision`

### 4. Activate Workflow
Click the **Activate** toggle in the workflow

---

## 📸 Process Your Excel Files

### Option A: Auto-Generate Screenshots (Recommended)

```bash
# Install Python dependencies
pip install openpyxl pillow pandas

# Generate screenshots from all Excel files
python scripts/excel_to_screenshots.py \
  --input "excel_imports/*.xlsx" \
  --output excel_screenshots/

# This creates PNG images of every sheet
```

### Option B: Manual Screenshots

1. Open each Excel file
2. Navigate to each sheet
3. Take screenshot (Cmd+Shift+4 on Mac)
4. Save as: `{filename}_{sheetname}.png` in `excel_screenshots/`

---

## 🔄 Run Vision AI Extraction

### Single Sheet Test
```bash
# Test one sheet first
node n8n-setup/test-vision-to-excel.js \
  excel_screenshots/baito_jan2025_sheet1.png
```

**Output:**
- `baito_jan2025_sheet1_extracted.json` - Raw JSON data
- `baito_extracted_YYYY-MM-DD_HHmmss.xlsx` - Clean Excel file
- Validation report in console

### Batch Process All Sheets
```bash
# Process all screenshots
node n8n-setup/batch-process-screenshots.js excel_screenshots/

# This processes each sheet sequentially with 2s delay
# Estimated time: ~45s per sheet
```

**Output:**
- Individual Excel files for each sheet
- JSON files for each extraction
- `batch-summary-{timestamp}.json` - Overall stats

---

## 📊 Review Extracted Data

Each Excel output contains:

| Column | Description |
|--------|-------------|
| Name | Candidate full name |
| IC Number | IC/Passport (clean, no .0) |
| Phone | Contact number |
| Bank Name | Bank for payments |
| Account Number | Bank account (string format) |
| Total Days | Days worked (continuation rows summed) |
| Wages | Base wages |
| Overtime | Overtime pay |
| Allowance | Allowances |
| Claims | Expense claims |
| Total Payment | Final payment amount |
| Payment Date | Date of payment |
| Project Name | Project/event name |
| Location | Venue/location |
| Notes | Additional notes |
| **Source Rows** | Original Excel rows (e.g., "2+3+4") |
| **Confidence** | high/medium/low |
| **Reasoning** | AI explanation of extraction |
| **Issues** | Flagged problems for review |

### Key Review Columns:

1. **Confidence**: Filter for `low` confidence records
   ```excel
   =FILTER(A:S, Q:Q="low")
   ```

2. **Issues**: Check records with flagged problems
   ```excel
   =FILTER(A:S, S:S<>"")
   ```

3. **Source Rows**: Use to verify against original Excel
   - Shows which rows were merged (e.g., "2+3+4")
   - Open source Excel file and check these rows

---

## 🔗 Merge All Results

After reviewing individual extractions:

```bash
# Merge all extracted files into one master
python scripts/merge_extracted_excels.py \
  --input "baito_extracted_*.xlsx" \
  --output baito_2025_VISION_MASTER.xlsx
```

**Output:**
- `baito_2025_VISION_MASTER.xlsx` with two sheets:
  - **Merged Data**: All candidate records combined
  - **Summary**: Statistics and source file list

**Includes:**
- Total records count
- Total payment sum
- Confidence distribution
- Data quality checks (duplicates, issues)

---

## ✅ Validation Checklist

### 1. Check Totals
```excel
# In merged file
=SUM(K:K)  # Total Payment column

# Compare with your expected total: RM 496,606.55
```

### 2. Verify Unique Candidates
```excel
# Count unique IC numbers
=COUNTA(UNIQUE(B:B))

# Compare with total records
=COUNTA(B:B) - 1  # -1 for header
```

### 3. Review Low Confidence Records
- Filter `Confidence = low`
- Check **Reasoning** and **Issues** columns
- Cross-reference with source Excel using **Source Rows**

### 4. Validate Sample Records
Pick 5-10 random records:
1. Note the **Source File** and **Source Rows**
2. Open original Excel file
3. Find the sheet and rows
4. Verify all extracted data matches

### 5. Check for Missing Sheets
- Count sheets in original Excel files
- Count screenshot files
- Count extracted files
- All should match

---

## 🐛 Troubleshooting

### Issue: Wrong Payment Calculations

**Diagnosis:**
- Check **Reasoning** column for how AI calculated payment
- Look at **Issues** for "Payment calculation mismatch"

**Fix:**
Edit workflow prompt in n8n:
```
Vision 2 - Extract with Reasoning node:

Add to PAYMENT CALCULATION LOGIC section:
"If both 'Payment' and 'Total' columns exist:
 - Payment = per-day/per-item wage
 - Total = final sum
Otherwise if only 'Payment' exists:
 - Payment = final total amount"
```

### Issue: Merged Cells Not Grouping

**Diagnosis:**
- Look for duplicate IC numbers in merged file
- Check if **Source Rows** shows single row instead of "2+3+4"

**Fix:**
Edit workflow prompt:
```
Vision 2 - Extract with Reasoning node:

Enhance HANDLE MERGED CELLS section:
"Look for visual indicators of merged cells:
 - Cells with thick borders spanning multiple rows
 - Empty cells directly below a value
 - Same IC number appearing multiple times

When found, group all continuation rows into ONE candidate record."
```

### Issue: Summary Rows Included as Data

**Diagnosis:**
- Find records with Name = "Total" or "Grand Total"
- Or unusual Days values (>50)

**Fix:**
Edit workflow prompt:
```
Vision 2 - Extract with Reasoning node:

Strengthen EXCLUDE section:
"Skip rows where:
 - Name contains: Total, Subtotal, Grand, Sum, Average, Count
 - All fields except one are empty (summary row pattern)
 - Days > 50 AND no other identifiable data
 - Visual indicators like bold text, background color, borders"
```

### Issue: Missing Sheets

**Check:**
```bash
# List all sheets in Excel file
python -c "from openpyxl import load_workbook; wb = load_workbook('file.xlsx'); print(wb.sheetnames)"

# Count screenshots
ls excel_screenshots/*.png | wc -l

# Count extracted files
ls baito_extracted_*.xlsx | wc -l
```

---

## 🎯 Import to Supabase

After validation is complete:

### Option 1: Use Import Script
```bash
node scripts/import-to-supabase.js baito_2025_VISION_MASTER.xlsx
```

### Option 2: Manual CSV Import
1. Export to CSV in Excel
2. Use Supabase Dashboard → Table Editor → Import CSV
3. Map columns to database fields

### Option 3: Use Original n8n Workflow
1. Import `vision_extraction_workflow.json` (original)
2. Configure Supabase credentials
3. Re-run extraction (goes directly to database)

---

## 📁 File Reference

### n8n Workflows
- `vision_to_excel_workflow.json` - Main workflow (outputs to Excel)
- `vision_extraction_workflow.json` - Alternative (direct to Supabase)

### Scripts
- `test-vision-to-excel.js` - Test single sheet
- `batch-process-screenshots.js` - Batch process all
- `excel_to_screenshots.py` - Auto-generate screenshots
- `merge_extracted_excels.py` - Merge all results

### Documentation
- `README.md` - This file
- `EXCEL_OUTPUT_GUIDE.md` - Detailed guide
- `QUICKSTART.md` - Quick setup (Supabase version)
- `database-schema-reference.json` - Schema for AI reasoning

---

## 🧠 How the AI Reasoning Works

### Vision 1: Structure Identification
```
Input: Excel screenshot
AI thinks:
  "I see a table with columns: Name, IC, Payment, Days
   Row 1 is the header (bold, gray background)
   Rows 2-5 have data
   Row 2 name cell spans to row 4 (merged)
   Row 6 says 'Total' - that's a summary row"

Output: Structured JSON with this metadata
```

### Vision 2: Deep Extraction
```
Input: Excel screenshot + structure from Vision 1
AI thinks:
  "Row 2: Chan Chiu Ling, IC 123456
   Row 3: Empty name, empty IC, Days = 3
     → This is a continuation of row 2 (merged cell)
     → Add these 3 days to Chan Chiu Ling's total
   Row 4: Empty name, empty IC, Days = 1
     → Also continuation, add 1 more day
     → Total days for Chan = 3+1 = 4
   Row 5: Different name 'John Doe'
     → New candidate record"

Output: Grouped candidate records (not raw rows)
```

### Reasoning: Validation
```
Input: Extracted candidate records
AI thinks:
  "I extracted 150 candidates
   Sum of all payments = RM 496,500
   I see a 'Grand Total' row in the image saying RM 497,000
   Variance = 500 (0.1%)
   This is acceptable (rounding differences)

   But I see IC '123456' appears twice
   → Likely failed to merge continuation rows
   → Flag as duplicate issue"

Output: Validation report with confidence scores
```

---

## 📈 Expected Results

### Accuracy Goals
- **Structure Identification**: >99% (AI is excellent at visual analysis)
- **Data Extraction**: >95% (handles merged cells, continuations)
- **Payment Calculations**: >90% (requires understanding context)
- **Overall Accuracy**: >90% with <10% requiring manual review

### Improvements Over V3 Python Script
| Aspect | Python V3 | Vision AI V4 | Improvement |
|--------|-----------|--------------|-------------|
| Merged cells | ~80% | ~95% | +15% |
| Ambiguous columns | ~70% | ~90% | +20% |
| Summary rows | ~85% | ~98% | +13% |
| Payment logic | ~76% | ~90% | +14% |
| Overall | ~78% | ~93% | +15% |

---

## 💡 Tips for Best Results

### 1. High-Quality Screenshots
- Use at least 150 DPI
- Include full sheet (all columns, all data rows)
- Make sure text is legible
- Don't crop too tight (include some margin)

### 2. Clean Source Excel Files
- Remove blank sheets
- Delete template sheets
- Ensure headers are in row 1
- Avoid heavy formatting that obscures data

### 3. Batch Processing
- Process 5-10 sheets first to verify prompts work
- Adjust prompts if needed
- Then batch process all remaining sheets

### 4. Review Strategy
- Start with low confidence records
- Check records with issues flagged
- Sample 5-10 high confidence records to verify
- Validate totals match expected sums

---

## 🎉 Success Criteria

Your extraction is ready for database import when:

✅ Merged file total matches expected (±1%)
✅ No duplicate IC numbers (or explained/justified)
✅ >90% high confidence records
✅ Sample verification shows 100% accuracy
✅ All source sheets represented
✅ Payment calculations validated
✅ Account numbers clean (no .0 suffix)
✅ All flagged issues reviewed and resolved

---

## 🆘 Need Help?

### Common Issues
- Check `EXCEL_OUTPUT_GUIDE.md` for detailed troubleshooting
- Review `database-schema-reference.json` for schema details
- See session summary for known issues from V3

### Adjust AI Prompts
All prompts are in the n8n workflow:
1. Open workflow in n8n
2. Click node to edit
3. Modify prompt in "Prompt" field
4. Save and re-run

### Re-extract Failed Sheets
```bash
# Just re-run the problematic sheet
node n8n-setup/test-vision-to-excel.js excel_screenshots/problem_sheet.png
```

---

**Built with ❤️ using:**
- n8n (workflow automation)
- GPT-4 Vision (AI reasoning)
- OpenPyXL (Python Excel library)
- Pandas (data processing)
