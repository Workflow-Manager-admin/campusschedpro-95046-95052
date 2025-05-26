import React, { useState, useEffect } from 'react';
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
  
  // State for unassignment confirmation
  const [unassignDialogOpen, setUnassignDialogOpen] = useState(false);
  const [courseToUnassign, setCourseToUnassign] = useState(null);
  
  // Get data from context
  const { 
    allocations = [], 
    courses = [], 
    rooms = [],
    updateAllocations,
    updateCourse,
    showNotification
  } = useSchedule() || {};
  
  // Initialize data on mount
  useEffect(() => {
    if (updateAllocations) {
      updateAllocations();
    }
  }, [updateAllocations]);
  
  // Filter unassigned courses by search query
  const unassignedCourses = courses.filter(course => !course.room);
  const filteredCourses = unassignedCourses.filter(course => 
    !searchQuery || 
    (course.name && course.name.toLowerCase().includes(searchQuery.toLowerCase())) || 
    (course.code && course.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
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
    if (!selectedCourse || !selectedRoomId) {
      setAssignmentError('Please select a room');
      return;
    }
    
    try {
      // Find the selected room
      const room = rooms.find(r => r.id === selectedRoomId);
      if (!room) {
        setAssignmentError('Room not found');
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
        building: room.building
      };
      
      const success = await updateCourse(updatedCourse);
      
      if (success) {
        showNotification(`${selectedCourse.code} has been assigned to ${room.name}`, 'success');
        updateAllocations();
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
  
  const unassignCourse = async () => {
    if (!courseToUnassign) return;
    
    try {
      // Update the course to remove room assignment
      const updatedCourse = {
        ...courseToUnassign,
        room: null,
        roomId: null,
        building: null
      };
      
      const success = await updateCourse(updatedCourse);
      
      if (success) {
        showNotification(`${courseToUnassign.code} has been unassigned from room`, 'success');
        updateAllocations();
        closeUnassignDialog();
      } else {
        showNotification('Failed to unassign course', 'error');
      }
    } catch (error) {
      showNotification(`Error: ${error.message || 'Unknown error'}`, 'error');
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
                  {Array.isArray(allocations) && allocations.length > 0 ? (
                    allocations.map(allocation => (
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
                            </tr>
                          </thead>
                          <tbody>
                            {Array.isArray(allocation.courses) && allocation.courses.length > 0 ? (
                              allocation.courses.map(course => (
                                <tr key={course.id || Math.random()}>
                                  <td>{course.code || ''} - {course.name || ''}</td>
                                  <td>{course.instructor || 'Unassigned'}</td>
                                  <td>{Array.isArray(course.schedule) ? course.schedule.join(', ') : 'Not scheduled'}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={3} style={{ textAlign: 'center', padding: '20px 0' }}>
                                  No courses assigned
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    ))
                  ) : (
                    <div className="no-results">
                      <p>No rooms available in the system</p>
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
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </RoomAllocationErrorBoundary>
  );
};

export default RoomAllocation;
