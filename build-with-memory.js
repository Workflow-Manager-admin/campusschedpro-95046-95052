const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Set higher memory limit for Node
process.env.NODE_OPTIONS = '--max-old-space-size=4096';

// Create temporary environment file to disable warnings
const envPath = path.join(__dirname, '.env.temp');
fs.writeFileSync(envPath, 'DISABLE_ESLINT_PLUGIN=true\nDISABLE_NEW_JSX_TRANSFORM=true\n');

console.log('Starting optimized build process...');
console.log('Memory limit increased to 4GB');

try {
    // Run the build command with production optimization
    execSync('NODE_ENV=production react-scripts build', {
        stdio: 'inherit',
        env: {
            ...process.env,
            DISABLE_ESLINT_PLUGIN: 'true',
            DISABLE_NEW_JSX_TRANSFORM: 'true'
        }
    });

    console.log('Build completed successfully');
} catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
} finally {
    // Clean up temporary environment file
    fs.unlinkSync(envPath);
}
