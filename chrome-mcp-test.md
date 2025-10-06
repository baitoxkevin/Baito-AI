# Chrome DevTools MCP Testing Plan

## Using Chrome DevTools MCP for Automated Testing

Instead of Puppeteer, we'll use the built-in Chrome DevTools MCP tools that are already configured!

---

## Available MCP Tools

✅ `mcp__chrome-devtools__list_pages` - List open tabs
✅ `mcp__chrome-devtools__navigate_page` - Navigate to URL
✅ `mcp__chrome-devtools__fill` - Fill input fields
✅ `mcp__chrome-devtools__fill_form` - Fill entire forms
✅ `mcp__chrome-devtools__click` - Click elements
✅ `mcp__chrome-devtools__wait_for` - Wait for elements
✅ `mcp__chrome-devtools__take_screenshot` - Capture screenshots
✅ `mcp__chrome-devtools__take_snapshot` - Get page snapshot
✅ `mcp__chrome-devtools__list_console_messages` - Check console
✅ `mcp__chrome-devtools__new_page` - Open new tab

---

## Testing Strategy with Chrome MCP

### Phase 1: Setup (One-time)
1. Open Chrome browser manually
2. Navigate to http://localhost:5173
3. Login to your account
4. Open chatbot widget
5. Keep browser open

### Phase 2: Automated Testing (Loop)
For each test:
1. Use MCP to fill chatbot input with query
2. Click send button
3. Wait for response
4. Take snapshot to capture result
5. Analyze response
6. Record pass/fail
7. Next test

---

## Test Execution Plan

### Test Batch 1: Category 1 Remaining (8 tests)
```
Test 1.8: "What's starting this month?"
Test 1.9: "Who has a car?"
Test 1.10: "Tell me about the MrDIY project"
Test 1.11: "Show me people with forklift skills"
Test 1.12: "What was revenue last month?"
Test 1.13: "Show me high priority projects"
Test 1.14: "Which projects need more staff?"
Test 1.15: "Who is available next Friday?"
```

### Test Batch 2: Category 2 Complex (15 tests)
```
Test 2.1: "Show active high-priority projects starting this month"
Test 2.2: "Find candidates with forklift AND warehouse who have vehicles"
... (continue with all 15)
```

### Test Batch 3-7: Remaining categories
Continue systematically through all 100 tests

---

## How I'll Execute Each Test

### For Each Test Query:
1. **Fill chatbot input** with test query
2. **Click send button** to submit
3. **Wait 3-5 seconds** for AI response
4. **Take snapshot** to capture the conversation
5. **Analyze response** for:
   - Did AI respond?
   - Was tool used?
   - Response makes sense?
6. **Record result** (PASS/FAIL)
7. **Move to next test**

---

## Advantages of Chrome MCP vs Puppeteer

✅ **Already configured** - No installation needed
✅ **Visual feedback** - See browser in real-time
✅ **Easy debugging** - Can pause and inspect
✅ **Integrated** - Part of Claude Code ecosystem
✅ **Screenshots** - Can capture each test result
✅ **No auth issues** - Use real browser session

---

## Ready to Start!

I'll now proceed to:
1. List available Chrome pages
2. Navigate to your app (if needed)
3. Start testing with MCP tools
4. Loop through all 100 test scenarios

Let me begin! 🚀
