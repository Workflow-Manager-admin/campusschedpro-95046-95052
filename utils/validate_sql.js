/**
 * SQL Validation Script for CampusSchedPro
 * 
 * This script validates the syntax of SQL files without requiring a complete build
 * of the React application. It performs basic syntax checks on the SQL files.
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Paths to SQL files
const schemaFilePath = path.join(__dirname, 'supabase_schema.sql');
const dataFilePath = path.join(__dirname, 'supabase_default_data.sql');

/**
 * Check if a file exists
 * @param {string} filePath - Path to file
 * @returns {boolean}
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    console.error(`Error checking file existence: ${err.message}`);
    return false;
  }
}

/**
 * Basic SQL syntax validation using Node.js
 * @param {string} filePath - Path to SQL file
 * @returns {Promise<boolean>}
 */
function validateSqlSyntax(filePath) {
  return new Promise((resolve) => {
    // Basic syntax checks
    try {
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Check for basic syntax issues
      const problems = [];
      
      // Check for unbalanced parentheses
      const openParens = (sql.match(/\(/g) || []).length;
      const closeParens = (sql.match(/\)/g) || []).length;
      if (openParens !== closeParens) {
        problems.push(`Unbalanced parentheses: ${openParens} opening vs ${closeParens} closing`);
      }
      
      // Check for unclosed quotes
      const singleQuotes = (sql.match(/'/g) || []).length;
      if (singleQuotes % 2 !== 0) {
        problems.push(`Odd number of single quotes: ${singleQuotes}`);
      }
      
      // Check for missing semicolons after statements
      const statements = sql.split(';').length - 1;
      const createStatements = (sql.match(/CREATE\s+TABLE/gi) || []).length;
      const insertStatements = (sql.match(/INSERT\s+INTO/gi) || []).length;
      
      if (statements < (createStatements + insertStatements)) {
        problems.push(`Possible missing semicolons: found ${statements} semicolons but ${createStatements + insertStatements} CREATE/INSERT statements`);
      }
      
      if (problems.length > 0) {
        console.error(`Syntax issues in ${path.basename(filePath)}:`);
        problems.forEach(problem => console.error(` - ${problem}`));
        resolve(false);
      } else {
        console.log(`Basic syntax check passed for ${path.basename(filePath)}`);
        resolve(true);
      }
    } catch (err) {
      console.error(`Error reading/processing ${path.basename(filePath)}: ${err.message}`);
      resolve(false);
    }
  });
}

/**
 * Main validation function
 */
async function validateSqlFiles() {
  console.log('Validating SQL files for CampusSchedPro...');
  
  // Check if files exist
  if (!fileExists(schemaFilePath)) {
    console.error(`Schema file not found: ${schemaFilePath}`);
    return;
  }
  
  if (!fileExists(dataFilePath)) {
    console.error(`Data file not found: ${dataFilePath}`);
    return;
  }
  
  console.log('Found SQL files. Checking for basic syntax issues...');
  
  // Perform basic syntax validation
  const schemaValid = await validateSqlSyntax(schemaFilePath);
  const dataValid = await validateSqlSyntax(dataFilePath);
  
  if (schemaValid && dataValid) {
    console.log('\nSQL validation summary:');
    console.log('---------------------');
    console.log('✅ Schema file (supabase_schema.sql) passes basic syntax checks');
    console.log('✅ Data file (supabase_default_data.sql) passes basic syntax checks');
    console.log('\nThese files appear ready for use with Supabase. Remember to:');
    console.log('1. Run schema.sql first to create the database structure');
    console.log('2. Then run default_data.sql to populate with sample data');
    console.log('\nNote: This validation is basic and does not replace testing in a real PostgreSQL environment.');
  } else {
    console.log('\nSQL validation summary:');
    console.log('---------------------');
    console.log(`${schemaValid ? '✅' : '❌'} Schema file (supabase_schema.sql)`);
    console.log(`${dataValid ? '✅' : '❌'} Data file (supabase_default_data.sql)`);
    console.log('\nPlease fix the reported issues before using these files with Supabase.');
  }
}

// Run validation
validateSqlFiles();
