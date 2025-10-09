# Excel Vision Extraction - Output to Excel First

## 🎯 New Approach: Vision AI → Excel Review → Database

Instead of directly inserting to Supabase, we now:
1. ✅ Use Vision AI to understand each table
2. ✅ Extract with deep reasoning about merged cells, continuations, summaries
3. ✅ Output to Excel for human review
4. ✅ Then import to Supabase after approval

---

## 🧠 How the Reasoning Model Works

### Stage 1: Identify Structure (GPT-4 Vision)
Analyzes the Excel screenshot and identifies:
- Table type (personal info, payment data, mixed)
- Header row location and all column names
- Merged cell locations and their span
- Summary/subtotal row locations
- Multiple sections within one sheet
- Data quality issues

**Output:** Structured JSON with table metadata

### Stage 2: Extract with Reasoning (GPT-4 Vision)
For EACH row, the model reasons:
- ❓ Is this a data row, continuation row, or summary row?
- ❓ Which candidate does this belong to?
- ❓ Is this adding new info or continuing from merged cell above?
- ❓ What does each cell value mean in context?

**Handles:**
- ✅ Merged cells → Groups continuation rows with parent
- ✅ Ambiguous columns → Determines "Payment" vs "Total" meaning
- ✅ Days > 50 → Recognizes as payment amount, not days
- ✅ Summary rows → Excludes "Total", "Grand Total", "Subtotal"
- ✅ Roster sections → Skips rows with Name but no IC
- ✅ Payment logic → Sums Wages+OT+Allowance+Claims correctly

**Output:** Array of candidate records (not individual rows)

### Stage 3: Validate & Review (GPT-4)
Cross-checks extracted data:
- ✅ IC numbers unique? (duplicates = failed merging)
- ✅ Payment calculations correct?
- ✅ Account numbers clean (no .0)?
- ✅ Totals match summary rows in Excel?
- ✅ Any suspicious data (Names="Total", Days=500)?

**Output:** Validation report with issues flagged

### Stage 4: Export to Excel
Generates clean Excel file with:
- All extracted candidate records
- Source row tracking
- Confidence scores
- Reasoning explanations
- Issue flags for manual review

---

## 🚀 Setup

### 1. Import Workflow
```bash
# Start n8n
npx n8n

# Import workflow
# Open http://localhost:5678
# Workflows → Import from File → vision_to_excel_workflow.json
```

### 2. Configure OpenAI Credentials
- Settings → Credentials → Add OpenAI API
- Need GPT-4 Vision access
- Save as `openai_vision`

### 3. Test Single Sheet
```bash
# Take screenshot of one Excel sheet
# Run test:
node n8n-setup/test-vision-to-excel.js screenshot.png
```

---

## 📸 Batch Processing All Excel Files

### Option 1: Manual Screenshots
```bash
# For each Excel file:
# 1. Open in Excel/Numbers/LibreOffice
# 2. Navigate to each sheet
# 3. Take screenshot (Cmd+Shift+4 on Mac)
# 4. Save as: {filename}_{sheetname}.png

# Then batch process:
node n8n-setup/batch-process-screenshots.js excel_screenshots/
```

### Option 2: Automated Screenshots (Python)
```bash
# Install dependencies
pip install openpyxl Pillow pandas

# Generate screenshots automatically
python scripts/excel_to_screenshots.py \
  --input "excel_imports/*.xlsx" \
  --output "excel_screenshots/"

# Then process with n8n
node n8n-setup/batch-process-screenshots.js excel_screenshots/
```

### Option 3: Use Claude Vision Directly (No n8n)
```bash
# Process with Claude API
node scripts/claude-vision-extractor.js excel_screenshots/
```

---

## 📊 Output Files

After processing, you'll get:

### 1. Individual JSON Files
```
baito_jan2025_sheet1_extracted.json
baito_jan2025_sheet2_extracted.json
...
```

### 2. Excel Output File
```
baito_extracted_2025-10-08_143022.xlsx
```

