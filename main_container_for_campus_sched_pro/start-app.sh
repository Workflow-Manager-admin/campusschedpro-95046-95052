#!/bin/bash
# Kill any processes using port 3000 or 3001
echo "Checking for processes using ports 3000 or 3001..."
lsof -ti:3000,3001 | xargs kill -9 2>/dev/null || true

# Ensure the necessary symlinks exist
mkdir -p node_modules/react-redux/es/ 
mkdir -p node_modules/redux/es/
ln -sf ../dist/react-redux.mjs node_modules/react-redux/es/index.js 
ln -sf ../dist/redux.mjs node_modules/redux/es/redux.js

echo "Starting the React development server..."
PORT=3000 npm start -- --no-open

