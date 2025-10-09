# Excel Vision Extractor - n8n Architecture

**Module:** Excel Vision Extractor (n8n Edition)
**Version:** 2.0.0
**Created:** 2025-10-08
**Paradigm:** Workflow Automation (n8n)

---

## Architecture Overview

The Excel Vision Extractor is redesigned as a **set of n8n workflows** that automate the extraction, validation, and import of candidate data from Excel files using AI vision analysis.

### Key Difference from Claude Code Approach

**Claude Code Approach (v1.0):**
- Agents coordinate work
- Python scripts execute operations
- Manual invocation via chat

**n8n Approach (v2.0):** ✅ NEW
- Workflows automate end-to-end processes
- Node-based visual automation
- Trigger-based execution (webhook, schedule, file upload)
- No manual intervention needed

---

## n8n Workflow Architecture

### Workflow 1: Excel Extraction Pipeline (Main Workflow)

**Purpose:** Complete end-to-end extraction from Excel to Supabase

**Trigger Options:**
1. Webhook Trigger - Manual or external system calls
2. File Upload Trigger - When file uploaded to specific folder
3. Schedule Trigger - Process files daily/weekly

**Node Flow:**

```
[Webhook/Trigger]
    ↓
[Read Excel File]
(Spreadsheet File node)
    ↓
[Loop Through Sheets]
(Loop Over Items node)
    ↓
[Capture Screenshot] ←--- If needed, use external service
(HTTP Request to screenshot service)
    ↓
[Call Gemini Vision API]
(HTTP Request node)
    ↓
[Parse Vision Response]
(Code node - JavaScript/Python)
    ↓
[Extract Records]
(Code node - data transformation)
    ↓
[Validate Data]
(Code node - validation rules)
    ↓
[Split by Status]
(Switch node)
    ↓           ↓
[Passed]    [Flagged]
    ↓           ↓
[Insert to Supabase]  [Save to Review Sheet]
(Supabase node)       (Google Sheets node)
    ↓
[Send Notification]
(Email/Slack/Webhook)
```

---

## Core n8n Nodes Used

### 1. Input Nodes

#### Spreadsheet File Node
```yaml
node: "n8n-nodes-base.spreadsheetFile"
purpose: "Read Excel files (.xlsx, .xls, .csv)"

operations:
  - Read from File
  - Read as String
  - Read Raw (Binary)

configuration:
  file_path: "/data/excel_imports/{{ $json.filename }}"
  read_as: "Table"
  options:
    sheet_name: "{{ $json.sheet }}"
    header_row: 1
```

#### Google Sheets Node (Alternative)
```yaml
node: "n8n-nodes-base.googleSheets"
purpose: "Read from Google Sheets"

operations:
  - Read rows
  - Append or Update
  - Delete

use_case: |
  If users upload Excel to Google Drive,
  convert to Google Sheets for processing
```

### 2. Processing Nodes

#### HTTP Request Node (Gemini Vision API)
```yaml
node: "n8n-nodes-base.httpRequest"
purpose: "Call Gemini Vision API"

configuration:
  method: POST
  url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent"

  authentication:
    type: "Header Auth"
    name: "x-goog-api-key"
    value: "={{ $credentials.gemini_api_key }}"

  body:
    contents:
      - parts:
          - text: "{{ $json.vision_prompt }}"
          - inline_data:
              mime_type: "image/png"
              data: "={{ $binary.screenshot.data }}"

  options:
    timeout: 180000  # 3 minutes
    response:
      response_format: "json"
```

#### Code Node (Data Processing)
```yaml
node: "n8n-nodes-base.code"
purpose: "JavaScript/Python for complex logic"

mode: "Run Once for All Items"
language: "JavaScript" or "Python"

use_cases:
  - Parse Gemini API responses
  - Apply validation rules
  - Calculate confidence scores
  - Transform data structures
  - Generate reports

example_javascript: |
  // Validate payment calculations
  for (const item of $input.all()) {
    const calculated =
      item.json.wages +
      item.json.ot +
      item.json.claims;

    const valid = Math.abs(calculated - item.json.total_payment) <= 0.5;

    item.json.validation_status = valid ? 'passed' : 'flagged';
    item.json.confidence = valid ? 0.95 : 0.65;
  }

  return $input.all();
```

### 3. Control Flow Nodes

#### Loop Over Items Node
```yaml
node: "n8n-nodes-base.loop"
purpose: "Process sheets one by one"

configuration:
  loop_over: "{{ $json.sheets }}"
  batching: false

use_case: |
  Loop through each Excel sheet,
  process with rate limiting between iterations
```

#### Switch Node
```yaml
node: "n8n-nodes-base.switch"
purpose: "Route data based on conditions"

routes:
  - condition: "{{ $json.validation_status === 'passed' }}"
    output: 0  # Route to Supabase Insert

  - condition: "{{ $json.validation_status === 'flagged' }}"
    output: 1  # Route to Review Sheet

  - default:
    output: 2  # Route to Error Handler
```

