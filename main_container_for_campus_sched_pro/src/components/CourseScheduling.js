import React, { useCallback, useState } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { Alert, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Button, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Checkbox, 
  FormGroup, Typography } from '@mui/material';
import Timetable from './Timetable';
import Course from './Course';
import { validateCourseMove, findScheduleConflicts } from '../utils/scheduleUtils';
import { useSchedule } from '../context/ScheduleContext';

const CourseScheduling = () => {
  const { 
    courses,
    schedule, 
    setSchedule,
    notification,
    showNotification,
    handleCloseNotification
  } = useSchedule();

  const handleDragEnd = useCallback((result) => {
    const { source, destination, draggableId } = result;

    // Drop outside valid area
    if (!destination) return;

    const course = courses.find(c => c.id === draggableId);
    if (!course) return;

    try {
      // Moving from course list to timetable
      if (source.droppableId === 'courses-list') {
        const validation = validateCourseMove(schedule, destination.droppableId, course);
        if (!validation.valid) {
          showNotification(validation.message, 'error');
          return;
        }

        const newSchedule = { ...schedule };
        if (!newSchedule[destination.droppableId]) {
          newSchedule[destination.droppableId] = [];
        }
        newSchedule[destination.droppableId].push(course);

        const conflicts = findScheduleConflicts(newSchedule);
        if (conflicts.length > 0) {
          showNotification(`Warning: Found ${conflicts.length} scheduling conflicts`, 'warning');
        }

        setSchedule(newSchedule);
      }
      // Moving between timetable slots
      else {
        const validation = validateCourseMove(schedule, destination.droppableId, course);
        if (!validation.valid) {
          showNotification(validation.message, 'error');
          return;
        }

        const newSchedule = { ...schedule };
        
        // Remove from source
        newSchedule[source.droppableId] = newSchedule[source.droppableId]
          .filter(c => c.id !== draggableId);
        
        // Add to destination
        if (!newSchedule[destination.droppableId]) {
          newSchedule[destination.droppableId] = [];
        }
        newSchedule[destination.droppableId].push(course);

        const conflicts = findScheduleConflicts(newSchedule);
        if (conflicts.length > 0) {
          showNotification(`Warning: Found ${conflicts.length} scheduling conflicts`, 'warning');
        }

        setSchedule(newSchedule);
      }
    } catch (error) {
      // Use a more friendly error handling approach
      showNotification(`Error during drag operation: ${error.message}`, 'error');
    }
  }, [schedule, courses, setSchedule, showNotification]);

  const handleSaveSchedule = useCallback(() => {
    const conflicts = findScheduleConflicts(schedule);
    if (conflicts.length > 0) {
      showNotification('Cannot save schedule with conflicts. Please resolve them first.', 'error');
      return;
    }
    
    // Check for courses without room assignments
    const unassignedCourses = Object.values(schedule).flat().filter(course => !course.room);
    if (unassignedCourses.length > 0) {
      showNotification(`Warning: ${unassignedCourses.length} courses don't have room assignments`, 'warning');
    }
    
    // Here we would typically save to backend
    showNotification('Schedule saved successfully!', 'success');
  }, [schedule, showNotification]);

  return (
    <div className="course-scheduling">
      <div className="scheduling-header">
        <h2>Course Scheduling</h2>
        <div className="header-actions">
          <button 
            className="btn"
            onClick={() => window.location.href = '/conflicts'}
          >
            View Conflicts
          </button>
          <button 
            className="btn btn-accent"
            onClick={handleSaveSchedule}
            style={{ marginLeft: '10px' }}
          >
            Save Schedule
          </button>
        </div>
      </div>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="scheduling-container">
          <div className="courses-panel">
            <div className="panel-header">
              <h3>Available Courses</h3>
              <button className="btn">Add Course</button>
            </div>
            <Droppable droppableId="courses-list">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="courses-list"
                >
                  {courses.map((course, index) => (
                    <Course 
                      key={course.id} 
                      course={course} 
                      index={index}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
          
          <div className="timetable-panel">
            <Timetable
              schedule={schedule}
              onCourseMove={setSchedule}
            />
          </div>
        </div>
      </DragDropContext>

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

export default CourseScheduling;
