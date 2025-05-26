import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { findScheduleConflicts } from '../utils/scheduleUtils';
import { 
  getAllCourses, getAllRooms, getSchedule, saveCourse, saveRoom, 
  deleteCourse, deleteRoom, unscheduleCourse, getAllDepartments,
  getAllFaculty
} from '../utils/supabaseClient';
import { createClient } from '@supabase/supabase-js';

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
  // Get environment variables with fallbacks
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-supabase-url.supabase.co';
  const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-supabase-anon-key';
  
  // Supabase client for realtime subscriptions
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
    loadInitialData();
    
    // Set up real-time subscriptions
    const courseSubscription = supabase
      .channel('public:courses')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, () => {
        loadInitialData();
      })
      .subscribe();
      
    const roomSubscription = supabase
      .channel('public:rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
        loadInitialData();
      })
      .subscribe();
      
    const scheduleSubscription = supabase
      .channel('public:schedule')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedule' }, () => {
        loadInitialData();
      })
      .subscribe();
      
    const facultySubscription = supabase
      .channel('public:faculty')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'faculty' }, () => {
        loadInitialData();
      })
      .subscribe();
    
    // Clean up subscriptions
    return () => {
      supabase.removeChannel(courseSubscription);
      supabase.removeChannel(roomSubscription);
      supabase.removeChannel(scheduleSubscription);
      supabase.removeChannel(facultySubscription);
    };
  }, [loadInitialData]);

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

      // Update the course in the database with the room assignment
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

      // Update the local state
      const updatedCourse = {
        ...course,
        room: room.name,
        roomId: room.id,
        building: room.building
      };

      // Update courses array
      setCourses(prevCourses => 
        prevCourses.map(c => c.id === courseId ? updatedCourse : c)
      );

      // Update schedule
      const slotId = `${day}-${timeSlot}`;
      setSchedule(prevSchedule => {
        const newSchedule = { ...prevSchedule };
        if (!newSchedule[slotId]) {
          newSchedule[slotId] = [];
        }
        newSchedule[slotId] = newSchedule[slotId]
          .filter(c => c.id !== courseId)
          .concat(updatedCourse);
        return newSchedule;
      });

      // Update allocations
      updateAllocations();

      showNotification(`Successfully assigned ${course.code} to ${room.name}`, 'success');
      return true;
    } catch (error) {
      showNotification(`Error assigning room: ${error.message || 'Unknown error'}`, 'error');
      return false;
    }
  };

  // Course operations
  const addCourse = async (courseData) => {
    try {
      setIsLoading(true);
      const courseId = await saveCourse(courseData);
      
      if (courseId) {
        const newCourse = { id: courseId, ...courseData };
        setCourses(prevCourses => [...prevCourses, newCourse]);
        return courseId;
      }
      
      setErrors(prev => ({ ...prev, course: 'Failed to save course' }));
      return null;
    } catch (error) {
      setErrors(prev => ({ ...prev, course: `Error saving course: ${error.message}` }));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateCourse = async (courseData) => {
    try {
      setIsLoading(true);
      const success = await saveCourse(courseData);
      
      if (success) {
        // Update course in local state
        setCourses(prevCourses => 
          prevCourses.map(course => course.id === courseData.id ? courseData : course)
        );
        
        // Update schedule if needed
        setSchedule(prevSchedule => {
          const newSchedule = { ...prevSchedule };
          Object.entries(newSchedule).forEach(([slotId, courses]) => {
            if (Array.isArray(courses)) {
              newSchedule[slotId] = courses.map(course => 
                course.id === courseData.id ? courseData : course
              );
            }
          });
          return newSchedule;
        });
        
        return true;
      }
      
      setErrors(prev => ({ ...prev, course: 'Failed to update course' }));
      return false;
    } catch (error) {
      setErrors(prev => ({ ...prev, course: `Error updating course: ${error.message}` }));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCourseById = async (courseId) => {
    try {
      setIsLoading(true);
      const success = await deleteCourse(courseId);
      
      if (success) {
        // Update local state
        setCourses(prev => prev.filter(course => course.id !== courseId));
        
        // Remove from schedule
        setSchedule(prev => {
          const newSchedule = { ...prev };
          Object.entries(newSchedule).forEach(([slotId, courses]) => {
            if (Array.isArray(courses)) {
              newSchedule[slotId] = courses.filter(course => course.id !== courseId);
              if (newSchedule[slotId].length === 0) {
                delete newSchedule[slotId];
              }
            }
          });
          return newSchedule;
        });
        
        // Update conflicts
        setConflicts(prev => 
          prev.filter(conflict => 
            conflict.course1.id !== courseId && conflict.course2.id !== courseId
          )
        );
        
        return true;
      }
      
      setErrors(prev => ({ ...prev, course: 'Failed to delete course' }));
      return false;
    } catch (error) {
      setErrors(prev => ({ ...prev, course: `Error deleting course: ${error.message}` }));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Notification handlers
  const showNotification = (message, severity = 'info') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

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
    isLoading,
    errors,
    notification,
    
    // Operations
    setCourses,
    setRooms,
    setCurrentAcademicYear,
    assignRoom,
    addCourse,
    updateCourse,
    deleteCourseById,
    updateAllocations,
    loadInitialData,
    
    // Notifications
    showNotification,
    handleCloseNotification
  };

  return (
    <ScheduleContext.Provider value={contextValue}>
      {children}
    </ScheduleContext.Provider>
  );
};

export default ScheduleProvider;
