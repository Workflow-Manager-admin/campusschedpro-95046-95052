import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip, Paper, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ReduxDroppable from './ReduxDroppable';

const TimeSlot = ({ day, time, courses, removeCourseFromSlot }) => {
  const slotId = `${day}-${time}`;
  
  const getSlotColor = () => {
    if (!courses.length) return 'var(--background-light)';
    if (courses.length > 1) return 'rgba(255, 87, 34, 0.1)'; // Conflict color
    return 'rgba(46, 125, 50, 0.1)'; // Occupied color
  };

  const handleRemoveCourse = (course, index, event) => {
    // Stop propagation to prevent drag event conflicts
    event.stopPropagation();
    
    if (removeCourseFromSlot) {
      removeCourseFromSlot(slotId, course, index);
    }
  };

  return (
    <ReduxDroppable 
      droppableId={slotId}
      className="time-slot"
      style={{ backgroundColor: getSlotColor() }}
    >
      {(provided, snapshot) => (
        <>
          {courses.map((course, index) => (
            <Tooltip
              key={course.id}
              title={`${course.code} - ${course.instructor} (${course.room || 'No room assigned'})`}
              placement="top"
              arrow
            >
              <Paper 
                className="course-item"
                elevation={1}
              >
                <div className="course-item-header">
                  <span className="course-code">{course.code}</span>
                  <span className="course-credits">{course.credits} cr</span>
                  <IconButton 
                    className="remove-course-btn"
                    size="small"
                    onClick={(e) => handleRemoveCourse(course, index, e)}
                    aria-label="Remove course"
                    title="Remove from schedule"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </div>
                <div className="course-name">{course.name}</div>
                <div className="course-details">
                  <span>{course.instructor}</span>
                  <span>{course.room || 'TBA'}</span>
                </div>
              </Paper>
            </Tooltip>
          ))}
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
