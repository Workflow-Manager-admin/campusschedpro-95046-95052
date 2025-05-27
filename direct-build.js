const webpack = require('webpack');
const config = require('./webpack.basic.js');
const fs = require('fs');

// Create log file stream
const logStream = fs.createWriteStream('build.log', { flags: 'w' });

function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    logStream.write(logMessage);
    console.log(message);
}

log('Starting direct webpack build...');

// Run webpack directly
const compiler = webpack(config);

compiler.run((err, stats) => {
    if (err) {
        log(`Fatal webpack error: ${err.message}`);
        process.exit(1);
    }

    const info = stats.toJson();

    if (stats.hasErrors()) {
        log('Build errors:');
        info.errors.forEach(error => log(error.message));
        process.exit(1);
    }

    if (stats.hasWarnings()) {
        log('Build warnings:');
        info.warnings.forEach(warning => log(warning.message));
    }

    log(`Build completed successfully in ${info.time}ms`);
    compiler.close((closeErr) => {
        if (closeErr) {
            log(`Warning: Error while closing compiler: ${closeErr.message}`);
        }
        logStream.end();
    });
});
