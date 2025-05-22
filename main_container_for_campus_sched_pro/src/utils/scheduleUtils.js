/**
 * Utility functions for course scheduling validation and conflict detection
 */

/**
 * Check if a time slot is available for a course
 * @param {Object} schedule - Current schedule state
 * @param {string} slotId - Time slot identifier
 * @param {Object} course - Course to be scheduled
 * @returns {boolean} - Whether the slot is available
 */
export const isSlotAvailable = (schedule, slotId, course) => {
  const currentCourses = schedule[slotId] || [];
  
  // Check if slot is empty
  if (currentCourses.length === 0) {
    return true;
  }
  
  // Check for course conflicts
  return !currentCourses.some(existingCourse => {
    // Don't count the same course as a conflict
    if (existingCourse.id === course.id) {
      return false;
    }
    
    // Check for instructor conflicts
    if (existingCourse.instructor === course.instructor) {
      return true;
    }
    
    // Check for room conflicts if room is assigned
    if (existingCourse.room && course.room && existingCourse.room === course.room) {
      return true;
    }
    
    return false;
  });
};

/**
 * Find all conflicts in the current schedule
 * @param {Object} schedule - Current schedule state
 * @returns {Array} - List of conflicts found
 */
export const findScheduleConflicts = (schedule) => {
  const conflicts = [];
  
  Object.entries(schedule).forEach(([slotId, courses]) => {
    if (courses.length > 1) {
      // Check each course pair in the slot
      for (let i = 0; i < courses.length; i++) {
        for (let j = i + 1; j < courses.length; j++) {
          const course1 = courses[i];
          const course2 = courses[j];
          
          if (course1.instructor === course2.instructor) {
            conflicts.push({
              type: 'instructor',
              slotId,
              courses: [course1, course2]
            });
          }
          
          if (course1.room && course2.room && course1.room === course2.room) {
            conflicts.push({
              type: 'room',
              slotId,
              courses: [course1, course2]
            });
          }
        }
      }
    }
  });
  
  return conflicts;
};

/**
 * Format time slot ID into readable format
 * @param {string} slotId - Time slot identifier (e.g., "Monday-9:00 AM")
 * @returns {Object} - Formatted day and time
 */
export const formatSlotId = (slotId) => {
  const [day, time] = slotId.split('-');
  return { day, time };
};

/**
 * Check if a course can be moved to a new slot
 * @param {Object} schedule - Current schedule state
 * @param {string} targetSlotId - Target time slot
 * @param {Object} course - Course to be moved
 * @returns {Object} - Validation result with status and message
 */
export const validateCourseMove = (schedule, targetSlotId, course) => {
  if (!isSlotAvailable(schedule, targetSlotId, course)) {
    const { day, time } = formatSlotId(targetSlotId);
    return {
      valid: false,
      message: `Cannot move ${course.name} to ${day} at ${time} due to conflicts`
    };
  }
  
  return {
    valid: true,
    message: 'Move is valid'
  };
};
