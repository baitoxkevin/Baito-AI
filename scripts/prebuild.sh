#!/bin/bash

echo "Starting pre-build checks..."

# Check if required environment variables are set
required_vars=("VITE_SUPABASE_URL" "VITE_SUPABASE_ANON_KEY")

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "Warning: $var is not set. The app may not function correctly."
  fi
done

# Clean any previous builds
rm -rf dist

echo "Pre-build checks complete!"