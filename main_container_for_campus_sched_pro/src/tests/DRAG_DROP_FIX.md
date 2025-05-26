# Drag-and-Drop Functionality Fix

## Issue Description
The drag-and-drop functionality in the course scheduling component was not updating the database when courses were moved between time slots. While the UI state was being updated correctly, the changes weren't persisting across page refreshes because the database remained unchanged.

## Root Cause Analysis
The `handleDragEnd` function in `CourseScheduling.js` had the following issues:

1. It was using `refreshData()` as the primary way to sync with the database, which reloads all data but doesn't save changes
2. It was trying to call non-existent functions `safeUnscheduleCourse` and `safeScheduleCourse`
3. It incorrectly tried to access `removeCourseFromSlot` from the `useSchedule` hook inside the callback
4. It wasn't properly extracting day and time parts from the source and destination IDs
5. It was missing the proper database update calls for both scenarios:
   - Dragging from course list to time slot
   - Dragging between time slots

## Implementation Solution

### 1. Import the Correct Functions
Added proper imports for the needed database functions:
```javascript
import { scheduleCourse, unscheduleCourse, getTimeSlotId } from '../utils/supabaseClient';
```

### 2. Extract Source and Destination Information
Improved the logic to extract day/time parts from slot IDs:
```javascript
// Extract day and time from source and destination IDs
let sourceDay, sourceTime, destDay, destTime;

if (source.droppableId !== 'courses-list') {
  [sourceDay, sourceTime] = source.droppableId.split('-');
}

[destDay, destTime] = destination.droppableId.split('-');
```

### 3. When Dragging from Course List to Time Slot
Updated to use proper database functions:
```javascript
getTimeSlotId(destDay, destTime)
  .then(timeSlotId => {
    if (!timeSlotId) {
      showNotification(`Could not find time slot for ${destDay} ${destTime}`, 'error');
      refreshData();
      return;
    }
    
    // Schedule the course in the database
    return scheduleCourse(course.id, facultyId, roomId, timeSlotId);
  })
  // ... error handling
```

### 4. When Moving Between Time Slots
Implemented proper chain of database operations:
```javascript
// First unschedule from the original slot
unscheduleCourse(course.id, sourceDay, sourceTime)
  .then(unscheduleResult => {
    // ... error handling
    
    // Then get timeSlotId for the destination
    return getTimeSlotId(destDay, destTime);
  })
  .then(timeSlotId => {
    // ... error handling
    
    // Schedule in the new slot
    return scheduleCourse(course.id, facultyId, roomId, timeSlotId);
  })
  // ... error handling
```

### 5. Extract Faculty and Room IDs
Added code to extract faculty and room IDs from the course for proper database updates:
```javascript
// Extract faculty and room IDs if available
const facultyId = course.instructor ? course.facultyId : null;
const roomId = course.room ? course.roomId : null;
```

## Verification

To manually test this fix:

1. Drag a course from the course list to a time slot
   - Verify the course appears in the time slot
   - Refresh the page and verify the course is still there
   
2. Drag the course to a different time slot
   - Verify the course moves to the new time slot
   - Refresh the page and verify the course is in the new time slot

The changes should now persist to the database, allowing the application to maintain state between page refreshes.
