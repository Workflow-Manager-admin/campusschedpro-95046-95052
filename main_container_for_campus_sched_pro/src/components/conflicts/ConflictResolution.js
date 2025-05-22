import React, { useState, useCallback, useEffect } from 'react';
import { Alert, Snackbar } from '@mui/material';
import { findScheduleConflicts, formatSlotId } from '../../utils/scheduleUtils';

// Sample schedule data - would normally be passed as props or from context
const SAMPLE_SCHEDULE = {
  'Monday-9:00 AM': [
    {
      id: 'course-1',
      name: 'Introduction to Computer Science',
      code: 'CS101',
      credits: 3,
      instructor: 'Dr. Smith',
      room: 'Lecture Hall A'
    },
    {
      id: 'course-4',
      name: 'Software Engineering',
      code: 'CS401',
      credits: 3,
      instructor: 'Dr. Wilson',
      room: 'Lecture Hall A' // Same room as CS101
    }
  ],
  'Monday-1:00 PM': [
    {
      id: 'course-2',
      name: 'Data Structures',
      code: 'CS201',
      credits: 4,
      instructor: 'Dr. Johnson',
      room: 'Lab 101'
    }
  ],
  'Tuesday-1:00 PM': [
    {
      id: 'course-3',
      name: 'Database Systems',
      code: 'CS301',
      credits: 3,
      instructor: 'Dr. Davis',
      room: 'Lecture Hall A'
    },
    {
      id: 'course-5',
      name: 'Computer Networks',
      code: 'CS402',
      credits: 3,
      instructor: 'Dr. Davis', // Same instructor as CS301
      room: 'Seminar Room 201'
    }
  ]
};

// Sample available rooms for resolving conflicts
const AVAILABLE_ROOMS = [
  { id: 'room-1', name: 'Lecture Hall A', capacity: 120 },
  { id: 'room-2', name: 'Lab 101', capacity: 30 },
  { id: 'room-3', name: 'Seminar Room 201', capacity: 40 },
  { id: 'room-4', name: 'Classroom 102', capacity: 60 },
  { id: 'room-5', name: 'Lecture Hall B', capacity: 100 }
];

// Sample available time slots for resolving conflicts
const AVAILABLE_TIME_SLOTS = [
  'Monday-9:00 AM',
  'Monday-10:00 AM',
  'Monday-11:00 AM',
  'Monday-1:00 PM',
  'Monday-2:00 PM',
  'Tuesday-9:00 AM',
  'Tuesday-10:00 AM',
  'Tuesday-11:00 AM',
  'Tuesday-1:00 PM',
  'Tuesday-2:00 PM',
  'Wednesday-9:00 AM',
  'Wednesday-10:00 AM',
  'Wednesday-11:00 AM',
  'Wednesday-1:00 PM',
  'Wednesday-2:00 PM'
];

