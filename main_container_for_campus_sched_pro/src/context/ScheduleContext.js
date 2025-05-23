import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { findScheduleConflicts } from '../utils/scheduleUtils';

// Initial sample data
const INITIAL_COURSES = [
  {
    id: 'course-1',
    name: 'Introduction to Computer Science',
    code: 'CS101',
    credits: 3,
    instructor: 'Dr. Sarah Johnson',
    expectedEnrollment: 100,
    requiresLab: true,
    requiredEquipment: ['Computers', 'Projector'],
    department: 'Computer Science',
    academicYear: 'First Year'
  },
  {
    id: 'course-2',
    name: 'Database Systems',
    code: 'CS301',
    credits: 4,
    instructor: 'Prof. Michael Chen',
    expectedEnrollment: 60,
    requiresLab: true,
    requiredEquipment: ['Computers', 'Database Server'],
    department: 'Computer Science',
    academicYear: 'Third Year'
  },
  // IT courses for first year
  {
    id: 'course-3',
    name: 'IT Fundamentals',
    code: 'IT101',
    credits: 3,
    instructor: 'Prof. Emily Wilson',
    expectedEnrollment: 80,
    requiresLab: true,
    requiredEquipment: ['Computers', 'Projector'],
    department: 'IT',
    academicYear: 'First Year'
  },
  {
    id: 'course-4',
    name: 'Introduction to Programming',
    code: 'IT102',
    credits: 4,
    instructor: 'Dr. David Miller',
    expectedEnrollment: 75,
    requiresLab: true,
    requiredEquipment: ['Computers'],
    department: 'IT',
    academicYear: 'First Year'
  },
  // IT courses for second year
  {
    id: 'course-5',
    name: 'Data Structures',
    code: 'IT201',
    credits: 4,
    instructor: 'Dr. Jennifer Lee',
    expectedEnrollment: 65,
    requiresLab: true,
    requiredEquipment: ['Computers'],
    department: 'IT',
    academicYear: 'Second Year'
  },
  {
    id: 'course-6',
    name: 'Computer Networks',
    code: 'IT202',
    credits: 3,
    instructor: 'Prof. Robert Chen',
    expectedEnrollment: 60,
    requiresLab: true,
    requiredEquipment: ['Computers', 'Network Equipment'],
    department: 'IT',
    academicYear: 'Second Year'
  },
  // IT courses for third year
  {
    id: 'course-7',
    name: 'Web Development',
    code: 'IT301',
    credits: 3,
    instructor: 'Prof. Amanda Davis',
    expectedEnrollment: 55,
    requiresLab: true,
    requiredEquipment: ['Computers', 'Web Servers'],
    department: 'IT',
    academicYear: 'Third Year'
  },
  {
    id: 'course-8',
    name: 'Database Management',
    code: 'IT302',
    credits: 4,
    instructor: 'Dr. Michael Robinson',
    expectedEnrollment: 50,
    requiresLab: true,
    requiredEquipment: ['Computers', 'Database Server'],
    department: 'IT',
    academicYear: 'Third Year'
  },
  // IT courses for fourth year
  {
    id: 'course-9',
    name: 'Software Engineering',
    code: 'IT401',
    credits: 4,
    instructor: 'Dr. Laura Morgan',
    expectedEnrollment: 45,
    requiresLab: true,
    requiredEquipment: ['Computers', 'Software Tools'],
    department: 'IT',
    academicYear: 'Fourth Year'
  },
  {
    id: 'course-10',
    name: 'IT Project Management',
    code: 'IT402',
    credits: 3,
    instructor: 'Prof. James Wilson',
    expectedEnrollment: 40,
    requiresLab: false,
    requiredEquipment: ['Projector'],
    department: 'IT',
    academicYear: 'Fourth Year'
  }
];

const INITIAL_ROOMS = [
  {
    id: 'room-1',
    name: 'Lecture Hall A',
    type: 'Lecture Hall',
    capacity: 120,
    building: 'Science Building',
    equipment: ['Projector', 'Smart Board', 'Audio System']
  },
  {
    id: 'room-2',
    name: 'Computer Lab 101',
    type: 'Computer Lab',
    capacity: 60,
    building: 'Engineering Building',
    equipment: ['Computers', 'Projector', 'Database Server']
  }
];

const INITIAL_ALLOCATIONS = [
  {
    roomId: 'room-1',
    roomName: 'Lecture Hall A',
    building: 'Science Building',
    courses: []
  },
  {
    roomId: 'room-2',
    roomName: 'Computer Lab 101',
    building: 'Engineering Building',
    courses: []
  }
];

