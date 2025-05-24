

import React, { memo, useState } from 'react';
import PropTypes from 'prop-types';
import { Draggable } from '@hello-pangea/dnd';
import { Paper } from '@mui/material';



const Course = memo(({ course, index, onEdit, onDelete }) => {
  const [showControls, setShowControls] = useState(false);
  return (
    <Draggable draggableId={course.id} index={index}>
      {(provided, snapshot) => (
        <Paper
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`course-card ${snapshot.isDragging ? 'dragging' : ''}`}
          elevation={snapshot.isDragging ? 3 : 1}
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
        >
          {showControls && !snapshot.isDragging && (
            <div className="course-actions">
              <button 
                className="edit-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onEdit) onEdit(course);
                }}
              >
                Edit
              </button>
              <button 
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onDelete) onDelete(course);
                }}
              >
                Delete
              </button>
            </div>
          )}
          <h3>{course.name}</h3>
          <div className="course-info">
            <span className="course-code">{course.code}</span>
            <span className="course-credits">{course.credits} credits</span>
          </div>
          <div className="course-instructor">
            <span>{course.instructor}</span>
            {course.room && (
              <span className="course-room">Room: {course.room}</span>
            )}
          </div>
          {course.academicYear && course.department && (
            <div className="course-year">
              <span className="year-badge">{course.academicYear}</span>
              <span className="department-text">{course.department}</span>
            </div>
          )}
        </Paper>
      )}
    </Draggable>
  );
});

Course.displayName = 'Course';

Course.propTypes = {
  course: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    code: PropTypes.string.isRequired,
    credits: PropTypes.number.isRequired,
    instructor: PropTypes.string.isRequired,
    room: PropTypes.string,
    expectedEnrollment: PropTypes.number,
    requiresLab: PropTypes.bool,
    requiredEquipment: PropTypes.arrayOf(PropTypes.string),
    academicYear: PropTypes.string,
    department: PropTypes.string
  }).isRequired,
  index: PropTypes.number.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func
};

export default Course;
