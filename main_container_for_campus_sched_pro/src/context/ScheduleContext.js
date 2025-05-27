import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { findScheduleConflicts } from '../utils/scheduleUtils';
import { 
  getAllCourses, getAllRooms, getSchedule, saveCourse, saveRoom, 
  deleteCourse, deleteRoom, unscheduleCourse, getAllDepartments,
  getAllFaculty, supabase
} from '../utils/supabaseClient';

// Initialize the Schedule Context
const ScheduleContext = createContext();

// Create a custom hook to use the schedule context
export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
};

// Create the Schedule Provider component
export const ScheduleProvider = ({ children }) => {

  // State for courses, rooms, faculty, schedule, and UI
  const [courses, setCourses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [conflicts, setConflicts] = useState([]);
  const [roomAllocations, setRoomAllocations] = useState({});
  const [academicYears] = useState(['2023-2024', '2024-2025', '2025-2026']);
  const [currentAcademicYear, setCurrentAcademicYear] = useState('2023-2024');
  
  // Loading and error states
  // Remove the single isLoading, use granular loading state for actions
  const [isLoading, setIsLoading] = useState(true); // Used only for initial data boot
  const [actionLoadingState, setActionLoadingState] = useState({
    courseId: null, // for add/update/delete per course
    roomId: null,   // for add/update/delete per room
    facultyId: null // for add/update/delete per faculty
  });
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrors({});
      
      // Load courses
      const coursesData = await getAllCourses();
      if (!coursesData) {
        throw new Error('Failed to load courses');
      }
      setCourses(coursesData);
      
      // Load rooms
      const roomsData = await getAllRooms();
      if (!roomsData) {
        throw new Error('Failed to load rooms');
      }
      setRooms(roomsData);
      
      // Load departments
      const departmentsData = await getAllDepartments();
      setDepartments(departmentsData || []);
      
      // Load faculty
      const facultyData = await getAllFaculty();
      setFaculty(facultyData || []);
      
      // Load schedule
      const scheduleData = await getSchedule();
      if (scheduleData) {
        setSchedule(scheduleData);
        // Find conflicts
        const conflictsFound = findScheduleConflicts(scheduleData);
        setConflicts(conflictsFound || []);
        // Update room allocations
        updateAllocations(scheduleData);
      } else {
        setSchedule({});
      }
      
    } catch (error) {
      setErrors({
        general: `Error loading data: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize data and subscriptions on mount
  useEffect(() => {
    let isMounted = true;

    const setupSubscriptions = async () => {
      try {
        if (isMounted) {
          await loadInitialData();
        }

        // Set up real-time subscriptions
        const subscriptions = [
          supabase
            .channel('public:courses')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, () => {
              if (isMounted) loadInitialData();
            })
            .subscribe(),

          supabase
            .channel('public:rooms')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
              if (isMounted) loadInitialData();
            })
            .subscribe(),

          supabase
            .channel('public:schedule')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'schedule' }, () => {
              if (isMounted) loadInitialData();
            })
            .subscribe(),

          supabase
            .channel('public:faculty')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'faculty' }, () => {
              if (isMounted) loadInitialData();
            })
            .subscribe()
        ];

        // Clean up function
        return () => {
          isMounted = false;
          subscriptions.forEach(subscription => {
            if (subscription) {
              supabase.removeChannel(subscription);
            }
          });
        };
      } catch (error) {
        console.warn('Error setting up subscriptions:', error);
        return () => {
          isMounted = false;
        };
      }
    };

    // Set up subscriptions and store cleanup function
    const cleanup = setupSubscriptions();
    return () => {
      cleanup.then(cleanupFn => cleanupFn && cleanupFn());
    };
  }, [loadInitialData]); // Removed supabase from dependencies since it's now imported

  // Calculate room allocations based on schedule
  const updateAllocations = useCallback((scheduleData) => {
    const dataToProcess = scheduleData || schedule || {};
    const allocations = {};
    
    try {
      // Process each time slot in the schedule
      Object.entries(dataToProcess).forEach(([slotId, coursesInSlot]) => {
        if (!slotId || !Array.isArray(coursesInSlot)) return;

        const [day, timeSlot] = slotId.split('-');
        if (!day || !timeSlot) return;

        // Process each course in the slot
        coursesInSlot.forEach(course => {
          if (!course?.roomId) return;

          // Initialize room allocation if needed
          if (!allocations[course.roomId]) {
            const room = rooms.find(r => r.id === course.roomId);
            if (!room) return;

            allocations[course.roomId] = {
              count: 0,
              courses: [],
              room: {
                id: room.id,
                name: room.name,
                building: room.building,
                capacity: room.capacity
              }
            };
          }

          // Add course to allocation
          allocations[course.roomId].count++;
          allocations[course.roomId].courses.push({
            course: {
              id: course.id,
              code: course.code,
              name: course.name,
              instructor: course.instructor
            },
            day,
            timeSlot,
            schedule: [`${day} ${timeSlot}`]
          });
        });
      });

      // Sort courses within each allocation
      Object.values(allocations).forEach(allocation => {
        allocation.courses.sort((a, b) => {
          const dayCompare = a.day.localeCompare(b.day);
          return dayCompare !== 0 ? dayCompare : a.timeSlot.localeCompare(b.timeSlot);
        });
      });
      
      setRoomAllocations(allocations);
    } catch (error) {
      console.warn('Error updating allocations:', error);
      setRoomAllocations({});
    }
  }, [rooms, schedule]);

  // Room operations
  /**
   * PUBLIC_INTERFACE
   * Assigns a room to course after successful DB commit and triggers state refresh.
   */
  const assignRoom = async (courseId, roomId, day, timeSlot) => {
    try {
      // Input validation
      if (!courseId || !roomId || !day || !timeSlot) {
        showNotification('Missing required information for room assignment', 'error');
        return false;
      }

      const course = courses.find(c => c.id === courseId);
      const room = rooms.find(r => r.id === roomId);

      if (!course || !room) {
        showNotification('Course or room not found', 'error');
        return false;
      }

      // Update in database first, do NOT update state until DB confirmed
      const success = await saveCourse({
        ...course,
        room: room.name,
        roomId: room.id,
        building: room.building
      });

      if (!success) {
        showNotification('Failed to update room assignment in database', 'error');
        return false;
      }

      // Success: Now reload whole state/context from DB to guarantee sync
      await loadInitialData();
      showNotification(`Successfully assigned ${course.code} to ${room.name}`, 'success');
      return true;
    } catch (error) {
      showNotification(`Error assigning room: ${error.message || 'Unknown error'}`, 'error');
      return false;
    }
  };

  // Course operations
  /**
   * PUBLIC_INTERFACE
   * Add a course via DB and only update UI after DB confirmation. Always reload state from DB after mutation.
   */
  const addCourse = async (courseData) => {
    try {
      // Set loading state specific to this course (optimistically reserve a random string if no id yet)
      setActionLoadingState(prev => ({ ...prev, courseId: 'PENDING' }));
      const courseId = await saveCourse(courseData);

      if (courseId) {
        // Only refresh state from DB, never update state directly
        await loadInitialData();
        return courseId;
      }

      setErrors(prev => ({ ...prev, course: 'Failed to save course' }));
      return null;
    } catch (error) {
      setErrors(prev => ({ ...prev, course: `Error saving course: ${error.message}` }));
      return null;
    } finally {
      setActionLoadingState(prev => ({ ...prev, courseId: null }));
    }
  };

  /**
   * PUBLIC_INTERFACE
   * Update a course only after DB confirmation, then reload all state from DB.
   */
  const updateCourse = async (courseData) => {
    try {
      setActionLoadingState(prev => ({ ...prev, courseId: courseData.id }));
      const success = await saveCourse(courseData);

      if (success) {
        await loadInitialData();
        return true;
      }

      setErrors(prev => ({ ...prev, course: 'Failed to update course' }));
      return false;
    } catch (error) {
      setErrors(prev => ({ ...prev, course: `Error updating course: ${error.message}` }));
      return false;
    } finally {
      setActionLoadingState(prev => ({ ...prev, courseId: null }));
    }
  };

  /**
   * PUBLIC_INTERFACE
   * Delete a course in DB and reload state from DB after success. Never mutate state optimistically.
   */
  const deleteCourseById = async (courseId) => {
    try {
      setActionLoadingState(prev => ({ ...prev, courseId }));
      const success = await deleteCourse(courseId);

      if (success) {
        await loadInitialData();
        return true;
      }

      setErrors(prev => ({ ...prev, course: 'Failed to delete course' }));
      return false;
    } catch (error) {
      setErrors(prev => ({ ...prev, course: `Error deleting course: ${error.message}` }));
      return false;
    } finally {
      setActionLoadingState(prev => ({ ...prev, courseId: null }));
    }
  };

  // Notification handlers
  const showNotification = useCallback((message, severity = 'info') => {
    setNotification({ open: true, message, severity });
  }, []);

  const handleCloseNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, open: false }));
  }, []);

  // Transform allocations for component consumption
  const getAllocationsArray = useCallback(() => {
    if (!roomAllocations || typeof roomAllocations !== 'object') {
      return [];
    }
    
    return Object.entries(roomAllocations)
      .map(([roomId, allocation]) => {
        const room = rooms.find(r => r.id === roomId);
        if (!room) return null;
        
        return {
          roomId,
          roomName: room.name,
          building: room.building,
          capacity: room.capacity,
          courses: Array.isArray(allocation.courses) ? allocation.courses : []
        };
      })
      .filter(Boolean);
  }, [roomAllocations, rooms]);
  
  // Context value
  const contextValue = {
    // State
    courses,
    rooms,
    departments,
    faculty,
    schedule,
    conflicts,
    allocations: getAllocationsArray(),
    academicYears,
    currentAcademicYear,
    isLoading, // still present for initial boot only!
    errors,
    notification,
    actionLoadingState, // <-- new, granular action loading state
    
    // Operations
    setCourses,
    setRooms,
    setSchedule,
    setCurrentAcademicYear,
    assignRoom,
    addCourse,
    updateCourse,
    deleteCourseById,
    updateAllocations,
    loadInitialData,
    refreshData: loadInitialData,
    
    // Notifications
    showNotification,
    handleCloseNotification,
    
    // Course Operations
    removeCourseFromSlot: unscheduleCourse
  };

  return (
    <ScheduleContext.Provider value={contextValue}>
      {children}
    </ScheduleContext.Provider>
  );
};

export default ScheduleProvider;
