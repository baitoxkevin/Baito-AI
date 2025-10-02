# Receipt OCR Service Comparison

## 🎯 Summary

You now have **TWO OCR implementations** available:

| Feature | OpenRouter Grok-4-Fast | Google Gemini 1.5 Flash |
|---------|----------------------|------------------------|
| **Cost** | **FREE** ✅ | $0.00016/receipt (or FREE tier) |
| **Privacy** | ⚠️ Data may train models | ✅ Private |
| **Vision Support** | ✅ Yes | ✅ Yes |
| **Context Window** | 2M tokens | 1M tokens |
| **Setup** | OpenRouter API key | Gemini API key |
| **Rate Limits** | Unknown (likely exists) | 1,500 requests/day (free) |

---

## 🔧 Implementation Files

### Option 1: OpenRouter (FREE)
```typescript
// /src/lib/receipt-ocr-openrouter.ts
import { analyzeReceiptWithOpenRouter } from '@/lib/receipt-ocr-openrouter';

const result = await analyzeReceiptWithOpenRouter(imageFile);
```

**Environment Variable:**
```bash
VITE_OPENROUTER_API_KEY=sk-or-v1-xxxxx
```

**Get Key:** https://openrouter.ai/keys

### Option 2: Google Gemini (Private)
```typescript
// /src/lib/receipt-ocr-service.ts
import { analyzeReceiptImage } from '@/lib/receipt-ocr-service';

const result = await analyzeReceiptImage(imageFile);
```

**Environment Variable:**
```bash
VITE_GEMINI_API_KEY=AIzaSyxxxxx
```

**Get Key:** https://makersuite.google.com/app/apikey

---

## 📊 Detailed Comparison

### Privacy Considerations

#### OpenRouter Grok-4-Fast:
```
⚠️ WARNING: Data Usage Policy

"Prompts and completions may be used by xAI/OpenRouter
to improve future models"

This means:
- Your receipt images might be used for model training
- Receipt data (vendor, amount, etc.) might be stored
- Not suitable for confidential business receipts
```

#### Google Gemini:
```
✅ Private

Google Gemini API does not use your API queries
(prompts and responses) for model training.

Source: https://ai.google.dev/gemini-api/terms
```

---

## 🎯 Use Case Recommendations

### Use OpenRouter IF:
- ✅ Testing/development environment
- ✅ Non-sensitive personal receipts
- ✅ Want completely free solution
- ✅ Don't mind data being used for training

### Use Gemini IF:
- ✅ Production environment
- ✅ Business/confidential receipts
- ✅ Privacy is important
- ✅ Willing to pay ~$0.016 per 100 receipts (or use free tier)

---

## 🚀 Hybrid Approach (Recommended)

Use **both services** with automatic fallback:

```typescript
// /src/lib/receipt-ocr-hybrid.ts
import { analyzeReceiptWithOpenRouter } from './receipt-ocr-openrouter';
import { analyzeReceiptImage } from './receipt-ocr-service';

export async function analyzeReceipt(
  imageFile: File,
  usePrivate: boolean = false
) {
  // Use Gemini for private/sensitive receipts
  if (usePrivate) {
    return analyzeReceiptImage(imageFile);
  }

  // Try OpenRouter first (free)
  const openRouterResult = await analyzeReceiptWithOpenRouter(imageFile);

  if (openRouterResult.success) {
    return openRouterResult;
  }

  // Fallback to Gemini if OpenRouter fails
  console.log('OpenRouter failed, falling back to Gemini');
  return analyzeReceiptImage(imageFile);
}
```

---

## 💡 Implementation Examples

### Example 1: Expense Claim Form with Toggle

