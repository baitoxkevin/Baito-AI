#!/bin/bash

# Build and create deployment package for Netlify

echo "Building project for production..."

# Navigate to project directory
cd "/Users/baito.kevin/Downloads/project 10"

# Install dependencies if needed
echo "Installing dependencies..."
npm install

# Build the project
echo "Building project..."
npm run build

# Create deployment folder
echo "Creating deployment package..."
mkdir -p netlify-deploy

# Copy build output
cp -r dist/* netlify-deploy/

# Copy necessary files
cp netlify.toml netlify-deploy/ 2>/dev/null || echo "No netlify.toml found"
cp _redirects netlify-deploy/ 2>/dev/null || echo "No _redirects file found"

# Create _redirects file for SPA routing if it doesn't exist
if [ ! -f netlify-deploy/_redirects ]; then
  echo "/*    /index.html   200" > netlify-deploy/_redirects
fi

# Create zip file
echo "Creating zip file..."
cd netlify-deploy
zip -r ../netlify-deploy-$(date +%Y%m%d-%H%M%S).zip .
cd ..

# Clean up
rm -rf netlify-deploy

echo "Deployment package created successfully!"
echo "Look for netlify-deploy-*.zip in the project directory"