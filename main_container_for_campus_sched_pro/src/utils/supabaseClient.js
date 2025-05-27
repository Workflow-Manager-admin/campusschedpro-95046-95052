import { createClient } from '@supabase/supabase-js';

// PUBLIC_INTERFACE
export const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL||'https://alsthvnrqazftrtluxss.supabase.co',
  process.env.REACT_APP_SUPABASE_ANON_KEY||'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsc3Rodm5ycWF6ZnRydGx1eHNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NTI1MjIsImV4cCI6MjA2MzAyODUyMn0.eY4c5y2ld6z6SJZhrhtOp38bg0PsSyQbhPOyfQjThyk'
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
