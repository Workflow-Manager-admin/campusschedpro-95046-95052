/**
 * Test script to verify the TimeSlot component fix
 * This script helps validate that each course in a slot is given a unique key
 * and that removal happens by index rather than by courseId
 * 
 * To run this test:
 * 1. Add a course to a slot in the schedule
 * 2. Click the "Test Duplicate Course" button to add a duplicate
 * 3. Remove one instance using the "X" button
 * 4. Verify that only that specific instance is removed, not both
 */

import { useSchedule } from '../context/ScheduleContext';

/**
 * Function to run the verification test from the console
 * You can run this from the browser console after importing it
 */
export const verifyTimeSlotFix = () => {
  console.log('Starting TimeSlot fix verification test...');
  
  // This would be run from within a React component
  // For testing in console, you would need to access the React app's context
  const runTest = () => {
    const { schedule, removeCourseFromSlot } = useSchedule();
    
    // Find a slot with duplicate courses
    const slotsWithDuplicates = Object.entries(schedule)
      .filter(([_, courses]) => {
        // Check if there are multiple courses with the same ID
        const ids = courses.map(c => c.id);
        return ids.length !== new Set(ids).size;
      });
    
    if (slotsWithDuplicates.length === 0) {
      console.log('No slots with duplicate courses found. Add some first using the "Test Duplicate Course" button.');
      return;
    }
    
    // Take the first slot with duplicates
    const [slotId, courses] = slotsWithDuplicates[0];
    console.log(`Found slot ${slotId} with ${courses.length} courses`);
    
    // Count occurrences of each course ID
    const courseIdCounts = {};
    courses.forEach(course => {
      courseIdCounts[course.id] = (courseIdCounts[course.id] || 0) + 1;
    });
    
    // Find a course ID that appears multiple times
    const duplicateCourseId = Object.keys(courseIdCounts)
      .find(id => courseIdCounts[id] > 1);
    
    if (!duplicateCourseId) {
      console.log('No duplicate course IDs found in this slot.');
      return;
    }
    
    console.log(`Course ${duplicateCourseId} appears ${courseIdCounts[duplicateCourseId]} times in slot ${slotId}`);
    
    // Find the first instance of this course
    const firstIndex = courses.findIndex(c => c.id === duplicateCourseId);
    const course = courses[firstIndex];
    
    console.log(`Removing course at index ${firstIndex}: ${course.code}`);
    
    // Remove the first instance only
    const result = removeCourseFromSlot(slotId, course, firstIndex);
    
    if (result) {
      console.log('Removal successful. If only the specific instance was removed, the fix works!');
      console.log(`There should be ${courseIdCounts[duplicateCourseId] - 1} instances of this course remaining.`);
    } else {
      console.log('Removal failed.');
    }
  };
  
  // Instructions for console testing
  console.log('To test from the console:');
  console.log('1. Add a course to a slot using drag and drop');
  console.log('2. Click the "Test Duplicate Course" button to add a duplicate');
  console.log('3. Verify that each course has a unique key in React DevTools');
  console.log('4. Click the "X" on one instance and verify only that one is removed');
  
  return runTest; // Return the function for running within a component
};

export default verifyTimeSlotFix;
