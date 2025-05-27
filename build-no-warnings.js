const { spawn } = require('child_process');
const path = require('path');

// Set environment variables
process.env.DISABLE_ESLINT_PLUGIN = 'true';
process.env.DISABLE_NEW_JSX_TRANSFORM = 'true';
process.env.NODE_OPTIONS = '--max-old-space-size=4096'; // Increased to 4GB for better stability
process.env.CI = 'false'; // Disable treating warnings as errors

console.log('Starting build process with warnings disabled...');
console.log('Environment:', {
    NODE_OPTIONS: process.env.NODE_OPTIONS,
    DISABLE_ESLINT_PLUGIN: process.env.DISABLE_ESLINT_PLUGIN,
    DISABLE_NEW_JSX_TRANSFORM: process.env.DISABLE_NEW_JSX_TRANSFORM
});

// Use spawn instead of exec to better handle output and errors
const build = spawn('react-scripts', ['build'], {
    stdio: 'inherit',
    env: process.env
});

build.on('error', (err) => {
    console.error('Failed to start build process:', err);
    process.exit(1);
});

build.on('exit', (code, signal) => {
    if (code !== 0) {
        console.error(`Build process exited with code ${code}`);
        process.exit(code);
    }
    if (signal) {
        console.error(`Build process killed with signal ${signal}`);
        process.exit(1);
    }
    console.log('Build completed successfully');
});
