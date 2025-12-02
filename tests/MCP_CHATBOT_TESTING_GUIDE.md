# MCP-Enhanced Chatbot Testing Guide

**Status:** 🟢 Ready to Test
**Endpoint:** `https://aoiwrdzlichescqgnohi.supabase.co/functions/v1/ai-chat-mcp-enhanced`
**Date:** October 15, 2025

---

## 🎯 What's New?

The MCP-enhanced chatbot can now:
- ✅ **Direct Database Access** - Query any table dynamically
- ✅ **Write Operations** - INSERT and UPDATE records
- ✅ **Security Controls** - Blocks DELETE operations
- ✅ **Audit Logging** - All operations are logged
- ✅ **Native Reasoning** - Enhanced thinking capabilities

---

## 🔐 Security Features

### Implemented Controls:
1. **SQL Validation Layer**
   - ✅ Blocks DELETE operations
   - ✅ Blocks DROP operations
   - ✅ Blocks TRUNCATE operations
   - ✅ Blocks multiple statements (SQL injection prevention)

2. **Audit Logging**
   - All SQL operations logged to `audit_logs` table
   - Tracks: user_id, operation_type, sql_query, success/failure
   - Accessible via: `SELECT * FROM audit_logs ORDER BY timestamp DESC`

3. **Row Level Security**
   - Users can only view their own audit logs
   - Service role required for write operations

---

## 🧪 Quick Tests

### Test 1: Database Query (Read Operation)
Test that the chatbot can query your database.

```bash
curl -X POST 'https://aoiwrdzlichescqgnohi.supabase.co/functions/v1/ai-chat-mcp-enhanced' \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "Show me all my active projects",
    "userId": "YOUR_USER_ID",
    "reasoningEffort": "medium"
  }' | jq -r '.reply'
```

**Expected Behavior:**
- Chatbot executes: `SELECT * FROM projects WHERE status = 'active'`
- Returns formatted list of active projects
- Audit log created with operation_type: "SELECT"

---

### Test 2: Create New Project (Write Operation)
Test that the chatbot can create database records.

```bash
curl -X POST 'https://aoiwrdzlichescqgnohi.supabase.co/functions/v1/ai-chat-mcp-enhanced' \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "Create a new project: Samsung Product Launch at Mid Valley on Dec 15, 2024. Need 10 promoters, RM15/hour.",
    "userId": "YOUR_USER_ID",
    "reasoningEffort": "high"
  }' | jq '.'
```

**Expected Behavior:**
- Chatbot recognizes job posting
- Executes: `INSERT INTO projects (...) VALUES (...) RETURNING *`
- Returns success message with project ID
- Audit log created with operation_type: "INSERT"

**Validation Query:**
```sql
SELECT * FROM projects
WHERE title LIKE '%Samsung%'
ORDER BY created_at DESC
LIMIT 1;
```

---

### Test 3: Security - Block DELETE Operation
Test that DELETE operations are properly blocked.

```bash
curl -X POST 'https://aoiwrdzlichescqgnohi.supabase.co/functions/v1/ai-chat-mcp-enhanced' \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "Delete all old projects from 2023",
    "userId": "YOUR_USER_ID",
    "reasoningEffort": "low"
  }' | jq -r '.reply'
```

**Expected Behavior:**
- Chatbot attempts: `DELETE FROM projects WHERE ...`
- SQL validation blocks the operation
- Returns: "DELETE operations are not allowed. Only SELECT, INSERT, and UPDATE are permitted."
- Audit log created with operation_type: "SQL_BLOCKED"

**Validation Query:**
```sql
SELECT * FROM audit_logs
WHERE operation_type = 'SQL_BLOCKED'
ORDER BY timestamp DESC
LIMIT 1;
```

---

### Test 4: Update Existing Record
Test that the chatbot can update records.

```bash
curl -X POST 'https://aoiwrdzlichescqgnohi.supabase.co/functions/v1/ai-chat-mcp-enhanced' \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "Update the Samsung project status to confirmed",
    "userId": "YOUR_USER_ID",
    "conversationId": "PREVIOUS_CONVERSATION_ID",
    "reasoningEffort": "medium"
  }' | jq '.'
```

**Expected Behavior:**
- Chatbot finds the project (from context or by querying)
- Executes: `UPDATE projects SET status = 'confirmed' WHERE id = ... RETURNING *`
- Returns success confirmation
- Audit log created with operation_type: "UPDATE"

**Validation Query:**
```sql
SELECT title, status, updated_at
FROM projects
WHERE title LIKE '%Samsung%'
ORDER BY updated_at DESC;
```

---

