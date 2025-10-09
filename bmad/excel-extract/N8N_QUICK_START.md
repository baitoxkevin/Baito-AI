# Excel Vision Extractor - Quick Start Guide

**Time to Setup:** 15-20 minutes
**Difficulty:** Easy
**Prerequisites:** Docker or npm installed

---

## Step 1: Install n8n (5 minutes)

### Option A: Docker (Recommended) ⭐

```bash
# Create data directory
mkdir -p ~/.n8n

# Run n8n
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  -v $(pwd)/excel_imports:/data/excel_imports \
  n8nio/n8n

# Check it's running
docker ps
```

**Access n8n:** Open http://localhost:5678 in your browser

### Option B: npm

```bash
npm install n8n -g
n8n start
```

### Option C: n8n Cloud

1. Go to https://n8n.cloud
2. Sign up for free account
3. Skip to Step 2

---

## Step 2: Get Your API Keys (5 minutes)

### Gemini API Key

1. Go to https://ai.google.dev/
2. Click **Get API Key**
3. Create new API key
4. Copy the key (starts with `AIza...`)

### Supabase Credentials

1. Go to your Supabase project dashboard
2. Go to **Settings** → **API**
3. Copy:
   - Project URL (e.g., `https://abc123.supabase.co`)
   - Service Role Key (secret key)

---

## Step 3: Import Workflows (3 minutes)

1. **Download workflow files** from `bmad/excel-extract/n8n-templates/`
   - `01-full-extraction-pipeline.json`
   - `02-validation-subworkflow.json`

2. **In n8n**:
   - Click **Workflows** (left sidebar)
   - Click **Add Workflow** dropdown
   - Select **Import from File**
   - Choose `01-full-extraction-pipeline.json`
   - Click **Import**

3. **Repeat** for validation subworkflow

---

## Step 4: Configure Credentials (5 minutes)

### Gemini API Credential

1. In n8n, go to **Credentials** (left sidebar)
2. Click **Add Credential**
3. Search for **"Header Auth"**
4. Fill in:
   - **Name:** `Gemini API Key`
   - **Header Name:** `x-goog-api-key`
   - **Header Value:** `YOUR_GEMINI_API_KEY`
5. Click **Save**

### Supabase Credential

1. Click **Add Credential** again
2. Search for **"Supabase API"**
3. Fill in:
   - **Name:** `Supabase Account`
   - **Host:** `https://your-project.supabase.co`
   - **Service Role Key:** `YOUR_SUPABASE_SERVICE_KEY`
4. Click **Save**

### Google Sheets (Optional)

For flagged records review:

1. Click **Add Credential**
2. Search for **"Google Sheets OAuth2 API"**
3. Follow the OAuth2 setup wizard
4. Authorize your Google account

---

## Step 5: Configure Workflow Nodes (3 minutes)

### Open "Excel Vision Extraction Pipeline" Workflow

1. Click on the workflow name
2. Update these nodes:

#### Node: "Read Excel File"
- Set your Excel file path
- Default: `/data/excel_imports/{{ $json.file_name }}`

#### Node: "Call Gemini Vision API"
- Select credential: `Gemini API Key`
- URL is already configured

#### Node: "Insert to Supabase"
- Select credential: `Supabase Account`
- Table: `candidates` (must exist in your Supabase)
- Columns: Mapped automatically

#### Node: "Save to Review Sheet" (Optional)
- Select credential: `Google Sheets Account`
- Select your Google Sheet for flagged records

---

## Step 6: Activate Workflow (1 minute)

1. Click the **Activate** toggle (top right) - it should turn green
2. Copy the webhook URL shown (e.g., `http://localhost:5678/webhook/excel-extract`)
3. Done! Your workflow is live 🎉

---

## Step 7: Test the Workflow (3 minutes)

### Prepare Test Data

Create a test Excel file: `test-data.xlsx`

| fullname | ic | bank | bank_no | project_name | wages | ot | total_payment |
|----------|-----|------|---------|--------------|-------|-----|---------------|
| Ahmad Abdullah | 900101-01-1234 | Maybank | 1234567890 | Concert Setup | 150 | 30 | 180 |

Save to `/data/excel_imports/test-data.xlsx`

### Test via curl

```bash
curl -X POST http://localhost:5678/webhook/excel-extract \
  -H "Content-Type: application/json" \
  -d '{
    "file_name": "test-data.xlsx",
    "file_path": "/data/excel_imports/test-data.xlsx",
    "sheets": ["Sheet1"]
  }'
```

### Expected Response

```json
{
  "success": true,
  "message": "Extraction complete",
  "records_processed": 1,
  "records_imported": 1,
  "records_flagged": 0,
  "timestamp": "2025-10-08T14:30:00Z"
}
```