**Columns:**
- Name
- IC Number (clean, no .0)
- Phone
- Bank Name
- Account Number (string format)
- Total Days
- Wages, Overtime, Allowance, Claims
- Total Payment
- Payment Date
- Project Name
- Location
- Notes
- **Source Rows** (e.g., "2+3+4" = rows 2,3,4 merged)
- **Confidence** (high/medium/low)
- **Reasoning** (explains how data was interpreted)
- **Issues** (flags for manual review)

---

## ✅ Review Process

### 1. Check Confidence Scores
```bash
# Filter low confidence records
=FILTER(A:S, Q:Q="low")
```

### 2. Review Flagged Issues
Look at **Issues** column for:
- "Possible duplicate IC"
- "Payment calculation mismatch"
- "Missing required field"
- "Unusual value (Days > 50)"

### 3. Compare with Source
Use **Source Rows** column to find original data:
- Open original Excel file
- Navigate to sheet
- Check rows listed (e.g., rows 2+3+4)
- Verify extraction is correct

### 4. Validate Totals
```bash
# Sum all payments
=SUM(K:K)

# Compare with your session summary: RM 496,606.55
```

### 5. Check for Missing Data
```bash
# Count records per month
=COUNTIF(L:L, "Jan*")  # Should match original file
```

---

## 🔄 Re-process Issues

If you find issues:

### 1. Adjust Prompts
Edit the workflow in n8n:
- Click "Vision 2 - Extract with Reasoning" node
- Modify the prompt to handle the specific case
- Save workflow

### 2. Re-run Failed Sheets
```bash
# Just the problematic sheet
node n8n-setup/test-vision-to-excel.js \
  excel_screenshots/baito_march_sheet5.png
```

### 3. Merge Results
```bash
# Combine all individual Excel outputs
python scripts/merge_extracted_excels.py \
  --input "baito_extracted_*.xlsx" \
  --output "baito_2025_FINAL_MASTER.xlsx"
```

---

## 📈 Expected Improvements Over V3

| Issue | V3 Python Script | V4 Vision AI |
|-------|------------------|--------------|
| Merged cells | Manual row grouping | AI understands continuations |
| Ambiguous columns | Fixed logic | Contextual reasoning |
| Summary rows | Keyword matching | Semantic understanding |
| Payment logic | If/else rules | Infers calculation method |
| Account .0 issue | Post-processing | Extracts as string directly |
| Missing data | Blind column mapping | Reads all visible data |
| Multi-section sheets | Section detection logic | Identifies boundaries visually |

**Result:** Should achieve >95% accuracy with minimal manual fixes

---

## 🎯 Next Steps After Review

Once you've reviewed the Excel output and confirmed accuracy:

### 1. Import to Supabase
```bash
# Use the import script
node scripts/import-to-supabase.js baito_2025_FINAL_MASTER.xlsx
```

### 2. Or use the original n8n workflow
- Switch to `vision_extraction_workflow.json`
- Loads data directly to Supabase
- Includes validation step

---

## 🐛 Troubleshooting

### Vision AI misidentifies merged cells
**Fix:** Adjust prompt in "Vision 1 - Identify Structure":
```
Add this line:
"Pay special attention to cells that span multiple rows - these create continuation rows where Name/IC are empty but data continues from above."
```

### Payments still wrong
**Fix:** In "Vision 2 - Extract with Reasoning", enhance payment logic:
```
Add this section:
"PAYMENT VALIDATION: After calculating total, verify:
- If Total column exists, use it (not calculated sum)
- If only Payment column exists, use it as-is
- Cross-check: Does Wages+OT+Allowance ≈ Total? If not, explain discrepancy in reasoning field"
```

### Too many false positives
**Fix:** Strengthen exclusion rules:
```
Add to EXCLUDE section:
"- Any row where Name contains keywords: Total, Subtotal, Grand, Sum, Pax, Team, Staff
- Any row where IC is empty AND Name is not empty (roster section)
- Any row where all payment fields are 0 AND no date field (template row)"
```

---

## 📚 Files Reference

- `vision_to_excel_workflow.json` - Main n8n workflow
- `test-vision-to-excel.js` - Single sheet tester
- `batch-process-screenshots.js` - Batch processor
- `excel_to_screenshots.py` - Auto screenshot generator
- `merge_extracted_excels.py` - Combine all outputs
- `import-to-supabase.js` - Final database import

