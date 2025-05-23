#!/usr/bin/env node

/**
 * Supabase Connection Verification Script
 * 
 * This script verifies the connection to Supabase and tests basic functionality
 * by retrieving data from key tables.
 * 
 * Usage:
 * 1. Create a .env file with REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY
 * 2. Run this script with: node verify_supabase_connection.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Get Supabase configuration from environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
  console.error('\x1b[31mError: Missing Supabase environment variables\x1b[0m');
  console.log('Please create a .env file with:');
  console.log('REACT_APP_SUPABASE_URL=your_supabase_url');
  console.log('REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Format console output
const log = {
  info: (msg) => console.log(`\x1b[34m[INFO]\x1b[0m ${msg}`),
  success: (msg) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`),
  error: (msg) => console.log(`\x1b[31m[ERROR]\x1b[0m ${msg}`),
  table: (data) => console.table(data)
};

async function testConnection() {
  log.info('Testing connection to Supabase...');
  
  try {
    // Simple system check
    const { data: healthData, error: healthError } = await supabase.rpc('get_system_health');
    
    if (healthError) {
      log.error(`Connection check failed: ${healthError.message}`);
      return false;
    }
    
    log.success('Connected to Supabase successfully!');
    return true;
  } catch (error) {
    // If rpc method doesn't exist, try a simpler check
    try {
      const { error: pingError } = await supabase
        .from('departments')
        .select('count')
        .limit(1);
      
      if (pingError) {
        log.error(`Connection check failed: ${pingError.message}`);
        return false;
      }
      
      log.success('Connected to Supabase successfully!');
      return true;
    } catch (fallbackError) {
      log.error(`Connection failed: ${fallbackError.message}`);
      return false;
    }
  }
}

async function fetchTableCounts() {
  const tables = [
    'departments', 
    'buildings', 
    'rooms', 
    'faculty', 
    'courses', 
    'time_slots',
    'schedule'
  ];
  
  log.info('Checking table record counts...');
  const counts = {};
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        counts[table] = `Error: ${error.message}`;
      } else {
        counts[table] = count;
      }
    } catch (error) {
      counts[table] = `Error: ${error.message}`;
    }
  }
  
  return counts;
}

async function testQueries() {
  log.info('Testing basic queries...');
  
  // Test 1: Get all IT department courses
  try {
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select(`
        id, name, code, credits, 
        departments:department_id (name)
      `)
      .eq('departments.name', 'IT')
      .limit(5);
    
    if (coursesError) {
      log.error(`IT courses query failed: ${coursesError.message}`);
    } else {
      log.success(`Retrieved ${courses.length} IT courses`);
      if (courses.length > 0) {
        log.table(courses.map(c => ({
          code: c.code,
          name: c.name,
          credits: c.credits,
          department: c.departments?.name
        })));
      }
    }
  } catch (error) {
    log.error(`Query error: ${error.message}`);
  }
  
  // Test 2: Get course schedule view
  try {
    const { data: schedule, error: scheduleError } = await supabase
      .from('course_schedule_view')
      .select('*')
      .limit(5);
    
    if (scheduleError) {
      log.error(`Schedule view query failed: ${scheduleError.message}`);
    } else {
      log.success(`Retrieved ${schedule.length} schedule entries`);
      if (schedule.length > 0) {
        log.table(schedule.map(s => ({
          course: s.course_code,
          faculty: s.faculty_name,
          room: s.room_name,
          day: s.day,
          time: s.time
        })));
      }
    }
  } catch (error) {
    log.error(`Query error: ${error.message}`);
  }
}

async function runTests() {
  console.log('\x1b[35m=== CampusSchedPro Supabase Verification ===\x1b[0m');
  log.info(`Using Supabase URL: ${supabaseUrl.slice(0, 25)}...`);
  
  const connected = await testConnection();
  if (!connected) {
    log.error('Connection test failed. Check your credentials and try again.');
    process.exit(1);
  }
  
  const counts = await fetchTableCounts();
  log.info('Database table record counts:');
  log.table(counts);
  
  await testQueries();
  
  log.info('Verification complete!');
}

// Execute tests
runTests().catch(err => {
  log.error(`Unhandled error: ${err.message}`);
  process.exit(1);
});