// Storage configuration
const STORAGE_CONFIG = {
  keys: {
    COURSES: 'campusSchedPro_courses',
    SCHEDULE: 'campusSchedPro_schedule',
    ROOMS: 'campusSchedPro_rooms',
    ALLOCATIONS: 'campusSchedPro_allocations'
  },
  
  load(key, fallback) {
    if (typeof window === 'undefined') return fallback;
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? JSON.parse(stored) : fallback;
    } catch {
      return fallback;
    }
  },
  
  save(key, data) {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // Fail silently in production
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn('Failed to save to localStorage');
      }
    }
  },
  
  clear() {
    if (typeof window === 'undefined') return;
    try {
      Object.values(this.keys).forEach(key => 
        window.localStorage.removeItem(key)
      );
    } catch {
      // Fail silently
    }
  }
};

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
  // Initialize state from storage with fallback to initial data
  const [courses, setCourses] = useState(() => 
    STORAGE_CONFIG.load(STORAGE_CONFIG.keys.COURSES, INITIAL_COURSES)
  );
  
  const [schedule, setSchedule] = useState(() => 
    STORAGE_CONFIG.load(STORAGE_CONFIG.keys.SCHEDULE, {})
  );
  
  const [rooms, setRooms] = useState(() => 
    STORAGE_CONFIG.load(STORAGE_CONFIG.keys.ROOMS, INITIAL_ROOMS)
  );
  
  const [allocations, setAllocations] = useState(() => 
    STORAGE_CONFIG.load(STORAGE_CONFIG.keys.ALLOCATIONS, INITIAL_ALLOCATIONS)
  );

  const [conflicts, setConflicts] = useState([]);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Persist state changes to storage
  useEffect(() => {
    STORAGE_CONFIG.save(STORAGE_CONFIG.keys.COURSES, courses);
  }, [courses]);

  useEffect(() => {
    STORAGE_CONFIG.save(STORAGE_CONFIG.keys.SCHEDULE, schedule);
  }, [schedule]);

  useEffect(() => {
    STORAGE_CONFIG.save(STORAGE_CONFIG.keys.ROOMS, rooms);
  }, [rooms]);

  useEffect(() => {
    STORAGE_CONFIG.save(STORAGE_CONFIG.keys.ALLOCATIONS, allocations);
  }, [allocations]);

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
  const assignRoom = useCallback((courseId, roomId) => {
    const course = courses.find(c => c.id === courseId);
    const room = roomId ? rooms.find(r => r.id === roomId) : null;
    
    if (!course) return false;
    if (roomId && !room) return false;

    // Update course with room assignment (or remove assignment if roomId is null)
    const updatedCourses = courses.map(c => 
      c.id === courseId ? { ...c, room: room?.name || null } : c
    );
    setCourses(updatedCourses);

    // Update schedule to reflect room assignment
    const updatedSchedule = { ...schedule };
    Object.keys(updatedSchedule).forEach(slotId => {
      updatedSchedule[slotId] = updatedSchedule[slotId].map(c => 
        c.id === courseId ? { ...c, room: room?.name || null } : c
      );
    });
    setSchedule(updatedSchedule);

    // Update allocations immutably
    const updatedAllocations = allocations.map(allocation => ({
      ...allocation,
      courses: allocation.courses.filter(c => c.id !== courseId)
    }));

    // Add course to new room allocation if room is assigned
    if (room) {
      const roomIndex = updatedAllocations.findIndex(a => a.roomId === roomId);
      if (roomIndex !== -1) {
        const courseSchedule = Object.entries(updatedSchedule)
          .filter(([_, courses]) => courses.some(c => c.id === courseId))
          .map(([slotId]) => slotId);

        updatedAllocations[roomIndex] = {
          ...updatedAllocations[roomIndex],
          courses: [
            ...updatedAllocations[roomIndex].courses,
            {
              ...course,
              room: room.name,
              schedule: courseSchedule
            }
          ]
        };
      }
    }

    setAllocations(updatedAllocations);

    // Check for conflicts after assignment
    const newConflicts = findScheduleConflicts(updatedSchedule);
    if (newConflicts.length > 0) {
      showNotification(`Warning: Found ${newConflicts.length} scheduling conflicts after room assignment`, 'warning');
    } else {
      const message = room 
        ? `Successfully assigned ${course.code} to ${room.name}`
        : `Successfully removed room assignment from ${course.code}`;
      showNotification(message, 'success');
    }

    return true;
  }, [courses, rooms, schedule, showNotification]);

  // Function to resolve a conflict by moving a course to a different slot
  const resolveConflict = useCallback((conflictId, courseIdToMove, newSlotId) => {
    const conflict = conflicts.find(c => c.id === conflictId);
    if (!conflict) return false;

    const courseToMove = courses.find(c => c.id === courseIdToMove);
    if (!courseToMove) return false;

    // Remove course from its current slot
    const currentSlot = conflict.slotId;
    const updatedSchedule = { ...schedule };
    updatedSchedule[currentSlot] = updatedSchedule[currentSlot].filter(
      c => c.id !== courseIdToMove
    );

    // Add course to new slot
    if (!updatedSchedule[newSlotId]) {
      updatedSchedule[newSlotId] = [];
    }
    updatedSchedule[newSlotId].push(courseToMove);

    setSchedule(updatedSchedule);
    showNotification(`Moved ${courseToMove.code} to resolve conflict`, 'success');

    return true;
  }, [conflicts, courses, schedule, showNotification]);

  // Function to update room allocations when schedule changes
  const updateAllocations = useCallback(() => {
    const newAllocations = [...allocations];

    // Clear existing course assignments
    newAllocations.forEach(allocation => {
      allocation.courses = [];
    });

    // Rebuild allocations based on scheduled courses
    Object.entries(schedule).forEach(([slotId, coursesInSlot]) => {
      coursesInSlot.forEach(course => {
        if (course.room) {
          const roomAllocation = newAllocations.find(
            a => a.roomName === course.room
          );
          
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule]); // Only depend on schedule to avoid circular dependencies

  // Call updateAllocations whenever schedule or courses change
  useEffect(() => {
    updateAllocations();
  }, [schedule, courses, updateAllocations]);

  // Function to clear all stored data
  const clearStoredData = useCallback(() => {
    STORAGE_CONFIG.clear();
    setCourses(INITIAL_COURSES);
    setSchedule({});
    setRooms(INITIAL_ROOMS);
    setAllocations(INITIAL_ALLOCATIONS);
    showNotification('All stored data has been cleared', 'info');
  }, [showNotification]);

  // Function to remove a course from a specific time slot
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
    // This ensures that other instances of the same course (with same courseId)
    // in the same slot will not be affected
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
    clearStoredData,
    removeCourseFromSlot
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
