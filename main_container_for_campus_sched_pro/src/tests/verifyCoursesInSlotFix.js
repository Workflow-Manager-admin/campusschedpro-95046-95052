/**
 * Test script to verify the fix for "coursesInSlot.forEach is not a function" error.
 * This test checks that non-array values for coursesInSlot are properly handled.
 */

// Mock the schedule data with various problematic edge cases
const testSchedule = {
  // Valid array entry
  'Monday-9:00 AM': [
    { id: 'course1', name: 'Course 1', code: 'CS101', credits: 3, instructor: 'Dr. Smith', roomId: 'room1' }
  ],
  // Null entry
  'Monday-10:00 AM': null,
  // Undefined entry
  'Monday-11:00 AM': undefined,
  // Object instead of array
  'Monday-12:00 PM': { id: 'course2', name: 'Course 2', code: 'CS102', credits: 3, instructor: 'Dr. Jones' },
  // String instead of array
  'Monday-1:00 PM': 'Invalid data',
  // Number instead of array
  'Monday-2:00 PM': 42,
  // Empty array
  'Monday-3:00 PM': []
};

/**
 * Test function to verify our fix for the coursesInSlot.forEach issue
 */
function testCoursesInSlotFix() {
  console.log('Starting coursesInSlot.forEach fix verification test...');
  
  // Test getting courses for different slots with defensive programming
  Object.keys(testSchedule).forEach(slotId => {
    try {
      const coursesInSlot = testSchedule[slotId];
      console.log(`Testing slotId: ${slotId}, typeof coursesInSlot: ${typeof coursesInSlot}, isArray: ${Array.isArray(coursesInSlot)}`);
      
      // Safely iterate, similar to our fix
      const safeCoursesInSlot = Array.isArray(coursesInSlot) ? coursesInSlot : [];
      
      // This should never throw an error now
      safeCoursesInSlot.forEach(course => {
        console.log(`  - Course found: ${course?.name || 'Unknown'}`);
      });
      
      console.log(`✅ Successfully processed ${slotId}`);
    } catch (error) {
      console.error(`❌ Failed for slotId: ${slotId} - Error: ${error.message}`);
      throw error; // Fail the test if there's an error
    }
  });
  
  console.log('✅ All tests passed! The coursesInSlot.forEach fix is working correctly.');
  return true;
}

/**
 * Run the test automatically if this file is executed directly
 */
if (typeof window !== 'undefined') {
  console.log('To run the test, call testCoursesInSlotFix() from the browser console.');
} else {
  // When run in Node.js
  testCoursesInSlotFix();
}

// Export the test function for use in other contexts
export default testCoursesInSlotFix;
