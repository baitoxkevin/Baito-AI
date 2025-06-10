#!/bin/bash

echo "Creating deployment package for Netlify..."

# Create a temporary directory
mkdir -p netlify-deploy

# Copy all necessary files
cp -r src netlify-deploy/
cp -r public netlify-deploy/
cp package.json netlify-deploy/
cp package-lock.json netlify-deploy/
cp vite.config.ts netlify-deploy/
cp tsconfig.json netlify-deploy/
cp tsconfig.app.json netlify-deploy/
cp tsconfig.node.json netlify-deploy/
cp tailwind.config.js netlify-deploy/
cp postcss.config.js netlify-deploy/
cp index.html netlify-deploy/
cp netlify.toml netlify-deploy/
cp .env.production netlify-deploy/.env.example
cp NETLIFY_DEPLOYMENT.md netlify-deploy/
cp README.md netlify-deploy/

# Copy other config files
cp components.json netlify-deploy/ 2>/dev/null || true
cp eslint.config.js netlify-deploy/ 2>/dev/null || true

# Create .gitignore for deployment
cat > netlify-deploy/.gitignore << EOF
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Production
dist/
build/

# Misc
.DS_Store
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
*.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Editor
.vscode/*
!.vscode/extensions.json
.idea
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# System
.DS_Store
Thumbs.db

# TypeScript
*.tsbuildinfo
EOF

# Create the zip file
zip -r baito-events-netlify-deploy.zip netlify-deploy/

# Clean up
rm -rf netlify-deploy/

echo "✅ Deployment package created: baito-events-netlify-deploy.zip"
echo ""
echo "📋 Next steps:"
echo "1. Extract the zip file"
echo "2. Run 'npm install' in the extracted directory"
echo "3. Set environment variables in Netlify dashboard"
echo "4. Deploy to Netlify"
echo ""
echo "⚠️  Don't forget to add your Supabase anon key in Netlify!"