```typescript
import { analyzeReceiptWithOpenRouter } from '@/lib/receipt-ocr-openrouter';
import { analyzeReceiptImage } from '@/lib/receipt-ocr-service';

function ExpenseClaimForm() {
  const [usePrivateOCR, setUsePrivateOCR] = useState(false);

  const handlePasteReceipt = async (e: React.ClipboardEvent) => {
    const file = getImageFromClipboard(e);
    if (!file) return;

    setAnalyzing(true);

    const result = usePrivateOCR
      ? await analyzeReceiptImage(file)      // Gemini (private)
      : await analyzeReceiptWithOpenRouter(file); // OpenRouter (free)

    if (result.success && result.data) {
      // Populate form...
    }

    setAnalyzing(false);
  };

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={usePrivateOCR}
          onChange={e => setUsePrivateOCR(e.target.checked)}
        />
        Use private OCR (Gemini)
      </label>

      <div onPaste={handlePasteReceipt}>
        {/* Rest of form */}
      </div>
    </div>
  );
}
```

### Example 2: Automatic Fallback

```typescript
async function smartReceiptAnalysis(imageFile: File) {
  // Try free option first
  let result = await analyzeReceiptWithOpenRouter(imageFile);

  if (!result.success) {
    // Fallback to Gemini
    result = await analyzeReceiptImage(imageFile);
  }

  return result;
}
```

---

## 📈 Cost Projections

### Scenario: 1,000 receipts/month

| Service | Monthly Cost | Annual Cost | Privacy |
|---------|-------------|-------------|---------|
| **OpenRouter Only** | **$0.00** | **$0.00** | ⚠️ Data may be used |
| **Gemini Only** | $0.16 | $1.92 | ✅ Private |
| **Hybrid (90% OpenRouter)** | $0.016 | $0.19 | Mixed |

---

## ⚙️ Configuration

### Step 1: Add Both API Keys

```bash
# .env
VITE_OPENROUTER_API_KEY=sk-or-v1-xxxxx
VITE_GEMINI_API_KEY=AIzaSyxxxxx
```

### Step 2: Choose Your Strategy

#### Strategy A: OpenRouter by Default
```typescript
// Use free OpenRouter, fallback to Gemini
import { analyzeReceiptWithOpenRouter } from '@/lib/receipt-ocr-openrouter';
```

#### Strategy B: Gemini by Default
```typescript
// Use private Gemini
import { analyzeReceiptImage } from '@/lib/receipt-ocr-service';
```

#### Strategy C: User Choice
```typescript
// Let users choose (toggle in UI)
const service = userPreference === 'private'
  ? analyzeReceiptImage
  : analyzeReceiptWithOpenRouter;
```

---

## 🔒 Privacy Recommendations

### For Personal Use:
- OpenRouter is fine ✅

### For Business Use:
- Use Gemini (private) ✅
- Or implement PII detection before using OpenRouter

### For Healthcare/Finance:
- **ONLY use Gemini** (private) ⚠️
- Never use OpenRouter for sensitive data

---

## 📚 API Documentation

- **OpenRouter Docs:** https://openrouter.ai/docs
- **Gemini API Docs:** https://ai.google.dev/docs
- **OpenRouter Models:** https://openrouter.ai/models

---

## 🐛 Troubleshooting

### OpenRouter Issues:

**Error: "No response from API"**
- Check API key is correct
- Verify rate limits not exceeded
- Try again in a few minutes

**Error: "Invalid image format"**
- Ensure image is JPEG, PNG, or WebP
- Check file size < 5MB

### Gemini Issues:

**Error: "API key not configured"**
- Add `VITE_GEMINI_API_KEY` to `.env`
- Restart dev server

**Error: "Quota exceeded"**
- Wait for rate limit reset (15 requests/minute)
- Or upgrade to paid tier

---

## 🎉 Conclusion

**Best Practice:**

1. **Development:** Use OpenRouter (free)
2. **Production (non-sensitive):** Use OpenRouter (free)
3. **Production (sensitive):** Use Gemini (private, ~$0.0002/receipt)

You now have **two excellent options** with automatic fallback! 🚀
