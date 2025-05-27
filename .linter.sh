#!/bin/bash

set -e  # Exit on any error

# Ensure we're in the correct directory
cd "$(dirname "$0")" || exit 1

echo "Starting minimal build process..."
node minimal-build.js
