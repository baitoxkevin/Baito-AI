#!/bin/bash

# Navigate to project directory
cd "/Users/baito.kevin/Downloads/project 10"

# Remove existing zip if it exists
rm -f baito-events-netlify.zip

# Create the zip file with included files and excluded patterns
zip -r baito-events-netlify.zip \
  src/ \
  public/ \
  package.json \
  package-lock.json \
  pnpm-lock.yaml \
  tsconfig.json \
  tsconfig.app.json \
  tsconfig.node.json \
  components.json \
  eslint.config.js \
  postcss.config.js \
  tailwind.config.js \
  vite.config.ts \
  vite.config.enhanced.ts \
  index.html \
  index-enhanced.html \
  netlify.toml \
  README.md \
  NETLIFY_DEPLOYMENT.md \
  -x "*.sql" \
  -x "*test*" \
  -x "*debug*" \
  -x ".env" \
  -x ".env.local" \
  -x ".env.development" \
  -x "*.zip" \
  -x "node_modules/*" \
  -x ".git/*" \
  -x "dist/*" \
  -x "build/*" \
  -x "supabase/*" \
  -x "*.tsbuildinfo" \
  -x "*backup*" \
  -x "*original*" \
  -x "src/test-*" \
  -x "src/debug-*" \
  -x "test-*" \
  -x "debug.*"

echo "Zip file created: baito-events-netlify.zip"
ls -lh baito-events-netlify.zip