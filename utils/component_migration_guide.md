# Component Migration Guide: localStorage to Supabase

This document provides step-by-step guidance for migrating individual components from localStorage to Supabase persistence.

## General Migration Approach

For each component, follow these general steps:

1. Update imports to include Supabase client functions
2. Replace direct state updates with async Supabase calls
3. Add loading states and error handling
4. Update useEffect hooks to handle async data loading
5. Test the component thoroughly

## Example Component Migrations

### 1. FacultyManagement Component

**Before (localStorage):**
```javascript
const [faculty, setFaculty] = useState(INITIAL_FACULTY);

// Add faculty
const handleAddFaculty = () => {
  const newId = `faculty-${faculty.length + 1}`;
  const newFacultyMember = {
    ...newFaculty,
    id: newId,
    assignments: [],
    expertise: newFaculty.expertise.split(',').map(e => e.trim())
  };
  
  const updatedFaculty = getFacultyStatus(newFacultyMember, []);
  setFaculty(prev => [...prev, updatedFaculty]);
  // ...
};
```

**After (Supabase):**
```javascript
import { getAllFaculty, saveFaculty } from '../../utils/supabaseClient';

const [faculty, setFaculty] = useState([]);
const [isLoading, setIsLoading] = useState(true);

// Load faculty data
useEffect(() => {
  async function loadFacultyData() {
    try {
      setIsLoading(true);
      const data = await getAllFaculty();
      setFaculty(data);
    } catch (error) {
      console.error('Error loading faculty:', error);
      showNotification('Failed to load faculty data', 'error');
    } finally {
      setIsLoading(false);
    }
  }
  
  loadFacultyData();
}, []);

// Add faculty
const handleAddFaculty = async () => {
  try {
    setIsLoading(true);
    const newFacultyMember = {
      name: newFaculty.name,
      email: newFaculty.email,
      department: newFaculty.department,
      expertise: newFaculty.expertise.split(',').map(e => e.trim()),
      status: 'Available'
    };
    
    const id = await saveFaculty(newFacultyMember);
    
    if (id) {
      // Refresh the faculty list
      const updatedFacultyList = await getAllFaculty();
      setFaculty(updatedFacultyList);
      showNotification('Faculty added successfully', 'success');
    } else {
      throw new Error('Failed to add faculty');
    }
  } catch (error) {
    console.error('Error adding faculty:', error);
    showNotification('Error adding faculty', 'error');
  } finally {
    setIsLoading(false);
    setShowAddDialog(false);
  }
};
```

### 2. RoomManagement Component

**Before (localStorage):**
```javascript
const { rooms, setRooms } = useSchedule();

const handleAddRoom = () => {
  // Create new room with unique ID
  const newRoomWithId = {
    ...newRoom,
    id: `room-${Date.now()}`
  };

  // Add to rooms array
  setRooms([...rooms, newRoomWithId]);
  // ...
};
```

**After (Supabase):**
```javascript
import { getAllRooms, saveRoom } from '../../utils/supabaseClient';

const [rooms, setRooms] = useState([]);
const [isLoading, setIsLoading] = useState(true);
const { showNotification } = useSchedule();

// Load room data
useEffect(() => {
  async function loadRoomData() {
    try {
      setIsLoading(true);
      const data = await getAllRooms();
      setRooms(data);
    } catch (error) {
      console.error('Error loading rooms:', error);
      showNotification('Failed to load room data', 'error');
    } finally {
      setIsLoading(false);
    }
  }
  
  loadRoomData();
}, [showNotification]);

// Add room
const handleAddRoom = async () => {
  try {
    setIsLoading(true);
    
    // Save to Supabase
    const id = await saveRoom(newRoom);
    
    if (id) {
      // Refresh the room list
      const updatedRoomList = await getAllRooms();
      setRooms(updatedRoomList);
      showNotification('Room added successfully', 'success');
    } else {
      throw new Error('Failed to add room');
    }
  } catch (error) {
    console.error('Error adding room:', error);
    showNotification('Error adding room', 'error');
  } finally {
    setIsLoading(false);
    setShowAddModal(false);
  }
};
```

### 3. CourseScheduling Component

**Before (localStorage):**
```javascript
const { 
  courses,
  setCourses,
  schedule, 
  setSchedule,
  showNotification
} = useSchedule();

const handleDragEnd = useCallback((result) => {
  // ... existing code ...
  
  // Update schedule state directly
  setSchedule(newSchedule);
}, [schedule, courses, setSchedule, showNotification]);
```

