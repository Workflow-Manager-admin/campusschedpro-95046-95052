import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { findScheduleConflicts } from '../utils/scheduleUtils';

// Initial sample data
const INITIAL_COURSES = [
  {
    id: 'course-1',
    name: 'Introduction to Computer Science',
    code: 'CS101',
    credits: 3,
    instructor: 'Dr. Smith',
    room: null,
    expectedEnrollment: 35,
    requiresLab: false,
    requiredEquipment: ['Projector', 'Whiteboard']
  },
  {
    id: 'course-2',
    name: 'Data Structures',
    code: 'CS201',
    credits: 4,
    instructor: 'Dr. Johnson',
    room: null,
    expectedEnrollment: 25,
    requiresLab: true,
    requiredEquipment: ['Computers', 'Projector', 'Whiteboard']
  },
  {
    id: 'course-3',
    name: 'Database Systems',
    code: 'CS301',
    credits: 3,
    instructor: 'Dr. Davis',
    room: null,
    expectedEnrollment: 80,
    requiresLab: false,
    requiredEquipment: ['Projector', 'Smart Board']
  },
  {
    id: 'course-4',
    name: 'Web Development',
    code: 'CS245',
    credits: 3,
    instructor: 'Dr. Rodriguez',
    room: null,
    expectedEnrollment: 40,
    requiresLab: true,
    requiredEquipment: ['Computers', 'Projector']
  },
  {
    id: 'course-5',
    name: 'Operating Systems',
    code: 'CS351',
    credits: 4,
    instructor: 'Dr. Chen',
    room: null,
    expectedEnrollment: 35,
    requiresLab: false,
    requiredEquipment: ['Projector', 'Whiteboard']
  }
];

const INITIAL_ROOMS = [
  {
    id: 'room-1',
    name: 'Lecture Hall A',
    type: 'Lecture Hall',
    capacity: 120,
    equipment: ['Projector', 'Smart Board', 'Audio System'],
    building: 'Science Building',
    floor: '1st Floor'
  },
  {
    id: 'room-2',
    name: 'Lab 101',
    type: 'Computer Lab',
    capacity: 30,
    equipment: ['Computers', 'Projector', 'Whiteboard'],
    building: 'Engineering Building',
    floor: '2nd Floor'
  },
  {
    id: 'room-3',
    name: 'Seminar Room 201',
    type: 'Seminar Room',
    capacity: 40,
    equipment: ['Projector', 'Whiteboard'],
    building: 'Humanities Building',
    floor: '3rd Floor'
  }
];

// Initial room allocation data
const INITIAL_ALLOCATIONS = [
  {
    roomId: 'room-1',
    roomName: 'Lecture Hall A',
    building: 'Science Building',
    courses: [
      {
        id: 'course-1',
        name: 'Introduction to Computer Science',
        code: 'CS101',
        instructor: 'Dr. Smith',
        schedule: ['Monday-9:00 AM', 'Wednesday-9:00 AM']
      },
      {
        id: 'course-3',
        name: 'Database Systems',
        code: 'CS301',
        instructor: 'Dr. Davis',
        schedule: ['Tuesday-1:00 PM', 'Thursday-1:00 PM']
      }
    ]
  },
  {
    roomId: 'room-2',
    roomName: 'Lab 101',
    building: 'Engineering Building',
    courses: [
      {
        id: 'course-2',
        name: 'Data Structures',
        code: 'CS201',
        instructor: 'Dr. Johnson',
        schedule: ['Monday-1:00 PM', 'Wednesday-1:00 PM']
      }
    ]
  },
  {
    roomId: 'room-3',
    roomName: 'Seminar Room 201',
    building: 'Humanities Building',
    courses: []
  }
];

// Create the context
const ScheduleContext = createContext();

// PUBLIC_INTERFACE
export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
};

/**
 * Provider component that wraps the application and makes schedule state available to any
 * child component that calls useSchedule().
 */
export const ScheduleProvider = ({ children }) => {
  const [courses, setCourses] = useState(INITIAL_COURSES);
  const [schedule, setSchedule] = useState({});
  const [conflicts, setConflicts] = useState([]);
  const [rooms, setRooms] = useState(INITIAL_ROOMS);
  const [allocations, setAllocations] = useState(INITIAL_ALLOCATIONS);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Update conflicts whenever schedule changes
  useEffect(() => {
    const newConflicts = findScheduleConflicts(schedule);
    setConflicts(newConflicts);
  }, [schedule]);

  // Function to show notifications across components
  const showNotification = (message, severity = 'info') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  // Function to assign a room to a course
  const assignRoom = (courseId, roomId) => {
    const course = courses.find(c => c.id === courseId);
    const room = rooms.find(r => r.id === roomId);
    
    if (!course || !room) return false;

    // Update course with room assignment
    const updatedCourses = courses.map(c => 
      c.id === courseId ? { ...c, room: room.name } : c
    );
    setCourses(updatedCourses);

    // Update schedule to reflect room assignment
    const updatedSchedule = { ...schedule };
    Object.keys(updatedSchedule).forEach(slotId => {
      updatedSchedule[slotId] = updatedSchedule[slotId].map(c => 
        c.id === courseId ? { ...c, room: room.name } : c
      );
    });
    setSchedule(updatedSchedule);

    // Check for conflicts after assignment
    const newConflicts = findScheduleConflicts(updatedSchedule);
    if (newConflicts.length > 0) {
      showNotification(`Warning: Found ${newConflicts.length} scheduling conflicts after room assignment`, 'warning');
    } else {
      showNotification(`Successfully assigned ${course.code} to ${room.name}`, 'success');
    }

    return true;
  };

  // Function to resolve a conflict by moving a course to a different slot
  const resolveConflict = (conflictId, courseIdToMove, newSlotId) => {
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
  };

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
  }, [schedule, allocations, setAllocations]);

  // Call updateAllocations whenever schedule or courses change
  useEffect(() => {
    updateAllocations();
  }, [schedule, courses, updateAllocations]);

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
    updateAllocations
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
