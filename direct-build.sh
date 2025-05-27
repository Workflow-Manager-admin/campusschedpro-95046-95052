#!/bin/bash

echo "Starting build process..."

# Clean up previous build artifacts
rm -rf dist
rm -rf node_modules
rm -f build.log

# Install dependencies
echo "Installing dependencies..."
npm install

# Run the build
echo "Running build..."
node direct-build.js

# Check build status
if [ $? -eq 0 ]; then
    echo "Build completed successfully"
    exit 0
else
    echo "Build failed - check build.log for details"
    exit 1
fi
