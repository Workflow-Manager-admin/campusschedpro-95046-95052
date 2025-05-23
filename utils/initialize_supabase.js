#!/usr/bin/env node

/**
 * Supabase Initialization Script for CampusSchedPro
 * 
 * This script helps initialize a Supabase project with the required schema and seed data.
 * It reads the SQL files and executes them against your Supabase instance.
 * 
 * Requires: @supabase/supabase-js, dotenv, fs
 * 
 * Usage:
 * 1. Create a .env file with your Supabase credentials
 * 2. Run: node initialize_supabase.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration
const SCHEMA_FILE = path.join(__dirname, 'supabase_schema.sql');
const DATA_FILE = path.join(__dirname, 'supabase_default_data.sql');
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('\x1b[31mError: Missing environment variables\x1b[0m');
  console.log('Please create a .env file with the following variables:');
  console.log('REACT_APP_SUPABASE_URL=your_supabase_url');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

// Initialize Supabase client with service role key (has full DB access)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function executeSQL(filePath, description) {
  try {
    console.log(`\x1b[34m[INFO]\x1b[0m Reading ${description} file...`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    console.log(`\x1b[34m[INFO]\x1b[0m Executing ${description} SQL...`);
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error(`\x1b[31m[ERROR]\x1b[0m Failed to execute ${description}: ${error.message}`);
      return false;
    }
    
    console.log(`\x1b[32m[SUCCESS]\x1b[0m ${description} executed successfully!`);
    return true;
  } catch (error) {
    console.error(`\x1b[31m[ERROR]\x1b[0m Failed to process ${description}: ${error.message}`);
    return false;
  }
}

async function initializeSupabase() {
  console.log('\x1b[35m=== CampusSchedPro Supabase Initialization ===\x1b[0m');
  console.log(`\x1b[34m[INFO]\x1b[0m Connecting to Supabase at ${SUPABASE_URL}...`);
  
  // Execute schema first
  const schemaSuccess = await executeSQL(SCHEMA_FILE, 'schema');
  if (!schemaSuccess) {
    console.error('\x1b[31m[ERROR]\x1b[0m Schema setup failed, aborting.');
    process.exit(1);
  }
  
  // Then execute data if schema was successful
  const dataSuccess = await executeSQL(DATA_FILE, 'seed data');
  if (!dataSuccess) {
    console.error('\x1b[31m[ERROR]\x1b[0m Seed data setup failed.');
    process.exit(1);
  }
  
  console.log('\x1b[32m[SUCCESS]\x1b[0m Supabase initialization completed successfully!');
  console.log('\x1b[35m=== Next Steps ===\x1b[0m');
  console.log('1. Configure your React app with Supabase URL and anon key');
  console.log('2. Update ScheduleContext to use Supabase instead of localStorage');
  console.log('3. Test the application to ensure data is properly saved and retrieved');
}

// Execute main function
initializeSupabase().catch(error => {
  console.error('\x1b[31m[ERROR]\x1b[0m Unexpected error:', error);
  process.exit(1);
});
