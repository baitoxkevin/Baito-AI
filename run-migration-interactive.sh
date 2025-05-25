#!/bin/bash

echo "🚀 Running Supabase Migrations"
echo "=============================="
echo ""
echo "Please enter your database password when prompted."
echo "The password will not be visible as you type."
echo ""

cd "/Users/baito.kevin/Downloads/project 10"

# Run the migration
npx supabase db push

echo ""
echo "Migration complete! Checking status..."
echo ""

# Check if migrations were successful
npx supabase db diff

echo ""
echo "✅ Done! Check above for any pending migrations."