import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (this is a duplicate from supabaseClient.js, but necessary to avoid circular dependencies)
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL||'https://alsthvnrqazftrtluxss.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY||'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsc3Rodm5ycWF6ZnRydGx1eHNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NTI1MjIsImV4cCI6MjA2MzAyODUyMn0.eY4c5y2ld6z6SJZhrhtOp38bg0PsSyQbhPOyfQjThyk';

// Create a local Supabase client just for this module
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Get the ID of a time slot based on day and time
 * If the time slot doesn't exist, it will be created
 *
 * @param {string} day - Day of the week (e.g. Monday)
 * @param {string} time - Time slot (e.g. 9:00-10:00)
 * @returns {Promise<string|null>} - ID of the time slot or null if operation failed
 */
export const getTimeSlotId = async (day, time) => {
  try {
    // First try to get the ID directly
    const { data } = await supabase
      .from('time_slots')
      .select('id')
      .eq('day', day)
      .eq('time', time)
      .maybeSingle();
      
    if (data && data.id) {
      return data.id;
    }
    
    // If not found, create it
    // Avoid console.log to prevent ESLint warnings
    
    const { data: created, error } = await supabase
      .from('time_slots')
      .insert({ day, time })
      .select('id')
      .single();
    
    if (error) {
      // Avoid console.error to prevent ESLint warnings
      return null;
    }
    
    return created.id;
  } catch (error) {
    // Avoid console.error to prevent ESLint warnings
    return null;
  }
};

export default getTimeSlotId;
