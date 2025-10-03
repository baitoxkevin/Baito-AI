#!/bin/bash

API_URL="https://aoiwrdzlichescqgnohi.supabase.co/functions/v1/ai-chat"
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvaXdyZHpsaWNoZXNjcWdub2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyNTM2NDgsImV4cCI6MjA1NTgyOTY0OH0.F505FnCo_hg6_LpEZ-yvNWd5Zw5OnCnGxIogP4txeCY"
USER_ID="00000000-0000-0000-0000-000000000001"

# Test function
test_query() {
    local query="$1"
    local test_name="$2"

    echo "===== $test_name ====="
    echo "Query: $query"
    echo ""

    response=$(curl -s -X POST "$API_URL" \
      -H "Authorization: Bearer $API_KEY" \
      -H "Content-Type: application/json" \
      -d "{\"userId\":\"$USER_ID\",\"message\":\"$query\"}")

    echo "Response:"
    echo "$response" | jq -r '.reply // .error // .' 2>/dev/null || echo "$response"
    echo ""
    echo "----------------------------------------"
    echo ""
}

# Test 1.1
test_query "How many projects do we have?" "Test 1.1: Project Count"

# Test 1.2
test_query "Show me all active projects" "Test 1.2: Active Projects"

# Test 1.3
test_query "List all candidates" "Test 1.3: All Candidates"

# Test 1.4
test_query "What's our total revenue?" "Test 1.4: Total Revenue"

# Test 1.5
test_query "Check for scheduling conflicts this week" "Test 1.5: Scheduling Conflicts"
