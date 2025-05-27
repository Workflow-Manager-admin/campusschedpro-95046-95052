const { spawn } = require('child_process');
const path = require('path');

// Set essential environment variables
process.env.DISABLE_ESLINT_PLUGIN = 'true';
process.env.DISABLE_NEW_JSX_TRANSFORM = 'true';
process.env.NODE_ENV = 'production';
process.env.CI = 'false';
process.env.NODE_OPTIONS = '--max-old-space-size=2048'; // Reduced memory usage

// Helper function to run commands
function runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
        console.log(`Running: ${command} ${args.join(' ')}`);
        
        const proc = spawn(command, args, {
            stdio: 'inherit',
            ...options
        });

        proc.on('error', (err) => {
            console.error(`Failed to start ${command}:`, err);
            reject(err);
        });

        proc.on('exit', (code, signal) => {
            if (code === 0) {
                resolve();
            } else {
                console.error(`${command} exited with code ${code}`);
                reject(new Error(`Process exited with code ${code}`));
            }
        });
    });
}

async function build() {
    try {
        // Install only production dependencies
        console.log('Installing production dependencies...');
        await runCommand('npm', ['install', '--production', '--no-audit', '--no-fund']);

        // Install dev dependencies separately
        console.log('Installing development dependencies...');
        await runCommand('npm', ['install', '--only=dev', '--no-audit', '--no-fund']);

        // Run the build
        console.log('Starting production build...');
        await runCommand('npx', ['react-scripts', 'build']);

        console.log('Build completed successfully');
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

build();
