import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { findScheduleConflicts } from '../utils/scheduleUtils';
import { 
  getAllCourses, 
  getAllRooms, 
  getSchedule, 
  saveCourse, 
  saveRoom, 
  deleteCourse, 
  deleteRoom,
  scheduleCourse,
  unscheduleCourse,
  parseTimeSlotId,
  getTimeSlotId,
  // Clean up unused imports
  // getAllFaculty,
  // saveFaculty,
  // deleteFaculty,
  // getFacultyAssignments,
  supabase
} from '../utils/supabaseClient';

// Initial sample data for fallback if database connection fails
const INITIAL_COURSES = [];
const INITIAL_ROOMS = [];
const INITIAL_ALLOCATIONS = [];

// Create the context
const ScheduleContext = createContext(undefined);

/**
 * Custom hook to access the schedule context
 * @returns {Object} Schedule context value
 * @throws {Error} If used outside of ScheduleProvider
 */
export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
};

/**
 * Provider component that wraps the application and makes schedule state available to any
 * child component that calls useSchedule().
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const ScheduleProvider = ({ children }) => {
  // Application state
  const [courses, setCourses] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [rooms, setRooms] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [dataInitialized, setDataInitialized] = useState(false);
  const [errors, setErrors] = useState({
    courses: null,
    rooms: null,
    schedule: null,
    faculty: null
  });
  
  // Notification state
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Function to load initial data from Supabase
  const loadInitialData = useCallback(async (forceReload = false) => {
    // Skip if we're already initialized and not forcing a reload
    // This prevents excessive API calls to course_schedule_view endpoint
    if (dataInitialized && !isLoading && !forceReload) return;
    
    setIsLoading(true);
    setErrors({
      courses: null,
      rooms: null,
      schedule: null,
      faculty: null
    });
    
    try {
      // Load courses first since schedule depends on course data
      let coursesData = [];
      try {
        coursesData = await getAllCourses();
        setCourses(coursesData);
      } catch (courseError) {
        console.error('Error loading courses:', courseError);
        setErrors(prev => ({
          ...prev,
          courses: courseError.message || 'Failed to load courses'
        }));
        // Use empty array but don't throw
        coursesData = [];
      }
      
      // Load rooms
      try {
        const roomsData = await getAllRooms();
        setRooms(roomsData);
        
        // Create room allocations from room data even if schedule fails
        const newAllocations = roomsData.map(room => ({
          roomId: room.id,
          roomName: room.name,
          building: room.building,
          courses: []
        }));
        setAllocations(newAllocations);
      } catch (roomError) {
        console.error('Error loading rooms:', roomError);
        setErrors(prev => ({
          ...prev,
          rooms: roomError.message || 'Failed to load rooms'
        }));
        // Don't throw, continue loading other data
      }
      
      // Load schedule after courses to ensure we have all course data
      try {
        // getSchedule will use the courses data to enrich the schedule entries
        const scheduleData = await getSchedule();
        
        // Verify we have valid schedule data
        if (!scheduleData || typeof scheduleData !== 'object') {
          throw new Error('Invalid schedule data format');
        }
        
        // Removed debugging logs for production build
        
        setSchedule(scheduleData);
        
        // Only update allocations if we have room data and schedule data
        if (rooms.length > 0 && Object.keys(scheduleData).length > 0) {
          const newAllocations = rooms.map(room => ({
            roomId: room.id,
            roomName: room.name,
            building: room.building,
            courses: []
          }));
          
          // Populate allocations with courses from the schedule
          Object.entries(scheduleData).forEach(([slotId, coursesInSlot]) => {
            if (!Array.isArray(coursesInSlot)) {
              // Skip invalid slots silently
              return;
            }
            
            coursesInSlot.forEach(course => {
              if (!course || !course.id) {
                // Skip invalid courses silently
                return;
              }
              
              if (course.room) {
                const roomAllocation = newAllocations.find(a => a.roomName === course.room);
                
                if (roomAllocation) {
                  const existingCourse = roomAllocation.courses.find(c => c.id === course.id);
                  
                  if (existingCourse) {
                    // Add this slot to existing course schedule
                    if (!existingCourse.schedule.includes(slotId)) {
                      existingCourse.schedule.push(slotId);
                    }
                  } else {
                    // Add new course to room allocation
                    roomAllocation.courses.push({
                      ...course,
                      schedule: [slotId]
                    });
                  }
                }
              }
            });
          });
          
          setAllocations(newAllocations);
        }
      } catch (scheduleError) {
        console.error('Error loading schedule:', scheduleError);
        setErrors(prev => ({
          ...prev,
          schedule: scheduleError.message || 'Failed to load schedule'
        }));
        // Don't throw, we've already loaded other data
      }
    } catch (error) {
      console.error('Error loading data from Supabase:', error);
      
      // Set general error state if we have a truly global error
      setErrors(prev => ({
        ...prev,
        general: error.message || 'Failed to load data from the database'
      }));
      
      // Use initial data as fallback
      if (courses.length === 0) setCourses(INITIAL_COURSES);
      if (rooms.length === 0) setRooms(INITIAL_ROOMS);
      if (Object.keys(schedule).length === 0) setSchedule({});
      if (allocations.length === 0) setAllocations(INITIAL_ALLOCATIONS);
      
      showNotification('Failed to load data from the database. Using local data instead.', 'error');
    } finally {
      setIsLoading(false);
      setDataInitialized(true);
    }
  }, [courses.length, rooms, schedule]); // Add dependencies to properly track state
  
  // Load initial data on mount
  useEffect(() => {
    loadInitialData();
    
    // Set up real-time subscription for updates
    const coursesSubscription = supabase
      .channel('public:courses')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, () => {
        // Refresh data when courses change
        getAllCourses().then(data => setCourses(data));
      })
      .subscribe();
      
    const roomsSubscription = supabase
      .channel('public:rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
        // Refresh data when rooms change
        getAllRooms().then(data => setRooms(data));  
      })
      .subscribe();
      
    const scheduleSubscription = supabase
      .channel('public:schedule')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedule' }, () => {
        // Refresh data when schedule changes
        getSchedule().then(data => setSchedule(data));
      })
      .subscribe();

    // Don't set up faculty subscription - we handle faculty updates locally in components

    // Clean up subscriptions
    return () => {
      supabase.removeChannel(coursesSubscription);
      supabase.removeChannel(roomsSubscription);
      supabase.removeChannel(scheduleSubscription);
    };
  }, []); // Only run once on mount since loadInitialData has no dependencies now
  
  // Update conflicts whenever schedule changes
  useEffect(() => {
    const newConflicts = findScheduleConflicts(schedule);
    setConflicts(newConflicts);
  }, [schedule]);

  // Function to show notifications across components
  const showNotification = useCallback((message, severity = 'info') => {
    setNotification({
      open: true,
      message,
      severity
    });
  }, []);

  const handleCloseNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, open: false }));
  }, []);

  // Function to assign a room to a course
  const assignRoom = useCallback(async (courseId, roomId) => {
    const course = courses.find(c => c.id === courseId);
    const room = roomId ? rooms.find(r => r.id === roomId) : null;
    
    if (!course) return false;
    if (roomId && !room) return false;

    try {
      // Show loading notification
      showNotification('Updating room assignment...', 'info');
      
      // Get all schedule entries for this course
      const courseSlots = [];
      Object.entries(schedule).forEach(([slotId, coursesInSlot]) => {
        if (coursesInSlot.some(c => c.id === courseId)) {
          courseSlots.push(slotId);
        }
      });
      
      // Update each schedule entry with the new room
      for (const slotId of courseSlots) {
        const { day, time } = parseTimeSlotId(slotId);
        const timeSlotId = await getTimeSlotId(day, time);
        
        if (!timeSlotId) {
          console.error(`Time slot not found for ${slotId}`);
          continue;
        }
        
        // We don't actually need this variable
        // const courseEntry = schedule[slotId].find(c => c.id === courseId);
        
        await scheduleCourse(
          courseId, 
          null, // Faculty ID would need to be looked up by name
          roomId,
          timeSlotId
        );
      }
      
      // Refresh data
      await loadInitialData();
      
      // Show success message
      const message = room 
        ? `Successfully assigned ${course.code} to ${room.name}`
        : `Successfully removed room assignment from ${course.code}`;
      showNotification(message, 'success');
      
      return true;
    } catch (error) {
      console.error('Error assigning room:', error);
      showNotification(`Failed to assign room: ${error.message}`, 'error');
      return false;
    }
  }, [courses, rooms, schedule, showNotification, loadInitialData]);

  // Function to resolve a conflict by moving a course to a different slot
  const resolveConflict = useCallback(async (conflictId, courseIdToMove, newSlotId) => {
    const conflict = conflicts.find(c => c.id === conflictId);
    if (!conflict) return false;

    const courseToMove = courses.find(c => c.id === courseIdToMove);
    if (!courseToMove) return false;

    try {
      showNotification('Resolving scheduling conflict...', 'info');
      
      // Remove course from its current slot
      const currentSlot = conflict.slotId;
      const { day: currentDay, time: currentTime } = parseTimeSlotId(currentSlot);
      const currentTimeSlotId = await getTimeSlotId(currentDay, currentTime);
      
      if (!currentTimeSlotId) {
        showNotification(`Error: Cannot find time slot for ${currentSlot}`, 'error');
        return false;
      }
      
      // Remove from current slot
      await unscheduleCourse(courseIdToMove, currentTimeSlotId);
      
      // Add to new slot
      const { day: newDay, time: newTime } = parseTimeSlotId(newSlotId);
      const newTimeSlotId = await getTimeSlotId(newDay, newTime);
      
      if (!newTimeSlotId) {
        showNotification(`Error: Cannot find time slot for ${newSlotId}`, 'error');
        return false;
      }
      
      // We don't need this variable
      // const courseInfo = schedule[currentSlot].find(c => c.id === courseIdToMove);
      
      // Schedule in new slot
      await scheduleCourse(
        courseIdToMove, 
        null, // Faculty ID would need to be looked up
        null, // Room ID would need to be looked up
        newTimeSlotId
      );
      
      // Refresh data
      await loadInitialData();
      
      showNotification(`Moved ${courseToMove.code} to resolve conflict`, 'success');
      return true;
    } catch (error) {
      console.error('Error resolving conflict:', error);
      showNotification(`Failed to resolve conflict: ${error.message}`, 'error');
      return false;
    }
  }, [conflicts, courses, schedule, showNotification, loadInitialData]);

  // Function to update room allocations when schedule changes
  const updateAllocations = useCallback(async () => {
    // Skip refresh if already initialized to prevent unnecessary API calls
    if (dataInitialized && !isLoading) {
      // Just rebuild allocations from current state
      const newAllocations = rooms.map(room => ({
        roomId: room.id,
        roomName: room.name,
        building: room.building,
        courses: []
      }));
      
      // Populate allocations with courses from the schedule
      Object.entries(schedule).forEach(([slotId, coursesInSlot]) => {
        coursesInSlot.forEach(course => {
          if (course.room) {
            const roomAllocation = newAllocations.find(a => a.roomName === course.room);
            
            if (roomAllocation) {
              const existingCourse = roomAllocation.courses.find(c => c.id === course.id);
              
              if (existingCourse) {
                // Add this slot to existing course schedule
                if (!existingCourse.schedule.includes(slotId)) {
                  existingCourse.schedule.push(slotId);
                }
              } else {
                // Add new course to room allocation
                roomAllocation.courses.push({
                  ...course,
                  schedule: [slotId]
                });
              }
            }
          }
        });
      });
      
      setAllocations(newAllocations);
    } else {
      // For initial load or forced refresh, use loadInitialData
      await loadInitialData();
    }
  }, [dataInitialized, isLoading, rooms, schedule, setAllocations]);

  // Function to remove a course from a specific time slot
  const removeCourseFromSlot = useCallback(async (slotId, course, index) => {
    // Check if the slot exists and has courses
    if (!schedule[slotId] || schedule[slotId].length === 0) {
      return false;
    }
    
    // Index must be provided to ensure we remove the specific instance
    if (index === undefined || index < 0 || index >= schedule[slotId].length) {
      console.warn('Invalid index provided for course removal');
      return false;
    }
    
    try {
      showNotification('Removing course from schedule...', 'info');
      
      const { day, time } = parseTimeSlotId(slotId);
      const timeSlotId = await getTimeSlotId(day, time);
      
      if (!timeSlotId) {
        showNotification(`Error: Cannot find time slot for ${slotId}`, 'error');
        return false;
      }
      
      // Unschedule the course
      await unscheduleCourse(course.id, timeSlotId);
      
      // Refresh data
      await loadInitialData();
      
      // Show notification
      showNotification(`Removed ${course.code} from schedule`, 'success');
      
      return true;
    } catch (error) {
      console.error('Error removing course from slot:', error);
      showNotification(`Failed to remove course: ${error.message}`, 'error');
      return false;
    }
  }, [schedule, showNotification, loadInitialData]);

  // Function to add a new course
  const addCourse = useCallback(async (newCourse) => {
    try {
      showNotification('Adding new course...', 'info');
      
      // Save course to Supabase
      const courseId = await saveCourse({
        ...newCourse
        // Removed explicit null ID setting to allow database default
      });
      
      if (!courseId) {
        throw new Error('Failed to create course - database did not return an ID');
      }
      
      // Refresh data
      await loadInitialData(true); // Force reload to ensure we get the latest data
      
      showNotification(`Course ${newCourse.code} added successfully`, 'success');
      return courseId;
    } catch (error) {
      console.error('Error adding course:', error);
      showNotification(`Failed to add course: ${error.message}`, 'error');
      throw error; // Re-throw to allow components to handle specific errors
    }
  }, [showNotification, loadInitialData]);

  // Function to add a new room
  const addRoom = useCallback(async (newRoom) => {
    try {
      showNotification('Adding new room...', 'info');
      
      // Save room to Supabase
      const roomId = await saveRoom({
        ...newRoom
        // Removed explicit null ID setting to allow database default
      });
      
      if (!roomId) {
        throw new Error('Failed to create room - database did not return an ID');
      }
      
      // Refresh data
      await loadInitialData(true); // Force reload to ensure we get the latest data
      
      showNotification(`Room ${newRoom.name} added successfully`, 'success');
      return roomId;
    } catch (error) {
      console.error('Error adding room:', error);
      showNotification(`Failed to add room: ${error.message}`, 'error');
      throw error; // Re-throw to allow components to handle specific errors
    }
  }, [showNotification, loadInitialData]);

  // Function to update a course
  const updateCourse = useCallback(async (updatedCourse) => {
    try {
      showNotification('Updating course...', 'info');
      
      // Save course to Supabase
      const courseId = await saveCourse(updatedCourse);
      
      if (!courseId) {
        throw new Error('Failed to update course - database did not return an ID');
      }
      
      // Refresh data
      await loadInitialData(true); // Force reload to ensure we get the latest data
      
      showNotification(`Course ${updatedCourse.code} updated successfully`, 'success');
      return courseId;
    } catch (error) {
      console.error('Error updating course:', error);
      showNotification(`Failed to update course: ${error.message}`, 'error');
      throw error; // Re-throw to allow components to handle specific errors
    }
  }, [showNotification, loadInitialData]);

  // Function to update a room
  const updateRoom = useCallback(async (updatedRoom) => {
    try {
      showNotification('Updating room...', 'info');
      
      // Save room to Supabase
      const roomId = await saveRoom(updatedRoom);
      
      if (!roomId) {
        throw new Error('Failed to update room - database did not return an ID');
      }
      
      // Refresh data
      await loadInitialData(true); // Force reload to ensure we get the latest data
      
      showNotification(`Room ${updatedRoom.name} updated successfully`, 'success');
      return roomId;
    } catch (error) {
      console.error('Error updating room:', error);
      showNotification(`Failed to update room: ${error.message}`, 'error');
      throw error; // Re-throw to allow components to handle specific errors
    }
  }, [showNotification, loadInitialData]);

  // Function to delete a course
  const deleteCourseById = useCallback(async (courseId) => {
    try {
      showNotification('Deleting course...', 'info');
      
      // Delete course from Supabase
      const success = await deleteCourse(courseId);
      
      if (!success) {
        throw new Error('Failed to delete course');
      }
      
      // Refresh data
      await loadInitialData();
      
      showNotification(`Course deleted successfully`, 'success');
      return true;
    } catch (error) {
      console.error('Error deleting course:', error);
      showNotification(`Failed to delete course: ${error.message}`, 'error');
      return false;
    }
  }, [showNotification, loadInitialData]);

  // Function to delete a room
  const deleteRoomById = useCallback(async (roomId) => {
    try {
      showNotification('Deleting room...', 'info');
      
      // Delete room from Supabase
      const success = await deleteRoom(roomId);
      
      if (!success) {
        throw new Error('Failed to delete room');
      }
      
      // Refresh data
      await loadInitialData();
      
      showNotification(`Room deleted successfully`, 'success');
      return true;
    } catch (error) {
      console.error('Error deleting room:', error);
      showNotification(`Failed to delete room: ${error.message}`, 'error');
      return false;
    }
  }, [showNotification, loadInitialData]);
  
  // Function to refresh data on demand
  const refreshData = useCallback(async () => {
    // Explicitly force a reload of data
    await loadInitialData(true);
    showNotification('Data refreshed from database', 'info');
  }, [loadInitialData, showNotification]);

  // Context value to be provided
  const contextValue = {
    // Data
    courses,
    setCourses,
    schedule,
    setSchedule,
    conflicts,
    rooms,
    setRooms,
    allocations,
    setAllocations,
    
    // UI state
    notification,
    isLoading,
    errors,
    
    // Notification functions
    showNotification,
    handleCloseNotification,
    
    // Course CRUD operations
    addCourse,
    updateCourse,
    deleteCourseById,
    
    // Room CRUD operations
    addRoom,
    updateRoom,
    deleteRoomById,
    
    // Schedule operations
    assignRoom,
    resolveConflict,
    updateAllocations,
    removeCourseFromSlot,
    
    // Data refresh
    refreshData
  };

  return (
    <ScheduleContext.Provider value={contextValue}>
      {children}
    </ScheduleContext.Provider>
  );
};

ScheduleProvider.propTypes = {
  children: PropTypes.node.isRequired
};
