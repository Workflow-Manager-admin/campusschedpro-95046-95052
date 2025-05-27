/**
 * Utility functions for schedule manipulation and time slot management
 */

/**
 * Suggests alternative time slots for a course that avoid conflicts
 * @param {Object} schedule - Current schedule
 * @param {Object} course - Course to find slots for
 * @param {string} currentSlotId - Current slot ID to avoid
 * @returns {Array<string>} Array of possible slot IDs
 */
export function suggestAlternativeTimeSlots(schedule, course, currentSlotId) {
  const possibleSlots = [];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const times = ['9:00-10:30', '10:30-12:00', '13:00-14:30', '14:30-16:00', '16:00-17:30'];
  
  // Generate all possible slot IDs
  for (const day of days) {
    for (const time of times) {
      const slotId = `${day}-${time}`;
      
      // Skip current slot
      if (slotId === currentSlotId) continue;
      
      // Check if slot exists and has no conflicts
      const coursesInSlot = schedule[slotId] || [];
      
      // Check for instructor conflicts
      const hasInstructorConflict = coursesInSlot.some(c => 
        c.instructor === course.instructor
      );
      
      // Check for room conflicts
      const hasRoomConflict = coursesInSlot.some(c => 
        c.room === course.room
      );
      
      // If no conflicts, add to possible slots
      if (!hasInstructorConflict && !hasRoomConflict) {
        possibleSlots.push(slotId);
      }
    }
  }
  
  return possibleSlots;
}

/**
 * Formats a slot ID into a readable day and time object
 * @param {string} slotId - Slot ID in format "day-time"
 * @returns {Object} Object with day and time properties
 */
export function formatSlotId(slotId) {
  const [day, time] = slotId.split('-');
  return { day, time };
}

/**
 * Checks if a time slot is available for a course
 * @param {Object} schedule - Current schedule
 * @param {string} slotId - Slot ID to check
 * @param {Object} course - Course to check for
 * @returns {boolean} True if slot is available
 */
export function isSlotAvailable(schedule, slotId, course) {
  const coursesInSlot = schedule[slotId] || [];
  
  // Check for instructor conflicts
  const hasInstructorConflict = coursesInSlot.some(c => 
    c.instructor === course.instructor
  );
  
  // Check for room conflicts
  const hasRoomConflict = coursesInSlot.some(c => 
    c.room === course.room
  );
  
  return !hasInstructorConflict && !hasRoomConflict;
}

/**
 * Gets all courses scheduled in a specific time slot
 * @param {Object} schedule - Current schedule
 * @param {string} slotId - Slot ID to check
 * @returns {Array} Array of courses in the slot
 */
export function getCoursesInSlot(schedule, slotId) {
  return schedule[slotId] || [];
}
