#!/bin/bash

# Start n8n with Chrome DevTools MCP integration
# This allows n8n to interact with Chrome for automated testing and extraction

echo "🚀 Starting n8n with Chrome DevTools MCP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Set environment variables
export N8N_PORT=5678
export N8N_PROTOCOL=http
export N8N_HOST=localhost

# Check if OpenRouter API key exists
if [ -f .env ]; then
    source .env
    echo "✅ Loaded environment from .env"
fi

if [ -z "$OPENROUTER_API_KEY" ]; then
    echo "⚠️  OPENROUTER_API_KEY not set"
    echo "   You'll need to add it manually in n8n"
fi

# Check if Chrome is running
if ! pgrep -x "Google Chrome" > /dev/null; then
    echo ""
    echo "⚠️  Chrome is not running"
    echo "   Starting Chrome for MCP integration..."
    open -a "Google Chrome" --args --remote-debugging-port=9222
    sleep 2
    echo "✅ Chrome started with remote debugging on port 9222"
fi

echo ""
echo "🌐 n8n will be available at:"
echo "   http://localhost:5678"
echo ""
echo "🔧 Chrome DevTools available at:"
echo "   http://localhost:9222"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Starting n8n..."
echo ""

# Start n8n
n8n start
