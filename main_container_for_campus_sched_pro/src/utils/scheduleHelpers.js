import { supabase } from './supabaseClient';
import { safeGetTimeSlotId } from './timeSlotUtils';

/**
 * Safely schedule a course in a time slot
 * Creates any missing prerequisites like time slots
 * 
 * @param {string} courseId - ID of the course
 * @param {string|null} facultyId - ID of the faculty (optional)
 * @param {string|null} roomId - ID of the room (optional)
 * @param {string} day - Day of the week (e.g. Monday)
 * @param {string} time - Time slot (e.g. 9:00-10:00)
 * @returns {Promise<{success: boolean, message: string}>} - Result object
 */
export const safeScheduleCourse = async (courseId, facultyId, roomId, day, time) => {
  try {
    if (!courseId) {
      return { success: false, message: 'Course ID is required' };
    }
    
    // Make sure we have a valid time slot ID
    const timeSlotId = await safeGetTimeSlotId(day, time);
    
    if (!timeSlotId) {
      return { 
        success: false, 
        message: `Could not get or create time slot for ${day}-${time}` 
      };
    }
    
    // Check if this course is already scheduled in this time slot
    const { data: existing } = await supabase
      .from('schedule')
      .select('id')
      .eq('course_id', courseId)
      .eq('time_slot_id', timeSlotId)
      .maybeSingle();
    
    if (existing) {
      // Update existing schedule
      const { error } = await supabase
        .from('schedule')
        .update({ faculty_id: facultyId, room_id: roomId })
        .eq('id', existing.id);
      
      if (error) {
        console.error('Error updating schedule:', error);
        return { 
          success: false, 
          message: `Failed to update schedule: ${error.message}` 
        };
      }
    } else {
      // Insert new schedule
      const { error } = await supabase
        .from('schedule')
        .insert({
          course_id: courseId,
          faculty_id: facultyId,
          room_id: roomId,
          time_slot_id: timeSlotId
        });
      
      if (error) {
        console.error('Error inserting schedule:', error);
        return { 
          success: false, 
          message: `Failed to create schedule: ${error.message}` 
        };
      }
    }
    
    return { 
      success: true, 
      message: `Successfully scheduled course for ${day}-${time}` 
    };
  } catch (error) {
    console.error('Error in safeScheduleCourse:', error);
    return { 
      success: false, 
      message: `Unexpected error: ${error.message}` 
    };
  }
};

/**
 * Helper function to unschedule a course from a time slot
 * 
 * @param {string} courseId - ID of the course
 * @param {string} day - Day of the week
 * @param {string} time - Time slot
 * @returns {Promise<{success: boolean, message: string}>} - Result object
 */
export const safeUnscheduleCourse = async (courseId, day, time) => {
  try {
    if (!courseId) {
      return { success: false, message: 'Course ID is required' };
    }
    
    // Get time slot ID
    const { data: timeSlot } = await supabase
      .from('time_slots')
      .select('id')
      .eq('day', day)
      .eq('time', time)
      .maybeSingle();
    
    if (!timeSlot) {
      return { 
        success: false, 
        message: `Time slot not found for ${day}-${time}` 
      };
    }
    
    // Delete the schedule entry
    const { error } = await supabase
      .from('schedule')
      .delete()
      .eq('course_id', courseId)
      .eq('time_slot_id', timeSlot.id);
    
    if (error) {
      console.error('Error removing course from schedule:', error);
      return { 
        success: false, 
        message: `Failed to remove course from schedule: ${error.message}` 
      };
    }
    
    return { 
      success: true, 
      message: `Successfully removed course from ${day}-${time}` 
    };
  } catch (error) {
    console.error('Error in safeUnscheduleCourse:', error);
    return { 
      success: false, 
      message: `Unexpected error: ${error.message}` 
    };
  }
};
