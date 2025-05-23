import { supabase } from './supabaseClient';

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
    console.error('Error in getTimeSlotId:', error);
    return null;
  }
};

export default getTimeSlotId;
