# ✅ POC v2 Deployed! Ready to Test

**Status:** 🟢 POC v2 Successfully Deployed
**Endpoint:** `https://aoiwrdzlichescqgnohi.supabase.co/functions/v1/ai-chat-poc-reasoning-v2`
**Date:** October 15, 2025

---

## Quick Test Commands

Copy and paste these commands into your terminal to see the comparison:

### Test 1: "What can you do?" (New User Asking About Capabilities)

**Enhanced Chatbot:**
```bash
curl -X POST 'https://aoiwrdzlichescqgnohi.supabase.co/functions/v1/ai-chat-poc-reasoning-v2' \
  -H 'Content-Type: application/json' \
  -d '{"message": "What can you do?", "reasoningEffort": "medium", "showReasoning": false}' | jq -r '.reply'
```

---

### Test 2: "I need some people for my event" (Vague Query)

**Enhanced Chatbot:**
```bash
curl -X POST 'https://aoiwrdzlichescqgnohi.supabase.co/functions/v1/ai-chat-poc-reasoning-v2' \
  -H 'Content-Type: application/json' \
  -d '{"message": "I need some people for my event", "reasoningEffort": "medium"}' | jq -r '.reply'
```

---

### Test 3: "Show me my stuff" (Ambiguous Reference)

**Enhanced Chatbot:**
```bash
curl -X POST 'https://aoiwrdzlichescqgnohi.supabase.co/functions/v1/ai-chat-poc-reasoning-v2' \
  -H 'Content-Type: application/json' \
  -d '{"message": "Show me my stuff", "reasoningEffort": "medium"}' | jq -r '.reply'
```

---

### Test 4: Job Posting Recognition

**Enhanced Chatbot:**
```bash
curl -X POST 'https://aoiwrdzlichescqgnohi.supabase.co/functions/v1/ai-chat-poc-reasoning-v2' \
  -H 'Content-Type: application/json' \
  -d '{"message": "Need 8 waiters for wedding dinner. Dec 5th, 2024, 6pm-11pm. Grand Hyatt KL. RM20/hour. Must have experience.", "reasoningEffort": "high"}' | jq -r '.reply'
```

---

### Test 5: "Where are my employees?" (Wrong Terminology)

**Enhanced Chatbot:**
```bash
curl -X POST 'https://aoiwrdzlichescqgnohi.supabase.co/functions/v1/ai-chat-poc-reasoning-v2' \
  -H 'Content-Type: application/json' \
  -d '{"message": "Where are my employees?", "reasoningEffort": "medium"}' | jq -r '.reply'
```

---

### Test 6: "Can you send invoices to my clients?" (Out of Scope)

**Enhanced Chatbot:**
```bash
curl -X POST 'https://aoiwrdzlichescqgnohi.supabase.co/functions/v1/ai-chat-poc-reasoning-v2' \
  -H 'Content-Type: application/json' \
  -d '{"message": "Can you send invoices to my clients?", "reasoningEffort": "medium"}' | jq -r '.reply'
```

---

### Test 7: "What's happening this weekend?" (Natural Date Query)

**Enhanced Chatbot:**
```bash
curl -X POST 'https://aoiwrdzlichescqgnohi.supabase.co/functions/v1/ai-chat-poc-reasoning-v2' \
  -H 'Content-Type: application/json' \
  -d '{"message": "What is happening this weekend?", "reasoningEffort": "medium"}' | jq -r '.reply'
```

---

## Web UI Testing

You can also test through your browser console:

```javascript
// Test enhanced chatbot
fetch('https://aoiwrdzlichescqgnohi.supabase.co/functions/v1/ai-chat-poc-reasoning-v2', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    message: "What can you do?",
    reasoningEffort: "medium",
    showReasoning: true  // Set to true to see the reasoning process
  })
})
.then(r => r.json())
.then(data => {
  console.log('🧠 REASONING:', data.reasoning)
  console.log('💬 RESPONSE:', data.reply)
  console.log('📊 TOKENS:', data.metadata)
})
```

---

## Comparison Testing

To compare with your current chatbot, you'll need authorization:

**Current Chatbot (requires auth):**
```bash
curl -X POST 'https://aoiwrdzlichescqgnohi.supabase.co/functions/v1/ai-chat' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"message": "What can you do?"}' | jq -r '.reply'
```

