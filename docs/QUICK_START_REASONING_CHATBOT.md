# Quick Start: Testing the Enhanced Reasoning Chatbot

This guide helps you quickly test the new reasoning-enhanced chatbot POC against your current implementation.

---

## 1. Deploy the POC

```bash
cd /Users/baito.kevin/Downloads/dev/BMAD-METHOD/Baito/Baito-AI

# Deploy the POC function
supabase functions deploy ai-chat-poc-reasoning

# Verify deployment
supabase functions list
```

You should see `ai-chat-poc-reasoning` in the list.

---

## 2. Test with Sample Queries

### Test 1: Ambiguous Query

**Test the CURRENT chatbot:**
```bash
curl -X POST 'https://aoiwrdzlichescqgnohi.supabase.co/functions/v1/ai-chat' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"message": "what is in my warehouse"}'
```

**Test the ENHANCED chatbot:**
```bash
curl -X POST 'https://aoiwrdzlichescqgnohi.supabase.co/functions/v1/ai-chat-poc-reasoning' \
  -H 'Content-Type: application/json' \
  -d '{"message": "what is in my warehouse", "showReasoning": true}'
```

**Compare the responses.** The enhanced version should:
- ✅ Acknowledge ambiguity
- ✅ Offer multiple interpretations
- ✅ Provide helpful examples

---

### Test 2: Job Posting Recognition

**Test the CURRENT chatbot:**
```bash
curl -X POST 'https://aoiwrdzlichescqgnohi.supabase.co/functions/v1/ai-chat' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "Looking for 10 promoters for Samsung product launch Date: December 15-17, 2024 Time: 10am - 6pm Location: Mid Valley Mall Pay: RM15/hour Must speak Mandarin"
  }'
```

**Test the ENHANCED chatbot:**
```bash
curl -X POST 'https://aoiwrdzlichescqgnohi.supabase.co/functions/v1/ai-chat-poc-reasoning' \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "Looking for 10 promoters for Samsung product launch Date: December 15-17, 2024 Time: 10am - 6pm Location: Mid Valley Mall Pay: RM15/hour Must speak Mandarin",
    "showReasoning": true
  }'
```

**Compare the responses.** The enhanced version should:
- ✅ Recognize this as a job posting
- ✅ Offer to create the project immediately
- ✅ Be more proactive

---

### Test 3: Out of Scope Query

**Test both chatbots:**
```bash
# Current
curl -X POST 'https://aoiwrdzlichescqgnohi.supabase.co/functions/v1/ai-chat' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"message": "What is the weather forecast for this weekend?"}'

# Enhanced
curl -X POST 'https://aoiwrdzlichescqgnohi.supabase.co/functions/v1/ai-chat-poc-reasoning' \
  -H 'Content-Type: application/json' \
  -d '{"message": "What is the weather forecast for this weekend?"}'
```

**Compare the responses.** The enhanced version should:
- ✅ Politely explain limitations
- ✅ Offer relevant alternatives
- ✅ Maintain engagement

---

## 3. Frontend Testing (Web UI)

### Option A: Quick Test in Browser Console

1. Open your Baito-AI web app
2. Open browser console (F12)
3. Run this test:

```javascript
// Test current chatbot
fetch('https://aoiwrdzlichescqgnohi.supabase.co/functions/v1/ai-chat', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ANON_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: "what is in my warehouse"
  })
})
.then(r => r.json())
.then(data => console.log('CURRENT:', data))

// Test enhanced chatbot
fetch('https://aoiwrdzlichescqgnohi.supabase.co/functions/v1/ai-chat-poc-reasoning', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: "what is in my warehouse",
    showReasoning: true
  })
})
.then(r => r.json())
.then(data => console.log('ENHANCED:', data))
```

### Option B: Temporary UI Toggle

Add a toggle in your ChatWidget to switch between current and POC:

```typescript
// In src/components/ai-assistant/ChatWidget.tsx

const [usePOC, setUsePOC] = useState(false)

const sendMessage = async (message: string) => {
  const endpoint = usePOC
    ? '/functions/v1/ai-chat-poc-reasoning'
    : '/functions/v1/ai-chat'

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  })

  // ... rest of code
}

// Add toggle button in UI
<button onClick={() => setUsePOC(!usePOC)}>
  {usePOC ? '🧠 Enhanced' : '⚡ Current'}
</button>
```

---

## 4. Collect Metrics

### Response Quality Scorecard

Test 10-20 queries and score each response:

| Query | Current Score (1-5) | Enhanced Score (1-5) | Winner |
|-------|---------------------|----------------------|--------|
| "what is in my warehouse" | | | |
| "Looking for 10 promoters..." | | | |
| "Show me all" (context test) | | | |
| "What's the weather?" | | | |
| ... | | | |

**Scoring Criteria:**
- 5 = Perfect response, exactly what user needs
- 4 = Good response, minor improvements possible
- 3 = Acceptable, but could be better
- 2 = Poor, missing key information or unhelpful
- 1 = Completely wrong or useless

### Performance Metrics

Compare response times and token usage:

```bash
# Use this script to collect metrics
for i in {1..10}; do
  echo "Test $i:"

  # Current
  time curl -X POST 'https://aoiwrdzlichescqgnohi.supabase.co/functions/v1/ai-chat' \
    -H 'Authorization: Bearer YOUR_ANON_KEY' \
    -H 'Content-Type: application/json' \
    -d '{"message": "show me active projects"}'

  # Enhanced
  time curl -X POST 'https://aoiwrdzlichescqgnohi.supabase.co/functions/v1/ai-chat-poc-reasoning' \
    -H 'Content-Type: application/json' \
    -d '{"message": "show me active projects"}'
done
```

---

## 5. A/B Test with Real Users (Optional)

If you want to test with real users:

