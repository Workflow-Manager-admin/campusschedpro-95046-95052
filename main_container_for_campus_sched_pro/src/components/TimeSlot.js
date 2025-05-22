import React from 'react';
import PropTypes from 'prop-types';
import { Droppable } from '@hello-pangea/dnd';
import { Tooltip, Paper } from '@mui/material';

const TimeSlot = ({ day, time, courses }) => {
  const slotId = `${day}-${time}`;
  
  const getSlotColor = () => {
    if (!courses.length) return 'var(--background-light)';
    if (courses.length > 1) return 'rgba(255, 87, 34, 0.1)'; // Conflict color
    return 'rgba(46, 125, 50, 0.1)'; // Occupied color
  };

  return (
    <Droppable droppableId={slotId}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`time-slot ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
          style={{ backgroundColor: getSlotColor() }}
        >
          {courses.map((course) => (
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
                </div>
                <div className="course-name">{course.name}</div>
                <div className="course-details">
                  <span>{course.instructor}</span>
                  <span>{course.room || 'TBA'}</span>
                </div>
              </Paper>
            </Tooltip>
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
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
  ).isRequired
};

export default TimeSlot;