**After (Supabase):**
```javascript
import { 
  getAllCourses, 
  getSchedule, 
  scheduleCourse, 
  unscheduleCourse,
  getTimeSlotId,
  parseTimeSlotId
} from '../../utils/supabaseClient';

const [courses, setCourses] = useState([]);
const [schedule, setSchedule] = useState({});
const [isLoading, setIsLoading] = useState(true);
const { showNotification } = useSchedule();

// Load data
useEffect(() => {
  async function loadData() {
    try {
      setIsLoading(true);
      
      const [coursesData, scheduleData] = await Promise.all([
        getAllCourses(),
        getSchedule()
      ]);
      
      setCourses(coursesData);
      setSchedule(scheduleData);
    } catch (error) {
      console.error('Error loading data:', error);
      showNotification('Failed to load data', 'error');
    } finally {
      setIsLoading(false);
    }
  }
  
  loadData();
}, [showNotification]);

const handleDragEnd = useCallback(async (result) => {
  const { source, destination, draggableId } = result;

  // Drop outside valid area
  if (!destination) return;

  const course = courses.find(c => c.id === draggableId);
  if (!course) return;

  try {
    setIsLoading(true);
    
    // Moving from course list to timetable
    if (source.droppableId === 'courses-list') {
      // Parse the destination time slot
      const { day, time } = parseTimeSlotId(destination.droppableId);
      
      // Get time slot ID from Supabase
      const timeSlotId = await getTimeSlotId(day, time);
      
      if (!timeSlotId) {
        throw new Error(`Time slot not found for ${destination.droppableId}`);
      }
      
      // Schedule the course
      await scheduleCourse(
        course.id,
        null, // No faculty assigned yet
        null, // No room assigned yet
        timeSlotId
      );
      
      // Refresh the schedule
      const updatedSchedule = await getSchedule();
      setSchedule(updatedSchedule);
    }
    // Moving between timetable slots
    else {
      // Remove from source slot
      const { day: sourceDay, time: sourceTime } = parseTimeSlotId(source.droppableId);
      const sourceTimeSlotId = await getTimeSlotId(sourceDay, sourceTime);
      
      if (!sourceTimeSlotId) {
        throw new Error(`Time slot not found for ${source.droppableId}`);
      }
      
      await unscheduleCourse(course.id, sourceTimeSlotId);
      
      // Add to destination slot
      const { day: destDay, time: destTime } = parseTimeSlotId(destination.droppableId);
      const destTimeSlotId = await getTimeSlotId(destDay, destTime);
      
      if (!destTimeSlotId) {
        throw new Error(`Time slot not found for ${destination.droppableId}`);
      }
      
      // Get current course info from schedule
      const courseInfo = schedule[source.droppableId].find(c => c.id === course.id);
      
      // Schedule in new slot
      await scheduleCourse(
        course.id,
        courseInfo.instructor ? await getFacultyIdByName(courseInfo.instructor) : null,
        courseInfo.room ? await getRoomIdByName(courseInfo.room) : null,
        destTimeSlotId
      );
      
      // Refresh the schedule
      const updatedSchedule = await getSchedule();
      setSchedule(updatedSchedule);
    }
  } catch (error) {
    console.error('Error during drag operation:', error);
    showNotification(`Error during drag operation: ${error.message}`, 'error');
  } finally {
    setIsLoading(false);
  }
}, [courses, schedule, showNotification]);
```

## Common Patterns

### 1. Loading States

```javascript
const [isLoading, setIsLoading] = useState(true);

// In your JSX
return (
  <div className="component">
    {isLoading ? (
      <div className="loading-spinner">
        <CircularProgress />
        <p>Loading data...</p>
      </div>
    ) : (
      // Your regular component content
    )}
  </div>
);
```

### 2. Error Handling

```javascript
const [error, setError] = useState(null);

// In your data loading function
async function loadData() {
  try {
    setIsLoading(true);
    setError(null);
    const data = await someSupabaseFunction();
    // Process data...
  } catch (err) {
    console.error('Error loading data:', err);
    setError(`Failed to load data: ${err.message}`);
    showNotification('Data loading failed', 'error');
  } finally {
    setIsLoading(false);
  }
}

// In your JSX
if (error) {
  return (
    <div className="error-message">
      <Alert severity="error">{error}</Alert>
      <Button onClick={loadData}>Retry</Button>
    </div>
  );
}
```

### 3. Optimistic Updates

For improved perceived performance, you can update the UI before the server responds:

```javascript
const handleSave = async (data) => {
  // 1. Save the previous state for potential rollback
  const previousData = [...currentData];
  
  try {
    // 2. Update state optimistically
    const updatedData = [...currentData, newItem];
    setCurrentData(updatedData);
    
    // 3. Send to server
    await saveToSupabase(newItem);
    
    // 4. Show success notification
    showNotification('Item saved successfully', 'success');
  } catch (error) {
    // 5. Rollback on failure
    setCurrentData(previousData);
    showNotification('Failed to save item', 'error');
  }
};
```

### 4. Refreshing Data

Create a reusable function for refreshing data after changes:

```javascript
const refreshData = useCallback(async () => {
  if (!shouldRefresh) return;
  
  try {
    setIsLoading(true);
    const freshData = await fetchFromSupabase();
    setData(freshData);
  } catch (error) {
    console.error('Error refreshing data:', error);
  } finally {
    setIsLoading(false);
  }
}, [shouldRefresh]);

// Use this after operations that modify data
const handleDelete = async (id) => {
  try {
    await deleteFromSupabase(id);
    await refreshData();
    showNotification('Item deleted', 'success');
  } catch (error) {
    showNotification('Failed to delete item', 'error');
  }
};
```

## Testing Component Migration

When migrating components, test the following scenarios:

1. Initial data loading
2. Creating new records
3. Updating existing records
4. Deleting records
5. Handling network errors
6. Handling concurrent users
7. Performance with larger datasets

## Best Practices

1. **Use loading indicators** for all async operations
2. **Implement error boundaries** to handle unexpected errors
3. **Add retry mechanisms** for failed operations
4. **Optimize queries** to fetch only needed data
5. **Use debounce** for frequent operations like search
6. **Implement pagination** for large datasets
7. **Add offline support** for critical features
8. **Consider optimistic UI updates** for better UX
9. **Use Supabase subscriptions** for real-time updates
10. **Test thoroughly** with simulated network conditions
