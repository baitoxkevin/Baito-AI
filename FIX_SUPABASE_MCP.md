# 🔧 Fix Supabase MCP Access Token

## The Problem:
Your Supabase MCP access token `sbp_b465d8eac8787b531fe50af6b199af1e18aadef1` is expired or invalid.

## Solution Steps:

### 1. Generate New Access Token
1. Go to: https://supabase.com/dashboard/account/tokens
2. Click **"Generate new token"**
3. Give it a name like "Claude MCP"
4. Copy the token (starts with `sbp_`)
5. **IMPORTANT**: Save it somewhere safe - you can't see it again!

### 2. Update Your MCP Configuration

Edit the file `.mcp.json` in this project:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--access-token",
        "YOUR_NEW_TOKEN_HERE"  // <- Replace this
      ]
    },
    // ... other servers
  }
}
```

### 3. Restart Claude Desktop
After updating the token:
1. Completely quit Claude Desktop (Cmd+Q on Mac)
2. Start Claude Desktop again
3. The MCP will reload with the new token

### 4. Test It Works
Once restarted, I can test with:
- `mcp__supabase__list_projects` 
- `mcp__supabase__execute_sql`

## Alternative: Use Environment Variable

You can also set it as an environment variable:

```bash
export SUPABASE_ACCESS_TOKEN="your_new_token_here"
```

Then update `.mcp.json` to:
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN}"
      }
    }
  }
}
```

## Security Note:
⚠️ Never commit your access token to git! Add `.mcp.json` to `.gitignore` if it contains tokens.