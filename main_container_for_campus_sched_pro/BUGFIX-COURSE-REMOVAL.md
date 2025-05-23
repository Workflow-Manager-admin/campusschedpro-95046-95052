# Course Removal Bug Fix Documentation

## Bug Description
There was a bug in the TimeSlot component where removing a course from a slot would remove all instances of that course with the same courseId, rather than just the specific course instance that was clicked.

## Root Cause
The TimeSlot component was using only the course.id as the key when rendering course items in a slot. When multiple instances of the same course (with the same ID) were in a slot, removing one would remove all instances because:
1. React couldn't distinguish between duplicate course instances
2. The removal function previously identified courses by ID rather than by array index

## Fix Implementation
The fix consists of two main parts:

### 1. Unique Keys for Course Items in TimeSlot

In `src/components/TimeSlot.js`, we now use a combination of course.id and array index as the key:

```javascript
<Tooltip
  key={`${course.id}-${index}`}
  title={`${course.code} - ${course.instructor} (${course.room || 'No room assigned'})`}
  placement="top"
  arrow
>
```

This ensures that React can properly distinguish between identical course objects in the same slot.

### 2. Index-Based Removal in ScheduleContext

In `src/context/ScheduleContext.js`, the `removeCourseFromSlot` function now strictly uses the array index to remove only the specific course instance:

```javascript
const removeCourseFromSlot = useCallback((slotId, course, index) => {
  // Check if the slot exists and has courses
  if (!schedule[slotId] || schedule[slotId].length === 0) {
    return false;
  }
  
  // Index must be provided to ensure we remove the specific instance
  if (index === undefined || index < 0 || index >= schedule[slotId].length) {
    console.warn('Invalid index provided for course removal');
    return false;
  }
  
  // Create a new schedule with the specific course instance removed at the exact index
  const newSchedule = { ...schedule };
  
  // Remove ONLY the specific course instance at the provided index
  newSchedule[slotId] = [
    ...schedule[slotId].slice(0, index),
    ...schedule[slotId].slice(index + 1)
  ];
  
  // Remove empty slots to keep the schedule clean
  if (newSchedule[slotId].length === 0) {
    delete newSchedule[slotId];
  }

  // Update the schedule
  setSchedule(newSchedule);
  
  // Show notification
  showNotification(`Removed ${course.code} from schedule`, 'success');
  
  return true;
}, [schedule, setSchedule, showNotification]);
```

## How to Test

To verify this fix, you can:

1. Add a course to a time slot in the schedule by dragging it from the course list.
2. Click the "Test Duplicate Course" button (added to header actions for testing) to add a duplicate of the first course in the first slot.
3. Observe that there are now two identical courses in the same slot.
4. Click the "X" button on one of the courses.
5. Verify that only that specific course instance is removed, not both instances.

## Additional Testing Tools

For testing purposes, we've added:

1. A "Test Duplicate Course" button in the CourseScheduling component
2. An `addDuplicateCourseToSlot` function in ScheduleContext
3. A test utility file: `src/utils/testDuplicateCourseRemoval.js`
4. A verification script: `src/tests/verifyTimeSlotFix.js`

These tools help validate that the fix works correctly by providing easy ways to create duplicate courses in a slot and test the removal functionality.