### Test 5: Complex Multi-Step Workflow
Test the chatbot's ability to handle complex requests.

```bash
curl -X POST 'https://aoiwrdzlichescqgnohi.supabase.co/functions/v1/ai-chat-mcp-enhanced' \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "I need 5 Mandarin-speaking promoters for the Samsung event. Find available candidates and assign them.",
    "userId": "YOUR_USER_ID",
    "reasoningEffort": "high",
    "showReasoning": true
  }' | jq '.'
```

**Expected Behavior:**
1. Query candidates: `SELECT * FROM candidates WHERE 'Mandarin' = ANY(skills) AND status = 'active'`
2. Check availability: `SELECT * FROM project_staff WHERE candidate_id IN (...)`
3. Create assignments: `INSERT INTO project_staff (project_id, candidate_id, ...) VALUES (...)`
4. Returns summary of assigned staff

**Validation Query:**
```sql
SELECT
  ps.id,
  p.title AS project,
  c.name AS candidate,
  ps.role,
  ps.status
FROM project_staff ps
JOIN projects p ON ps.project_id = p.id
JOIN candidates c ON ps.candidate_id = c.id
WHERE p.title LIKE '%Samsung%'
ORDER BY ps.created_at DESC;
```

---

### Test 6: Reasoning & Tool Calls
Test reasoning visibility and tool execution tracking.

```bash
curl -X POST 'https://aoiwrdzlichescqgnohi.supabase.co/functions/v1/ai-chat-mcp-enhanced' \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "How many active projects do I have and how many still need staff?",
    "userId": "YOUR_USER_ID",
    "reasoningEffort": "medium",
    "showReasoning": true
  }' | jq '.'
```

**Expected Behavior:**
- Shows reasoning process in response
- Lists all tool calls made
- Executes multiple queries:
  - Count active projects
  - Calculate unfilled positions
- Returns metadata: reasoningTokens, toolCallsCount, iterations

**Response Structure:**
```json
{
  "reply": "You have 5 active projects. 3 of them still need staff...",
  "conversationId": "...",
  "metadata": {
    "model": "google/gemini-2.5-flash-preview-09-2025",
    "reasoningTokens": 487,
    "totalTime": 2341,
    "iterations": 2,
    "toolCallsCount": 3,
    "mcpEnabled": true
  },
  "toolCalls": [
    {
      "name": "execute_sql",
      "args": {
        "query": "SELECT COUNT(*) FROM projects WHERE status = 'active'"
      }
    }
  ]
}
```

---

## 📊 Audit Log Monitoring

Check all operations performed by the chatbot:

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

-- Count operations by type
SELECT
  operation_type,
  COUNT(*) as count,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as failed
FROM audit_logs
GROUP BY operation_type
ORDER BY count DESC;

-- Find blocked operations
SELECT
  sql_query,
  error_message,
  timestamp
FROM audit_logs
WHERE operation_type = 'SQL_BLOCKED'
ORDER BY timestamp DESC;

-- Operations by user
SELECT
  user_id,
  operation_type,
  COUNT(*) as count
FROM audit_logs
WHERE timestamp > NOW() - INTERVAL '1 day'
GROUP BY user_id, operation_type
ORDER BY count DESC;
```

---

## 🎭 Real-World Use Case Tests

### Scenario 1: Speed Project Creation
**User Message:**
```
"Need 8 waiters for wedding dinner. December 5th, 6pm-11pm. Grand Hyatt KL. RM20/hour. Must speak English and Malay."
```

**Expected Flow:**
1. Create project
2. Find matching candidates (English + Malay speakers)
3. Assign 8 candidates
4. Return confirmation

**Validation:**
```sql
-- Check project created
SELECT * FROM projects WHERE title LIKE '%wedding%' ORDER BY created_at DESC LIMIT 1;

-- Check assignments
SELECT COUNT(*) FROM project_staff WHERE project_id = (
  SELECT id FROM projects WHERE title LIKE '%wedding%' ORDER BY created_at DESC LIMIT 1
);
```

---

### Scenario 2: Emergency Staff Replacement
**Setup:** First create a project with assigned staff

**User Message:**
```
"John can't make it to the Samsung event tomorrow. Find a replacement."
```

**Expected Flow:**
1. Find John's assignment
2. Find the event (tomorrow's date)
3. Search for available candidates with matching skills
4. Suggest replacements
5. Update assignment if user confirms

**Validation:**
```sql
-- Check staff replacement
SELECT
  ps.id,
  c.name,
  ps.status,
  ps.updated_at
