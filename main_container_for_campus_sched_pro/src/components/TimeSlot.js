import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip, Paper, IconButton, CircularProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ReduxDroppable from './ReduxDroppable';
import { useSchedule } from '../context/ScheduleContext';

const TimeSlot = ({ day, time, courses, removeCourseFromSlot }) => {
  const slotId = `${day}-${time}`;
  const { actionLoadingState } = useSchedule() || {};

  // Ensure courses is always an array for safety
  const safeCourses = Array.isArray(courses) ? courses : [];
  
  const getSlotColor = () => {
    if (!safeCourses.length) return 'var(--background-light)';
    if (safeCourses.length > 1) return 'rgba(255, 87, 34, 0.1)'; // Conflict color
    return 'rgba(46, 125, 50, 0.1)'; // Occupied color
  };

  const handleRemoveCourse = (course, index, event) => {
    event.stopPropagation();
    if (!removeCourseFromSlot) {
      console.warn("No removeCourseFromSlot function provided to TimeSlot component");
      return;
    }
    try {
      const [day, time] = slotId.split('-');
      if (course && course.id) {
        removeCourseFromSlot(course.id, day, time).catch(error => {
          console.error("Error removing course:", error);
        });
      } else {
        console.error("Cannot remove course: Invalid course object or missing ID");
      }
    } catch (error) {
      console.error("Error removing course:", error);
    }
  };

  return (
    <ReduxDroppable 
      droppableId={slotId}
      className="time-slot"
      style={{ backgroundColor: getSlotColor(), position: 'relative' }}
    >
      {(provided, snapshot) => (
        <>
          {safeCourses.map((course, index) => {
            const isCourseLoading = actionLoadingState && actionLoadingState.courseId === course.id;
            return (
              <Tooltip
                key={`${course.id}-${index}`}
                title={`${course.code} - ${course.instructor} (${course.room || 'No room assigned'})`}
                placement="top"
                arrow
              >
                <Paper 
                  className="course-item"
                  elevation={1}
                  style={{ position: 'relative' }}
                >
                  {isCourseLoading && (
                    <div className="course-card-spinner" style={{ top: 8, right: 8 }}>
                      <CircularProgress size={20}/>
                    </div>
                  )}
                  <div className="course-item-header">
                    <span className="course-code">{course.code}</span>
                    <span className="course-credits">{course.credits} cr</span>
                    <IconButton 
                      className="remove-course-btn"
                      size="small"
                      onClick={(e) => handleRemoveCourse(course, index, e)}
                      aria-label="Remove course"
                      title="Remove this course instance from schedule"
                      disabled={isCourseLoading}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </div>
                  <div className="course-name">{course.name}</div>
                  <div className="course-details">
                    <span><strong>Instructor:</strong> {course.instructor}</span>
                    <span><strong>Room:</strong> {course.room || 'TBA'}</span>
                  </div>
                </Paper>
              </Tooltip>
            );
          })}
        </>
      )}
    </ReduxDroppable>
  );
};

TimeSlot.propTypes = {
  day: PropTypes.string.isRequired,
  time: PropTypes.string.isRequired,
  courses: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      code: PropTypes.string.isRequired,
      credits: PropTypes.number.isRequired,
      instructor: PropTypes.string.isRequired,
      room: PropTypes.string
    })
  ).isRequired,
  removeCourseFromSlot: PropTypes.func
};

export default TimeSlot;
