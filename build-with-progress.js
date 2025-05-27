const webpack = require('webpack');
const config = require('./webpack.config.js');
const ProgressPlugin = require('webpack/lib/ProgressPlugin');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

// Reduce memory usage
process.env.NODE_OPTIONS = '--max-old-space-size=1024';
process.env.DISABLE_ESLINT_PLUGIN = 'true';
process.env.DISABLE_NEW_JSX_TRANSFORM = 'true';

// Create a promise-based timeout
const timeout = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Progress handler
let lastProgress = 0;
const handleProgress = (percentage, message) => {
    const currentProgress = Math.floor(percentage * 100);
    if (currentProgress > lastProgress) {
        console.log(`Build progress: ${currentProgress}% - ${message}`);
        lastProgress = currentProgress;
    }
};

async function build() {
    console.log('Starting build with reduced memory usage and progress tracking...');
    
    const compiler = webpack({
        ...config,
        plugins: [
            ...(config.plugins || []),
            new ProgressPlugin((percentage, message) => handleProgress(percentage, message))
        ]
    });

    try {
        const stats = await promisify(compiler.run.bind(compiler))();
        
        if (stats.hasErrors()) {
            console.error('Build errors:', stats.toString({
                chunks: false,
                colors: true
            }));
            process.exit(1);
        }

        console.log('Build completed successfully');
        await promisify(compiler.close.bind(compiler))();
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

// Error handling
process.on('unhandledRejection', (error) => {
    console.error('Unhandled rejection:', error);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    process.exit(1);
});

// Start build with automatic retry
(async () => {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        try {
            await build();
            break;
        } catch (error) {
            attempts++;
            console.error(`Build attempt ${attempts} failed:`, error);
            if (attempts < maxAttempts) {
                console.log(`Retrying in 5 seconds...`);
                await timeout(5000);
            }
        }
    }
})();
