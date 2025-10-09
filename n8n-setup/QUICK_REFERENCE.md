# Quick Reference Card: Vision AI Excel Extraction

## 🎯 One-Time Setup (5 minutes)

```bash
# 1. Install n8n
npm install -g n8n

# 2. Start n8n
n8n start
# Opens at: http://localhost:5678

# 3. Import workflow
# In n8n UI: Workflows → Import → vision_to_excel_workflow.json

# 4. Add OpenAI credentials
# Settings → Credentials → Add OpenAI API → Save as "openai_vision"

# 5. Activate workflow
# Toggle "Inactive" to "Active"

# 6. Restart Claude Desktop (to enable n8n-mcp)
```

---

## 📸 Step 1: Generate Screenshots (10 minutes)

```bash
# Install Python packages (once)
pip install openpyxl pillow pandas

# Generate screenshots from all Excel files
python scripts/excel_to_screenshots.py \
  --input "excel_imports/*.xlsx" \
  --output excel_screenshots/
```

**Output:** PNG image for each Excel sheet

---

## 🔄 Step 2: Run Vision AI Extraction (1-2 hours)

### Test First
```bash
# Test one sheet to verify it works
node n8n-setup/test-vision-to-excel.js \
  excel_screenshots/baito_jan2025_sheet1.png
```

### Batch Process All
```bash
# Process all screenshots (~45s per sheet)
node n8n-setup/batch-process-screenshots.js excel_screenshots/
```

**Output:**
- `baito_extracted_*.xlsx` - One Excel file per sheet
- `*_extracted.json` - JSON data for each sheet
- Validation reports in console

---

## 📊 Step 3: Review Results (30 minutes)

```bash
# Open any extracted file
open baito_extracted_*.xlsx
```

**Check these columns:**
- ✅ **Confidence**: Look for "low" confidence records
- ✅ **Issues**: Read flagged problems
- ✅ **Reasoning**: Understand how AI interpreted data
- ✅ **Source Rows**: Use to verify against original

**Validate:**
```excel
# In Excel, calculate total
=SUM(K:K)  # K = Total Payment column

# Should match: RM 496,606.55 (or close)
```

---

## 🔗 Step 4: Merge Everything (5 minutes)

```bash
# Combine all individual Excel files into one master
python scripts/merge_extracted_excels.py \
  --input "baito_extracted_*.xlsx" \
  --output baito_2025_VISION_MASTER.xlsx
```

**Output:** `baito_2025_VISION_MASTER.xlsx`
- Sheet 1: All merged data
- Sheet 2: Summary stats

---

## ✅ Step 5: Final Validation (15 minutes)

### 1. Check totals
```excel
=SUM(K:K)  # Total payments
# Compare: RM 496,606.55 expected
```

### 2. Check unique candidates
```excel
=COUNTA(UNIQUE(B:B))  # Unique IC numbers
# Should be ~1,081 candidates
```

### 3. Review flagged issues
```excel
=FILTER(A:S, S:S<>"")  # Records with issues
```

### 4. Sample verification
- Pick 5-10 random records
- Open original Excel file
- Use **Source Rows** to find data
- Verify extraction is correct

---

## 🚀 Step 6: Import to Supabase (10 minutes)

```bash
# Import to database
node scripts/import-to-supabase.js baito_2025_VISION_MASTER.xlsx
```

**Done!** 🎉

---

## 🐛 If Something Goes Wrong

### Vision AI returns errors
```bash
# Check n8n is running
# Check OpenAI API key is valid
# Check workflow is activated
```

### Wrong data extracted
```bash
# Edit prompts in n8n workflow:
# 1. Open http://localhost:5678
# 2. Click workflow
# 3. Click "Vision 2 - Extract with Reasoning" node
# 4. Edit prompt
# 5. Save
# 6. Re-run: node n8n-setup/test-vision-to-excel.js screenshot.png
```

### Merged cells not grouping
```bash
# Add to Vision 2 prompt:
"When Name/IC cells are empty but data exists below,
this is a continuation row from a merged cell above.
Group these rows with the parent candidate."
```

### Summary rows included
```bash
# Add to Vision 2 EXCLUDE section:
"Skip rows where Name contains: Total, Subtotal, Grand, Sum
or where all fields are empty except one numerical value."
```

---

## 📞 Quick Commands

| Action | Command |
|--------|---------|
| Start n8n | `n8n start` |
| Generate screenshots | `python scripts/excel_to_screenshots.py --input "*.xlsx" --output screenshots/` |
| Test one sheet | `node n8n-setup/test-vision-to-excel.js screenshot.png` |
| Batch process | `node n8n-setup/batch-process-screenshots.js screenshots/` |
| Merge results | `python scripts/merge_extracted_excels.py --input "baito_*.xlsx" --output master.xlsx` |
| Import to DB | `node scripts/import-to-supabase.js master.xlsx` |

---

## 📁 File Locations

```
n8n-setup/
  ├── vision_to_excel_workflow.json    ← Import this to n8n
  ├── test-vision-to-excel.js          ← Test single sheet
  ├── batch-process-screenshots.js     ← Batch processor
  └── README.md                         ← Full documentation

scripts/
  ├── excel_to_screenshots.py          ← Auto-generate screenshots
  ├── merge_extracted_excels.py        ← Merge all results
  └── import-to-supabase.js            ← (to be created)

excel_screenshots/                      ← Put screenshots here
  └── *.png

Output:
  ├── baito_extracted_*.xlsx           ← Individual extractions
  ├── *_extracted.json                 ← JSON data
  └── baito_2025_VISION_MASTER.xlsx    ← Final merged result
```

---

## 🎯 Success Checklist

Before importing to Supabase:

- [ ] All Excel files have screenshots
- [ ] Batch processing completed (no errors)
- [ ] Merged file created
- [ ] Total payment matches expected (~RM 496,606)
- [ ] Unique candidates count correct (~1,081)
- [ ] Reviewed low confidence records
- [ ] Reviewed flagged issues
- [ ] Sample verification passed (5-10 records)
- [ ] No duplicate IC numbers (or explained)
- [ ] Account numbers clean (no .0)

---

## ⏱️ Time Estimates

| Step | Time |
|------|------|
| One-time setup | 5 min |
| Generate screenshots | 10 min |
| Vision AI extraction | 1-2 hrs (141 sheets × 45s) |
| Review results | 30 min |
| Merge files | 5 min |
| Final validation | 15 min |
| Import to Supabase | 10 min |
| **Total** | **~3 hours** |

---

**🚀 Ready to start? Run:**
```bash
n8n start
```

Then follow Step 1!
