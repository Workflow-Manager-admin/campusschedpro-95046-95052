/**
 * CampusSchedPro Supabase Integration React Installer
 * 
 * Run this installer with:
 * node reactInstaller.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Print colored text
function print(text, color) {
  console.log(`${color || ''}${text}${colors.reset}`);
}

// Get user input
function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

// Copy a file with error handling
function copyFile(src, dest) {
  try {
    fs.copyFileSync(src, dest);
    print(`✓ Copied: ${path.basename(src)} → ${dest}`, colors.green);
    return true;
  } catch (err) {
    print(`✗ Failed to copy ${path.basename(src)}: ${err.message}`, colors.red);
    return false;
  }
}

// Ensure a directory exists
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      print(`✓ Created directory: ${dir}`, colors.green);
    } catch (err) {
      print(`✗ Failed to create directory ${dir}: ${err.message}`, colors.red);
    }
  }
}

// Check if we're in a React project
function isReactProject() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    return !!(packageJson.dependencies && (packageJson.dependencies.react || packageJson.dependencies['react-dom']));
  } catch (err) {
    return false;
  }
}

// Install dependencies
function installDependencies() {
  try {
    print('\nInstalling @supabase/supabase-js...', colors.blue);
    execSync('npm install --save @supabase/supabase-js', { stdio: 'inherit' });
    print('✓ Installed @supabase/supabase-js', colors.green);
    return true;
  } catch (err) {
    print(`✗ Failed to install dependencies: ${err.message}`, colors.red);
    return false;
  }
}

// Create .env file if it doesn't exist
function createEnvFile() {
  const envPath = './.env';
  
  if (!fs.existsSync(envPath)) {
    try {
      fs.writeFileSync(envPath, `# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-goes-here

# Feature Flag - Set to 'true' to use Supabase, 'false' to use localStorage
REACT_APP_USE_SUPABASE=false
`);
      print('✓ Created .env file', colors.green);
      return true;
    } catch (err) {
      print(`✗ Failed to create .env file: ${err.message}`, colors.red);
      return false;
    }
  } else {
    print('⚠ .env file already exists', colors.yellow);
    print('Please ensure it contains Supabase configuration variables', colors.yellow);
    return true;
  }
}

// Main installation function
async function install() {
  print('\n================================', colors.blue);
  print('= CampusSchedPro Supabase Setup =', colors.blue);
  print('================================\n', colors.blue);
  
  // Check if we're in a React project
  if (!isReactProject()) {
    print('✗ This does not appear to be a React project', colors.red);
    print('Please run this installer from your React project root directory', colors.yellow);
    return false;
  }
  
  print('✓ React project detected', colors.green);
  
  // Confirm installation
  const confirm = await prompt('This will install Supabase integration files. Continue? (y/n): ');
  if (confirm.toLowerCase() !== 'y') {
    print('Installation cancelled', colors.yellow);
    return false;
  }
  
  // Install dependencies
  const depsInstalled = installDependencies();
  if (!depsInstalled) {
    print('⚠ Dependency installation failed, but continuing with file setup', colors.yellow);
  }
  
  // Create directories
  ensureDir('./src/utils');
  ensureDir('./sql');
  ensureDir('./docs');
  
  // Copy Supabase client files
  const utilsDir = path.join(__dirname);
  
  // Core utilities
  copyFile(path.join(utilsDir, 'supabaseClient.js'), './src/utils/supabaseClient.js');
  copyFile(path.join(utilsDir, 'SupabaseScheduleContext.js'), './src/utils/SupabaseScheduleContext.js');
  copyFile(path.join(utilsDir, 'migrateLocalStorageToSupabase.js'), './src/utils/migrateLocalStorageToSupabase.js');
  
  // SQL scripts
  copyFile(path.join(utilsDir, 'supabase_schema.sql'), './sql/schema.sql');
  copyFile(path.join(utilsDir, 'supabase_default_data.sql'), './sql/default_data.sql');
  
  // Documentation
  copyFile(path.join(utilsDir, 'INSTALLATION_GUIDE.md'), './docs/INSTALLATION_GUIDE.md');
  copyFile(path.join(utilsDir, 'supabase_integration_guide.md'), './docs/supabase_integration_guide.md');
  copyFile(path.join(utilsDir, 'component_migration_guide.md'), './docs/component_migration_guide.md');
  
  // Testing tools
  copyFile(path.join(utilsDir, 'testSupabaseConnection.js'), './testSupabaseConnection.js');
  copyFile(path.join(utilsDir, 'supabase_connection_tester.html'), './connection_tester.html');
  
  // Create .env file
  createEnvFile();
  
  // Update package.json to include Supabase script
  try {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    if (!packageJson.scripts.supabase) {
      packageJson.scripts.supabase = 'node -r dotenv/config testSupabaseConnection.js';
      fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2));
      print('✓ Added supabase test script to package.json', colors.green);
    }
  } catch (err) {
    print(`⚠ Could not update package.json: ${err.message}`, colors.yellow);
  }
  
  // Success message
  print('\n=== Supabase integration files installed successfully ===', colors.green);
  
  print('\nNext steps:', colors.blue);
  print('1. Create a Supabase project at https://supabase.com');
  print('2. Update the .env file with your Supabase credentials');
  print('3. Run the SQL scripts in the Supabase SQL Editor');
  print('4. Test your connection with: npm run supabase');
  print('5. Follow the integration guide in docs/supabase_integration_guide.md');
  
  print('\nFor more information, see:', colors.blue);
  print('docs/INSTALLATION_GUIDE.md');
  print('docs/component_migration_guide.md');
  
  return true;
}

// Run the installer
install().then(success => {
  if (!success) {
    process.exit(1);
  }
});
