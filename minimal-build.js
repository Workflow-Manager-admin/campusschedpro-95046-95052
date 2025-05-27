const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure we're in the right directory
const scriptDir = path.dirname(require.main.filename);
process.chdir(scriptDir);

// Clean up function
function cleanup() {
    const foldersToRemove = ['node_modules', 'build'];
    foldersToRemove.forEach(folder => {
        if (fs.existsSync(folder)) {
            console.log(`Removing ${folder}...`);
            fs.rmSync(folder, { recursive: true, force: true });
        }
    });
}

// Run command function
function runCommand(command, args) {
    console.log(`Running: ${command} ${args.join(' ')}`);
    const result = spawnSync(command, args, {
        stdio: 'inherit',
        env: {
            ...process.env,
            NODE_OPTIONS: '--max-old-space-size=1024',
            DISABLE_ESLINT_PLUGIN: 'true',
            DISABLE_NEW_JSX_TRANSFORM: 'true',
            NODE_ENV: 'production',
            CI: 'false'
        }
    });

    if (result.error) {
        throw result.error;
    }

    return result.status;
}

try {
    // Clean up first
    cleanup();

    // Install only the bare minimum dependencies
    const installStatus = runCommand('npm', ['ci', '--omit=dev', '--no-audit', '--no-fund', '--prefer-offline']);
    if (installStatus !== 0) {
        throw new Error('npm install failed');
    }

    // Run the build
    const buildStatus = runCommand('npx', ['react-scripts', 'build', '--no-warnings']);
    if (buildStatus !== 0) {
        throw new Error('build failed');
    }

    console.log('Build completed successfully');
} catch (error) {
    console.error('Build failed:', error);
    cleanup(); // Clean up on failure
    process.exit(1);
}
