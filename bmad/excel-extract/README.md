# Excel Vision Extractor Module (n8n Edition)

**Version:** 2.0.0
**Module Code:** excel-extract
**Platform:** n8n Workflow Automation
**Created:** 2025-10-08

## Overview

The **Excel Vision Extractor** is an n8n-based automation module that extracts, validates, and imports candidate and project data from complex Excel spreadsheets using Google's Gemini Vision API with multi-phase analysis.

### Key Difference: n8n Workflow Automation ✅

This module uses **n8n workflows** for complete automation - no manual invocation needed!

**Trigger Options:**
- 🔗 **Webhook** - API endpoint for external systems
- ⏰ **Schedule** - Daily/weekly automatic processing
- 📁 **File Upload** - Process when file uploaded to folder

**Benefits:**
- ✅ Visual workflow editor (no coding required)
- ✅ Fully automated execution
- ✅ Built-in error handling and retries
- ✅ Real-time monitoring and logs
- ✅ Easy to modify and extend

---

## Quick Start

### 1. Install n8n

**Option A: Docker (Recommended)**
```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

**Option B: npm**
```bash
npm install n8n -g
n8n start
```

**Option C: n8n Cloud**
- Sign up at https://n8n.cloud
- Skip local installation

### 2. Import Workflows

1. Open n8n at `http://localhost:5678`
2. Go to **Workflows** → **Import from File**
3. Import these workflows:
   - `n8n-templates/01-full-extraction-pipeline.json`
   - `n8n-templates/02-validation-subworkflow.json`

### 3. Configure Credentials

#### Gemini API Key
1. Go to **Credentials** → **Add Credential**
2. Select **HTTP Header Auth**
3. Name: `Gemini API Key`
4. Header Name: `x-goog-api-key`
5. Header Value: `YOUR_GEMINI_API_KEY`

#### Supabase
1. **Credentials** → **Add Credential**
2. Select **Supabase API**
3. Host: `https://your-project.supabase.co`
4. Service Role Key: `YOUR_SUPABASE_KEY`

#### Google Sheets (Optional, for flagged records)
1. **Credentials** → **Add Credential**
2. Select **Google Sheets OAuth2 API**
3. Follow OAuth2 setup wizard

### 4. Activate Workflow

1. Open **Excel Vision Extraction Pipeline** workflow
2. Click **Activate** toggle (top right)
3. Copy webhook URL
4. Done! Workflow is now live 🎉

### 5. Test Workflow

**Using curl:**
```bash
curl -X POST http://localhost:5678/webhook/excel-extract \
  -H "Content-Type: application/json" \
  -d '{
    "file_path": "/data/excel_imports/baito_2025.xlsx",
    "sheets": ["January", "February"]
  }'
```

**Using Postman:**
- Method: POST
- URL: `http://localhost:5678/webhook/excel-extract`
- Body: JSON with file_path and sheets array

---

## Features

### 🤖 AI-Powered Extraction
- **Gemini Vision API** integration for complex Excel layouts
- Handles merged cells, continuation rows, irregular structures
- 4-phase analysis: Structure → Extract → Verify → Correct

