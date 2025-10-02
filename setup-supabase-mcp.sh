#!/bin/bash

# Supabase MCP Setup Script
# This script helps you configure Supabase MCP authentication

echo "🚀 Supabase MCP Setup"
echo "===================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Creating from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo ""
fi

# Check if SUPABASE_ACCESS_TOKEN exists
if grep -q "SUPABASE_ACCESS_TOKEN=" .env; then
    TOKEN_LINE=$(grep "SUPABASE_ACCESS_TOKEN=" .env)
    if [[ $TOKEN_LINE == *"sbp_"* ]]; then
        echo "✅ SUPABASE_ACCESS_TOKEN already configured"
        echo ""
        echo "Token preview: ${TOKEN_LINE:0:40}..."
        echo ""
        echo "To update, edit .env and replace the token"
    else
        echo "⚠️  SUPABASE_ACCESS_TOKEN found but doesn't look valid"
        echo "Current value: $TOKEN_LINE"
        echo ""
        echo "Please update it with a valid token from:"
        echo "https://supabase.com/dashboard/account/tokens"
    fi
else
    echo "❌ SUPABASE_ACCESS_TOKEN not found in .env"
    echo ""
    echo "📋 Steps to fix:"
    echo "1. Go to: https://supabase.com/dashboard/account/tokens"
    echo "2. Click 'Generate new token'"
    echo "3. Copy the token (starts with sbp_)"
    echo "4. Add to .env file:"
    echo ""
    echo "   SUPABASE_ACCESS_TOKEN=sbp_your_token_here"
    echo ""
    echo "5. Restart Claude Code"
    echo ""
fi

# Check MCP configuration
echo "Checking MCP configuration..."
if [ -f .mcp.json ]; then
    if grep -q "supabase" .mcp.json; then
        echo "✅ Supabase MCP configured in .mcp.json"
    else
        echo "⚠️  .mcp.json exists but no Supabase config found"
    fi
else
    echo "⚠️  .mcp.json not found"
fi

echo ""
echo "📖 For detailed instructions, see: FIX_SUPABASE_MCP.md"
echo ""
echo "🧪 To test after setup, ask Claude:"
echo "   'Test Supabase MCP by listing my projects'"
echo ""