Replace `YOUR_ANON_KEY` with your Supabase anon key from:
```bash
# Get anon key
cat ~/.supabase/config.toml | grep anon_key
```

Or from Supabase Dashboard → Settings → API

---

## Test Results Template

Use this template to record your findings:

```markdown
### Test: [Test Name]
**Question:** "[User question]"

**Enhanced Response:**
[Paste response here]

**Score (1-5):** [ /5]

**Notes:**
- Understanding: [How well did it understand?]
- Helpfulness: [Was it helpful?]
- Clarity: [Was it clear?]
- Proactivity: [Did it anticipate needs?]
- Overall: [General impression]

**Key Improvement vs Current:**
[What's better?]
```

---

## Expected Improvements to Look For

When testing, watch for these improvements:

✅ **Better Ambiguity Handling**
- Asks clarifying questions with specific options
- Doesn't make assumptions
- Guides user to right answer

✅ **Proactive Recognition**
- Recognizes job postings immediately
- Offers to create projects without asking
- Multi-step workflows in one interaction

✅ **Context Awareness**
- Understands "my stuff" = projects/candidates
- Recognizes "employees" might mean "candidates"
- Maintains conversation context

✅ **Helpful Redirections**
- Out-of-scope queries get helpful alternatives
- Professional explanations of limitations
- Suggests relevant features

✅ **Natural Language Understanding**
- "this weekend" → calculates exact dates
- "last month" → auto-calculates date range
- Handles casual, non-technical language

---

## Quick Start (3 Steps)

1. **Test one query** - Start with "What can you do?"
2. **Compare** - Notice how it's more helpful and specific
3. **Test more** - Try ambiguous queries to see the difference

**Run this now:**
```bash
curl -X POST 'https://aoiwrdzlichescqgnohi.supabase.co/functions/v1/ai-chat-poc-reasoning-v2' \
  -H 'Content-Type: application/json' \
  -d '{"message": "What can you do?"}' | jq -r '.reply'
```

---

## Metadata / Performance

The enhanced chatbot returns metadata showing reasoning performance:

```json
{
  "reply": "...",
  "metadata": {
    "model": "anthropic/claude-3.7-sonnet",
    "reasoningTokens": 487,
    "responseTokens": 312,
    "totalTokens": 799,
    "totalTime": 1853,
    "timestamp": "2025-10-15T..."
  }
}
```

**Key Metrics:**
- `reasoningTokens`: How much "thinking" was done
- `totalTime`: Response time in milliseconds
- `totalTokens`: Total cost (reasoning + response)

---

## Reasoning Levels

You can control how much the chatbot "thinks":

- **low** (`reasoningEffort: "low"`): Quick responses, simple queries
- **medium** (`reasoningEffort: "medium"`): Balanced (recommended)
- **high** (`reasoningEffort: "high"`): Deep thinking, complex queries

**Example:**
```bash
# Simple query - use low
curl -X POST '...' -d '{"message": "show me projects", "reasoningEffort": "low"}'

# Complex query - use high
curl -X POST '...' -d '{"message": "I need 20 staff for a 3-day tech conference...", "reasoningEffort": "high"}'
```

---

## See The Reasoning (Debug Mode)

To see how the chatbot thinks:

```bash
curl -X POST 'https://aoiwrdzlichescqgnohi.supabase.co/functions/v1/ai-chat-poc-reasoning-v2' \
  -H 'Content-Type: application/json' \
  -d '{"message": "Show me my stuff", "showReasoning": true}' | jq '.'
```

This will show the internal reasoning process in the response.

---

## Next Steps

1. ✅ **Test the commands above**
   See the improvements firsthand

2. ✅ **Record your observations**
   Note what's better, what's different

3. ✅ **Compare with current**
   Test same questions on current chatbot

4. ✅ **Make decision**
   Deploy if results are clearly better

---

## Need Help?

**Troubleshooting:**
- If `jq` not installed: Remove `| jq -r '.reply'` from commands
- If curl fails: Try from browser console instead
- If no response: Check Supabase logs

**Check logs:**
```bash
supabase functions logs ai-chat-poc-reasoning-v2 --tail
```

**Dashboard:**
https://supabase.com/dashboard/project/aoiwrdzlichescqgnohi/functions

---

**🚀 Start testing now! Copy the first command and see the difference.**
