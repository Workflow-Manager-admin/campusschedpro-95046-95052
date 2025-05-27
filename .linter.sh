#!/bin/bash

echo "Starting build process with warnings disabled..."

# Set NODE_OPTIONS environment variable for increased memory
export NODE_OPTIONS="--max-old-space-size=4096"

# Stay in current directory instead of changing
cd "$(dirname "$0")" || {
    echo "Failed to change to script directory"
    exit 1
}

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Clear any existing build artifacts
rm -rf build

# Use the existing script to build without treating warnings as errors
echo "Starting build with warnings disabled..."
npm run build:nowarnings

# Check build status
BUILD_STATUS=$?
if [ $BUILD_STATUS -ne 0 ]; then
    echo "Build failed with status $BUILD_STATUS"
    exit $BUILD_STATUS
fi

echo "Build completed successfully"
exit 0
