# Chrome MCP Testing - Restart Prompt

**Date Created:** October 4, 2025
**Purpose:** Resume automated testing of AI chatbot using Chrome DevTools MCP
**Status:** Ready to execute after Chrome MCP is enabled

---

## What To Tell Claude After Restart

Copy and paste this exact prompt when you restart:

```
Continue with automated AI chatbot testing using Chrome DevTools MCP.
Run all 100 test scenarios from QUICK_TEST_COMMANDS.md and record
results in LIVE_TEST_RESULTS.md. We've already completed 10/100 tests
manually. Use Chrome MCP tools to automate the remaining 90 tests.

Start from Test 1.8: "What's starting this month?"

Use this workflow:
1. List available Chrome pages
2. Navigate to http://localhost:5173 if needed
3. For each test query:
   - Fill chatbot input with query
   - Click send button
   - Wait for response
   - Take snapshot/screenshot
   - Analyze response for pass/fail
   - Record result
4. Generate final intelligence score report
5. Update AI_CHATBOT_100_TEST_SCENARIOS.md with results

Target: 90/100 tests passing (90% score, Grade A)
```

---

## Background Context

### Testing Progress
- **Completed:** 10/100 tests (100% pass rate)
- **Remaining:** 90 tests
- **Current Score:** 73/100
- **Target Score:** 90/100

### What Was Done
1. ✅ Fixed 4 critical bugs in AI chatbot
2. ✅ Deployed fixes to production
3. ✅ Created comprehensive testing system (15+ docs)
4. ✅ Built automated test scripts
5. ✅ Completed 10 manual tests successfully

### What's Next
- Use Chrome DevTools MCP to automate remaining 90 tests
- Fix any bugs discovered
- Calculate final intelligence score
- Get production approval

---

## Test Files You'll Need

### 1. Test Queries
**File:** `QUICK_TEST_COMMANDS.md`
- Contains all 100 test queries ready to use
- Start from Test 1.8 onwards

### 2. Results Tracker
**File:** `LIVE_TEST_RESULTS.md`
- Track pass/fail for each test
- Record tool usage and responses

### 3. Test Categories

**Category 1: Basic (15 tests)** - 10/15 done
- Remaining: Tests 1.8-1.15 (8 tests)

**Category 2: Complex Filtering (15 tests)** - 0/15 done
- All 15 tests pending

**Category 3: Multi-Step Reasoning (10 tests)** - 0/10 done
- All 10 tests pending

**Category 4: Context Awareness (15 tests)** - 2/15 done
- Remaining: Tests 4.4-4.15 (12 tests)

**Categories 5-7 (48 tests)** - 0/48 done
- Category 5: Data Analysis (10 tests)
- Category 6: Error Handling (12 tests)
- Category 7: Advanced Intelligence (13 tests)
- Category 8-10: Additional scenarios (13 tests)

---

## Chrome MCP Tools to Use

### Available Tools
```javascript
mcp__chrome-devtools__list_pages()
mcp__chrome-devtools__navigate_page({ url: "http://localhost:5173" })
mcp__chrome-devtools__fill({ selector: "textarea", value: "query here" })
mcp__chrome-devtools__click({ selector: "button[type=submit]" })
mcp__chrome-devtools__wait_for({ selector: ".message-content", timeout: 15000 })
mcp__chrome-devtools__take_snapshot()
mcp__chrome-devtools__take_screenshot()
mcp__chrome-devtools__list_console_messages()
```

### Testing Loop Pattern
```javascript
for each test in QUICK_TEST_COMMANDS.md:
  1. Fill chatbot input: mcp__chrome-devtools__fill()
  2. Click send: mcp__chrome-devtools__click()
  3. Wait for response: mcp__chrome-devtools__wait_for()
  4. Capture result: mcp__chrome-devtools__take_snapshot()
  5. Analyze response (check for errors, verify tool usage)
  6. Record pass/fail in LIVE_TEST_RESULTS.md
  7. Move to next test
```

---

## Expected Behavior

### What Claude Should Do
1. **Check Chrome connection** - Use `mcp__chrome-devtools__list_pages()`
2. **Navigate to app** - Open http://localhost:5173 if needed
3. **Login check** - Verify user is logged in
4. **Open chatbot** - Click chatbot widget if not open
5. **Loop through tests** - Execute all 90 remaining tests
6. **Record results** - Update LIVE_TEST_RESULTS.md after each test
7. **Generate report** - Create final intelligence score report
8. **Fix bugs** - If any tests fail, analyze and fix issues
9. **Re-test** - Run failed tests again after fixes

### Success Criteria
- ✅ ≥90 tests passing (90%)
- ✅ Intelligence score ≥90/100
- ✅ All critical bugs fixed
- ✅ Production ready

---

## Quick Reference

### Dev Server
```bash
npm run dev
# App runs at: http://localhost:5173
```

### Test Progress Tracking
- Update LIVE_TEST_RESULTS.md in real-time
- Mark each test as ✅ PASS or ❌ FAIL
- Record tool used and response quality

### Bug Fixes
If bugs found:
1. Record in LIVE_TEST_RESULTS.md
2. Fix in `supabase/functions/ai-chat/index.ts`
3. Deploy: `supabase functions deploy ai-chat`
4. Re-test to verify fix

---

## Important Notes

### Already Fixed Bugs (Don't retest these issues)
1. ✅ `has_vehicle` parameter - Working
2. ✅ Date logic "happening" vs "starting" - Fixed
3. ✅ Skills array filtering - Implemented
4. ✅ Understaffed project filter - Working

### Test Environment
- **Supabase URL:** https://aoiwrdzlichescqgnohi.supabase.co
- **Edge Function:** ai-chat
- **Database:** PostgreSQL with real project/candidate data

### Intelligence Score Dimensions (Each /10)
1. Query Understanding
2. Tool Selection
3. Parameter Accuracy
4. Context Awareness
5. Multi-Step Reasoning
6. Error Handling
7. Response Quality
8. Business Value
9. Proactive Intelligence
10. Advanced Features

**Current:** 73/100 → **Target:** 90/100

---

## After Testing Complete

### Final Deliverables
1. **Updated LIVE_TEST_RESULTS.md** - All 100 tests marked
2. **Intelligence Score Report** - Final score calculation
3. **Bug Fix Summary** - Any new bugs found and fixed
4. **Production Approval** - If score ≥90/100

### Next Steps
- Deploy any final bug fixes
- Update AI_CHATBOT_100_TEST_SCENARIOS.md
- Mark chatbot as production-ready
- Celebrate! 🎉

---

## Troubleshooting

### If Chrome MCP Not Working
**Error:** "No such tool available: mcp__chrome-devtools__*"

**Solution:** Chrome MCP needs to be configured in Claude Code settings:
```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-chrome-devtools"]
    }
  }
}
```

**Location:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

### If Dev Server Not Running
```bash
npm run dev
```

### If Login Required
Make sure you're logged into the app at http://localhost:5173 before testing

---

## Ready to Start!

**Everything is prepared:**
- ✅ All test scenarios defined
- ✅ Testing infrastructure ready
- ✅ Bug fixes deployed
- ✅ Documentation complete
- ✅ Chrome MCP tools identified

**Just paste the prompt above when you restart Claude Code and testing will begin automatically!**

🚀 **Let's complete all 100 tests and get that A grade!**
