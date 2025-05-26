import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Chip,
  Box
} from '@mui/material';
import { useSchedule } from '../../context/ScheduleContext';
import { isRoomSuitableForCourse, findSuitableRooms } from '../../utils/roomUtils';
import RoomAllocationErrorBoundary from './RoomAllocationErrorBoundary';

// Room allocation component - building filter removed for simpler implementation
const RoomAllocation = () => {
  // Using the context for data
  const { 
    courses = [], 
    rooms = [], 
    allocations = [],
    assignRoom,
    showNotification,
    updateAllocations
  } = useSchedule() || {};

  // Component state
  const [dataInitialized, setDataInitialized] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('room');
  const [courseSearchQuery, setCourseSearchQuery] = useState('');

  // Initialize data
  useEffect(() => {
    if (!dataInitialized && updateAllocations) {
      updateAllocations();
      setDataInitialized(true);
    }
  }, [dataInitialized, updateAllocations]);

  // Simple handlers
  const handleSelectCourse = useCallback(course => {
    setSelectedCourse(course);
    setSelectedRoom(null);
  }, []);

  const handleSelectRoom = useCallback(room => {
    setSelectedRoom(room);
  }, []);

  const handleAssignRoom = useCallback(async () => {
    if (!selectedCourse || !selectedRoom || !assignRoom) return;
    
    await assignRoom(selectedCourse.id, selectedRoom.id);
    setSelectedCourse(null);
    setSelectedRoom(null);
    setShowAssignDialog(false);
  }, [selectedCourse, selectedRoom, assignRoom]);

  // Memoized data
  const unassignedCourses = useMemo(() => 
    courses.filter(course => !course.room), 
  [courses]);
  
  const filteredCourses = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return unassignedCourses.filter(course => 
      !query || 
      (course.name && course.name.toLowerCase().includes(query)) || 
      (course.code && course.code.toLowerCase().includes(query))
    );
  }, [unassignedCourses, searchQuery]);

  // All allocations (no filtering by building)
  const allRoomsAndCourses = useMemo(() => {
    return Array.isArray(allocations) ? allocations : [];
  }, [allocations]);

  // Get courses with room assignments for course view
  const coursesWithRooms = useMemo(() => {
    const result = [];
    
    if (Array.isArray(courses)) {
      courses.forEach(course => {
        if (course.room) {
          const roomDetails = rooms.find(r => r.id === course.roomId);
          
          if (courseSearchQuery) {
            const query = courseSearchQuery.toLowerCase();
            if (
              !(course.name && course.name.toLowerCase().includes(query)) &&
              !(course.code && course.code.toLowerCase().includes(query)) &&
              !(roomDetails?.name && roomDetails.name.toLowerCase().includes(query))
            ) {
              return;
            }
          }
          
          result.push({
            ...course,
            roomName: roomDetails?.name || 'Unknown Room',
            building: roomDetails?.building || 'Unknown Building'
          });
        }
      });
    }
    
    return result;
  }, [courses, rooms, courseSearchQuery]);

  return (
    <RoomAllocationErrorBoundary>
      <div className="room-allocation">
        <div className="room-header">
          <h2>Room Allocation</h2>
          <div className="view-controls">
            <div className="view-tabs">
              <button 
                className={`view-tab ${viewMode === 'room' ? 'active' : ''}`}
                onClick={() => setViewMode('room')}
              >
                Room View
              </button>
              <button 
                className={`view-tab ${viewMode === 'course' ? 'active' : ''}`}
                onClick={() => setViewMode('course')}
              >
                Course View
              </button>
            </div>
            <div className="action-buttons">
              <button 
                className="btn"
                onClick={() => setShowAssignDialog(true)}
                disabled={unassignedCourses.length === 0}
              >
                Assign Room
              </button>
              <button 
                className="btn btn-accent" 
                onClick={() => {}} // Auto-assign removed for simplicity
                disabled={true}
                style={{ marginLeft: '10px' }}
              >
                Auto-Assign All
              </button>
            </div>
          </div>
        </div>

        <div className="room-allocation-container">
          {viewMode === 'room' ? (
            // Room View
            <>
              <div className="unassigned-courses-panel">
                <h3>Unassigned Courses</h3>
                
                <div className="search-bar">
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                </div>
                
                <div className="unassigned-courses-list">
                  {filteredCourses.length > 0 ? (
                    filteredCourses.map(course => (
                      <div 
                        key={course.id || Math.random()} 
                        className="unassigned-course-item"
                        onClick={() => {
                          handleSelectCourse(course);
                          setShowAssignDialog(true);
                        }}
                      >
                        <div>
                          <h4>{course.code || ''} - {course.name || ''}</h4>
                          <p>Instructor: {course.instructor || 'Unassigned'}</p>
                        </div>
                        <button className="btn btn-small">Assign</button>
                      </div>
                    ))
                  ) : (
                    <div className="empty-list-message">
                      {unassignedCourses.length === 0 
                        ? "All courses have been assigned rooms" 
                        : "No courses match your search criteria"}
                    </div>
                  )}
                </div>
              </div>

              <div className="allocated-rooms-panel">
                {/* Building filter removed - showing all rooms */}
                
                <div className="allocation-container">
                  {allRoomsAndCourses.length > 0 ? (
                    allRoomsAndCourses.map(allocation => {
                      if (!allocation || !allocation.roomId) return null;
                      
                      return (
                        <div key={allocation.roomId || Math.random()} className="allocation-card">
                          <div className="allocation-header">
                            <h3 className="allocation-title">{allocation.roomName || 'Unknown Room'}</h3>
                            <span>{allocation.building || 'Unknown Building'}</span>
                          </div>

                          <table className="schedule-table">
                            <thead>
                              <tr>
                                <th>Course</th>
                                <th>Instructor</th>
                                <th>Schedule</th>
                                <th></th>
                              </tr>
                            </thead>
                            <tbody>
                              {Array.isArray(allocation.courses) && allocation.courses.length > 0 ? (
                                allocation.courses.map(course => {
                                  if (!course) return null;
                                  
                                  return (
                                    <tr key={course.id || Math.random()}>
                                      <td>{course.code || 'Unknown'} - {course.name || 'Unnamed Course'}</td>
                                      <td>{course.instructor || 'Unassigned'}</td>
                                      <td>{Array.isArray(course.schedule) ? course.schedule.join(', ') : 'Not scheduled'}</td>
                                      <td>
                                        <button 
                                          className="btn-icon"
                                          title="Unassign Room"
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            if (assignRoom) {
                                              await assignRoom(course.id, null);
                                              if (showNotification) {
                                                showNotification(`Unassigned course from room`, 'info');
                                              }
                                            }
                                          }}
                                        >
                                          ⨯
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })
                              ) : (
                                <tr>
                                  <td colSpan={4} style={{ textAlign: 'center', padding: '20px 0' }}>
                                    No courses assigned
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      );
                    })
                  ) : (
                    <div className="no-results">
                      <p>No rooms available in the system</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            // Course View
            <div className="course-allocation-panel">
              <div className="search-bar" style={{ marginBottom: '20px' }}>
                <input
                  type="text"
                  placeholder="Search courses or rooms..."
                  value={courseSearchQuery}
                  onChange={(e) => setCourseSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
              
              <div className="course-allocation-table-container">
                {coursesWithRooms.length > 0 ? (
                  <table className="schedule-table courses-with-rooms-table">
                    <thead>
                      <tr>
                        <th>Course Code</th>
                        <th>Course Name</th>
                        <th>Instructor</th>
                        <th>Room Assignment</th>
                        <th>Building</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coursesWithRooms.map(course => (
                        <tr key={course.id || Math.random()}>
                          <td>{course.code || ''}</td>
                          <td>{course.name || ''}</td>
                          <td>{course.instructor || 'Unassigned'}</td>
                          <td><strong>{course.roomName || ''}</strong></td>
                          <td>{course.building || ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="no-results">
                    <p>No courses have been assigned rooms yet or no courses match your search</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Simple Room Assignment Dialog */}
        <Dialog 
          open={showAssignDialog} 
          onClose={() => setShowAssignDialog(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>
            Assign Room to Course
          </DialogTitle>
          <DialogContent>
            {selectedCourse ? (
              <div className="course-details">
                <h3>{selectedCourse.code || ''} - {selectedCourse.name || ''}</h3>
                <p><strong>Instructor:</strong> {selectedCourse.instructor || 'Unassigned'}</p>
                
                <Typography variant="h6" style={{ marginTop: '20px' }}>
                  Select a room:
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                  {rooms.map(room => (
                    <Chip
                      key={room.id || Math.random()}
                      label={`${room.name || ''} (${room.capacity || '?'} capacity)`}
                      onClick={() => handleSelectRoom(room)}
                      color="primary"
                      variant={selectedRoom?.id === room.id ? "filled" : "outlined"}
                    />
                  ))}
                </Box>
              </div>
            ) : (
              <>
                <Typography variant="subtitle1">
                  Select a course to assign to a room:
                </Typography>
                
                {unassignedCourses.length === 0 ? (
                  <Alert severity="info">All courses have been assigned rooms</Alert>
                ) : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                    {unassignedCourses.map(course => (
                      <Chip
                        key={course.id || Math.random()}
                        label={`${course.code || ''} - ${course.name || ''}`}
                        onClick={() => handleSelectCourse(course)}
                        color="primary"
                        variant={selectedCourse?.id === course.id ? "filled" : "outlined"}
                      />
                    ))}
                  </Box>
                )}
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowAssignDialog(false)} color="primary">
              Cancel
            </Button>
            <Button 
              onClick={handleAssignRoom} 
              color="primary" 
              variant="contained"
              disabled={!selectedCourse || !selectedRoom}
            >
              Assign Room
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </RoomAllocationErrorBoundary>
  );
};

export default RoomAllocation;
