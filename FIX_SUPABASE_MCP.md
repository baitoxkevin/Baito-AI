# 🔧 Fix Supabase MCP Authentication

## 🔍 Root Cause Analysis

**Problem**: Supabase MCP tools are failing with "Unauthorized" error

**Why**:
- ❌ The HTTP-based Supabase MCP requires a **Management API access token**
- ❌ Your `.env` only has `VITE_SUPABASE_ANON_KEY` (for frontend client)
- ❌ No `SUPABASE_ACCESS_TOKEN` configured for Management API

**What's the difference?**
- `VITE_SUPABASE_ANON_KEY` → Frontend database access (Row Level Security)
- `SUPABASE_ACCESS_TOKEN` → Management API access (migrations, project management)

---

## ⚡ Quick Fix (2 minutes)

### Step 1: Generate Access Token

1. **Go to**: https://supabase.com/dashboard/account/tokens
2. **Click**: "Generate new token"
3. **Name**: "Baito AI MCP" (or any name)
4. **Copy**: The token (you'll only see it once!)

### Step 2: Configure MCP (Choose One Method)

#### Option A: Environment Variable (Recommended)

Add to your `.env` file:

```bash
# Add this line to .env
SUPABASE_ACCESS_TOKEN=sbp_your_actual_token_here
```

Then restart Claude Code.

#### Option B: MCP Config (Alternative)

Update `.mcp.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=aoiwrdzlichescqgnohi",
      "headers": {
        "Authorization": "Bearer sbp_your_actual_token_here"
      }
    }
  }
}
```

### Step 3: Restart MCP

```bash
# In Claude Code, run:
/mcp
```

Or restart Claude Code entirely.

---

## ✅ Verify It Works

After configuration, test with:

```javascript
// In Claude Code, ask me to:
// "List my Supabase projects"

// I should be able to run:
mcp__supabase__list_projects()
// ✅ Should return your projects without "Unauthorized" error
```

---

## 🎯 Complete Setup Guide

### Current State
```
Your .env file:
✅ VITE_SUPABASE_URL → https://aoiwrdzlichescqgnohi.supabase.co
✅ VITE_SUPABASE_ANON_KEY → ey...eCY (for frontend)
❌ SUPABASE_ACCESS_TOKEN → MISSING (for MCP)

Your .mcp.json:
✅ Supabase MCP configured (HTTP endpoint)
❌ No authentication headers
❌ No access token
```

### Target State
```
Your .env file:
✅ VITE_SUPABASE_URL
✅ VITE_SUPABASE_ANON_KEY
✅ SUPABASE_ACCESS_TOKEN → sbp_... (NEW!)

Your .mcp.json:
✅ Supabase MCP configured
✅ Can authenticate via env variable
```

---

## 📋 Detailed Steps

### 1. Get Your Access Token

**Navigate to Token Dashboard**:
- URL: https://supabase.com/dashboard/account/tokens
- Login if needed

**Create New Token**:
1. Click "Generate new token"
2. Name: "Baito AI Development"
3. Scopes: (All scopes selected by default - this is fine)
4. Click "Generate token"
5. **IMPORTANT**: Copy the token immediately (starts with `sbp_`)

**Token Format**: `sbp_1234567890abcdef...` (Personal Access Token)

### 2. Add to Environment

**Edit `.env` file**:

```bash
# Existing (keep these)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvaXdyZHpsaWNoZXNjcWdub2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyNTM2NDgsImV4cCI6MjA1NTgyOTY0OH0.F505FnCo_hg6_LpEZ-yvNWd5Zw5OnCnGxIogP4txeCY
VITE_SUPABASE_URL=https://aoiwrdzlichescqgnohi.supabase.co

# NEW - Add this line
SUPABASE_ACCESS_TOKEN=sbp_your_token_from_dashboard

# Rest of your config...
DB_POOL_MIN=2
DB_POOL_MAX=10
# etc...
```

### 3. Reload Environment

**Option A: Restart Claude Code**
- Close and reopen Claude Code
- MCP will pick up new environment variable

**Option B: Reconnect MCP**
```bash
# Run this command in Claude Code:
/mcp
```

### 4. Test the Connection

Ask me to run:
```
Test Supabase MCP by listing projects
```

Expected result:
```
✅ Successfully fetched projects
✅ No "Unauthorized" error
✅ Can see project: aoiwrdzlichescqgnohi
```

---

## 🧪 Verification Tests

### Test 1: List Projects
```javascript
await mcp__supabase__list_projects()
// Expected: Array of projects, no auth error
```

### Test 2: Get Project Details
```javascript
await mcp__supabase__get_project({ id: "aoiwrdzlichescqgnohi" })
// Expected: Project details with status, region, etc.
```

### Test 3: List Tables
```javascript
await mcp__supabase__list_tables({
  project_id: "aoiwrdzlichescqgnohi",
  schemas: ["public"]
})
// Expected: List of tables (projects, candidates, etc.)
```

### Test 4: Execute SQL (Read-only)
```javascript
await mcp__supabase__execute_sql({
  project_id: "aoiwrdzlichescqgnohi",
  query: "SELECT COUNT(*) FROM projects;"
})
// Expected: Count result
```

---

## 🔐 Security Best Practices

### ✅ DO:
- Store access token in `.env` (already gitignored)
- Generate separate tokens for dev/prod
- Rotate tokens periodically
- Use descriptive token names

### ❌ DON'T:
- Commit tokens to git
- Share tokens publicly
- Use same token across multiple apps
- Store in client-side code

### Your `.gitignore` (Already Protected):
```bash
# ✅ Your .env is already in .gitignore
.env
.env.local
.env.production
```

---

## 🐛 Troubleshooting

### Still Getting "Unauthorized"?

**Check 1: Token Format**
```bash
# Valid format:
SUPABASE_ACCESS_TOKEN=sbp_1234567890abcdef...

# Invalid (missing sbp_ prefix):
SUPABASE_ACCESS_TOKEN=1234567890abcdef...

# Invalid (has quotes):
SUPABASE_ACCESS_TOKEN="sbp_..."  # ❌ Remove quotes
```

**Check 2: Environment Loaded?**
```bash
# In terminal:
echo $SUPABASE_ACCESS_TOKEN
# Should output: sbp_...

# If empty, token not loaded
# Solution: Restart terminal/Claude Code
```

**Check 3: Token Expired?**
- Go to: https://supabase.com/dashboard/account/tokens
- Check if token is still active
- Generate new one if needed

**Check 4: MCP Configuration**
```bash
# Verify .mcp.json structure:
cat .mcp.json | grep -A 3 supabase

# Should show:
# "supabase": {
#   "type": "http",
#   "url": "https://mcp.supabase.com/mcp?project_ref=aoiwrdzlichescqgnohi"
# }
```

### Permission Errors After Auth Fixed?

If you get "permission denied" on database operations:
- ✅ This is **normal** - RLS (Row Level Security) is working
- ✅ You need to be authenticated in your app
- ✅ Management API ≠ Database access

For database operations:
- Use `VITE_SUPABASE_ANON_KEY` + user auth
- Management API is for project management, not data access

---

## 📊 What Each Token Does

### 1. VITE_SUPABASE_ANON_KEY (Frontend)
**Purpose**: Client-side database access
**Used by**: Your React app
**Permissions**: Row Level Security (RLS) enforced
**Can do**:
- ✅ Query tables (with RLS)
- ✅ Insert/update/delete (with RLS)
- ✅ Subscribe to realtime
- ✅ User authentication

**Cannot do**:
- ❌ Create tables
- ❌ Run migrations
- ❌ Manage project settings

### 2. SUPABASE_ACCESS_TOKEN (Management API)
**Purpose**: Project management and administration
**Used by**: MCP tools, CLI, CI/CD
**Permissions**: Full project access
**Can do**:
- ✅ List projects
- ✅ Create/delete databases
- ✅ Run migrations
- ✅ Manage edge functions
- ✅ View logs
- ✅ Create branches

**Cannot do**:
- ❌ Bypass RLS on client operations
- ❌ Access user data directly (use client SDK for that)

---

## ✨ After Fix - Available MCP Commands

Once fixed, you can use:

```javascript
// Project Management
mcp__supabase__list_projects()
mcp__supabase__get_project({ id: "..." })
mcp__supabase__create_project({ name, region, organization_id })
mcp__supabase__pause_project({ project_id })
mcp__supabase__restore_project({ project_id })

// Database Operations
mcp__supabase__list_tables({ project_id, schemas })
mcp__supabase__execute_sql({ project_id, query })
mcp__supabase__apply_migration({ project_id, name, query })
mcp__supabase__list_migrations({ project_id })

// Edge Functions
mcp__supabase__list_edge_functions({ project_id })
mcp__supabase__deploy_edge_function({ project_id, name, files })
mcp__supabase__get_edge_function({ project_id, function_slug })

// Monitoring
mcp__supabase__get_logs({ project_id, service })
mcp__supabase__get_advisors({ project_id, type })

// Development Branches
mcp__supabase__create_branch({ project_id, name })
mcp__supabase__list_branches({ project_id })
mcp__supabase__merge_branch({ branch_id })
mcp__supabase__delete_branch({ branch_id })
```

---

## 🚀 Quick Test Script

After adding token, run this to verify everything:

```bash
# Create test file
cat > test-mcp.js << 'EOF'
// Test Supabase MCP connection
console.log('Testing Supabase MCP...\n');

// This will be available after fix
const tests = [
  'List projects',
  'Get project details',
  'List tables',
  'Check project status'
];

tests.forEach((test, i) => {
  console.log(`${i + 1}. ${test} - Ready to test ✅`);
});

console.log('\nAsk Claude to run these tests!');
EOF

node test-mcp.js
```

---

## 📝 Checklist

Before asking me to test:
- [ ] Generated access token from Supabase dashboard
- [ ] Copied token (starts with `sbp_`)
- [ ] Added to `.env` as `SUPABASE_ACCESS_TOKEN=sbp_...`
- [ ] Verified no quotes around token
- [ ] Saved `.env` file
- [ ] Restarted Claude Code or ran `/mcp`

After configuration:
- [ ] Ask me to list Supabase projects
- [ ] Verify no "Unauthorized" error
- [ ] Verify I can see your project
- [ ] Test applying a migration

---

## 🎯 Summary

**The Issue**:
```
MCP HTTP endpoint → Needs auth → No token → ❌ Unauthorized
```

**The Fix**:
```
Generate token → Add to .env → Restart → ✅ Authenticated
```

**Time**: ~2 minutes
**Difficulty**: Easy
**Result**: Full Supabase MCP access! 🎉

---

## 📞 Next Steps

1. **Get token**: https://supabase.com/dashboard/account/tokens
2. **Add to .env**: `SUPABASE_ACCESS_TOKEN=sbp_...`
3. **Restart Claude Code**
4. **Tell me**: "Test Supabase MCP now"

That's it! Then we can apply those migrations directly via MCP. 🚀
