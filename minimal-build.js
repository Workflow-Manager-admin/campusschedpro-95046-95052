const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting minimal build process...');

// Remove existing node_modules
try {
  console.log('Removing node_modules...');
  execSync('rm -rf node_modules');
} catch (error) {
  console.log('No existing node_modules to remove');
}

// Run npm install instead of npm ci for first run
try {
  console.log('Running: npm install --omit=dev --no-audit --no-fund --prefer-offline');
  execSync('npm install --omit=dev --no-audit --no-fund --prefer-offline', {
    stdio: 'inherit'
  });
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}

console.log('Build completed successfully');
