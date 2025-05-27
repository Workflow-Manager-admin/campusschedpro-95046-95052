#!/bin/bash

echo "Cleaning up build environment..."

# Remove build artifacts
rm -rf build/
rm -rf .cache/
rm -rf dist/

# Clear Node.js cache
npm cache clean --force

# Remove node_modules
rm -rf node_modules/

# Clean temp files
rm -rf .env.temp
rm -rf .env.local

echo "Cleanup complete. Installing dependencies..."

# Install dependencies
npm install

echo "Setup complete. Ready for build."
