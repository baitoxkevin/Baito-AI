#!/bin/bash

echo "🚀 Supabase Migration Runner"
echo "============================"
echo ""
echo "This script will help you run the Supabase migrations."
echo ""
echo "You'll need your database password from:"
echo "https://supabase.com/dashboard/project/aoiwrdzlichescqgnohi/settings/database"
echo ""
echo "Press Enter to continue..."
read

# Navigate to project directory
cd "/Users/baito.kevin/Downloads/project 10"

# Run migrations
echo "Running migrations..."
npx supabase db push

echo ""
echo "✅ Migration process complete!"
echo ""
echo "To verify the migrations were applied, you can:"
echo "1. Check the Supabase dashboard SQL editor"
echo "2. Run: npx supabase db diff to see any pending changes"