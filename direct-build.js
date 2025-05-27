const { execSync } = require('child_process');

// Set essential environment variables
process.env.DISABLE_ESLINT_PLUGIN = 'true';
process.env.DISABLE_NEW_JSX_TRANSFORM = 'true';
process.env.NODE_ENV = 'production';
process.env.CI = 'false';

try {
    // Clean install of dependencies
    console.log('Installing dependencies...');
    execSync('npm install --no-audit --no-fund --no-optional', { stdio: 'inherit' });

    // Run the build
    console.log('Starting production build...');
    execSync('npx react-scripts build', {
        stdio: 'inherit',
        env: {
            ...process.env,
            NODE_OPTIONS: '--max-old-space-size=4096'
        }
    });
} catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
}
