/**
 * Test Supabase SQL Execution Script
 * 
 * This script tests the connection to Supabase and can execute
 * SQL statements against a Supabase project to verify they work.
 * 
 * Prerequisites:
 * - @supabase/supabase-js package installed
 * - .env file with SUPABASE_URL and SUPABASE_KEY variables
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Check for environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase environment variables.');
  console.error('Please create a .env file with SUPABASE_URL and SUPABASE_KEY');
  console.error('Or set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to read SQL file
function readSqlFile(filename) {
  try {
    const filePath = path.join(__dirname, filename);
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading file ${filename}:`, error.message);
    return null;
  }
}

// Test Supabase connection
async function testConnection() {
  try {
    // Simple query to test connection
    const { data, error } = await supabase.from('departments').select('count(*)');
    
    if (error) {
      console.error('Connection test failed:', error.message);
      console.log('Note: If the error is "relation "departments" does not exist", you need to run the schema file first.');
      return false;
    }
    
    console.log('Connection to Supabase successful!');
    return true;
  } catch (error) {
    console.error('Connection test failed:', error.message);
    return false;
  }
}

// Execute SQL query with error handling
async function executeSql(sql, description) {
  console.log(`\nExecuting ${description}...`);
  
  try {
    // Split SQL into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    console.log(`Found ${statements.length} SQL statements to execute.`);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim() + ';';
      if (stmt.length < 10) continue; // Skip very short statements
      
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      const { error } = await supabase.rpc('exec_sql', { sql_query: stmt });
      
      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error.message);
        console.error('Statement:', stmt.substring(0, 100) + '...');
        return false;
      }
    }
    
    console.log(`${description} executed successfully!`);
    return true;
  } catch (error) {
    console.error(`Error executing ${description}:`, error.message);
    return false;
  }
}

// Create a function to ask user for confirmation
function askForConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Main function
async function main() {
  console.log('CampusSchedPro Supabase SQL Tester\n');
  console.log('This script will test your SQL files with Supabase');
  console.log('---------------------------------------------------\n');
  
  console.log('Testing connection to Supabase...');
  const connected = await testConnection();
  
  if (!connected) {
    console.log('Please check your Supabase credentials and try again.');
    process.exit(1);
  }
  
  // Provide options
  console.log('\nWhat would you like to do?');
  console.log('1. Create database schema (supabase_schema.sql)');
  console.log('2. Insert sample data (supabase_default_data.sql)');
  console.log('3. Run both schema and data files');
  console.log('4. Test a custom SQL query');
  console.log('5. Exit');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('\nEnter your choice (1-5): ', async (choice) => {
    rl.close();
    
    switch (choice) {
      case '1':
        // Execute schema file
        const schemaSQL = readSqlFile('supabase_schema.sql');
        if (schemaSQL) {
          const confirmed = await askForConfirmation(
            '\nWARNING: This will create database tables and may overwrite existing tables.\nContinue? (y/n): '
          );
          
          if (confirmed) {
            await executeSql(schemaSQL, 'Database Schema Creation');
          } else {
            console.log('Schema creation cancelled.');
          }
        }
        break;
        
      case '2':
        // Execute data file
        const dataSQL = readSqlFile('supabase_default_data.sql');
        if (dataSQL) {
          const confirmed = await askForConfirmation(
            '\nWARNING: This will insert sample data and may cause conflicts with existing data.\nContinue? (y/n): '
          );
          
          if (confirmed) {
            await executeSql(dataSQL, 'Sample Data Insertion');
          } else {
            console.log('Data insertion cancelled.');
          }
        }
        break;
        
      case '3':
        // Execute both files
        const bothConfirmed = await askForConfirmation(
          '\nWARNING: This will create tables AND insert data, potentially overwriting existing data.\nContinue? (y/n): '
        );
        
        if (bothConfirmed) {
          const schemaFile = readSqlFile('supabase_schema.sql');
          if (schemaFile) {
            const schemaSuccess = await executeSql(schemaFile, 'Database Schema Creation');
            
            if (schemaSuccess) {
              const dataFile = readSqlFile('supabase_default_data.sql');
              if (dataFile) {
                await executeSql(dataFile, 'Sample Data Insertion');
              }
            }
          }
        } else {
          console.log('Operation cancelled.');
        }
        break;
        
      case '4':
        // Test custom SQL
        console.log('\nEnter your SQL query below (type "END" on a new line when finished):');
        let customSQL = '';
        
        const customRl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        customRl.on('line', (line) => {
          if (line.trim() === 'END') {
            customRl.close();
            executeSql(customSQL, 'Custom SQL Query');
          } else {
            customSQL += line + '\n';
          }
        });
        break;
        
      case '5':
        // Exit
        console.log('Exiting...');
        break;
        
      default:
        console.log('Invalid choice. Exiting.');
    }
  });
}

// Run the script
main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
