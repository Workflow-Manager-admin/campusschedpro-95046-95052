// Simple script to run the build without treating warnings as errors
const { execSync } = require('child_process');

// Set environment variables to bypass treating warnings as errors
process.env.DISABLE_ESLINT_PLUGIN = 'true';
process.env.CI = 'false';
process.env.ESLINT_NO_DEV_ERRORS = 'true';
process.env.SKIP_PREFLIGHT_CHECK = 'true';

try {
  console.log('Starting build with warnings disabled...');
  // Run the build command with maximum memory allocation
  execSync('NODE_OPTIONS="--max-old-space-size=4096" ./node_modules/.bin/react-scripts build', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      DISABLE_ESLINT_PLUGIN: 'true',
      CI: 'false',
      ESLINT_NO_DEV_ERRORS: 'true',
      SKIP_PREFLIGHT_CHECK: 'true'
    }
  });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
