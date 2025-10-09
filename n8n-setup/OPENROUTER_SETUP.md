# OpenRouter API Setup for n8n

## 🎯 Why OpenRouter?

OpenRouter gives you access to:
- ✅ **Claude 3.5 Sonnet** (best for vision + reasoning)
- ✅ **GPT-4 Vision** (fallback option)
- ✅ **Multiple providers** in one API
- ✅ **Pay-per-use** pricing (no subscriptions)
- ✅ **Better rate limits** than direct OpenAI

## 🔑 Get Your API Key

1. Go to: https://openrouter.ai/keys
2. Sign up or log in
3. Create a new API key
4. Copy the key (starts with `sk-or-v1-...`)

## 💰 Add Credits

1. Go to: https://openrouter.ai/credits
2. Add $5-10 to start (should process ~100-200 Excel sheets)
3. OpenRouter charges per token used

## 📊 Pricing (as of 2025)

| Model | Input | Output | Vision |
|-------|-------|--------|--------|
| Claude 3.5 Sonnet | $3/1M tokens | $15/1M tokens | Included |
| GPT-4 Vision | $10/1M tokens | $30/1M tokens | Included |

**Estimated cost per Excel sheet:**
- Simple sheet (1 section): ~$0.02-0.05
- Complex sheet (multiple sections): ~$0.10-0.15
- **Total for 141 sheets: ~$5-15**

## 🚀 Setup in n8n

### 1. Start n8n
```bash
n8n start
# Opens at http://localhost:5678
```

### 2. Add OpenRouter Credential

1. Click **Settings** (bottom left)
2. Click **Credentials**
3. Click **Add Credential**
4. Select **HTTP Header Auth**
5. Fill in:
   - **Name**: `openrouter_api`
   - **Header Name**: `Authorization`
   - **Header Value**: `Bearer YOUR_OPENROUTER_API_KEY`
6. Click **Create**

### 3. Import Workflow

1. Click **Workflows** (top left)
2. Click **Add workflow** → **Import from File**
3. Select: `n8n-setup/openrouter_vision_workflow.json`
4. Click **Import**

### 4. Configure Nodes

Each OpenRouter node should automatically use the `openrouter_api` credential.
Verify in each node:
- **OpenRouter - Identify Structure**
- **OpenRouter - Extract Data**
- **OpenRouter - Validate**

### 5. Activate Workflow

Toggle the switch at the top from **Inactive** to **Active**

## 🧪 Test the Setup

### Option 1: Use Test Script
```bash
# Take a screenshot of one Excel sheet first
# Then run:
node n8n-setup/test-openrouter-vision.js screenshot.png
```

### Option 2: Test in n8n UI

1. Click the **Webhook** node
2. Click **Test URL**
3. Copy the webhook URL
4. Send a test request:

```bash
# Convert image to base64
base64 -i screenshot.png > image_base64.txt

# Send request
curl -X POST http://localhost:5678/webhook-test/vision-to-excel \
  -H "Content-Type: application/json" \
  -d "{\"image\": \"data:image/png;base64,$(cat image_base64.txt)\", \"metadata\": {\"sheetName\": \"test\"}}"
```

## 🎛️ Model Selection

The workflow uses `anthropic/claude-3.5-sonnet:beta` by default.

### Alternative Models

Edit the workflow nodes to change models:

**For Vision Tasks:**
- `anthropic/claude-3.5-sonnet:beta` (recommended, best reasoning)
- `openai/gpt-4-vision-preview` (alternative)
- `google/gemini-pro-vision` (budget option)

**For Validation (no vision needed):**
- `anthropic/claude-3.5-sonnet` (fast, accurate)
- `openai/gpt-4-turbo` (alternative)
- `meta-llama/llama-3.1-70b-instruct` (budget)

To change:
1. Click the node (e.g., "OpenRouter - Identify Structure")
2. Find the `model` parameter
3. Change to your preferred model
4. Click **Execute Node** to test

## 📈 Monitor Usage

