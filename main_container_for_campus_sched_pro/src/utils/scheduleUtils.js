/**
 * Utility functions for course scheduling validation, conflict detection and resolution
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
              id: `instructor-${slotId}-${course1.id}-${course2.id}`,
              type: 'instructor',
              slotId,
              courses: [course1, course2],
              message: `Instructor ${course1.instructor} is scheduled for both ${course1.code} and ${course2.code} at the same time (${slotId})`
            });
          }
          
          if (course1.room && course2.room && course1.room === course2.room) {
            conflicts.push({
              id: `room-${slotId}-${course1.id}-${course2.id}`,
              type: 'room',
              slotId,
              courses: [course1, course2],
              message: `Room ${course1.room} is double-booked for ${course1.code} and ${course2.code} at the same time (${slotId})`
            });
          }
        }
      }
    }
  });
  
  return conflicts;
};

/**
 * Find available time slots for a course based on instructor availability
 * @param {Object} schedule - Current schedule state
 * @param {Object} course - Course to find slots for
 * @param {Array} days - Array of days to check
 * @param {Array} times - Array of times to check
 * @returns {Array} - List of available slot IDs
 */
export const findAvailableTimeSlots = (schedule, course, days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], times = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM']) => {
  const availableSlots = [];
  
  days.forEach(day => {
    times.forEach(time => {
      const slotId = `${day}-${time}`;
      if (isSlotAvailable(schedule, slotId, course)) {
        availableSlots.push(slotId);
      }
    });
  });
  
  return availableSlots;
};

/**
 * Suggest alternative time slots for a course to resolve conflicts
 * @param {Object} schedule - Current schedule state
 * @param {Object} course - Course to find alternative slots for
 * @param {string} currentSlotId - Current slot ID where conflict exists
 * @returns {Array} - List of suggested alternative slot IDs
 */
export const suggestAlternativeTimeSlots = (schedule, course, currentSlotId) => {
  const { day } = formatSlotId(currentSlotId);
  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const allTimes = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];
  
  // Try to find slots on the same day first
  const sameDayOptions = findAvailableTimeSlots(schedule, course, [day], allTimes);
  
  // If no options on same day, try other days
  if (sameDayOptions.length === 0) {
    const otherDays = allDays.filter(d => d !== day);
    return findAvailableTimeSlots(schedule, course, otherDays, allTimes);
  }
  
  return sameDayOptions;
};

/**
 * Create a student-specific view of the schedule
 * @param {Object} schedule - Full schedule with all courses
 * @param {Array} enrolledCourseIds - List of course IDs the student is enrolled in
 * @returns {Object} - Schedule filtered to show only the student's courses
 */
export const getStudentSchedule = (schedule, enrolledCourseIds) => {
  const studentSchedule = {};
  
  Object.entries(schedule).forEach(([slotId, courses]) => {
    const studentCourses = courses.filter(course => 
      enrolledCourseIds.includes(course.id)
    );
    
    if (studentCourses.length > 0) {
      studentSchedule[slotId] = studentCourses;
    }
  });
  
  return studentSchedule;
};

/**
 * Generate a printable version of the schedule
 * @param {Object} schedule - Schedule to format
 * @returns {Object} - Formatted schedule by day and time
 */
export const formatPrintableSchedule = (schedule) => {
  const formatted = {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: []
  };
  
  Object.entries(schedule).forEach(([slotId, courses]) => {
    const { day, time } = formatSlotId(slotId);
    
    courses.forEach(course => {
      formatted[day].push({
        time,
        course: `${course.code} - ${course.name}`,
        instructor: course.instructor,
        room: course.room || 'TBA'
      });
    });
  });
  
  // Sort each day's schedule by time
  Object.keys(formatted).forEach(day => {
    formatted[day].sort((a, b) => {
      // Convert times to comparable format (assuming AM/PM format)
      const timeA = a.time.replace('AM', '0').replace('PM', '1');
      const timeB = b.time.replace('AM', '0').replace('PM', '1');
      return timeA.localeCompare(timeB);
    });
  });
  
  return formatted;
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
