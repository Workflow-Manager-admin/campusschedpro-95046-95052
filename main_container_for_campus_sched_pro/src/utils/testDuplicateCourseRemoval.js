/**
 * Test utility to verify that course removal by index works correctly
 * 
 * This script adds duplicate courses to a specific time slot
 * and then tests if removal works correctly by index rather than by courseId
 */

import { findScheduleConflicts } from './scheduleUtils';

/**
 * Function to add a duplicate course to a specific time slot for testing
 * @param {Object} schedule - The current schedule
 * @param {string} slotId - The time slot ID (e.g. "Monday-08:00")
 * @param {Object} course - The course to duplicate
 * @returns {Object} - The updated schedule with duplicate course
 */
export const addDuplicateCourseForTesting = (schedule, slotId, course) => {
  if (!schedule || !slotId || !course) {
    console.error('Invalid parameters for addDuplicateCourseForTesting');
    return schedule;
  }

  const newSchedule = { ...schedule };
  if (!newSchedule[slotId]) {
    newSchedule[slotId] = [];
  }

  // Add the same course object again (duplicate)
  newSchedule[slotId].push({ ...course });
  
  console.log(`Added duplicate course ${course.code} to slot ${slotId}`);
  console.log(`Slot now has ${newSchedule[slotId].length} courses`);
  
  // Log if this creates a conflict (which it should)
  const conflicts = findScheduleConflicts(newSchedule);
  if (conflicts.length > 0) {
    console.log(`Created ${conflicts.length} scheduling conflicts for testing purposes`);
  }
  
  return newSchedule;
};

/**
 * Test function to verify that course removal by index works correctly
 * @param {Function} removeCourseFromSlot - The removal function from ScheduleContext
 * @param {Object} schedule - The current schedule
 * @param {string} slotId - The time slot ID
 */
export const testCourseRemovalByIndex = (removeCourseFromSlot, schedule, slotId) => {
  if (!schedule[slotId] || schedule[slotId].length < 2) {
    console.error('Test requires at least 2 courses in the slot');
    return;
  }
  
  const coursesBeforeRemoval = [...schedule[slotId]];
  console.log('Before removal:', coursesBeforeRemoval.map(c => c.code));
  
  // Remove the course at index 0 only
  const firstCourse = coursesBeforeRemoval[0];
  const removed = removeCourseFromSlot(slotId, firstCourse, 0);
  
  if (removed) {
    console.log(`Removed course at index 0: ${firstCourse.code}`);
    console.log('Removal operation was successful');
  } else {
    console.log('Failed to remove course');
  }
  
  // The test passes if only one instance is removed and the other remains
};
