import { createClient } from '@supabase/supabase-js';
import { handleSupabaseError } from './supabaseErrorHandler';
import { startMonitoring, stopMonitoring, getCurrentConnectionState, ConnectionState } from './supabaseConnectionMonitor';

/**
 * Validates required environment variables for Supabase configuration
 * @throws {Error} If required environment variables are missing or invalid
 */
function validateEnvironment() {
  const requiredVars = {
    REACT_APP_SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL,
    REACT_APP_SUPABASE_ANON_KEY: process.env.REACT_APP_SUPABASE_ANON_KEY
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}. ` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }

  // Validate URL format
  try {
    new URL(process.env.REACT_APP_SUPABASE_URL);
  } catch (error) {
    throw new Error('Invalid REACT_APP_SUPABASE_URL format. Please provide a valid URL.');
  }

  // Validate anon key format (basic check)
  if (!/^[a-zA-Z0-9._-]+$/.test(process.env.REACT_APP_SUPABASE_ANON_KEY)) {
    throw new Error('Invalid REACT_APP_SUPABASE_ANON_KEY format.');
  }
}

// Validate environment variables before creating client
validateEnvironment();

// Create Supabase client
export const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

// Start connection monitoring
startMonitoring();

/**
 * Wraps a Supabase query with error handling and connection checking
 * @param {Function} queryFn Function that performs the Supabase query
 * @param {string} context Context for error messages
 * @returns {Promise<Object>} Query result or error
 */
async function withErrorHandling(queryFn, context) {
  // Check connection state
  if (getCurrentConnectionState() === ConnectionState.DISCONNECTED) {
    throw new Error('Database connection is currently unavailable. Please try again later.');
  }

  try {
    const result = await queryFn();
    
    if (result.error) {
      const handledError = handleSupabaseError(result.error, context);
      throw new Error(handledError.message);
    }
    
    return result.data;
  } catch (error) {
    const handledError = handleSupabaseError(error, context);
    throw new Error(handledError.message);
  }
}

/**
 * PUBLIC_INTERFACE
 * Fetches all courses from the database
 * @returns {Promise<Array>} Array of courses
 */
export async function fetchCourses() {
  return await withErrorHandling(
    async () => {
      const { data } = await supabase
        .from('courses')
        .select(`
          *,
          faculty:schedule(faculty(*)),
          department:department_id(name),
          academic_year:academic_year_id(name),
          required_equipment:course_equipment(equipment:equipment_id(name))
        `);
      return mapArray(data, mapCourse);
    },
    'Fetching courses'
  );
}

/**
 * PUBLIC_INTERFACE
 * Fetches all faculty members from the database
 * @returns {Promise<Array>} Array of faculty members
 */
export async function fetchFaculty() {
  return await withErrorHandling(
    async () => {
      const { data } = await supabase
        .from('faculty')
        .select(`
          *,
          department:department_id(name),
          expertise:faculty_expertise(expertise),
          assignments:schedule(
            course:course_id(id, code, name),
            time_slot:time_slot_id(*)
          )
        `);
      return mapArray(data, mapFaculty);
    },
    'Fetching faculty'
  );
}

/**
 * PUBLIC_INTERFACE
 * Fetches all rooms from the database
 * @returns {Promise<Array>} Array of rooms
 */
export async function fetchRooms() {
  return await withErrorHandling(
    async () => {
      const { data } = await supabase
        .from('rooms')
        .select(`
          *,
          building:building_id(name),
          equipment:room_equipment(equipment:equipment_id(name))
        `);
      return mapArray(data, mapRoom);
    },
    'Fetching rooms'
  );
}

/**
 * PUBLIC_INTERFACE
 * Fetches the complete course schedule view
 * @returns {Promise<Array>} Array of schedule entries
 */
export async function fetchCourseScheduleView() {
  const columns = [
    "schedule_id",
    "year_label",
    "semester",
    "course_code",
    "course_name",
    "department",
    "faculty_name",
    "room_name",
    "room_type",
    "room_location",
    "day_of_week",
    "slot_label",
    "start_time",
    "end_time",
    "scheduled_date",
    "equipment_assigned",
    "remarks"
  ];

  return await withErrorHandling(
    () => supabase
      .from('course_schedule_view')
      .select(columns.join(', ')),
    'Fetching course schedule'
  );
}

/**
 * Clean up function to be called when the application unmounts
 */
export function cleanup() {
  stopMonitoring();
}

// Automatically clean up when the module is hot reloaded
if (module.hot) {
  module.hot.dispose(cleanup);
}
