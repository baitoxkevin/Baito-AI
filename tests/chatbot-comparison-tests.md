# Chatbot Comparison Tests: New User Scenarios

This document contains realistic test scenarios from a new SaaS user's perspective, comparing current vs. enhanced chatbot responses.

---

## Test Scenarios (Non-Technical, New User Questions)

### Test 1: First-Time User - Confused About Capabilities
**User Type:** Brand new user who just signed up
**Question:** "What can you do?"

**Expected Enhancement:**
- Current: Generic list of features
- Enhanced: Contextual, helpful introduction with examples

---

### Test 2: Vague Query - Looking for Help
**User Type:** User who doesn't know the terminology
**Question:** "I need some people for my event"

**Expected Enhancement:**
- Current: Asks for clarification
- Enhanced: Proactively guides user through what information is needed

---

### Test 3: Ambiguous Reference - "My Stuff"
**User Type:** User using casual language
**Question:** "Show me my stuff"

**Expected Enhancement:**
- Current: Confused, asks what "stuff" means
- Enhanced: Offers specific options (projects, candidates, schedules)

---

### Test 4: Job Posting Paste
**User Type:** User who found a job ad and wants to post it
**Question:**
```
Need promoters urgently!

Coca-Cola Roadshow
📅 Nov 20-22, 2024
⏰ 9am to 7pm
📍 Sunway Pyramid Mall
💰 RM18 per hour
✅ Must be friendly and outgoing
✅ English + Bahasa Malaysia required

Contact us to apply!
```

**Expected Enhancement:**
- Current: Asks if project exists
- Enhanced: Immediately recognizes job posting and offers to create it

---

### Test 5: Natural Language Date Query
**User Type:** User asking about near-future events
**Question:** "What's happening this weekend?"

**Expected Enhancement:**
- Current: May not understand "this weekend"
- Enhanced: Calculates exact dates and shows weekend projects

---

### Test 6: Confused About Data
**User Type:** User looking for something but using wrong term
**Question:** "Where are my employees?"

**Expected Enhancement:**
- Current: Says doesn't have employee data
- Enhanced: Clarifies they might mean "candidates" or "assigned staff"

---

### Test 7: Multi-Step Request
**User Type:** User who wants to do multiple things at once
**Question:** "I want to create a new event and find 5 people to work it"

**Expected Enhancement:**
- Current: Handles one step at a time
- Enhanced: Recognizes multi-step intent, asks for details upfront

---

### Test 8: Unclear Time Reference
**User Type:** User asking about past/future without specifics
**Question:** "Show me what we did last month"

**Expected Enhancement:**
- Current: May ask for specific dates
- Enhanced: Calculates last month's date range automatically

---

### Test 9: Out of Scope - But Related
**User Type:** User asking something system can't do
**Question:** "Can you send invoices to my clients?"

**Expected Enhancement:**
- Current: Says "no"
- Enhanced: Explains limitations, suggests what IS possible (payment reports, staff costs, etc.)

---

### Test 10: Follow-Up Context Test
**Conversation:**
```
User: "Show me events for Samsung"
Bot: [Lists 2 Samsung events]
User: "Are they fully staffed?"
```

**Expected Enhancement:**
- Current: May lose context, asks which events
- Enhanced: Understands "they" = Samsung events just shown

---

## Test Execution Instructions

### Setup

1. Ensure Docker is running
2. Get your Supabase project URL and anon key
3. Have OpenRouter API key configured

### Run Tests

```bash
# Set variables
PROJECT_URL="https://aoiwrdzlichescqgnohi.supabase.co"
ANON_KEY="YOUR_ANON_KEY_HERE"

# Test function (helper)
test_chatbot() {
  local endpoint=$1
  local question=$2
  local test_name=$3

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📝 TEST: $test_name"
  echo "❓ Question: $question"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  curl -s -X POST "${PROJECT_URL}/functions/v1/${endpoint}" \
    -H "Content-Type: application/json" \
    -d "{\"message\": \"$question\"}" | jq -r '.reply'

  echo ""
  echo ""
}

# Run all tests
echo "🤖 TESTING CURRENT CHATBOT"
echo "════════════════════════════════════════"
echo ""

test_chatbot "ai-chat" "What can you do?" "Test 1: Capabilities"
test_chatbot "ai-chat" "I need some people for my event" "Test 2: Vague Query"
test_chatbot "ai-chat" "Show me my stuff" "Test 3: Ambiguous Reference"
test_chatbot "ai-chat" "What's happening this weekend?" "Test 5: Date Query"
test_chatbot "ai-chat" "Where are my employees?" "Test 6: Wrong Terminology"
test_chatbot "ai-chat" "Can you send invoices to my clients?" "Test 9: Out of Scope"

echo ""
echo "════════════════════════════════════════"
echo "🧠 TESTING ENHANCED CHATBOT (with Reasoning)"
echo "════════════════════════════════════════"
echo ""

test_chatbot "ai-chat-poc-reasoning-v2" "What can you do?" "Test 1: Capabilities"
test_chatbot "ai-chat-poc-reasoning-v2" "I need some people for my event" "Test 2: Vague Query"
test_chatbot "ai-chat-poc-reasoning-v2" "Show me my stuff" "Test 3: Ambiguous Reference"
test_chatbot "ai-chat-poc-reasoning-v2" "What's happening this weekend?" "Test 5: Date Query"
test_chatbot "ai-chat-poc-reasoning-v2" "Where are my employees?" "Test 6: Wrong Terminology"
test_chatbot "ai-chat-poc-reasoning-v2" "Can you send invoices to my clients?" "Test 9: Out of Scope"
```