### ✅ Comprehensive Validation
- **7 Validation Rules**:
  1. Payment calculation verification (wages + ot + claims = total)
  2. IC format validation (YYMMDD-PB-###G)
  3. Bank number format validation
  4. Required fields completeness
  5. Date format validation
  6. Currency amount validation
  7. Completeness scoring

### 📊 Data Quality Assurance
- Confidence scoring for each extraction
- Automatic flagging of low-confidence records
- Detailed validation reports (Markdown)
- Issue categorization by severity (HIGH/MEDIUM/LOW)

### 💾 Supabase Integration
- Direct database import
- Conflict detection and resolution
- Batch processing
- Rollback support

### 🔄 Automation
- Webhook triggers for external systems
- Schedule-based processing (daily/weekly)
- File upload triggers
- No manual intervention required

---

## Module Structure

```
bmad/excel-extract/
├── README.md                   # This file
├── N8N_ARCHITECTURE.md         # Technical architecture details
├── N8N_QUICK_START.md          # Step-by-step setup guide
├── config.yaml                 # Module configuration
│
├── n8n-templates/              # Ready-to-import workflows
│   ├── 01-full-extraction-pipeline.json
│   ├── 02-validation-subworkflow.json
│   └── 03-gemini-prompts.md   # Prompt templates
│
├── docs/                       # Additional documentation
│   ├── validation-rules.md
│   ├── gemini-api-guide.md
│   └── troubleshooting.md
│
└── examples/                   # Sample data
    ├── sample-excel.xlsx
    └── expected-output.json
```

---

## Workflow Architecture

### Main Workflow: Full Extraction Pipeline

```
[Webhook Trigger]
       ↓
[Read Excel File] ← Spreadsheet File node
       ↓
[Prepare Sheet List] ← Code node
       ↓
[Loop Through Sheets]
       ↓
[Call Gemini Vision API] ← HTTP Request node + Rate Limit
       ↓
[Parse Response] ← Code node
       ↓
[Validate Data] ← Code node (7 rules)
       ↓
[Route by Status] ← Switch node
       ↓           ↓
   [Passed]   [Flagged]
       ↓           ↓
[Supabase]  [Google Sheets]
       ↓
[Webhook Response] ← Return results
```

### Sub-Workflow: Validation

```
[Execute Workflow Trigger]
       ↓
[Apply Validation Rules] ← 7 comprehensive rules
       ↓
[Generate Report] ← Markdown + JSON summary
       ↓
[Return Results]
```

---

## Key n8n Nodes Used

| Node | Purpose |
|------|---------|
| **Webhook** | Trigger workflow via HTTP |
| **Spreadsheet File** | Read Excel files (.xlsx, .xls) |
| **HTTP Request** | Call Gemini Vision API |
| **Code** | JavaScript/Python for logic |
| **Wait** | Rate limiting (15s between API calls) |
| **Switch** | Route data based on conditions |
| **Supabase** | Insert/update database records |
| **Google Sheets** | Save flagged records for review |
| **Execute Sub-workflow** | Call validation workflow |

---

## Configuration

### Key Settings (config.yaml)

```yaml
extraction:
  gemini_model: "gemini-2.0-flash-exp"
  rate_limit_delay: 15  # seconds
  max_retries: 3

validation:
  calculation_check: true
  duplicate_check: true
  ic_format_validation: true
  required_fields:
    - fullname
    - ic
    - project_name
    - total_payment

supabase:
  table_name: "candidates"
  batch_size: 50
  conflict_resolution: "update"  # skip | update | replace
```

---

## Data Flow

```
Excel Files (.xlsx)
    ↓
[Spreadsheet File Node] → Read sheets
    ↓
[HTTP Request Node] → Gemini Vision API
    ↓
[Code Node] → Parse & extract records
    ↓
[Code Node] → Apply 7 validation rules
    ↓
[Switch Node] → Route by validation status
    ↓           ↓
[Passed]    [Flagged]
    ↓           ↓
Supabase    Google Sheets (review)
```

---

## Output

### Successful Extraction Response

```json
{
  "success": true,
  "message": "Extraction complete",
  "records_processed": 250,
  "records_imported": 235,
  "records_flagged": 15,
  "timestamp": "2025-10-08T14:30:00Z"
}
```

### Validation Report (Markdown)

Saved to Google Sheets or sent via email:

```markdown
# Data Validation Report

**Total Records:** 250

## Executive Summary
- **Passed:** 235 (94%)
- **Flagged:** 15 (6%)

## Issues by Severity
- 🔴 HIGH: 7 issues
- 🟡 MEDIUM: 5 issues
- 🟢 LOW: 3 issues

## Issues Found
### CALCULATION_MISMATCH (5 records)
| Row | Name | Details |
|-----|------|---------|
| 23 | Ahmad | Expected RM180, Found RM175 |
...
```

---

## Performance

### Typical Execution Times

| Operation | Duration |
|-----------|----------|
| Read Excel file | 2-5 seconds |
| Gemini Vision API call | 20-30 seconds per sheet |
| Validation | 5-10 seconds per 100 rows |
| Supabase import | 30-60 seconds per 250 rows |

### Full Pipeline (10 sheets, 250 rows)
- **Total:** 15-20 minutes
- **Rate limited by:** Gemini API (15s delay)

---

## Error Handling

n8n provides built-in error handling:

- ✅ **Automatic Retries** - Failed nodes retry up to 3x
- ✅ **Error Workflows** - Separate workflows triggered on errors
- ✅ **Continue on Fail** - Workflow continues despite node failures
- ✅ **Error Logs** - All errors logged with context

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Gemini rate limit | Wait node enforces 15s delay |
| Invalid Excel format | Spreadsheet File node validates format |
| Supabase connection error | Credentials verification step |
| Missing required fields | Validation flags and reports |

---

## Integration

### Trigger Workflow from External System

**Python Example:**
```python
import requests

response = requests.post(
    'http://localhost:5678/webhook/excel-extract',
    json={
        'file_path': '/data/excel_imports/baito_2025.xlsx',
        'sheets': ['January', 'February', 'March']
    }
)

print(response.json())
```

**JavaScript Example:**
```javascript
fetch('http://localhost:5678/webhook/excel-extract', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    file_path: '/data/excel_imports/baito_2025.xlsx',
    sheets: ['January', 'February', 'March']
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

### Schedule Daily Processing

1. Open workflow in n8n
2. Replace **Webhook Trigger** with **Cron Trigger**
3. Set schedule: `0 2 * * *` (2 AM daily)
4. Configure folder path to watch

---

## Advantages vs Claude Code Approach

| Feature | Claude Code | n8n |
|---------|-------------|-----|
| **Automation** | Manual | ✅ Automated |
| **Visual Editor** | Code only | ✅ Drag-and-drop |
| **Monitoring** | Custom logs | ✅ Built-in dashboard |
| **Error Handling** | Custom code | ✅ Built-in retries |
| **Scaling** | Single-threaded | ✅ Parallel execution |
| **Deployment** | Local script | ✅ Cloud or self-host |
| **Learning Curve** | Python required | ✅ Low (visual) |
| **Maintenance** | Manual updates | ✅ Version controlled |

---

## Troubleshooting

### Workflow Not Triggering
- Check webhook URL is correct
- Verify workflow is **Activated**
- Test with Postman first

### Gemini API Errors
- Verify API key in credentials
- Check rate limiting (15s delay)
- Verify API quota not exceeded

### Supabase Import Fails
- Check table schema matches data
- Verify credentials
- Review RLS policies

### Validation Flagging Too Many Records
- Review validation rules in Code node
- Adjust confidence thresholds
- Check source Excel data quality

---

## Support & Development

- **Documentation**: See `N8N_ARCHITECTURE.md` for technical details
- **Quick Start**: See `N8N_QUICK_START.md` for step-by-step setup
- **Examples**: Check `examples/` folder for sample data
- **Issues**: Use n8n execution logs for debugging

---

## Next Steps

1. ✅ [Install n8n](#1-install-n8n)
2. ✅ [Import workflows](#2-import-workflows)
3. ✅ [Configure credentials](#3-configure-credentials)
4. ✅ [Test with sample data](./examples/sample-excel.xlsx)
5. ✅ [Deploy to production](#deployment-options)

---

## License

Part of the BMad Method framework.

---

**Module Status:** ✅ Production Ready (n8n Edition)
**Last Updated:** 2025-10-08
**Version:** 2.0.0