### Check Execution in n8n

1. Go to **Executions** tab in n8n
2. Click on the latest execution
3. See the data flow through each node
4. Green = success, Red = error

---

## Troubleshooting

### ❌ Workflow not triggering

**Problem:** Webhook returns 404

**Solution:**
- Check workflow is **Activated** (toggle is green)
- Verify webhook URL is correct
- Try refreshing the workflow

### ❌ Gemini API error

**Problem:** `401 Unauthorized` or `403 Forbidden`

**Solution:**
- Verify API key is correct in credentials
- Check you haven't exceeded free tier quota
- Test API key: `curl -H "x-goog-api-key: YOUR_KEY" https://generativelanguage.googleapis.com/v1beta/models`

### ❌ Supabase connection error

**Problem:** Can't insert to database

**Solution:**
- Verify Supabase URL and key
- Check table `candidates` exists
- Review Row Level Security (RLS) policies
- Test connection in Supabase node

### ❌ Excel file not found

**Problem:** `File not found` error

**Solution:**
- Verify file path is correct
- Check Docker volume mounting: `-v $(pwd)/excel_imports:/data/excel_imports`
- Use absolute paths

---

## Next Steps

### Process Real Data

1. Place your Excel files in `/data/excel_imports/`
2. Trigger workflow with actual file paths
3. Review validation reports
4. Check imported data in Supabase

### Schedule Automatic Processing

1. Open workflow in n8n
2. **Delete** Webhook Trigger node
3. **Add** Cron Trigger node
4. Set schedule:
   - Daily at 2 AM: `0 2 * * *`
   - Every Monday: `0 9 * * 1`
5. Configure file path to process
6. **Activate** workflow

### Monitor & Maintain

- **Executions Tab**: View all workflow runs
- **Execution Details**: Click any run to see data flow
- **Error Logs**: Red nodes show errors with details
- **Webhook History**: Track all webhook calls

---

## Production Deployment

### Option 1: Self-Hosted (Docker Compose)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=your_secure_password
      - N8N_HOST=your-domain.com
      - N8N_PROTOCOL=https
      - NODE_ENV=production
    volumes:
      - ./n8n_data:/home/node/.n8n
      - ./excel_imports:/data/excel_imports
```

Run:
```bash
docker-compose up -d
```

### Option 2: n8n Cloud

1. Export your workflows (JSON files)
2. Sign up for n8n Cloud
3. Import workflows
4. Configure credentials
5. Activate workflows

---

## Advanced Configuration

### Add Email Notifications

1. Add **Email Send** node after Webhook Response
2. Configure SMTP settings
3. Send validation reports via email

### Integrate with Slack

1. Add **Slack** node
2. Post notifications to channel
3. Include summary statistics

### Add Error Handling

1. Create new workflow: "Error Handler"
2. Use **Error Trigger** node
3. Log errors to database or send alerts

---

## Performance Optimization

### Rate Limiting

Gemini API has rate limits. Current configuration:
- 15-second delay between API calls
- Max 4 calls per minute

To adjust:
1. Find "Rate Limit (15s)" node
2. Change wait time (10-30 seconds recommended)

### Parallel Processing

To process multiple sheets in parallel:
1. Use **Split In Batches** node
2. Process batches concurrently
3. Careful: May hit rate limits faster

### Batch Size

Adjust Supabase batch size:
1. Open "Insert to Supabase" node
2. Modify batch size (default: 50)
3. Larger = faster but more error-prone

---

## Security Best Practices

1. **Use HTTPS** in production
2. **Enable Basic Auth** on n8n
3. **Rotate API keys** regularly
4. **Use webhook secrets** for authentication
5. **Restrict Supabase RLS** policies
6. **Backup workflows** regularly (export JSON)

---

## Support Resources

- **n8n Docs**: https://docs.n8n.io/
- **n8n Community**: https://community.n8n.io/
- **Gemini API Docs**: https://ai.google.dev/docs
- **Supabase Docs**: https://supabase.com/docs

---

## Summary Checklist

Setup Complete When:

- [ ] n8n installed and accessible
- [ ] Workflows imported successfully
- [ ] Gemini API credential configured
- [ ] Supabase credential configured
- [ ] Workflow nodes updated with your settings
- [ ] Workflow activated (green toggle)
- [ ] Test execution successful
- [ ] Data appears in Supabase

---

**Estimated Total Time:** 15-20 minutes
**Status:** ✅ Ready to Process Excel Files!

**Next:** Place your Excel files in `/data/excel_imports/` and trigger the workflow!
