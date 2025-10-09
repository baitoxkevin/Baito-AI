# Excel Vision Processor

Automated Excel data extraction using AI vision analysis via n8n workflow.

## Setup

### 1. Install Python Dependencies

```bash
pip3 install openpyxl pillow requests
```

### 2. Activate n8n Workflow

**IMPORTANT:** You must manually activate the workflow in n8n UI.

1. Open n8n at http://localhost:5678
2. Find workflow: **"Excel Vision Extractor - OpenRouter API"**
3. Click the **toggle switch** in top-right to activate it
4. Verify webhook URL shows: `http://localhost:5678/webhook/vision-to-excel`

### 3. Run the Processor

```bash
# From project root
cd scripts
python3 excel-vision-processor.py
```

## How It Works

1. **Convert Excel → Image**: Renders each Excel file as a PNG screenshot
2. **Send to n8n**: Posts image to n8n webhook as base64 data URL
3. **AI Analysis**: n8n workflow uses Claude 3.5 Sonnet via OpenRouter to:
   - Identify table structure
   - Extract candidate data with deep reasoning
   - Validate extracted records
4. **Save Results**: JSON results saved to `excel_extraction_results/`

## Files Processed

- `master_candidate_data.xlsx`
- `master_candidate_data_v2.xlsx`
- `baito_2025_full_year_master.xlsx`
- `zenevento_2025_master.xlsx`
- And 6 more files...

## Output

- **Screenshots**: `excel_screenshots/` - PNG images of each Excel file
- **Results**: `excel_extraction_results/` - JSON extraction results

## Troubleshooting

### "Cannot connect to n8n webhook"
- Make sure n8n is running: check http://localhost:5678
- Verify workflow is **ACTIVE** (toggle switch ON)
- Check webhook path in workflow settings

### "ModuleNotFoundError"
```bash
pip3 install openpyxl pillow requests
```
