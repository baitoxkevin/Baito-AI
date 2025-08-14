#!/bin/bash

# Secure Environment Setup Script
# This script helps set up environment variables securely

echo "🔒 Secure Environment Setup"
echo "=========================="

# Check if .env.secure exists
if [ ! -f ".env.secure" ]; then
    echo "Creating .env.secure from template..."
    cp .env.secure.example .env.secure
    echo "✅ Created .env.secure"
else
    echo "ℹ️  .env.secure already exists"
fi

# Create secure MCP config from environment variables
create_mcp_config() {
    if [ -f ".env.secure" ]; then
        source .env.secure
        
        cat > .mcp.json <<EOF
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--access-token",
        "\${SUPABASE_ACCESS_TOKEN}"
      ]
    },
    "magicuidesign-mcp": {
      "command": "npx",
      "args": ["-y", "@magicuidesign/mcp@latest"]
    },
    "21st-dev-magic": {
      "command": "npx",
      "args": ["-y", "@21st-dev/magic@latest", "API_KEY=\"\${TWENTYFIRST_DEV_API_KEY}\""]
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    },
    "vibetest": {
      "command": "/Users/baito.kevin/Downloads/project 10/mcp-servers/vibetest-use/.venv/bin/vibetest-mcp",
      "args": [],
      "env": {
        "GOOGLE_API_KEY": "\${GOOGLE_API_KEY}"
      }
    },
    "serena": {
      "command": "/Users/baito.kevin/Downloads/project 10/mcp-servers/serena/.venv/bin/serena-mcp-server",
      "args": [
        "--project",
        "/Users/baito.kevin/Downloads/project 10",
        "--context",
        "ide-assistant"
      ],
      "env": {}
    }
  }
}
EOF
        echo "✅ Created .mcp.json with environment variables"
    else
        echo "❌ .env.secure not found. Please create it first."
        exit 1
    fi
}

# Prompt for action
echo ""
echo "What would you like to do?"
echo "1. Set up environment variables in .env.secure"
echo "2. Generate .mcp.json from environment variables"
echo "3. Both"
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "Please edit .env.secure and add your API keys:"
        echo "  - SUPABASE_ACCESS_TOKEN"
        echo "  - TWENTYFIRST_DEV_API_KEY"
        echo "  - GOOGLE_API_KEY"
        echo ""
        echo "You can get new keys from:"
        echo "  - Supabase: https://supabase.com/dashboard/account/tokens"
        echo "  - 21st.dev: Check your account settings"
        echo "  - Google: https://console.cloud.google.com/apis/credentials"
        ;;
    2)
        create_mcp_config
        ;;
    3)
        echo ""
        echo "Please edit .env.secure first, then run this script again with option 2."
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🔐 Security Reminders:"
echo "  - Never commit .env.secure or .mcp.json to git"
echo "  - Rotate API keys regularly"
echo "  - Use read-only permissions where possible"
echo "  - Monitor API usage for suspicious activity"