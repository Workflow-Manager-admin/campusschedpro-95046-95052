import { createClient } from '@supabase/supabase-js';

// PUBLIC_INTERFACE
export const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

/**
 * Example: fetch all courses.
 * Usage: const { data, error } = await fetchCourses();
 */
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
 */
export async function fetchCourseScheduleView() {
  // Update the columns below if the view schema changes.
  const columns = [
    "schedule_id",
    "course_id",
    "course_code",
    "course_name",
    "faculty_id",
    "faculty_name",
    "room_id",
    "room_name",
    "day_of_week",
    "time_slot",
    "semester",
    "academic_year",
    "batch",
    "section",
    "equipment_needed"
  ];
  // Query the view and select the relevant columns
  const { data, error } = await supabase
    .from('course_schedule_view')
    .select(columns.join(', '));
  if (error) {
    console.error('Error fetching course schedule view:', error);
    throw error;
  }
  return data;
}
