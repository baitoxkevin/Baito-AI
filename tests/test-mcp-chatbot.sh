#!/bin/bash

# ==========================================
# MCP-Enhanced Chatbot Quick Test Script
# ==========================================
# Tests basic functionality of the MCP chatbot

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENDPOINT="https://aoiwrdzlichescqgnohi.supabase.co/functions/v1/ai-chat-mcp-enhanced"
USER_ID="test-user-$(date +%s)" # Generate unique test user ID

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     MCP-Enhanced Chatbot Quick Test Suite          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "🔧 Endpoint: ${ENDPOINT}"
echo -e "👤 Test User ID: ${USER_ID}"
echo ""

# Test 1: Basic Read Query
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📝 Test 1: Basic Read Query${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "❓ Query: Show me all projects"
echo ""

response=$(curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"Show me all projects\",
    \"userId\": \"$USER_ID\",
    \"reasoningEffort\": \"low\"
  }")

reply=$(echo "$response" | jq -r '.reply // "Error: No reply"')
error=$(echo "$response" | jq -r '.error // "none"')

if [ "$error" != "none" ]; then
  echo -e "${RED}❌ Test 1 FAILED${NC}"
  echo -e "${RED}Error: $error${NC}"
else
  echo -e "${GREEN}✅ Test 1 PASSED${NC}"
  echo -e "Response: ${reply:0:200}..."
fi
echo ""
sleep 2

# Test 2: Security - Block DELETE
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📝 Test 2: Security - Block DELETE${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "❓ Query: Delete all old projects"
echo ""

response=$(curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"Delete all old projects from 2023\",
    \"userId\": \"$USER_ID\",
    \"reasoningEffort\": \"low\"
  }")

reply=$(echo "$response" | jq -r '.reply // "Error: No reply"')

if echo "$reply" | grep -q "DELETE operations are not allowed"; then
  echo -e "${GREEN}✅ Test 2 PASSED${NC}"
  echo -e "DELETE operation was correctly blocked"
else
  echo -e "${RED}❌ Test 2 FAILED${NC}"
  echo -e "DELETE operation was not blocked properly"
  echo -e "Response: $reply"
fi
echo ""
sleep 2

# Test 3: Reasoning Metadata
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📝 Test 3: Reasoning & Metadata${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "❓ Query: What can you do?"
echo ""

response=$(curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"What can you do?\",
    \"userId\": \"$USER_ID\",
    \"reasoningEffort\": \"medium\",
    \"showReasoning\": true
  }")

reasoning_tokens=$(echo "$response" | jq -r '.metadata.reasoningTokens // 0')
mcp_enabled=$(echo "$response" | jq -r '.metadata.mcpEnabled // false')
tool_calls=$(echo "$response" | jq -r '.metadata.toolCallsCount // 0')

if [ "$reasoning_tokens" -gt 0 ] && [ "$mcp_enabled" = "true" ]; then
  echo -e "${GREEN}✅ Test 3 PASSED${NC}"
  echo -e "🧠 Reasoning tokens: $reasoning_tokens"
  echo -e "🔧 MCP enabled: $mcp_enabled"
  echo -e "🛠️  Tool calls: $tool_calls"
else
  echo -e "${RED}❌ Test 3 FAILED${NC}"
  echo -e "Reasoning or MCP not working as expected"
fi
echo ""
sleep 2

# Test 4: List Tables (MCP Tool)
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📝 Test 4: List Tables (MCP Tool)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "❓ Query: What tables are in the database?"
echo ""

response=$(curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"What tables are in the database?\",
    \"userId\": \"$USER_ID\",
    \"reasoningEffort\": \"low\"
  }")

reply=$(echo "$response" | jq -r '.reply // "Error: No reply"')

if echo "$reply" | grep -q -i "projects\|candidates\|tables"; then
  echo -e "${GREEN}✅ Test 4 PASSED${NC}"
  echo -e "MCP tool successfully listed tables"
else
  echo -e "${RED}❌ Test 4 FAILED${NC}"
  echo -e "Could not list tables"
fi
echo ""
sleep 2

# Test 5: Conversation History
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📝 Test 5: Conversation History${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "❓ Query: Remember my first question?"
echo ""

response=$(curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"What was my first question?\",
    \"userId\": \"$USER_ID\",
    \"reasoningEffort\": \"low\"
  }")

reply=$(echo "$response" | jq -r '.reply // "Error: No reply"')
conversation_id=$(echo "$response" | jq -r '.conversationId // "none"')

if [ "$conversation_id" != "none" ]; then
  echo -e "${GREEN}✅ Test 5 PASSED${NC}"
  echo -e "Conversation ID: $conversation_id"
else
  echo -e "${YELLOW}⚠️  Test 5 WARNING${NC}"
  echo -e "Conversation history may not be working"
fi
echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              Tests Complete!                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "✅ All basic tests completed"
echo -e "📊 Check detailed results above"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "1. Review the test results"
echo -e "2. Check audit logs: SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 20;"
echo -e "3. Test complex use cases from MCP_CHATBOT_TESTING_GUIDE.md"
echo -e "4. Compare with POC v2 for same questions"
echo ""
echo -e "📄 Full testing guide: tests/MCP_CHATBOT_TESTING_GUIDE.md"
echo ""
