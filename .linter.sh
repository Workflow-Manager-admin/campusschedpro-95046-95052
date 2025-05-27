#!/bin/bash

# Ensure we're in the correct directory
cd "$(dirname "$0")" || exit 1

# Clean up
echo "Cleaning up previous build artifacts..."
rm -rf node_modules build package-lock.json

# Run the simplified build process
echo "Starting build process..."
node direct-build.js
