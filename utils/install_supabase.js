#!/usr/bin/env node

/**
 * CampusSchedPro Supabase Integration Installer
 * 
 * This script helps with setting up the Supabase integration for CampusSchedPro.
 * It installs required dependencies, creates configuration files, and guides
 * you through the setup process.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

// Main paths
const utilsDir = __dirname;
const projectRoot = path.join(utilsDir, '..');
const srcDir = path.join(projectRoot, 'src');

// Utility functions
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

function copyFile(source, destination) {
  fs.copyFileSync(source, destination);
  console.log(`${colors.green}✓${colors.reset} Copied: ${destination}`);
}

function printHeader(text) {
  console.log(`\n${colors.cyan}=== ${text} ===${colors.reset}\n`);
}

function printSuccess(text) {
  console.log(`${colors.green}✓ ${text}${colors.reset}`);
}

function printWarning(text) {
  console.log(`${colors.yellow}⚠ ${text}${colors.reset}`);
}

function printError(text) {
  console.log(`${colors.red}✗ ${text}${colors.reset}`);
}

// Main installation function
async function install() {
  try {
    printHeader('CampusSchedPro Supabase Integration Installer');
    
    console.log('This script will help you set up Supabase integration for CampusSchedPro.');
    console.log('It will install required dependencies and copy necessary files.');
    
    const proceed = await prompt('Do you want to proceed? (y/n): ');
    if (proceed.toLowerCase() !== 'y') {
      console.log('Installation cancelled.');
      rl.close();
      return;
    }
    
    // Step 1: Install dependencies
    printHeader('Installing Dependencies');
    try {
      console.log('Installing @supabase/supabase-js...');
      execSync('npm install --save @supabase/supabase-js', { stdio: 'inherit', cwd: projectRoot });
      printSuccess('Installed @supabase/supabase-js');
    } catch (error) {
      printError(`Failed to install dependencies: ${error.message}`);
      printWarning('Please install @supabase/supabase-js manually.');
    }
    
    // Step 2: Create .env file if it doesn't exist
    printHeader('Setting Up Environment Variables');
    const envPath = path.join(projectRoot, '.env');
    const envExamplePath = path.join(utilsDir, 'env.example');
    
    if (!fs.existsSync(envPath)) {
      copyFile(envExamplePath, envPath);
      printSuccess('Created .env file. Please update it with your Supabase credentials.');
    } else {
      printWarning('.env file already exists. Please ensure it contains Supabase configuration.');
      console.log('Required variables:');
      console.log('  REACT_APP_SUPABASE_URL=your_supabase_url');
      console.log('  REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key');
      console.log('  REACT_APP_USE_SUPABASE=false');
    }
    
    // Step 3: Copy Supabase client to src/utils
    printHeader('Copying Supabase Client Files');
    const srcUtilsDir = path.join(srcDir, 'utils');
    
    // Create utils directory if it doesn't exist
    if (!fs.existsSync(srcUtilsDir)) {
      fs.mkdirSync(srcUtilsDir, { recursive: true });
      printSuccess('Created src/utils directory');
    }
    
    // Copy supabaseClient.js
    const supabaseClientSource = path.join(utilsDir, 'supabaseClient.js');
    const supabaseClientDest = path.join(srcUtilsDir, 'supabaseClient.js');
    copyFile(supabaseClientSource, supabaseClientDest);
    
    // Copy SupabaseScheduleContext.js
    const supabaseContextSource = path.join(utilsDir, 'SupabaseScheduleContext.js');
    const supabaseContextDest = path.join(srcUtilsDir, 'SupabaseScheduleContext.js');
    copyFile(supabaseContextSource, supabaseContextDest);
    
    // Copy test connection script
    const testScriptSource = path.join(utilsDir, 'testSupabaseConnection.js');
    const testScriptDest = path.join(projectRoot, 'testSupabaseConnection.js');
    copyFile(testScriptSource, testScriptDest);
    
    // Step 4: Create SQL directory and copy SQL files
    printHeader('Setting Up SQL Scripts');
    const sqlDir = path.join(projectRoot, 'sql');
    
    if (!fs.existsSync(sqlDir)) {
      fs.mkdirSync(sqlDir, { recursive: true });
      printSuccess('Created sql directory');
    }
    
    // Copy SQL schema
    const schemaSource = path.join(utilsDir, 'supabase_schema.sql');
    const schemaDest = path.join(sqlDir, 'schema.sql');
    copyFile(schemaSource, schemaDest);
    
    // Copy default data
    const dataSource = path.join(utilsDir, 'supabase_default_data.sql');
    const dataDest = path.join(sqlDir, 'default_data.sql');
    copyFile(dataSource, dataDest);
    
    // Step 5: Copy example files
    printHeader('Copying Example Files');
    const examplesDir = path.join(projectRoot, 'examples');
    
    if (!fs.existsSync(examplesDir)) {
      fs.mkdirSync(examplesDir, { recursive: true });
      printSuccess('Created examples directory');
    }
    
    // Copy example App
    const appExampleSource = path.join(utilsDir, 'AppWithSupabase.js');
    const appExampleDest = path.join(examplesDir, 'AppWithSupabase.js');
    copyFile(appExampleSource, appExampleDest);
    
    // Copy example component
    const componentExampleSource = path.join(utilsDir, 'SupabaseExampleComponent.js');
    const componentExampleDest = path.join(examplesDir, 'SupabaseExampleComponent.js');
    copyFile(componentExampleSource, componentExampleDest);
    
    // Step 6: Copy documentation
    printHeader('Copying Documentation');
    const docsDir = path.join(projectRoot, 'docs');
    
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
      printSuccess('Created docs directory');
    }
    
    // Copy integration guide
    const guideSource = path.join(utilsDir, 'supabase_integration_guide.md');
    const guideDest = path.join(docsDir, 'supabase_integration.md');
    copyFile(guideSource, guideDest);
    
    // Copy migration guide
    const migrationSource = path.join(utilsDir, 'component_migration_guide.md');
    const migrationDest = path.join(docsDir, 'component_migration.md');
    copyFile(migrationSource, migrationDest);
    
    // Copy deployment guide
    const deploymentSource = path.join(utilsDir, 'supabase_deployment.md');
    const deploymentDest = path.join(docsDir, 'supabase_deployment.md');
    copyFile(deploymentSource, deploymentDest);
    
    // Final instructions
    printHeader('Installation Complete');
    console.log('The Supabase integration has been set up successfully!');
    console.log('\nNext steps:');
    console.log(`${colors.yellow}1.${colors.reset} Update your .env file with your Supabase credentials`);
    console.log(`${colors.yellow}2.${colors.reset} Set up your Supabase database using the SQL scripts in the sql directory`);
    console.log(`${colors.yellow}3.${colors.reset} Test your connection by running: node testSupabaseConnection.js`);
    console.log(`${colors.yellow}4.${colors.reset} Review the documentation in the docs directory`);
    console.log(`${colors.yellow}5.${colors.reset} Start integrating Supabase into your components\n`);
    
    console.log(`For detailed instructions, refer to ${colors.cyan}docs/supabase_integration.md${colors.reset}\n`);
    
    // Ask if user wants to start using Supabase now
    const enableSupabase = await prompt('Do you want to enable Supabase now? (This will set REACT_APP_USE_SUPABASE=true in .env) (y/n): ');
    
    if (enableSupabase.toLowerCase() === 'y') {
      try {
        let envContent = fs.readFileSync(envPath, 'utf8');
        envContent = envContent.replace('REACT_APP_USE_SUPABASE=false', 'REACT_APP_USE_SUPABASE=true');
        fs.writeFileSync(envPath, envContent);
        printSuccess('Enabled Supabase integration');
        
        printWarning('Make sure your Supabase URL and anon key are correctly set in the .env file!');
      } catch (error) {
        printError(`Failed to update .env file: ${error.message}`);
        printWarning('Please manually set REACT_APP_USE_SUPABASE=true in your .env file when ready.');
      }
    } else {
      printSuccess('Supabase integration is installed but not enabled. Set REACT_APP_USE_SUPABASE=true in your .env file when ready.');
    }
    
  } catch (error) {
    printError(`Installation failed: ${error.message}`);
    console.error(error);
  } finally {
    rl.close();
  }
}

// Run the installation
install();
