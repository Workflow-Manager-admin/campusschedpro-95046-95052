import React from 'react';
import PropTypes from 'prop-types';
import { Droppable } from '@hello-pangea/dnd';

const TimeSlot = ({ day, time, courses }) => {
  const slotId = `${day}-${time}`;
  
  return (
    <Droppable droppableId={slotId}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`time-slot ${snapshot.isDraggingOver ? 'dragging-over' : ''} ${courses.length > 0 ? 'occupied' : ''}`}
        >
          {courses.map((course, index) => (
            <div key={course.id} className="course-item">
              {course.name}
              <div className="course-details">
                <span>{course.instructor}</span>
                <span>{course.room}</span>
              </div>
            </div>
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
      instructor: PropTypes.string.isRequired,
      room: PropTypes.string
    })
  ).isRequired
};

export default TimeSlot;
