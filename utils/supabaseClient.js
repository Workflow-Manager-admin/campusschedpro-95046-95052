import { createClient } from '@supabase/supabase-js';

// Create a single supabase client for use across the app
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Fetch all courses (flat).
 * Only fetches valid columns as per schema.
 */
// PUBLIC_INTERFACE
export const fetchCourses = async () => {
  let { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('id', { ascending: true });
  if (error) throw error;
  return data;
};

/**
 * Fetch all faculty (flat).
 * Only fetches valid columns as per schema.
 */
// PUBLIC_INTERFACE
export const fetchFaculty = async () => {
  let { data, error } = await supabase
    .from('faculty')
    .select('*')
    .order('id', { ascending: true });
  if (error) throw error;
  return data;
};

/**
 * Fetch all schedules (flat).
 * Only fetches valid columns as per schema.
 */
// PUBLIC_INTERFACE
export const fetchSchedules = async () => {
  let { data, error } = await supabase
    .from('schedule')
    .select('*')
    .order('id', { ascending: true });
  if (error) throw error;
  return data;
};

/**
 * Fetch course schedule view (for timetable rendering).
 * Only fetches valid columns as per the view.
 */
// PUBLIC_INTERFACE
export const fetchCourseScheduleView = async () => {
  let { data, error } = await supabase
    .from('course_schedule_view')
    .select('*')
    .order('id', { ascending: true });
  if (error) throw error;
  return data;
};
