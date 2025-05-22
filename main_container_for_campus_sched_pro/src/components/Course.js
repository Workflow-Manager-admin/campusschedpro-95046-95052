import React from 'react';
import PropTypes from 'prop-types';
import { Draggable } from '@hello-pangea/dnd';

const Course = ({ course, index }) => {
  return (
    <Draggable draggableId={course.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`course-card ${snapshot.isDragging ? 'dragging' : ''}`}
        >
          <h3>{course.name}</h3>
          <div className="course-info">
            <span>{course.code}</span>
            <span>{course.credits} credits</span>
          </div>
          <div className="course-instructor">
            {course.instructor}
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default Course;
