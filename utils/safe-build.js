#!/usr/bin/env node

/**
 * Safe Build Script for CampusSchedPro with Supabase
 * 
 * This script attempts to build the project with better error handling
 * and troubleshooting guidance.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Pretty log messages
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Display a section header
function logSection(message) {
  log('\n' + '='.repeat(message.length + 4), colors.blue);
  log(`  ${message}  `, colors.blue);
  log('='.repeat(message.length + 4) + '\n', colors.blue);
}

// Check for required files and directories
function performPreBuildChecks() {
  logSection('Performing Pre-Build Checks');
  
  const checks = [
    { path: './package.json', type: 'file', name: 'package.json' },
    { path: './node_modules', type: 'dir', name: 'node_modules' },
    { path: './src', type: 'dir', name: 'src directory' },
    { path: './public', type: 'dir', name: 'public directory' },
  ];
  
  let allPassed = true;
  
  checks.forEach(({ path, type, name }) => {
    const exists = fs.existsSync(path);
    const isCorrectType = 
      (type === 'file' && exists && fs.statSync(path).isFile()) ||
      (type === 'dir' && exists && fs.statSync(path).isDirectory());
    
    if (exists && isCorrectType) {
      log(`✅ ${name} found`, colors.green);
    } else {
      log(`❌ ${name} ${exists ? 'is not a ' + type : 'not found'}`, colors.red);
      allPassed = false;
    }
  });
  
  // Check for .env file
  if (fs.existsSync('./.env')) {
    log('✅ .env file found', colors.green);
    
    // Check for Supabase environment variables
    const envContent = fs.readFileSync('./.env', 'utf-8');
    if (!envContent.includes('REACT_APP_SUPABASE_URL')) {
      log('⚠️  REACT_APP_SUPABASE_URL not found in .env', colors.yellow);
    }
    if (!envContent.includes('REACT_APP_SUPABASE_ANON_KEY')) {
      log('⚠️  REACT_APP_SUPABASE_ANON_KEY not found in .env', colors.yellow);
    }
  } else {
    log('⚠️  .env file not found - environment variables may be missing', colors.yellow);
  }
  
  // Check for Supabase dependency
  try {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
    if (packageJson.dependencies && packageJson.dependencies['@supabase/supabase-js']) {
      log('✅ @supabase/supabase-js dependency found', colors.green);
    } else {
      log('❌ @supabase/supabase-js not found in dependencies', colors.red);
      allPassed = false;
    }
  } catch (error) {
    log(`❌ Error reading package.json: ${error.message}`, colors.red);
    allPassed = false;
  }
  
  return allPassed;
}

// Clean the build directory
function cleanBuild() {
  logSection('Cleaning Previous Build');
  
  const buildDir = path.join(process.cwd(), 'build');
  
  if (fs.existsSync(buildDir)) {
    try {
      // Recursive true is needed for directories
      fs.rmSync(buildDir, { recursive: true, force: true });
      log('✅ Previous build directory removed successfully', colors.green);
    } catch (error) {
      log(`❌ Error removing build directory: ${error.message}`, colors.red);
      log('Continuing with build...', colors.yellow);
    }
  } else {
    log('✅ No previous build directory found', colors.green);
  }
}

// Run the build command with increased memory and better error handling
function runBuild() {
  logSection('Starting Build Process');
  
  log('Setting NODE_OPTIONS to increase memory limit...', colors.cyan);
  
  // Set increased memory limit
  process.env.NODE_OPTIONS = '--max_old_space_size=4096';
  
  // Create the build command
  const buildProcess = spawn('npm', ['run', 'build'], { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  
  return new Promise((resolve, reject) => {
    buildProcess.on('close', (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        reject(new Error(`Build process exited with code ${code}`));
      }
    });
    
    buildProcess.on('error', (error) => {
      reject(new Error(`Build process failed to start: ${error.message}`));
    });
  });
}

// Verify the build output
function verifyBuild() {
  logSection('Verifying Build Output');
  
  const buildDir = path.join(process.cwd(), 'build');
  
  if (!fs.existsSync(buildDir)) {
    log('❌ Build directory not found!', colors.red);
    return false;
  }
  
  // Check for critical files
  const criticalFiles = [
    { path: './build/index.html', name: 'index.html' },
    { path: './build/static', name: 'static directory' }
  ];
  
  let allPassed = true;
  
  criticalFiles.forEach(({ path, name }) => {
    if (fs.existsSync(path)) {
      log(`✅ ${name} exists in build output`, colors.green);
    } else {
      log(`❌ ${name} not found in build output`, colors.red);
      allPassed = false;
    }
  });
  
  // Check for JS and CSS files
  const staticDir = path.join(buildDir, 'static');
  if (fs.existsSync(staticDir)) {
    const hasJs = fs.existsSync(path.join(staticDir, 'js')) && 
      fs.readdirSync(path.join(staticDir, 'js')).some(file => file.endsWith('.js'));
      
    const hasCss = fs.existsSync(path.join(staticDir, 'css')) && 
      fs.readdirSync(path.join(staticDir, 'css')).some(file => file.endsWith('.css'));
    
    if (hasJs) {
      log('✅ JavaScript bundle found', colors.green);
    } else {
      log('❌ JavaScript bundle is missing', colors.red);
      allPassed = false;
    }
    
    if (hasCss) {
      log('✅ CSS bundle found', colors.green);
    } else {
      log('⚠️  CSS bundle might be missing', colors.yellow);
    }
  }
  
  return allPassed;
}

// Provide troubleshooting guidance based on error
function provideTroubleshooting(error) {
  logSection('Build Failed - Troubleshooting');
  
  log('Build Error:', colors.red);
  log(error.message, colors.red);
  
  log('\nPossible solutions:', colors.cyan);
  
  if (error.message.includes('Module not found')) {
    log('1. Missing dependency - try running: npm install', colors.yellow);
    log('2. Check import statements for typos', colors.yellow);
    log('3. Make sure all required dependencies are in package.json', colors.yellow);
  } 
  else if (error.message.includes('Unexpected token')) {
    log('1. Check for syntax errors in your code', colors.yellow);
    log('2. Make sure you\'re using compatible JavaScript syntax', colors.yellow);
    log('3. Check for mismatched brackets or quotes', colors.yellow);
  }
  else if (error.message.includes('memory')) {
    log('1. Increase Node.js memory limit further:', colors.yellow);
    log('   export NODE_OPTIONS=--max_old_space_size=8192', colors.yellow);
    log('2. Split large components into smaller ones', colors.yellow);
    log('3. Reduce bundle size using code splitting', colors.yellow);
  }
  else {
    log('1. Check the error message for specific hints', colors.yellow);
    log('2. Review any recent code changes', colors.yellow);
    log('3. Ensure all dependencies are compatible with your React version', colors.yellow);
  }
  
  log('\nFor more detailed troubleshooting:', colors.cyan);
  log('1. Check utils/BUILD_TROUBLESHOOTING.md for common solutions', colors.yellow);
  log('2. Try running the build with more debugging info:', colors.yellow);
  log('   npm run build -- --debug', colors.yellow);
  log('3. Check for linting errors:', colors.yellow);
  log('   npm run lint (if available)', colors.yellow);
}

// Main function to orchestrate the build process
async function main() {
  logSection('Safe Build Script for CampusSchedPro');
  log('This script will build the project with additional checks and error handling.\n');
  
  try {
    // Run pre-build checks
    const checksPass = performPreBuildChecks();
    if (!checksPass) {
      log('\n⚠️  Some pre-build checks failed, but attempting to build anyway...', colors.yellow);
    }
    
    // Clean previous build
    cleanBuild();
    
    // Run the build
    log('Running build command with increased memory allocation...', colors.cyan);
    await runBuild();
    
    // Verify the build output
    const buildVerified = verifyBuild();
    
    if (buildVerified) {
      logSection('Build Completed Successfully');
      log('✅ Your CampusSchedPro application has been built successfully!', colors.green);
      log('The build artifacts are located in the build/ directory.', colors.cyan);
      log('\nTo test the production build locally:', colors.cyan);
      log('npx serve -s build', colors.yellow);
    } else {
      log('\n⚠️  Build completed but some verification checks failed', colors.yellow);
      log('The application might not work correctly.', colors.yellow);
    }
    
  } catch (error) {
    logSection('Build Failed');
    log('❌ The build process encountered an error.', colors.red);
    provideTroubleshooting(error);
    process.exit(1);
  }
}

// Run the main function
main();
