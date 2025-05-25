#!/bin/bash

echo "Running migration to add home_address and business_address fields..."

# Run the migration using Supabase CLI
npx supabase migration up

echo "Migration completed!"
echo ""
echo "If the migration was successful, the candidates table should now have:"
echo "- home_address (TEXT)"
echo "- business_address (TEXT)"
echo ""
echo "You can verify this in your Supabase dashboard."