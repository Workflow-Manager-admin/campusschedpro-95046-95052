import { createClient } from '@supabase/supabase-js';

/**
 * Validates required environment variables for Supabase configuration
 * @throws {Error} If required environment variables are missing
 */
function validateEnvironment() {
  const missingVars = [];
  
  if (!process.env.REACT_APP_SUPABASE_URL) {
    missingVars.push('REACT_APP_SUPABASE_URL');
  }
  if (!process.env.REACT_APP_SUPABASE_ANON_KEY) {
    missingVars.push('REACT_APP_SUPABASE_ANON_KEY');
  }
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}. ` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }
}

// Validate environment variables before creating client
validateEnvironment();

// PUBLIC_INTERFACE
export const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

// PUBLIC_INTERFACE
export async function fetchCourses() {
  return await supabase.from('courses').select('*');
}

// PUBLIC_INTERFACE
export async function fetchFaculty() {
  return await supabase.from('faculty').select('*');
}

// PUBLIC_INTERFACE
export async function fetchRooms() {
  return await supabase.from('rooms').select('*');
}

/**
 * PUBLIC_INTERFACE
 * Fetches all schedule data from the 'course_schedule_view'.
 * Returns an array of schedule rows matching the current SQL schema.
 * Only selects valid, flat fields—no nested references or joined IDs.
 */
export async function fetchCourseScheduleView() {
  // View fields: update this list if the schema/view changes!
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
  const { data, error } = await supabase
    .from('course_schedule_view')
    .select(columns.join(', '));
  if (error) {
    console.error('Error fetching course_schedule_view:', error);
    throw error;
  }
  return data;
}
