#!/bin/bash

echo "Running migration to add budget and invoice_number columns to projects table..."

# Get the directory of the script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Read the SQL file
SQL_FILE="$DIR/supabase/migrations/20250528000000_add_budget_invoice_to_projects.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo "Error: Migration file not found at $SQL_FILE"
    exit 1
fi

# Display the SQL that will be run
echo "SQL to be executed:"
echo "==================="
cat "$SQL_FILE"
echo "==================="
echo ""

# Prompt for confirmation
read -p "Do you want to run this migration? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Please run the following SQL in your Supabase SQL Editor:"
    echo ""
    echo "1. Go to: https://supabase.com/dashboard/project/aoiwrdzlichescqgnohi/sql/new"
    echo "2. Copy and paste the SQL below:"
    echo ""
    cat "$SQL_FILE"
    echo ""
    echo "3. Click 'Run' to execute the migration"
    echo ""
    echo "After running the migration, the budget and invoice_number fields will be available in your projects table."
else
    echo "Migration cancelled."
fi