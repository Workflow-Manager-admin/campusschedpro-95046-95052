/**
 * Test Supabase Connection
 * 
 * This script tests the connection to your Supabase instance.
 * It's helpful for verifying your environment configuration.
 * 
 * Usage: 
 * 1. Ensure your .env file has REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY
 * 2. Run this script with: node testSupabaseConnection.js
 */

const { createClient } = require('@supabase/supabase-js');

// If running outside of React, make sure to load environment variables
// require('dotenv').config();

async function testConnection() {
  try {
    // Check if environment variables are set
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('⛔ ERROR: Supabase environment variables not found');
      console.error('Make sure REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY are set in your .env file');
      return false;
    }
    
    console.log('🔍 Testing connection to Supabase...');
    console.log(`URL: ${supabaseUrl}`);
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test connection by making a simple query
    const { data, error } = await supabase
      .from('departments')  // Should be one of your tables
      .select('count()')
      .limit(1)
      .single();
      
    if (error) {
      console.error('⛔ Connection failed:', error.message);
      console.error('Check your Supabase credentials and network connection.');
      return false;
    }
    
    console.log('✅ Connection successful!');
    console.log('Database is accessible and responding to queries.');
    
    // Try a more complex query to verify schema
    try {
      const { data: schemaTest, error: schemaError } = await supabase
        .from('courses')
        .select(`
          id,
          name,
          code,
          departments:department_id (name)
        `)
        .limit(1)
        .single();
        
      if (schemaError) {
        console.warn('⚠️ Schema test failed:', schemaError.message);
        console.warn('Database is accessible but schema may not be correctly set up.');
      } else {
        console.log('✅ Schema test passed!');
        console.log('Sample data:', schemaTest);
      }
    } catch (schemaTestError) {
      console.warn('⚠️ Schema test failed:', schemaTestError.message);
    }
    
    return true;
  } catch (error) {
    console.error('⛔ Unexpected error:', error.message);
    return false;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testConnection()
    .then(success => {
      if (!success) {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { testConnection };
