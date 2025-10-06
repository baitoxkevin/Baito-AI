#!/bin/bash

# AI Chatbot - Complete Test Suite Runner
# Runs all 100 test scenarios using Node.js automation

echo "🚀 Starting AI Chatbot Complete Test Suite..."
echo "================================================"
echo ""

# Check if dev server is running
if ! curl -s http://localhost:5173 > /dev/null; then
    echo "❌ Error: Development server not running on http://localhost:5173"
    echo "Please start the server with: npm run dev"
    exit 1
fi

echo "✅ Development server detected"
echo ""

# Run the automated test suite
echo "📝 Running automated test scenarios..."
echo ""

node chrome-automated-test-runner.js

echo ""
echo "================================================"
echo "✨ Test execution complete!"
echo "📄 Check AUTOMATED_TEST_REPORT.md for results"
