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
// Removed unused import: import PropTypes from 'prop-types';

const RoomAllocation = () => {
  const { 
    courses, 
    rooms, 
    allocations = [], // Provide empty array default if allocations is undefined
    assignRoom,
    showNotification,
    updateAllocations
  } = useSchedule();

  // Only update allocations once when component mounts or when explicitly needed
  const [dataInitialized, setDataInitialized] = useState(false);

  // Only update allocations once when component mounts
  useEffect(() => {
    if (!dataInitialized) {
      // Fetch data only once on initial mount
      updateAllocations();
      setDataInitialized(true);
    }
  }, [dataInitialized]); // Remove updateAllocations from dependencies
  
  // Track significant changes to update view without full API refetch
  useEffect(() => {
    // If we're already initialized but courses or allocations have meaningful changes
    // (like when course assignments happen elsewhere in the app)
    if (dataInitialized && courses.length > 0 && rooms.length > 0) {
      // Don't call updateAllocations as that could trigger API fetches
      // Instead, let the context subscriptions handle it
    }
  }, [courses, rooms, dataInitialized]);

  const [buildingFilter, setBuildingFilter] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('room'); // 'room' or 'course' view mode
  const [courseSearchQuery, setCourseSearchQuery] = useState('');

  // Get unique buildings from rooms data - memoized
  const buildings = useMemo(() => {
    return ['all', ...new Set(rooms.map(r => r.building))];
  }, [rooms]);
  
  // Filter allocations by building - memoized
  const filteredAllocations = useMemo(() => {
    // Defensive check to ensure allocations is an array before filtering
    if (!Array.isArray(allocations)) {
      return [];
    }
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
  const handleAssignRoom = useCallback(async () => {
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
    await assignRoom(selectedCourse.id, selectedRoom.id);
    
    // Reset selection
    setSelectedCourse(null);
    setSelectedRoom(null);
    setShowAssignDialog(false);
  }, [selectedCourse, selectedRoom, showNotification, assignRoom]);

  // Handle auto assign all unassigned courses
  const handleAutoAssign = useCallback(async () => {
    let assignedCount = 0;
    let failedCount = 0;
    let assignmentPromises = [];

    // Prepare all assignments in parallel to reduce repeated API calls
    unassignedCourses.forEach(course => {
      // Find suitable rooms
      const suitableRooms = findSuitableRooms(rooms, course);
      if (suitableRooms.length === 0) {
        failedCount++;
        return;
      }

      // Queue the assignment (will be executed later)
      assignmentPromises.push({
        course,
        roomId: suitableRooms[0].id
      });
    });

    // Show notification for in-progress assignments
    if (assignmentPromises.length > 0) {
      showNotification(`Assigning ${assignmentPromises.length} courses to rooms...`, 'info');
    }

    // Process assignments in smaller batches to avoid overwhelming the API
    const batchSize = 5;
    const successResults = [];
    const failureResults = [];
    
    for (let i = 0; i < assignmentPromises.length; i += batchSize) {
      const batch = assignmentPromises.slice(i, i + batchSize);
      
      // Execute this batch in parallel
      const results = await Promise.all(
        batch.map(({ course, roomId }) => 
          assignRoom(course.id, roomId)
            .then(success => ({ success, course }))
            .catch(() => ({ success: false, course }))
        )
      );
      
      // Sort results
      results.forEach(result => {
        if (result.success) {
          successResults.push(result.course);
        } else {
          failureResults.push(result.course);
        }
      });
    }
    
    // Update counts outside the loop
    assignedCount = successResults.length;
    failedCount = failureResults.length;
    
    // Show final results
    if (assignedCount > 0) {
      showNotification(`Auto-assigned ${assignedCount} courses to rooms`, 'success');
    }
    
    if (failedCount > 0) {
      showNotification(`Could not find suitable rooms for ${failedCount} courses`, 'warning');
    }
    
    // Only update allocations once after all changes
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

  return (
    <RoomAllocationErrorBoundary>
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
              {Array.isArray(filteredAllocations) && filteredAllocations.map(allocation => {
                // Skip rendering if allocation is null or missing required properties
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
                      {Array.isArray(allocation.courses) && allocation.courses.map(course => {
                        // Skip rendering if course is null
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
                                e.stopPropagation(); // Prevent event bubbling
                                const success = await assignRoom(course.id, null);
                                if (success) {
                                  showNotification(`Unassigned ${course.code} from room`, 'info');
                                  // The loadInitialData in ScheduleContext will handle updating allocations
                                }
                              }}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                        );
              })}
                      {(!Array.isArray(allocation.courses) || allocation.courses.length === 0) && (
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
              
              {(!Array.isArray(filteredAllocations) || filteredAllocations.length === 0) && (
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
/**
 * Room allocation component for managing course room assignments
 * PUBLIC_INTERFACE
 */
RoomAllocation.propTypes = {
  // This component is self-contained and uses context,
  // so it does not accept any props
};

RoomAllocation.defaultProps = {};

export default RoomAllocation;