const ConflictResolution = () => {
  const [schedule, setSchedule] = useState(SAMPLE_SCHEDULE);
  const [conflicts, setConflicts] = useState([]);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [currentConflict, setCurrentConflict] = useState(null);
  const [resolutionMethod, setResolutionMethod] = useState('changeRoom');
  const [selectedNewRoom, setSelectedNewRoom] = useState('');
  const [selectedNewTimeSlot, setSelectedNewTimeSlot] = useState('');
  const [selectedCourseToMove, setSelectedCourseToMove] = useState('');
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Find conflicts when the schedule changes
  useEffect(() => {
    const foundConflicts = findScheduleConflicts(schedule);
    setConflicts(foundConflicts);
  }, [schedule]);

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

  const handleResolveConflict = (conflict) => {
    setCurrentConflict(conflict);
    setShowResolutionModal(true);
    setResolutionMethod('changeRoom');
    setSelectedNewRoom('');
    setSelectedNewTimeSlot('');
    setSelectedCourseToMove(conflict.courses[0].id);
  };

  const handleApplyResolution = () => {
    if (!currentConflict) return;

    const courseToMove = currentConflict.courses.find(c => c.id === selectedCourseToMove);
    if (!courseToMove) {
      showNotification('Please select a course to move', 'error');
      return;
    }

    const newSchedule = { ...schedule };
    const { slotId } = currentConflict;

    if (resolutionMethod === 'changeRoom') {
      if (!selectedNewRoom) {
        showNotification('Please select a new room', 'error');
        return;
      }

      // Update the room for the selected course
      newSchedule[slotId] = newSchedule[slotId].map(course => {
        if (course.id === selectedCourseToMove) {
          return { ...course, room: selectedNewRoom };
        }
        return course;
      });
      
      showNotification(`Changed room for ${courseToMove.code} to ${selectedNewRoom}`, 'success');
    } 
    else if (resolutionMethod === 'changeTime') {
      if (!selectedNewTimeSlot) {
        showNotification('Please select a new time slot', 'error');
        return;
      }

      // Check if the new time slot already exists in the schedule
      if (!newSchedule[selectedNewTimeSlot]) {
        newSchedule[selectedNewTimeSlot] = [];
      }

      // Check for conflicts in the new slot
      const conflictInNewSlot = newSchedule[selectedNewTimeSlot].some(c => 
        c.instructor === courseToMove.instructor || c.room === courseToMove.room
      );

      if (conflictInNewSlot) {
        showNotification('This would create a new conflict. Please choose a different time slot.', 'error');
        return;
      }

      // Move the course to the new time slot
      newSchedule[selectedNewTimeSlot].push(courseToMove);
      // Remove from original slot
      newSchedule[slotId] = newSchedule[slotId].filter(course => course.id !== selectedCourseToMove);
      
      showNotification(`Moved ${courseToMove.code} to ${selectedNewTimeSlot}`, 'success');
    }

    setSchedule(newSchedule);
    setShowResolutionModal(false);
  };

  const handleResolveAll = () => {
    if (conflicts.length === 0) {
      showNotification('No conflicts to resolve', 'info');
      return;
    }

    let newSchedule = { ...schedule };
    let resolvedCount = 0;
    let failedCount = 0;

    // Try to resolve each conflict
    conflicts.forEach(conflict => {
      // For this demo, we'll use a simple strategy: try to move the second course to a different time
      const courseToMove = conflict.courses[1];
      const { slotId } = conflict;
      
      // Find an available time slot that doesn't create new conflicts
      const availableSlot = AVAILABLE_TIME_SLOTS.find(newSlot => {
        // Skip if it's the current slot
        if (newSlot === slotId) return false;
        
        // Skip if slot doesn't exist in schedule yet
        if (!newSchedule[newSlot]) return true;
        
        // Check for conflicts in the new slot
        return !newSchedule[newSlot].some(c => 
          c.instructor === courseToMove.instructor || c.room === courseToMove.room
        );
      });

      if (availableSlot) {
        // Ensure the slot exists in the schedule
        if (!newSchedule[availableSlot]) {
          newSchedule[availableSlot] = [];
        }
        
        // Move the course to the new time slot
        newSchedule[availableSlot].push(courseToMove);
        // Remove from original slot
        newSchedule[slotId] = newSchedule[slotId].filter(course => course.id !== courseToMove.id);
        
        resolvedCount++;
      } else {
        failedCount++;
      }
    });

    setSchedule(newSchedule);
    
    if (resolvedCount > 0) {
      showNotification(`Successfully resolved ${resolvedCount} conflicts`, 'success');
    }
    
    if (failedCount > 0) {
      showNotification(`Could not automatically resolve ${failedCount} conflicts`, 'warning');
    }
  };

  const getConflictType = (conflict) => {
    switch(conflict.type) {
      case 'instructor':
        return 'Instructor Double-Booked';
      case 'room':
        return 'Room Double-Booked';
      default:
        return 'Scheduling Conflict';
    }
  };

  return (
    <div className="conflict-resolution">
      <div className="card-header">
        <h2 className="card-title">Schedule Conflicts</h2>
        <button 
          className="btn btn-accent"
          onClick={handleResolveAll}
        >
          Resolve All
        </button>
      </div>
      
      <div className="conflicts-container">
        {conflicts.length === 0 ? (
          <div className="no-conflicts">
            <p>No scheduling conflicts detected.</p>
          </div>
        ) : (
          <>
            <div className="conflict-summary">
              <p>Found {conflicts.length} conflicts in the current schedule.</p>
            </div>
            
            <div className="conflicts-list">
              {conflicts.map((conflict, index) => {
                const { day, time } = formatSlotId(conflict.slotId);
                return (
                  <div key={index} className="conflict-card">
                    <div className="conflict-header">
                      <div className="conflict-type">
                        {getConflictType(conflict)}
                      </div>
                      <div className="conflict-time">
                        {day} at {time}
                      </div>
                    </div>
                    
                    <div className="conflict-details">
                      <div className="conflict-courses">
                        {conflict.courses.map(course => (
                          <div key={course.id} className="conflict-course-item">
                            <div className="course-code">{course.code}</div>
                            <div className="course-name">{course.name}</div>
                            <div className="course-details">
                              <span>Instructor: {course.instructor}</span>
                              <span>Room: {course.room || 'Not assigned'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="conflict-actions">
                        <button 
                          className="btn"
                          onClick={() => handleResolveConflict(conflict)}
                        >
                          Resolve
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      
      {/* Resolution modal */}
      {showResolutionModal && currentConflict && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Resolve Conflict</h3>
              <button 
                className="btn-close"
                onClick={() => setShowResolutionModal(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="conflict-summary">
                <p>
                  <strong>Conflict Type:</strong> {getConflictType(currentConflict)}
                </p>
                <p>
                  <strong>Time Slot:</strong> {formatSlotId(currentConflict.slotId).day} at {formatSlotId(currentConflict.slotId).time}
                </p>
              </div>
              
              <div className="form-group">
                <label>Select Course to Move:</label>
                <select
                  value={selectedCourseToMove}
                  onChange={(e) => setSelectedCourseToMove(e.target.value)}
                >
                  {currentConflict.courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Resolution Method:</label>
                <div className="resolution-options">
                  <div className="resolution-option">
                    <input
                      type="radio"
                      id="changeRoom"
                      name="resolutionMethod"
                      value="changeRoom"
                      checked={resolutionMethod === 'changeRoom'}
                      onChange={() => setResolutionMethod('changeRoom')}
                    />
                    <label htmlFor="changeRoom">Change Room</label>
                  </div>
                  
                  <div className="resolution-option">
                    <input
                      type="radio"
                      id="changeTime"
                      name="resolutionMethod"
                      value="changeTime"
                      checked={resolutionMethod === 'changeTime'}
                      onChange={() => setResolutionMethod('changeTime')}
                    />
                    <label htmlFor="changeTime">Change Time Slot</label>
                  </div>
                </div>
              </div>
              
              {resolutionMethod === 'changeRoom' ? (
                <div className="form-group">
                  <label>Select New Room:</label>
                  <select
                    value={selectedNewRoom}
                    onChange={(e) => setSelectedNewRoom(e.target.value)}
                  >
                    <option value="">-- Select Room --</option>
                    {AVAILABLE_ROOMS.map(room => (
                      <option key={room.id} value={room.name}>
                        {room.name} (Capacity: {room.capacity})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="form-group">
                  <label>Select New Time Slot:</label>
                  <select
                    value={selectedNewTimeSlot}
                    onChange={(e) => setSelectedNewTimeSlot(e.target.value)}
                  >
                    <option value="">-- Select Time Slot --</option>
                    {AVAILABLE_TIME_SLOTS.map((slot, index) => {
                      const { day, time } = formatSlotId(slot);
                      return (
                        <option key={index} value={slot}>
                          {day} at {time}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn"
                onClick={() => setShowResolutionModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-accent"
                onClick={handleApplyResolution}
              >
                Apply Resolution
              </button>
            </div>
          </div>
        </div>
      )}
      
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

export default ConflictResolution;
