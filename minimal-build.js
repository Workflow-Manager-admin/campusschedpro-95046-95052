const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

// Logging utility
const log = {
    info: (msg) => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] INFO: ${msg}`);
        fs.appendFile('build.log', `[${timestamp}] INFO: ${msg}\n`).catch(() => {});
    },
    error: (msg) => {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] ERROR: ${msg}`);
        fs.appendFile('build.log', `[${timestamp}] ERROR: ${msg}\n`).catch(() => {});
    }
};

async function runBuild() {
    // Clear previous log
    try {
        await fs.unlink('build.log');
    } catch (e) {}

    log.info('Starting minimal build process');
    log.info(`Memory: ${JSON.stringify(process.memoryUsage())}`);

    // Set minimal environment
    const env = {
        ...process.env,
        NODE_ENV: 'production',
        INLINE_RUNTIME_CHUNK: 'false',
        GENERATE_SOURCEMAP: 'false',
        NODE_OPTIONS: '--max-old-space-size=512'
    };

    log.info('Environment configured');

    // Run react-scripts build directly
    const build = spawn('npx', ['react-scripts', 'build'], {
        env,
        stdio: ['inherit', 'pipe', 'pipe']
    });

    // Capture output
    build.stdout.on('data', (data) => {
        const output = data.toString();
        log.info(`BUILD OUTPUT: ${output}`);
    });

    build.stderr.on('data', (data) => {
        const output = data.toString();
        log.error(`BUILD ERROR: ${output}`);
    });

    return new Promise((resolve, reject) => {
        build.on('exit', (code) => {
            if (code === 0) {
                log.info('Build completed successfully');
                resolve();
            } else {
                log.error(`Build failed with code ${code}`);
                reject(new Error(`Build failed with code ${code}`));
            }
        });

        build.on('error', (err) => {
            log.error(`Build process error: ${err.message}`);
            reject(err);
        });

        // Set timeout to prevent hanging
        setTimeout(() => {
            log.error('Build timed out after 5 minutes');
            build.kill();
            reject(new Error('Build timed out'));
        }, 300000); // 5 minutes timeout
    });
}

// Update package.json to minimal configuration
const updatePackageJson = async () => {
    log.info('Updating package.json');
    const packageJson = {
        name: "react-kavia",
        version: "0.1.0",
        private: true,
        dependencies: {
            "react": "^18.2.0",
            "react-dom": "^18.2.0",
            "react-scripts": "5.0.1"
        },
        scripts: {
            "start": "react-scripts start",
            "build": "node minimal-build.js",
            "test": "react-scripts test",
            "eject": "react-scripts eject"
        }
    };

    await fs.writeFile('package.json', JSON.stringify(packageJson, null, 2));
    log.info('package.json updated');
};

// Run the build process
(async () => {
    try {
        await updatePackageJson();
        log.info('Running npm install');
        await new Promise((resolve, reject) => {
            const install = spawn('npm', ['install'], { stdio: 'inherit' });
            install.on('exit', (code) => code === 0 ? resolve() : reject());
        });
        await runBuild();
    } catch (error) {
        log.error(`Build failed: ${error.message}`);
        process.exit(1);
    }
})();
