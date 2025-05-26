import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { findScheduleConflicts } from '../utils/scheduleUtils';
import { 
  supabase, 
  getAllCourses, 
  getAllRooms, 
  getSchedule, 
  scheduleCourse,
  unscheduleCourse,
  parseTimeSlotId,
  getTimeSlotId
} from './supabaseClient';

// Create the context
const SupabaseScheduleContext = createContext(undefined);

/**
 * Custom hook to access the schedule context
 * @returns {Object} Schedule context value
 * @throws {Error} If used outside of SupabaseScheduleProvider
 */
export const useSupabaseSchedule = () => {
  const context = useContext(SupabaseScheduleContext);
  if (context === undefined) {
    throw new Error('useSupabaseSchedule must be used within a SupabaseScheduleProvider');
  }
  return context;
};

/**
 * Provider component that wraps the application and makes schedule state available to any
 * child component that calls useSupabaseSchedule().
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const SupabaseScheduleProvider = ({ children }) => {
  const [courses, setCourses] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [rooms, setRooms] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Function to load initial data from Supabase
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load courses
      const coursesData = await getAllCourses();
      setCourses(coursesData);
      
      // Load rooms
      const roomsData = await getAllRooms();
      setRooms(roomsData);
      
      // Load schedule
      const scheduleData = await getSchedule();
      setSchedule(scheduleData);
      
      // Create room allocations from schedule
      const newAllocations = roomsData.map(room => ({
        roomId: room.id,
        roomName: room.name,
        building: room.building,
        courses: []
      }));
      
      // Populate allocations with courses from the schedule
      Object.entries(scheduleData).forEach(([slotId, slotContent]) => {
        // Ensure coursesInSlot is an array before using forEach
        const coursesInSlot = Array.isArray(slotContent) ? slotContent : [];
        
        coursesInSlot.forEach(course => {
          if (course && course.room) {
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
      
      // Check for conflicts
      const newConflicts = findScheduleConflicts(scheduleData);
      setConflicts(newConflicts);
      
    } catch (error) {
      console.error('Error loading data from Supabase:', error);
      showNotification('Failed to load data from the database', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Load initial data on mount
  useEffect(() => {
    loadInitialData();
    
    // Set up real-time subscription for updates
    const coursesSubscription = supabase
      .channel('public:courses')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, loadInitialData)
      .subscribe();
      
    const roomsSubscription = supabase
      .channel('public:rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, loadInitialData)
      .subscribe();
      
    const scheduleSubscription = supabase
      .channel('public:schedule')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedule' }, loadInitialData)
      .subscribe();
    
    // Clean up subscriptions
    return () => {
      supabase.removeChannel(coursesSubscription);
      supabase.removeChannel(roomsSubscription);
      supabase.removeChannel(scheduleSubscription);
    };
  }, [loadInitialData]);
  
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
      // Get all schedule entries for this course
      const courseSlots = [];
      Object.entries(schedule).forEach(([slotId, slotContent]) => {
        // Ensure coursesInSlot is an array
        const coursesInSlot = Array.isArray(slotContent) ? slotContent : [];
        
        if (coursesInSlot.some(c => c && c.id === courseId)) {
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
        
        // Ensure we're dealing with an array
        const slotCourses = Array.isArray(schedule[slotId]) ? schedule[slotId] : [];
        const courseEntry = slotCourses.find(c => c && c.id === courseId);
        
        if (!courseEntry) {
          console.error(`Course ${courseId} not found in slot ${slotId}`);
          continue;
        }
        
        await scheduleCourse(
          courseId, 
          courseEntry.instructor ? await getFacultyIdByName(courseEntry.instructor) : null,
          roomId,
          timeSlotId
        );
      }
      
      // Reload data to reflect changes
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
      
      // Get current course info from schedule - ensure we have an array
      const currentSlotCourses = Array.isArray(schedule[currentSlot]) ? schedule[currentSlot] : [];
      const courseInfo = currentSlotCourses.find(c => c && c.id === courseIdToMove);
      
      if (!courseInfo) {
        showNotification(`Error: Course not found in original slot`, 'error');
        return false;
      }
      
      // Schedule in new slot
      await scheduleCourse(
        courseIdToMove, 
        courseInfo.instructor ? await getFacultyIdByName(courseInfo.instructor) : null,
        courseInfo.room ? await getRoomIdByName(courseInfo.room) : null,
        newTimeSlotId
      );
      
      // Reload data
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
    await loadInitialData();
  }, [loadInitialData]);
  
  // Function to remove a course from a specific time slot
  const removeCourseFromSlot = useCallback(async (slotId, course, index) => {
    // Get slot content with defensive check
    const slotContent = schedule[slotId];
    const slotCourses = Array.isArray(slotContent) ? slotContent : [];
    
    // Check if the slot exists and has courses
    if (slotCourses.length === 0) {
      return false;
    }
    
    // Index must be provided to ensure we remove the specific instance
    if (index === undefined || index < 0 || index >= slotCourses.length) {
      console.warn('Invalid index provided for course removal');
      return false;
    }
    
    try {
      const { day, time } = parseTimeSlotId(slotId);
      const timeSlotId = await getTimeSlotId(day, time);
      
      if (!timeSlotId) {
        showNotification(`Error: Cannot find time slot for ${slotId}`, 'error');
        return false;
      }
      
      // Make sure we have a valid course
      const courseToRemove = slotCourses[index];
      if (!courseToRemove || !courseToRemove.id) {
        showNotification('Error: Invalid course data', 'error');
        return false;
      }
      
      // Unschedule the course
      await unscheduleCourse(courseToRemove.id, timeSlotId);
      
      // Reload data
      await loadInitialData();
      
      // Show notification
      showNotification(`Removed ${courseToRemove.code || 'course'} from schedule`, 'success');
      
      return true;
    } catch (error) {
      console.error('Error removing course from slot:', error);
      showNotification(`Failed to remove course: ${error.message}`, 'error');
      return false;
    }
  }, [schedule, showNotification, loadInitialData]);
  
  // Helper function to get faculty ID by name
  const getFacultyIdByName = async (name) => {
    const { data, error } = await supabase
      .from('faculty')
      .select('id')
      .eq('name', name)
      .maybeSingle();
      
    if (error) {
      console.error('Error fetching faculty ID:', error);
      return null;
    }
    
    return data?.id || null;
  };
  
  // Helper function to get room ID by name
  const getRoomIdByName = async (name) => {
    const { data, error } = await supabase
      .from('rooms')
      .select('id')
      .eq('name', name)
      .maybeSingle();
      
    if (error) {
      console.error('Error fetching room ID:', error);
      return null;
    }
    
    return data?.id || null;
  };
  
  // Context value to be provided
  const contextValue = {
    courses,
    setCourses,
    schedule,
    setSchedule,
    conflicts,
    rooms,
    setRooms,
    allocations,
    setAllocations,
    notification,
    showNotification,
    handleCloseNotification,
    assignRoom,
    resolveConflict,
    updateAllocations,
    removeCourseFromSlot,
    isLoading,
    refreshData: loadInitialData
  };

  return (
    <SupabaseScheduleContext.Provider value={contextValue}>
      {children}
    </SupabaseScheduleContext.Provider>
  );
};

SupabaseScheduleProvider.propTypes = {
  children: PropTypes.node.isRequired
};