#### Wait Node (Rate Limiting)
```yaml
node: "n8n-nodes-base.wait"
purpose: "Enforce Gemini API rate limits"

configuration:
  amount: 15
  unit: "seconds"

placement: "After each Gemini API call"
```

### 4. Output Nodes

#### Supabase Node
```yaml
node: "n8n-nodes-base.supabase"
purpose: "Insert/Update candidate records"

operations:
  - Insert: New records
  - Update: Existing records
  - Upsert: Insert or update

configuration:
  table: "candidates"

  columns:
    fullname: "={{ $json.fullname }}"
    ic: "={{ $json.ic }}"
    project_name: "={{ $json.project_name }}"
    total_payment: "={{ $json.total_payment }}"
    confidence: "={{ $json.confidence }}"
    source_file: "={{ $json.source_file }}"

  options:
    returning: "representation"
    conflict_resolution: "update"
```

#### Google Sheets Node (Output)
```yaml
node: "n8n-nodes-base.googleSheets"
purpose: "Save flagged records for review"

operation: "Append"

configuration:
  spreadsheet: "Flagged_Records_Review"
  sheet: "{{ $now.format('YYYY-MM-DD') }}"

  data_mode: "Auto-map"
```

---

## Workflow Designs

### Workflow 1: Full Excel Extraction Pipeline

**File:** `n8n-templates/01-full-extraction-pipeline.json`

```json
{
  "name": "Excel Vision Extraction Pipeline",
  "nodes": [
    {
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300],
      "parameters": {
        "path": "excel-extract",
        "method": "POST"
      }
    },
    {
      "name": "Read Excel File",
      "type": "n8n-nodes-base.spreadsheetFile",
      "position": [450, 300]
    },
    {
      "name": "Loop Through Sheets",
      "type": "n8n-nodes-base.loop",
      "position": [650, 300]
    },
    {
      "name": "Call Gemini Vision",
      "type": "n8n-nodes-base.httpRequest",
      "position": [850, 300],
      "parameters": {
        "url": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent",
        "method": "POST"
      }
    },
    {
      "name": "Rate Limit Wait",
      "type": "n8n-nodes-base.wait",
      "position": [1050, 300],
      "parameters": {
        "amount": 15,
        "unit": "seconds"
      }
    },
    {
      "name": "Parse & Validate",
      "type": "n8n-nodes-base.code",
      "position": [1250, 300]
    },
    {
      "name": "Route by Status",
      "type": "n8n-nodes-base.switch",
      "position": [1450, 300]
    },
    {
      "name": "Insert to Supabase",
      "type": "n8n-nodes-base.supabase",
      "position": [1650, 200],
      "parameters": {
        "operation": "insert",
        "table": "candidates"
      }
    },
    {
      "name": "Save Flagged Records",
      "type": "n8n-nodes-base.googleSheets",
      "position": [1650, 400],
      "parameters": {
        "operation": "append"
      }
    },
    {
      "name": "Send Notification",
      "type": "n8n-nodes-base.emailSend",
      "position": [1850, 300]
    }
  ],
  "connections": {
    "Webhook Trigger": { "main": [[{ "node": "Read Excel File" }]] },
    "Read Excel File": { "main": [[{ "node": "Loop Through Sheets" }]] },
    "Loop Through Sheets": { "main": [[{ "node": "Call Gemini Vision" }]] },
    "Call Gemini Vision": { "main": [[{ "node": "Rate Limit Wait" }]] },
    "Rate Limit Wait": { "main": [[{ "node": "Parse & Validate" }]] },
    "Parse & Validate": { "main": [[{ "node": "Route by Status" }]] },
    "Route by Status": {
      "main": [
        [{ "node": "Insert to Supabase" }],
        [{ "node": "Save Flagged Records" }]
      ]
    },
    "Insert to Supabase": { "main": [[{ "node": "Send Notification" }]] },
    "Save Flagged Records": { "main": [[{ "node": "Send Notification" }]] }
  }
}
```

---

### Workflow 2: Validation Sub-Workflow

**File:** `n8n-templates/02-validation-subworkflow.json`

**Purpose:** Called from main workflow to validate data

**Input:** Array of extracted records

**Output:** Records with validation status and confidence scores

**Nodes:**
1. Execute Workflow Trigger (receives data from main workflow)
2. Code Node - Apply 7 validation rules
3. Code Node - Calculate confidence scores
4. Switch Node - Route passed/flagged
5. Return results to main workflow

---

### Workflow 3: Dry-Run Import Preview

**File:** `n8n-templates/03-dry-run-import.json`

**Purpose:** Preview import without writing to Supabase

