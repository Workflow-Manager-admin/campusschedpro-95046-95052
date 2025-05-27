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
  const [isLoading, setIsLoading] = useState(true);
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
      // DEBUG LOG
      if (typeof window !== "undefined") {
        window._scheduleDebug = window._scheduleDebug || {};
        window._scheduleDebug.lastLoadInitialData = Date.now();
      }
      // Load courses
      const coursesData = await getAllCourses();
      // Debug: Raw coursesData
      if (typeof window !== "undefined") window._scheduleDebug = { ...(window._scheduleDebug||{}), coursesData };
      if (!coursesData) {
        throw new Error('Failed to load courses');
      }
      setCourses(coursesData);

      // Load rooms
      const roomsData = await getAllRooms();
      if (typeof window !== "undefined") window._scheduleDebug.roomsData = roomsData;
      if (!roomsData) {
        throw new Error('Failed to load rooms');
      }
      setRooms(roomsData);

      // Load departments
      const departmentsData = await getAllDepartments();
      if (typeof window !== "undefined") window._scheduleDebug.departmentsData = departmentsData;
      setDepartments(departmentsData || []);

      // Load faculty
      const facultyData = await getAllFaculty();
      if (typeof window !== "undefined") window._scheduleDebug.facultyData = facultyData;
      setFaculty(facultyData || []);

      // Load schedule
      const scheduleData = await getSchedule();
      if (typeof window !== "undefined") window._scheduleDebug.scheduleData = scheduleData; // Debug log key schedule object
      if (scheduleData) {
        setSchedule(scheduleData);
        // Major Debug Statement
        if (typeof window !== "undefined") window._scheduleDebug.setAfterSchedule = { after: Date.now(), schedule: scheduleData };
        const conflictsFound = findScheduleConflicts(scheduleData);
        setConflicts(conflictsFound || []);
        updateAllocations(scheduleData);
      } else {
        setSchedule({});
      }
      if (typeof window !== "undefined") {
        window._scheduleDebug.loadedKeys = Object.keys(scheduleData || {});
      }
    } catch (error) {
      setErrors({
        general: `Error loading data: ${error.message}`
      });
      if (typeof window !== "undefined") window._scheduleDebug = { ...(window._scheduleDebug||{}), errorDuringLoad: error.message };
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

    const cleanup = setupSubscriptions();
    return () => {
      cleanup.then(cleanupFn => cleanupFn && cleanupFn());
    };
  }, [loadInitialData]);

  // Calculate room allocations based on schedule
  const updateAllocations = useCallback((scheduleData) => {
    const dataToProcess = scheduleData || schedule || {};
    const allocations = {};
    
    try {
      Object.entries(dataToProcess).forEach(([slotId, coursesInSlot]) => {
        if (!slotId || !Array.isArray(coursesInSlot)) return;

        const [day, timeSlot] = slotId.split('-');
        if (!day || !timeSlot) return;

        coursesInSlot.forEach(course => {
          if (!course?.roomId) return;
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

  // ---- ATOMIC ROOM OPERATIONS IMPLEMENTED BELOW ----

  /**
   * PUBLIC_INTERFACE
   * Atomically add a room to DB, then reload all state from DB. UI/context always reflects DB, never optimistic.
   */
  const addRoom = async (roomData) => {
    try {
      setActionLoadingState((prev) => ({ ...prev, roomId: 'PENDING' }));
      const roomId = await saveRoom(roomData);
      if (roomId) {
        await loadInitialData();
        return roomId;
      }
      setErrors((prev) => ({ ...prev, room: 'Failed to save room' }));
      return null;
    } catch (error) {
      setErrors((prev) => ({ ...prev, room: `Error saving room: ${error.message}` }));
      return null;
    } finally {
      setActionLoadingState((prev) => ({ ...prev, roomId: null }));
    }
  };

  /**
   * PUBLIC_INTERFACE
   * Atomically update a room in DB, reload entire state after DB confirmed.
   */
  const updateRoom = async (roomData) => {
    try {
      setActionLoadingState((prev) => ({ ...prev, roomId: roomData.id }));
      const success = await saveRoom(roomData);
      if (success) {
        await loadInitialData();
        return true;
      }
      setErrors((prev) => ({ ...prev, room: 'Failed to update room' }));
      return false;
    } catch (error) {
      setErrors((prev) => ({ ...prev, room: `Error updating room: ${error.message}` }));
      return false;
    } finally {
      setActionLoadingState((prev) => ({ ...prev, roomId: null }));
    }
  };

  /**
   * PUBLIC_INTERFACE
   * Atomically delete a room by ID in DB and clean up all dangling relations (courses referencing this room, set roomId/building to null).
   * Then reload all state from DB. Never mutate state optimistically.
   */
  const deleteRoomById = async (roomId) => {
    try {
      setActionLoadingState((prev) => ({ ...prev, roomId }));
      // Find all courses assigned to this room
      const coursesToUpdate = courses.filter((c) => c.roomId === roomId);
      // Unassign this room from all courses in DB (set roomId/building to null)
      for (const course of coursesToUpdate) {
        await saveCourse({ ...course, room: null, roomId: null, building: null });
      }
      // Delete the room itself
      const success = await deleteRoom(roomId);
      if (success) {
        await loadInitialData();
        return true;
      }
      setErrors((prev) => ({ ...prev, room: 'Failed to delete room' }));
      return false;
    } catch (error) {
      setErrors((prev) => ({ ...prev, room: `Error deleting room: ${error.message}` }));
      return false;
    } finally {
      setActionLoadingState((prev) => ({ ...prev, roomId: null }));
    }
  };

  // ---- EXISTING OPERATIONS (courses, assignments) ----

  /**
   * PUBLIC_INTERFACE
   * Assigns a room to course after successful DB commit and triggers state refresh.
   */
  const assignRoom = async (courseId, roomId, day, timeSlot) => {
    try {
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

      await loadInitialData();
      showNotification(`Successfully assigned ${course.code} to ${room.name}`, 'success');
      return true;
    } catch (error) {
      showNotification(`Error assigning room: ${error.message || 'Unknown error'}`, 'error');
      return false;
    }
  };

  /**
   * PUBLIC_INTERFACE
   * Add a course via DB and only update UI after DB confirmation. Always reload state from DB after mutation.
   */
  const addCourse = async (courseData) => {
    try {
      setActionLoadingState(prev => ({ ...prev, courseId: 'PENDING' }));
      const courseId = await saveCourse(courseData);

      if (courseId) {
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
  
  // PUBLIC_INTERFACE
  /**
   * Schedules a course into a day/time slot, persisting to DB and reloading schedule after.
   * @param {string} courseId
   * @param {string|null} facultyId
   * @param {string|null} roomId
   * @param {string} day
   * @param {string} time
   * @returns {Promise<boolean>}
   */
  const scheduleCourseToSlot = async (courseId, facultyId, roomId, day, time) => {
    try {
      setActionLoadingState((prev) => ({ ...prev, schedule: 'PENDING' }));
      // work out the slot ID
      // get slot ID from the DB (see getTimeSlotId in supabaseClient.js)
      const { getTimeSlotId, scheduleCourse } = await import("../utils/supabaseClient");
      const timeSlotId = await getTimeSlotId(day, time);
      if (!timeSlotId) {
        showNotification(`Could not get/create time slot for ${day}-${time}`, "error");
        return false;
      }
      // persist to DB
      const ok = await scheduleCourse(courseId, facultyId, roomId, timeSlotId);
      if (!ok && typeof window !== "undefined") {
        window._scheduleDebug = window._scheduleDebug || {};
        window._scheduleDebug.failedScheduleAction = {
          courseId, facultyId, roomId, timeSlotId, day, time,
          at: Date.now()
        };
      }
      if (ok) {
        await loadInitialData(); // reload state/UI
        showNotification(`Scheduled course in ${day} ${time}`, "success");
        return true;
      }
      showNotification("Failed to schedule course (DB error)", "error");
      return false;
    } catch (err) {
      showNotification(`Error scheduling course: ${err.message}`, "error");
      return false;
    } finally {
      setActionLoadingState((prev) => ({ ...prev, schedule: null }));
    }
  };

  // PUBLIC_INTERFACE
  /**
   * Unschedules a course from a specific day/time slot, persists removal in DB, reloads schedule after.
   * Always uses DB timeSlotId for correct deletion.
   * @param {string} courseId
   * @param {string} day
   * @param {string} time
   * @returns {Promise<boolean>}
   */
  const unscheduleCourseFromSlot = async (courseId, day, time) => {
    try {
      setActionLoadingState((prev) => ({ ...prev, schedule: 'PENDING' }));
      // Dynamically import helpers only once for code splitting if required
      const { getTimeSlotId, unscheduleCourse } = await import("../utils/supabaseClient");
      const timeSlotId = await getTimeSlotId(day, time);
      if (!timeSlotId) {
        showNotification(`Could not find time slot for ${day}-${time}`, "error");
        return false;
      }
      const ok = await unscheduleCourse(courseId, timeSlotId); // <-- Fixed: Always use (courseId, timeSlotId)
      if (ok) {
        await loadInitialData();
        showNotification(`Unscheduled course from ${day} ${time}`, "success");
        return true;
      }
      showNotification("Failed to unschedule course (DB error)", "error");
      return false;
    } catch (err) {
      showNotification(`Error unscheduling course: ${err.message}`, "error");
      return false;
    } finally {
      setActionLoadingState((prev) => ({ ...prev, schedule: null }));
    }
  };

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
    isLoading,
    errors,
    notification,
    actionLoadingState, 
    
    // Operations
    setCourses,
    setRooms,
    setSchedule,
    setCurrentAcademicYear,
    assignRoom,
    addRoom,
    updateRoom,
    deleteRoomById,
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
    removeCourseFromSlot: unscheduleCourse,
    scheduleCourseToSlot,
    unscheduleCourseFromSlot
  };

  return (
    <ScheduleContext.Provider value={contextValue}>
      {children}
    </ScheduleContext.Provider>
  );
};

export default ScheduleProvider;
