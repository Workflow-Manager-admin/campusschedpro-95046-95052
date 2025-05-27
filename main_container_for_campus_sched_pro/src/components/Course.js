import React, { memo, useState } from 'react';
import PropTypes from 'prop-types';
import { Draggable } from '@hello-pangea/dnd';
import { Paper, CircularProgress } from '@mui/material';
import { useSchedule } from '../context/ScheduleContext';

// PUBLIC_INTERFACE
const Course = memo(({ course, index, onEdit, onDelete, dragDisabled }) => {
  const [showControls, setShowControls] = useState(false);
  const { actionLoadingState } = useSchedule() || {};
  const isLoading = actionLoadingState && actionLoadingState.courseId === course.id;

  return (
    <Draggable draggableId={course.id} index={index} isDragDisabled={!!dragDisabled}>
      {(provided, snapshot) => (
        <Paper
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`course-card${snapshot.isDragging ? ' dragging' : ''}${dragDisabled ? ' course-card-disabled' : ''}`}
          elevation={snapshot.isDragging ? 3 : 1}
          style={{
            opacity: dragDisabled ? 0.55 : 1,
            pointerEvents: dragDisabled ? 'none' : undefined,
            ...provided.draggableProps.style
          }}
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
        >
          {/* Local loading spinner if this row is being updated/deleted */}
          {isLoading && (
            <div className="course-card-spinner">
              <CircularProgress size={24} />
            </div>
          )}
          {showControls && !snapshot.isDragging && !isLoading && !dragDisabled && (
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
    department: PropTypes.string,
    facultyId: PropTypes.any,
    roomId: PropTypes.any
  }).isRequired,
  index: PropTypes.number.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  dragDisabled: PropTypes.bool
};

export default Course;