**Nodes:**
1. Webhook Trigger
2. Supabase Node - Query existing records
3. Code Node - Detect conflicts (new/update/duplicate)
4. Code Node - Generate preview report
5. Google Sheets - Save preview report
6. Webhook Response - Return report to caller

---

## Data Flow Patterns

### Pattern 1: Batch Processing with Rate Limiting

```
For each Excel file:
  For each sheet:
    - Call Gemini Vision API
    - Wait 15 seconds (rate limit)
    - Process next sheet
```

**Implementation:**
- Use Loop Over Items node
- Add Wait node after API call
- Continue automatically

### Pattern 2: Split Processing (Passed vs Flagged)

```
Parse & Validate
    ↓
[Switch Node]
    ↓           ↓
Passed      Flagged
    ↓           ↓
Supabase    Review Sheet
```

**Implementation:**
- Switch node with conditions
- Multiple output routes
- Parallel processing

### Pattern 3: Error Handling

```
Try:
  Call Gemini API
Catch (Error):
  - Log error
  - Save to error log
  - Retry (3 times)
  - If all fail: Skip sheet
```

**Implementation:**
- Set "Continue On Fail" on HTTP Request node
- Add Error Trigger workflow
- Implement retry logic in Code node

---

## Configuration & Credentials

### Required Credentials in n8n

**1. Gemini API Credentials**
```yaml
credential_type: "Header Auth"
name: "Gemini API"
header_name: "x-goog-api-key"
value: "YOUR_GEMINI_API_KEY"
```

**2. Supabase Credentials**
```yaml
credential_type: "Supabase API"
name: "Supabase"
url: "https://your-project.supabase.co"
service_role_key: "YOUR_SUPABASE_KEY"
```

**3. Google Sheets Credentials** (Optional)
```yaml
credential_type: "Google Sheets OAuth2 API"
name: "Google Sheets"
# Follow n8n OAuth2 setup wizard
```

### Environment Variables

```bash
# n8n Settings
N8N_ENCRYPTION_KEY=your_encryption_key
N8N_HOST=your-n8n-instance.com
N8N_PORT=5678

# Workflow Settings
EXCEL_IMPORT_FOLDER=/data/excel_imports
RATE_LIMIT_DELAY=15  # seconds
MAX_RETRIES=3
```

---

## Deployment Options

### Option 1: Self-Hosted n8n (Docker)

```yaml
version: '3'
services:
  n8n:
    image: n8nio/n8n:latest
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=your_password
    volumes:
      - ./n8n_data:/home/node/.n8n
      - ./excel_imports:/data/excel_imports
```

### Option 2: n8n Cloud

- Sign up at n8n.cloud
- Import workflow JSON files
- Configure credentials
- Activate workflows

### Option 3: n8n Desktop App

- Download from n8n.io
- Import workflows
- Run locally

---

## Advantages of n8n Approach

✅ **Visual Workflow Editor**
- Drag-and-drop node configuration
- Easy to understand data flow
- No coding required for basic operations

✅ **Automation**
- Trigger-based execution
- No manual invocation needed
- Scheduled processing

✅ **Error Handling**
- Built-in retry mechanisms
- Error capture and logging
- Separate error workflows

✅ **Scalability**
- Process multiple files in parallel
- Queue-based execution
- Cloud deployment options

✅ **Integration**
- 300+ pre-built nodes
- Easy to add more services
- Webhook integrations

✅ **Monitoring**
- Execution history
- Error tracking
- Performance metrics

---

## Comparison: Claude Code vs n8n

| Feature | Claude Code (v1.0) | n8n (v2.0) |
|---------|-------------------|------------|
| **Invocation** | Manual (chat) | Automated (triggers) |
| **Development** | Write Python code | Visual node config |
| **Execution** | Sequential | Parallel + Sequential |
| **Monitoring** | Manual logs | Built-in dashboard |
| **Error Handling** | Custom code | Built-in nodes |
| **Scalability** | Single-threaded | Multi-execution |
| **Learning Curve** | Medium (Python) | Low (visual) |
| **Deployment** | Local script | Self-host or cloud |
| **Maintenance** | Manual updates | Version controlled |
| **Cost** | Free (local) | Free (self-host) or paid (cloud) |

---

## Recommended Setup

**For Production:**
1. **n8n workflows** for automation
2. Trigger via webhook from file upload system
3. Google Sheets for flagged record review
4. Email notifications on completion
5. Schedule workflow for daily processing

**For Development/Testing:**
1. n8n Desktop App locally
2. Manual webhook triggers
3. Test with sample Excel files
4. Iterate on validation rules

---

## Next Steps

1. ✅ Install n8n (Docker or Desktop)
2. ✅ Create workflow templates (JSON files)
3. ✅ Configure credentials (Gemini, Supabase)
4. ✅ Import and test workflows
5. ✅ Deploy to production

---

**Documentation Status:** ✅ Architecture Complete
**Next:** Create n8n workflow JSON templates
