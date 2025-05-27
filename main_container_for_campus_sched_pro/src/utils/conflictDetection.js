/**
 * Utility functions for detecting and analyzing schedule conflicts
 */

/**
 * Detects scheduling conflicts in the given schedule
 * @param {Object} schedule - Schedule object with time slots as keys and arrays of courses as values
 * @returns {Array} Array of conflict objects
 */
export function detectConflicts(schedule) {
  const conflicts = [];
  let conflictId = 1;

  // Helper function to create conflict object
  const createConflict = (type, slotId, courses, message) => ({
    id: conflictId++,
    type,
    slotId,
    courses,
    message
  });

  // Iterate through each time slot
  Object.entries(schedule).forEach(([slotId, courses]) => {
    if (!Array.isArray(courses) || courses.length < 2) return;

    // Check for instructor conflicts
    const instructorGroups = {};
    courses.forEach(course => {
      if (course.instructor) {
        if (!instructorGroups[course.instructor]) {
          instructorGroups[course.instructor] = [];
        }
        instructorGroups[course.instructor].push(course);
      }
    });

    Object.entries(instructorGroups).forEach(([instructor, instructorCourses]) => {
      if (instructorCourses.length > 1) {
        conflicts.push(createConflict(
          'instructor',
          slotId,
          instructorCourses,
          `Instructor "${instructor}" is scheduled for multiple courses in the same time slot`
        ));
      }
    });

    // Check for room conflicts
    const roomGroups = {};
    courses.forEach(course => {
      if (course.room) {
        if (!roomGroups[course.room]) {
          roomGroups[course.room] = [];
        }
        roomGroups[course.room].push(course);
      }
    });

    Object.entries(roomGroups).forEach(([room, roomCourses]) => {
      if (roomCourses.length > 1) {
        conflicts.push(createConflict(
          'room',
          slotId,
          roomCourses,
          `Room "${room}" is scheduled for multiple courses in the same time slot`
        ));
      }
    });
  });

  return conflicts;
}
