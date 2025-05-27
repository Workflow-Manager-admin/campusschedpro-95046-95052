import { createClient } from '@supabase/supabase-js';
import { mapArray, mapCourse, mapFaculty, mapRoom } from './dataMappers';
import { handleSupabaseError } from './supabaseErrorHandler';
import { startMonitoring, stopMonitoring, getCurrentConnectionState, ConnectionState } from './supabaseConnectionMonitor';

/**
 * Validates required environment variables for Supabase configuration
 * @throws {Error} If required environment variables are missing or invalid
 */
function validateEnvironment() {
  const requiredVars = {
    REACT_APP_SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL||,
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
// Create Supabase client with enhanced real-time capabilities
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

/**
 * Enhanced subscription creation with error handling and reconnection
 * @param {string} channelName - Unique channel name
 * @param {string} table - Table to subscribe to
 * @param {Function} callback - Callback function for changes
 * @param {Object} options - Additional subscription options
 * @returns {Object} Subscription channel
 */
const createSubscription = (channelName, table, callback, options = {}) => {
  const channel = supabase.channel(channelName);
  
  // Configure channel with postgres changes
  channel
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: table,
      ...options
    }, (payload) => {
      try {
        callback(payload);
      } catch (error) {
        console.error(`Error in ${table} subscription callback:`, error);
      }
    })
    .on('error', (error) => {
      console.error(`Channel ${channelName} error:`, error);
      // Attempt to reconnect after a delay
      setTimeout(() => {
        console.log(`Attempting to reconnect ${channelName}...`);
        channel.subscribe();
      }, 5000);
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Successfully subscribed to ${table} changes`);
      } else if (status === 'CLOSED') {
        console.log(`Subscription to ${table} closed`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`Error in ${table} subscription`);
      }
    });

  return channel;
};

// Subscribe to real-time changes for schedules
export const subscribeToSchedules = (callback) => {
  return createSubscription('schedules-changes', 'schedules', callback);
};

// Subscribe to real-time changes for room allocations
export const subscribeToRoomAllocations = (callback) => {
  return createSubscription('room-allocations-changes', 'room_allocations', callback);
};

// Subscribe to real-time changes for courses
export const subscribeToCourses = (callback) => {
  return createSubscription('courses-changes', 'courses', callback);
};

// Subscribe to real-time changes for conflicts
export const subscribeToConflicts = (callback) => {
  return createSubscription('conflicts-changes', 'schedule_conflicts', callback);
};

// Subscribe to real-time changes for faculty
export const subscribeToFaculty = (callback) => {
  return createSubscription('faculty-changes', 'faculty', callback);
};

// Subscribe to real-time changes for rooms
export const subscribeToRooms = (callback) => {
  return createSubscription('rooms-changes', 'rooms', callback);
};

// Subscribe to real-time changes for constraint violations
export const subscribeToConstraintViolations = (callback) => {
  return createSubscription('constraint-violations-changes', 'constraint_violations', callback);
};

// Subscribe to real-time changes for equipment
export const subscribeToEquipment = (callback) => {
  return createSubscription('equipment-changes', 'equipment', callback);
};

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