### Save Results

```bash
# Run tests and save to file
bash test-chatbots.sh > results/test-results-$(date +%Y%m%d-%H%M%S).txt
```

---

## Scoring Criteria

Rate each response on a scale of 1-5:

| Score | Criteria |
|-------|----------|
| **5** | Perfect - Exactly what user needs, helpful and proactive |
| **4** | Good - Addresses question well, minor improvements possible |
| **3** | Acceptable - Answers question but could be clearer/more helpful |
| **2** | Poor - Confusing, requires multiple follow-ups |
| **1** | Bad - Doesn't understand question or gives wrong information |

### Evaluation Dimensions

1. **Understanding** - Did it correctly interpret the user's intent?
2. **Helpfulness** - Does it guide the user toward a solution?
3. **Clarity** - Is the response clear and easy to understand?
4. **Proactivity** - Does it anticipate user needs?
5. **Professionalism** - Does it sound professional yet friendly?

---

## Expected Results Summary

| Test | Current (Expected) | Enhanced (Expected) | Key Improvement |
|------|-------------------|---------------------|-----------------|
| 1. Capabilities | Generic list | Contextual examples | +Relevance |
| 2. Vague query | Asks for more info | Guides through requirements | +Proactivity |
| 3. Ambiguous | Confused | Offers specific options | +Clarity |
| 4. Job posting | Asks if exists | Immediately creates | +Intelligence |
| 5. Date query | May fail | Calculates dates | +Understanding |
| 6. Wrong term | Says no | Clarifies terminology | +Helpfulness |
| 7. Multi-step | One at a time | Handles together | +Efficiency |
| 8. Time reference | Asks for dates | Auto-calculates | +Convenience |
| 9. Out of scope | Just says no | Redirects helpfully | +User experience |
| 10. Context | Loses context | Maintains context | +Conversation flow |

**Overall Expected Improvement:** 40-60% better user satisfaction

---

## Manual Testing Checklist

Use this checklist when testing manually:

- [ ] Test 1: Capabilities question
  - [ ] Current response recorded
  - [ ] Enhanced response recorded
  - [ ] Scored both responses

- [ ] Test 2: Vague query
  - [ ] Current response recorded
  - [ ] Enhanced response recorded
  - [ ] Scored both responses

- [ ] Test 3: Ambiguous reference
  - [ ] Current response recorded
  - [ ] Enhanced response recorded
  - [ ] Scored both responses

- [ ] Test 4: Job posting recognition
  - [ ] Current response recorded
  - [ ] Enhanced response recorded
  - [ ] Scored both responses

- [ ] Test 5: Natural language dates
  - [ ] Current response recorded
  - [ ] Enhanced response recorded
  - [ ] Scored both responses

- [ ] Test 6: Wrong terminology
  - [ ] Current response recorded
  - [ ] Enhanced response recorded
  - [ ] Scored both responses

- [ ] Test 7: Multi-step request
  - [ ] Current response recorded
  - [ ] Enhanced response recorded
  - [ ] Scored both responses

- [ ] Test 8: Time references
  - [ ] Current response recorded
  - [ ] Enhanced response recorded
  - [ ] Scored both responses

- [ ] Test 9: Out of scope
  - [ ] Current response recorded
  - [ ] Enhanced response recorded
  - [ ] Scored both responses

- [ ] Test 10: Context retention
  - [ ] Current response recorded
  - [ ] Enhanced response recorded
  - [ ] Scored both responses

---

## Results Template

```
TEST: [Test Name]
Question: [User question]

CURRENT CHATBOT:
Response: [Actual response]
Score: [1-5]
Notes: [What was good/bad]

ENHANCED CHATBOT:
Response: [Actual response]
Score: [1-5]
Notes: [What was good/bad]

WINNER: [Current/Enhanced/Tie]
Improvement: [Describe key difference]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

**Next Steps After Testing:**
1. Calculate average scores for each chatbot
2. Identify specific areas of improvement
3. Decide whether to deploy enhanced version
4. Plan gradual rollout if results are positive
