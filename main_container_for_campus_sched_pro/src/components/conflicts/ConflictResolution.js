import React, { useState } from 'react';
import { Alert, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Chip } from '@mui/material';
import { useSchedule } from '../../context/ScheduleContext';
import { suggestAlternativeTimeSlots, formatSlotId } from '../../utils/scheduleUtils';

const ConflictResolution = () => {
  const { 
    conflicts, 
    schedule, 
    setSchedule, 
    notification, 
    showNotification, 
    handleCloseNotification
  } = useSchedule();

  const [selectedConflict, setSelectedConflict] = useState(null);
  const [courseToMove, setCourseToMove] = useState(null);
  const [showResolutionDialog, setShowResolutionDialog] = useState(false);
  const [suggestedSlots, setSuggestedSlots] = useState([]);

  // Group conflicts by type for better organization
  const instructorConflicts = conflicts.filter(c => c.type === 'instructor');
  const roomConflicts = conflicts.filter(c => c.type === 'room');

  const handleResolveClick = (conflict) => {
    setSelectedConflict(conflict);
    setSuggestedSlots([]);
    setShowResolutionDialog(true);
  };

  const handleSelectCourseToMove = (course) => {
    setCourseToMove(course);
    
    // Generate suggested alternative slots
    const alternatives = suggestAlternativeTimeSlots(schedule, course, selectedConflict.slotId);
    setSuggestedSlots(alternatives);
  };

  const handleMoveToSlot = (newSlotId) => {
    const updatedSchedule = { ...schedule };
    
    // Remove course from conflict slot
    updatedSchedule[selectedConflict.slotId] = updatedSchedule[selectedConflict.slotId]
      .filter(c => c.id !== courseToMove.id);
    
    // Add to new slot
    if (!updatedSchedule[newSlotId]) {
      updatedSchedule[newSlotId] = [];
    }
    updatedSchedule[newSlotId].push(courseToMove);
    
    // Update schedule
    setSchedule(updatedSchedule);
    
    // Close dialog
    setShowResolutionDialog(false);
    setSelectedConflict(null);
    setCourseToMove(null);
    
    // Show success notification
    showNotification(`Successfully moved ${courseToMove.code} to ${newSlotId}`, 'success');
  };

  const handleResolveAll = () => {
    if (conflicts.length === 0) {
      showNotification('No conflicts to resolve', 'info');
      return;
    }
    
    let conflictsResolved = 0;
    const updatedSchedule = { ...schedule };
    
    // Try to resolve each conflict
    for (const conflict of conflicts) {
      const course = conflict.courses[1]; // Choose second course to move
      const alternatives = suggestAlternativeTimeSlots(updatedSchedule, course, conflict.slotId);
      
      if (alternatives.length > 0) {
        // Remove course from conflict slot
        updatedSchedule[conflict.slotId] = updatedSchedule[conflict.slotId]
          .filter(c => c.id !== course.id);
        
        // Add to first alternative slot
        const newSlotId = alternatives[0];
        if (!updatedSchedule[newSlotId]) {
          updatedSchedule[newSlotId] = [];
        }
        updatedSchedule[newSlotId].push(course);
        conflictsResolved++;
      }
    }
    
    if (conflictsResolved > 0) {
      setSchedule(updatedSchedule);
      showNotification(`Successfully resolved ${conflictsResolved} conflicts`, 'success');
    } else {
      showNotification('Could not automatically resolve conflicts. Please resolve manually.', 'warning');
    }
  };

  return (
    <div className="conflict-resolution">
      <div className="conflict-header">
        <h2>Schedule Conflicts</h2>
        <button 
          className="btn btn-accent"
          onClick={handleResolveAll}
        >
          Resolve All
        </button>
      </div>

      <div className="conflict-container">
        {conflicts.length === 0 ? (
          <div className="no-conflicts">
            <div className="success-icon">✓</div>
            <h3>No Conflicts Detected</h3>
            <p>Your schedule is conflict-free!</p>
          </div>
        ) : (
          <>
            <div className="conflict-summary">
              <Alert severity="warning">
                Found {conflicts.length} scheduling conflicts that need resolution
              </Alert>
            </div>

            <div className="conflict-section">
              <h3>Instructor Conflicts</h3>
              {instructorConflicts.length === 0 ? (
                <p>No instructor conflicts detected</p>
              ) : (
                <div className="conflict-list">
                  {instructorConflicts.map((conflict) => (
                    <div key={conflict.id} className="conflict-card">
                      <div className="conflict-info">
                        <div className="conflict-type instructor">
                          <span>Instructor</span>
                        </div>
                        <div className="conflict-details">
                          <h4>Instructor Double-Booked</h4>
                          <p>{conflict.message}</p>
                          <div className="conflicting-courses">
                            {conflict.courses.map(course => (
                              <div key={course.id} className="conflict-course">
                                <strong>{course.code}</strong> - {course.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <button 
                        className="btn" 
                        onClick={() => handleResolveClick(conflict)}
                      >
                        Resolve
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="conflict-section">
              <h3>Room Conflicts</h3>
              {roomConflicts.length === 0 ? (
                <p>No room conflicts detected</p>
              ) : (
                <div className="conflict-list">
                  {roomConflicts.map((conflict) => (
                    <div key={conflict.id} className="conflict-card">
                      <div className="conflict-info">
                        <div className="conflict-type room">
                          <span>Room</span>
                        </div>
                        <div className="conflict-details">
                          <h4>Room Double-Booked</h4>
                          <p>{conflict.message}</p>
                          <div className="conflicting-courses">
                            {conflict.courses.map(course => (
                              <div key={course.id} className="conflict-course">
                                <strong>{course.code}</strong> - {course.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <button 
                        className="btn" 
                        onClick={() => handleResolveClick(conflict)}
                      >
                        Resolve
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Conflict Resolution Dialog */}
      <Dialog 
        open={showResolutionDialog} 
        onClose={() => setShowResolutionDialog(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Resolve Schedule Conflict
        </DialogTitle>
        <DialogContent>
          {selectedConflict && (
            <>
              <Alert severity="warning" style={{ marginBottom: '20px' }}>
                {selectedConflict.message}
              </Alert>
              
              <Typography variant="h6" gutterBottom>
                Select which course to move:
              </Typography>
              
              <div className="course-selection">
                {selectedConflict.courses.map(course => (
                  <div 
                    key={course.id}
                    className={`course-option ${courseToMove?.id === course.id ? 'selected' : ''}`}
                    onClick={() => handleSelectCourseToMove(course)}
                  >
                    <h4>{course.code} - {course.name}</h4>
                    <p>Instructor: {course.instructor}</p>
                    <p>Room: {course.room || 'Not assigned'}</p>
                  </div>
                ))}
              </div>
              
              {courseToMove && (
                <>
                  <Typography variant="h6" gutterBottom style={{ marginTop: '20px' }}>
                    Select a new time slot:
                  </Typography>
                  
                  {suggestedSlots.length === 0 ? (
                    <Alert severity="error">
                      No available time slots found. Try selecting a different course to move.
                    </Alert>
                  ) : (
                    <div className="slot-suggestions">
                      {suggestedSlots.map(slotId => {
                        const { day, time } = formatSlotId(slotId);
                        return (
                          <Chip
                            key={slotId}
                            label={`${day} at ${time}`}
                            onClick={() => handleMoveToSlot(slotId)}
                            clickable
                            color="primary"
                            variant="outlined"
                            style={{ margin: '5px' }}
                          />
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResolutionDialog(false)} color="primary">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
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
