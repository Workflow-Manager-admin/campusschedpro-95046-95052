/**
 * Utility functions for faculty management operations
 */

/**
 * Calculate faculty teaching load based on assigned courses
 * @param {Array} assignedCourses - List of courses assigned to faculty
 * @returns {Object} Teaching load statistics
 */
export const calculateTeachingLoad = (assignedCourses) => {
  return {
    totalCourses: assignedCourses.length,
    totalCredits: assignedCourses.reduce((sum, course) => sum + course.credits, 0),
    hoursPerWeek: assignedCourses.length * 3, // Assuming 3 hours per course
  };
};

/**
 * Check if faculty is available for a given time slot
 * @param {string} slotId - Time slot identifier
 * @param {Array} currentSchedule - Faculty's current schedule
 * @returns {boolean} Whether faculty is available
 */
export const isFacultyAvailable = (slotId, currentSchedule) => {
  return !currentSchedule.some(slot => slot === slotId);
};

/**
 * Validate faculty course assignment
 * @param {Object} faculty - Faculty member details
 * @param {Object} course - Course to be assigned
 * @param {Array} assignedCourses - Currently assigned courses
 * @returns {Object} Validation result
 */
export const validateCourseAssignment = (faculty, course, assignedCourses) => {
  const currentLoad = calculateTeachingLoad(assignedCourses);
  
  // Check maximum courses (assuming max 4 courses per faculty)
  if (currentLoad.totalCourses >= 4) {
    return {
      valid: false,
      message: `${faculty.name} has reached maximum course load (4 courses)`
    };
  }

  // Check if already teaching this course
  if (assignedCourses.some(c => c.code === course.code)) {
    return {
      valid: false,
      message: `${faculty.name} is already assigned to ${course.code}`
    };
  }

  // Check expertise match (if specified)
  if (faculty.expertise && course.area && !faculty.expertise.includes(course.area)) {
    return {
      valid: false,
      message: `${course.code} does not match ${faculty.name}'s expertise areas`
    };
  }

  return {
    valid: true,
    message: 'Assignment is valid'
  };
};

/**
 * Format faculty status based on current assignments
 * @param {Object} faculty - Faculty member details
 * @param {Array} assignedCourses - Currently assigned courses
 * @returns {Object} Formatted status
 */
export const getFacultyStatus = (faculty, assignedCourses) => {
  const load = calculateTeachingLoad(assignedCourses);
  
  return {
    ...faculty,
    status: load.totalCourses === 0 ? 'Available' : 
            load.totalCourses >= 4 ? 'Fully Booked' : 'Partially Booked',
    load,
    assignments: assignedCourses
  };
};