### In OpenRouter Dashboard
1. Go to: https://openrouter.ai/activity
2. View:
   - Requests made
   - Tokens used
   - Cost per request
   - Total spent

### In n8n
1. Open workflow
2. Click **Executions** (right panel)
3. View each execution's:
   - Input data
   - Output data
   - Duration
   - Any errors

## 🔧 Optimization Tips

### 1. Reduce Image Size
```python
# In excel_to_screenshots.py, reduce DPI:
python scripts/excel_to_screenshots.py --dpi 100
# Lower DPI = smaller files = less cost
```

### 2. Use Cheaper Models for Simple Sheets
Edit nodes to use different models based on complexity:
- Simple sheets → `google/gemini-pro-vision` ($0.01 vs $0.05)
- Complex sheets → `anthropic/claude-3.5-sonnet:beta`

### 3. Batch Similar Sheets
Process sheets with similar structure together to reuse context.

### 4. Enable Caching (OpenRouter Feature)
Add to HTTP headers in nodes:
```
X-OpenRouter-Cache: true
```
This caches prompts and reduces costs for similar requests.

## 🐛 Troubleshooting

### Error: "Invalid API key"
```bash
# Check your API key
echo $OPENROUTER_API_KEY

# Re-add credential in n8n
# Settings → Credentials → Delete old → Add new
```

### Error: "Insufficient credits"
```bash
# Add credits at: https://openrouter.ai/credits
```

### Error: "Rate limit exceeded"
```bash
# Add delays between requests in batch script
# Edit n8n-setup/batch-process-screenshots.js
# Change: const DELAY_MS = 2000 → 5000
```

### Response is cut off
```bash
# Increase max tokens in workflow
# Add to bodyParameters:
"max_tokens": 4000  # Default is usually 1024
```

### Vision not working
```bash
# Ensure image is base64 encoded with data URI:
"data:image/png;base64,iVBORw0KGg..."

# Check image size < 20MB
# If larger, resize before sending
```

## 🎯 Workflow Comparison

| Feature | OpenRouter | OpenAI Direct | Google AI |
|---------|-----------|---------------|-----------|
| Vision API | ✅ Multiple models | ✅ GPT-4V only | ✅ Gemini only |
| Rate Limits | Higher | Lower | Medium |
| Cost | Variable | Fixed | Low |
| Setup | API key only | API key only | API key + project |
| Models | 50+ options | 5-10 | 3-5 |

## 💡 Best Practices

### 1. Start Small
- Test with 5-10 sheets first
- Verify prompts work well
- Check extraction accuracy
- Then scale to all 141 sheets

### 2. Monitor Costs
- Check OpenRouter dashboard after every batch
- If costs are high, optimize prompts or switch models

### 3. Handle Errors Gracefully
- Save failed sheets separately
- Re-run with different prompts
- Manual review for edge cases

### 4. Version Your Prompts
- Keep a log of prompt changes
- Track which prompts work best
- Revert if accuracy drops

## 📊 Expected Performance

Based on your session summary (141 sheets, 1,428 records):

| Metric | Estimate |
|--------|----------|
| Processing Time | 1.5-2 hours |
| API Calls | ~423 (3 per sheet) |
| Total Tokens | ~5-10M |
| Total Cost | $8-15 |
| Accuracy | >90% |
| Manual Review | <10% of records |

## 🚀 Ready to Go!

Your setup is complete when:
- ✅ OpenRouter API key added
- ✅ Credits loaded ($5-10)
- ✅ n8n workflow imported
- ✅ Credentials configured
- ✅ Test extraction successful

**Start processing:**
```bash
# Generate screenshots
python scripts/excel_to_screenshots.py --input "excel_imports/*.xlsx" --output excel_screenshots/

# Batch process
node n8n-setup/batch-process-screenshots.js excel_screenshots/
```

---

**Questions? Check:**
- OpenRouter Docs: https://openrouter.ai/docs
- n8n Docs: https://docs.n8n.io/
- This project's README: n8n-setup/README.md
