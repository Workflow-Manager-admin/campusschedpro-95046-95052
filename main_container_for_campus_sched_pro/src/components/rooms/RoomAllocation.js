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

const RoomAllocation = () => {
  const { 
    courses, 
    rooms, 
    allocations = [], // Default empty array
    assignRoom,
    showNotification,
    updateAllocations
  } = useSchedule();

  // State management
  const [dataInitialized, setDataInitialized] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('room'); // 'room' or 'course' view
  const [courseSearchQuery, setCourseSearchQuery] = useState('');

  // Initialize data only once
  useEffect(() => {
    if (!dataInitialized) {
      updateAllocations();
      setDataInitialized(true);
    }
  }, [dataInitialized, updateAllocations]);

  // All allocations (no building filtering)
  const filteredAllocations = useMemo(() => {
    return Array.isArray(allocations) ? allocations : [];
  }, [allocations]);

  // Unassigned courses
  const unassignedCourses = useMemo(() => {
    return courses.filter(course => !course.room);
  }, [courses]);
  
  // Filtered unassigned courses by search
  const filteredCourses = useMemo(() => {
    if (!searchQuery) return unassignedCourses;
    
    const query = searchQuery.toLowerCase();
    return unassignedCourses.filter(course => 
      (course.name && course.name.toLowerCase().includes(query)) || 
      (course.code && course.code.toLowerCase().includes(query))
    );
  }, [unassignedCourses, searchQuery]);

  // Course selection handler
  const handleSelectCourse = useCallback((course) => {
    setSelectedCourse(course);
    setSelectedRoom(null);
  }, []);

  // Room selection handler
  const handleSelectRoom = useCallback((room) => {
    setSelectedRoom(room);
    
    if (selectedCourse) {
      const suitabilityCheck = isRoomSuitableForCourse(room, selectedCourse);
      if (!suitabilityCheck.suitable) {
        showNotification(suitabilityCheck.message, 'warning');
      }
    }
  }, [selectedCourse, showNotification]);

  // Room assignment handler
  const handleAssignRoom = useCallback(async () => {
    if (!selectedCourse || !selectedRoom) {
      showNotification('Please select both a course and a room', 'error');
      return;
    }

    const suitabilityCheck = isRoomSuitableForCourse(selectedRoom, selectedCourse);
    if (!suitabilityCheck.suitable) {
      showNotification(suitabilityCheck.message, 'error');
      return;
    }
    
    await assignRoom(selectedCourse.id, selectedRoom.id);
    
    setSelectedCourse(null);
    setSelectedRoom(null);
    setShowAssignDialog(false);
  }, [selectedCourse, selectedRoom, showNotification, assignRoom]);

  // Auto assign handler
  const handleAutoAssign = useCallback(async () => {
    let assignedCount = 0;
    let failedCount = 0;
    const assignmentPromises = [];

    unassignedCourses.forEach(course => {
      const suitableRooms = findSuitableRooms(rooms, course);
      if (suitableRooms.length === 0) {
        failedCount++;
        return;
      }
      assignmentPromises.push({
        course,
        roomId: suitableRooms[0].id
      });
    });

    if (assignmentPromises.length > 0) {
      showNotification(`Assigning ${assignmentPromises.length} courses to rooms...`, 'info');
    }

    const batchSize = 5;
    const successResults = [];
    const failureResults = [];
    
    for (let i = 0; i < assignmentPromises.length; i += batchSize) {
      const batch = assignmentPromises.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(({ course, roomId }) => 
          assignRoom(course.id, roomId)
            .then(success => ({ success, course }))
            .catch(() => ({ success: false, course }))
        )
      );
      
      results.forEach(result => {
        if (result.success) {
          successResults.push(result.course);
        } else {
          failureResults.push(result.course);
        }
      });
    }
    
    assignedCount = successResults.length;
    failedCount = failureResults.length;
    
    if (assignedCount > 0) {
      showNotification(`Auto-assigned ${assignedCount} courses to rooms`, 'success');
    }
    
    if (failedCount > 0) {
      showNotification(`Could not find suitable rooms for ${failedCount} courses`, 'warning');
    }
    
    if (assignedCount > 0) {
      updateAllocations();
    }
  }, [unassignedCourses, rooms, assignRoom, showNotification, updateAllocations]);

  // Get suitable rooms for selected course
  const getSuitableRooms = useCallback(() => {
    if (!selectedCourse) return [];
    
    return rooms.filter(room => {
      const result = isRoomSuitableForCourse(room, selectedCourse);
      return result.suitable;
    });
  }, [selectedCourse, rooms]);
  
  // Get courses with room assignments
  const getCoursesWithRooms = useMemo(() => {
    const coursesWithRooms = [];
    
    courses.forEach(course => {
      if (course.room) {
        const roomDetails = rooms.find(r => r.id === course.roomId);
        coursesWithRooms.push({
          ...course,
          roomName: roomDetails?.name || 'Unknown Room',
          building: roomDetails?.building || 'Unknown Building',
          roomDetails
        });
      }
    });
    
    if (!courseSearchQuery) return coursesWithRooms;
    
    const query = courseSearchQuery.toLowerCase();
    return coursesWithRooms.filter(course => 
      course.name.toLowerCase().includes(query) || 
      course.code.toLowerCase().includes(query) ||
      (course.roomName && course.roomName.toLowerCase().includes(query)) ||
      (course.building && course.building.toLowerCase().includes(query))
    );
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
                onClick={handleAutoAssign}
                disabled={unassignedCourses.length === 0}
                style={{ marginLeft: '10px' }}
              >
                Auto-Assign All
              </button>
            </div>
          </div>
        </div>

        <div className="room-allocation-container">
          {viewMode === 'room' ? (
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
                        key={course.id} 
                        className="unassigned-course-item"
                        onClick={() => {
                          handleSelectCourse(course);
                          setShowAssignDialog(true);
                        }}
                      >
                        <div>
                          <h4>{course.code} - {course.name}</h4>
                          <p>Instructor: {course.instructor}</p>
                          <p>Students: {course.expectedEnrollment}</p>
                          <p>Requirements: {course.requiresLab ? 'Lab, ' : ''}{course.requiredEquipment?.join(', ') || 'None'}</p>
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
                {/* Building filter removed - now showing all rooms together */}

                <div className="allocation-container">
                  {filteredAllocations.map(allocation => {
                    if (!allocation || !allocation.roomId) return null;
                    
                    return (
                      <div key={allocation.roomId} className="allocation-card">
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
                                  <tr key={course.id || `course-${Math.random()}`}>
                                    <td>{course.code || 'Unknown'} - {course.name || 'Unnamed Course'}</td>
                                    <td>{course.instructor || 'Unassigned'}</td>
                                    <td>{Array.isArray(course.schedule) ? course.schedule.join(', ') : 'Not scheduled'}</td>
                                    <td>
                                      <button 
                                        className="btn-icon"
                                        title="Unassign Room"
                                        onClick={async (e) => {
                                          e.stopPropagation(); 
                                          const success = await assignRoom(course.id, null);
                                          if (success) {
                                            showNotification(`Unassigned ${course.code} from room`, 'info');
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
                  })}
                  
                  {filteredAllocations.length === 0 && (
                    <div className="no-results">
                      <p>No rooms available in the system</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
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
                {getCoursesWithRooms.length > 0 ? (
                  <table className="schedule-table courses-with-rooms-table">
                    <thead>
                      <tr>
                        <th>Course Code</th>
                        <th>Course Name</th>
                        <th>Instructor</th>
                        <th>Room Assignment</th>
                        <th>Building</th>
                        <th>Schedule</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getCoursesWithRooms.map(course => (
                        <tr key={course.id}>
                          <td>{course.code}</td>
                          <td>{course.name}</td>
                          <td>{course.instructor || 'Unassigned'}</td>
                          <td><strong>{course.roomName}</strong></td>
                          <td>{course.building}</td>
                          <td>
                            {Array.isArray(course.schedule) ? course.schedule.join(', ') : 
                              (course.timeSlot ? `${course.day} ${course.timeSlot}` : 'Not scheduled')}
                          </td>
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

        {/* Room Assignment Dialog */}
        <Dialog 
          open={showAssignDialog} 
          onClose={() => setShowAssignDialog(false)}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: {
              p: 2,
              borderRadius: 1
            }
          }}
        >
          <DialogTitle>
            Assign Room to Course
          </DialogTitle>
          <DialogContent>
            {selectedCourse ? (
              <>
                <div className="course-details">
                  <h3>{selectedCourse.code} - {selectedCourse.name}</h3>
                  <p><strong>Instructor:</strong> {selectedCourse.instructor}</p>
                  <p><strong>Expected Enrollment:</strong> {selectedCourse.expectedEnrollment} students</p>
                  <p><strong>Equipment Needed:</strong> {selectedCourse.requiredEquipment?.join(', ') || 'None specified'}</p>
                  <p><strong>Requires Lab:</strong> {selectedCourse.requiresLab ? 'Yes' : 'No'}</p>
                </div>
                
                <Typography variant="h6" gutterBottom style={{ marginTop: '20px' }}>
                  Select a suitable room:
                </Typography>
                
                {getSuitableRooms().length === 0 ? (
                  <Alert severity="warning" style={{ marginTop: '10px' }}>
                    No suitable rooms available for this course's requirements
                  </Alert>
                ) : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                    {getSuitableRooms().map(room => (
                      <Chip
                        key={room.id}
                        label={`${room.name} (${room.capacity} capacity)`}
                        onClick={() => handleSelectRoom(room)}
                        color="primary"
                        variant={selectedRoom?.id === room.id ? "filled" : "outlined"}
                      />
                    ))}
                  </Box>
                )}
              </>
            ) : (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  Select a course to assign to a room:
                </Typography>
                
                {unassignedCourses.length === 0 ? (
                  <Alert severity="info">
                    All courses have been assigned rooms
                  </Alert>
                ) : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                    {unassignedCourses.map(course => (
                      <Chip
                        key={course.id}
                        label={`${course.code} - ${course.name}`}
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

/**
 * Room allocation component for managing course room assignments
 * PUBLIC_INTERFACE
 */
RoomAllocation.propTypes = {
  // This component is self-contained and uses context
};

export default RoomAllocation;
