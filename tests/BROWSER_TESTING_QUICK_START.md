# 🎯 MCP Chatbot - Browser Testing Quick Start

**Status:** ✅ Ready to Test
**Time Required:** 5 minutes

---

## 🚀 Method 1: Visual Test Page (Recommended)

### Step 1: Open the Test Page

The test page has already been opened in Chrome for you. If it's not open:

```bash
open -a "Google Chrome" /Users/baito.kevin/Downloads/dev/BMAD-METHOD/Baito/Baito-AI/tests/mcp-chatbot-test.html
```

### Step 2: Test the Chatbot

1. **Try a simple question** - Click "Capabilities" example button or type:
   ```
   What can you do?
   ```

2. **Test database access** - Click "Read Query" example button or type:
   ```
   Show me all my active projects
   ```

3. **Test security** - Click "Security Test" example button or type:
   ```
   Delete all old projects
   ```
   - Should see: "DELETE operations are not allowed"

4. **Test job posting recognition** - Click "Job Posting" example button

### What You'll See:
- ✅ **Response** - The chatbot's reply
- 🧠 **Reasoning tokens** - How much "thinking" was done
- ⏱️ **Time** - Response time in milliseconds
- 🔄 **Iterations** - Number of thinking steps
- 🛠️ **Tool calls** - Database operations performed

---

## 🖥️ Method 2: Chrome Console (Advanced)

For developers who want to see detailed logs and test programmatically.

### Step 1: Open Chrome Console

1. Open any webpage (or the test page above)
2. Press **F12** (or **Cmd+Option+I** on Mac)
3. Click the **Console** tab

### Step 2: Load Test Script

Copy and paste the entire contents of `tests/browser-console-test.js` into the console and press Enter.

Or, if you have the test page open, you can skip this step as it's already loaded.

### Step 3: Run Tests

```javascript
// Run individual tests
await test1_Capabilities()
await test2_ReadQuery()
await test3_SecurityTest()
await test4_JobPosting()
await test5_ListTables()
await test6_ComplexQuery()

// Or run all tests at once
await runAllTests()

// Or test with custom message
await testMCPChatbot("Find me Mandarin speakers")
```

### What You'll See:
```
🚀 Testing MCP Chatbot
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 Message: What can you do?
👤 User ID: test-user-browser
🧠 Reasoning: medium
✅ Response received in 1842 ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 Reply:
I can help you manage your Baito-AI staffing platform...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Metadata:
┌─────────────────┬──────────────────────────────────────┐
│ model           │ google/gemini-2.5-flash-preview-...  │
│ reasoningTokens │ 487                                   │
│ totalTime       │ 1842                                  │
│ iterations      │ 1                                     │
│ toolCallsCount  │ 0                                     │
│ mcpEnabled      │ true                                  │
└─────────────────┴──────────────────────────────────────┘
```

---

## 🧪 Quick Test Scenarios

### Test 1: Capabilities
**Message:** "What can you do?"
**Expected:** Lists chatbot capabilities (query, create, update)
**Time:** ~2 seconds

### Test 2: Read Query
**Message:** "Show me all my active projects"
**Expected:** Executes SELECT query, returns project list
**Tool Used:** execute_sql
**Time:** ~2-3 seconds

### Test 3: Security Test
**Message:** "Delete all old projects"
**Expected:** Blocks DELETE operation with error message
**Tool Used:** None (blocked before execution)
**Time:** ~1 second

### Test 4: Job Posting
**Message:** "Need 8 waiters for wedding dinner. Dec 5th, 6pm-11pm. Grand Hyatt KL. RM20/hour."
**Expected:**
1. Recognizes job posting
2. Creates project with INSERT
3. Finds matching candidates
4. Suggests assignments
**Tool Used:** execute_sql (multiple times)
**Time:** ~5-10 seconds

### Test 5: List Tables
**Message:** "What tables are in the database?"
**Expected:** Lists all database tables
**Tool Used:** list_tables or execute_sql
**Time:** ~2-3 seconds

### Test 6: Complex Query
**Message:** "Find me all Mandarin-speaking candidates who are available"
**Expected:** Executes complex SELECT with array matching
**Tool Used:** execute_sql
**Time:** ~3-4 seconds

---

## 📊 Verifying Results

### Check Audit Logs (Database)

After testing, verify operations were logged:

```sql
-- View recent operations
SELECT
  operation_type,
  sql_query,
  success,
  error_message,
  timestamp
FROM audit_logs
ORDER BY timestamp DESC
LIMIT 20;
```

### Check Function Logs (Supabase)

```bash
npx supabase functions logs ai-chat-mcp-enhanced --tail
```

---

## ✅ Expected Results

### What Should Work:
- ✅ Reading data (SELECT queries)
- ✅ Creating records (INSERT queries)
- ✅ Updating records (UPDATE queries)
- ✅ Listing tables (list_tables tool)
- ✅ Reasoning & metadata tracking
- ✅ Conversation history

### What Should Be Blocked:
- ❌ DELETE operations
- ❌ DROP operations
- ❌ TRUNCATE operations
- ❌ Multiple SQL statements

---

## 🎯 Success Checklist

After running tests, verify:

- [ ] Chatbot responds to simple questions
- [ ] Can query database (SELECT)
- [ ] DELETE operations are blocked
- [ ] Job postings are recognized
- [ ] Reasoning metadata is returned
- [ ] Audit logs are created
- [ ] Response time is acceptable (<5s for simple queries)

---

## 🐛 Troubleshooting

### Issue: "Missing authorization header"
**Fix:** The test page includes the anon key automatically. If using curl, add:
```bash
-H "Authorization: Bearer YOUR_ANON_KEY"
```

### Issue: "Function not found"
**Fix:** Verify function is deployed:
```bash
npx supabase functions list --project-ref aoiwrdzlichescqgnohi
```

### Issue: Slow responses (>10 seconds)
**Fix:** Reduce reasoning effort in test page dropdown: Low

### Issue: Console errors
**Fix:** Check browser console (F12) for detailed error messages

---

## 📈 Performance Benchmarks

**Target Performance:**
- Simple queries: <2 seconds ✅
- Complex workflows: <10 seconds ✅
- Security checks: <1 second ✅

**Actual Results (To Be Measured):**
- Test 1 (Capabilities): _____ ms
- Test 2 (Read Query): _____ ms
- Test 3 (Security): _____ ms
- Test 4 (Job Posting): _____ ms
- Test 5 (List Tables): _____ ms
- Test 6 (Complex Query): _____ ms

---

## 🎉 Next Steps

1. **Run the tests** using the visual test page
2. **Record your results** in the Performance Benchmarks section
3. **Check audit logs** to verify operations were logged
4. **Compare with POC v2** (reasoning-only chatbot)
5. **Test with real data** using your actual projects and candidates
6. **Deploy to production** if results are satisfactory

---

## 🆘 Need Help?

**Documentation:**
- Full testing guide: `tests/MCP_CHATBOT_TESTING_GUIDE.md`
- Implementation summary: `docs/MCP_IMPLEMENTATION_SUMMARY.md`
- Use case scenarios: `tests/mcp-use-case-scenarios.md`

**Logs:**
- Function logs: `npx supabase functions logs ai-chat-mcp-enhanced --tail`
- Database logs: `SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 50;`

**Dashboard:**
- https://supabase.com/dashboard/project/aoiwrdzlichescqgnohi/functions

---

**🚀 Start now! Open the test page in Chrome and try your first message.**
