# Excel Vision Extractor - Credentials Setup

**Your workflows are created!** Now you need to configure 3 credentials in n8n.

---

## ✅ Workflows Created

1. **Excel Vision Extraction Pipeline** (ID: `kq52BEz6475jDv9T`)
   - 13 nodes configured
   - Webhook trigger: `http://localhost:5678/webhook/excel-extract`
   - Status: Inactive (needs credentials)

2. **Validation Sub-Workflow** (ID: `blJGZN9c6PTBJA1x`)
   - 3 nodes configured
   - 7 validation rules embedded
   - Status: Inactive (ready to use once main workflow is configured)

---

## Required Credentials (3)

### 1. Gemini API Key (Required) 🔑

**Get Your API Key:**
1. Go to https://ai.google.dev/
2. Click **Get API Key** in Google AI Studio
3. Create or select a project
4. Click **Create API Key**
5. Copy the key (starts with `AIza...`)

**Configure in n8n:**
1. Open n8n at http://localhost:5678
2. Go to **Credentials** (left sidebar)
3. Click **Add Credential**
4. Search for **"Header Auth"**
5. Fill in:
   - **Credential name:** `Gemini API Key`
   - **Header Name:** `x-goog-api-key`
   - **Header Value:** `YOUR_GEMINI_API_KEY` (paste the key)
6. Click **Save**

**Used by:**
- "Call Gemini Vision API" node in main workflow

---

### 2. Supabase API (Required) 🗄️

**Get Your Credentials:**
1. Go to your Supabase project: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** (e.g., `https://aoiwrdzlichescqgnohi.supabase.co`)
   - **Service Role Key** (anon key also works, but service role is better for backend operations)

**Configure in n8n:**
1. Go to **Credentials** in n8n
2. Click **Add Credential**
3. Search for **"Supabase API"**
4. Fill in:
   - **Credential name:** `Supabase`
   - **Host:** `https://your-project.supabase.co` (your Project URL)
   - **Service Role Key:** `YOUR_SERVICE_ROLE_KEY` (paste the key)
5. Click **Save**

**Used by:**
- "Insert to Supabase" node in main workflow

**Important:** Make sure the `candidates` table exists in your Supabase database!

---

### 3. Google Sheets OAuth2 (Optional) 📊

**Only needed if you want to save flagged records to Google Sheets for review.**

**Configure in n8n:**
1. Go to **Credentials** in n8n
2. Click **Add Credential**
3. Search for **"Google Sheets OAuth2 API"**
4. Click on the credential type
5. Follow n8n's OAuth2 setup wizard:
   - You'll be redirected to Google to authorize
   - Grant n8n permission to access your sheets
6. After authorization, click **Save**

**Used by:**
- "Save Flagged to Sheet" node in main workflow

**Alternative:** You can skip this and remove the "Save Flagged to Sheet" node from the workflow if you don't need Google Sheets integration.

---

## Activate the Workflow

After configuring credentials:

1. Open the **Excel Vision Extraction Pipeline** workflow
2. Check that all nodes have credentials assigned:
   - "Call Gemini Vision API" → Gemini API Key ✅
   - "Insert to Supabase" → Supabase ✅
   - "Save Flagged to Sheet" → Google Sheets ✅ (or remove this node)
3. Click the **Activate** toggle in the top right (should turn green)
4. Copy the webhook URL shown

**Your webhook URL will be:**
```
http://localhost:5678/webhook/excel-extract
```

---

## Test the Workflow

### Quick Test with curl:

```bash
curl -X POST http://localhost:5678/webhook/excel-extract \
  -H "Content-Type: application/json" \
  -d '{
    "file_name": "test-data.xlsx",
    "file_path": "/path/to/your/test-data.xlsx",
    "sheets": ["Sheet1"]
  }'
```

### Expected Response:

```json
{
  "success": true,
  "message": "Extraction complete",
  "timestamp": "2025-10-08T14:45:00.000Z"
}
```

### Check Execution:

1. Go to **Executions** tab in n8n
2. Click on the latest execution
3. See data flow through each node
4. Green nodes = success ✅
5. Red nodes = error ❌

---

## Troubleshooting

### ❌ Workflow won't activate

**Problem:** "Please fix the errors highlighted in the workflow"

**Solution:**
- Check all nodes have required credentials
- Ensure credential names match what nodes expect
- Click on each node to see if there are errors

### ❌ Gemini API error

**Problem:** `401 Unauthorized`

**Solution:**
- Verify API key is correct in credentials
- Test key: `curl -H "x-goog-api-key: YOUR_KEY" https://generativelanguage.googleapis.com/v1beta/models`
- Check you haven't exceeded free tier quota

### ❌ Supabase connection error

**Problem:** Can't insert records

**Solution:**
- Verify Supabase URL is correct
- Verify Service Role Key is correct
- Check table `candidates` exists in your database
- Review Row Level Security (RLS) policies - service role bypasses RLS

### ❌ Google Sheets not working

**Problem:** OAuth2 authorization failed

**Solution:**
- Re-authorize in credentials
- Or skip Google Sheets - delete "Save Flagged to Sheet" node from workflow
- You can save flagged records elsewhere or skip this feature

---

## What's Next?

After credentials are configured and workflow is activated:

1. ✅ **Process Real Data**
   - Place Excel files in accessible location
   - Trigger workflow with file paths
   - Review extracted data in Supabase

2. ✅ **Monitor Executions**
   - Check n8n **Executions** tab regularly
   - Review any failed executions
   - Adjust validation rules if needed

3. ✅ **Schedule Automation** (Optional)
   - Replace Webhook Trigger with Cron Trigger
   - Set schedule (e.g., daily at 2 AM: `0 2 * * *`)
   - Process files automatically

4. ✅ **Customize**
   - Adjust validation rules in Code nodes
   - Modify Gemini prompts
   - Add email notifications
   - Connect to other services

---

## Summary

**What You Have:**
- ✅ 2 workflows created in n8n
- ✅ Complete extraction pipeline (13 nodes)
- ✅ Validation with 7 rules
- ✅ Gemini Vision API integration
- ✅ Supabase database import
- ✅ Rate limiting (15s delay)

**What You Need:**
1. Configure Gemini API Key credential
2. Configure Supabase API credential
3. (Optional) Configure Google Sheets OAuth2
4. Activate the workflow
5. Test with sample data

**Estimated Time:** 10 minutes

---

**Next Step:** Configure your credentials in n8n → Activate workflow → Test!

**n8n URL:** http://localhost:5678
