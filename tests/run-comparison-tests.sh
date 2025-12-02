#!/bin/bash

# ==========================================
# Chatbot Comparison Test Script
# ==========================================
# Tests current vs enhanced chatbot with realistic new user questions

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_URL="https://aoiwrdzlichescqgnohi.supabase.co"
CURRENT_ENDPOINT="ai-chat"
ENHANCED_ENDPOINT="ai-chat-poc-reasoning-v2"

# Results directory
RESULTS_DIR="./results"
mkdir -p "$RESULTS_DIR"
RESULTS_FILE="$RESULTS_DIR/test-results-$(date +%Y%m%d-%H%M%S).md"

# Test questions (new user, non-technical)
declare -a TESTS=(
  "Test 1: Capabilities|What can you do?"
  "Test 2: Vague Query|I need some people for my event"
  "Test 3: Ambiguous Reference|Show me my stuff"
  "Test 4: Natural Date Query|What's happening this weekend?"
  "Test 5: Wrong Terminology|Where are my employees?"
  "Test 6: Out of Scope|Can you send invoices to my clients?"
  "Test 7: Multi-Step Request|I want to create a new event and find 5 people to work it"
  "Test 8: Past Time Reference|Show me what we did last month"
  "Test 9: Confused New User|I'm not sure how to start"
  "Test 10: Job Posting|Need 8 waiters for wedding dinner. Dec 5th, 2024, 6pm-11pm. Grand Hyatt KL. RM20/hour. Must have experience."
)

# Initialize results file
cat > "$RESULTS_FILE" << 'EOF'
# Chatbot Comparison Test Results
**Date:** $(date)
**Tests:** New User Scenarios (Non-Technical)

---

EOF

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Chatbot Comparison Tests - New User Scenarios    ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo ""
echo -e "📊 Running ${#TESTS[@]} test scenarios..."
echo -e "📝 Results will be saved to: ${RESULTS_FILE}"
echo ""

# Function to test a chatbot
test_chatbot() {
  local endpoint=$1
  local question=$2
  local show_reasoning=$3

  local payload
  if [ "$show_reasoning" = "true" ]; then
    payload=$(jq -n --arg msg "$question" '{message: $msg, showReasoning: true, reasoningEffort: "medium"}')
  else
    payload=$(jq -n --arg msg "$question" '{message: $msg}')
  fi

  response=$(curl -s -X POST "${PROJECT_URL}/functions/v1/${endpoint}" \
    -H "Content-Type: application/json" \
    -d "$payload")

  # Extract reply (handle both response formats)
  reply=$(echo "$response" | jq -r '.reply // .error // "No response"')

  # Extract metadata if available
  reasoning_tokens=$(echo "$response" | jq -r '.metadata.reasoningTokens // "N/A"')
  total_time=$(echo "$response" | jq -r '.metadata.totalTime // "N/A"')

  echo "$reply"

  # Return metadata for logging
  echo "METADATA: tokens=$reasoning_tokens, time=$total_time" >&2
}

# Run tests
test_number=1
for test in "${TESTS[@]}"; do
  IFS='|' read -r test_name question <<< "$test"

  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${YELLOW}📝 ${test_name}${NC}"
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "❓ Question: ${question}"
  echo ""

  # Write to results file
  cat >> "$RESULTS_FILE" << EOF

## ${test_name}

**Question:** \`${question}\`

EOF

  # Test CURRENT chatbot
  echo -e "${RED}🤖 Current Chatbot:${NC}"
  current_response=$(test_chatbot "$CURRENT_ENDPOINT" "$question" "false" 2>&1)
  current_reply=$(echo "$current_response" | grep -v "METADATA:")
  current_meta=$(echo "$current_response" | grep "METADATA:" | tail -1)

  echo "$current_reply"
  echo ""

  # Write to results file
  cat >> "$RESULTS_FILE" << EOF
### 🔴 Current Chatbot

\`\`\`
${current_reply}
\`\`\`

EOF

  # Small delay to avoid rate limiting
  sleep 1

  # Test ENHANCED chatbot
  echo -e "${GREEN}🧠 Enhanced Chatbot (with Reasoning):${NC}"
  enhanced_response=$(test_chatbot "$ENHANCED_ENDPOINT" "$question" "true" 2>&1)
  enhanced_reply=$(echo "$enhanced_response" | grep -v "METADATA:")
  enhanced_meta=$(echo "$enhanced_response" | grep "METADATA:" | tail -1)

  echo "$enhanced_reply"
  echo ""

  # Write to results file
  cat >> "$RESULTS_FILE" << EOF
### 🟢 Enhanced Chatbot

\`\`\`
${enhanced_reply}
\`\`\`

**Metadata:** ${enhanced_meta}

---

**Score (1-5):**
- Current: [ /5]
- Enhanced: [ /5]
- Winner: [ ]

**Key Improvement:** [Your notes here]

---

EOF

  echo ""
  test_number=$((test_number + 1))

  # Delay between tests
  sleep 2
done

# Summary
cat >> "$RESULTS_FILE" << 'EOF'

## Summary

### Overall Scores

| Test | Current | Enhanced | Winner | Key Improvement |
|------|---------|----------|--------|-----------------|
| Test 1 | /5 | /5 | | |
| Test 2 | /5 | /5 | | |
| Test 3 | /5 | /5 | | |
| Test 4 | /5 | /5 | | |
| Test 5 | /5 | /5 | | |
| Test 6 | /5 | /5 | | |
| Test 7 | /5 | /5 | | |
| Test 8 | /5 | /5 | | |
| Test 9 | /5 | /5 | | |
| Test 10 | /5 | /5 | | |

**Average Score:**
- Current: [ /5]
- Enhanced: [ /5]
- Improvement: [ %]

### Recommendation

- [ ] Deploy Enhanced Version
- [ ] Need More Testing
- [ ] Stick with Current

**Reasoning:**
[Your decision reasoning here]

EOF

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              Tests Complete!                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "✅ All tests completed!"
echo -e "📄 Results saved to: ${GREEN}${RESULTS_FILE}${NC}"
echo ""
echo -e "Next steps:"
echo -e "1. Review the results file"
echo -e "2. Score each response (1-5)"
echo -e "3. Calculate average scores"
echo -e "4. Make deployment decision"
echo ""
echo -e "To view results:"
echo -e "  ${BLUE}cat ${RESULTS_FILE}${NC}"
echo ""
