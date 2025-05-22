import React, { useState } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { Alert, Snackbar } from '@mui/material';
import Timetable from './Timetable';
import Course from './Course';
import { validateCourseMove, findScheduleConflicts } from '../utils/scheduleUtils';

const SAMPLE_COURSES = [
  {
    id: 'course-1',
    name: 'Introduction to Computer Science',
    code: 'CS101',
    credits: 3,
    instructor: 'Dr. Smith',
    room: 'Room 101'
  },
  {
    id: 'course-2',
    name: 'Data Structures',
    code: 'CS201',
    credits: 4,
    instructor: 'Dr. Johnson',
    room: 'Room 102'
  },
  {
    id: 'course-3',
    name: 'Database Systems',
    code: 'CS301',
    credits: 3,
    instructor: 'Dr. Davis',
    room: 'Room 103'
  }
];

const CourseScheduling = () => {
  const [courses, setCourses] = useState(SAMPLE_COURSES);
  const [schedule, setSchedule] = useState({});
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  const handleScheduleChange = (newSchedule) => {
    const conflicts = findScheduleConflicts(newSchedule);
    if (conflicts.length > 0) {
      setNotification({
        open: true,
        message: `Warning: Found ${conflicts.length} scheduling conflicts`,
        severity: 'warning'
      });
    }
    setSchedule(newSchedule);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    const course = courses.find(c => c.id === draggableId);

    // Validate the move
    const validation = validateCourseMove(schedule, destination.droppableId, course);
    if (!validation.valid) {
      setNotification({
        open: true,
        message: validation.message,
        severity: 'error'
      });
      return;
    }

    // Handle move from course list to timetable
    if (source.droppableId === 'courses-list') {
      const newSchedule = { ...schedule };
      if (!newSchedule[destination.droppableId]) {
        newSchedule[destination.droppableId] = [];
      }
      newSchedule[destination.droppableId].push(course);
      handleScheduleChange(newSchedule);
    }
    // Handle move between timetable slots
    else {
      const newSchedule = { ...schedule };
      // Remove from source
      newSchedule[source.droppableId] = newSchedule[source.droppableId].filter(
        c => c.id !== draggableId
      );
      // Add to destination
      if (!newSchedule[destination.droppableId]) {
        newSchedule[destination.droppableId] = [];
      }
      newSchedule[destination.droppableId].push(course);
      handleScheduleChange(newSchedule);
    }
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <div className="course-scheduling">
      <div className="scheduling-header">
        <h2>Course Scheduling</h2>
        <button className="btn btn-accent">Save Schedule</button>
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
                    <Course key={course.id} course={course} index={index} />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
          
          <div className="timetable-panel">
            <Timetable
              courses={courses}
              schedule={schedule}
              onCourseMove={handleScheduleChange}
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
