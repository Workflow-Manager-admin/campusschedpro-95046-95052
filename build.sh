#!/bin/bash

# Clean up existing build artifacts
echo "Cleaning up previous build..."
rm -rf build
rm -rf .env.temp

# Run diagnostic
echo "Running build diagnostics..."
node build-diagnostic.js

# Set environment variables
export NODE_OPTIONS="--max-old-space-size=2048"
export DISABLE_ESLINT_PLUGIN=true
export DISABLE_NEW_JSX_TRANSFORM=true

# Run the build
echo "Starting build process..."
node build-no-warnings.js

# Check exit status
if [ $? -ne 0 ]; then
    echo "Build failed"
    exit 1
fi

echo "Build completed successfully"
