import { supabase } from './supabaseClient';

/**
 * Ensures a time slot with the given day and time exists in the database
 * Creates the time slot if it doesn't exist
 * 
 * @param {string} day - Day of the week (e.g. Monday)
 * @param {string} time - Time slot (e.g. 9:00-10:00)
 * @returns {Promise<string|null>} - ID of the time slot or null if operation failed
 */
export const ensureTimeSlotExists = async (day, time) => {
  try {
    // First, check if the time slot exists
    const { data: existing } = await supabase
      .from('time_slots')
      .select('id')
      .eq('day', day)
      .eq('time', time)
      .maybeSingle();
    
    if (existing && existing.id) {
      console.log(`Found existing time slot for ${day}-${time}: ${existing.id}`);
      return existing.id;
    }
    
    // Time slot doesn't exist, create it
    console.log(`Creating time slot for ${day}-${time}`);
    
    const { data: created, error } = await supabase
      .from('time_slots')
      .insert({ day, time })
      .select('id')
      .single();
    
    if (error) {
      console.error('Failed to create time slot:', error);
      return null;
    }
    
    console.log(`Created time slot for ${day}-${time}: ${created.id}`);
    return created.id;
  } catch (error) {
    console.error('Error in ensureTimeSlotExists:', error);
    return null;
  }
};

/**
 * Safer version of getTimeSlotId that handles potential errors
 * and ensures the time slot exists
 * 
 * @param {string} day - Day of the week 
 * @param {string} time - Time slot
 * @returns {Promise<string|null>} - ID of the time slot or null if operation failed
 */
export const safeGetTimeSlotId = async (day, time) => {
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
    return await ensureTimeSlotExists(day, time);
  } catch (error) {
    console.error('Error in safeGetTimeSlotId:', error);
    return null;
  }
};
