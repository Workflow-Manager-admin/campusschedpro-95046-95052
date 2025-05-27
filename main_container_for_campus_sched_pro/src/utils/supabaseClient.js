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
