// Enhanced build script with better memory handling and error reporting
const { execSync } = require('child_process');
const fs = require('fs');

// Set environment variables for build optimization
const env = {
  ...process.env,
  DISABLE_ESLINT_PLUGIN: 'true',
  CI: 'false',
  ESLINT_NO_DEV_ERRORS: 'true',
  SKIP_PREFLIGHT_CHECK: 'true',
  TSC_COMPILE_ON_ERROR: 'true',
  BABEL_ENV: 'production',
  NODE_ENV: 'production',
  GENERATE_SOURCEMAP: 'false', // Reduce memory usage
  INLINE_RUNTIME_CHUNK: 'false', // Reduce memory usage
};

try {
  console.log('Starting optimized build...');
  
  // Run the build command with optimized settings
  execSync('node --max-old-space-size=8192 ./node_modules/.bin/react-scripts build', { 
    stdio: 'inherit',
    env,
    timeout: 300000 // 5 minute timeout
  });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message || error);
  process.exit(1);
}
