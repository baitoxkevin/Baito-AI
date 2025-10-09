# n8n Vision Extraction Agent - Quick Start Guide

## ✅ Setup Completed

1. **n8n-mcp** added to Claude Desktop config
2. **Vision extraction workflow** created

## 🚀 Installation Steps

### 1. Restart Claude Desktop
```bash
# Close Claude Desktop completely, then reopen
```

### 2. Install n8n
```bash
# Install n8n globally
npm install -g n8n

# Or run with npx (no installation needed)
npx n8n
```

### 3. Start n8n
```bash
# Start n8n server
n8n start

# Access at: http://localhost:5678
```

### 4. Import Workflow

1. Open n8n at `http://localhost:5678`
2. Click **Workflows** → **Import from File**
3. Select `vision_extraction_workflow.json`
4. Click **Save**

### 5. Configure Credentials

#### OpenAI API Key
1. Go to **Settings** → **Credentials** → **Add Credential**
2. Select **OpenAI API**
3. Enter your API key
4. Save as `openai_vision`

#### Supabase API Key
1. **Settings** → **Credentials** → **Add Credential**
2. Select **HTTP Header Auth**
3. Name: `supabaseAuth`
4. Header Name: `apikey`
5. Header Value: Your Supabase anon key from `.env`
6. Add another header:
   - Name: `Authorization`
   - Value: `Bearer YOUR_SUPABASE_ANON_KEY`

### 6. Set Environment Variables

In n8n settings, add:
```
VITE_SUPABASE_URL=https://aoiwrdzlichescqgnohi.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## 📸 Usage

### Test the Vision Extraction

1. **Activate the workflow** in n8n
2. **Get the webhook URL** (shown in the Webhook node)
3. **Send a test request**:

```bash
# Using curl
curl -X POST http://localhost:5678/webhook/vision-extract \
  -H "Content-Type: application/json" \
  -d '{
    "image": "base64_encoded_excel_screenshot_here"
  }'
```

### Or use the test script:

```bash
# Run the test script
node n8n-setup/test-vision-extraction.js
```

## 🔄 Workflow Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│ 1. VISION - Identify Structure                              │
│    • Analyzes Excel image                                   │
│    • Identifies data type (candidates/payments)             │
│    • Detects columns and row count                          │
│    • Flags issues (merged cells, etc.)                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. EXTRACT - Parse Data                                     │
│    • Extracts all rows into structured JSON                 │
│    • Handles merged cells                                   │
│    • Preserves cell relationships                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. REASONING - Map to Schema                                │
│    • Matches data to database tables                        │
│    • Maps fields to correct columns                         │
│    • Transforms data types (dates, numbers)                 │
│    • Validates data integrity                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. EXPORT - Insert to Supabase                              │
│    • Inserts data into candidates table                     │
│    • Or candidate_projects table                            │
│    • Handles relationships (candidate_id, project_id)       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. REVIEW - Validation Report                               │
│    • Verifies all inserts succeeded                         │
│    • Checks data integrity                                  │
│    • Reports issues for manual review                       │
│    • Recommends corrective actions                          │
└─────────────────────────────────────────────────────────────┘
```

## 🧪 Testing

### 1. Prepare Test Image
```bash
# Take a screenshot of your Excel file
# Save as PNG or JPG
```

### 2. Convert to Base64
```bash
# macOS
base64 -i your_excel_screenshot.png | pbcopy

# Linux
base64 your_excel_screenshot.png | xclip -selection clipboard
```

### 3. Send Test Request
```bash
curl -X POST http://localhost:5678/webhook/vision-extract \
  -H "Content-Type: application/json" \
  -d "{\"image\": \"$(base64 -i screenshot.png)\"}"
```

## 📊 Expected Response

```json
{
  "totalRows": 150,
  "successfulInserts": 148,
  "failedInserts": 2,
  "dataIntegrity": "passed",
  "issues": [
    {
      "severity": "medium",
      "description": "Row 45: Missing email address"
    },
    {
      "severity": "low",
      "description": "Row 89: Date format ambiguous (MM/DD vs DD/MM)"
    }
  ],
  "recommendedActions": [
    "Review rows 45 and 89 manually",
    "Standardize date formats in source Excel"
  ]
}
```

## 🔧 Troubleshooting

### Issue: Workflow fails at Vision node
- **Solution**: Ensure OpenAI API key is valid and has GPT-4 Vision access

### Issue: Data not inserting to Supabase
- **Solution**: Check Supabase credentials and RLS policies

### Issue: Wrong table mapping
- **Solution**: Improve schema description in "Reasoning" node prompt

## 🎯 Next Steps

1. **Test with real Excel files**
2. **Fine-tune prompts** based on extraction accuracy
3. **Add error handling** for edge cases
4. **Create batch processing** for multiple files
5. **Build UI** to trigger workflow from Baito app

## 📚 Resources

- [n8n Documentation](https://docs.n8n.io/)
- [n8n-mcp GitHub](https://github.com/czlonkowski/n8n-mcp)
- [OpenAI Vision API](https://platform.openai.com/docs/guides/vision)
- [Supabase REST API](https://supabase.com/docs/guides/api)
