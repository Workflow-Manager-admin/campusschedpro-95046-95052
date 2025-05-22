import React, { useState, useCallback } from 'react';
import { Alert, Snackbar } from '@mui/material';
import { isRoomSuitableForCourse, findSuitableRooms } from '../../utils/roomUtils';

// Sample room data - would typically be passed as props or from context
const SAMPLE_ROOMS = [
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

// Sample course data - would typically be passed as props or from context
const SAMPLE_COURSES = [
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
    name: 'Software Engineering',
    code: 'CS401',
    credits: 3,
    instructor: 'Dr. Wilson',
    room: null,
    expectedEnrollment: 40,
    requiresLab: false,
    requiredEquipment: ['Projector']
  }
];

// Sample room allocation data
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

const RoomAllocation = () => {
  const [rooms] = useState(SAMPLE_ROOMS);
  const [courses] = useState(SAMPLE_COURSES);
  const [allocations, setAllocations] = useState(INITIAL_ALLOCATIONS);
  const [buildingFilter, setBuildingFilter] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  const buildings = ['all', ...new Set(allocations.map(a => a.building))];
  
  const filteredAllocations = allocations.filter(allocation => 
    buildingFilter === 'all' || allocation.building === buildingFilter
  );

  const handleCloseNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, open: false }));
  }, []);

  const showNotification = useCallback((message, severity = 'info') => {
    setNotification({
      open: true,
      message,
      severity
    });
  }, []);

  const handleSelectCourse = (course) => {
    setSelectedCourse(course);
    
    // Find suitable rooms for this course
    const suitableRooms = findSuitableRooms(rooms, course);
    if (suitableRooms.length === 0) {
      showNotification(`No suitable rooms found for ${course.code}`, 'warning');
    }
  };

  const handleSelectRoom = (room) => {
    setSelectedRoom(room);
    
    if (selectedCourse) {
      // Check if room is suitable for selected course
      const suitabilityCheck = isRoomSuitableForCourse(room, selectedCourse);
      if (!suitabilityCheck.suitable) {
        showNotification(suitabilityCheck.message, 'warning');
      }
    }
  };

  const handleAssignRoom = () => {
    if (!selectedCourse || !selectedRoom) {
      showNotification('Please select both a course and a room', 'error');
      return;
    }

    // Check room suitability
    const suitabilityCheck = isRoomSuitableForCourse(selectedRoom, selectedCourse);
    if (!suitabilityCheck.suitable) {
      showNotification(suitabilityCheck.message, 'error');
      return;
    }

    // Create a new allocation with course assigned to selected room
    const updatedAllocations = allocations.map(allocation => {
      if (allocation.roomId === selectedRoom.id) {
        // Check if course already exists in this room's allocation
        const courseExists = allocation.courses.some(course => course.id === selectedCourse.id);
        if (courseExists) {
          showNotification(`${selectedCourse.code} is already assigned to ${allocation.roomName}`, 'warning');
          return allocation;
        }

        // Add course to this room's allocation
        return {
          ...allocation,
          courses: [...allocation.courses, {
            ...selectedCourse,
            schedule: ['To Be Scheduled'] // This would be populated from the course schedule
          }]
        };
      }
      return allocation;
    });

    setAllocations(updatedAllocations);
    showNotification(`${selectedCourse.code} assigned to ${selectedRoom.name}`, 'success');
    setSelectedCourse(null);
  };

  const handleRemoveCourse = (roomId, courseId) => {
    // Remove course from room allocation
    const updatedAllocations = allocations.map(allocation => {
      if (allocation.roomId === roomId) {
        return {
          ...allocation,
          courses: allocation.courses.filter(course => course.id !== courseId)
        };
      }
      return allocation;
    });

    setAllocations(updatedAllocations);
    showNotification('Course removed from room assignment', 'success');
  };

  const handleAutoAssign = () => {
    let newAllocations = [...allocations];
    let assignedCount = 0;
    let failedCount = 0;

    // Try to assign each unassigned course to a suitable room
    courses.forEach(course => {
      // Skip courses that are already assigned
      const isAlreadyAssigned = newAllocations.some(allocation => 
        allocation.courses.some(c => c.id === course.id)
      );
      
      if (isAlreadyAssigned) return;

      // Find suitable rooms
      const suitableRooms = findSuitableRooms(rooms, course);
      if (suitableRooms.length === 0) {
        failedCount++;
        return;
      }

      // Assign to first suitable room
      const targetRoom = suitableRooms[0];
      newAllocations = newAllocations.map(allocation => {
        if (allocation.roomId === targetRoom.id) {
          return {
            ...allocation,
            courses: [...allocation.courses, {
              ...course,
              schedule: ['To Be Scheduled']
            }]
          };
        }
        return allocation;
      });

      assignedCount++;
    });

    setAllocations(newAllocations);
    
    if (assignedCount > 0) {
      showNotification(`Auto-assigned ${assignedCount} courses to rooms`, 'success');
    }
    
    if (failedCount > 0) {
      showNotification(`Could not find suitable rooms for ${failedCount} courses`, 'warning');
    }
  };

  return (
    <div className="room-allocation">
      <div className="room-header">
        <h2>Room Allocation</h2>
        <div>
          <button className="btn btn-accent" onClick={handleAutoAssign}>
            Auto-Assign Rooms
          </button>
        </div>
      </div>

      <div className="allocation-interface">
        <div className="allocation-controls">
          <div className="search-filters">
            <div className="filter-group">
              <span className="filter-label">Building:</span>
              <select 
                className="filter-select"
                value={buildingFilter}
                onChange={(e) => setBuildingFilter(e.target.value)}
              >
                {buildings.map((building, index) => (
                  <option key={index} value={building}>
                    {building === 'all' ? 'All Buildings' : building}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="manual-assignment">
            <h3>Manual Assignment</h3>
            <div className="assignment-selectors">
              <div className="selector">
                <label>Select Course:</label>
                <select 
                  value={selectedCourse?.id || ''} 
                  onChange={(e) => {
                    const course = courses.find(c => c.id === e.target.value);
                    handleSelectCourse(course || null);
                  }}
                >
                  <option value="">-- Select Course --</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="selector">
                <label>Select Room:</label>
                <select 
                  value={selectedRoom?.id || ''} 
                  onChange={(e) => {
                    const room = rooms.find(r => r.id === e.target.value);
                    handleSelectRoom(room || null);
                  }}
                >
                  <option value="">-- Select Room --</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>
                      {room.name} ({room.building})
                    </option>
                  ))}
                </select>
              </div>
              
              <button 
                className="btn" 
                onClick={handleAssignRoom}
                disabled={!selectedCourse || !selectedRoom}
              >
                Assign Room
              </button>
            </div>
          </div>
        </div>

        <div className="allocation-container">
          {filteredAllocations.map(allocation => (
            <div key={allocation.roomId} className="allocation-card">
              <div className="allocation-header">
                <h3 className="allocation-title">{allocation.roomName}</h3>
                <span>{allocation.building}</span>
              </div>

              <table className="schedule-table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Instructor</th>
                    <th>Schedule</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allocation.courses.map(course => (
                    <tr key={course.id}>
                      <td>{course.code} - {course.name}</td>
                      <td>{course.instructor}</td>
                      <td>{course.schedule.join(', ')}</td>
                      <td>
                        <button 
                          className="btn btn-icon btn-danger" 
                          onClick={() => handleRemoveCourse(allocation.roomId, course.id)}
                          title="Remove Assignment"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                  {allocation.courses.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '20px 0' }}>
                        No courses assigned
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default RoomAllocation;
