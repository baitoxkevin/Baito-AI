#!/bin/bash

# Navigate to project directory
cd "/Users/baito.kevin/Downloads/project 10"

# Build the project
echo "Building the project..."
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "Build failed!"
    exit 1
fi

# Create a temporary directory for the deployment files
echo "Creating deployment package..."
TEMP_DIR=$(mktemp -d)

# Copy dist contents to temp directory
cp -r dist/* "$TEMP_DIR/"

# Copy _redirects file to temp directory
if [ -f "_redirects" ]; then
    cp _redirects "$TEMP_DIR/"
else
    echo "Warning: _redirects file not found!"
fi

# Create the zip file
cd "$TEMP_DIR"
zip -r "/Users/baito.kevin/Downloads/project 10/baito-events-netlify-deploy.zip" ./*

# Clean up
cd /
rm -rf "$TEMP_DIR"

echo "Deployment package created: baito-events-netlify-deploy.zip"