FROM project_staff ps
JOIN candidates c ON ps.candidate_id = c.id
WHERE ps.project_id = (SELECT id FROM projects WHERE title LIKE '%Samsung%')
ORDER BY ps.updated_at DESC;
```

---

### Scenario 3: Bulk Schedule Update
**User Message:**
```
"The Samsung event time changed to 11am-7pm. Update all staff schedules."
```

**Expected Flow:**
1. Find the project
2. Update project working hours
3. Notify about the change
4. Return confirmation

**Validation:**
```sql
-- Check time updated
SELECT
  title,
  working_hours_start,
  working_hours_end,
  updated_at
FROM projects
WHERE title LIKE '%Samsung%';
```

---

## 🔍 Debugging

### Check Function Logs
```bash
npx supabase functions logs ai-chat-mcp-enhanced --tail
```

### Common Issues

**Issue 1: "User ID required"**
- Solution: Include `userId` in request body
- Example: `"userId": "your-user-uuid"`

**Issue 2: Tool execution fails**
- Check: `audit_logs` table for error messages
- Query: `SELECT * FROM audit_logs WHERE success = false ORDER BY timestamp DESC`

**Issue 3: Reasoning takes too long**
- Reduce: `"reasoningEffort": "low"` for simple queries
- Use: `"reasoningEffort": "high"` only for complex workflows

**Issue 4: SQL validation blocks legitimate query**
- Check: The exact SQL in audit_logs
- Verify: Not using DELETE/DROP/TRUNCATE
- Workaround: Rephrase request to use UPDATE or INSERT

---

## 📈 Performance Monitoring

Track chatbot performance:

```sql
-- Average response time by operation type
SELECT
  operation_type,
  COUNT(*) as total_operations,
  AVG(EXTRACT(EPOCH FROM (timestamp - created_at))) as avg_time_seconds
FROM audit_logs
WHERE timestamp > NOW() - INTERVAL '1 day'
GROUP BY operation_type;

-- Success rate
SELECT
  operation_type,
  COUNT(*) as total,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful,
  ROUND(100.0 * SUM(CASE WHEN success THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate_percent
FROM audit_logs
GROUP BY operation_type;

-- Most common errors
SELECT
  error_message,
  COUNT(*) as occurrences
FROM audit_logs
WHERE success = false
GROUP BY error_message
ORDER BY occurrences DESC
LIMIT 10;
```

---

## ✅ Testing Checklist

- [ ] **READ Operations**
  - [ ] Query active projects
  - [ ] Find available candidates
  - [ ] Check staff assignments
  - [ ] View conversation history

- [ ] **WRITE Operations**
  - [ ] Create new project
  - [ ] Update project details
  - [ ] Assign staff to project
  - [ ] Update staff status

- [ ] **SECURITY**
  - [ ] DELETE operation blocked
  - [ ] DROP operation blocked
  - [ ] TRUNCATE operation blocked
  - [ ] Multiple statements blocked
  - [ ] Audit logs created

- [ ] **COMPLEX WORKFLOWS**
  - [ ] Speed project creation (end-to-end)
  - [ ] Emergency staff replacement
  - [ ] Bulk updates with conflict resolution
  - [ ] Multi-step reasoning

- [ ] **MONITORING**
  - [ ] Check audit logs
  - [ ] Verify success rates
  - [ ] Review error patterns
  - [ ] Monitor performance

---

## 🚀 Next Steps

1. **Test Basic Operations** - Start with read-only queries
2. **Test Write Operations** - Create and update records
3. **Test Security** - Verify DELETE blocking works
4. **Run Use Case Scenarios** - Test all 10 scenarios from `mcp-use-case-scenarios.md`
5. **Monitor Audit Logs** - Check for any security issues
6. **Review Performance** - Ensure response times are acceptable
7. **Compare with POC v2** - Test same questions on both endpoints

---

## 📊 Success Metrics

**Target Performance:**
- Response time: <3 seconds for simple queries
- Response time: <10 seconds for complex workflows
- Success rate: >95%
- Security: 100% blocking of DELETE operations
- Audit coverage: 100% of all operations logged

**Comparison vs Current Chatbot:**
- Flexibility: Should handle any query without predefined tools
- Intelligence: Better ambiguity handling and proactive suggestions
- Capabilities: Can now CREATE and UPDATE records
- Security: Comprehensive audit trail

---

## 🆘 Need Help?

**Check logs:**
```bash
npx supabase functions logs ai-chat-mcp-enhanced --tail
```

**View audit logs:**
```sql
SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 50;
```

**Dashboard:**
https://supabase.com/dashboard/project/aoiwrdzlichescqgnohi/functions

---

**🎉 Ready to test! Start with Test 1 and work your way through the scenarios.**
