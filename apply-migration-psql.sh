#!/bin/bash

# Apply migration using psql via Supabase connection
# This requires database password (service role key won't work for direct psql)

echo "🔧 Applying migration via Supabase SQL Editor..."
echo ""
echo "⚠️  Direct psql connection requires database password."
echo "📋 Please apply the migration manually via Supabase Dashboard:"
echo ""
echo "1. Go to: https://supabase.com/dashboard/project/aoiwrdzlichescqgnohi/editor"
echo "2. Click 'New Query'"
echo "3. Copy and paste the following SQL:"
echo ""
echo "-----------------------------------"
cat supabase/migrations/20251004_add_candidates_skills_languages.sql
echo "-----------------------------------"
echo ""
echo "4. Click 'Run' or press Cmd+Enter"
echo ""
echo "✅ After running, the migration will be complete!"
