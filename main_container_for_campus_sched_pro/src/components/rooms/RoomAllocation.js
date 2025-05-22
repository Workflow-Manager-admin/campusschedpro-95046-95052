import React, { useState, useMemo, useCallback } from 'react';
import { Alert, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Chip } from '@mui/material';
import { useSchedule } from '../../context/ScheduleContext';
import { isRoomSuitableForCourse, findSuitableRooms } from '../../utils/roomUtils';

const RoomAllocation = () => {
  const { 
    courses, 
    rooms, 
    allocations, 
    assignRoom,
    showNotification
  } = useSchedule();

  const [buildingFilter, setBuildingFilter] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Get unique buildings from rooms data - memoized
  const buildings = useMemo(() => {
    return ['all', ...new Set(rooms.map(r => r.building))];
  }, [rooms]);
  
  // Filter allocations by building - memoized
  const filteredAllocations = useMemo(() => {
    return allocations.filter(allocation => 
      buildingFilter === 'all' || allocation.building === buildingFilter
    );
  }, [allocations, buildingFilter]);

  // All courses that don't have room assignments - memoized
  const unassignedCourses = useMemo(() => {
    return courses.filter(course => !course.room);
  }, [courses]);
  
  // Filter unassigned courses by search query - memoized
  const filteredCourses = useMemo(() => {
    return unassignedCourses.filter(course => 
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      course.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [unassignedCourses, searchQuery]);

  // Handle course selection for room assignment
  const handleSelectCourse = useCallback((course) => {
    setSelectedCourse(course);
    setSelectedRoom(null);
  }, []);

  // Handle room selection
  const handleSelectRoom = useCallback((room) => {
    setSelectedRoom(room);
    
    if (selectedCourse) {
      // Check if room is suitable for selected course
      const suitabilityCheck = isRoomSuitableForCourse(room, selectedCourse);
      if (!suitabilityCheck.suitable) {
        showNotification(suitabilityCheck.message, 'warning');
      }
    }
  }, [selectedCourse, showNotification]);

  // Handle room assignment
  const handleAssignRoom = useCallback(() => {
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
    
    // Use context's assignRoom function
    assignRoom(selectedCourse.id, selectedRoom.id);
    
    // Reset selection
    setSelectedCourse(null);
    setSelectedRoom(null);
    setShowAssignDialog(false);
  }, [selectedCourse, selectedRoom, showNotification, assignRoom]);

  // Handle auto assign all unassigned courses
  const handleAutoAssign = useCallback(() => {
    let assignedCount = 0;
    let failedCount = 0;

    // Try to assign each unassigned course to a suitable room
    unassignedCourses.forEach(course => {
      // Find suitable rooms
      const suitableRooms = findSuitableRooms(rooms, course);
      if (suitableRooms.length === 0) {
        failedCount++;
        return;
      }

      // Assign to first suitable room
      const success = assignRoom(course.id, suitableRooms[0].id);
      if (success) {
        assignedCount++;
      } else {
        failedCount++;
      }
    });
    
    if (assignedCount > 0) {
      showNotification(`Auto-assigned ${assignedCount} courses to rooms`, 'success');
    }
    
    if (failedCount > 0) {
      showNotification(`Could not find suitable rooms for ${failedCount} courses`, 'warning');
    }
  }, [unassignedCourses, rooms, assignRoom, showNotification]);

  // Get suitable rooms for selected course
  const getSuitableRooms = useCallback(() => {
    if (!selectedCourse) return [];
    
    return rooms.filter(room => {
      const result = isRoomSuitableForCourse(room, selectedCourse);
      return result.suitable;
    });
  }, [selectedCourse, rooms]);

  return (
    <div className="room-allocation">
      <div className="room-header">
        <h2>Room Allocation</h2>
        <div>
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

      <div className="room-allocation-container">
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
                      <th></th>
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
                            className="btn-icon"
                            title="Unassign Room"
                            onClick={() => {
                              assignRoom(course.id, null);
                              showNotification(`Unassigned ${course.code} from room`, 'info');
                            }}
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
            
            {filteredAllocations.length === 0 && (
              <div className="no-results">
                <p>No rooms match your filter criteria</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Room Assignment Dialog */}
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
                <div className="room-options">
                  {getSuitableRooms().map(room => (
                    <Chip
                      key={room.id}
                      label={`${room.name} (${room.capacity} capacity)`}
                      onClick={() => handleSelectRoom(room)}
                      color="primary"
                      variant={selectedRoom?.id === room.id ? "filled" : "outlined"}
                      style={{ margin: '5px' }}
                    />
                  ))}
                </div>
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
                unassignedCourses.map(course => (
                  <Chip
                    key={course.id}
                    label={`${course.code} - ${course.name}`}
                    onClick={() => handleSelectCourse(course)}
                    color="primary"
                    variant={selectedCourse?.id === course.id ? "filled" : "outlined"}
                    style={{ margin: '5px' }}
                  />
                ))
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
  );
};

export default RoomAllocation;