### Setup

1. **Deploy both functions to production**
2. **Randomly assign users to variants**

```typescript
// In ChatWidget.tsx
const getUserVariant = (userId: string) => {
  // Simple hash-based assignment
  const hash = userId.charCodeAt(0) % 2
  return hash === 0 ? 'current' : 'enhanced'
}

const variant = getUserVariant(currentUser.id)
const endpoint = variant === 'enhanced'
  ? '/functions/v1/ai-chat-poc-reasoning'
  : '/functions/v1/ai-chat'
```

3. **Track user satisfaction**

```typescript
// Add feedback buttons after each response
<div className="flex gap-2">
  <button onClick={() => ratResponse(messageId, 'positive')}>
    👍 Helpful
  </button>
  <button onClick={() => ratResponse(messageId, 'negative')}>
    👎 Not helpful
  </button>
</div>
```

4. **Analyze after 1-2 weeks**

```sql
-- Check satisfaction rates
SELECT
  variant,
  COUNT(*) as total_interactions,
  SUM(CASE WHEN rating = 'positive' THEN 1 ELSE 0 END) as positive_ratings,
  ROUND(100.0 * SUM(CASE WHEN rating = 'positive' THEN 1 ELSE 0 END) / COUNT(*), 2) as satisfaction_rate
FROM ai_feedback
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY variant;
```

---

## 6. Decision Matrix

Use this to decide whether to deploy the enhanced version:

| Criteria | Weight | Current | Enhanced | Winner |
|----------|--------|---------|----------|--------|
| **Response Quality** | 40% | ___ / 5 | ___ / 5 | |
| **Context Understanding** | 25% | ___ / 5 | ___ / 5 | |
| **User Satisfaction** | 20% | ___ / 5 | ___ / 5 | |
| **Response Time** | 10% | ___ / 5 | ___ / 5 | |
| **Cost** | 5% | ___ / 5 | ___ / 5 | |

**Scoring:**
- Response Quality: How well does it answer questions?
- Context Understanding: Does it maintain conversation context?
- User Satisfaction: Would users prefer this version?
- Response Time: Is it fast enough? (5 = <1s, 4 = <2s, 3 = <3s)
- Cost: Is it within budget? (5 = same cost, 4 = +50%, 3 = +100%)

**Formula:**
```
Total Score = (Response Quality × 0.40) +
              (Context Understanding × 0.25) +
              (User Satisfaction × 0.20) +
              (Response Time × 0.10) +
              (Cost × 0.05)
```

**Decision:**
- Enhanced score > Current score by 0.5+ points → **Deploy Enhanced**
- Enhanced score ≈ Current score → **More testing needed**
- Current score > Enhanced score → **Stick with Current, iterate on Enhanced**

---

## 7. Rollout Plan (If Enhanced Wins)

### Phase 1: Shadow Mode (Week 1)
- Run both in parallel
- Log all responses for comparison
- No user-facing changes

### Phase 2: Beta Testing (Week 2-3)
- Enable for 10-20% of users
- Collect feedback actively
- Monitor error rates

### Phase 3: Gradual Rollout (Week 4)
- 25% → 50% → 75% → 100%
- Monitor metrics at each stage
- Keep rollback capability

### Phase 4: Full Deployment (Week 5+)
- Migrate all users to enhanced version
- Deprecate old endpoint
- Monitor for regressions

---

## 8. Troubleshooting

### Issue: POC returns 500 error
**Solution:**
```bash
# Check function logs
supabase functions logs ai-chat-poc-reasoning --tail

# Verify OPENROUTER_API_KEY is set
supabase secrets list

# Set if missing
supabase secrets set OPENROUTER_API_KEY=your_key_here
```

### Issue: Response is slow (>5 seconds)
**Possible causes:**
- OpenRouter rate limiting
- Network latency
- Model is busy

**Solution:**
- Implement caching for common queries
- Use faster model for simple queries
- Add timeout handling

### Issue: Reasoning seems off
**Solution:**
- Review reasoning output with `showReasoning: true`
- Adjust system prompt
- Try different temperature settings
- Collect more examples for fine-tuning

---

## 9. Quick Reference

### API Endpoints

```bash
# Current chatbot
POST https://aoiwrdzlichescqgnohi.supabase.co/functions/v1/ai-chat
Body: { "message": "query", "conversationId": "optional" }

# Enhanced chatbot POC
POST https://aoiwrdzlichescqgnohi.supabase.co/functions/v1/ai-chat-poc-reasoning
Body: { "message": "query", "showReasoning": false }
```

### Response Format

```typescript
// Current
{
  reply: string
  conversationId: string
  messageId: string
  toolsUsed?: string[]
}

// Enhanced POC
{
  reply: string
  reasoning?: string // Only if showReasoning: true
  metadata: {
    reasoningTokens: number
    responseTokens: number
    totalTime: number
    timestamp: string
  }
}
```

---

## 10. Next Steps After Testing

1. **If results are positive:**
   - Proceed with Phase 1 implementation (Enhanced System Prompt)
   - Follow the roadmap in `AI_CHATBOT_REASONING_UPGRADE.md`
   - Consider migrating to Claude Extended Thinking or o1

2. **If results are mixed:**
   - Identify specific weaknesses
   - Iterate on system prompt
   - Test with more diverse queries

3. **If results are negative:**
   - Review comparison document
   - Adjust reasoning framework
   - Consider alternative approaches

---

**Need Help?**
- Review: `docs/AI_CHATBOT_REASONING_UPGRADE.md` for detailed implementation plan
- Compare: `docs/AI_CHATBOT_COMPARISON.md` for side-by-side examples
- Code: `supabase/functions/ai-chat-poc-reasoning/index.ts` for POC implementation

**Happy Testing! 🚀**
