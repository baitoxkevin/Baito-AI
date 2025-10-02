#!/bin/bash

# Baito Mobile - Apply Migrations Script
# This script helps you apply migrations to Supabase

echo "🚀 Baito Mobile - Migration Helper"
echo "=================================="
echo ""

# Check if migrations exist
if [ ! -d "supabase/migrations" ]; then
    echo "❌ Error: supabase/migrations directory not found"
    exit 1
fi

echo "📋 Available migrations:"
echo ""
ls -1 supabase/migrations/*.sql | while read file; do
    filename=$(basename "$file")
    echo "  ✓ $filename"
done

echo ""
echo "🔧 To apply these migrations, you have 3 options:"
echo ""
echo "Option 1: Supabase Dashboard (Recommended)"
echo "  1. Go to: https://app.supabase.com/project/aoiwrdzlichescqgnohi/sql/new"
echo "  2. Copy contents of each migration file"
echo "  3. Paste into SQL Editor"
echo "  4. Click 'Run'"
echo ""
echo "Option 2: Supabase CLI (if installed)"
echo "  Run: supabase db push"
echo ""
echo "Option 3: Manual SQL Execution"
echo "  Run the SQL files in order using psql or any SQL client"
echo ""

# Check if Supabase CLI is installed
if command -v supabase &> /dev/null; then
    echo "✅ Supabase CLI is installed!"
    echo ""
    read -p "Do you want to apply migrations now using Supabase CLI? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔄 Applying migrations..."
        supabase db push
        echo "✅ Done!"
    fi
else
    echo "ℹ️  Supabase CLI not found. Install: npm install -g supabase"
fi

echo ""
echo "📝 Migration files to apply:"
echo ""
echo "1. supabase/migrations/20251002000000_create_attendance_table.sql"
echo "   - Creates attendance table"
echo "   - GPS tracking"
echo "   - Geofence validation"
echo "   - Auto hours calculation"
echo ""
echo "2. supabase/migrations/20251002010000_create_gamification_tables.sql"
echo "   - Creates points_log table"
echo "   - Creates achievements table"
echo "   - Auto point awarding"
echo "   - Leaderboard view"
echo ""
echo "✨ After applying migrations, your database will be ready!"
