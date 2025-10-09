#!/bin/bash

# Setup script for n8n with OpenRouter API

echo "🚀 Setting up n8n with OpenRouter API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if OpenRouter API key is set
if [ -z "$OPENROUTER_API_KEY" ]; then
    echo ""
    echo "⚠️  OpenRouter API key not found!"
    echo ""
    echo "Please set your OpenRouter API key:"
    echo "  export OPENROUTER_API_KEY='your-api-key-here'"
    echo ""
    echo "Get your API key from: https://openrouter.ai/keys"
    echo ""
    read -p "Enter your OpenRouter API key now: " api_key
    export OPENROUTER_API_KEY="$api_key"

    # Save to .env file
    echo "OPENROUTER_API_KEY=$api_key" >> .env
    echo "✅ API key saved to .env file"
fi

echo ""
echo "✅ OpenRouter API key configured"
echo ""

# Check if n8n is installed
if ! command -v n8n &> /dev/null; then
    echo "❌ n8n not found. Installing..."
    npm install -g n8n
else
    echo "✅ n8n is installed"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Setup complete!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Start n8n:"
echo "   n8n start"
echo ""
echo "2. Open browser to:"
echo "   http://localhost:5678"
echo ""
echo "3. Import workflow:"
echo "   - Click 'Workflows' → 'Import from File'"
echo "   - Select: n8n-setup/openrouter_vision_workflow.json"
echo ""
echo "4. Add OpenRouter credential:"
echo "   - Settings → Credentials → Add Credential"
echo "   - Type: HTTP Header Auth"
echo "   - Name: openrouter_api"
echo "   - Header Name: Authorization"
echo "   - Header Value: Bearer \$OPENROUTER_API_KEY"
echo ""
echo "5. Activate the workflow"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
