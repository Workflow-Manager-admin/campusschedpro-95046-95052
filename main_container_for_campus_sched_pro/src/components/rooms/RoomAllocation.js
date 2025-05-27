import React, { useState, useEffect, useMemo } from 'react';
import { useSchedule } from '../../context/ScheduleContext';
import RoomAllocationErrorBoundary from './RoomAllocationErrorBoundary';
import { isRoomSuitableForCourse } from '../../utils/roomUtils';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Select, MenuItem, FormControl, InputLabel,
  FormHelperText, Alert
} from '@mui/material';

/**
 * Room allocation component for displaying all assigned rooms and courses together
 * Building filter has been removed to show all rooms at once
 * PUBLIC_INTERFACE
 */
const RoomAllocation = () => {
  // State for view and search
  const [viewMode, setViewMode] = useState('room');
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for course assignment
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [assignmentError, setAssignmentError] = useState('');
  const [isAssigning, setIsAssigning] = useState(false); // Loading state for assigning

  // State for unassignment confirmation
  const [unassignDialogOpen, setUnassignDialogOpen] = useState(false);
  const [courseToUnassign, setCourseToUnassign] = useState(null);
  const [isUnassigning, setIsUnassigning] = useState(false); // Loading for unassign
  const [isRefreshing, setIsRefreshing] = useState(false); // Global refresh/alloc refresh indicator
  
  // Get data from context with safe defaults
  const context = useSchedule();
  const { 
    allocations = [], 
    courses = [], 
    rooms = [],
    updateAllocations = () => {},
    updateCourse = async () => false,
    showNotification = () => {}
  } = context || {};
  
  // Initialize data on mount
  useEffect(() => {
    if (updateAllocations) {
      updateAllocations();
    }
  }, [updateAllocations]);

  // Create a complete allocations array that includes ALL rooms
  const completeAllocations = useMemo(() => {
    // Create a map of existing allocations by room ID for quick lookup
    const allocationsMap = {};
    if (Array.isArray(allocations)) {
      allocations.forEach(allocation => {
        if (allocation.roomId) {
          allocationsMap[allocation.roomId] = allocation;
        }
      });
    }
    
    // Create combined list that includes all rooms
    return Array.isArray(rooms) ? rooms.map(room => {
      // If this room is in allocations, use that data
      if (allocationsMap[room.id]) {
        return allocationsMap[room.id];
      }
      // Otherwise create a new allocation entry for this room
      return {
        roomId: room.id,
        roomName: room.name,
        building: room.building,
        capacity: room.capacity,
        courses: [] // No assigned courses
      };
    }) : [];
  }, [rooms, allocations]);
  
  // Filter unassigned courses by search query
  const unassignedCourses = Array.isArray(courses) 
    ? courses.filter(course => course && !course.room)
    : [];
  const filteredCourses = unassignedCourses.filter(course => {
    if (!course) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const name = (course.name || '').toLowerCase();
    const code = (course.code || '').toLowerCase();
    return name.includes(query) || code.includes(query);
  });
  
  // Room assignment handlers
  const openAssignDialog = (course) => {
    setSelectedCourse(course);
    setSelectedRoomId('');
    setAssignmentError('');
    setAssignDialogOpen(true);
  };
  
  const closeAssignDialog = () => {
    setAssignDialogOpen(false);
    setSelectedCourse(null);
    setSelectedRoomId('');
    setAssignmentError('');
  };
  
  const handleRoomChange = (event) => {
    setSelectedRoomId(event.target.value);
    setAssignmentError('');
  };
  
  const assignCourseToRoom = async () => {
    if (!selectedCourse) {
      setAssignmentError('No course selected');
      return;
    }
    
    if (!selectedRoomId) {
      setAssignmentError('Please select a room');
      return;
    }
    
    try {
      // Validate rooms array
      if (!Array.isArray(rooms)) {
        setAssignmentError('Room data is not available');
        return;
      }
      
      // Find the selected room
      const room = rooms.find(r => r && r.id === selectedRoomId);
      if (!room) {
        setAssignmentError('Room not found');
        return;
      }
      
      // Validate room object
      if (!room.name || !room.id) {
        setAssignmentError('Invalid room data');
        return;
      }
      
      // Check if room is suitable for course
      const suitabilityCheck = isRoomSuitableForCourse(room, selectedCourse);
      if (!suitabilityCheck.suitable) {
        setAssignmentError(suitabilityCheck.message);
        return;
      }
      
      // Update the course with room assignment
      const updatedCourse = {
        ...selectedCourse,
        room: room.name,
        roomId: room.id,
        building: room.building,
        buildingId: room.buildingId,
        capacity: room.capacity,
        type: room.type,
        floor: room.floor
      };
      
      const success = await updateCourse(updatedCourse);

      if (success) {
        // UI notification and state will be refreshed after DB commit
        showNotification(`${selectedCourse.code} has been assigned to ${room.name}`, 'success');
        // robust state refresh from DB (allocations, schedule, courses, rooms)
        if (typeof context.refreshData === 'function') {
          await context.refreshData();
        }
        closeAssignDialog();
      } else {
        setAssignmentError('Failed to assign course to room');
      }
    } catch (error) {
      setAssignmentError(`Error: ${error.message || 'Unknown error'}`);
    }
  };
  
  // Unassignment handlers
  const openUnassignDialog = (course) => {
    setCourseToUnassign(course);
    setUnassignDialogOpen(true);
  };
  
  const closeUnassignDialog = () => {
    setUnassignDialogOpen(false);
    setCourseToUnassign(null);
  };
  
  // PUBLIC_INTERFACE
  const unassignCourse = async () => {
    if (!courseToUnassign) return;
    setIsUnassigning(true);
    try {
      // Remove all schedule assignments for this course from DB before removing room metadata.
      if (courseToUnassign.schedule && Array.isArray(courseToUnassign.schedule) && courseToUnassign.schedule.length > 0) {
        for (const slot of courseToUnassign.schedule) {
          if (typeof slot === "string" && slot.includes('-')) {
            const [day, time] = slot.split('-');
            if (context.unscheduleCourseFromSlot) {
              await context.unscheduleCourseFromSlot(courseToUnassign.id, day, time);
            } else if (typeof window.unscheduleCourse === "function") {
              await window.unscheduleCourse(courseToUnassign.id, day, time);
            }
          }
        }
      }
      // Update the course to remove room assignment
      const updatedCourse = {
        ...courseToUnassign,
        room: null,
        roomId: null,
        building: null
      };
      const success = await updateCourse(updatedCourse);

      if (success) {
        showNotification(`${courseToUnassign.code} has been unassigned from room and schedule`, 'success');
        if (typeof context.refreshData === 'function') {
          setIsRefreshing(true);
          await context.refreshData();
          setIsRefreshing(false);
        }
        closeUnassignDialog();
      } else {
        showNotification('Failed to unassign course', 'error');
      }
    } catch (error) {
      showNotification(`Error: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      setIsUnassigning(false);
    }
  };

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
                      <div key={course.id || Math.random()} className="unassigned-course-item">
                        <div>
                          <h4>{course.code || ''} - {course.name || ''}</h4>
                          <p>Instructor: {course.instructor || 'Unassigned'}</p>
                        </div>
                        <Button 
                          variant="contained" 
                          color="primary"
                          size="small"
                          onClick={() => openAssignDialog(course)}
                        >
                          Assign to Room
                        </Button>
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
                {/* Building filter completely removed - showing all rooms */}
                
                <div className="allocation-container">
                  {Array.isArray(rooms) && rooms.length > 0 ? (
                    Array.isArray(completeAllocations) && completeAllocations.length > 0 ? (
                      completeAllocations.map(allocation => (
                        <div key={allocation.roomId || Math.random()} className="allocation-card">
                          <div className="allocation-header">
                            <h3 className="allocation-title">{allocation.roomName || 'Unknown Room'}</h3>
                            <span>{allocation.building || 'Unknown Building'}</span>
                            {allocation.capacity && <span className="room-capacity">{allocation.capacity} seats</span>}
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
                              {Array.isArray(allocation.courses) && allocation.courses.length > 0 ? (
                                allocation.courses.map(course => (
                                  <tr key={course.id || Math.random()}>
                                    <td>{course.code || ''} - {course.name || ''}</td>
                                    <td>{course.instructor || 'Unassigned'}</td>
                                    <td>{Array.isArray(course.schedule) ? course.schedule.join(', ') : 'Not scheduled'}</td>
                                    <td>
                                      <Button 
                                        variant="outlined" 
                                        color="secondary"
                                        size="small"
                                        onClick={() => openUnassignDialog(course)}
                                      >
                                        Unassign
                                      </Button>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={4} style={{ textAlign: 'center', padding: '20px 0' }}>
                                    No courses assigned to this room
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      ))
                    ) : (
                      <div className="no-results">
                        <p>Error loading room allocations</p>
                      </div>
                    )
                  ) : (
                    <div className="no-results">
                      <p>No rooms defined in the system yet</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="course-allocation-panel">
              <div className="course-allocation-table-container">
                <table className="schedule-table courses-with-rooms-table">
                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Course Name</th>
                      <th>Instructor</th>
                      <th>Room Assignment</th>
                      <th>Building</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses
                      .filter(course => course.room)
                      .map(course => (
                        <tr key={course.id || Math.random()}>
                          <td>{course.code || ''}</td>
                          <td>{course.name || ''}</td>
                          <td>{course.instructor || 'Unassigned'}</td>
                          <td><strong>{course.room || ''}</strong></td>
                          <td>{course.building || ''}</td>
                          <td>
                            <Button 
                              variant="outlined" 
                              color="secondary"
                              size="small"
                              onClick={() => openUnassignDialog(course)}
                            >
                              Unassign
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Room Assignment Dialog */}
      <Dialog 
        open={assignDialogOpen} 
        onClose={closeAssignDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Assign Course to Room
        </DialogTitle>
        <DialogContent>
          {selectedCourse && (
            <>
              <div className="dialog-course-info">
                <h3>{selectedCourse.code} - {selectedCourse.name}</h3>
                <p>Instructor: {selectedCourse.instructor || 'Unassigned'}</p>
                {selectedCourse.expectedEnrollment && (
                  <p>Expected Enrollment: {selectedCourse.expectedEnrollment} students</p>
                )}
                {selectedCourse.requiresLab && (
                  <p><strong>Requires Lab</strong></p>
                )}
                {selectedCourse.requiredEquipment && selectedCourse.requiredEquipment.length > 0 && (
                  <p>
                    <strong>Required Equipment:</strong>{' '}
                    {selectedCourse.requiredEquipment.join(', ')}
                  </p>
                )}
              </div>
              
              <FormControl fullWidth style={{ marginTop: '20px' }}>
                <InputLabel id="room-select-label">Select Room</InputLabel>
                <Select
                  labelId="room-select-label"
                  id="room-select"
                  value={selectedRoomId}
                  label="Select Room"
                  onChange={handleRoomChange}
                  error={!!assignmentError}
                >
                  <MenuItem value="">
                    <em>Select a room</em>
                  </MenuItem>
                  {rooms.map(room => {
                    const suitability = isRoomSuitableForCourse(room, selectedCourse);
                    return (
                      <MenuItem 
                        key={room.id} 
                        value={room.id}
                        disabled={!suitability.suitable}
                      >
                        {room.name} ({room.building}) - {room.capacity} seats
                        {!suitability.suitable && (
                          <span style={{ color: 'red', marginLeft: '10px' }}>
                            Not suitable
                          </span>
                        )}
                      </MenuItem>
                    );
                  })}
                </Select>
                {assignmentError && <FormHelperText error>{assignmentError}</FormHelperText>}
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAssignDialog}>Cancel</Button>
          <Button 
            onClick={assignCourseToRoom} 
            variant="contained" 
            color="primary"
            disabled={!selectedRoomId}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Unassign Confirmation Dialog */}
      <Dialog
        open={unassignDialogOpen}
        onClose={closeUnassignDialog}
      >
        <DialogTitle>Unassign Course</DialogTitle>
        <DialogContent>
          {courseToUnassign && (
            <Alert severity="warning">
              Are you sure you want to unassign {courseToUnassign.code} - {courseToUnassign.name} from {courseToUnassign.room}?
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeUnassignDialog}>Cancel</Button>
          <Button 
            onClick={unassignCourse} 
            variant="contained" 
            color="secondary"
          >
            Unassign
          </Button>
        </DialogActions>
      </Dialog>
    </RoomAllocationErrorBoundary>
  );
};

export default RoomAllocation;
