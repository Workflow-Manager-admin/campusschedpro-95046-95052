#!/bin/bash

# Change to project directory
cd /home/kavia/workspace/code-generation/campusschedpro-95046-95052/main_container_for_campus_sched_pro || {
    echo "Failed to change directory"
    exit 1
}

# Function to handle errors
handle_error() {
    echo "Error occurred in build process"
    echo "Exit code: $?"
    exit 1
}

# Set error trap
trap handle_error ERR

# Set environment variables
export CI=true
export NODE_ENV=production
export FORCE_COLOR=true

echo "Starting build process..."

# Run build with output redirection and no warnings
echo "Running build with warnings disabled..."
node build-no-warnings.js 2>&1 || {
    echo "Build command failed"
    exit 1
}

echo "Build process completed"
exit 0
